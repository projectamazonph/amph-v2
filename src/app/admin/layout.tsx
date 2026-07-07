import { requireAdmin } from '@/lib/auth';
import { NavSidebar } from '@/components/ui/NavSidebar';
import { TopBar } from '@/components/ui/TopBar';
import { ToastProvider } from '@/components/ui/Toast';
import styles from './layout.module.css';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireAdmin redirects to / if not authenticated + admin.
  // Middleware also enforces this at the edge.
  const user = await requireAdmin();

  return (
    <ToastProvider>
      <div className={styles.shell}>
        <NavSidebar />
        <div className={styles.main}>
          <TopBar user={user} />
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}