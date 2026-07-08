'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import {
  registerForLiveClass,
  cancelLiveClassRegistration,
} from '@/app/actions/live-classes';
import styles from './register-button.module.css';

export function RegisterButton({
  classId,
  isRegistered,
  isFull,
  tierAllowed,
}: {
  classId: string;
  isRegistered: boolean;
  isFull: boolean;
  tierAllowed: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleRegister() {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await registerForLiveClass({ classId });
      if (result.success) {
        router.refresh();
      } else {
        setErrorMessage(result.error);
      }
    });
  }

  function handleCancel() {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await cancelLiveClassRegistration({ classId });
      if (result.success && result.data.cancelled) {
        router.refresh();
      } else if (!result.success) {
        setErrorMessage(result.error);
      }
    });
  }

  if (isFull && !isRegistered) {
    return (
      <Button variant="secondary" disabled>
        Class is full
      </Button>
    );
  }

  if (!tierAllowed && !isRegistered) {
    return (
      <Button variant="secondary" disabled>
        Ultimate tier required
      </Button>
    );
  }

  return (
    <div className={styles.wrapper}>
      {isRegistered ? (
        <Button
          variant="secondary"
          onClick={handleCancel}
          loading={isPending}
          leftIcon={<Icon name="X" />}
        >
          Cancel registration
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={handleRegister}
          loading={isPending}
          leftIcon={<Icon name="Calendar" />}
        >
          Reserve my seat
        </Button>
      )}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
    </div>
  );
}
