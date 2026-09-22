"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GitBranch,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";

import { GitAidIcon } from "../icons/gitaid-icon";

import { ModeToggle } from "@/components/ui/mode-toggle";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { isDashboardNavActive } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";


/* =========================================================
   APP SHELL
   ========================================================= */

export function AppShell({
  children,
  title,
  description,
  actions,
  hideHeader = false,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  hideHeader?: boolean;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">

        {/* =================================================
            SIDEBAR HEADER
            ================================================= */}

        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<Link href="/dashboard" />}
                tooltip="GitAid"
              >
                <BrandMark />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>


        {/* =================================================
            SIDEBAR CONTENT
            ================================================= */}

        <SidebarContent>

          {/* ---------------- Workspace ---------------- */}

          <SidebarGroup>
            <SidebarGroupLabel>
              Workspace
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>

                {/* Overview */}

                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/dashboard" />}
                    isActive={isDashboardNavActive(
                      pathname,
                      "/dashboard"
                    )}
                    tooltip="Overview"
                  >
                    <LayoutDashboard />
                    <span>Overview</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>


                {/* Repositories */}

                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/repositories" />}
                    isActive={isDashboardNavActive(
                      pathname,
                      "/repositories"
                    )}
                    tooltip="Repositories"
                  >
                    <GitBranch />
                    <span>Repositories</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>


          {/* ---------------- Account ---------------- */}

          <SidebarGroup>
            <SidebarGroupLabel>
              Account
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/settings" />}
                    isActive={isDashboardNavActive(
                      pathname,
                      "/settings"
                    )}
                    tooltip="Settings"
                  >
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>


        {/* =================================================
            USER MENU
            ================================================= */}

        <UserMenu />

      </Sidebar>


      {/* ===================================================
          MAIN CONTENT
          =================================================== */}

      <SidebarInset>

        {!hideHeader && (
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">

            <div className="flex min-w-0 flex-1 items-center gap-3">

              <div className="min-w-0">

                {title && (
                  <h1 className="truncate text-lg font-semibold">
                    {title}
                  </h1>
                )}

                {description && (
                  <p className="truncate text-sm text-muted-foreground">
                    {description}
                  </p>
                )}

              </div>

            </div>


            <div className="flex items-center gap-2">
              {actions}
              <ModeToggle />
            </div>

          </header>
        )}


        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </main>

      </SidebarInset>

    </SidebarProvider>
  );
}


/* =========================================================
   USER MENU
   ========================================================= */

function UserMenu() {
  const router = useRouter();

  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const displayName = user?.displayName ?? "User";

  const initials =
    displayName.charAt(0).toUpperCase();


  const handleLogout = () => {
    logout.mutate();
  };


  return (
    <SidebarFooter>
      <SidebarMenu>

        <SidebarMenuItem>

          <DropdownMenu>

            {/* =================================================
                USER TRIGGER

                The entire bottom user card is clickable.
                ================================================= */}

            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className={cn(
                    "h-14",
                    "data-[state=open]:bg-sidebar-accent",
                    "data-[state=open]:text-sidebar-accent-foreground"
                  )}
                />
              }
            >

              <Avatar className="size-8 rounded-lg">

                <AvatarImage
                  src={user?.avatarUrl ?? ""}
                  alt={displayName}
                />

                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>

              </Avatar>


              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">

                <span className="truncate font-semibold">
                  {displayName}
                </span>

                <span className="truncate text-xs text-muted-foreground">
                  @{displayName}
                </span>

              </div>

            </DropdownMenuTrigger>


            {/* =================================================
                DROPDOWN
                ================================================= */}

            <DropdownMenuContent
  className="w-56 rounded-lg"
  side="top"
  align="end"
  sideOffset={8}
>
  <DropdownMenuGroup>
    <DropdownMenuLabel className="font-normal">
      <div className="flex items-center gap-3">
        <Avatar className="size-9 rounded-lg">
          <AvatarImage
            src={user?.avatarUrl ?? ""}
            alt={displayName}
          />

          <AvatarFallback className="rounded-lg">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">
            {displayName}
          </span>

          <span className="truncate text-xs text-muted-foreground">
            Connected via GitHub
          </span>
        </div>
      </div>
    </DropdownMenuLabel>
  </DropdownMenuGroup>

  <DropdownMenuSeparator />

  <DropdownMenuItem
    onClick={() => router.push("/settings")}
  >
    <Settings />
    <span>Settings</span>
  </DropdownMenuItem>

  <DropdownMenuSeparator />

  <DropdownMenuItem
    onClick={handleLogout}
    disabled={logout.isPending}
  >
    <LogOut />

    <span>
      {logout.isPending ? "Logging out..." : "Log out"}
    </span>
  </DropdownMenuItem>
</DropdownMenuContent>

          </DropdownMenu>

        </SidebarMenuItem>

      </SidebarMenu>
    </SidebarFooter>
  );
}


/* =========================================================
   BRAND
   ========================================================= */

export function BrandMark({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 font-semibold tracking-tight",
        className
      )}
    >
      <GitAidIcon className="size-8 rounded-[10px]" />

      <span className="font-heading text-[1.05rem] leading-none">
        GitAid
      </span>
    </div>
  );
}