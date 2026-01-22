import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface TrafficSourceData {
  source: string;
  medium: string;
  campaign: string;
  visitors: number;
  quotes: number;
  beatRate: number;
  avgSavings: number;
  conversionRate: number;
}

interface TrafficSourcePerformanceProps {
  data: TrafficSourceData[];
}

export const TrafficSourcePerformance = ({ data }: TrafficSourcePerformanceProps) => {
  const avgBeatRate = data.length > 0 
    ? data.reduce((sum, d) => sum + d.beatRate, 0) / data.length 
    : 0;

  const getBeatRateBadge = (beatRate: number) => {
    if (beatRate > avgBeatRate + 10) {
      return (
        <Badge variant="default" className="bg-green-500">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          {beatRate.toFixed(0)}%
        </Badge>
      );
    } else if (beatRate < avgBeatRate - 10) {
      return (
        <Badge variant="destructive">
          <ArrowDownRight className="h-3 w-3 mr-1" />
          {beatRate.toFixed(0)}%
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Minus className="h-3 w-3 mr-1" />
        {beatRate.toFixed(0)}%
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Traffic Source Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">No traffic source data yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Visitors</TableHead>
                  <TableHead className="text-right">Quotes</TableHead>
                  <TableHead className="text-right">Beat Rate</TableHead>
                  <TableHead className="text-right">Avg Savings</TableHead>
                  <TableHead className="text-right">Conv. Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.source}</TableCell>
                    <TableCell>{row.medium}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={row.campaign}>
                      {row.campaign}
                    </TableCell>
                    <TableCell className="text-right">{row.visitors.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.quotes.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{getBeatRateBadge(row.beatRate)}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ${row.avgSavings.toFixed(0)}
                    </TableCell>
                    <TableCell className="text-right">{row.conversionRate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
