"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        // Replicating GateKeeper live status elements
        success: (
          <div className="relative flex size-4 items-center justify-center">
            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-[#4E8079] opacity-75" />
            <CircleCheckIcon className="relative size-4 text-[#4E8079]" />
          </div>
        ),
        info: (
          <InfoIcon className="size-4 text-[#2A2825]" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-[#B07A3E]" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-[#B07A3E]" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-[#9E9B96]" />
        ),
      }}
      style={
        {
          // Direct styling integration using pure design tokens
          "--normal-bg": "#F5F2EE",
          "--normal-text": "#2A2825",
          "--normal-border": "rgba(0, 0, 0, 0.02)",
          "--border-radius": "16px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          // Soft tactile overlay plates that look stunning stacked or swiped
          toast: "cn-toast group flex items-center gap-3.5 w-full bg-[#F5F2EE] text-[#2A2825] p-4 rounded-[16px] shadow-[4px_4px_12px_rgba(0,0,0,0.12),_-4px_-4px_12px_rgba(255,255,255,0.85)] border border-black/[0.01] font-sans text-xs font-semibold",
          description: "text-[#6B6760] font-medium text-[11px] leading-normal",
          // Physical inset styling parameters on action parameters
          actionButton: "bg-[#E8E4DD] text-[#2A2825] px-3 py-1.5 h-7 rounded-[10px] text-[11px] font-bold shadow-[2px_2px_5px_rgba(0,0,0,0.06),_-2px_-2px_5px_rgba(255,255,255,0.7)] active:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)] transition-all",
          cancelButton: "bg-transparent text-[#9E9B96] hover:text-[#2A2825] text-[11px] font-semibold transition-colors",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }