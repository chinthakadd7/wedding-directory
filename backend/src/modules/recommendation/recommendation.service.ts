import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { ServiceEntity } from 'src/database/entities/service.entity';
import { PackageEntity } from 'src/database/entities/package.entity';
import { ReviewEntity } from 'src/database/entities/review.entity';
import { Repository } from 'typeorm';
import { RecommendationRequestDto } from './dto/recommendation-request.dto';

type RankedVendor = {
  serviceId: string;
  serviceName: string;
  serviceSlug?: string;
  serviceBanner?: string | null;
  category: string;
  vendorName: string;
  city: string;
  location: string;
  rating: number;
  minPackagePrice: number | null;
  packageId?: string | null;
  packageName?: string;
  packagePrice?: number | null;
  packageDescription?: string;
  packageImage?: string | null;
  packageFeatures?: string[];
  requiresReservation?: boolean;
  requiresApproval?: boolean;
  deterministicScore: number;
  reason: string;
  aiReview?: string;
};

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async recommendForVisitor(input: RecommendationRequestDto) {
    const normalized = this.normalizeInput(input);
    this.logger.debug('Recommendation request payload received', {
      raw: input,
      normalized,
    });

    const services = await this.findCandidateServices(normalized);
    const aiEnabled = Boolean(this.configService.get<string>('GROQ_API_KEY'));
    const useAi = aiEnabled;

    if (services.length === 0) {
      return {
        source: 'rules',
        ai: {
          enabled: aiEnabled,
          used: false,
          reason: 'no_candidates',
        },
        recommendations: [],
      };
    }

    const ratingMap = await this.getAverageRatings(
      services.map((service) => service.id),
    );

    const deterministicRanked = services
      .map((service) =>
        this.toRankedVendor(service, ratingMap.get(service.id) || 0, normalized),
      )
      .filter((item): item is RankedVendor => item !== null)
      .filter((item) => {
        // Enforce strictly that if user set a budget, only packages whose full price <= per-category budget are kept
        if (!normalized.perCategoryBudget || normalized.perCategoryBudget <= 0) return true;
        const price = Number(item.packagePrice);
        return Number.isFinite(price) && price > 0 && price <= normalized.perCategoryBudget;
      })
      .sort((left, right) => right.deterministicScore - left.deterministicScore)
      .slice(0, Math.min(12, Math.max(normalized.limit, normalized.limit + 2)));

    const aiResult = useAi ? await this.rankWithGroq(deterministicRanked, normalized) : { ranked: null, reason: 'ai_disabled' };
    const aiRanked = useAi ? aiResult.ranked : null;
    const allowedServiceIds = new Set(
      deterministicRanked.map((item) => item.serviceId),
    );
    const aiSafePool = (aiRanked || deterministicRanked).filter((item) =>
      allowedServiceIds.has(item.serviceId),
    );
    const finalList = this.enforceFinalCandidateFilters(
      aiSafePool,
      normalized,
    ).slice(0, normalized.limit);

    return {
      source: aiRanked ? 'ai' : 'rules',
      ai: {
        enabled: aiEnabled,
        used: Boolean(aiRanked),
        reason: aiRanked ? 'success' : aiResult.reason,
      },
      recommendations: finalList,
    };
  }

  private normalizeInput(input: RecommendationRequestDto) {
    const categories = (input.categories || [])
      .map((val) => val.trim().toLowerCase())
      .filter(Boolean);

    const totalBudget = Number(input.budget) > 0 ? Number(input.budget) : null;

    // Budget is the TOTAL the user wants to spend across ALL selected services.
    // Divide by the number of selected categories to get per-category budget.
    // If no categories are selected, treat the full budget as per-category.
    const categoryCount = categories.length > 0 ? categories.length : 1;
    const perCategoryBudget = totalBudget ? Math.round(totalBudget / categoryCount) : null;

    return {
      location: input.location?.trim().toLowerCase() || '',
      totalBudget,
      perCategoryBudget,
      categories,
      categoryCount,
      limit:
        Number(input.limit) > 0
          ? Math.min(Number(input.limit), 12)
          : 6,
    };
  }

  private async findCandidateServices(input: {
    location: string;
    categories: string[];
    perCategoryBudget: number | null;
  }) {
    const query = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.vendor', 'vendor')
      .leftJoinAndSelect('service.packages', 'pkg')
      .leftJoinAndSelect('pkg.packageFeatures', 'pkgFeature')
      .where('service.visible = :visible', { visible: true });

    const services = await query.getMany();

    const servicesAfterLocationFilter = input.location
      ? services.filter((service) => this.matchesLocation(service, input.location))
      : services;

    const servicesAfterCategoryFilter =
      input.categories.length > 0
        ? servicesAfterLocationFilter.filter((service) =>
            this.matchesCategoryPreference(service.category || '', input.categories),
          )
        : servicesAfterLocationFilter;

    if (!input.perCategoryBudget) {
      return servicesAfterCategoryFilter;
    }

    return servicesAfterCategoryFilter.filter((service) => {
      const visiblePackages = (service.packages || []).filter((pkg) => pkg.visible !== false);
      if (visiblePackages.length === 0) return false;

      return visiblePackages.some((pkg) => {
        const price = Number(pkg.pricing);
        return Number.isFinite(price) && price > 0 && price <= input.perCategoryBudget!;
      });
    });
  }

  private async getAverageRatings(serviceIds: string[]) {
    if (serviceIds.length === 0) {
      return new Map<string, number>();
    }

    const rows = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.service_id', 'serviceId')
      .addSelect('AVG(review.rating)', 'avgRating')
      .where('review.service_id IN (:...serviceIds)', { serviceIds })
      .groupBy('review.service_id')
      .getRawMany<{ serviceId: string; avgRating: string }>();

    const ratingMap = new Map<string, number>();
    for (const row of rows) {
      ratingMap.set(row.serviceId, Number(row.avgRating));
    }

    return ratingMap;
  }

  private findMostRelevantPackage(
    packages: PackageEntity[],
    budget: number | null,
  ): PackageEntity | null {
    const visiblePackages = (packages || []).filter((pkg) => pkg.visible !== false);
    if (visiblePackages.length === 0) {
      return null;
    }

    if (budget && budget > 0) {
      // Strictly consider only packages whose full price is within the user's total budget
      const withinBudget = visiblePackages.filter((pkg) => {
        const p = Number(pkg.pricing);
        return Number.isFinite(p) && p > 0 && p <= budget;
      });

      if (withinBudget.length > 0) {
        withinBudget.sort((a, b) => Number(b.pricing) - Number(a.pricing));
        return withinBudget[0];
      }

      // If no package is within budget, return null so this service is not recommended
      return null;
    }

    const sorted = [...visiblePackages].sort(
      (a, b) => Number(a.pricing) - Number(b.pricing),
    );
    return sorted[0];
  }


  private toRankedVendor(
    service: ServiceEntity,
    rating: number,
    input: { location: string; perCategoryBudget: number | null; categories: string[] },
  ): RankedVendor | null {
    const lowerCategory = (service.category || '').toLowerCase();
    const city = this.getServiceCity(service);

    // When categories are selected, strictly exclude services that don't match
    if (input.categories.length > 0 && !this.matchesCategoryPreference(lowerCategory, input.categories)) {
      return null;
    }

    // Keep the selected location strict so services outside the chosen city are never recommended.
    if (input.location && !this.matchesLocation(service, input.location)) {
      return null;
    }

    const relevantPackage = this.findMostRelevantPackage(
      service.packages || [],
      input.perCategoryBudget,
    );

    // If user specified a budget and this service has no package within the per-category budget, exclude it
    if (input.perCategoryBudget && !relevantPackage) {
      return null;
    }

    const minPackagePrice = this.getMinVisiblePackagePrice(service.packages || []);
    const targetPrice = relevantPackage ? Number(relevantPackage.pricing) : minPackagePrice;
    const location = city;

    let score = 0;
    const reasons: string[] = [];

    if (input.categories.length === 0 || this.matchesCategoryPreference(lowerCategory, input.categories)) {
      score += 35;
      reasons.push(`matches ${service.category} category`);
    }

    const cityMatch = input.location && city.toLowerCase().includes(input.location);
    const locationMatch =
      input.location && !cityMatch && location.toLowerCase().includes(input.location);

    if (cityMatch) {
      score += 25;
      reasons.push(`located in ${city}`);
    } else if (locationMatch) {
      score += 12;
      reasons.push('close to preferred location');
    }

    if (input.perCategoryBudget && targetPrice !== null) {
      const budgetDiff = Math.abs(targetPrice - input.perCategoryBudget) / input.perCategoryBudget;
      score += Math.max(0, 25 - budgetDiff * 25);

      if (targetPrice <= input.perCategoryBudget) {
        score += 5;
        if (relevantPackage) {
          reasons.push(`"${relevantPackage.name}" fits budget (LKR ${Math.round(targetPrice).toLocaleString()})`);
        } else {
          reasons.push('within your budget');
        }
      }
    }

    if (rating > 0) {
      score += Math.min(20, rating * 4);
      reasons.push(`${rating.toFixed(1)}★ average rating`);
    }


    const features = (relevantPackage?.packageFeatures || [])
      .map((f) => f.text)
      .filter(Boolean)
      .slice(0, 4);

    return {
      serviceId: service.id,
      serviceName: service.name,
      serviceSlug: service.slug || service.id,
      serviceBanner: service.banner || null,
      category: service.category,
      vendorName: service.vendor?.busname || 'Unknown Vendor',
      city,
      location,
      rating: Number(rating.toFixed(2)),
      minPackagePrice,
      packageId: relevantPackage?.id || null,
      packageName: relevantPackage?.name || 'Standard Package',
      packagePrice: targetPrice,
      packageDescription: relevantPackage?.description || service.description || '',
      packageImage: relevantPackage?.image || service.banner || null,
      packageFeatures: features,
      requiresReservation: relevantPackage?.requiresReservation || false,
      requiresApproval: relevantPackage?.requiresApproval || false,
      deterministicScore: Number(score.toFixed(2)),
      reason: reasons.slice(0, 3).join(', ') || 'recommended by availability and profile quality',
    };
  }


  private getServiceCity(service: Partial<ServiceEntity>) {
    return (service.city || service.vendor?.city || '').trim();
  }

  private matchesLocation(service: Partial<ServiceEntity>, inputLocation: string) {
    const cityName = (service.city || service.vendor?.city || '').trim().toLowerCase();
    const locationName = (service.location || '').trim().toLowerCase();
    const normalizedLocation = inputLocation.trim().toLowerCase();

    if (!normalizedLocation) {
      return true;
    }

    const cityMatches = cityName && (
      cityName === normalizedLocation ||
      cityName.includes(normalizedLocation) ||
      normalizedLocation.includes(cityName)
    );

    const locationMatches = locationName && (
      locationName === normalizedLocation ||
      locationName.includes(normalizedLocation) ||
      normalizedLocation.includes(locationName)
    );

    return Boolean(cityMatches || locationMatches);
  }

  private enforceFinalCandidateFilters(
    candidates: RankedVendor[],
    input: {
      location: string;
      perCategoryBudget: number | null;
      categories: string[];
    },
  ) {
    return candidates.filter((item) => {
      if (input.location) {
        const cityValue = (item.city || '').trim().toLowerCase();
        const locationValue = (item.location || '').trim().toLowerCase();
        const normalizedLocation = input.location.trim().toLowerCase();
        const cityMatches = cityValue === normalizedLocation || cityValue.includes(normalizedLocation) || normalizedLocation.includes(cityValue);
        const locationMatches = locationValue === normalizedLocation || locationValue.includes(normalizedLocation) || normalizedLocation.includes(locationValue);
        if (!cityMatches && !locationMatches) {
          return false;
        }
      }

      if (input.categories.length > 0) {
        const categoryMatch = this.matchesCategoryPreference(item.category || '', input.categories);
        if (!categoryMatch) {
          return false;
        }
      }

      if (input.perCategoryBudget && input.perCategoryBudget > 0) {
        const price = Number(item.packagePrice);
        if (!Number.isFinite(price) || price <= 0 || price > input.perCategoryBudget) {
          return false;
        }
      }

      return true;
    });
  }

  private getMinVisiblePackagePrice(packages: PackageEntity[]) {
    const visiblePackages = packages.filter((pkg) => pkg.visible);
    if (visiblePackages.length === 0) {
      return null;
    }

    const prices = visiblePackages
      .map((pkg) => Number(pkg.pricing))
      .filter((price) => Number.isFinite(price));

    if (prices.length === 0) {
      return null;
    }

    return Math.min(...prices);
  }

  private async rankWithGroq(
    deterministicRanked: RankedVendor[],
    input: {
      location: string;
      totalBudget: number | null;
      perCategoryBudget: number | null;
      categories: string[];
      categoryCount: number;
      limit: number;
    },
  ): Promise<{ ranked: RankedVendor[] | null; reason: string }> {
    const rawGroqKey = this.configService.get<string>('GROQ_API_KEY');
    const groqKey = rawGroqKey ? rawGroqKey.toString().trim().replace(/^['"]+|['"]+$/g, '') : '';
    const rawModel = this.configService.get<string>('GROQ_RECOMMENDER_MODEL');
    const rawEndpoint = this.configService.get<string>('GROQ_RECOMMENDER_ENDPOINT');

    let configuredModel = (rawModel || 'qwen/qwen3.8-27b')
      .toString()
      .trim()
      .replace(/^['"]+|['"]+$/g, '');

    // If deprecated llama3 models are configured, fallback to active working models
    if (configuredModel === 'llama3-8b-8192') {
      configuredModel = 'qwen/qwen3.8-27b';
    } else if (configuredModel === 'llama3-70b-8192') {
      configuredModel = 'openai/gpt-oss-120b';
    }

    let endpointUrl = (rawEndpoint || 'https://api.groq.com/openai/v1/chat/completions')
      .toString()
      .trim()
      .replace(/^['"]+|['"]+$/g, '');

    // Ensure endpoint points to /chat/completions even if configured with base URL
    if (!endpointUrl.endsWith('/chat/completions')) {
      endpointUrl = endpointUrl.replace(/\/+$/, '') + '/chat/completions';
    }

    if (!groqKey) {
      this.logger.warn('Groq ranking disabled: missing GROQ_API_KEY');
      return { ranked: null, reason: 'missing_groq_api_key' };
    }

    // Log masked API key info for diagnostics (do NOT log the full key)
    try {
      const visible = groqKey.length > 8 ? `${groqKey.slice(0,4)}...${groqKey.slice(-4)}` : '****';
      this.logger.debug(`Groq API key present (masked): ${visible}, length: ${groqKey.length}`);
    } catch {}

    // Filter out any candidates whose package price exceeds the per-category budget so they are never sent to Groq
    const candidatesWithinBudget = deterministicRanked.filter((item) => {
      if (!input.perCategoryBudget || input.perCategoryBudget <= 0) return true;
      const price = Number(item.packagePrice);
      return Number.isFinite(price) && price > 0 && price <= input.perCategoryBudget;
    });

    if (candidatesWithinBudget.length === 0) {
      this.logger.debug('No candidates within budget for Groq ranking');
      return { ranked: null, reason: 'no_candidates_within_budget' };
    }

    // Fetch recent review comments for candidates so the model can summarize sentiment
    const serviceIds = candidatesWithinBudget.map((d) => d.serviceId);
    let commentsRows: Array<{ serviceId: string; comment: string | null }> = [];
    if (serviceIds.length > 0) {
      try {
        commentsRows = await this.reviewRepository
          .createQueryBuilder('review')
          .select('review.service_id', 'serviceId')
          .addSelect('review.comment', 'comment')
          .where('review.service_id IN (:...serviceIds)', { serviceIds })
          .orderBy('review.created_at', 'DESC')
          .getRawMany();
      } catch (e) {
        this.logger.debug('Failed to load review comments for Groq prompt', String(e));
        commentsRows = [];
      }
    }

    const commentsMap = new Map<string, string[]>();
    for (const r of commentsRows) {
      if (!r || !r.serviceId) continue;
      const list = commentsMap.get(r.serviceId) || [];
      if (typeof r.comment === 'string' && r.comment.trim()) list.push(r.comment.trim());
      commentsMap.set(r.serviceId, list);
    }

    const enrichedCandidates = candidatesWithinBudget.map((item) => ({
      ...item,
      reviews: commentsMap.get(item.serviceId) || [],
    }));

    const prompt = this.buildRankingPrompt(enrichedCandidates, input);

    // Temporary debug logging: inspect exactly what the model receives.
    this.logger.debug(`Recommendation prompt for ${input.location || 'all locations'} / ${input.categories.join(', ') || 'all categories'}: ${prompt.slice(0, 2000)}`);

    // Log configured endpoint and model for debugging (do not log the API key)
    this.logger.debug(`Groq endpoint configured: ${endpointUrl}`);
    this.logger.debug(`Groq model configured: ${configuredModel}`);

    // Prepare endpointToUse and validate URL to avoid unclear errors from undici
    let endpointToUse = endpointUrl;
    try {
      // sanitize further: remove BOM and control whitespace
      const cleaned = endpointUrl.replace(/^[\uFEFF\u00A0\s]+|[\uFEFF\u00A0\s]+$/g, '').replace(/\s+/g, '');

      // If cleaning changed it, log both forms for diagnostics
      if (cleaned !== endpointUrl) {
        this.logger.debug(`Groq endpoint raw: ${JSON.stringify(endpointUrl)}`);
        this.logger.debug(`Groq endpoint cleaned: ${JSON.stringify(cleaned)}`);
      }

      // Log length and char codes to catch hidden characters
      const codes = Array.from(endpointUrl).map((c) => c.charCodeAt(0));
      this.logger.debug(`Groq endpoint length: ${endpointUrl.length}, codes: ${codes.slice(0,50).join(',')}${codes.length>50?',...':''}`);

      // eslint-disable-next-line no-new
      new URL(cleaned);
      endpointToUse = cleaned;
    } catch (err) {
      this.logger.warn(`Groq ranking failed: Invalid URL (${endpointUrl})`);
      // Safely extract stack/message from unknown error
      let errMessage: string;
      if (err && typeof err === 'object' && 'stack' in err) {
        // @ts-ignore - we've checked for 'stack' property presence
        errMessage = (err as { stack?: string }).stack || String(err);
      } else {
        errMessage = String(err);
      }
      this.logger.debug('URL validation error', errMessage);
      this.logger.debug('Invalid endpoint diagnostics', { raw: endpointUrl });
      return { ranked: null, reason: 'invalid_groq_endpoint' };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          endpointToUse,
    {
      model: configuredModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3500,
      temperature: 0.0,
      ...(configuredModel.includes('gpt-oss') ? { reasoning_effort: 'low' } : {}),
    },
    {
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
      proxy: false,
    },
  ),
);

      const generatedText = this.extractGeneratedText(response.data);
      this.logger.debug(`Groq raw content: [${generatedText}]`);
      this.logger.debug(`Groq finish_reason: ${response.data?.choices?.[0]?.finish_reason}`);

      const parsed = this.extractRankedJson(generatedText);
      if (!parsed) {
        return { ranked: null, reason: 'invalid_groq_response' };
      }

      const rankMap = new Map(candidatesWithinBudget.map((item) => [item.serviceId, item]));

      // Debug: log candidate IDs and compare with parsed ids
      const candidateIds = candidatesWithinBudget.map((d) => d.serviceId);
      this.logger.debug(`Groq candidates count: ${candidateIds.length}`, { candidateIds: candidateIds.slice(0, 50) });
      this.logger.debug(`Groq parsed ranked_ids: ${parsed.ranked_ids.slice(0, 50)}`);

      const matchedIds = parsed.ranked_ids.filter((id) => rankMap.has(id));
      const unmatchedIds = parsed.ranked_ids.filter((id) => !rankMap.has(id));
      this.logger.debug(`Groq matched ids: ${matchedIds}`);
      if (unmatchedIds.length > 0) {
        this.logger.debug(`Groq returned unknown ids (not in candidates): ${unmatchedIds.slice(0,50)}`);
      }

      const ranked = matchedIds
        .map((id) => rankMap.get(id)!)
        .map((item) => ({
          ...item,
          reason: parsed.reasons?.[item.serviceId] || item.reason,
          aiReview:
            (parsed.short_review && parsed.short_review[item.serviceId]) ||
            parsed.reasons?.[item.serviceId] ||
            item.reason,
        }));

      if (ranked.length === 0) {
        this.logger.debug('Groq returned no candidate matches; falling back to deterministic ranking');
        return { ranked: null, reason: 'empty_groq_ranking' };
      }

      // Important: the model must only reorder the already-filtered candidate pool.
      // Never append the remaining unranked candidates back into the final result,
      // because that reintroduces services outside the selected city/category/budget.
      return {
        ranked: ranked.slice(0, input.limit),
        reason: `success:groq:${configuredModel}`,
      };
    } catch (error) {
      // Try to extract axios/http error details
      let message = 'unknown_error';
      try {
        if (error && typeof error === 'object') {
          const anyErr = error as any;
          if (anyErr.response) {
            const status = anyErr.response.status;
            const data = anyErr.response.data;
            message = `Request failed with status code ${status}`;
            this.logger.debug('Groq response error', { status, data });
          } else if ('message' in anyErr) {
            message = String(anyErr.message);
          } else {
            message = String(anyErr);
          }
        }
      } catch (e) {
        message = String(error);
      }

      this.logger.warn(`Groq ranking failed: ${message}`);
      return { ranked: null, reason: `groq_request_failed:${message}` };
    }
  }

  private normalizeCategory(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private matchesCategoryPreference(category: string, preferences: string[]) {
    const normalizedCategory = this.normalizeCategory(category);
    return preferences.some((preference) => {
      const normPref = this.normalizeCategory(preference);
      return (
        normalizedCategory === normPref ||
        normalizedCategory.includes(normPref) ||
        normPref.includes(normalizedCategory)
      );
    });
  }

  private buildRankingPrompt(
    candidates: Array<RankedVendor & { reviews?: string[] }>,
    input: {
      location: string;
      totalBudget: number | null;
      perCategoryBudget: number | null;
      categories: string[];
      categoryCount: number;
      limit: number;
    },
  ) {
    // Strictly filter out any candidates whose package price is higher than the per-category budget
    const affordableCandidates = candidates.filter((c) => {
      if (!input.perCategoryBudget || input.perCategoryBudget <= 0) return true;
      const price = Number(c.packagePrice);
      return Number.isFinite(price) && price > 0 && price <= input.perCategoryBudget;
    });

    const candidateSummary = affordableCandidates.map((c) => ({
      serviceId: c.serviceId,
      serviceName: c.serviceName,
      recommendedPackage: {
        id: c.packageId,
        name: c.packageName,
        fullPrice: c.packagePrice,
        features: c.packageFeatures,
      },
      category: c.category,
      vendorName: c.vendorName,
      city: c.city,
      rating: c.rating,
      reviews: (c.reviews || []).slice(0, 3),
    }));

    const budgetExplanation = input.totalBudget
      ? `LKR ${input.totalBudget.toLocaleString()} total across ${input.categoryCount} service category(s), so each service should cost at most LKR ${input.perCategoryBudget!.toLocaleString()} (fullPrice)`
      : 'not specified';

    return `You are ranking wedding vendor packages and services for couples.
  Return ONLY valid JSON (no markdown), following this schema:
  {"ranked_ids":["serviceId1","serviceId2"],"reasons":{"serviceId1":"short reason explaining why this package fits","serviceId2":"short reason explaining why this package fits"},"short_review":{"serviceId1":"one-line summary of package and vendor sentiment","serviceId2":"one-line summary of package and vendor sentiment"}}

  User preferences:
  - location: ${input.location || 'not specified'}
  - budget: ${budgetExplanation}
  - categories: ${input.categories.join(', ') || 'not specified'}
  - top_limit: ${input.limit}

  Candidates:
  ${JSON.stringify(candidateSummary, null, 2)}

  CRITICAL PRICING & BUDGET RULES:
  - All candidates have been strictly pre-filtered so that 'fullPrice' <= the per-category budget.
  - 'fullPrice' is the FULL PRICE the couple pays for the service. This is the number to evaluate affordability against.
  - In our platform couples pay a 20% advance deposit to reserve, then the remaining 80% later. But the budget and affordability MUST always be evaluated against the FULL PRICE, not the 20% advance.
  - NEVER confuse the advance deposit with the package price.

  General Rules:
  - Only recommend services whose category matches what the user asked for.
  - Prioritize category and location fit.
  - Highlight why the recommended package matches the user's budget (fullPrice).
  - Keep reasons under 20 words.
  - For each candidate return a separate 'short_review' (one-line, max 20 words) that summarizes the package highlight and overall sentiment.
  - Do NOT copy any review text verbatim; always paraphrase and avoid repeating exact reviewer words or punctuation.
  - If no reviews exist for a candidate, summarize from attributes (category, package name, rating, fullPrice, location, and how well it matches preferences).
  - 'short_review' must be concise and factual; avoid invented details and do not include markdown.
  - ranked_ids must contain only provided serviceId values.`;
  }

  private ensureFastestPolicy(modelId: string) {
    return modelId.includes(':') ? modelId : `${modelId}:fastest`;
  }

  private extractGeneratedText(data: unknown) {
    if (Array.isArray(data) && typeof (data[0] as { generated_text?: string })?.generated_text === 'string') {
      return (data[0] as { generated_text: string }).generated_text;
    }

    if (
      typeof data === 'object' &&
      data &&
      'choices' in data &&
      Array.isArray((data as { choices?: Array<{ message?: { content?: string } }> }).choices)
    ) {
      const choices = (data as { choices: Array<{ message?: { content?: string } }> }).choices;
      const content = choices[0]?.message?.content;
      if (typeof content === 'string') {
        return content;
      }
    }

    if (typeof data === 'object' && data && 'generated_text' in data) {
      const maybeText = (data as { generated_text?: string }).generated_text;
      if (typeof maybeText === 'string') {
        return maybeText;
      }
    }

    return '';
  }

  private extractRankedJson(rawText: string): {
    ranked_ids: string[];
    reasons?: Record<string, string>;
    short_review?: Record<string, string>;
  } | null {
    if (!rawText) {
      return null;
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        ranked_ids?: string[];
        reasons?: Record<string, string>;
        short_review?: Record<string, string>;
      };

      if (!Array.isArray(parsed.ranked_ids)) {
        return null;
      }

      return {
        ranked_ids: parsed.ranked_ids,
        reasons: parsed.reasons || {},
        short_review: parsed.short_review || {},
      };
    } catch {
      return null;
    }
  }
}
