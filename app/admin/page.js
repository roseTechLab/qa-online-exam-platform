'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { defaultExam } from '../../lib/defaultExam';
import AppShell from '../../components/AppShell';
import Card from '../../components/Card';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [exam, setExam] = useState(defaultExam);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState({
    type: 'mcq',
    category: 'QA Standards',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    sampleAnswer: '',
  });

  const adminEmails = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
    return raw.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && adminEmails.includes((currentUser.email || '').toLowerCase())) {
        const submissionQuery = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
        const result = await getDocs(submissionQuery);
        setSubmissions(result.docs.map((item) => ({ id: item.id, ...item.data() })));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [adminEmails]);

  async function saveExam() {
    await setDoc(doc(db, 'settings', 'currentExam'), { ...exam, updatedAt: serverTimestamp() });
    alert('Exam settings saved.');
  }

  function addQuestion() {
    if (!newQuestion.question.trim()) return;
    const preparedQuestion = {
      id: `q-${Date.now()}`,
      type: newQuestion.type,
      category: newQuestion.category,
      question: newQuestion.question,
      ...(newQuestion.type === 'mcq'
        ? {
            options: newQuestion.options.filter(Boolean),
            correctAnswer: newQuestion.correctAnswer,
          }
        : {
            sampleAnswer: newQuestion.sampleAnswer,
          }),
    };

    setExam((prev) => ({ ...prev, questions: [...prev.questions, preparedQuestion] }));
    setNewQuestion({ type: 'mcq', category: 'QA Standards', question: '', options: ['', '', '', ''], correctAnswer: '', sampleAnswer: '' });
  }

  function removeQuestion(id) {
    setExam((prev) => ({ ...prev, questions: prev.questions.filter((q) => q.id !== id) }));
  }

  if (loading) {
    return <AppShell><Card><p>Loading...</p></Card></AppShell>;
  }

  if (!user || !adminEmails.includes((user.email || '').toLowerCase())) {
    return <AppShell><Card><p>Admin access only. Sign in with an allowed admin email from the home page.</p></Card></AppShell>;
  }

  return (
    <AppShell>
      <div style={{ display: 'grid', gap: 24 }}>
        <Card style={{ background: 'linear-gradient(135deg, #0f172a, #334155)', color: 'white', border: 'none' }}>
          <h1 style={{ marginTop: 0 }}>Admin / Examiner Dashboard</h1>
          <p style={{ marginBottom: 0 }}>Edit the exam, add questions, and review submissions.</p>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Card>
            <h2 style={{ marginTop: 0 }}>Exam Settings</h2>
            <label>Exam Title<input style={inputStyle} value={exam.title} onChange={(e) => setExam({ ...exam, title: e.target.value })} /></label>
            <label>Description<textarea style={{ ...inputStyle, minHeight: 110 }} value={exam.description} onChange={(e) => setExam({ ...exam, description: e.target.value })} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>Duration (minutes)<input type="number" style={inputStyle} value={exam.durationMinutes} onChange={(e) => setExam({ ...exam, durationMinutes: Number(e.target.value) })} /></label>
              <label>Passing Score (%)<input type="number" style={inputStyle} value={exam.passingScore} onChange={(e) => setExam({ ...exam, passingScore: Number(e.target.value) })} /></label>
            </div>
            <button onClick={saveExam} style={primaryButton}>Save Exam</button>
          </Card>

          <Card>
            <h2 style={{ marginTop: 0 }}>Add Question</h2>
            <label>Question Type
              <select style={inputStyle} value={newQuestion.type} onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}>
                <option value="mcq">Multiple Choice</option>
                <option value="essay">Essay</option>
              </select>
            </label>
            <label>Category<input style={inputStyle} value={newQuestion.category} onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })} /></label>
            <label>Question<textarea style={{ ...inputStyle, minHeight: 100 }} value={newQuestion.question} onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })} /></label>

            {newQuestion.type === 'mcq' ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {newQuestion.options.map((option, index) => (
                  <label key={index}>Option {index + 1}<input style={inputStyle} value={option} onChange={(e) => {
                    const next = [...newQuestion.options];
                    next[index] = e.target.value;
                    setNewQuestion({ ...newQuestion, options: next });
                  }} /></label>
                ))}
                <label>Correct Answer<input style={inputStyle} value={newQuestion.correctAnswer} onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })} /></label>
              </div>
            ) : (
              <label>Guide Answer<textarea style={{ ...inputStyle, minHeight: 100 }} value={newQuestion.sampleAnswer} onChange={(e) => setNewQuestion({ ...newQuestion, sampleAnswer: e.target.value })} /></label>
            )}
            <button onClick={addQuestion} style={primaryButton}>Add Question</button>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Card>
            <h2 style={{ marginTop: 0 }}>Current Questions</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {exam.questions.map((question, index) => (
                <div key={question.id} style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <strong>Q{index + 1}. {question.question}</strong>
                      <div style={{ color: '#475569', fontSize: 14 }}>{question.category} · {question.type}</div>
                    </div>
                    <button onClick={() => removeQuestion(question.id)} style={secondaryButton}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 style={{ marginTop: 0 }}>Submissions</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {submissions.length === 0 ? <p style={{ margin: 0 }}>No submissions yet.</p> : submissions.map((submission) => (
                <div key={submission.id} style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
                  <strong>{submission.email}</strong>
                  <div style={{ color: '#475569', fontSize: 14, marginTop: 6 }}>Score: {submission.score}%</div>
                  <div style={{ marginTop: 12, fontSize: 14 }}>
                    {Object.entries(submission.answers || {}).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: 6 }}><strong>{key}:</strong> {String(value)}</div>
                    ))}
                  </div>
                </div>
              ))}
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
  marginBottom: 12,
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box',
};

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
  padding: '10px 14px',
  borderRadius: 14,
  cursor: 'pointer',
  fontWeight: 700,
};
