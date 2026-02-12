import { useState, useCallback, useEffect } from "react";
import type { AppointmentData, DailyAppointmentStats } from "@/types/salesTracking";

const APPOINTMENTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT4lAOPdwFRuw6cy-Cd473TD80rsj-kCfGCKTlvIaWHqDagTDWNjOtyiY8Ih1_Lwyo-b7OSHzFZ8LL4/pub?gid=1434770554&single=true&output=csv";

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
  const cleaned = value.replace(/[$,%]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatDateKey(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

export function useAppointmentData(dateRange?: { from: Date | null; to: Date | null }) {
  const [data, setData] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(APPOINTMENTS_CSV_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch appointment data from Google Sheets");
      }

      const text = await response.text();
      const rawData = parseCSV(text);

      let totalDue = 0;
      let totalShowed = 0;
      let totalClosed = 0;

      let dailyStats: DailyAppointmentStats[] = rawData
        .map((row) => {
          const due = parseNumber(row["Due"] || row["due"] || "0");
          const showed = parseNumber(row["Showed"] || row["showed"] || "0");
          const showRate = parseNumber(row["Show %"] || row["show %"] || "0");
          const closed = parseNumber(row["Closed"] || row["closed"] || "0");
          const apptToCloseRate = parseNumber(row["Appt -> Close"] || row["appt -> close"] || "0");
          const showToCloseRate = parseNumber(row["Show -> Close"] || row["show -> close"] || "0");

          return {
            date: formatDateKey(row["Date"] || row["date"] || ""),
            due,
            showed,
            showRate,
            closed,
            apptToCloseRate,
            showToCloseRate,
          };
        })
        .filter((stat) => stat.date && stat.due > 0);

      // Filter by date range if provided
      if (dateRange?.from) {
        const fromMonth = dateRange.from.getMonth() + 1;
        const fromDay = dateRange.from.getDate();
        const toDate = dateRange.to ?? dateRange.from;
        const toMonth = toDate.getMonth() + 1;
        const toDay = toDate.getDate();
        dailyStats = dailyStats.filter((stat) => {
          const [m, d] = stat.date.split("/").map(Number);
          const val = m * 100 + d;
          return val >= fromMonth * 100 + fromDay && val <= toMonth * 100 + toDay;
        });
      }

      dailyStats.forEach((stat) => {
        totalDue += stat.due;
        totalShowed += stat.showed;
        totalClosed += stat.closed;
      });

      // Sort by date (most recent first for display, but chart will reverse)
      dailyStats.sort((a, b) => {
        const [aM, aD] = a.date.split("/").map(Number);
        const [bM, bD] = b.date.split("/").map(Number);
        return aM === bM ? bD - aD : bM - aM;
      });

      const totalNoShows = totalDue - totalShowed;
      const avgShowRate = totalDue > 0 ? (totalShowed / totalDue) * 100 : 0;
      const avgCloseRate = totalDue > 0 ? (totalClosed / totalDue) * 100 : 0;
      const avgShowToCloseRate = totalShowed > 0 ? (totalClosed / totalShowed) * 100 : 0;

      setData({
        totalDue,
        totalShowed,
        totalClosed,
        totalNoShows,
        avgShowRate,
        avgCloseRate,
        avgShowToCloseRate,
        dailyStats,
      });
    } catch (err) {
      console.error("Error fetching appointment data:", err);
      setError(err instanceof Error ? err.message : "Failed to load appointment data");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
