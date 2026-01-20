import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TrafficSource {
  source: string;
  medium: string;
  campaign: string;
  visitors: number;
  calls: number;
  conversionRate: number;
}

interface TrafficSourcesTableProps {
  data: TrafficSource[];
}

export const TrafficSourcesTable = ({ data }: TrafficSourcesTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Medium</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Visitors</TableHead>
              <TableHead className="text-right">Calls</TableHead>
              <TableHead className="text-right">Conv. Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No traffic data yet
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.source || '(direct)'}</TableCell>
                  <TableCell>{row.medium || '(none)'}</TableCell>
                  <TableCell>{row.campaign || '(none)'}</TableCell>
                  <TableCell className="text-right">{row.visitors}</TableCell>
                  <TableCell className="text-right">{row.calls}</TableCell>
                  <TableCell className="text-right">{row.conversionRate.toFixed(1)}%</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
