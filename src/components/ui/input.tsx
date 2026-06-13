import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // High-end debossed physical input socket design tracking .neu-inset variables
        "h-10 w-full min-w-0 rounded-[14px] border-0 bg-[#E8E4DD] px-3.5 py-2 text-sm font-medium text-[#2A2825] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),_inset_-2px_-2px_5px_rgba(255,255,255,0.75)] transition-all outline-none placeholder:text-[#9E9B96] placeholder:font-normal",
        // Soft outer focus ring accentuation that doesn't ruin the physical depth illusion
        "focus-visible:ring-2 focus-visible:ring-[#4E8079]/20 focus-visible:bg-[#EBEBE6]",
        // File type modifier treatment matching the aesthetic parameters
        "file:inline-flex file:h-6 file:items-center file:rounded-[8px] file:border-0 file:bg-[#F5F2EE] file:px-2.5 file:text-xs file:font-bold file:text-[#4E8079] file:shadow-[1px_1px_3px_rgba(0,0,0,0.08)] file:mr-2",
        // Accessible error parameters maintaining strict neumorphic values
        "aria-invalid:bg-[#F7F0E6] aria-invalid:text-[#B07A3E] aria-invalid:ring-2 aria-invalid:ring-[#B07A3E]/10",
        // State actions
        "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }