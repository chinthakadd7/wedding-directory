"use client";

import React from "react";
import { FiMessageSquare } from "react-icons/fi";
import { useQuery } from "@apollo/client";
import { GET_VISITOR_CHATS, GET_OFFERING_DETAILS } from "@/graphql/queries";
import { formatDistanceToNow, isValid } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import ActionButton from "../common/ActionButton";
import EmptyStateDisplay from "../common/EmptyStateDisplay";

interface Message {
  content: string;
  senderId?: string;
  senderType?: string;
  timestamp: string;
}

interface Chat {
  chatId: string;
  serviceId: string;
  vendorId: string;
  messages: Message[];
}

interface ChatWidgetProps {
  visitorId: string | undefined;
}

const formatTimeAgo = (timestamp?: string) => {
  if (!timestamp) return "";
  try {
    const d = new Date(timestamp);
    if (!isValid(d)) return "";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
};

const ChatRowItem: React.FC<{ chat: Chat; visitorId: string }> = ({
  chat,
  visitorId,
}) => {
  const { data: offeringData } = useQuery(GET_OFFERING_DETAILS, {
    variables: { id: chat.serviceId },
    skip: !chat.serviceId,
  });

  const lastMessage = chat.messages?.[chat.messages.length - 1];
  const offering = offeringData?.findServiceById;
  const vendorName =
    offering?.vendor?.busname || offering?.name || "Wedding Vendor";

  const isPaymentNote =
    lastMessage?.content?.includes("Payment Note") ||
    lastMessage?.content?.startsWith("📦");

  const previewText = isPaymentNote
    ? "📦 Advance Booking Payment Confirmed"
    : lastMessage?.content || "No messages yet";

  const timeAgo = formatTimeAgo(lastMessage?.timestamp);

  return (
    <Link
      href={`/visitor-dashboard/chats/${visitorId}/${chat.chatId}`}
      className="flex items-center gap-3 pb-2.5 border-b border-orange/10 dark:border-zinc-800 last:border-b-0 last:pb-0 hover:opacity-90 group transition-all"
    >
      {/* Vendor Squircle Avatar */}
      <div className="w-11 h-11 rounded-xl bg-orange/10 dark:bg-orange/20 text-orange flex items-center justify-center font-bold font-title text-base border border-orange/20 dark:border-orange/30 shadow-xs shrink-0 group-hover:scale-105 transition-transform overflow-hidden relative">
        {offering?.vendor?.profile_pic_url ? (
          <Image
            src={offering.vendor.profile_pic_url}
            alt={vendorName}
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : (
          vendorName.charAt(0).toUpperCase()
        )}
      </div>

      {/* Conversation Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h4 className="font-title text-xs sm:text-sm font-bold text-gray-900 dark:text-zinc-200 truncate group-hover:text-orange transition-colors">
            {vendorName}
          </h4>
          {timeAgo && (
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-body shrink-0">
              {timeAgo}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 font-body truncate mt-0.5">
          {previewText}
        </p>
      </div>
    </Link>
  );
};

const ChatWidget: React.FC<ChatWidgetProps> = ({ visitorId }) => {
  const { data, loading } = useQuery(GET_VISITOR_CHATS, {
    variables: { visitorId },
    skip: !visitorId,
  });

  const chats: Chat[] = data?.getVisitorChats || [];

  // Sort chats by latest message timestamp descending
  const sortedChats = [...chats].sort((a, b) => {
    const timeA = a.messages?.[a.messages.length - 1]?.timestamp || "";
    const timeB = b.messages?.[b.messages.length - 1]?.timestamp || "";
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });

  return (
    <div className="bg-white dark:bg-darkSurface rounded-2xl border border-orange/20 shadow-sm hover:shadow-md hover:border-orange/30 transition-all duration-300 overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="px-4 md:px-5 lg:px-6 py-3.5 lg:py-4 border-b border-orange/15 dark:border-orange/20 bg-orange/[0.02] dark:bg-orange/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange/10 dark:bg-orange/20 text-orange flex items-center justify-center shrink-0 border border-orange/15 dark:border-orange/30 shadow-xs">
            <FiMessageSquare className="h-5 w-5" />
          </div>
          <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100">
            Vendor Chats
          </h3>
        </div>

        {sortedChats.length > 0 && (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange/10 dark:bg-orange/20 text-orange border border-orange/20 dark:border-orange/30 font-body">
            {sortedChats.length} Active
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 md:p-5 lg:p-6 flex-1 flex flex-col justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-3.5 font-body">
            Direct conversations and quote inquiries with vendors.
          </p>

          {loading ? (
            <div className="py-6 flex justify-center items-center">
              <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 font-body">
                Loading conversations...
              </span>
            </div>
          ) : sortedChats.length > 0 ? (
            <div className="space-y-2.5">
              {sortedChats.slice(0, 2).map((chat) => (
                <ChatRowItem
                  key={chat.chatId}
                  chat={chat}
                  visitorId={visitorId || ""}
                />
              ))}
            </div>
          ) : (
            <EmptyStateDisplay
              Icon={FiMessageSquare}
              message="No vendor conversations yet."
            />
          )}
        </div>

        {/* Bottom Action Button */}
        <div className="pt-3.5 border-t border-orange/10 dark:border-zinc-800 flex justify-end">
          <ActionButton
            href={
              visitorId
                ? `/visitor-dashboard/chats/${visitorId}`
                : "/visitor-dashboard"
            }
            label="Open conversations"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
