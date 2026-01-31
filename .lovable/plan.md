
Goal
- Make the “Top Agents” and “Recent Submissions” cards on /salestracking fully horizontally scrollable on mobile (so no columns are cut off), matching what you see in your screenshot.

What’s happening (why it still goes off-screen)
- Those two cards sit inside a CSS grid (the “Tables Row” in SalesTracking.tsx).
- In CSS grid, items default to min-width: auto, which means they refuse to shrink smaller than their content’s “minimum” width.
- Since the tables have wide content (multiple columns + “Carrier Transition”), the grid item/card expands wider than the viewport, and because the page container uses overflow-x-hidden, it looks like the right side is cut off and you can’t swipe to it.
- Even though the table itself has overflow wrappers, the parent grid item’s “won’t shrink” behavior can prevent the scroll container from being the thing that overflows.

Plan (implementation steps)

1) Allow grid items to shrink so internal scrolling can work
- File: src/pages/SalesTracking.tsx
- In the “Tables Row” section, wrap each table card in a div with min-w-0 (this is the key fix for grid overflow problems):
  - <div className="min-w-0"><AgentTable ... /></div>
  - <div className="min-w-0"><RecentSubmissionsTable ... /></div>
- Optional: also add min-w-0 to the grid container itself (harmless but helps in some layouts).

2) Ensure the card itself can’t force overflow
- Files:
  - src/components/sales/AgentTable.tsx
  - src/components/sales/RecentSubmissionsTable.tsx
- Add min-w-0 to the Card className so the card doesn’t keep a “content-sized” minimum width:
  - Card className="bg-white/95 backdrop-blur min-w-0"

3) Fix scrolling at the correct layer (avoid nested scroll wrappers)
Right now there’s a subtle structural issue:
- Your Table component (src/components/ui/table.tsx) already wraps <table> in a <div className="relative w-full overflow-auto">.
- AgentTable/RecentSubmissionsTable additionally wrap <Table> in another div with overflow-x-auto.
- Nested scroll containers often behave poorly on mobile (especially swipe gestures), and can make it feel like “it’s not scrollable”.

We’ll make scrolling consistent by doing ONE of these approaches (I’ll implement the safer/cleaner one):

Approach A (recommended): Make the shared Table wrapper be the horizontal scroll container
- File: src/components/ui/table.tsx
- Change the wrapper div around <table> from:
  - "relative w-full overflow-auto"
  to something explicitly horizontal and mobile-friendly, e.g.:
  - "relative w-full max-w-full overflow-x-auto overflow-y-hidden"
  - add: "min-w-0" (prevents layout expansion in grids)
  - add: "[-webkit-overflow-scrolling:touch]" (smooth iOS scrolling)
  - optionally add: "overscroll-x-contain" (prevents weird rubber-banding)
- Then remove the extra wrapper divs in AgentTable and RecentSubmissionsTable, since Table will be the scroll container.

This yields:
- The card stays within the screen (thanks to min-w-0)
- The table scrolls horizontally inside the card (thanks to the updated Table wrapper)
- Swiping left/right directly on the table works reliably on mobile

4) Add a subtle “this is scrollable” cue (optional but helpful)
- Files:
  - AgentTable.tsx
  - RecentSubmissionsTable.tsx
- Add a light right-edge gradient overlay inside the table area on mobile only (pointer-events-none), so users immediately understand they can swipe horizontally.
- This is optional; we can skip if you want it minimal.

5) Verification checklist (mobile)
- On /salestracking (Sales tab), confirm:
  - The “Top Agents” card stays within the screen width (no cut-off card border)
  - Swiping left/right inside the Top Agents table reveals Premium / Comm / Appr columns
  - The “Recent Submissions” table can be swiped to fully see “Carrier Transition”, “Premium”, “Status”
  - No horizontal page scrolling (only the table area scrolls horizontally)

Files that will be updated
- src/pages/SalesTracking.tsx (wrap table cards with min-w-0)
- src/components/sales/AgentTable.tsx (min-w-0 on Card; remove redundant overflow wrapper if using Approach A)
- src/components/sales/RecentSubmissionsTable.tsx (min-w-0 on Card; remove redundant overflow wrapper if using Approach A)
- src/components/ui/table.tsx (make the built-in wrapper the horizontal scroll container; mobile-friendly scrolling)

Notes / edge cases handled
- This approach fixes the root grid “min-width” issue and avoids nested horizontal scroll containers, which is typically what causes “it’s cut off and won’t scroll” on mobile.
- Because Table is a shared component, we’ll keep changes conservative: horizontal scrolling for wide tables is generally desirable everywhere, and this shouldn’t break existing pages. If any other page relies on vertical overflow inside tables (rare), we can scope the change to horizontal-only without affecting height.

If you approve this plan, I’ll implement the min-w-0 grid fix plus the Table wrapper scroll fix so those two cards become reliably swipe-scrollable on mobile.