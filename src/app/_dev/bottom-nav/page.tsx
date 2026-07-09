import { BottomNav } from '@/components/ui/BottomNav';

export default function BottomNavPreview() {
  const slots = ['home', 'courses', 'tools', 'profile'] as const;

  return (
    <div style={{ padding: 'var(--space-8)', maxWidth: 'var(--max-form)' }}>
      <h1 style={{ marginBottom: 'var(--space-6)' }}>BottomNav Preview</h1>
      <p style={{ color: 'var(--ink-500)', marginBottom: 'var(--space-8)' }}>
        Fixed bottom nav for mobile. Visible at &lt;1024px, hidden on desktop.
        Each variant shows a different active state.
      </p>

      {slots.map((slot) => (
        <div key={slot} style={{ marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active: {slot}
          </h2>
          <div style={{ position: 'relative', height: '80px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <BottomNav active={slot} />
          </div>
        </div>
      ))}
    </div>
  );
}
