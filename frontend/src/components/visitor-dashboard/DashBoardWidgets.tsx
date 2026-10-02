import React from "react";
import VendorWidget from "./widgets/VendorWidget";
import GuestListWidget from "./widgets/GuestListWidget";
import BudgetWidget from "./widgets/BudgetWidget";
import ChecklistWidget from "./widgets/ChecklistWidget";
import CalendarWidget from "./widgets/CalendarWidget";
import ChatWidget from "./widgets/ChatWidget";

export interface Vendor {
  id: string;
  offering: {
    name: string;
    banner?: string;
    vendor: {
      busname: string;
    };
  };
}

interface DashboardWidgetsProps {
  myVendors: Vendor[];
  attendingGuests: number;
  declinedGuests: number;
  invitedGuests: number;
  notInvitedGuests: number;
  totalGuests: number;
  budgetTotal: number;
  budgetSpent: number;
  budgetPercentage: number;
  completedTasks: number;
  totalTasks: number;
  checklistProgress: number;
  visitorId: string | undefined;
}

const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({
  myVendors,
  attendingGuests,
  declinedGuests,
  invitedGuests,
  notInvitedGuests,
  totalGuests,
  budgetTotal,
  budgetSpent,
  budgetPercentage,
  completedTasks,
  totalTasks,
  checklistProgress,
  visitorId,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 lg:grid-rows-3 h-full flex-1 min-w-0">
      <VendorWidget vendors={myVendors} visitorId={visitorId} />

      <GuestListWidget
        attendingGuests={attendingGuests}
        declinedGuests={declinedGuests}
        invitedGuests={invitedGuests}
        notInvitedGuests={notInvitedGuests}
        totalGuests={totalGuests}
      />

      <BudgetWidget
        budgetTotal={budgetTotal}
        budgetSpent={budgetSpent}
        budgetPercentage={budgetPercentage}
        visitorId={visitorId}
      />

      <ChecklistWidget
        completedTasks={completedTasks}
        totalTasks={totalTasks}
        checklistProgress={checklistProgress}
        visitorId={visitorId}
      />

      <CalendarWidget visitorId={visitorId} />

      <ChatWidget visitorId={visitorId} />
    </div>
  );
};

export default DashboardWidgets;
