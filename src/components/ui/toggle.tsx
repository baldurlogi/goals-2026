import * as TogglePrimitive from "@radix-ui/react-toggle"
import * as React from "react"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/variants"

const Toggle = React.forwardRef<
  React.ComponentRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
>(({ className, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants(), className)}
    {...props}
  />
))

Toggle.displayName = "Toggle"

export { Toggle }