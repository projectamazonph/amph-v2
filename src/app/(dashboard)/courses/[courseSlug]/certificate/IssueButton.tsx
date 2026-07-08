'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { issueCertificateAction } from '@/app/actions/certificates';

export function IssueButton({
  courseSlug,
  eligible,
}: {
  courseSlug: string;
  eligible: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await issueCertificateAction({ courseSlug });
      if (result.success) {
        router.refresh();
      } else {
        // Most likely a race — completion became true between the SSR check
        // and the click. Refresh the page to re-evaluate.
        router.refresh();
      }
    });
  }

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      loading={isPending}
      disabled={!eligible}
    >
      Issue my certificate now
    </Button>
  );
}
