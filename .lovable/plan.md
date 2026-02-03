

# Agent Leaderboard Dashboard Plan

## Goal
Create a motivational, TV/monitor-friendly dashboard for agents that displays competitive metrics and encourages performance throughout the day - without exposing commission or premium data.

---

## Available Metrics (From Sales/Submissions Data)

| Metric | Source | Why It's Motivating |
|--------|--------|---------------------|
| **Applications Submitted** | Total submissions per agent | Raw activity metric |
| **Approved Count** | Status = "approved" | Success/win metric |
| **Approval Rate** | approved/total apps | Quality metric |
| **Pending Apps** | Status = "pending" | "Money in the pipeline" |
| **Today's Submissions** | Filter by today's date | Daily competition |

---

## Dashboard Layout

### Route: `/leaderboard`

### Design: "Big Screen" Optimized
- Large fonts, high contrast
- Auto-refresh every 60 seconds
- Dark theme (matches existing /salestracking)
- Designed for office TV or monitor display

---

## UI Sections

### 1. Team Stats Hero (Top Row)
Large team-wide numbers to celebrate collective wins:
- **Total Apps Today** - Big number showing daily team activity
- **Total Approved** - Cumulative team success count
- **Team Approval Rate** - Quality benchmark percentage

### 2. Agent Leaderboard Table (Main Section)
Ranked table showing:

| Rank | Agent | Apps | Approved | Rate | Today |
|------|-------|------|----------|------|-------|
| 1    | Name  | 12   | 10       | 83%  | +2    |
| 2    | Name  | 9    | 7        | 78%  | +1    |
| 3    | Name  | 8    | 6        | 75%  | 0     |

**Visual Elements:**
- Trophy/medal icons for top 3 positions
- Green indicator for agents with activity today
- Highlighted row for #1 position
- Default sort by Approved count (descending)

### 3. Recent Wins Feed (Right Sidebar on Desktop)
Real-time activity feed:
- "Sarah just got an app approved!"
- "Mike submitted a new application"
- Shows last 5 activities (no client names, just agent + action)

---

## Technical Implementation

### New Type (salesTracking.ts)
```text
interface AgentLeaderboardStats {
  name: string;
  rank: number;
  totalApps: number;
  approved: number;
  pending: number;
  declined: number;
  approvalRate: number;
  todayApps: number;
}
```

### New Hook: `useAgentLeaderboard.ts`
- Fetches from same CSV as useSalesData
- Calculates per-agent stats (excluding commission/premium)
- Adds "today" filter by comparing dates
- Sorts by approved count and assigns ranks
- 60-second auto-refresh interval

### New Components
- `src/pages/AgentLeaderboard.tsx` - Main page
- `src/components/leaderboard/LeaderboardHeader.tsx` - Page header with refresh indicator
- `src/components/leaderboard/TeamStatsCards.tsx` - Hero stats row
- `src/components/leaderboard/LeaderboardTable.tsx` - Ranked agent table with medals
- `src/components/leaderboard/RecentWinsCard.tsx` - Activity feed sidebar

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/AgentLeaderboard.tsx` | Main page component |
| `src/hooks/useAgentLeaderboard.ts` | Data hook (no sensitive data) |
| `src/components/leaderboard/TeamStatsCards.tsx` | Hero stats cards |
| `src/components/leaderboard/LeaderboardTable.tsx` | Ranked agent table |
| `src/components/leaderboard/RecentWinsCard.tsx` | Activity feed |

### Files to Edit

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/leaderboard` route |
| `src/types/salesTracking.ts` | Add `AgentLeaderboardStats` type |

---

## Key Features

### Auto-Refresh (60 seconds)
```text
useEffect(() => {
  const interval = setInterval(refetch, 60000);
  return () => clearInterval(interval);
}, []);
```

### No Sensitive Data Exposed
- **Hidden**: Commission, Premium, Cost metrics
- **Shown**: Counts, Rates, Ranks only

### "Today" Detection
- Compares submission dates to current date
- Shows green badge/count for agents active today
- Creates daily competition element

### Mobile + TV Friendly
- Responsive design works on phones and large screens
- High contrast colors for visibility
- Large touch targets for mobile

---

## Visual Design Notes

### Color Scheme
- Background: Dark (slate-900)
- Cards: White with subtle shadows
- #1 Rank: Gold highlight
- #2 Rank: Silver accent
- #3 Rank: Bronze accent
- "Today" activity: Green badges

### Trophy Icons
- 1st place: Gold trophy
- 2nd place: Silver medal
- 3rd place: Bronze medal
- Others: Rank number

