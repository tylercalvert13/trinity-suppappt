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

export interface LeaderboardData {
  agents: AgentLeaderboardStats[];
  teamStats: {
    totalAppsToday: number;
    totalApproved: number;
    teamApprovalRate: number;
    totalApps: number;
  };
  recentActivity: RecentActivity[];
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

      // Calculate per-agent stats
      const agentMap = new Map<string, {
        name: string;
        totalApps: number;
        approved: number;
        pending: number;
        declined: number;
        todayApps: number;
      }>();

      submissions.forEach((sub) => {
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
          rank: 0, // Will be assigned after sorting
        }))
        .sort((a, b) => b.approved - a.approved);

      // Assign ranks
      agentsArray.forEach((agent, index) => {
        agent.rank = index + 1;
      });

      // Calculate team stats
      const totalAppsToday = submissions.filter((s) => isToday(s.date)).length;
      const totalApproved = submissions.filter((s) => s.status.toLowerCase() === "approved").length;
      const totalApps = submissions.length;
      const teamApprovalRate = totalApps > 0 
        ? Math.round((totalApproved / totalApps) * 100) 
        : 0;

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
        agents: agentsArray,
        teamStats: {
          totalAppsToday,
          totalApproved,
          teamApprovalRate,
          totalApps,
        },
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
