import {
  EmailButton,
  EmailDetailBox,
  EmailDetailRow,
  EmailFootnote,
  EmailHeading,
  EmailParagraph,
  EmailShell,
} from './shared';

export interface LiveClassConfirmationEmailProps {
  studentName: string;
  classTitle: string;
  instructorName: string;
  date: string;
  time: string;
  durationMinutes: number;
  meetingUrl?: string | null;
  classesUrl: string;
}

/** Sent immediately when a student registers for a live class. */
export default function LiveClassConfirmationEmail({
  studentName,
  classTitle,
  instructorName,
  date,
  time,
  durationMinutes,
  meetingUrl,
  classesUrl,
}: LiveClassConfirmationEmailProps) {
  return (
    <EmailShell
      previewText={`You're registered for ${classTitle} — ${date}`}
      eyebrow="Project Amazon PH Academy · Live Class"
    >
      <EmailHeading>{classTitle}</EmailHeading>
      <EmailParagraph style={{ color: '#FF6B35', fontWeight: 600, margin: '-8px 0 20px' }}>
        with {instructorName}
      </EmailParagraph>
      <EmailParagraph>
        Hi {studentName}, you&apos;re registered for this live class.
      </EmailParagraph>
      <EmailDetailBox>
        <EmailDetailRow label="When" value={`${date} · ${time}`} />
        <EmailDetailRow label="Duration" value={`${durationMinutes} minutes`} />
      </EmailDetailBox>
      <EmailButton href={meetingUrl || classesUrl}>
        {meetingUrl ? 'Join the class →' : 'View class details →'}
      </EmailButton>
      <EmailFootnote>
        A recording will be available afterward if you can&apos;t make it live.
      </EmailFootnote>
    </EmailShell>
  );
}
