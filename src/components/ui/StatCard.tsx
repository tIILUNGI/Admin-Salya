import { ReactNode } from "react";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
}

export default function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        "bento-card p-6 flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
        <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 border border-slate-100 group-hover:text-indigo-600 transition-colors">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <span className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded-md",
              trend.isUp ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
            )}>
              {trend.isUp ? "+" : "-"}{trend.value}%
            </span>
            <span className="text-xs text-slate-400">vs last period</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
