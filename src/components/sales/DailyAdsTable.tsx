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
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          📊 Daily Ads Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {loading ? (
          <Skeleton className="h-[200px] sm:h-[300px] w-full" />
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="min-w-[500px] px-2 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Spend</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Leads</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Appts</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">CPL</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm hidden sm:table-cell">CPA</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Conv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground text-xs sm:text-sm">
                        No ads data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">{row.date}</TableCell>
                        <TableCell className="text-right text-red-600 text-xs sm:text-sm py-2 sm:py-4">
                          {formatCurrency(row.spend)}
                        </TableCell>
                        <TableCell className="text-right text-blue-600 text-xs sm:text-sm py-2 sm:py-4">{row.leads}</TableCell>
                        <TableCell className="text-right text-yellow-600 text-xs sm:text-sm py-2 sm:py-4">{row.appointments}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">{formatCurrency(row.costPerLead)}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4 hidden sm:table-cell">{formatCurrency(row.costPerAppointment)}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">{row.leadToApptRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
