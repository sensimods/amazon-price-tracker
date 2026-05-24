import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar - always visible on lg+ */}
      <Sidebar className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col" />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Navbar />
        <main className="flex-1 overflow-x-hidden p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}