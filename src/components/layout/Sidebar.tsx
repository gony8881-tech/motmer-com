import type { ReactNode } from "react";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

interface SidebarProps {
  title: string;
  items: SidebarItem[];
}

export function Sidebar({ title, items }: SidebarProps) {
  return (
    <aside className="h-full w-64 shrink-0 border-l border-primary-100 bg-white p-4">
      <div className="mb-6 px-2 text-sm font-semibold text-primary-800">{title}</div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-md2 px-3 py-2 text-sm text-primary-700 hover:bg-primary-50"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
