'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAuth } from '@/contexts/VisitorAuthContext';
import { getVendorRecommendations } from '@/api/recommendation/vendorRecommendation.api';
import categories from '@/utils/category.json';
import cities from '@/utils/city.json';
import { Sparkles } from 'lucide-react';
import {
  FiMapPin,
  FiDollarSign,
  FiLayers,
  FiSliders,
  FiAlertCircle,
} from 'react-icons/fi';

import RecommendedPackageCard, {
  RecommendedPackageItem,
} from '@/components/visitor-dashboard/RecommendedPackageCard';

const categoryOptions = categories;
const districtOptions = [...new Set(cities.map((city) => city.District))].sort();

const RecommendationPage = () => {
  const { accessToken, isAuthenticated, isInitialized } = useAuth();
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState<'rules' | 'ai' | 'ai+rules' | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedPackageItem[]>([]);
  const selectedCategoriesRef = useRef<string[]>([]);

  const canRequest = useMemo(() => isAuthenticated && !!accessToken, [isAuthenticated, accessToken]);

  if (!isInitialized) {
    return (
      <div className="w-full max-w-lg mx-auto py-16">
        <div className="bg-white dark:bg-darkSurface rounded-3xl border-2 border-orange/20 dark:border-zinc-800 shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange/10 dark:bg-orange/20 flex items-center justify-center text-orange mx-auto">
            <Sparkles size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-title text-gray-900 dark:text-zinc-100">
            Loading your dashboard...
          </h1>
        </div>
      </div>
    );
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category];

      selectedCategoriesRef.current = next;
      return next;
    });
  };

  const buildRecommendationPayload = () => {
    const normalizedLocation = location?.trim() || undefined;
    const normalizedBudget = budget && Number(budget) > 0 ? Number(budget) : undefined;
    const activeCategories = selectedCategoriesRef.current.length > 0
      ? selectedCategoriesRef.current
      : selectedCategories;
    const normalizedCategories = activeCategories
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      location: normalizedLocation,
      budget: normalizedBudget,
      categories: normalizedCategories,
      limit: 6,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!accessToken) {
      setError('Please log in as a visitor to get recommendations.');
      return;
    }

    const payload = buildRecommendationPayload();
    const { location: normalizedLocation, budget: normalizedBudget, categories: normalizedCategories } = payload;
    selectedCategoriesRef.current = normalizedCategories;

    if (!normalizedLocation && !normalizedBudget && normalizedCategories.length === 0) {
      setError('Please select a location, budget, or at least one service category before requesting recommendations.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await getVendorRecommendations(payload, accessToken);

      setRecommendations(response.recommendations || []);
      setSource(response.source || 'rules');
    } catch {
      setError('Unable to load recommendations right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canRequest) {
    return (
      <div className="w-full max-w-lg mx-auto py-16">
        <div className="bg-white dark:bg-darkSurface rounded-3xl border-2 border-orange/20 dark:border-zinc-800 shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange/10 dark:bg-orange/20 flex items-center justify-center text-orange mx-auto">
            <Sparkles size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-title text-gray-900 dark:text-zinc-100">
            Visitor Login Required
          </h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400 font-body">
            This AI recommendation feature is only available for registered visitors.
          </p>
          <Link
            href="/visitor-login"
            className="inline-flex items-center justify-center gap-2 bg-orange hover:bg-orange/90 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-sm text-sm"
          >
            Go to Visitor Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Hero Card */}
      <div className="bg-white dark:bg-darkSurface rounded-3xl border-2 border-orange/20 dark:border-zinc-800 shadow-sm p-6 sm:p-8">
        <div className="space-y-3">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/visitor-dashboard' },
              {
                label: 'AI Recommendations',
                href: '/visitor-dashboard/recommendations',
              },
            ]}
          />
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange/10 dark:bg-orange/20 flex items-center justify-center text-orange shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-title text-gray-900 dark:text-zinc-100">
                AI Vendor Recommendations
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 font-body">
                Tell us your wedding preferences, and we will recommend vendors using smart hybrid matching.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Preferences Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-darkSurface rounded-3xl border-2 border-orange/20 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div className="flex items-center gap-2 pb-4 border-b border-orange/15 dark:border-zinc-800">
          <FiSliders className="text-orange" size={20} />
          <h2 className="text-lg sm:text-xl font-bold font-title text-gray-900 dark:text-zinc-100">
            Wedding Preferences
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2 font-body flex items-center gap-1.5">
              <FiMapPin className="text-orange" size={14} />
              <span>Preferred Location</span>
            </label>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full h-11 border border-orange/25 dark:border-zinc-700 bg-white dark:bg-darkElevated text-gray-900 dark:text-zinc-100 rounded-xl px-4 text-sm font-body hover:border-orange/60 focus:border-orange focus:ring-2 focus:ring-orange/20 focus:outline-none transition-all cursor-pointer"
            >
              <option value="">Select District</option>
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2 font-body flex items-center gap-1.5">
              <FiDollarSign className="text-orange" size={14} />
              <span>Total Budget (LKR) — optional</span>
            </label>
            <input
              type="number"
              min="0"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder="Max spend across all services, e.g. 500000"
              className="w-full h-11 border border-orange/25 dark:border-zinc-700 dark:bg-darkElevated dark:text-zinc-100 dark:placeholder:text-zinc-500 rounded-xl px-4 text-sm font-body focus:border-orange focus:ring-2 focus:ring-orange/20 focus:outline-none transition-all"
            />
            <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500 font-body">
              Maximum total you want to spend across all selected services combined.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2.5 font-body flex items-center gap-1.5">
            <FiLayers className="text-orange" size={14} />
            <span>Needed Services</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((category) => {
              const selected = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                    selected
                      ? 'bg-orange border-orange text-white shadow-xs'
                      : 'bg-white dark:bg-darkElevated border-orange/20 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-orange hover:text-orange'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>


        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-body">
            <FiAlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex justify-start">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 bg-orange hover:bg-orange/90 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-all text-sm font-body cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Finding best vendors...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Get Recommendations</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 3. Recommended Packages */}
      <div className="space-y-4 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold font-title text-gray-900 dark:text-zinc-100">
              Recommended Packages
            </h2>
          </div>
          {source && (
            <span className="text-xs font-semibold px-3 py-1 bg-orange/10 dark:bg-orange/20 border border-orange/20 dark:border-orange/30 text-orange rounded-full flex items-center gap-1.5 font-body">
              <Sparkles size={12} />
              <span>
                Source: {source === 'ai' || source === 'ai+rules' ? 'AI' : 'Rules'}
              </span>
            </span>
          )}
        </div>

        {recommendations.length === 0 ? (
          <div className="bg-white dark:bg-darkSurface rounded-3xl border-2 border-orange/20 dark:border-zinc-800 p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-orange/10 dark:bg-orange/20 flex items-center justify-center text-orange mx-auto mb-3 shadow-xs">
              <Sparkles size={26} />
            </div>
            <h3 className="font-title text-lg font-bold text-gray-900 dark:text-zinc-100 mb-1">
              No recommendations yet
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 font-body max-w-md mx-auto">
              Fill in your wedding preferences above and click &quot;Get Recommendations&quot; to discover matched packages tailored to your budget and style.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.map((item, index) => {
              const itemId = item.packageId || item.serviceId || item.offeringId || `rec-${index}`;
              return (
                <RecommendedPackageCard
                  key={itemId}
                  item={item}
                  source={source}
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default RecommendationPage;
