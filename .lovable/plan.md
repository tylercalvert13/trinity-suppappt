

# Add Mobile Spacing + Medicare Disclaimer to /report Footer

## Changes

Two updates to `src/pages/MedicareSupplementReport.tsx`:

### 1. Add mobile spacer above footer
Add a `50vh` spacer div before the footer (matching the pattern used on `/supp`, `/supp1`, `/quote` pages). This pushes the footer well below the fold so the form/content sits at the top of the screen on mobile without the footer crowding the view.

```
<div className="h-[50vh]" />
```

### 2. Expand footer with Medicare/CMS disclaimer
Replace the current minimal 2-line footer with a proper disclaimer footer matching other funnel pages. This adds:
- Free rate comparison service disclaimer
- CMS-required language: "Health Helpers is not connected with or endorsed by the U.S. government or the federal Medicare program. Medicare Supplement insurance is sold by private insurance companies."
- Quoted rates disclaimer
- Privacy Policy and Terms of Service links (already present, just restyled to match)

The footer will keep the stone color palette to stay consistent with the report's editorial style.

### Technical Detail

All changes are in `src/pages/MedicareSupplementReport.tsx`, lines 1169-1183:
- Insert spacer div before footer
- Replace the minimal footer with expanded disclaimer footer

