import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons.jsx';
import { AnimatedNumber, ScoreRing } from './AnimatedNumber.jsx';

// ─── Helpers ───────────────────────────────────────────────────
function letterFor(index) {
  return String.fromCharCode(65 + index); // 0 -> A
}

function emptyAnswerLabel() {
  return '— skipped —';
}

// ─── SliderSwitch ──────────────────────────────────────────────
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

// ─── StatsBlock ────────────────────────────────────────────────
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

// ─── QuestionNav ───────────────────────────────────────────────
function QuestionNav({ total, current, getStatus, isUnsure, onJump }) {
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
              className={`qchip s-${st} ${i === current ? 'on' : ''} ${isUnsure?.(i) ? 'is-unsure' : ''}`}
              onClick={() => onJump(i)}
              title={`Question ${i + 1}${isUnsure?.(i) ? ' (unsure)' : ''}`}
            >
              {i + 1}
              {isUnsure?.(i) && <span className="qchip-unsure">?</span>}
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

// ─── UnsureToggle ──────────────────────────────────────────────
function UnsureToggle({ checked, onChange }) {
  return (
    <label className={`unsure-toggle ${checked ? 'on' : ''}`}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="unsure-box">{checked ? '?' : ''}</span>
      <span className="unsure-label">Mark as unsure</span>
    </label>
  );
}

// ─── Phase 1: Answering ────────────────────────────────────────
function AnsweringPhase({ test, onUpdate, onFinishAnswering }) {
  const total = test.totalQuestions;
  const isMc = test.questionType === 'mc';
  const optionCount = test.optionCount || 4;

  // Initial cursor: prefer test.editingIndex (set by FinalizePhase), else first unanswered slot
  const initialCursor = (() => {
    if (typeof test.editingIndex === 'number') {
      return Math.min(test.editingIndex, total - 1);
    }
    // first slot with empty answer
    for (let i = 0; i < test.questions.length; i++) {
      if (!test.questions[i].answer) return i;
    }
    if (test.questions.length < total) return test.questions.length;
    return total - 1;
  })();

  const [cursor, setCursor] = useState(initialCursor);
  const existing = test.questions[cursor];
  const [val, setVal] = useState(existing ? existing.answer : '');
  const [bumpKey, setBumpKey] = useState(0);
  const inputRef = useRef(null);

  // Clear editingIndex on mount so it doesn't stick
  useEffect(() => {
    if (typeof test.editingIndex === 'number') {
      onUpdate({ ...test, editingIndex: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ex = test.questions[cursor];
    setVal(ex ? ex.answer : '');
    if (!isMc) inputRef.current?.focus();
    setBumpKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  const findNextSlot = (questions) => {
    // first slot AFTER cursor with empty answer
    for (let i = cursor + 1; i < questions.length; i++) {
      if (!questions[i].answer) return i;
    }
    // else first unfilled appended slot
    if (questions.length < total) return questions.length;
    // else first slot BEFORE cursor with empty answer (wrap)
    for (let i = 0; i < cursor; i++) {
      if (!questions[i].answer) return i;
    }
    return -1;
  };

  // Save the current val (or a passed-in value) and advance.
  const saveAndAdvance = (rawValue) => {
    const value = (rawValue ?? '').toString();
    let nextQs;
    if (cursor < test.questions.length) {
      nextQs = test.questions.map((q, i) =>
        i === cursor ? { ...q, answer: value } : q
      );
    } else if (cursor === test.questions.length) {
      nextQs = [...test.questions, { answer: value, grade: null, unsure: false }];
    } else {
      return;
    }

    const next = findNextSlot(nextQs);

    // ATOMIC: when no more slots to visit, transition to finalize in the same update.
    // This fixes the bug where the last-question save and phase-change were two
    // separate updates and the phase-change closure had stale `test.questions`.
    if (next === -1) {
      onUpdate({ ...test, questions: nextQs, phase: 'finalize' });
      return;
    }

    onUpdate({ ...test, questions: nextQs });
    setCursor(next);
  };

  const submit = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    saveAndAdvance(trimmed);
  };

  const skip = () => {
    saveAndAdvance('');
  };

  const setUnsure = (checked) => {
    let nextQs;
    if (cursor < test.questions.length) {
      nextQs = test.questions.map((q, i) =>
        i === cursor ? { ...q, unsure: checked } : q
      );
    } else if (cursor === test.questions.length) {
      // no slot yet — create one with empty answer + unsure flag
      nextQs = [
        ...test.questions,
        { answer: '', grade: null, unsure: checked },
      ];
    } else {
      return;
    }
    onUpdate({ ...test, questions: nextQs });
  };

  const jumpTo = (i) => {
    const maxAllowed = test.questions.length;
    setCursor(Math.min(i, maxAllowed));
  };

  const getStatus = (i) => {
    if (i === cursor) return 'current';
    if (i < test.questions.length) {
      return test.questions[i].answer ? 'answered' : 'skipped';
    }
    if (i === test.questions.length) return 'next';
    return 'locked';
  };

  const isUnsure = (i) =>
    i < test.questions.length && !!test.questions[i].unsure;

  const undo = () => {
    if (test.questions.length === 0) return;
    onUpdate({ ...test, questions: test.questions.slice(0, -1) });
    setCursor(Math.min(cursor, test.questions.length - 1));
  };

  const answered = test.questions.filter((q) => q.answer).length;
  const isEditing = cursor < test.questions.length;
  const currentUnsure = !!(existing && existing.unsure);

  return (
    <div className="test-view">
      <div className="test-header">
        <div className="th-title">
          <h2>{test.title}</h2>
          <div className="sub">
            <span className="phase-chip phase-answer">Answering</span>
            Started {formatRelative(test.createdAt)} · {total} questions
            {isMc ? ` · multiple choice (A–${letterFor(optionCount - 1)})` : ' · free input'}
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

      <QuestionNav
        total={total}
        current={cursor}
        getStatus={getStatus}
        isUnsure={isUnsure}
        onJump={jumpTo}
      />

      <div className="qcard slide-enter" key={`a-${cursor}`}>
        <div className="qcard-bg" />
        <div className="q-num-wrap">
          <span className="q-num-label">{isEditing ? 'Editing question' : 'Question'}</span>
          <div className={`q-num ${bumpKey ? 'bump' : ''} ${currentUnsure ? 'unsure' : ''}`} key={bumpKey}>
            {cursor + 1}<small>/ {total}</small>
            {currentUnsure && <span className="q-num-unsure">?</span>}
          </div>
        </div>

        {isMc ? (
          <div className="mc-grid" data-count={optionCount}>
            {Array.from({ length: optionCount }).map((_, i) => {
              const letter = letterFor(i);
              const isSelected = (val || '').toUpperCase() === letter;
              return (
                <button
                  key={letter}
                  className={`mc-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => saveAndAdvance(letter)}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ) : (
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
        )}

        <UnsureToggle checked={currentUnsure} onChange={setUnsure} />

        {!isMc && (
          <button className="btn-confirm" disabled={!val.trim()} onClick={submit}>
            {isEditing ? 'Save & next' : cursor + 1 === total ? 'Submit & finish' : 'Submit & next'}{' '}
            <Icon.Arrow />
          </button>
        )}
      </div>

      <div className="action-row">
        <div className="left">
          <button className="btn-ghost" onClick={skip}>
            Skip <Icon.Arrow />
          </button>
          <button className="btn-ghost" onClick={undo} disabled={answered === 0 && test.questions.length === 0}>
            <Icon.Undo /> Undo last
          </button>
        </div>
        <div className="right">
          <button
            className="btn-ghost"
            onClick={onFinishAnswering}
            disabled={test.questions.length === 0}
            title="Review your answers before grading"
          >
            Done answering <Icon.Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Phase 2: Finalize (review answers before grading) ─────────
function FinalizePhase({ test, onUpdate, onSubmit, onBackToAnswering }) {
  const total = test.totalQuestions;
  const answered = test.questions.filter((q) => q.answer).length;
  const skipped = total - answered;
  const unsureCount = test.questions.filter((q) => q.unsure).length;

  const editAt = (i) => {
    onUpdate({ ...test, phase: 'answering', editingIndex: i });
  };

  const toggleUnsure = (i) => {
    const nextQs = test.questions.map((q, idx) =>
      idx === i ? { ...q, unsure: !q.unsure } : q
    );
    // Ensure we have a slot for every question up to i (for edge case where i was beyond)
    onUpdate({ ...test, questions: nextQs });
  };

  return (
    <div className="test-view finalize">
      <div className="test-header">
        <div className="th-title">
          <h2>{test.title}</h2>
          <div className="sub">
            <span className="phase-chip phase-finalize">Finalize</span>
            Review your answers before grading
          </div>
        </div>
        <div className="score-pill">
          <div>
            <div className="num">{answered}/{total}</div>
            <div className="lbl">Answered</div>
          </div>
        </div>
      </div>

      <div className="finalize-summary">
        <span className="fs answered"><strong>{answered}</strong> answered</span>
        {skipped > 0 && <span className="fs skipped"><strong>{skipped}</strong> skipped</span>}
        {unsureCount > 0 && <span className="fs unsure"><strong>{unsureCount}</strong> unsure</span>}
      </div>

      <div className="finalize-list">
        {Array.from({ length: total }).map((_, i) => {
          const q = test.questions[i];
          const ans = q?.answer;
          const isUnsure = !!q?.unsure;
          const isSkipped = !ans;
          return (
            <div
              key={i}
              className={`finalize-row ${isSkipped ? 'skipped' : ''} ${isUnsure ? 'unsure' : ''}`}
            >
              <div className="fr-num">{i + 1}</div>
              <div className="fr-answer">
                {isSkipped ? <em>{emptyAnswerLabel()}</em> : ans}
              </div>
              <button
                className={`fr-unsure ${isUnsure ? 'on' : ''}`}
                onClick={() => toggleUnsure(i)}
                title={isUnsure ? 'Remove unsure flag' : 'Mark as unsure'}
              >
                ?
              </button>
              <button
                className="fr-edit"
                onClick={() => editAt(i)}
                title="Edit this answer"
              >
                Edit <Icon.Arrow />
              </button>
            </div>
          );
        })}
      </div>

      <div className="action-row">
        <div className="left">
          <button className="btn-ghost" onClick={onBackToAnswering}>
            <Icon.Arrow dir="left" /> Back to answering
          </button>
        </div>
        <div className="right">
          <button className="btn-primary" style={{ height: 42, padding: '0 18px' }} onClick={onSubmit}>
            Submit & start grading <Icon.Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Phase 3: Grading ─────────────────────────────────────────
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

  const toggleUnsure = () => {
    const nextQs = test.questions.map((qq, i) =>
      i === cursor ? { ...qq, unsure: !qq.unsure } : qq
    );
    onUpdate({ ...test, questions: nextQs });
  };

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

  const currentUnsure = !!q.unsure;
  const isSkipped = !q.answer;

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
        isUnsure={(i) => !!test.questions[i]?.unsure}
        onJump={setCursor}
      />

      <div className="qcard slide-enter" key={`g-${cursor}`} ref={cardRef}>
        <div className="qcard-bg" />
        <div className="q-num-wrap" style={{ marginTop: -4 }}>
          <span className="q-num-label">
            Question {cursor + 1} of {total}
            {currentUnsure && <span className="q-num-unsure-inline" title="Marked unsure">?</span>}
          </span>
        </div>

        <div className="answer-display">
          <div className="answer-display-label">Your answer</div>
          <div className={`answer-display-value ${isSkipped ? 'skipped' : ''}`}>
            {isSkipped ? emptyAnswerLabel() : q.answer}
          </div>
        </div>

        <SliderSwitch state={pending} onChange={setPending} />

        <UnsureToggle checked={currentUnsure} onChange={toggleUnsure} />

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

// ─── Phase 4: Review (final results) ──────────────────────────
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

  const toggleUnsure = (i) => {
    const nextQs = test.questions.map((qq, idx) =>
      idx === i ? { ...qq, unsure: !qq.unsure } : qq
    );
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
        {test.questions.map((q, i) => {
          const isUnsure = !!q.unsure;
          const isSkipped = !q.answer;
          return (
            <div
              key={i}
              className={`review-row grade-${q.grade === true ? 'correct' : q.grade === false ? 'incorrect' : 'none'} ${isUnsure ? 'unsure' : ''}`}
            >
              <div className="rr-num">{i + 1}</div>
              <div className={`rr-answer ${isSkipped ? 'skipped' : ''}`} title={q.answer || emptyAnswerLabel()}>
                {isSkipped ? emptyAnswerLabel() : q.answer}
              </div>
              <button
                className={`rr-unsure ${isUnsure ? 'on' : ''}`}
                onClick={() => toggleUnsure(i)}
                title={isUnsure ? 'Remove unsure flag' : 'Mark as unsure'}
              >
                ?
              </button>
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
          );
        })}
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

// ─── Top-level routing by phase ────────────────────────────────
export function TestView({ test, onUpdate }) {
  const setPhase = (phase) => onUpdate({ ...test, phase });

  if (test.phase === 'answering') {
    return (
      <AnsweringPhase
        test={test}
        onUpdate={onUpdate}
        onFinishAnswering={() => setPhase('finalize')}
      />
    );
  }
  if (test.phase === 'finalize') {
    return (
      <FinalizePhase
        test={test}
        onUpdate={onUpdate}
        onSubmit={() => setPhase('grading')}
        onBackToAnswering={() => setPhase('answering')}
      />
    );
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
