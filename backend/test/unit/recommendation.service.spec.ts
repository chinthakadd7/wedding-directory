import { RecommendationService } from 'src/modules/recommendation/recommendation.service';
import { ServiceEntity } from 'src/database/entities/service.entity';
import { ReviewEntity } from 'src/database/entities/review.entity';

describe('RecommendationService', () => {
  let service: RecommendationService;

  const mockReviewRepository = {
    createQueryBuilder: jest.fn(),
  };

  const builder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockServiceRepository = {
    createQueryBuilder: jest.fn(() => builder),
  };

  const httpService = { post: jest.fn() };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'GROQ_API_KEY') return '';
      return undefined;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecommendationService(
      mockServiceRepository as any,
      mockReviewRepository as any,
      httpService as any,
      configService as any,
    );
  });

  it('should filter by city using the service city/vendor city and ignore non-matching locations', async () => {
    builder.getMany.mockResolvedValue([
      {
        id: 'service-1',
        category: 'Venues',
        visible: true,
        city: 'Colombo',
        vendor: { city: 'Colombo' },
        packages: [{ visible: true, pricing: 250000 }],
      },
      {
        id: 'service-2',
        category: 'Venues',
        visible: true,
        city: 'Kandy',
        vendor: { city: 'Kandy' },
        packages: [{ visible: true, pricing: 220000 }],
      },
      {
        id: 'service-3',
        category: 'Venues',
        visible: true,
        city: 'Colombo',
        vendor: { city: 'Colombo' },
        location: 'Colombo',
        packages: [{ visible: true, pricing: 350000 }],
      },
    ] as unknown as ServiceEntity[]);

    const result = await (service as any).findCandidateServices({
      location: 'Colombo',
      categories: ['Venues'],
      perCategoryBudget: 300000,
    });

    expect(result.map((item: any) => item.id)).toEqual(['service-1']);
  });

  it('should keep only services in the selected category and within the per-category budget', async () => {
    builder.getMany.mockResolvedValue([
      {
        id: 'service-1',
        category: 'Photography',
        visible: true,
        city: 'Colombo',
        vendor: { city: 'Colombo' },
        packages: [{ visible: true, pricing: 180000 }],
      },
      {
        id: 'service-2',
        category: 'Catering',
        visible: true,
        city: 'Colombo',
        vendor: { city: 'Colombo' },
        packages: [{ visible: true, pricing: 160000 }],
      },
      {
        id: 'service-3',
        category: 'Photography',
        visible: true,
        city: 'Colombo',
        vendor: { city: 'Colombo' },
        packages: [{ visible: true, pricing: 500000 }],
      },
    ] as unknown as ServiceEntity[]);

    const result = await (service as any).findCandidateServices({
      location: 'Colombo',
      categories: ['Photography'],
      perCategoryBudget: 300000,
    });

    expect(result.map((item: any) => item.id)).toEqual(['service-1']);
  });

  it('should re-apply the hard constraints after AI ranking before returning results', async () => {
    const filtered = [
      {
        serviceId: 'svc-1',
        serviceName: 'Venue A',
        category: 'Venues',
        city: 'Colombo',
        location: 'Colombo',
        packagePrice: 250000,
        packageName: 'Venue Package',
        reason: 'matches city and budget',
        deterministicScore: 90,
      },
      {
        serviceId: 'svc-2',
        serviceName: 'Venue B',
        category: 'Catering',
        city: 'Kandy',
        location: 'Kandy',
        packagePrice: 200000,
        packageName: 'Catering Package',
        reason: 'wrong city',
        deterministicScore: 80,
      },
    ] as any;

    const result = (service as any).enforceFinalCandidateFilters(filtered, {
      location: 'Colombo',
      perCategoryBudget: 300000,
      categories: ['Venues'],
    });

    expect(result.map((item: any) => item.serviceId)).toEqual(['svc-1']);
  });
});
