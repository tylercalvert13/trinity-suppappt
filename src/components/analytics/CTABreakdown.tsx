import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Phone, MessageSquare, Calendar, Clock } from "lucide-react";

interface CTABreakdownProps {
  callClicks: number;
  smsRequests: number;
  morningCallbacks: number;
  afternoonCallbacks: number;
  businessHoursVisitors: number;
  afterHoursVisitors: number;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];

export const CTABreakdown = ({
  callClicks,
  smsRequests,
  morningCallbacks,
  afternoonCallbacks,
  businessHoursVisitors,
  afterHoursVisitors,
}: CTABreakdownProps) => {
  const ctaData = [
    { name: 'Call Clicks', value: callClicks, icon: Phone },
    { name: 'SMS Requests', value: smsRequests, icon: MessageSquare },
    { name: 'Morning Callback', value: morningCallbacks, icon: Calendar },
    { name: 'Afternoon Callback', value: afternoonCallbacks, icon: Calendar },
  ].filter(d => d.value > 0);

  const hoursData = [
    { name: 'Business Hours', value: businessHoursVisitors },
    { name: 'After Hours', value: afterHoursVisitors },
  ].filter(d => d.value > 0);

  const totalCTAs = callClicks + smsRequests + morningCallbacks + afternoonCallbacks;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5" />
            CTA Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalCTAs === 0 ? (
            <div className="flex items-center justify-center h-[250px]">
              <p className="text-muted-foreground">No CTA data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ctaData} layout="vertical" margin={{ left: 100, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {ctaData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{callClicks}</p>
                  <p className="text-xs text-muted-foreground">Direct Calls</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{smsRequests + morningCallbacks + afternoonCallbacks}</p>
                  <p className="text-xs text-muted-foreground">After Hours Actions</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Hours Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hoursData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px]">
              <p className="text-muted-foreground">No timing data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={hoursData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${value}`}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#6b7280" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2">
                <p className="text-sm text-muted-foreground">
                  {businessHoursVisitors > 0 && afterHoursVisitors > 0 && (
                    <>
                      {((businessHoursVisitors / (businessHoursVisitors + afterHoursVisitors)) * 100).toFixed(0)}% during business hours (9am-5pm ET)
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
