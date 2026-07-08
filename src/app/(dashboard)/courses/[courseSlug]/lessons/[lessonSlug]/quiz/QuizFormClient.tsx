'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { submitQuizAction } from '@/app/actions/progress';
import { Toast } from '@/components/ui/Toast';

interface Question {
  id: string;
  order: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export function QuizFormClient({
  courseSlug,
  lessonSlug,
  questions,
}: {
  courseSlug: string;
  lessonSlug: string;
  questions: Question[];
}) {
  const router = useRouter();
  const { toast } = Toast.useToast();
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [isPending, startTransition] = useTransition();

  const allAnswered = questions.every((q) => answers[String(q.order)]);

  async function handleSubmit(formData: FormData) {
    const result = await submitQuizAction({
      courseSlug,
      lessonSlug,
      answers,
      timeSpentSeconds: 0,
    });
    if (result.success) {
      const params = new URLSearchParams({
        score: String(result.data.score),
        passed: String(result.data.passed),
      });
      router.push(`/dashboard/courses/${courseSlug}/lessons/${lessonSlug}/quiz?${params}`);
      router.refresh();
      if (result.data.passed) toast('Quiz passed!', 'success');
    } else {
      toast(result.error, 'error');
    }
  }

  const wrappedAction = () =>
    startTransition(() => handleSubmit(new FormData()));

  return (
    <form action={wrappedAction}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {questions.map((q) => (
          <Card key={q.id} padding="md">
            <CardHeader>
              <CardTitle>
                <span style={{ color: 'var(--ink-500)', marginRight: 'var(--space-2)' }}>
                  {q.order}.
                </span>
                {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                  if (letter === 'D' && !q.optionD) return null;
                  const option = q[`option${letter}` as keyof Question] as string;
                  const selected = answers[String(q.order)] === letter;
                  return (
                    <label
                      key={letter}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3)',
                        background: selected ? 'var(--accent-soft)' : 'var(--surface-1)',
                        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all var(--duration-fast) var(--ease-out)',
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${q.order}`}
                        value={letter}
                        checked={selected}
                        onChange={() => setAnswers((prev) => ({ ...prev, [String(q.order)]: letter }))}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <span style={{ fontWeight: 600, minWidth: '20px' }}>{letter}.</span>
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>
          {Object.keys(answers).length} of {questions.length} answered
        </span>
        <Button type="submit" variant="primary" size="lg" disabled={!allAnswered} loading={isPending}>
          Submit answers
        </Button>
      </div>
    </form>
  );
}