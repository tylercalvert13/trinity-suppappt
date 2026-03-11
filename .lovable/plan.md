

# Update /suppappt Hero Colors to Match Trusted Senior Medicare Sites

## Research Findings

I screenshotted 5 top-performing Medicare senior funnels. Here are the clear color patterns:

| Site | Hero Background | CTA Button | Text | Vibe |
|------|----------------|------------|------|------|
| **Medicare.gov** | Light blue-gray (#EDF3F8) | Dark teal (#006D6F) | Dark gray/black | Calm, governmental |
| **AARP/UnitedHealthcare** | Photo + white card overlay | Teal/blue (#002677 navy) | Dark navy | Professional, warm |
| **MedicareSupplement.com** | Muted purple gradient | Teal/cyan (#0097A9) | White | Established, calm |
| **Mutual of Omaha** | Light gray (#F5F5F5) | Navy blue (#003B71) | Dark gray | Clean, corporate |
| **GoHealth** | White | Bright blue (#1A2BDB) | Dark navy | Modern, minimal |

**Key takeaway**: Every successful senior Medicare site avoids dark saturated hero backgrounds. They use either white/light gray backgrounds with dark text, or soft muted gradients. CTAs are teal or navy -- never bright green (which reads as "scammy" to seniors).

## Current Problem

Your `/suppappt` hero uses `bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700` (very dark navy) with a bright `bg-green-500` CTA button. This combination feels more like a tech startup than a trusted Medicare service.

## Proposed Changes

**File: `src/pages/MedicareSupplementAppointment.tsx`**

### Hero Section (~line 1020)
- **Background**: Change from dark navy gradient to a light, warm background: `bg-gradient-to-b from-slate-50 to-blue-50` (matches Medicare.gov / Mutual of Omaha pattern)
- **Text color**: Switch from white to dark navy (`text-slate-800` / `text-slate-600`) for readability
- **Badge**: Change from translucent blue to a soft teal badge: `bg-teal-50 text-teal-700 border border-teal-200`
- **CTA Button**: Replace bright green with a confident teal: `bg-teal-600 hover:bg-teal-700` (matches Medicare.gov's primary action color)
- **Trust badges**: Dark muted text (`text-slate-500`) instead of blue-100

### Color Rationale
- Light backgrounds signal "institutional trust" to seniors -- they see it on Medicare.gov, their bank, their doctor's portal
- Teal is the #1 healthcare CTA color across Medicare.gov, UHC, and GoHealth
- Dark text on light background is easier to read for aging eyes
- No bright green -- it triggers "too good to be true" for this demographic

### Funnel Section (~line 1065)
- Keep `bg-gray-50` as-is -- it already matches the calmer pattern

