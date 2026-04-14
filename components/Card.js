export default function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 24,
        padding: 24,
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
        border: '1px solid #e2e8f0',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
