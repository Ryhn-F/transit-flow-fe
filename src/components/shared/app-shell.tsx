import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

interface AppShellProps {
  children: React.ReactNode;
  showSearch?: boolean;
}

export function AppShell({ children, showSearch = true }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#070a11] text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-blue-500/20 selection:text-blue-400">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar showSearch={showSearch} />
        <main className="flex-1 relative overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
