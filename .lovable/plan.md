

## Mobile Optimization for /advantage Funnel

### Current State
The funnel already looks decent on mobile -- cards are responsive, text scales, buttons are full-width. But there are several refinements needed, especially since the target audience is seniors (65+) who benefit from larger touch targets and clearer visual hierarchy.

### Changes (all in `src/pages/MedicareAdvantage.tsx`)

**1. Landing Page -- Full Viewport Height**
- Make the hero section fill the viewport on mobile (`min-h-[100dvh]` with flex centering) so the "Get Started" button is always visible without scrolling, and the footer doesn't awkwardly peek in.
- Use `dvh` (dynamic viewport height) to account for mobile browser chrome.

**2. Larger Touch Targets for Senior Accessibility**
- Increase Yes/No button padding from `py-6` to `py-7` on mobile for bigger tap areas (matching the suppappt pattern of 18-24px targets).
- Increase checkbox label padding from `p-4` to `p-5` on the confirm step.
- Make checkboxes themselves larger (`h-5 w-5` instead of default size).

**3. Iframe Mobile Height**
- On mobile, reduce the iframe `min-h` from `600px` to `500px` since it's within a scrollable container anyway, but ensure the container itself doesn't create an unnecessarily tall blank space with the loading spinner.
- Add `-webkit-overflow-scrolling: touch` for smooth iOS scrolling within the iframe area.

**4. Sticky "Need Help?" Call CTA on Enroll Step**
- On the enroll step, add a sticky bottom bar with the phone number (similar to the sticky CTA pattern in suppappt) so seniors always have a way to call for help while navigating the Sunfire tool.

**5. Scroll Behavior Refinement**
- On the landing-to-first-step transition, scroll to top of the page (not just to the funnel ref) so the sticky progress bar is visible.
- Add `scroll-margin-top` to the question container to account for the sticky progress bar height.

**6. Text Sizing for Senior Readability**
- Bump question card body text from `text-sm` to `text-base` on mobile for better readability.
- Ensure the progress bar step indicator uses at least `text-sm` font.

### Technical Details

Only one file changes: `src/pages/MedicareAdvantage.tsx`

- Landing: add `min-h-[100dvh] flex flex-col justify-center` to the hero section
- Buttons: `py-7 md:py-6 text-lg` (larger on mobile, normal on desktop)
- Checkbox labels: `p-5 md:p-4`, checkbox size `h-5 w-5`
- Subtitle text: `text-base` instead of `text-sm`
- Question container: `scroll-mt-20` to clear sticky progress bar
- Enroll step: sticky bottom call bar on mobile (`fixed bottom-0 left-0 right-0 md:relative` with phone link)
- Iframe: keep `min-h-[500px] md:min-h-[800px]`

