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
      whileHover={{ y: -2 }}
      className={cn(
        "enterprise-card p-6 flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{title}</span>
        <div className="p-2.5 bg-slate-50 rounded-lg text-slate-500 border border-slate-100 transition-colors">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">{value}</h3>
        {trend && (
          <div className="mt-3 flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-extrabold px-2 py-1 rounded-md uppercase tracking-widest",
              trend.isUp ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
            )}>
              {trend.isUp ? "+" : "-"}{trend.value}%
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">vs período</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
