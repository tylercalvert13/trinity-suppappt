import { useState, useCallback, useEffect } from "react";
import type { Submission, DashboardData, AgentStats, DailyStats, CarrierStats } from "@/types/salesTracking";

const SUBMISSIONS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRsCOzfJF0q1V49FLlNRi6FYVac_rlo-xsGZOhTi6hVI_lcHb-2-TC9LOL5RiMRT0A5cA8jei4V3hv2/pub?gid=1684442142&single=true&output=csv";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || "";
    });
    data.push(row);
  }

  return data;
}

function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  
  // Try standard ISO format first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  // Try MM/DD/YYYY or M/D/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  return new Date(0); // Fallback to epoch if unparseable
}

function formatDateKey(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

export function useSalesData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SUBMISSIONS_URL}&_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch data from Google Sheets");
      }

      const text = await response.text();
      const rawData = parseCSV(text);

      // Parse submissions with new fields
      const submissions: Submission[] = rawData.map((row) => ({
        date: row["Date"] || row["date"] || "",
        agent: row["Agent"] || row["agent"] || "",
        clientName: row["Client"] || row["Client Name"] || row["clientName"] || "",
        state: row["State"] || row["state"] || "",
        previousCarrier: row["Previous Carrier"] || row["previousCarrier"] || "",
        newCarrier: row["New Carrier"] || row["newCarrier"] || "",
        premium: parseNumber(row["Premium"] || row["premium"] || "0"),
        status: row["Status"] || row["status"] || "Pending",
        commission: parseNumber(row["Commission"] || row["commission"] || "0"),
      }));

      // Calculate totals
      let approved = 0;
      let pending = 0;
      let denied = 0;
      let totalPremium = 0;
      let totalCommission = 0;
      let pendingPremium = 0;

      submissions.forEach((sub) => {
        const status = sub.status.toLowerCase();
        if (status === "approved") {
          approved++;
          totalPremium += sub.premium;
          totalCommission += sub.commission;
        } else if (status === "pending") {
          pending++;
          pendingPremium += sub.premium;
        } else if (status === "denied" || status === "rejected" || status === "declined") {
          denied++;
        }
      });

      const avgCommission = approved > 0 ? totalCommission / approved : 0;

      // Agent stats
      const agentMap = new Map<string, AgentStats>();
      submissions.forEach((sub) => {
        if (!sub.agent) return;
        const existing = agentMap.get(sub.agent) || {
          name: sub.agent,
          sales: 0,
          premium: 0,
          commission: 0,
          approved: 0,
        };
        existing.sales++;
        if (sub.status.toLowerCase() === "approved") {
          existing.approved++;
          existing.premium += sub.premium;
          existing.commission += sub.commission;
        }
        agentMap.set(sub.agent, existing);
      });

      const agentStats = Array.from(agentMap.values()).sort(
        (a, b) => b.sales - a.sales
      );

      // Daily stats from submissions - grouped by date with status breakdown
      const dateMap = new Map<string, DailyStats>();
      submissions.forEach((sub) => {
        const dateKey = formatDateKey(sub.date);
        if (!dateKey) return;
        
        const existing = dateMap.get(dateKey) || {
          date: dateKey,
          approved: 0,
          pending: 0,
          denied: 0,
          total: 0,
        };
        
        existing.total++;
        const status = sub.status.toLowerCase();
        if (status === "approved") {
          existing.approved++;
        } else if (status === "pending") {
          existing.pending++;
        } else if (status === "denied" || status === "rejected" || status === "declined") {
          existing.denied++;
        }
        
        dateMap.set(dateKey, existing);
      });

      const dailyStats = Array.from(dateMap.values())
        .sort((a, b) => {
          const [aM, aD] = a.date.split("/").map(Number);
          const [bM, bD] = b.date.split("/").map(Number);
          return aM === bM ? aD - bD : aM - bM;
        })
        .slice(-7);

      // Carrier stats - group by New Carrier
      const carrierMap = new Map<string, CarrierStats>();
      submissions.forEach((sub) => {
        if (!sub.newCarrier || sub.status.toLowerCase() !== "approved") return;
        const existing = carrierMap.get(sub.newCarrier) || {
          name: sub.newCarrier,
          count: 0,
          premium: 0,
        };
        existing.count++;
        existing.premium += sub.premium;
        carrierMap.set(sub.newCarrier, existing);
      });

      const carrierStats = Array.from(carrierMap.values()).sort(
        (a, b) => b.count - a.count
      );

      // Recent submissions (last 10)
      const recentSubmissions = [...submissions]
        .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
        .slice(0, 10);

      setData({
        totalSales: submissions.length,
        approved,
        pending,
        denied,
        totalPremium,
        totalCommission,
        pendingPremium,
        avgCommission,
        dailyStats,
        agentStats,
        carrierStats,
        recentSubmissions,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Auto-refresh every 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}
