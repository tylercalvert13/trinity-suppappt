

# Fix: Payment Input Losing Focus on Keystroke

## Problem

The `StepCard` component is defined **inside** the `MedicareSupplementReport` component function (line 505). Every time you type a character, `formData` state updates, triggering a re-render. On each re-render, a brand-new `StepCard` function is created. React treats it as a completely different component type, so it **unmounts and remounts** the entire card -- destroying the input element and its focus.

This same issue affects the Age, Zip, First Name, and Phone inputs too (any step where you type into a field inside `StepCard`).

## Fix

Move `StepCard` and `BinaryChoice` **outside** the `MedicareSupplementReport` component so they are stable references that don't get recreated on every render.

Since `StepCard` currently calls `getStepNumber()` and `getProgress()` (which depend on component state), we'll pass those as props instead.

### Changes to `src/pages/MedicareSupplementReport.tsx`

1. **Extract `StepCard`** to a component defined outside `MedicareSupplementReport`, accepting `stepNumber`, `totalSteps`, and `progress` as props
2. **Extract `BinaryChoice`** the same way (it already receives `onYes`/`onNo` -- no changes needed, just move it outside)
3. **Update all usages** of `StepCard` to pass the new props: `<StepCard stepNumber={getStepNumber()} totalSteps={10} progress={getProgress()}>`

This is a small, focused change that fixes the input focus issue across all typing steps in the funnel.

