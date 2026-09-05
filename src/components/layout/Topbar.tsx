import type { ReactNode } from "react";

interface TopbarProps {
  title: string;
  rightSlot?: ReactNode;
}

export function Topbar({ title, rightSlot }: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-primary-100 bg-white px-6">
      <h1 className="text-sm font-semibold text-primary-900">{title}</h1>
      {rightSlot}
    </header>
  );
}
