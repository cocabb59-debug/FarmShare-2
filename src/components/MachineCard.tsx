import React from "react";
import { Machine, MachineStatus } from "../types";
import { CATEGORY_IMAGES } from "../lib/constants";
import { MapPin, User, Star, Tag } from "lucide-react";

interface MachineCardProps {
  machine: Machine;
  reviews: any[];
  onClick: () => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, reviews, onClick }) => {
  // Filter reviews matching this specific machine
  const machineReviews = reviews.filter((r) => r.machineId === machine.id);
  const avgRating =
    machineReviews.length > 0
      ? (machineReviews.reduce((sum, r) => sum + r.rating, 0) / machineReviews.length).toFixed(1)
      : null;

  // Render appropriate status badges
  const renderStatusBadge = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.AVAILABLE:
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold px-2 py-0.5 rounded-full">
            대여 가능
          </span>
        );
      case MachineStatus.MAINTENANCE:
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-bold px-2 py-0.5 rounded-full">
            점검 중
          </span>
        );
      case MachineStatus.RENTED:
        return (
          <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
            대여 중
          </span>
        );
      default:
        return null;
    }
  };

  const primaryImage =
    machine.imageUrls && machine.imageUrls.length > 0
      ? machine.imageUrls[0]
      : CATEGORY_IMAGES[machine.category] || CATEGORY_IMAGES["기타"];

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-100 rounded-2xl flex flex-col overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group cursor-pointer"
      id={`machine-card-${machine.id}`}
    >
      {/* Thumbnail Aspect Ratio Block */}
      <div className="relative aspect-video w-full bg-slate-50 overflow-hidden">
        <img
          src={primaryImage}
          alt={machine.title}
          referrerPolicy="no-referrer"
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />

        {/* Status indicator badge overlay */}
        <div className="absolute top-3 left-3 z-10">{renderStatusBadge(machine.status)}</div>

        {/* Category tag overlay */}
        <div className="absolute bottom-3 right-3 bg-slate-900/70 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center space-x-1">
          <Tag className="h-3 w-3" />
          <span>{machine.category}</span>
        </div>
      </div>

      {/* Equipment details text body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              {machine.manufacturer} • {machine.year}년식
            </span>
            {avgRating && (
              <div className="flex items-center text-xs font-semibold text-slate-700 space-x-0.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{avgRating}</span>
                <span className="text-slate-400 font-normal">({machineReviews.length})</span>
              </div>
            )}
          </div>

          <h3 className="font-bold text-slate-800 text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {machine.title}
          </h3>

          <div className="flex flex-col space-y-1 text-xs text-slate-500">
            <div className="flex items-center space-x-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{machine.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>소유자: {machine.ownerName}</span>
            </div>
          </div>
        </div>

        {/* Rates / pricing display section */}
        <div className="border-t border-slate-50 mt-4 pt-3 flex items-baseline justify-between">
          <span className="text-slate-400 text-xs">일일 대여 요금</span>
          <div className="text-right">
            <span className="text-lg font-extrabold text-slate-900">
              {machine.dailyPrice.toLocaleString()}
            </span>
            <span className="text-slate-500 font-medium text-xs ml-0.5">원 / 일</span>
          </div>
        </div>
      </div>
    </div>
  );
};
