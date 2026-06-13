"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-3 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center text-[#6B6760] transition-all outline-none select-none group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        // High-end carved control console track with realistic inner depths
        default: 
          "bg-[#E8E4DD] p-1 rounded-[16px] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08),_inset_-2px_-2px_5px_rgba(255,255,255,0.7)] border border-black/[0.01]",
        // Flat organic tab line framework 
        line: 
          "gap-2 bg-transparent rounded-none border-b border-black/[0.06] pb-1 data-[variant=line]:rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative flex items-center justify-center gap-2 whitespace-nowrap px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 outline-none select-none group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        
        // Default Variant: Trigger emerges visually from its tray using micro-drop elevations
        "group-data-[variant=default]/tabs-list:rounded-[12px] group-data-[variant=default]/tabs-list:text-[#6B6760] group-data-[variant=default]/tabs-list:data-active:bg-[#F5F2EE] group-data-[variant=default]/tabs-list:data-active:text-[#4E8079] group-data-[variant=default]/tabs-list:data-active:shadow-[2px_2px_6px_rgba(0,0,0,0.08),_-2px_-2px_6px_rgba(255,255,255,0.9)]",
        
        // Line Variant: Employs a crisp tactile typography model
        "group-data-[variant=line]/tabs-list:text-[#9E9B96] group-data-[variant=line]/tabs-list:data-active:text-[#2A2825] group-data-[variant=line]/tabs-list:px-2 group-data-[variant=line]/tabs-list:py-1",
        
        // Interactive Underline Markers mapping to GateKeeper visual confirmations
        "after:absolute after:bg-[#4E8079] after:opacity-0 after:transition-all after:duration-200",
        "group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:inset-x-2 group-data-horizontal/tabs:after:h-[2.5px] group-data-horizontal/tabs:after:rounded-full group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        "group-data-vertical/tabs:after:right-[-5px] group-data-vertical/tabs:after:inset-y-2 group-data-vertical/tabs:after:w-[2.5px] group-data-vertical/tabs:after:rounded-full group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "flex-1 text-sm font-medium leading-relaxed text-[#6B6760] outline-none transition-all duration-200 data-[state=inactive]:opacity-0 data-[state=active]:animate-in data-[state=active]:fade-in-30",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }