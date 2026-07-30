import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { submitQuizAction } from '@/app/actions/progress';
import { evaluateCourseAccess, listActivePricingTiers } from '@/lib/tier-gate';
import { TierLock } from '@/components/dashboard/TierLock';
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

  // Tier gate — render lock screen for paid content the user cannot access.
  const gate = await evaluateCourseAccess(user.id, courseSlug);
  if (!gate.allowed) {
    const pricingTiers = await listActivePricingTiers();
    return (
      <TierLock
        gate={gate}
        courseTitle={lesson.module.course.title}
        pricingTiers={pricingTiers.map((t) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          description: t.description,
          tier: t.tier,
          pricePhp: t.pricePhp,
          features: t.features,
        }))}
      />
    );
  }

  // If ?score=N&passed=true, show result screen
  if (scoreParam !== undefined) {
    const score = parseInt(scoreParam, 10);
    const passed = passedParam === 'true';

    // The submitted answers aren't in the URL, so pull them back from the
    // attempt just written by submitQuizAction — the freshest row for this
    // user+quiz — to build a per-question review with the explanation each
    // question already carries but that the quiz form never shows.
    const attempt = await db.quizAttempt.findFirst({
      where: { userId: user.id, quizId: lesson.quiz.id },
      orderBy: { createdAt: 'desc' },
    });
    const submittedAnswers: Record<string, string> = attempt
      ? (JSON.parse(attempt.answers) as Record<string, string>)
      : {};

    return (
      <main className="container" style={{ padding: 'var(--space-8) 0', maxWidth: '720px' }}>
        <Link
          href={`/dashboard/courses/${courseSlug}/lessons/${lessonSlug}`}
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
              <Link
                href={`/dashboard/courses/${courseSlug}/lessons/${lessonSlug}`}
                className={styles.ctaPrimary}
              >
                Back to lesson
              </Link>
            ) : (
              <>
                <Link
                  href={`/dashboard/courses/${courseSlug}/lessons/${lessonSlug}`}
                  className={styles.ctaPrimary}
                >
                  Review lesson
                </Link>
                <Link
                  href={`/dashboard/courses/${courseSlug}/lessons/${lessonSlug}/quiz`}
                  className={styles.ctaSecondary}
                >
                  Try again
                </Link>
              </>
            )}
          </div>
        </Card>

        <section style={{ marginTop: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
            Answer review
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {lesson.quiz.questions.map((q) => {
              const options = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD };
              const learnerLetter = submittedAnswers[String(q.order)];
              const isCorrect = learnerLetter === q.correctAnswer;
              return (
                <Card key={q.id} padding="md" className={styles.reviewCard} data-correct={isCorrect}>
                  <CardHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <Badge variant={isCorrect ? 'success' : 'danger'}>
                        {isCorrect ? 'Correct' : 'Not quite'}
                      </Badge>
                      <CardTitle>
                        <span style={{ color: 'var(--ink-500)', marginRight: 'var(--space-2)' }}>
                          {q.order}.
                        </span>
                        {q.question}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p style={{ margin: 0 }}>
                      Your answer: <strong>{learnerLetter ?? '—'}. {learnerLetter ? options[learnerLetter as 'A' | 'B' | 'C' | 'D'] : 'Not answered'}</strong>
                    </p>
                    {!isCorrect && (
                      <p style={{ margin: 'var(--space-2) 0 0' }}>
                        Correct answer: <strong>{q.correctAnswer}. {options[q.correctAnswer as 'A' | 'B' | 'C' | 'D']}</strong>
                      </p>
                    )}
                    {q.explanation && (
                      <p style={{ margin: 'var(--space-3) 0 0', color: 'var(--ink-500)' }}>
                        {q.explanation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  // Quiz form
  return (
    <main className="container" style={{ padding: 'var(--space-8) 0', maxWidth: '720px' }}>
      <Link
        href={`/dashboard/courses/${courseSlug}/lessons/${lessonSlug}`}
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

      <form
        action={
          submitQuizAction
            .bind(null, {
              courseSlug,
              lessonSlug,
              answers: [],
              timeSpentSeconds: 0,
            }) as unknown as (formData: FormData) => Promise<void>
        }
      >
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