import * as React from "react"

 import { cn } from "../../lib/utils.ts"

 interface InputProps extends React.ComponentProps<"input"> {
  withBorder?: boolean;
 }

 const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, withBorder = true, ...props }, ref) => {
  const borderClasses = withBorder ? "border border-input" : "border-none";
  return (
   <input
    type={type}
    className={cn(
     "flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
     borderClasses, // Aplica las clases de borde condicionalmente
     className
    )}
    ref={ref}
    {...props}
   />
  )
  }
 )
 Input.displayName = "Input"

 export { Input }