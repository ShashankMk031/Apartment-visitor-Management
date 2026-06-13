"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      // Carved/sunken platform slot holding the record logs secure
      className="relative w-full overflow-x-auto rounded-[20px] bg-[#E8E4DD]/40 p-1.5 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.08),_inset_-2px_-2px_6px_rgba(255,255,255,0.7)] border border-black/[0.01]"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-xs font-medium text-[#2A2825]", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      // Crisp subtle baseline to frame key metrics perfectly
      className={cn("[&_tr]:border-b [&_tr]:border-black/[0.06] [&_tr]:hover:bg-transparent", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        // Inset summary step pane at the foot of records
        "border-t border-black/[0.06] bg-[#E8E4DD]/70 font-bold [&>tr]:last:border-b-0 text-[#2A2825]",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        // Soft gradient dividers across the horizontal ledger lines
        "border-b border-black/[0.03] transition-all duration-150 hover:bg-[#F0EDE8]/60 has-aria-expanded:bg-[#F0EDE8]/80 data-[state=selected]:bg-[#E8E4DD]",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-3.5 text-left align-middle font-bold tracking-wider text-[#9E9B96] uppercase whitespace-nowrap [&:has([role=checkbox])]:pr-0 select-none text-[10px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-3.5 align-middle whitespace-nowrap font-variant-numeric-tabular-nums text-[#6B6760] group-hover/table-row:text-[#2A2825] [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-3 text-[11px] font-medium text-[#9E9B96] tracking-wide px-2", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}