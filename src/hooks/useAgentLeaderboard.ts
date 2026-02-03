import { useState, useCallback, useEffect } from "react";
import type { AgentLeaderboardStats, RecentActivity } from "@/types/salesTracking";

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

function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const submissionDate = new Date(dateStr);
  const today = new Date();
  return (
    submissionDate.getFullYear() === today.getFullYear() &&
    submissionDate.getMonth() === today.getMonth() &&
    submissionDate.getDate() === today.getDate()
  );
}

function isWithinCurrentWeek(dateStr: string): boolean {
  if (!dateStr) return false;
  const submissionDate = new Date(dateStr);
  const today = new Date();
  
  // Get start of current week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Get end of current week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return submissionDate >= startOfWeek && submissionDate <= endOfWeek;
}

function isWithinCurrentMonth(dateStr: string): boolean {
  if (!dateStr) return false;
  const submissionDate = new Date(dateStr);
  const today = new Date();
  
  return (
    submissionDate.getFullYear() === today.getFullYear() &&
    submissionDate.getMonth() === today.getMonth()
  );
}

export type TimePeriod = "all" | "weekly" | "monthly";

interface PeriodStats {
  agents: AgentLeaderboardStats[];
  teamStats: {
    totalAppsToday: number;
    totalApproved: number;
    teamApprovalRate: number;
    totalApps: number;
  };
}

export interface LeaderboardData {
  all: PeriodStats;
  weekly: PeriodStats;
  monthly: PeriodStats;
  recentActivity: RecentActivity[];
}

function calculatePeriodStats(
  submissions: { date: string; agent: string; status: string }[],
  filterFn?: (dateStr: string) => boolean
): PeriodStats {
  const filteredSubmissions = filterFn 
    ? submissions.filter((s) => filterFn(s.date))
    : submissions;

  // Calculate per-agent stats
  const agentMap = new Map<string, {
    name: string;
    totalApps: number;
    approved: number;
    pending: number;
    declined: number;
    todayApps: number;
  }>();

  filteredSubmissions.forEach((sub) => {
    if (!sub.agent) return;
    
    const existing = agentMap.get(sub.agent) || {
      name: sub.agent,
      totalApps: 0,
      approved: 0,
      pending: 0,
      declined: 0,
      todayApps: 0,
    };

    existing.totalApps++;
    
    const status = sub.status.toLowerCase();
    if (status === "approved") {
      existing.approved++;
    } else if (status === "pending") {
      existing.pending++;
    } else if (status === "denied" || status === "rejected" || status === "declined") {
      existing.declined++;
    }

    if (isToday(sub.date)) {
      existing.todayApps++;
    }

    agentMap.set(sub.agent, existing);
  });

  // Convert to array and calculate rates + ranks
  const agentsArray = Array.from(agentMap.values())
    .map((agent) => ({
      ...agent,
      approvalRate: agent.totalApps > 0 
        ? Math.round((agent.approved / agent.totalApps) * 100) 
        : 0,
      rank: 0,
    }))
    .sort((a, b) => b.approved - a.approved);

  // Assign ranks
  agentsArray.forEach((agent, index) => {
    agent.rank = index + 1;
  });

  // Calculate team stats
  const totalAppsToday = filteredSubmissions.filter((s) => isToday(s.date)).length;
  const totalApproved = filteredSubmissions.filter((s) => s.status.toLowerCase() === "approved").length;
  const totalApps = filteredSubmissions.length;
  const teamApprovalRate = totalApps > 0 
    ? Math.round((totalApproved / totalApps) * 100) 
    : 0;

  return {
    agents: agentsArray,
    teamStats: {
      totalAppsToday,
      totalApproved,
      teamApprovalRate,
      totalApps,
    },
  };
}

export function useAgentLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(SUBMISSIONS_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const text = await response.text();
      const rawData = parseCSV(text);

      // Parse submissions
      const submissions = rawData.map((row) => ({
        date: row["Date"] || row["date"] || "",
        agent: row["Agent"] || row["agent"] || "",
        status: row["Status"] || row["status"] || "Pending",
      }));

      // Calculate stats for each time period
      const allTimeStats = calculatePeriodStats(submissions);
      const weeklyStats = calculatePeriodStats(submissions, isWithinCurrentWeek);
      const monthlyStats = calculatePeriodStats(submissions, isWithinCurrentMonth);

      // Generate recent activity (last 5 submissions with agent names)
      const recentActivity: RecentActivity[] = submissions
        .filter((s) => s.agent)
        .slice(-10)
        .reverse()
        .slice(0, 5)
        .map((sub, index) => ({
          id: `activity-${index}`,
          agent: sub.agent,
          action: sub.status.toLowerCase() === "approved" 
            ? "got an app approved" 
            : "submitted a new application",
          timestamp: sub.date,
          type: sub.status.toLowerCase() === "approved" ? "approved" : "submitted",
        }));

      setData({
        all: allTimeStats,
        weekly: weeklyStats,
        monthly: monthlyStats,
        recentActivity,
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching leaderboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
}
