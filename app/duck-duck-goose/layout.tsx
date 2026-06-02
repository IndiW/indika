export default function DuckDuckGooseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#141414' }}>
      {children}
    </div>
  );
}
