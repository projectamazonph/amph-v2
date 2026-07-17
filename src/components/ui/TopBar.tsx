import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { signOutFormAction } from '@/app/actions/auth';
import type { SessionUser } from '@/lib/auth';
import styles from './TopBar.module.css';

export function TopBar({ user }: { user: SessionUser }) {
  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <Link href="/" className={styles.viewSite} target="_blank">
          <Icon name="List" size="sm" />
          View site
        </Link>
      </div>

      <div className={styles.right}>
        <div className={styles.user}>
          <span className={styles.userName}>{user.name ?? user.email}</span>
          <span className={styles.userRole}>
            {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
          </span>
        </div>

        <form action={signOutFormAction}>
          <button type="submit" className={styles.signOut} aria-label="Sign out">
            <Icon name="SignOut" size="md" />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}