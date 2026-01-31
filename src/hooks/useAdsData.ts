import { useState, useCallback, useEffect } from "react";
import type { AdsData, DailyAdsStats } from "@/types/salesTracking";

const ADS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT4lAOPdwFRuw6cy-Cd473TD80rsj-kCfGCKTlvIaWHqDagTDWNjOtyiY8Ih1_Lwyo-b7OSHzFZ8LL4/pub?gid=0&single=true&output=csv";

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

export function useAdsData() {
  const [data, setData] = useState<AdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(ADS_CSV_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch ads data from Google Sheets");
      }

      const text = await response.text();
      const rawData = parseCSV(text);

      let totalSpend = 0;
      let totalLeads = 0;
      let totalAppointments = 0;

      const dailyStats: DailyAdsStats[] = rawData.map((row) => {
        const spend = parseNumber(row["Spend"] || row["spend"] || "0");
        const leads = parseNumber(row["Leads"] || row["leads"] || "0");
        const appointments = parseNumber(row["Appointments"] || row["appointments"] || "0");
        const costPerLead = parseNumber(row["Cost Per Lead"] || row["cost per lead"] || "0");
        const costPerAppointment = parseNumber(row["Cost per Appointment"] || row["cost per appointment"] || "0");
        const leadToApptRate = parseNumber(row["Lead -> Appt Ratio"] || row["lead -> appt ratio"] || "0");

        totalSpend += spend;
        totalLeads += leads;
        totalAppointments += appointments;

        return {
          date: formatDateKey(row["Date"] || row["date"] || ""),
          spend,
          leads,
          appointments,
          costPerLead,
          costPerAppointment,
          leadToApptRate,
        };
      }).filter(stat => stat.date);

      // Sort by date
      dailyStats.sort((a, b) => {
        const [aM, aD] = a.date.split("/").map(Number);
        const [bM, bD] = b.date.split("/").map(Number);
        return aM === bM ? aD - bD : aM - bM;
      });

      const avgCostPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
      const avgCostPerAppointment = totalAppointments > 0 ? totalSpend / totalAppointments : 0;

      setData({
        totalSpend,
        totalLeads,
        totalAppointments,
        avgCostPerLead,
        avgCostPerAppointment,
        dailyStats,
      });
    } catch (err) {
      console.error("Error fetching ads data:", err);
      setError(err instanceof Error ? err.message : "Failed to load ads data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
