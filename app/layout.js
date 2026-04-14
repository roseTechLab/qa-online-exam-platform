export const metadata = {
  title: 'Junior QA Exam Platform',
  description: 'Online exam portal for junior QA testers',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif' }}>{children}</body>
    </html>
  );
}
