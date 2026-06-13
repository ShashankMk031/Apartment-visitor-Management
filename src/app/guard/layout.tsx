import DashboardShell from '@/components/layout/DashboardShell';

export default function GuardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
