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
import type { DailyAppointmentStats } from "@/types/salesTracking";

interface DailyAppointmentsTableProps {
  data: DailyAppointmentStats[];
  loading: boolean;
}

export function DailyAppointmentsTable({ data, loading }: DailyAppointmentsTableProps) {
  return (
    <Card className="bg-white/95 backdrop-blur min-w-0">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-sm sm:text-base">Daily Performance</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-2 sm:px-6">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Date</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Due</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Showed</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm text-red-600">No Shows</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Closed</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Show %</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Close %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 14).map((row, idx) => {
                  const noShows = row.due - row.showed;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="text-xs sm:text-sm py-2 sm:py-4 font-medium">
                        {row.date}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4 text-blue-600 font-medium">
                        {row.due}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4 text-amber-600 font-medium">
                        {row.showed}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4 text-red-600 font-medium">
                        {noShows}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4 text-green-600 font-medium">
                        {row.closed}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">
                        <span className={row.showRate >= 70 ? "text-green-600" : row.showRate >= 50 ? "text-amber-600" : "text-red-600"}>
                          {row.showRate.toFixed(0)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">
                        <span className={row.showToCloseRate >= 50 ? "text-green-600" : row.showToCloseRate >= 30 ? "text-amber-600" : "text-red-600"}>
                          {row.showToCloseRate.toFixed(0)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
