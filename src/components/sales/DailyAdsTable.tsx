import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DailyAdsStats } from "@/types/salesTracking";

interface DailyAdsTableProps {
  data: DailyAdsStats[];
  loading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function DailyAdsTable({ data, loading }: DailyAdsTableProps) {
  // Show most recent first
  const sortedData = [...data].reverse();

  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Daily Ads Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Appts</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="text-right">Lead→Appt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No ads data available
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.date}</TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(row.spend)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">{row.leads}</TableCell>
                      <TableCell className="text-right text-yellow-600">{row.appointments}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.costPerLead)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.costPerAppointment)}</TableCell>
                      <TableCell className="text-right">{row.leadToApptRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
