import React from "react";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

const Subscribe = () => {
  return (
    <div className="h-auto py-12 md:py-16 w-full bg-brown dark:bg-[#1A1615] border-y border-orange/15 dark:border-zinc-800/80 flex justify-center items-center transition-colors duration-200">
      <div className="flex flex-col lg:flex-row justify-between items-center w-full max-w-screen-lg px-4 sm:px-6 gap-6 lg:gap-8">
        <div className="text-center lg:text-left">
          <span className="inline-block text-orange text-xs sm:text-sm font-semibold tracking-wider uppercase mb-2 bg-orange/15 px-3 py-1 rounded-full">
            For Wedding Vendors & Service Providers
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-title text-white leading-tight mt-1">
            Grow your wedding business with Say I Do
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 dark:text-zinc-400 mt-2 max-w-xl">
            Showcase your packages, receive verified couple inquiries, and manage bookings effortlessly across Sri Lanka.
          </p>
        </div>
        <div className="flex flex-col xs:flex-row items-center gap-3 shrink-0 w-full xs:w-auto">
          <Link
            href="/vendor-signup"
            className="w-full xs:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-orange hover:bg-orange/90 active:scale-[0.98] text-white font-title text-base sm:text-lg font-semibold shadow-md transition-all"
          >
            <span>Join as a Vendor</span>
            <FiArrowRight size={16} />
          </Link>
          <Link
            href="/vendor-login"
            className="w-full xs:w-auto inline-flex items-center justify-center px-5 py-3.5 rounded-xl border border-white/25 hover:border-white text-white hover:bg-white/10 font-title text-base font-medium transition-all"
          >
            Vendor Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
