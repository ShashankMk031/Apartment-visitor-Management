import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        // Pure high-end Gatekeeper Neumorphic panel structure
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-[24px] bg-[#F5F2EE] text-sm text-[#2A2825] shadow-[6px_6px_14px_rgba(0,0,0,0.13),_-6px_-6px_14px_rgba(255,255,255,0.85)] border border-black/[0.02] [--card-spacing:--spacing(5)] has-data-[slot=card-footer]:pb-0 data-[size=sm]:rounded-[18px] data-[size=sm]:[--card-spacing:--spacing(3.5)] data-[size=sm]:has-data-[slot=card-footer]:pb-0",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-(--card-spacing) pt-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-sans text-[16px] font-bold tracking-tight text-[#2A2825] group-data-[size=sm]/card:text-[14px]",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[13px] text-[#6B6760] font-medium leading-relaxed", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-center justify-self-end pl-2",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing) pb-(--card-spacing) text-[#6B6760] font-normal leading-relaxed", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        // Debossed/Inset footer panel giving a beautiful physical step breakdown look
        "flex items-center bg-[#E8E4DD]/50 px-(--card-spacing) py-4 border-t border-black/[0.04] shadow-[inset_0px_2px_4px_rgba(0,0,0,0.03)]",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}