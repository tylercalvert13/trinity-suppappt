import { useState } from "react";
import { format, subDays, startOfMonth, startOfDay, endOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRangeValue {
  from: Date | null;
  to: Date | null;
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
}

const presets = [
  { label: "Today", getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: "Last 7 Days", getRange: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
  { label: "Last 30 Days", getRange: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
  { label: "This Month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }) },
  { label: "All Time", getRange: () => ({ from: null as Date | null, to: null as Date | null }) },
];

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const displayLabel = () => {
    if (!value.from) return "All Time";
    if (!value.to || format(value.from, "MM/dd") === format(value.to, "MM/dd")) {
      return format(value.from, "MMM d");
    }
    return `${format(value.from, "MMM d")} – ${format(value.to, "MMM d")}`;
  };

  const selected: DateRange | undefined =
    value.from ? { from: value.from, to: value.to ?? value.from } : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 min-h-[44px] px-4"
        >
          <CalendarIcon className="h-4 w-4 mr-1" />
          {displayLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center" sideOffset={8}>
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-row sm:flex-col gap-1 p-3 border-b sm:border-b-0 sm:border-r overflow-x-auto sm:overflow-visible">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="justify-start whitespace-nowrap text-xs"
                onClick={() => {
                  onChange(preset.getRange());
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={selected}
            onSelect={(range) => {
              onChange({ from: range?.from ?? null, to: range?.to ?? null });
            }}
            numberOfMonths={1}
            className={cn("p-3 pointer-events-auto")}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
