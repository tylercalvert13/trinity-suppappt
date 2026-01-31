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
import type { AgentStats } from "@/types/salesTracking";
import { formatCurrency } from "@/hooks/useSalesData";

interface AgentTableProps {
  data: AgentStats[];
  loading?: boolean;
}

export function AgentTable({ data, loading }: AgentTableProps) {
  return (
    <Card className="bg-white/95 backdrop-blur min-w-0">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          🏆 Top Agents
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {loading ? (
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 sm:h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table className="min-w-max whitespace-nowrap">
              <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Agent</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Sales</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Premium</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Comm.</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Appr.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground text-xs sm:text-sm">
                        No agent data yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((agent, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">{agent.name}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">{agent.sales}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">
                          {formatCurrency(agent.premium)}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">
                          {formatCurrency(agent.commission)}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">
                          {agent.approved}/{agent.sales}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
  );
}
