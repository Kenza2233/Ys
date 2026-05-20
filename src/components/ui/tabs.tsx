import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = ({ children, defaultValue, className, ...props }: any) => {
  const [value, setValue] = React.useState(defaultValue)
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value, setValue })
        }
        return child
      })}
    </div>
  )
}

const TabsList = ({ children, className, value, setValue, ...props }: any) => {
  const triggers = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child)
  ) as React.ReactElement<any>[];

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = triggers.findIndex((t) => t.props.value === value);
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
        setValue(triggers[nextIndex].props.value);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % triggers.length;
        setValue(triggers[nextIndex].props.value);
      }
    };

    const el = document.querySelector('[data-tabs-list]');
    if (el) {
        el.addEventListener('keydown', handleKeyDown as any);
    }
    return () => el?.removeEventListener('keydown', handleKeyDown as any);
  }, [value, setValue, triggers]);

  return (
    <div
      data-tabs-list
      tabIndex={0}
      className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring", className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeValue: value, setValue })
        }
        return child
      })}
    </div>
  )
}

const TabsTrigger = ({ children, value, activeValue, setValue, className, ...props }: any) => {
  const isActive = activeValue === value
  return (
    <button
      onClick={() => setValue(value)}
      tabIndex={-1}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ children, value, activeValue, className, ...props }: any) => {
  if (value !== activeValue) return null
  return (
    <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)} {...props}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
