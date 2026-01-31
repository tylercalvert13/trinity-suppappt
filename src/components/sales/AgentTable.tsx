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
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🏆 Top Agents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Premium</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Approved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No agent data yet
                  </TableCell>
                </TableRow>
              ) : (
                data.map((agent, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell className="text-right">{agent.sales}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(agent.premium)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(agent.commission)}
                    </TableCell>
                    <TableCell className="text-right">
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
