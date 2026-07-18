import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, Badge } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { getToolMeta } from '@/engine/registry';
import styles from '../tools.module.css';

interface PageProps {
  params: Promise<{ tool: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { tool } = await params;
  const toolMeta = getToolMeta(tool);
  if (!toolMeta) return { title: 'Tool not found' };
  return { title: toolMeta.name };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const user = await requireAuth();
  const { tool: toolSlug } = await params;
  const toolMeta = getToolMeta(toolSlug);
  if (!toolMeta) notFound();

  return (
    <main id="main-content" className="container" style={{ padding: 'var(--space-8) 0' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <Link href="/tools" style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>
          ← All tools
        </Link>
        <h1 style={{ margin: 'var(--space-2) 0', fontSize: 'var(--text-3xl)' }}>{toolMeta.name}</h1>
        <p style={{ color: 'var(--ink-500)', maxWidth: '640px' }}>{toolMeta.description}</p>
      </header>

      <section>
        <h2 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-xl)' }}>Scenarios</h2>
        <div className={styles.scenarioGrid}>
          {toolMeta.scenarios.map((scenario) => (
            <Card key={scenario.id} variant="interactive" padding="md">
              <Link
                href={`/tools/${toolMeta.slug}/${scenario.slug}` as never}
                className={styles.toolLink}
              >
                <CardHeader>
                  <div className={styles.toolHeader}>
                    <Badge variant="default">{scenario.category}</Badge>
                    <Badge variant="info">{scenario.difficulty}</Badge>
                  </div>
                  <CardTitle>{scenario.title}</CardTitle>
                </CardHeader>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}