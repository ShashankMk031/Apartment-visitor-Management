import DashboardShell from '@/components/layout/DashboardShell';

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
