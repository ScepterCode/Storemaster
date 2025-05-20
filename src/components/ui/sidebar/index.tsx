
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext"
import { cn } from "@/lib/utils"

import { Sidebar } from "./sidebar-main"
import { SidebarTrigger, SidebarRail } from "./sidebar-controls"
import {
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
  SidebarInput,
  SidebarInset
} from "./sidebar-sections"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent
} from "./sidebar-group"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton
} from "./sidebar-menu"
import {
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "./sidebar-submenu"

// Modify the SidebarProvider to include TooltipProvider
const SidebarProviderWithTooltip = React.forwardRef<
  React.ElementRef<typeof SidebarProvider>,
  React.ComponentPropsWithoutRef<typeof SidebarProvider>
>(({ className, children, ...props }, ref) => {
  return (
    <SidebarProvider
      ref={ref}
      className={cn(
        "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
        className
      )}
      {...props}
    >
      <TooltipProvider delayDuration={0}>
        {children}
      </TooltipProvider>
    </SidebarProvider>
  )
})
SidebarProviderWithTooltip.displayName = "SidebarProvider"

// Export all components
export {
  SidebarProviderWithTooltip as SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
  SidebarInput,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar
}

