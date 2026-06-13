import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center bg-clip-padding font-semibold text-sm whitespace-nowrap transition-all duration-150 outline-none select-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // High-contrast, tactile main accent switch
        default: 
          "bg-[#F5F2EE] text-[#4E8079] border-0 shadow-[4px_4px_10px_rgba(0,0,0,0.12),_-4px_-4px_10px_rgba(255,255,255,0.85)] hover:shadow-[5px_5px_12px_rgba(0,0,0,0.14),_-5px_-5px_12px_rgba(255,255,255,0.9)] active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.13),_inset_-3px_-3px_7px_rgba(255,255,255,0.85)] active:text-[#3A6B65]",
        // Flat surface with clean inset debossed physical state
        outline:
          "bg-[#F0EDE8] text-[#2A2825] border-0 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),_inset_-2px_-2px_5px_rgba(255,255,255,0.7)] hover:text-black",
        // Soft standard secondary card element
        secondary:
          "bg-[#E8E4DD] text-[#6B6760] border-0 shadow-[3px_3px_8px_rgba(0,0,0,0.1),_-3px_-3px_8px_rgba(255,255,255,0.85)] active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.12)]",
        // Smooth flat hover interaction element
        ghost:
          "bg-transparent text-[#6B6760] hover:bg-[#E8E4DD] hover:text-[#2A2825] rounded-lg",
        // Muted terra-cotta dynamic alarm trigger
        destructive:
          "bg-[#F7F0E6] text-[#B07A3E] shadow-[3px_3px_8px_rgba(176,122,62,0.12),_-3px_-3px_8px_rgba(255,255,255,0.85)] active:shadow-[inset_2px_2px_5px_rgba(176,122,62,0.15)]",
        link: 
          "text-[#4E8079] underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        default: "h-9 gap-2 px-4 rounded-[14px]",
        xs: "h-6.5 gap-1 rounded-[10px] px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[12px] px-3.5 text-[0.825rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-6 rounded-[16px] text-base",
        icon: "size-9 rounded-[12px]",
        "icon-xs": "size-6.5 rounded-[8px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-[10px]",
        "icon-lg": "size-11 rounded-[14px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }