interface MetricCardProps {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
}

const trendSymbol = { up: "↑", down: "↓", neutral: "–" };
const trendColor  = { up: "text-red-400", down: "text-brand-green", neutral: "text-[#7d8590]" };

export default function MetricCard({ label, value, trend }: MetricCardProps) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg p-5 flex flex-col gap-2 hover:border-brand-muted transition-colors">
      <span style={{ fontFamily: "'Inter', sans-serif" }} className="text-[10px] text-[#7d8590] uppercase tracking-[0.15em]">{label}</span>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-[#e6edf3] tabular-nums">{value}</span>
        <span className={`text-xl mb-1 font-bold ${trendColor[trend]}`}>{trendSymbol[trend]}</span>
      </div>
    </div>
  );
}
