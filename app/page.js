'use client';

import { useEffect, useMemo, useState } from 'react';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { defaultExam } from '../lib/defaultExam';
import AppShell from '../components/AppShell';
import Card from '../components/Card';

const actionCodeSettings = {
  url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`,
  handleCodeInApp: true,
};

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [examReady, setExamReady] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setExamReady(!!nextUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function completeMagicLinkSignIn() {
      if (!isSignInWithEmailLink(auth, window.location.href)) return;

      let storedEmail = window.localStorage.getItem('emailForSignIn');
      if (!storedEmail) {
        storedEmail = window.prompt('Please confirm your email to complete sign-in');
      }
      if (!storedEmail) return;

      const result = await signInWithEmailLink(auth, storedEmail, window.location.href);
      window.localStorage.removeItem('emailForSignIn');

      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          name: window.localStorage.getItem('pendingName') || 'Examinee',
          role: 'examinee',
          createdAt: serverTimestamp(),
        });
      }
      window.localStorage.removeItem('pendingName');
      setMessage('Access link verified. You can now start the exam.');
    }

    completeMagicLinkSignIn().catch((error) => {
      console.error(error);
      setMessage('Could not complete sign-in. Please request a new access link.');
    });
  }, []);

  const adminEmails = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
    return raw.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  }, []);

  async function handleSendLink(event) {
    event.preventDefault();
    setIsSending(true);
    setMessage('');

    try {
      window.localStorage.setItem('emailForSignIn', email);
      window.localStorage.setItem('pendingName', name || 'Examinee');
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      setMessage(`Access link sent to ${email}. Open it from your email to access the exam.`);
    } catch (error) {
  console.error('Access link error:', error);
  setMessage(`${error.code} - ${error.message}`);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AppShell>
      <div style={{ display: 'grid', gap: 24 }}>
        <Card style={{ background: 'linear-gradient(135deg, #0f172a, #334155)', color: 'white', border: 'none' }}>
          <h1 style={{ fontSize: 42, marginTop: 0, marginBottom: 12 }}>QA Online Exam Platform</h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, margin: 0, color: '#e2e8f0' }}>
            Access your exam securely, complete it within the allocated time, and submit your responses.
          </p>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24 }}>
          <Card>
            <h2 style={{ marginTop: 0 }}>Examinee Access</h2>
            {!user ? (
              <form onSubmit={handleSendLink} style={{ display: 'grid', gap: 16 }}>
                <label>
                  Full Name
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" style={inputStyle} />
                </label>
                <label>
                  Email
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" style={inputStyle} required />
                </label>
                <button disabled={isSending} style={primaryButton}>{isSending ? 'Sending...' : 'Send Access Link'}</button>
                {message && <p style={{ margin: 0, color: '#0f766e' }}>{message}</p>}
              </form>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                <p style={{ margin: 0 }}><strong>Signed in as:</strong> {user.email}</p>
                <a href="/exam" style={{ ...primaryButton, textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>Start Exam</a>
                {adminEmails.includes((user.email || '').toLowerCase()) && (
                  <a href="/admin" style={{ ...secondaryButton, textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>Open Admin Dashboard</a>
                )}
                <button onClick={() => signOut(auth)} style={secondaryButton}>Sign Out</button>
              </div>
            )}
          </Card>

          <Card>
            <h2 style={{ marginTop: 0 }}>Instructions</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Enter your name and email address.</li>
              <li>Click <strong>Send Access Link</strong>.</li>
              <li>Open the sign-in link sent to your email.</li>
              <li>You will be redirected to the portal to begin your exam.</li>
              <li>Once submitted, a confirmation screen will verify that your responses have been recorded.</li>
            </ol>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <strong>Default Exam Set</strong>
              <p style={{ marginBottom: 0, fontStyle: 'italic' }}>Standard Assessment Template</p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

const inputStyle = {
  width: '100%',
  marginTop: 8,
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box',
};

const primaryButton = {
  background: '#0f172a',
  color: 'white',
  border: 'none',
  padding: '14px 18px',
  borderRadius: 16,
  cursor: 'pointer',
  fontWeight: 700,
};

const secondaryButton = {
  background: 'white',
  color: '#0f172a',
  border: '1px solid #cbd5e1',
  padding: '14px 18px',
  borderRadius: 16,
  cursor: 'pointer',
  fontWeight: 700,
};
