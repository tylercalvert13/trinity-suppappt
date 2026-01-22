import { Card, CardContent } from "@/components/ui/card";
import { Users, Phone, TrendingUp, TrendingDown, MessageSquare, DollarSign, XCircle, CheckCircle } from "lucide-react";

interface QuoteFunnelOverviewProps {
  totalVisitors: number;
  quotesGenerated: number;
  beatRateCount: number;
  knockoutCount: number;
  disqualifiedCount: number;
  callClicks: number;
  smsRequests: number;
  avgMonthlySavings: number;
  todayVisitors: number;
  todayQuotes: number;
}

export const QuoteFunnelOverview = ({
  totalVisitors,
  quotesGenerated,
  beatRateCount,
  knockoutCount,
  disqualifiedCount,
  callClicks,
  smsRequests,
  avgMonthlySavings,
  todayVisitors,
  todayQuotes,
}: QuoteFunnelOverviewProps) => {
  const beatRatePercentage = quotesGenerated > 0 ? (beatRateCount / quotesGenerated) * 100 : 0;
  const quoteRate = totalVisitors > 0 ? (quotesGenerated / totalVisitors) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Row 1 */}
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
              <p className="text-sm font-medium text-muted-foreground">Quotes Generated</p>
              <p className="text-2xl font-bold">{quotesGenerated.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{quoteRate.toFixed(1)}% of visitors</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Beat Their Rate</p>
              <p className="text-2xl font-bold text-green-600">{beatRateCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{beatRatePercentage.toFixed(1)}% of quotes</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Couldn't Beat Rate</p>
              <p className="text-2xl font-bold text-orange-600">{knockoutCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                {quotesGenerated > 0 ? ((knockoutCount / quotesGenerated) * 100).toFixed(1) : 0}% of quotes
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>

      {/* Row 2 */}
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
              <p className="text-sm font-medium text-muted-foreground">Call Clicks</p>
              <p className="text-2xl font-bold">{callClicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Business hours CTA</p>
            </div>
            <Phone className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">SMS Requests</p>
              <p className="text-2xl font-bold">{smsRequests.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">After hours CTA</p>
            </div>
            <MessageSquare className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Monthly Savings</p>
              <p className="text-2xl font-bold text-green-600">
                ${avgMonthlySavings.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">For beat rate quotes</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
