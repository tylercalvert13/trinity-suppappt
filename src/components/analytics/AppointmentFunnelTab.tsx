import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, Calendar, XCircle, DollarSign, TrendingUp } from "lucide-react";
import { QuoteFunnelDropoff } from "./QuoteFunnelDropoff";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

interface FunnelStep {
  step: string;
  label: string;
  count: number;
  percentage: number;
  dropoff: number;
}

interface BookingStep {
  step: string;
  label: string;
  count: number;
  percentage: number;
}

interface AppointmentFunnelTabProps {
  pageName: string;
  totalVisitors: number;
  qualifiedCount: number;
  appointmentsBooked: number;
  disqualifiedCount: number;
  avgMonthlySavings: number;
  todayVisitors: number;
  todayBooked: number;
  funnelDropoffData: FunnelStep[];
  bookingFunnelData: BookingStep[];
}

const BOOKING_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const AppointmentFunnelTab = ({
  pageName,
  totalVisitors,
  qualifiedCount,
  appointmentsBooked,
  disqualifiedCount,
  avgMonthlySavings,
  todayVisitors,
  todayBooked,
  funnelDropoffData,
  bookingFunnelData,
}: AppointmentFunnelTabProps) => {
  const bookingRate = qualifiedCount > 0 ? (appointmentsBooked / qualifiedCount) * 100 : 0;
  const qualifyRate = totalVisitors > 0 ? (qualifiedCount / totalVisitors) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Visitors</p>
                <p className="text-2xl font-bold">{totalVisitors.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">+{todayVisitors} today</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Qualified</p>
                <p className="text-2xl font-bold text-green-600">{qualifiedCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{qualifyRate.toFixed(1)}% of visitors</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Appointments</p>
                <p className="text-2xl font-bold text-primary">{appointmentsBooked.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">+{todayBooked} today</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Booking Rate</p>
                <p className="text-2xl font-bold text-primary">{bookingRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">of qualified</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disqualified</p>
                <p className="text-2xl font-bold text-red-600">{disqualifiedCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {totalVisitors > 0 ? ((disqualifiedCount / totalVisitors) * 100).toFixed(1) : 0}% of visitors
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${avgMonthlySavings.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">monthly</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <QuoteFunnelDropoff data={funnelDropoffData} />
        
        {/* Booking Widget Funnel */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Booking Widget Conversion</h3>
            {bookingFunnelData.length === 0 || bookingFunnelData[0].count === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No booking data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={bookingFunnelData}
                  layout="vertical"
                  margin={{ top: 5, right: 80, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 'dataMax']} />
                  <YAxis 
                    dataKey="label" 
                    type="category" 
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number, _name: string, props: { payload: BookingStep }) => [
                      `${value} (${props.payload.percentage.toFixed(1)}%)`,
                      'Users'
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {bookingFunnelData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BOOKING_COLORS[index % BOOKING_COLORS.length]} />
                    ))}
                    <LabelList 
                      dataKey="count" 
                      position="right" 
                      formatter={(value: number) => value.toLocaleString()}
                      className="text-xs"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Widget View → Day Selected → Time Selected → Confirm Clicked → Booked
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
