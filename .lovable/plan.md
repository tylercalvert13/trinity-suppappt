

## Align Browser Pixel Event Name to "Appointment"

Currently the browser pixel fires `'Schedule'` while CAPI fires `'Appointment'` for booking events. This mismatch prevents Facebook from deduplicating the two signals. The fix: change the browser pixel event name from `'Schedule'` to `'Appointment'` in all 3 funnel pages.

### Changes

**1. `src/pages/MedicareSupplementAppointment.tsx`** (line 177)
- Change `trackPixelEvent('Schedule', ...)` to `trackPixelEvent('Appointment', ...)`

**2. `src/pages/MedicareSupplementAppointment2.tsx`** (line 153)
- Change `trackPixelEvent('Schedule', ...)` to `trackPixelEvent('Appointment', ...)`

**3. `src/pages/MedicareSupplementAppointmentRefund.tsx`** (line 223)
- Change `trackPixelEvent('Schedule', ...)` to `trackPixelEvent('Appointment', ...)`

### Result
Both browser pixel and CAPI will send `'Appointment'` with the same `event_id`, enabling proper deduplication. No backend or edge function changes needed.

