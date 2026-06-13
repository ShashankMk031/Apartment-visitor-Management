"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

const Select = SelectPrimitive.Root

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1.5", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 items-center text-left font-medium text-[#2A2825]", className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // High-tactile component base structure matching Button/Input mechanics
        "flex w-full items-center justify-between gap-1.5 rounded-[14px] bg-[#F5F2EE] px-3.5 text-sm font-semibold text-[#2A2825] transition-all duration-150 outline-none select-none border border-black/[0.01]",
        // Active visual state transitions smoothly into debossed physical depth
        "shadow-[3px_3px_8px_rgba(0,0,0,0.1),_-3px_-3px_8px_rgba(255,255,255,0.85)] hover:shadow-[4px_4px_10px_rgba(0,0,0,0.12)] data-[popup-open]:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.12),_inset_-2px_-2px_5px_rgba(255,255,255,0.8)]",
        "disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-[#9E9B96] data-[popup-open]:[&_svg]:text-[#2A2825]",
        size === "sm" && "h-8 rounded-[10px] px-2.5 text-xs [--sz:3.5]",
        size === "default" && "h-10 [--sz:4]",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="ml-auto flex items-center justify-center transition-transform duration-200 group-data-[popup-open]/select-trigger:rotate-180">
        <ChevronDownIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 6,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            // Premium neumorphic container plate matching DropdownMenu standards
            "z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-[16px] bg-[#F5F2EE] p-1.5 text-[#2A2825] shadow-[5px_5px_15px_rgba(0,0,0,0.12),_-5px_-5px_15px_rgba(255,255,255,0.85)] border border-black/[0.02] duration-150 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-98 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-98",
            className
          )}
          {...props}
        />
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // Dynamic micromanaged inset states upon pointer-focus events
        "group/select-item relative flex w-full cursor-default items-center rounded-[10px] py-2 pr-8 pl-3.5 text-xs font-semibold text-[#6B6760] transition-all outline-none select-none focus:bg-[#E8E4DD] focus:text-[#2A2825] focus:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06),_inset_-1px_-1px_3px_rgba(255,255,255,0.6)] data-disabled:pointer-events-none data-disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-3 flex items-center justify-center text-[#4E8079]">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="stroke-[2.5]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(
        "px-3.5 py-1.5 text-[10px] font-bold tracking-widest text-[#9E9B96] uppercase",
        className
      )}
      {...props}
    />
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none -mx-1.5 my-1.5 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent",
        className
      )}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-[#F5F2EE] py-1 text-[#9E9B96] [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-[#F5F2EE] py-1 text-[#9E9B96] [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}