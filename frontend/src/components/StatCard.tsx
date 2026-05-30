import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red';
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-500',
    border: 'border-blue-500/20',
  },
  green: {
    bg: 'bg-green-500/10',
    icon: 'text-green-500',
    border: 'border-green-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-500',
    border: 'border-amber-500/20',
  },
  red: {
    bg: 'bg-red-500/10',
    icon: 'text-red-500',
    border: 'border-red-500/20',
  },
};

export default function StatCard({ title, value, icon, color = 'blue' }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${colors.border} bg-slate-900 p-6 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow duration-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <div className={colors.icon}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
