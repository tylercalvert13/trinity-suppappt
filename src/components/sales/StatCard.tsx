import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number | null;
  icon: React.ReactNode;
  subtitle?: string;
  loading?: boolean;
}

export function StatCard({ title, value, icon, subtitle, loading }: StatCardProps) {
  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardContent className="pt-3 pb-2 sm:pt-4 sm:pb-3 px-3 sm:px-4">
        <div className="flex items-center justify-between mb-1 sm:mb-2 gap-1">
          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </span>
          <div className="flex-shrink-0">{icon}</div>
        </div>
        {loading ? (
          <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
        ) : (
          <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">{value}</p>
        )}
        {subtitle && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
