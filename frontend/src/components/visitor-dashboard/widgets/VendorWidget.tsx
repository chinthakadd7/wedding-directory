import React from "react";
import { FiBookmark } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";
import ActionButton from "../common/ActionButton";
import EmptyStateDisplay from "../common/EmptyStateDisplay";

interface ServiceOrOffering {
  id?: string;
  name?: string;
  banner?: string;
  vendor?: {
    busname?: string;
  };
}

interface Vendor {
  id: string;
  serviceId?: string;
  service?: ServiceOrOffering;
  offering?: ServiceOrOffering;
}

interface VendorWidgetProps {
  vendors: Vendor[];
  visitorId: string | undefined;
}

const VendorWidget: React.FC<VendorWidgetProps> = ({ vendors, visitorId }) => {
  return (
    <div className="bg-white dark:bg-darkSurface rounded-2xl border border-orange/20 shadow-sm hover:shadow-md hover:border-orange/30 transition-all duration-300 overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="px-4 md:px-5 lg:px-6 py-3.5 lg:py-4 border-b border-orange/15 dark:border-orange/20 bg-orange/[0.02] dark:bg-orange/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange/10 dark:bg-orange/20 text-orange flex items-center justify-center shrink-0 border border-orange/15 dark:border-orange/30 shadow-xs">
            <FiBookmark className="h-5 w-5" />
          </div>
          <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100">
            Saved Services
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 md:p-5 lg:p-6 flex-1 flex flex-col justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-3.5 font-body">
            Track and compare your shortlisted wedding services.
          </p>
          {vendors && vendors.length > 0 ? (
            <div className="space-y-2.5">
            {vendors.slice(0, 2).map((vendor) => {
              const svc = vendor.service || vendor.offering;
              const serviceId = svc?.id || vendor.serviceId;
              const href = serviceId
                ? `/services/${serviceId}`
                : `/visitor-dashboard/my-vendors/${visitorId}`;

              return (
                <Link
                  key={vendor.id}
                  href={href}
                  className="flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl transition-all duration-200 hover:bg-orange/[0.04] dark:hover:bg-zinc-800/50 pb-2.5 border-b border-orange/10 dark:border-zinc-800 last:border-b-0 last:pb-1.5 group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-orange/10 dark:bg-orange/20 shrink-0 border border-orange/20 shadow-xs flex items-center justify-center">
                    {svc?.banner ? (
                      <Image
                        src={svc.banner}
                        alt={svc?.name || "Service"}
                        width={50}
                        height={50}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-orange font-bold font-title text-sm">
                        {svc?.name
                          ? svc.name.charAt(0)
                          : "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-title font-bold truncate text-gray-900 dark:text-zinc-200 text-sm group-hover:text-orange transition-colors">
                      {svc?.name || "Unnamed Service"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-body truncate mt-0.5">
                      {svc?.vendor?.busname || "No business name"}
                    </p>
                  </div>
                </Link>
              );
            })}
            </div>
          ) : (
            <EmptyStateDisplay
              Icon={FiBookmark}
              message="No services shortlisted yet"
            />
          )}
        </div>

        <div className="pt-3.5 border-t border-orange/10 dark:border-zinc-800">
          <ActionButton
            href={`/visitor-dashboard/my-vendors/${visitorId}`}
            label={
              vendors.length > 0
                ? `View all saved (${vendors.length})`
                : "Explore services"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default VendorWidget;
