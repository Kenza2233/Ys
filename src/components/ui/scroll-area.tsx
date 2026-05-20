import * as React from "react"
import { cn } from "@/lib/utils"

const ScrollArea = ({ className, children, ...props }: any) => (
  <div className={cn("relative overflow-auto", className)} {...props}>
    {children}
  </div>
)

export { ScrollArea }
