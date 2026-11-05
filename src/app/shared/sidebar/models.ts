export type SidebarRole = 'admin' | 'user';

export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

export interface MenuSection {
  label: string;
  items: MenuItem[];
}

export interface SidebarConfig {
  role: SidebarRole;
  brandName: string;
  subtitle: string;
  sections: MenuSection[];
}

export interface SidebarState {
  collapsed: boolean;
  expandedMenus: Record<string, boolean>;
}
