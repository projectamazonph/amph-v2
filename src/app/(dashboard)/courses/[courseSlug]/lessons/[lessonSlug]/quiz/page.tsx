import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, Button, Badge } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { submitQuizAction } from '@/app/actions/progress';
import styles from './quiz.module.css';

interface PageProps {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
  searchParams: Promise<{ score?: string; passed?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { lessonSlug } = await params;
  const lesson = await db.lesson.findUnique({ where: { slug: lessonSlug } });
  if (!lesson) return { title: 'Not found' };
  return { title: `${lesson.title} — Quiz` };
}

export default async function QuizPage({ params, searchParams }: PageProps) {
  const user = await requireAuth();
  const { courseSlug, lessonSlug } = await params;
  const { score: scoreParam, passed: passedParam } = await searchParams;

  const lesson = await db.lesson.findUnique({
    where: { slug: lessonSlug, isPublished: true, deletedAt: null },
    include: {
      module: { include: { course: true } },
      quiz: { include: { questions: { orderBy: { order: 'asc' } } } },
    },
  });

  if (!lesson || lesson.module.course.slug !== courseSlug) notFound();
  if (!lesson.quiz) notFound();

  // If ?score=N&passed=true, show result screen
  if (scoreParam !== undefined) {
    const score = parseInt(scoreParam, 10);
    const passed = passedParam === 'true';
    return (
      <main className="container" style={{ padding: 'var(--space-8) 0', maxWidth: '640px' }}>
        <Link
          href={`/dashboard/courses/${courseSlug}/lessons/${lessonSlug}` as never}
          style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}
        >
          ← Back to lesson
        </Link>
        <Card padding="lg" className={styles.resultCard}>
          <CardHeader>
            <div className={styles.scoreCircle} data-passed={passed}>
              {score}%
            </div>
            <CardTitle>{passed ? 'You passed' : 'Not quite'}</CardTitle>
            <CardDescription>
              {passed
                ? `Lesson complete. You scored ${score}% — above the ${lesson.quiz.passThreshold}% pass threshold.`
                : `You scored ${score}%. Pass threshold is ${lesson.quiz.passThreshold}%. Review the lesson and try again.`}
            </CardDescription>
          </CardHeader>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {passed ? (
              <Button as="a" href={`/dashboard/courses/${courseSlug}/lessons/${lessonSlug}` as never} variant="primary">
                Back to lesson
              </Button>
            ) : (
              <>
                <Button as="a" href={`/dashboard/courses/${courseSlug}/lessons/${lessonSlug}` as never} variant="primary">
                  Review lesson
                </Button>
                <Button as="a" href={`/dashboard/courses/${courseSlug}/lessons/${lessonSlug}/quiz` as never} variant="secondary">
                  Try again
                </Button>
              </>
            )}
          </div>
        </Card>
      </main>
    );
  }

  // Quiz form
  return (
    <main className="container" style={{ padding: 'var(--space-8) 0', maxWidth: '720px' }}>
      <Link
        href={`/dashboard/courses/${courseSlug}/lessons/${lessonSlug}` as never}
        style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}
      >
        ← Back to lesson
      </Link>

      <header style={{ margin: 'var(--space-3) 0 var(--space-6)' }}>
        <Badge variant="info">Knowledge check</Badge>
        <h1>{lesson.title}</h1>
        <p style={{ color: 'var(--ink-500)' }}>
          {lesson.quiz.questions.length} questions. Pass with {lesson.quiz.passThreshold}% or higher.
        </p>
      </header>

      <form action={submitQuizAction.bind(null, { courseSlug, lessonSlug, answers: {}, timeSpentSeconds: 0 })}>
        <QuizFormClient
          courseSlug={courseSlug}
          lessonSlug={lessonSlug}
          questions={lesson.quiz.questions.map((q) => ({
            id: q.id,
            order: q.order,
            question: q.question,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
          }))}
        />
      </form>
    </main>
  );
}

// Client component for the form
import { QuizFormClient } from './QuizFormClient';