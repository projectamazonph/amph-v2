import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getToolMeta, getScenarioMeta } from '@/engine/registry';
import { getScenarioBySlug as getCb } from '@/engine/campaign-builder/scenarios';
import { getScenarioBySlug as getBtv } from '@/engine/campaign-builder/btv-scenarios';
import { getScenarioBySlug as getBe } from '@/engine/bid-elevator/scenarios';
import { getScenarioBySlug as getStr } from '@/engine/str-triage/scenarios';
import { getScenarioBySlug as getLa } from '@/engine/listing-audit/scenarios';
import { getScenarioBySlug as getKr } from '@/engine/keyword-research/scenarios';
import { startToolSession } from '@/app/actions/tools';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, Badge, Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import styles from './runner.module.css';

interface PageProps {
  params: Promise<{ tool: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { tool, slug } = await params;
  const toolMeta = getToolMeta(tool);
  const scenarioMeta = getScenarioMeta(tool, slug);
  if (!toolMeta || !scenarioMeta) return { title: 'Not found' };
  return { title: `${scenarioMeta.title} — ${toolMeta.name}` };
}

export default async function ToolRunnerPage({ params }: PageProps) {
  const user = await requireAuth();
  const { tool: toolSlug, slug: scenarioSlug } = await params;

  const toolMeta = getToolMeta(toolSlug);
  const scenarioMeta = getScenarioMeta(toolSlug, scenarioSlug);
  if (!toolMeta || !scenarioMeta) notFound();

  // Resolve full scenario from the appropriate engine
  const scenario = resolveScenario(toolSlug, scenarioSlug);
  if (!scenario) notFound();

  // Start a session server-side and render the appropriate runner
  const result = await startToolSession({
    toolType: toolMeta.toolType,
    scenarioId: scenario.id,
  });

  if (!result.success) {
    return (
      <main className="container" style={{ padding: 'var(--space-8) 0' }}>
        <h1>Could not start session</h1>
        <p style={{ color: 'var(--danger)' }}>{result.error}</p>
        <Link href={`/dashboard/tools/${toolSlug}` as never}>← Back to scenarios</Link>
      </main>
    );
  }

  // Render tool-specific UI
  return (
    <main id="main-content" className="container" style={{ padding: 'var(--space-6) 0' }}>
      <Link
        href={`/dashboard/tools/${toolSlug}` as never}
        style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}
      >
        ← {toolMeta.name} scenarios
      </Link>

      <header className={styles.header}>
        <Badge variant="default">{scenario.product?.category ?? 'STR'}</Badge>
        <h1 style={{ margin: 'var(--space-2) 0' }}>{scenarioMeta.title}</h1>
        <p style={{ color: 'var(--ink-500)' }}>{(scenario as { brief?: string }).brief ?? (scenario as { context?: string }).context}</p>
      </header>

      {toolSlug === 'campaign-builder' && <CampaignBuilderRunner sessionId={result.data.sessionId} scenario={scenario as any} />}
      {toolSlug === 'bid-elevator' && <BidElevatorRunner sessionId={result.data.sessionId} scenario={scenario as any} />}
      {toolSlug === 'str-triage' && <StrTriageRunner sessionId={result.data.sessionId} scenario={scenario as any} />}
      {toolSlug === 'listing-audit' && <ListingAuditRunner sessionId={result.data.sessionId} scenario={scenario as any} />}
      {toolSlug === 'keyword-research' && <KeywordResearchRunner sessionId={result.data.sessionId} scenario={scenario as any} />}
    </main>
  );
}

function resolveScenario(toolSlug: string, scenarioSlug: string) {
  if (toolSlug === 'campaign-builder') {
    return getCb(scenarioSlug) ?? getBtv(scenarioSlug);
  }
  if (toolSlug === 'bid-elevator') return getBe(scenarioSlug);
  if (toolSlug === 'str-triage') return getStr(scenarioSlug);
  if (toolSlug === 'listing-audit') return getLa(scenarioSlug);
  if (toolSlug === 'keyword-research') return getKr(scenarioSlug);
  return null;
}

// ============================================================================
// Tool runners — stubs for Sprint 2. Full UIs in Sprint 3.
// ============================================================================

function CampaignBuilderRunner({ sessionId, scenario }: { sessionId: string; scenario: any }) {
  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Campaign Builder wizard</CardTitle>
        <CardDescription>
          The Campaign Builder UI is a 5-step wizard (campaign → bidding → ad group → targets → review).
          Engine + scoring + 5 SP scenarios + 5 BTV scenarios are live.
          UI lands in Sprint 3.
        </CardDescription>
      </CardHeader>
      <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)' }}>
        <Button variant="primary" disabled>
          Start campaign (UI in Sprint 3)
        </Button>
      </div>
    </Card>
  );
}

function BidElevatorRunner({ sessionId, scenario }: { sessionId: string; scenario: any }) {
  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Bid Elevator</CardTitle>
        <CardDescription>
          Adjust bids against the scenario's keyword performance data. UI lands in Sprint 3.
        </CardDescription>
      </CardHeader>
      <p style={{ color: 'var(--ink-500)' }}>Scenario: {scenario.title} ({scenario.keywords.length} keywords)</p>
    </Card>
  );
}

function StrTriageRunner({ sessionId, scenario }: { sessionId: string; scenario: any }) {
  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Search Term Triage</CardTitle>
        <CardDescription>
          Triage each search term: keep, pause, negate, or optimize bid. UI lands in Sprint 3.
        </CardDescription>
      </CardHeader>
      <p style={{ color: 'var(--ink-500)' }}>Scenario: {scenario.title} ({scenario.searchTerms.length} terms)</p>
    </Card>
  );
}

function ListingAuditRunner({ sessionId, scenario }: { sessionId: string; scenario: any }) {
  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Listing Audit</CardTitle>
        <CardDescription>
          Identify listing issues and revise. UI lands in Sprint 3.
        </CardDescription>
      </CardHeader>
      <p style={{ color: 'var(--ink-500)' }}>Scenario: {scenario.product.name}</p>
    </Card>
  );
}

function KeywordResearchRunner({ sessionId, scenario }: { sessionId: string; scenario: any }) {
  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Keyword Research</CardTitle>
        <CardDescription>
          Categorize keywords as primary, secondary, or negative. UI lands in Sprint 3.
        </CardDescription>
      </CardHeader>
      <p style={{ color: 'var(--ink-500)' }}>Scenario: {scenario.product.name} ({scenario.candidates.length} candidates)</p>
    </Card>
  );
}