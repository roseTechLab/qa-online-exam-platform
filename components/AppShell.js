export default function AppShell({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 20px' }}>{children}</div>
    </div>
  );
}
