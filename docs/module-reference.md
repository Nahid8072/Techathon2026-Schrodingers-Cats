# JavaScript Module Reference

This document describes every JavaScript-family module in this repository (TypeScript, TSX, and JS) for developer onboarding.

## Scope

Included modules:
- Application source modules in src
- Generated router module in src/routeTree.gen.ts
- Tooling/config modules: eslint.config.js, vite.config.ts

## End-to-End Data Flow

1. Application startup uses src/start.ts and src/server.ts for request handling and SSR error normalization.
2. src/router.tsx creates router state and query client context using src/routeTree.gen.ts.
3. src/routes/__root.tsx mounts global providers (auth + simulation) and gate-keeps protected routes.
4. Route modules (src/routes/*.tsx) consume context and compose kernel components.
5. Simulation state originates in src/hooks/useSimulation.ts using seed data from src/lib/devices.ts.
6. Visual components display derived state; user actions (toggle/login/settings/report export) feed back through context, local state, and localStorage.

## Module Catalog

### 1) Bootstrap, Server, Routing, and Config Modules

| Module | Purpose | Responsibilities | Public functions | Dependencies | Data flow |
|---|---|---|---|---|---|
| src/start.ts | TanStack Start bootstrap | Create start instance and register server middleware for errors | startInstance | @tanstack/react-start, src/lib/error-page.ts | Request -> middleware -> next handler or fallback HTML response |
| src/server.ts | SSR/server entry wrapper | Lazy-load server entry, normalize swallowed 500 JSON responses, return fallback error page | default export (fetch handler object) | src/lib/error-capture.ts, src/lib/error-page.ts, @tanstack/react-start/server-entry | Request -> handler.fetch -> response normalization -> browser |
| src/router.tsx | Router factory | Build router with route tree and query client context | getRouter | @tanstack/react-router, @tanstack/react-query, src/routeTree.gen.ts | App init -> QueryClient + Router -> route rendering context |
| src/routeTree.gen.ts | Generated file-route registry | Register route modules and type mappings for TanStack Router | FileRoutesByFullPath, FileRoutesByTo, FileRoutesById, FileRouteTypes, RootRouteChildren, routeTree | src/routes/* | Route files -> generated tree -> router creation |
| vite.config.ts | Build/runtime configuration | Configure Lovable TanStack Vite integration and server entry mapping | default export | @lovable.dev/vite-tanstack-config | Tooling config -> Vite/TanStack build/runtime behavior |
| eslint.config.js | Lint configuration | Configure TypeScript/React lint rules and formatting integration | default export | @eslint/js, typescript-eslint, react hooks/refresh plugins, prettier config | Source files -> linting pipeline -> diagnostics |

### 2) Route Modules

| Module | Purpose | Responsibilities | Public functions | Dependencies | Data flow |
|---|---|---|---|---|---|
| src/routes/__root.tsx | App shell and providers | Define HTML shell, metadata, error/not-found boundaries, QueryClientProvider, AuthProvider, SimulationProvider, auth gate | Route | @tanstack/react-router, @tanstack/react-query, react, src/lib/auth.tsx, src/lib/simulation-context.tsx, src/lib/lovable-error-reporting.ts | Router context -> providers -> Outlet children; auth state decides redirect vs route rendering |
| src/routes/index.tsx | Dashboard page | Compose top-level dashboard with KPIs, floor map, room cards, charts, alerts panel, office-hours card | Route | @tanstack/react-router, kernel components, src/lib/simulation-context.tsx, src/lib/devices.ts | useSim data -> dashboard components -> user toggle actions -> simulation state updates |
| src/routes/login.tsx | Login page | Render login form, validate through auth context, redirect to target route on success | Route | @tanstack/react-router, react, lucide-react, src/lib/auth.tsx | Form input -> auth.login -> auth state -> navigation |
| src/routes/devices.tsx | Device management page | Filter/search devices, render table rows, per-device toggle, bulk visible-device shutdown | Route | @tanstack/react-router, react, lucide-react, src/lib/simulation-context.tsx, src/lib/devices.ts, kernel layout components | useSim devices -> filtered view -> toggle action -> simulation state |
| src/routes/alerts.tsx | Alerts page | Filter alerts by severity, acknowledge and dismiss in UI state | Route | @tanstack/react-router, react, lucide-react, src/lib/simulation-context.tsx, src/lib/devices.ts | useSim alerts -> local ack/dismiss sets -> rendered list |
| src/routes/analytics.tsx | Analytics page | Compute and render power KPIs, chart sections, top consumers, type breakdown | Route | @tanstack/react-router, react, lucide-react, recharts via kernel charts, src/lib/simulation-context.tsx | useSim devices/stats -> derived analytics -> chart/card rendering |
| src/routes/reports.tsx | Reporting page | Render summary stats and export current device snapshot CSV | Route | @tanstack/react-router, lucide-react, src/lib/simulation-context.tsx, src/lib/devices.ts | useSim devices/stats -> CSV blob generation -> browser download |
| src/routes/settings.tsx | Settings page | Manage local profile fields and dashboard preferences, theme toggle, office hours, notification flags, simulation reset | Route | @tanstack/react-router, react, lucide-react, src/lib/auth.tsx, src/lib/utils.ts | Form/toggle input -> local state + localStorage -> UI updates |

### 3) Domain Components (src/components/kernel)

| Module | Purpose | Responsibilities | Public functions | Dependencies | Data flow |
|---|---|---|---|---|---|
| src/components/kernel/Sidebar.tsx | Main sidebar navigation | Render route links, active state, static badge, logout action | Sidebar | @tanstack/react-router, src/lib/auth.tsx, src/lib/utils.ts, lucide-react | Router pathname + auth.logout -> nav UI and route transitions |
| src/components/kernel/TopBar.tsx | Header bar | Render branding, live clock stamp, user menu, sign-out action | TopBar | react, @tanstack/react-router, src/hooks/useClock.ts, src/lib/auth.tsx, lucide-react | Clock/auth state -> header UI -> logout navigation |
| src/components/kernel/KpiCard.tsx | Animated KPI tile | Display metric icon, label, animated numeric value, hints/tone variants | KpiCard | src/hooks/useCountUp.ts, src/lib/utils.ts, lucide-react | Numeric prop -> count-up animation -> formatted display |
| src/components/kernel/FloorMap.tsx | Interactive floor digital twin | Render static SVG layout + device nodes, support hover tooltip and toggle interactions | FloorMap | react, src/lib/devices.ts, src/lib/utils.ts | Device list -> map projection -> user hover/click -> onToggle callback |
| src/components/kernel/RoomStatusCard.tsx | Per-room status panel | Group room devices by type, show status/power/time, trigger toggles | RoomStatusCard | src/lib/devices.ts, src/lib/utils.ts, lucide-react | Room devices -> rows -> button click -> onToggle callback |
| src/components/kernel/PowerGauge.tsx | Total-power gauge card | Render semicircular gauge, animated total, and per-room sub-cards | PowerGauge | src/hooks/useCountUp.ts, src/lib/devices.ts, lucide-react | Stats props -> gauge geometry + labels -> render |
| src/components/kernel/AlertsPanel.tsx | Dashboard alert preview | Render active alerts list and empty state | AlertsPanel | src/hooks/useSimulation.ts types, src/lib/devices.ts, src/lib/utils.ts, lucide-react | Alerts props -> severity markers + timestamps -> list UI |
| src/components/kernel/OfficeHoursCard.tsx | Office-hour status card | Determine in/out office hour state and display current time | OfficeHoursCard | src/hooks/useClock.ts, lucide-react | Current time -> inside/outside status -> card rendering |
| src/components/kernel/Charts.tsx | Shared dashboard charts | Render energy trend area chart and room comparison bar chart | EnergyTrendChart, RoomCompareChart | react, recharts | Input stats -> chart datasets -> visual components |

### 4) Hook Modules

| Module | Purpose | Responsibilities | Public functions | Dependencies | Data flow |
|---|---|---|---|---|---|
| src/hooks/useSimulation.ts | Core simulation engine | Maintain device state, tick runtime each second, random flips, derive stats and alerts | useSimulation, Alert type | react, src/lib/devices.ts | Seed devices -> periodic mutations -> derived stats/alerts -> consumers |
| src/hooks/useClock.ts | Time ticker | Expose current Date, update every second | useClock | react | Interval -> Date state -> consumers |
| src/hooks/useCountUp.ts | Number animation helper | Animate value transitions with cubic easing via requestAnimationFrame | useCountUp | react | Target value change -> eased interpolation -> displayed value |
| src/hooks/use-mobile.tsx | Breakpoint detector | Determine mobile layout state from window width and media-query changes | useIsMobile | react | Viewport/media change -> boolean state -> consumers |

### 5) Library/State/Utility Modules

| Module | Purpose | Responsibilities | Public functions | Dependencies | Data flow |
|---|---|---|---|---|---|
| src/lib/devices.ts | Device domain model and seed data | Define room/device types, build initial device list, format runtime/time utilities | RoomId, DeviceType, DeviceStatus, Device, ROOMS, roomLabel, initialDevices, formatRuntime, formatTime | none | Seed constants -> simulation initialization; formatting helpers -> UI |
| src/lib/simulation-context.tsx | Simulation context provider | Wrap app with simulation value and provide safe consumer hook | SimValue, SimulationProvider, useSim | react, src/hooks/useSimulation.ts, src/lib/devices.ts | useSimulation output -> React context -> route/component consumers |
| src/lib/auth.tsx | Authentication context | Local user persistence, login validation, logout, initials helper | AuthUser, AuthProvider, useAuth, initialsOf | react | localStorage <-> auth state -> route guards and UI |
| src/lib/utils.ts | Styling helper | Merge conditional class names with Tailwind conflict resolution | cn | clsx, tailwind-merge | Component class fragments -> merged class string |
| src/lib/error-capture.ts | Error bridge for SSR edge case | Capture recent global errors/unhandled rejections and expose short-lived retrieval | consumeLastCapturedError | none | Global error events -> captured cache -> server normalization step |
| src/lib/error-page.ts | Static fallback HTML renderer | Return error-page HTML string for 500 fallback responses | renderErrorPage | none | Error path -> HTML string -> HTTP response body |
| src/lib/lovable-error-reporting.ts | Error reporting adapter | Report caught boundary errors to Lovable event hook when present | reportLovableError | none | Error object + context -> window.__lovableEvents captureException |

### 6) UI Primitive Modules (src/components/ui)

These modules are reusable presentational primitives. They primarily wrap Radix, utility, and helper libraries with project styling.

Common data flow pattern for this group:
- Parent props/state -> primitive component props -> styled JSX wrappers
- Event callbacks flow upward through passed handlers

| Module | Purpose | Responsibilities | Public functions | Dependencies | Data flow |
|---|---|---|---|---|---|
| src/components/ui/accordion.tsx | Accordion primitive wrappers | Expose styled accordion primitives | Accordion, AccordionItem, AccordionTrigger, AccordionContent | @radix-ui/react-accordion, react, lucide-react, src/lib/utils.ts | Parent state/props -> radix accordion behavior -> rendered sections |
| src/components/ui/alert-dialog.tsx | Alert dialog wrappers | Styled confirm/cancel modal primitives | AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogPortal, AlertDialogOverlay | @radix-ui/react-alert-dialog, react, src/components/ui/button.tsx, src/lib/utils.ts | Trigger/action props -> dialog open state -> confirm/cancel handlers |
| src/components/ui/alert.tsx | Alert block component | Variant-driven alert container and text slots | Alert, AlertTitle, AlertDescription | react, class-variance-authority, src/lib/utils.ts | Variant props -> class variant mapping -> alert rendering |
| src/components/ui/aspect-ratio.tsx | Aspect ratio helper | Re-export Radix aspect ratio primitive | AspectRatio | @radix-ui/react-aspect-ratio | Ratio props -> constrained child layout |
| src/components/ui/avatar.tsx | Avatar wrappers | Styled avatar root/image/fallback primitives | Avatar, AvatarImage, AvatarFallback | @radix-ui/react-avatar, react, src/lib/utils.ts | Source/fallback props -> avatar display state |
| src/components/ui/badge.tsx | Badge component | Badge with style variants | Badge, badgeVariants, BadgeProps | react, class-variance-authority, src/lib/utils.ts | Variant props -> computed classes -> badge rendering |
| src/components/ui/breadcrumb.tsx | Breadcrumb primitives | Build breadcrumb list, items, links, separators, ellipsis | Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis | react, @radix-ui/react-slot, lucide-react, src/lib/utils.ts | Route/item props -> breadcrumb composition |
| src/components/ui/button.tsx | Button component | Styled button with variant helpers and optional slot rendering | Button, buttonVariants, ButtonProps | react, @radix-ui/react-slot, class-variance-authority, src/lib/utils.ts | Variant/size props -> class variants -> button render/events |
| src/components/ui/calendar.tsx | Calendar wrapper | Styled calendar/day button integration | Calendar, CalendarDayButton | react, react-day-picker, lucide-react, src/components/ui/button.tsx, src/lib/utils.ts | Calendar props -> day-picker state -> UI callbacks |
| src/components/ui/card.tsx | Card primitives | Styled card layout sections | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter | react, src/lib/utils.ts | Parent content props -> card section layout |
| src/components/ui/carousel.tsx | Carousel system | Embla-based carousel context, track, items, controls | Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselApi | react, embla-carousel-react, lucide-react, src/components/ui/button.tsx, src/lib/utils.ts | API/context -> embla movement -> controls and item rendering |
| src/components/ui/chart.tsx | Chart utility wrappers | Chart container/theme helpers, legend/tooltip wrappers | ChartConfig, ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent | react, recharts, src/lib/utils.ts | Chart config + dataset props -> recharts composition |
| src/components/ui/checkbox.tsx | Checkbox wrapper | Styled checkbox primitive with icon indicator | Checkbox | react, @radix-ui/react-checkbox, lucide-react, src/lib/utils.ts | Checked state/handlers -> radix checkbox behavior |
| src/components/ui/collapsible.tsx | Collapsible primitive wrappers | Re-export collapsible root/trigger/content | Collapsible, CollapsibleTrigger, CollapsibleContent | @radix-ui/react-collapsible | Open state props -> collapsible content visibility |
| src/components/ui/command.tsx | Command palette wrappers | Styled command UI and dialog embedding | Command, CommandDialog, CommandInput, CommandList, CommandItem, CommandGroup, CommandSeparator, CommandEmpty, CommandShortcut | react, cmdk, @radix-ui/react-dialog, lucide-react, src/components/ui/dialog.tsx, src/lib/utils.ts | Input/filter state -> command results -> selection actions |
| src/components/ui/context-menu.tsx | Context menu wrappers | Styled right-click menu primitives and submenus | ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuGroup, ContextMenuPortal, ContextMenuRadioGroup | react, @radix-ui/react-context-menu, lucide-react, src/lib/utils.ts | Trigger + menu state -> item callbacks |
| src/components/ui/dialog.tsx | Dialog wrappers | Styled modal dialog primitives | Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose, DialogPortal, DialogOverlay | react, @radix-ui/react-dialog, lucide-react, src/lib/utils.ts | Open state/trigger -> modal lifecycle -> actions |
| src/components/ui/drawer.tsx | Drawer wrappers | Styled bottom/side drawer primitives based on Vaul | Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, DrawerClose, DrawerPortal, DrawerOverlay | react, vaul, src/lib/utils.ts | Open state -> drawer mount/transition -> user actions |
| src/components/ui/dropdown-menu.tsx | Dropdown wrappers | Styled dropdown menu primitives and submenu variants | DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuRadioGroup | react, @radix-ui/react-dropdown-menu, lucide-react, src/lib/utils.ts | Trigger/open state -> menu item callbacks |
| src/components/ui/form.tsx | Form field helpers | React Hook Form context bridge with label/control/message slots | Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField | react, @radix-ui/react-label, @radix-ui/react-slot, src/components/ui/label.tsx, src/lib/utils.ts | RHF field state -> context -> form UI feedback |
| src/components/ui/hover-card.tsx | Hover card wrappers | Styled hover-card root/trigger/content primitives | HoverCard, HoverCardTrigger, HoverCardContent | react, @radix-ui/react-hover-card, src/lib/utils.ts | Hover events -> open state -> popup content |
| src/components/ui/input-otp.tsx | OTP input wrappers | Styled segmented OTP input and slot components | InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator | react, input-otp, lucide-react, src/lib/utils.ts | Input sequence -> slot rendering -> value callbacks |
| src/components/ui/input.tsx | Text input component | Styled input element wrapper | Input | react, src/lib/utils.ts | Value/handlers props -> input element updates |
| src/components/ui/label.tsx | Label wrapper | Styled label primitive | Label | react, @radix-ui/react-label, class-variance-authority, src/lib/utils.ts | Label props -> semantic/form labeling |
| src/components/ui/menubar.tsx | Menubar wrappers | Styled menubar primitives with submenu and shortcuts | Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioGroup, MenubarRadioItem, MenubarLabel, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubTrigger, MenubarSubContent, MenubarGroup, MenubarPortal | react, @radix-ui/react-menubar, lucide-react, src/lib/utils.ts | Menu state -> item actions and navigation |
| src/components/ui/navigation-menu.tsx | Navigation menu wrappers | Styled navigation menu primitives and trigger style helper | NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, NavigationMenuIndicator, NavigationMenuViewport, navigationMenuTriggerStyle | react, @radix-ui/react-navigation-menu, class-variance-authority, lucide-react, src/lib/utils.ts | Trigger/open state -> nav panel rendering |
| src/components/ui/pagination.tsx | Pagination components | Build pagination container, links, prev/next, ellipsis | Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis | react, lucide-react, src/components/ui/button.tsx, src/lib/utils.ts | Pagination props -> nav link/button rendering |
| src/components/ui/popover.tsx | Popover wrappers | Styled popover root/anchor/trigger/content | Popover, PopoverTrigger, PopoverContent, PopoverAnchor | react, @radix-ui/react-popover, src/lib/utils.ts | Trigger/open state -> floating content |
| src/components/ui/progress.tsx | Progress bar wrapper | Styled progress primitive | Progress | react, @radix-ui/react-progress, src/lib/utils.ts | Value props -> indicator width rendering |
| src/components/ui/radio-group.tsx | Radio group wrappers | Styled radio-group and radio-item components | RadioGroup, RadioGroupItem | react, @radix-ui/react-radio-group, lucide-react, src/lib/utils.ts | Selected value -> item checked state |
| src/components/ui/resizable.tsx | Resizable panel wrappers | Styled panel group, panel, and resize handle | ResizablePanelGroup, ResizablePanel, ResizableHandle | react-resizable-panels, lucide-react, src/lib/utils.ts | Drag gestures -> panel size state -> layout updates |
| src/components/ui/scroll-area.tsx | Scroll area wrappers | Styled scrollable viewport and scrollbar | ScrollArea, ScrollBar | react, @radix-ui/react-scroll-area, src/lib/utils.ts | Content overflow -> scrollbar rendering/interaction |
| src/components/ui/select.tsx | Select wrappers | Styled select primitives, content, items, and controls | Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton | react, @radix-ui/react-select, lucide-react, src/lib/utils.ts | Selected value/open state -> options display -> change callback |
| src/components/ui/separator.tsx | Separator wrapper | Styled horizontal/vertical separator primitive | Separator | react, @radix-ui/react-separator, src/lib/utils.ts | Orientation props -> separator rendering |
| src/components/ui/sheet.tsx | Sheet wrappers | Styled side-sheet primitives built on dialog primitives | Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetClose, SheetPortal, SheetOverlay | react, @radix-ui/react-dialog, class-variance-authority, lucide-react, src/lib/utils.ts | Open state -> panel render -> close actions |
| src/components/ui/sidebar.tsx | Generic sidebar framework | Provide sidebar context, layout, menu primitives, trigger, skeleton and submenus | SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarRail, SidebarHeader, SidebarFooter, SidebarSeparator, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupAction, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, SidebarMenuBadge, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarInput, useSidebar | react, @radix-ui/react-slot, class-variance-authority, lucide-react, src/hooks/use-mobile.tsx, src/components/ui/*, src/lib/utils.ts | Sidebar state/context -> responsive behavior -> menu rendering and interactions |
| src/components/ui/skeleton.tsx | Loading skeleton | Render placeholder shimmer block | Skeleton | src/lib/utils.ts | Parent loading state -> skeleton placeholder render |
| src/components/ui/slider.tsx | Slider wrapper | Styled slider primitive | Slider | react, @radix-ui/react-slider, src/lib/utils.ts | Value props -> thumb/track position updates |
| src/components/ui/sonner.tsx | Toast provider wrapper | Configure and render Sonner toaster | Toaster | sonner | Toast calls -> toast UI provider rendering |
| src/components/ui/switch.tsx | Switch wrapper | Styled switch primitive | Switch | react, @radix-ui/react-switch, src/lib/utils.ts | Checked state/handler -> switch UI state |
| src/components/ui/table.tsx | Table primitives | Styled table and section wrappers | Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption | react, src/lib/utils.ts | Tabular data props -> semantic table structure |
| src/components/ui/tabs.tsx | Tabs wrappers | Styled tabs primitives | Tabs, TabsList, TabsTrigger, TabsContent | react, @radix-ui/react-tabs, src/lib/utils.ts | Selected tab state -> active panel rendering |
| src/components/ui/textarea.tsx | Textarea wrapper | Styled textarea component | Textarea | react, src/lib/utils.ts | Value/handlers props -> textarea updates |
| src/components/ui/toggle-group.tsx | Toggle group wrappers | Styled toggle-group primitives | ToggleGroup, ToggleGroupItem | react, @radix-ui/react-toggle-group, class-variance-authority, src/components/ui/toggle.tsx, src/lib/utils.ts | Selected toggles -> group/item state rendering |
| src/components/ui/toggle.tsx | Toggle wrapper | Styled toggle primitive and variant helper | Toggle, toggleVariants | react, @radix-ui/react-toggle, class-variance-authority, src/lib/utils.ts | Pressed state -> variant classes -> UI |
| src/components/ui/tooltip.tsx | Tooltip wrappers | Styled tooltip provider/trigger/content primitives | TooltipProvider, Tooltip, TooltipTrigger, TooltipContent | react, @radix-ui/react-tooltip, src/lib/utils.ts | Hover/focus events -> tooltip visibility |

## Local Storage and Persistence Touchpoints

- src/lib/auth.tsx
  - kernel.auth.user
- src/routes/settings.tsx
  - kernel.prefs

## Notes for New Developers

- src/routeTree.gen.ts is generated and should not be manually edited.
- Most business behavior lives in hook/context/lib modules and route modules.
- src/components/ui modules are reusable primitives; kernel modules compose app-specific UI/behavior.
- There is no backend API integration in the current codebase; data is simulated client-side.
