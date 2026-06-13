import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap tracking-wide uppercase transition-all select-none [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        // Soft elevated pill matching the Gatekeeper 'eyebrow' look
        default: 
          "bg-[#F5F2EE] text-[#4E8079] shadow-[2px_2px_5px_rgba(0,0,0,0.1),_-2px_-2px_5px_rgba(255,255,255,0.85)]",
        // Inset/debossed tactile pill style
        secondary:
          "bg-[#E8E4DD] text-[#6B6760] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.12),_inset_-1px_-1px_3px_rgba(255,255,255,0.8)]",
        // Subtle alert/destructive tone honoring neumorphic parameters
        destructive:
          "bg-[#F7F0E6] text-[#B07A3E] shadow-[1px_1px_4px_rgba(0,0,0,0.08),_-1px_-1px_4px_rgba(255,255,255,0.9)]",
        // Clean neutral border replacement using dual outer dimensions
        outline:
          "bg-[#F0EDE8] text-[#2A2825] border border-black/5 shadow-[2px_2px_4px_rgba(0,0,0,0.06)]",
        ghost:
          "bg-transparent text-[#9E9B96] opacity-80",
        link: 
          "text-[#4E8079] underline underline-offset-4 hover:opacity-80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }