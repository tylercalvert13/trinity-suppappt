import { Calendar, Users, CheckCircle, XCircle, Percent, TrendingUp } from "lucide-react";
import { StatCard } from "./StatCard";
import { AppointmentsTrendChart } from "./AppointmentsTrendChart";
import { AppointmentsFunnelChart } from "./AppointmentsFunnelChart";
import { DailyAppointmentsTable } from "./DailyAppointmentsTable";
import type { AppointmentData } from "@/types/salesTracking";

interface AppointmentsTrackingTabProps {
  data: AppointmentData | null;
  loading: boolean;
}

export function AppointmentsTrackingTab({ data, loading }: AppointmentsTrackingTabProps) {
  const totalDue = data?.totalDue ?? 0;
  const totalShowed = data?.totalShowed ?? 0;
  const totalClosed = data?.totalClosed ?? 0;
  const totalNoShows = data?.totalNoShows ?? 0;
  const avgShowRate = data?.avgShowRate ?? 0;
  const avgCloseRate = data?.avgCloseRate ?? 0;
  const avgShowToCloseRate = data?.avgShowToCloseRate ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Row 1: Primary KPIs - Horizontally scrollable on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="Total Due"
            value={loading ? null : totalDue}
            icon={<Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />}
            subtitle="Scheduled"
            loading={loading}
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="Total Showed"
            value={loading ? null : totalShowed}
            icon={<Users className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />}
            subtitle="Attended"
            loading={loading}
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="Total Closed"
            value={loading ? null : totalClosed}
            icon={<CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
            subtitle="Converted"
            loading={loading}
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="No Shows"
            value={loading ? null : totalNoShows}
            icon={<XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />}
            subtitle="Missed"
            loading={loading}
          />
        </div>
      </div>

      {/* Row 2: Rate KPIs - Horizontally scrollable on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="Show Rate"
            value={loading ? null : `${avgShowRate.toFixed(1)}%`}
            icon={<Percent className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />}
            subtitle="Showed / Due"
            loading={loading}
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="Close Rate (Appt)"
            value={loading ? null : `${avgCloseRate.toFixed(1)}%`}
            icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />}
            subtitle="Closed / Due"
            loading={loading}
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <StatCard
            title="Close Rate (Show)"
            value={loading ? null : `${avgShowToCloseRate.toFixed(1)}%`}
            icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
            subtitle="Closed / Showed"
            loading={loading}
          />
        </div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <AppointmentsTrendChart data={data?.dailyStats || []} loading={loading} />
        <AppointmentsFunnelChart
          totalDue={totalDue}
          totalShowed={totalShowed}
          totalClosed={totalClosed}
          loading={loading}
        />
      </div>

      {/* Row 4: Daily Table */}
      <DailyAppointmentsTable data={data?.dailyStats || []} loading={loading} />
    </div>
  );
}
