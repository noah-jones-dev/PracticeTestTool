import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons.jsx';
import { AnimatedNumber, ScoreRing } from './AnimatedNumber.jsx';

function SliderSwitch({ state, onChange, size = 'lg' }) {
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    onChange(x < rect.width / 2 ? 'incorrect' : 'correct');
  };
  return (
    <div className="slider-wrap">
      <div className="slider-labels">
        <span className="sl-incorrect"><Icon.X s={12} /> Incorrect</span>
        <span className="sl-correct">Correct <Icon.Check s={12} /></span>
      </div>
      <div className={`slider-track ${size}`} data-state={state} onClick={handleClick}>
        <div className="slider-half left"></div>
        <div className="slider-half right"></div>
        <div className="slider-thumb">
          {state === 'incorrect' && <><Icon.X s={16} /> Incorrect</>}
          {state === 'correct' && <><Icon.Check s={16} /> Correct</>}
        </div>
      </div>
    </div>
  );
}

function StatsBlock({ correct, incorrect, total, ungraded, label }) {
  const graded = correct + incorrect;
  const pct = graded > 0 ? Math.round((correct / graded) * 100) : 0;
  const correctW = total > 0 ? (correct / total) * 100 : 0;
  const incorrectW = total > 0 ? (incorrect / total) * 100 : 0;

  return (
    <div className="stats">
      <div className="stats-row">
        <div className="stat">
          <div className="v correct"><AnimatedNumber value={correct} /></div>
          <div className="l">Correct</div>
        </div>
        <div className="stat">
          <div className="v incorrect"><AnimatedNumber value={incorrect} /></div>
          <div className="l">Incorrect</div>
        </div>
        <div className="stat" style={{ textAlign: 'center' }}>
          <div className="v">
            <AnimatedNumber value={graded} />
            <span style={{ color: 'var(--ink-3)', fontWeight: 700 }}> / {total}</span>
          </div>
          <div className="l">{label || 'Graded'}</div>
        </div>
        <div className="stat" style={{ textAlign: 'right' }}>
          <div className="v accent"><AnimatedNumber value={pct} />%</div>
          <div className="l">Accuracy</div>
        </div>
      </div>
      <div className="progressbar">
        <span className="pb-correct" style={{ width: `${correctW}%` }} />
        <span className="pb-incorrect" style={{ width: `${incorrectW}%` }} />
      </div>
      <div className="progress-legend">
        <div className="legend-pair">
          <span className="c">{correct} correct</span>
          <span className="i">{incorrect} incorrect</span>
          <span className="r">{ungraded} {label === 'Answered' ? 'left' : 'ungraded'}</span>
        </div>
      </div>
    </div>
  );
}

function QuestionNav({ total, current, getStatus, onJump }) {
  const stripRef = useRef(null);
  const [maxVisible, setMaxVisible] = useState(total);
  const [jumpVal, setJumpVal] = useState('');
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const measure = () => {
      const containerW = el.clientWidth;
      const reserve = 96;
      const chipW = 36 + 6;
      const fits = Math.max(4, Math.floor((containerW - reserve) / chipW));
      setMaxVisible(fits);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [total]);

  const overflow = total > maxVisible;
  let startIdx = 0;
  let endIdx = total;
  if (overflow) {
    const half = Math.floor(maxVisible / 2);
    startIdx = Math.max(0, Math.min(total - maxVisible, current - half));
    endIdx = startIdx + maxVisible;
  }
  const visible = [];
  for (let i = startIdx; i < endIdx; i++) visible.push(i);

  const submitJump = () => {
    const n = parseInt(jumpVal, 10);
    if (n >= 1 && n <= total) {
      onJump(n - 1);
      setJumpVal('');
      setShowJump(false);
    }
  };

  return (
    <div className="qnav" ref={stripRef}>
      <div className="qnav-strip">
        {visible.map((i) => {
          const st = getStatus(i);
          return (
            <button
              key={i}
              className={`qchip s-${st} ${i === current ? 'on' : ''}`}
              onClick={() => onJump(i)}
              title={`Question ${i + 1}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      {overflow && (
        <div className="qnav-jump">
          <button
            className="qchip qchip-ellipsis"
            onClick={() => setShowJump((s) => !s)}
            title="Jump to question"
          >
            …
          </button>
          {showJump && (
            <div className="qnav-jump-popover">
              <input
                autoFocus
                type="number"
                min="1"
                max={total}
                value={jumpVal}
                onChange={(e) => setJumpVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitJump();
                  if (e.key === 'Escape') {
                    setShowJump(false);
                    setJumpVal('');
                  }
                }}
                onBlur={() => setTimeout(() => setShowJump(false), 150)}
                placeholder={`1–${total}`}
              />
              <button
                className="qnav-go"
                onMouseDown={(e) => {
                  e.preventDefault();
                  submitJump();
                }}
              >
                Go
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnsweringPhase({ test, onUpdate, onFinishAnswering }) {
  const total = test.totalQuestions;
  const firstUnanswered = test.questions.length;
  const [cursor, setCursor] = useState(Math.min(firstUnanswered, total - 1));
  const existing = test.questions[cursor];
  const [val, setVal] = useState(existing ? existing.answer : '');
  const [bumpKey, setBumpKey] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const ex = test.questions[cursor];
    setVal(ex ? ex.answer : '');
    inputRef.current?.focus();
    setBumpKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  const submit = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    let nextQs;
    if (cursor < test.questions.length) {
      nextQs = test.questions.map((q, i) => (i === cursor ? { ...q, answer: trimmed } : q));
    } else if (cursor === test.questions.length) {
      nextQs = [...test.questions, { answer: trimmed, grade: null }];
    } else {
      return;
    }
    onUpdate({ ...test, questions: nextQs });
    const nextUnanswered = nextQs.length < total ? nextQs.length : -1;
    if (nextUnanswered !== -1 && nextUnanswered > cursor) {
      setCursor(nextUnanswered);
    } else if (cursor + 1 < total && cursor + 1 < nextQs.length) {
      setCursor(cursor + 1);
    } else if (nextQs.length >= total) {
      setTimeout(() => onFinishAnswering(), 250);
    }
  };

  const jumpTo = (i) => {
    const maxAllowed = test.questions.length;
    setCursor(Math.min(i, maxAllowed));
  };

  const getStatus = (i) => {
    if (i === cursor) return 'current';
    if (i < test.questions.length) return 'answered';
    if (i === test.questions.length) return 'next';
    return 'locked';
  };

  const undo = () => {
    if (test.questions.length === 0) return;
    onUpdate({ ...test, questions: test.questions.slice(0, -1) });
    setCursor(Math.min(cursor, test.questions.length - 1));
  };

  const answered = test.questions.length;
  const isEditing = cursor < test.questions.length;

  return (
    <div className="test-view">
      <div className="test-header">
        <div className="th-title">
          <h2>{test.title}</h2>
          <div className="sub">
            <span className="phase-chip phase-answer">Answering</span>
            Started {formatRelative(test.createdAt)} · {total} questions
          </div>
        </div>
        <div className="score-pill">
          <div>
            <div className="num"><AnimatedNumber value={answered} />/{total}</div>
            <div className="lbl">Answered</div>
          </div>
        </div>
      </div>

      <div className="answer-progressbar">
        <span style={{ width: `${(answered / total) * 100}%` }} />
      </div>

      <QuestionNav total={total} current={cursor} getStatus={getStatus} onJump={jumpTo} />

      <div className="qcard slide-enter" key={`a-${cursor}`}>
        <div className="qcard-bg" />
        <div className="q-num-wrap">
          <span className="q-num-label">{isEditing ? 'Editing question' : 'Question'}</span>
          <div className={`q-num ${bumpKey ? 'bump' : ''}`} key={bumpKey}>
            {cursor + 1}<small>/ {total}</small>
          </div>
        </div>

        <div className="answer-input-wrap">
          <label className="answer-input-label">Your answer</label>
          <input
            ref={inputRef}
            className="answer-input"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Type your answer…"
            maxLength={200}
          />
          <div className="answer-hint">
            Press <span className="kbd">↵</span> to {isEditing ? 'save & next' : 'submit and advance'}
          </div>
        </div>

        <button className="btn-confirm" disabled={!val.trim()} onClick={submit}>
          {isEditing ? 'Save & next' : cursor + 1 === total ? 'Submit & finish' : 'Submit & next'}{' '}
          <Icon.Arrow />
        </button>
      </div>

      <div className="action-row">
        <div className="left">
          <button className="btn-ghost" onClick={undo} disabled={answered === 0}>
            <Icon.Undo /> Undo last
          </button>
        </div>
        <div className="right">
          <button
            className="btn-ghost"
            onClick={onFinishAnswering}
            disabled={answered === 0}
            title={answered < total ? `Skip ahead to grading (${answered}/${total} answered)` : 'Continue to grading'}
          >
            Done answering <Icon.Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}

function GradingPhase({ test, onUpdate, onFinish }) {
  const total = test.questions.length;
  const firstUngraded = test.questions.findIndex((q) => q.grade === null);
  const [cursor, setCursor] = useState(firstUngraded === -1 ? 0 : firstUngraded);
  const [pending, setPending] = useState('neutral');
  const cardRef = useRef(null);

  const q = test.questions[cursor];
  const correct = test.questions.filter((x) => x.grade === true).length;
  const incorrect = test.questions.filter((x) => x.grade === false).length;
  const ungraded = test.questions.filter((x) => x.grade === null).length;
  const allGraded = ungraded === 0;

  useEffect(() => {
    if (!q) return;
    setPending(q.grade === true ? 'correct' : q.grade === false ? 'incorrect' : 'neutral');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  const apply = useCallback(
    (gradeState) => {
      const isCorrect = gradeState === 'correct';
      const nextQs = test.questions.map((qq, i) => (i === cursor ? { ...qq, grade: isCorrect } : qq));
      onUpdate({ ...test, questions: nextQs });
      spawnBurst(isCorrect, cardRef);
      setTimeout(() => {
        const nextIdx = nextQs.findIndex((qq, i) => i > cursor && qq.grade === null);
        if (nextIdx !== -1) setCursor(nextIdx);
        else {
          const fromStart = nextQs.findIndex((qq) => qq.grade === null);
          if (fromStart !== -1) setCursor(fromStart);
        }
      }, 250);
    },
    [test, cursor, onUpdate]
  );

  useEffect(() => {
    const handler = (e) => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPending('incorrect');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPending('correct');
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (pending !== 'neutral') apply(pending);
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        apply('correct');
      } else if (e.key.toLowerCase() === 'x') {
        e.preventDefault();
        apply('incorrect');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(total - 1, c + 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pending, cursor, total, apply]);

  if (!q) {
    return <ReviewPhase test={test} onUpdate={onUpdate} />;
  }

  return (
    <div className="test-view">
      <div className="test-header">
        <div className="th-title">
          <h2>{test.title}</h2>
          <div className="sub">
            <span className="phase-chip phase-grade">Grading</span>
            {allGraded ? 'All graded — review or finish' : `${ungraded} of ${total} left to grade`}
          </div>
        </div>
        <div className="score-pill">
          <ScoreRing correct={correct} incorrect={incorrect} total={total} size={32} stroke={5} />
          <div>
            <div className="num">{correct + incorrect}/{total}</div>
            <div className="lbl">Graded</div>
          </div>
        </div>
      </div>

      <StatsBlock correct={correct} incorrect={incorrect} total={total} ungraded={ungraded} />

      <QuestionNav
        total={total}
        current={cursor}
        getStatus={(i) => {
          if (i === cursor) return 'current';
          const g = test.questions[i]?.grade;
          if (g === true) return 'correct';
          if (g === false) return 'incorrect';
          return 'ungraded';
        }}
        onJump={setCursor}
      />

      <div className="qcard slide-enter" key={`g-${cursor}`} ref={cardRef}>
        <div className="qcard-bg" />
        <div className="q-num-wrap" style={{ marginTop: -4 }}>
          <span className="q-num-label">Question {cursor + 1} of {total}</span>
        </div>

        <div className="answer-display">
          <div className="answer-display-label">Your answer</div>
          <div className="answer-display-value">{q.answer}</div>
        </div>

        <SliderSwitch state={pending} onChange={setPending} />

        <button className="btn-confirm" disabled={pending === 'neutral'} onClick={() => apply(pending)}>
          {q.grade !== null ? 'Update' : 'Mark'} {pending === 'correct' ? 'correct' : pending === 'incorrect' ? 'incorrect' : ''}
          {pending !== 'neutral' && <Icon.Arrow />}
        </button>
      </div>

      <div className="action-row">
        <div className="left">
          <button
            className="btn-ghost"
            onClick={() => setCursor((c) => Math.max(0, c - 1))}
            disabled={cursor === 0}
          >
            <Icon.Arrow dir="left" /> Previous
          </button>
          <button
            className="btn-ghost"
            onClick={() => setCursor((c) => Math.min(total - 1, c + 1))}
            disabled={cursor === total - 1}
          >
            Next <Icon.Arrow />
          </button>
        </div>
        <div className="right">
          <button
            className="btn-primary"
            style={{ height: 38, padding: '0 16px', fontSize: 13 }}
            onClick={onFinish}
            disabled={!allGraded}
          >
            <Icon.Check /> Finish grading
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewPhase({ test, onUpdate }) {
  const total = test.questions.length;
  const correct = test.questions.filter((q) => q.grade === true).length;
  const incorrect = test.questions.filter((q) => q.grade === false).length;
  const ungraded = test.questions.filter((q) => q.grade === null).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const verdict = pct >= 90 ? 'Outstanding!' : pct >= 75 ? 'Great work!' : pct >= 60 ? 'Solid effort!' : 'Keep practicing!';

  const toggle = (i, newGrade) => {
    const nextQs = test.questions.map((qq, idx) => (idx === i ? { ...qq, grade: newGrade } : qq));
    onUpdate({ ...test, questions: nextQs });
  };

  return (
    <div className="test-view review">
      <div className="review-top">
        <div className="review-summary">
          <div className="score-ring-big">
            <ScoreRing correct={correct} incorrect={incorrect} total={total} size={130} stroke={12} />
            <div className="pct">
              <span><AnimatedNumber value={pct} duration={900} />%</span>
              <small>Score</small>
            </div>
          </div>
          <div className="review-summary-meta">
            <h2>{verdict}</h2>
            <div className="review-title">{test.title}</div>
            <div className="review-stats">
              <span className="rs c"><strong>{correct}</strong> correct</span>
              <span className="rs i"><strong>{incorrect}</strong> incorrect</span>
              {ungraded > 0 && <span className="rs u"><strong>{ungraded}</strong> ungraded</span>}
            </div>
            <div className="review-hint">Tap any row's toggle to fix a grading mistake. Answers are locked.</div>
          </div>
        </div>
      </div>

      <div className="review-list">
        {test.questions.map((q, i) => (
          <div
            key={i}
            className={`review-row grade-${q.grade === true ? 'correct' : q.grade === false ? 'incorrect' : 'none'}`}
          >
            <div className="rr-num">{i + 1}</div>
            <div className="rr-answer" title={q.answer}>{q.answer}</div>
            <div className="rr-toggle">
              <button
                className={`rr-btn rr-x ${q.grade === false ? 'on' : ''}`}
                onClick={() => toggle(i, false)}
                title="Mark incorrect"
              >
                <Icon.X s={14} />
              </button>
              <button
                className={`rr-btn rr-c ${q.grade === true ? 'on' : ''}`}
                onClick={() => toggle(i, true)}
                title="Mark correct"
              >
                <Icon.Check s={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function spawnBurst(isCorrect, cardRef) {
  if (!cardRef.current) return;
  const colors = isCorrect ? ['#10B981', '#34D399', '#6EE7B7'] : ['#F43F5E', '#FB7185', '#FDA4AF'];
  const center = cardRef.current.querySelector('.q-num-wrap') || cardRef.current.querySelector('.answer-display');
  if (!center) return;
  const rect = center.getBoundingClientRect();
  const cardRect = cardRef.current.getBoundingClientRect();
  const cx = rect.left + rect.width / 2 - cardRect.left;
  const cy = rect.top + rect.height / 2 - cardRect.top;
  for (let i = 0; i < 12; i++) {
    const dot = document.createElement('span');
    dot.className = 'burst';
    const ang = (i / 12) * Math.PI * 2;
    const dist = 50 + Math.random() * 30;
    dot.style.left = `${cx}px`;
    dot.style.top = `${cy}px`;
    dot.style.background = colors[i % colors.length];
    dot.animate(
      [
        { transform: 'translate(-50%,-50%) scale(0)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(1.2)`,
          opacity: 0,
        },
      ],
      { duration: 700, easing: 'cubic-bezier(.2,.8,.4,1)' }
    );
    cardRef.current.appendChild(dot);
    setTimeout(() => dot.remove(), 750);
  }
}

export function TestView({ test, onUpdate }) {
  const setPhase = (phase) => onUpdate({ ...test, phase });

  if (test.phase === 'answering') {
    return <AnsweringPhase test={test} onUpdate={onUpdate} onFinishAnswering={() => setPhase('grading')} />;
  }
  if (test.phase === 'grading') {
    return <GradingPhase test={test} onUpdate={onUpdate} onFinish={() => setPhase('review')} />;
  }
  return <ReviewPhase test={test} onUpdate={onUpdate} />;
}

export function formatRelative(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
