'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { defaultExam } from '../../lib/defaultExam';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export default function ExamPage() {
  const [user, setUser] = useState(null);
  const [exam, setExam] = useState(defaultExam);
  const [answers, setAnswers] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(defaultExam.durationMinutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const examRef = doc(db, 'settings', 'currentExam');
        const examSnap = await getDoc(examRef);
        const loadedExam = examSnap.exists() ? examSnap.data() : defaultExam;
        setExam(loadedExam);
        setTimeLeft((loadedExam.durationMinutes || defaultExam.durationMinutes) * 60);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || submitted || loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [user, submitted, loading, exam]);

  const currentQuestion = exam.questions[selectedIndex];
  const progress = useMemo(() => {
    const total = exam.questions.length || 1;
    const answered = Object.values(answers).filter((value) => String(value || '').trim()).length;
    return Math.round((answered / total) * 100);
  }, [answers, exam.questions]);

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function calculateScore() {
    let totalMcq = 0;
    let correctMcq = 0;
    for (const q of exam.questions) {
      if (q.type === 'mcq') {
        totalMcq += 1;
        if (answers[q.id] === q.correctAnswer) correctMcq += 1;
      }
    }
    return totalMcq ? Math.round((correctMcq / totalMcq) * 100) : 0;
  }

  async function handleSubmit(autoSubmitted = false) {
    if (!user) return;
    const submission = {
      userId: user.uid,
      email: user.email,
      answers,
      score: calculateScore(),
      autoSubmitted,
      examTitle: exam.title,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'submissions'), submission);
    await setDoc(doc(db, 'users', user.uid), { email: user.email, lastSubmissionAt: serverTimestamp() }, { merge: true });
    setSubmitted(true);
  }

  if (loading) {
    return <AppShell><Card><p>Loading...</p></Card></AppShell>;
  }

  if (!user) {
    return <AppShell><Card><p>Please sign in from the home page first.</p></Card></AppShell>;
  }

  if (submitted) {
    return (
      <AppShell>
        <Card style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', background: '#ecfdf5', borderColor: '#a7f3d0' }}>
          <h1>Submission Confirmed</h1>
          <p>All your answers have been recorded successfully.</p>
          <p><strong>Candidate:</strong> {user.email}</p>
          <a href="/" style={{ ...primaryButton, textDecoration: 'none', display: 'inline-block' }}>Return Home</a>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        <Card style={{ height: 'fit-content', position: 'sticky', top: 20 }}>
          <h3 style={{ marginTop: 0 }}>Exam Progress</h3>
          <p><strong>Time Left:</strong> {formatTime(timeLeft)}</p>
          <p><strong>Progress:</strong> {progress}%</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {exam.questions.map((q, index) => (
              <button key={q.id} onClick={() => setSelectedIndex(index)} style={index === selectedIndex ? primaryButton : secondaryButton}>
                Q{index + 1} · {q.type.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={() => handleSubmit(false)} style={{ ...primaryButton, marginTop: 16, width: '100%' }}>Submit Exam</button>
        </Card>

        <Card>
          <h1 style={{ marginTop: 0 }}>{exam.title}</h1>
          <p>{exam.description}</p>
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />
          <p><strong>Question {selectedIndex + 1}:</strong> {currentQuestion.question}</p>

          {currentQuestion.type === 'mcq' && (
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }))}
                  style={answers[currentQuestion.id] === option ? primaryButton : secondaryButton}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'essay' && (
            <textarea
              rows={10}
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))}
              style={{ width: '100%', borderRadius: 16, border: '1px solid #cbd5e1', padding: 16, boxSizing: 'border-box' }}
              placeholder="Type your answer here"
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button disabled={selectedIndex === 0} onClick={() => setSelectedIndex((prev) => Math.max(prev - 1, 0))} style={secondaryButton}>Previous</button>
            <button disabled={selectedIndex === exam.questions.length - 1} onClick={() => setSelectedIndex((prev) => Math.min(prev + 1, exam.questions.length - 1))} style={primaryButton}>Next</button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

const primaryButton = {
  background: '#0f172a',
  color: 'white',
  border: 'none',
  padding: '12px 16px',
  borderRadius: 14,
  cursor: 'pointer',
  fontWeight: 700,
};

const secondaryButton = {
  background: 'white',
  color: '#0f172a',
  border: '1px solid #cbd5e1',
  padding: '12px 16px',
  borderRadius: 14,
  cursor: 'pointer',
  fontWeight: 700,
};
