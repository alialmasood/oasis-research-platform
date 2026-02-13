"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    fullName: string;
    roles: string[];
  };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar userRoles={user.roles} />
      <div className="mr-64 flex flex-1 flex-col">
        <Header userName={user.fullName} userRoles={user.roles} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
