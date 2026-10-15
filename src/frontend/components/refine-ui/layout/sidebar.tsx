"use client";

import React from "react";
import {
  useMenu,
  useLink,
  useLogout,
  useGetIdentity,
  type TreeMenuItem,
} from "@refinedev/core";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent as ShadcnSidebarContent,
  SidebarHeader as ShadcnSidebarHeader,
  SidebarFooter as ShadcnSidebarFooter,
} from "@/frontend/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/frontend/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/frontend/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { ThemeToggle } from "@/frontend/components/refine-ui/theme/theme-toggle";
import { Button } from "@/frontend/components/ui/button";
import { ChevronRight, ListIcon, Settings, LogOut } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { IDENTITY_UPDATED_EVENT } from "@/backend/api";

export function Sidebar() {
  const { menuItems, selectedKey } = useMenu();

  return (
    <ShadcnSidebar
      collapsible="offcanvas"
      className={cn("border-r", "border-sidebar-border", "bg-sidebar")}
    >
      <SidebarHeader />
      <ShadcnSidebarContent
        className={cn("flex", "flex-col", "gap-1.5", "px-3", "py-4")}
      >
        {menuItems.map((item: TreeMenuItem) => (
          <SidebarItem
            key={item.key || item.name}
            item={item}
            selectedKey={selectedKey}
          />
        ))}
      </ShadcnSidebarContent>
      <SidebarFooter />
    </ShadcnSidebar>
  );
}


function SidebarHeader() {
  return (
    <ShadcnSidebarHeader
      className={cn(
        "h-16",
        "flex-row",
        "items-center",
        "gap-2.5",
        "border-b",
        "border-sidebar-border",
        "px-5"
      )}
    >
      <img
        src="/logo-mark.png"
        alt="WrapMate"
        className={cn("h-8", "w-8", "shrink-0", "object-contain")}
      />
      <h2 className={cn("text-base", "font-bold", "tracking-tight")}>
        WrapMate
      </h2>
    </ShadcnSidebarHeader>
  );
}


type FooterIdentity = {
  username?: string;
  displayName?: string;
  role?: string;
  avatar?: string;
};

function getUserInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function capitalize(value?: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function SidebarFooter() {
  const Link = useLink();
  const { data: identity, refetch } = useGetIdentity<FooterIdentity>();
  const { mutate: logout } = useLogout();

  React.useEffect(() => {
    const handler = () => refetch?.();
    window.addEventListener(IDENTITY_UPDATED_EVENT, handler);
    return () => window.removeEventListener(IDENTITY_UPDATED_EVENT, handler);
  }, [refetch]);

  const displayName =
    identity?.displayName || identity?.username || "User";
  const role = capitalize(identity?.role);
  const avatar = identity?.avatar;

  return (
    <ShadcnSidebarFooter
      className={cn(
        "mt-auto",
        "gap-3",
        "border-t",
        "border-sidebar-border",
        "bg-sidebar",
        "p-3"
      )}
    >
      <div className={cn("flex", "items-center", "gap-2.5")}>
        <Avatar className={cn("h-9", "w-9", "shrink-0")}>
          {avatar && <AvatarImage src={avatar} alt={displayName} />}
          <AvatarFallback
            className={cn(
              "bg-sidebar-primary",
              "text-sidebar-primary-foreground",
              "text-xs",
              "font-semibold"
            )}
          >
            {getUserInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        <div
          className={cn("flex", "min-w-0", "flex-1", "flex-col", "leading-tight")}
        >
          <span className={cn("truncate", "text-sm", "font-semibold")}>
            {displayName}
          </span>
          {role && (
            <span className={cn("truncate", "text-xs", "text-muted-foreground")}>
              {role}
            </span>
          )}
        </div>

        <ThemeToggle className={cn("h-9", "w-9", "shrink-0")} />
      </div>

      <div className={cn("flex", "items-center", "justify-between", "gap-2")}>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={cn(
            "flex",
            "items-center",
            "gap-2",
            "text-muted-foreground",
            "hover:bg-sidebar-accent",
            "hover:text-sidebar-accent-foreground"
          )}
        >
          <Link to="/settings">
            <Settings className={cn("h-4", "w-4", "shrink-0")} />
            <span>Settings</span>
          </Link>
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              aria-label="Logout"
              className={cn(
                "h-9",
                "w-9",
                "shrink-0",
                "justify-center",
                "p-0",
                "text-muted-foreground",
                "hover:bg-sidebar-accent",
                "hover:text-sidebar-accent-foreground"
              )}
            >
              <LogOut className={cn("h-4", "w-4")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Logout</TooltipContent>
        </Tooltip>
      </div>
    </ShadcnSidebarFooter>
  );
}


type MenuItemProps = {
  item: TreeMenuItem;
  selectedKey?: string;
};

function SidebarItem({ item, selectedKey }: MenuItemProps) {
  if (item.meta?.group) {
    return <SidebarItemGroup item={item} selectedKey={selectedKey} />;
  }

  if (item.children && item.children.length > 0) {
    return <SidebarItemCollapsible item={item} selectedKey={selectedKey} />;
  }

  return <SidebarItemLink item={item} selectedKey={selectedKey} />;
}

function SidebarItemGroup({ item, selectedKey }: MenuItemProps) {
  const { children } = item;

  return (
    <div className={cn("border-t", "border-sidebar-border", "pt-4", "mt-2")}>
      <span
        className={cn(
          "ml-3",
          "mb-1",
          "block",
          "text-xs",
          "font-semibold",
          "uppercase",
          "text-muted-foreground"
        )}
      >
        {getDisplayName(item)}
      </span>
      {children && children.length > 0 && (
        <div className={cn("flex", "flex-col", "gap-1.5")}>
          {children.map((child: TreeMenuItem) => (
            <SidebarItem
              key={child.key || child.name}
              item={child}
              selectedKey={selectedKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarItemCollapsible({ item, selectedKey }: MenuItemProps) {
  const { name, children } = item;

  const chevronIcon = (
    <ChevronRight
      className={cn(
        "h-4",
        "w-4",
        "shrink-0",
        "text-muted-foreground",
        "transition-transform",
        "duration-200",
        "group-data-[state=open]:rotate-90"
      )}
    />
  );

  return (
    <Collapsible key={`collapsible-${name}`} className={cn("w-full", "group")}>
      <CollapsibleTrigger asChild>
        <SidebarButton item={item} rightIcon={chevronIcon} />
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("ml-6", "mt-1.5", "flex", "flex-col", "gap-1.5")}>
        {children?.map((child: TreeMenuItem) => (
          <SidebarItem
            key={child.key || child.name}
            item={child}
            selectedKey={selectedKey}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarItemLink({ item, selectedKey }: MenuItemProps) {
  const isSelected = item.key === selectedKey;
  return <SidebarButton item={item} isSelected={isSelected} asLink={true} />;
}

function getDisplayName(item: TreeMenuItem) {
  return item.meta?.label ?? item.label ?? item.name;
}

type IconProps = {
  icon: React.ReactNode;
  isSelected?: boolean;
};

function ItemIcon({ icon, isSelected }: IconProps) {
  return (
    <div
      className={cn("w-4", "shrink-0", {
        "text-muted-foreground": !isSelected,
        "text-sidebar-primary-foreground": isSelected,
      })}
    >
      {icon ?? <ListIcon />}
    </div>
  );
}

type SidebarButtonProps = React.ComponentProps<typeof Button> & {
  item: TreeMenuItem;
  isSelected?: boolean;
  rightIcon?: React.ReactNode;
  asLink?: boolean;
  onClick?: () => void;
};

function SidebarButton({
  item,
  isSelected = false,
  rightIcon,
  asLink = false,
  className,
  onClick,
  ...props
}: SidebarButtonProps) {
  const Link = useLink();

  const buttonContent = (
    <>
      <ItemIcon icon={item.meta?.icon ?? item.icon} isSelected={isSelected} />
      <span
        className={cn("tracking-[-0.00875rem]", {
          "flex-1": rightIcon,
          "text-left": rightIcon,
          "line-clamp-1": !rightIcon,
          truncate: !rightIcon,
          "font-normal": !isSelected,
          "font-semibold": isSelected,
          "text-sidebar-primary-foreground": isSelected,
          "text-foreground": !isSelected,
        })}
      >
        {getDisplayName(item)}
      </span>
      {rightIcon}
    </>
  );

  return (
    <Button
      asChild={!!(asLink && item.route)}
      variant="ghost"
      size="lg"
      className={cn(
        "flex w-full items-center justify-start gap-2.5 py-2 !px-3 text-sm rounded-md h-11",
        {
          "bg-sidebar-primary": isSelected,
          "hover:!bg-sidebar-primary/90": isSelected,
          "text-sidebar-primary-foreground": isSelected,
          "hover:text-sidebar-primary-foreground": isSelected,
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground":
            !isSelected,
        },
        className
      )}
      onClick={onClick}
      {...props}
    >
      {asLink && item.route ? (
        <Link to={item.route} className={cn("flex w-full items-center gap-2.5")}>
          {buttonContent}
        </Link>
      ) : (
        buttonContent
      )}
    </Button>
  );
}

Sidebar.displayName = "Sidebar";
