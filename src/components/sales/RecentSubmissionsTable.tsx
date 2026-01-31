import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, ArrowRight } from "lucide-react";
import type { Submission } from "@/types/salesTracking";
import { formatCurrency, formatDate } from "@/hooks/useSalesData";

interface RecentSubmissionsTableProps {
  data: Submission[];
  loading?: boolean;
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "approved") {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
  } else if (s === "pending") {
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
  } else if (s === "denied" || s === "rejected") {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Denied</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

export function RecentSubmissionsTable({ data, loading }: RecentSubmissionsTableProps) {
  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          Recent Submissions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {loading ? (
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 sm:h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table className="min-w-max whitespace-nowrap">
              <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm">Client</TableHead>
                    <TableHead className="text-xs sm:text-sm">State</TableHead>
                    <TableHead className="text-xs sm:text-sm">Carrier Transition</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Premium</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground text-xs sm:text-sm">
                        No submissions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((sub, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4">{formatDate(sub.date)}</TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">{sub.clientName}</TableCell>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4">{sub.state || "—"}</TableCell>
                        <TableCell className="py-2 sm:py-4">
                          {sub.previousCarrier || sub.newCarrier ? (
                            <span className="flex items-center gap-1 text-xs sm:text-sm">
                              <span className="text-muted-foreground">{sub.previousCarrier || "New"}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{sub.newCarrier || "—"}</span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">
                          {formatCurrency(sub.premium)}
                        </TableCell>
                        <TableCell className="py-2 sm:py-4">{getStatusBadge(sub.status)}</TableCell>
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
