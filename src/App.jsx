import { useEffect, useRef, useState } from 'react';
import { Icon } from './components/Icons.jsx';
import { TestView } from './components/TestView.jsx';

const ACCENT = '#4F46E5';

function NewTestForm({ onCreate, onCancel, allowCancel }) {
  const [title, setTitle] = useState('');
  const [count, setCount] = useState(20);
  const [questionType, setQuestionType] = useState('free');
  const [optionCount, setOptionCount] = useState(4);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const presets = [10, 20, 30, 40, 50, 100];
  const optionPresets = [3, 4, 5, 6];
  const valid = title.trim().length > 0 && count > 0 && count <= 500;

  const submit = () => {
    if (!valid) return;
    onCreate({
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      totalQuestions: count,
      phase: 'answering',
      questions: [],
      createdAt: Date.now(),
      questionType,
      optionCount: questionType === 'mc' ? optionCount : null,
    });
  };

  return (
    <div className="empty">
      <div className="empty-art"><Icon.Pencil /></div>
      <h1>Start a practice test</h1>
      <p>Give it a name, set how many questions you'll answer, and we'll keep the score in real time.</p>
      <div className="newtest-card">
        <h2>New test</h2>
        <div className="field">
          <label>Test title</label>
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. SAT Reading — Section 3"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            maxLength={60}
          />
        </div>
        <div className="field">
          <label>Total questions</label>
          <input
            className="num"
            type="number"
            min="1"
            max="500"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 0)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <div className="q-presets">
            {presets.map((p) => (
              <button key={p} className={count === p ? 'active' : ''} onClick={() => setCount(p)}>
                {p} questions
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Question type</label>
          <div className="type-toggle">
            <button
              className={questionType === 'free' ? 'active' : ''}
              onClick={() => setQuestionType('free')}
            >
              Free input
            </button>
            <button
              className={questionType === 'mc' ? 'active' : ''}
              onClick={() => setQuestionType('mc')}
            >
              Multiple choice
            </button>
          </div>
        </div>
        {questionType === 'mc' && (
          <div className="field">
            <label>Options per question</label>
            <div className="q-presets">
              {optionPresets.map((p) => (
                <button key={p} className={optionCount === p ? 'active' : ''} onClick={() => setOptionCount(p)}>
                  {p} (A–{String.fromCharCode(64 + p)})
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          {allowCancel && (
            <button className="btn-ghost" style={{ flex: '0 0 auto' }} onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="btn-primary" style={{ flex: 1 }} disabled={!valid} onClick={submit}>
            <Icon.Sparkle s={16} /> Begin test
          </button>
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = 'practice-test:tests:v1';
const ACTIVE_KEY = 'practice-test:active:v1';

function tintColor(hex, mix) {
  const m = hex.replace('#', '').match(/.{2}/g);
  const [r, g, b] = m ? m.map((h) => parseInt(h, 16)) : [0, 0, 0];
  const blend = (c) => Math.round(c + (255 - c) * mix);
  return (
    '#' +
    [blend(r), blend(g), blend(b)]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
      .join('')
  );
}

export default function App() {
  const [tests, setTests] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // fall through to seed
    }
    const now = Date.now();
    const ans1 = ['A', 'C', 'B', 'D', 'A', 'C', 'B', 'A', 'D', 'C', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'A', 'D', 'B', 'A', 'C', 'B', 'D', 'A'];
    const gr1 = [true, true, false, true, true, true, false, true, true, true, true, false, true, true, true, true, true, false, true, true, true, true, true, true, true];
    const ans2 = ['B', 'D', 'A', 'C', 'B', 'D', 'A', 'B', 'C', 'D', 'A', 'C', 'B'];
    return [
      {
        id: 't-seed-1',
        title: 'AP Biology — Cell Division',
        totalQuestions: 25,
        phase: 'review',
        questions: ans1.map((a, i) => ({ answer: a, grade: gr1[i], unsure: false })),
        createdAt: now - 1000 * 60 * 60 * 24 * 2,
        questionType: 'mc',
        optionCount: 4,
      },
      {
        id: 't-seed-2',
        title: 'LSAT Logic — Set 4',
        totalQuestions: 30,
        phase: 'answering',
        questions: ans2.map((a) => ({ answer: a, grade: null, unsure: false })),
        createdAt: now - 1000 * 60 * 30,
        questionType: 'mc',
        optionCount: 5,
      },
    ];
  });

  const [activeId, setActiveId] = useState(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_KEY);
      if (stored) return stored;
    } catch {
      // ignore
    }
    return 't-seed-2';
  });

  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);
  const lastDeleted = useRef(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', ACCENT);
    document.documentElement.style.setProperty('--accent-soft', tintColor(ACCENT, 0.92));
    document.documentElement.style.setProperty('--accent-2', tintColor(ACCENT, 0.18));
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-density', 'comfy');
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) {
      document.body.classList.add('platform-mac');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
    } catch {
      // ignore quota errors
    }
  }, [tests]);

  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    } catch {
      // ignore
    }
  }, [activeId]);

  const activeTest = tests.find((t) => t.id === activeId);

  const updateTest = (next) => {
    setTests((ts) => ts.map((t) => (t.id === next.id ? next : t)));
  };

  const createTest = (test) => {
    setTests((ts) => [...ts, test]);
    setActiveId(test.id);
    setCreating(false);
  };

  const undoDelete = () => {
    if (!lastDeleted.current) return;
    const { test, index } = lastDeleted.current;
    setTests((ts) => {
      const next = [...ts];
      next.splice(index, 0, test);
      return next;
    });
    setActiveId(test.id);
    setToast(null);
    lastDeleted.current = null;
  };

  const deleteTest = (id) => {
    const idx = tests.findIndex((t) => t.id === id);
    const removed = tests[idx];
    lastDeleted.current = { test: removed, index: idx };
    const remaining = tests.filter((t) => t.id !== id);
    setTests(remaining);
    if (activeId === id) {
      setActiveId(remaining.length > 0 ? remaining[Math.max(0, idx - 1)].id : null);
    }
    setToast({ msg: `Deleted "${removed.title}"`, action: 'Undo', fn: undoDelete });
    setTimeout(() => setToast(null), 4500);
  };

  const showCreateScreen = creating || tests.length === 0 || !activeTest;

  return (
    <div className="app">
      <div className="tabbar">
        {tests.map((t) => {
          const answered = t.questions.length;
          const graded = t.questions.filter((q) => q.grade !== null).length;
          const correct = t.questions.filter((q) => q.grade === true).length;
          const pct = graded > 0 ? Math.round((correct / graded) * 100) : 0;
          const phase = t.phase;
          const isReview = phase === 'review';
          return (
            <div
              key={t.id}
              className={`tab ${activeId === t.id && !creating ? 'active' : ''} ${isReview ? 'done' : ''}`}
              onClick={() => {
                setActiveId(t.id);
                setCreating(false);
              }}
            >
              <span className={`tab-phase-dot phase-${phase}`} title={phase} />
              <span className="tab-label">{t.title}</span>
              <span className="tab-pct">
                {phase === 'answering' || phase === 'finalize'
                  ? `${answered}/${t.totalQuestions}`
                  : phase === 'grading'
                  ? `${graded}/${t.totalQuestions}`
                  : `${pct}%`}
              </span>
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTest(t.id);
                }}
                title="Delete test"
              >
                <Icon.Close />
              </button>
            </div>
          );
        })}
        <button className="tab-new" onClick={() => setCreating(true)} title="New test">
          <Icon.Plus />
        </button>
      </div>

      <div className="pane">
        <div className="pane-inner" key={creating ? 'new' : activeId}>
          {showCreateScreen ? (
            <NewTestForm
              onCreate={createTest}
              onCancel={() => setCreating(false)}
              allowCancel={tests.length > 0}
            />
          ) : (
            <TestView test={activeTest} onUpdate={updateTest} />
          )}
        </div>

        <div className={`toast ${toast ? 'show' : ''}`}>
          {toast?.msg}
          {toast?.action && <button onClick={toast.fn}>{toast.action}</button>}
        </div>
      </div>
    </div>
  );
}
