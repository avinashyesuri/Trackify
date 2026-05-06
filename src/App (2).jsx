// ─────────────────────────────────────────────────────────────────
//  ELEVATE — Self-Improvement Tracker  v4.0
//  Stack  : Vite 5 · React 18 · Recharts 2
//  New    : Auth (simulated) · Per-user data · Task History
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ── New: Auth + History service layer ────────────────────────────
import { getSession, logout as svcLogout, addHistoryEvent } from "./services/storage.js";

// ── New: Auth screen (shown when logged out) ──────────────────────
import AuthScreen from "./AuthScreen.jsx";

// ── New: History view (new nav item) ─────────────────────────────
import HistoryView from "./HistoryView.jsx";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";

// ─── Design Tokens ───────────────────────────────────────────────
const AC      = "#C8F535";
const AC_DIM  = "#6FA81A";
const AC_GLOW = "#C8F53518";
const BG      = "#060606";
const SIDEBAR = "#090909";
const CARD    = "#0e0e0e";
const CARD2   = "#131313";
const CARD3   = "#181818";
const BORDER  = "#1c1c1c";
const BORDER2 = "#252525";
const TEXT     = "#e8e8e8";
const MUTED    = "#454545";
const MUTED2   = "#686868";
const RED      = "#f87171";
const BLUE     = "#7a8fff";

const CAT_COLOR = {
  health:  "#4ade80",
  fitness: "#fb923c",
  growth:  AC,
  care:    "#c084fc",
};

// Task priority colours
const PRIORITY_COLOR = {
  high:   "#f87171",
  medium: "#fb923c",
  low:    AC,
};

// ─── Static Data ─────────────────────────────────────────────────
const HABITS = [
  { id:"morning",   label:"Morning Routine",  desc:"Sunscreen + Inhalation",          icon:"☀️", cat:"health"  },
  { id:"dryfruits", label:"Dry Fruits",        desc:"5 Almonds daily",                 icon:"🥜", cat:"health"  },
  { id:"water",     label:"Water Intake",      desc:"6 full bottles",                  icon:"💧", cat:"health"  },
  { id:"grooming",  label:"Grooming",          desc:"Full grooming ritual",            icon:"✦",  cat:"care"    },
  { id:"skincare",  label:"Night Skincare",    desc:"Evening routine",                 icon:"🌙", cat:"care"    },
  { id:"gym",       label:"Gym / Exercise",    desc:"Physical training session",       icon:"💪", cat:"fitness" },
  { id:"pushups",   label:"Pushups",           desc:"Minimum 10 reps",                 icon:"🔥", cat:"fitness" },
  { id:"walking",   label:"Walking",           desc:"Daily outdoor walk",              icon:"🚶", cat:"fitness" },
  { id:"steps",     label:"Step Counter",      desc:"5,000+ steps today",              icon:"👟", cat:"fitness" },
  { id:"stocks",    label:"Stock Learning",    desc:"Finance & market reading",        icon:"📈", cat:"growth"  },
  { id:"coding",    label:"Coding Practice",   desc:"Min 2 hrs — React, Next.js, UI", icon:"💻", cat:"growth"  },
  { id:"github",    label:"GitHub Commits",    desc:"At least one commit today",       icon:"⬡",  cat:"growth"  },
];

const QUOTES = [
  { text:"Discipline is choosing between what you want now and what you want most.", author:"Abraham Lincoln" },
  { text:"The secret of your success is found in your daily routine.", author:"John C. Maxwell" },
  { text:"We are what we repeatedly do. Excellence is not an act, but a habit.", author:"Aristotle" },
  { text:"Small daily improvements over time lead to stunning results.", author:"Robin Sharma" },
  { text:"Motivation gets you started. Habit keeps you going.", author:"Jim Ryun" },
  { text:"Your only competition is who you were yesterday.", author:"Anonymous" },
  { text:"Self-discipline is the magic power that makes you virtually unstoppable.", author:"Dan Kennedy" },
];

const SUGGESTIONS = [
  { cat:"Skin Care",         color:"#C8F535", icon:"✦", items:["SPF 50+ daily — even indoors","Niacinamide serum for pores & pigmentation","Retinol 2×/week (start low, 0.025%)","Hyaluronic acid before moisturizer","Sheet mask on rest days"] },
  { cat:"Snoring Solutions", color:BLUE,      icon:"◐", items:["Sleep on your side — use body pillow","Elevate head 4 inches with wedge pillow","Nasal strips before bed","Avoid heavy meals 3h before sleep","Nasal rinse (saline) each evening"] },
  { cat:"Coding Topics",     color:"#4ade80", icon:"⌬", items:["React Server Components & Suspense","Next.js 14 App Router architecture","TypeScript generics & utility types","CSS Grid + Container Queries","Framer Motion animation patterns"] },
  { cat:"Stock Knowledge",   color:"#fb923c", icon:"◈", items:["P/E ratio & what it signals","Index fund vs. active fund debate","Dollar Cost Averaging strategy","How to read a balance sheet","SIP investing for beginners"] },
];

const NAV = [
  { id:"dashboard", label:"Dashboard" },
  { id:"habits",    label:"Habits"    },
  { id:"analytics", label:"Analytics" },
  { id:"tasks",     label:"Tasks"     },
  { id:"history",   label:"History"   }, // ← NEW
];

// ─── SVG Icons ───────────────────────────────────────────────────
function IcoDashboard({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
}
function IcoHabits({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  );
}
function IcoAnalytics({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function IcoTasks({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"/>
      <path d="M17.5 2.5a2.121 2.121 0 013 3L12 14l-4 1 1-4 7.5-7.5z"/>
    </svg>
  );
}
function IcoMenu({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}
function IcoCheck({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12">
      <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}
function IcoTrash({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  );
}
function IcoPlus({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IcoFilter({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}
// ── NEW icons ────────────────────────────────────────────────────
function IcoHistory({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <polyline points="12 8 12 12 14 14"/>
      <path d="M3.05 11a9 9 0 1 0 .5-4.5"/>
      <polyline points="3 3 3 7 7 7"/>
    </svg>
  );
}
function IcoLogout({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

const NAV_ICON = {
  dashboard: IcoDashboard,
  habits:    IcoHabits,
  analytics: IcoAnalytics,
  tasks:     IcoTasks,
  history:   IcoHistory, // ← NEW
};

// ─── Utilities ───────────────────────────────────────────────────
const getTodayKey = () => new Date().toISOString().split("T")[0];
const toDateKey   = (d) => new Date(d).toISOString().split("T")[0];
const uid         = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 9);
const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0);

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─── Custom Hooks ────────────────────────────────────────────────

/**
 * useStorage — persists state in localStorage.
 * The `save` function is always stable (useCallback with [key]).
 */
function useStorage(key, fallback) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  });

  const save = useCallback(
    (next) => {
      setVal((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // storage quota exceeded — silent
        }
        return resolved;
      });
    },
    [key]
  );

  return [val, save];
}

/** Responsive breakpoint hook */
function useBreakpoint() {
  const measure = () =>
    window.innerWidth >= 1100 ? "desktop"
    : window.innerWidth >= 700 ? "tablet"
    : "mobile";
  const [bp, setBp] = useState(measure);
  useEffect(() => {
    const h = () => setBp(measure());
    window.addEventListener("resize", h, { passive: true });
    return () => window.removeEventListener("resize", h);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return bp;
}

// ─── Shared UI ───────────────────────────────────────────────────

function Card({ children, style, glow = false }) {
  return (
    <div style={{
      background: CARD, borderRadius: 14,
      border: `1px solid ${glow ? AC_DIM : BORDER}`,
      boxShadow: glow ? `0 0 32px ${AC_GLOW}` : "none",
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SLabel({ children, color, mb = 12 }) {
  return (
    <p style={{
      fontSize: 10, fontFamily: "'DM Mono',monospace",
      letterSpacing: "0.13em", textTransform: "uppercase",
      color: color || MUTED2, margin: 0, marginBottom: mb,
    }}>
      {children}
    </p>
  );
}

function ProgressRing({ pct: p, size = 110, stroke = 7 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (p / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BORDER2} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={AC} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

function Checkbox({ checked, onChange, color }) {
  const col = color || AC;
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onChange}
      style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${checked ? col : MUTED}`,
        background: checked ? col : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.18s ease", padding: 0,
      }}
    >
      {checked && <IcoCheck size={11}/>}
    </button>
  );
}

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: CARD2, border: `1px solid ${BORDER2}`, borderRadius: 8, padding: "7px 12px" }}>
      <p style={{ color: AC, fontWeight: 600, fontFamily: "'DM Mono',monospace", margin: 0 }}>{payload[0]?.value}%</p>
      <p style={{ color: MUTED2, fontSize: 11, margin: 0 }}>{payload[0]?.payload?.week ?? payload[0]?.payload?.day}</p>
    </div>
  );
}

// ─── Task Components (defined at MODULE LEVEL — critical!) ────────
// ⚠️ These MUST be outside any other component.
// Defining them inside Tasks() caused React to remount them every
// render, breaking input focus and all interactivity.

function TaskInput({ value, onChange, onAdd, placeholder, accentColor = AC, inputRef }) {
  return (
    <div style={{
      display: "flex", gap: 10,
      background: CARD2, border: `1px solid ${BORDER}`,
      borderRadius: 12, padding: "6px 6px 6px 14px",
      transition: "border-color 0.2s",
    }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }}
        placeholder={placeholder}
        style={{
          flex: 1, background: "transparent", border: "none",
          color: TEXT, fontSize: 13, fontFamily: "'DM Sans',sans-serif",
          padding: "6px 0",
        }}
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={!value.trim()}
        style={{
          background: value.trim() ? accentColor : BORDER2,
          color: value.trim() ? "#000" : MUTED,
          border: "none", borderRadius: 8,
          padding: "8px 16px", cursor: value.trim() ? "pointer" : "not-allowed",
          fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6,
          transition: "all 0.2s", whiteSpace: "nowrap",
        }}
      >
        <IcoPlus size={14}/> Add
      </button>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const col = PRIORITY_COLOR[priority] || MUTED2;
  return (
    <span style={{
      fontSize: 9, fontFamily: "'DM Mono',monospace",
      letterSpacing: "0.08em", textTransform: "uppercase",
      color: col, background: col + "18",
      border: `1px solid ${col}33`,
      borderRadius: 4, padding: "2px 6px", flexShrink: 0,
    }}>
      {priority}
    </span>
  );
}

function TaskItem({ item, onToggle, onDelete, accentColor = AC, showPriority = false }) {
  const [hovering, setHovering] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        background: hovering ? CARD3 : CARD,
        border: `1px solid ${item.done ? `${accentColor}33` : BORDER}`,
        borderRadius: 11, padding: "12px 14px",
        transition: "all 0.18s ease",
      }}
    >
      <Checkbox checked={item.done} onChange={onToggle} color={accentColor}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, color: item.done ? MUTED2 : TEXT,
          textDecoration: item.done ? "line-through" : "none",
          margin: 0, lineHeight: 1.4,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {item.text}
        </p>
        <p style={{ fontSize: 10, color: MUTED2, margin: "3px 0 0", fontFamily: "'DM Mono',monospace" }}>
          {formatDate(item.date)}
          {item.category ? ` · ${item.category}` : ""}
        </p>
      </div>
      {showPriority && item.priority && <PriorityBadge priority={item.priority}/>}
      {item.done && (
        <span style={{ fontSize: 9, color: "#4ade80", fontFamily: "'DM Mono',monospace",
          background: "#4ade8018", border: "1px solid #4ade8033", borderRadius: 4, padding: "2px 6px",
          flexShrink: 0, letterSpacing: "0.06em" }}>DONE</span>
      )}
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        style={{
          background: hovering ? "#f8717118" : "transparent",
          border: `1px solid ${hovering ? "#f8717133" : "transparent"}`,
          borderRadius: 7, color: hovering ? RED : MUTED2,
          cursor: "pointer", padding: "5px 7px",
          display: "flex", alignItems: "center",
          transition: "all 0.18s ease", flexShrink: 0,
        }}
      >
        <IcoTrash size={13}/>
      </button>
    </div>
  );
}

function ResearchItem({ item, onToggle, onDelete }) {
  const [hovering, setHovering] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        background: hovering ? CARD3 : CARD,
        border: `1px solid ${item.done ? `${BLUE}33` : BORDER}`,
        borderRadius: 11, padding: "12px 14px",
        transition: "all 0.18s ease",
      }}
    >
      <Checkbox checked={item.done} onChange={onToggle} color={BLUE}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, color: item.done ? MUTED2 : TEXT,
          textDecoration: item.done ? "line-through" : "none",
          margin: 0, lineHeight: 1.5,
        }}>
          {item.text}
        </p>
        <p style={{ fontSize: 10, color: MUTED2, margin: "3px 0 0", fontFamily: "'DM Mono',monospace" }}>
          {formatDate(item.date)}
          {item.source ? ` · ${item.source}` : ""}
        </p>
      </div>
      {item.done && (
        <span style={{ fontSize: 9, color: BLUE, fontFamily: "'DM Mono',monospace",
          background: BLUE + "18", border: `1px solid ${BLUE}33`,
          borderRadius: 4, padding: "2px 6px", flexShrink: 0, letterSpacing: "0.06em" }}>READ</span>
      )}
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        style={{
          background: hovering ? "#f8717118" : "transparent",
          border: `1px solid ${hovering ? "#f8717133" : "transparent"}`,
          borderRadius: 7, color: hovering ? RED : MUTED2,
          cursor: "pointer", padding: "5px 7px",
          display: "flex", alignItems: "center",
          transition: "all 0.18s ease", flexShrink: 0,
        }}
      >
        <IcoTrash size={13}/>
      </button>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{
      gridColumn: "1/-1", textAlign: "center",
      padding: "40px 20px", display: "flex", flexDirection: "column",
      alignItems: "center", gap: 10,
    }}>
      <div style={{ fontSize: 32, opacity: 0.4 }}>{icon}</div>
      <p style={{ fontSize: 14, color: MUTED2, margin: 0, fontWeight: 500 }}>{title}</p>
      <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{sub}</p>
    </div>
  );
}

function FilterBar({ filter, setFilter, options }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ display: "flex", alignItems: "center", color: MUTED2, marginRight: 2 }}>
        <IcoFilter size={12}/>
      </span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setFilter(o.value)}
          style={{
            padding: "4px 12px",
            background: filter === o.value ? AC : "transparent",
            color: filter === o.value ? "#000" : MUTED2,
            border: `1px solid ${filter === o.value ? AC : BORDER}`,
            borderRadius: 20, cursor: "pointer",
            fontSize: 11, fontFamily: "'DM Mono',monospace",
            fontWeight: filter === o.value ? 600 : 400,
            transition: "all 0.18s",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StatsRow({ items, accentColor = AC }) {
  const total     = items.length;
  const done      = items.filter((i) => i.done).length;
  const pending   = total - done;
  const completionPct = pct(done, total);

  if (!total) return null;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8,
    }}>
      {[
        { label: "Total",   val: total,         col: TEXT    },
        { label: "Done",    val: done,           col: "#4ade80" },
        { label: "Pending", val: pending,        col: accentColor },
      ].map((s) => (
        <div key={s.label} style={{
          background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: "10px 14px", textAlign: "center",
        }}>
          <p style={{ fontSize: 22, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: s.col, margin: 0 }}>{s.val}</p>
          <p style={{ fontSize: 9, color: MUTED2, fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em", margin: 0, marginTop: 2 }}>{s.label.toUpperCase()}</p>
        </div>
      ))}
      {total > 0 && (
        <div style={{ gridColumn: "1/-1", height: 4, background: BORDER2, borderRadius: 2 }}>
          <div style={{ width: `${completionPct}%`, height: "100%",
            background: `linear-gradient(90deg,${AC_DIM},${accentColor})`,
            borderRadius: 2, transition: "width 0.5s ease" }}/>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  TASKS VIEW  (fully fixed + enhanced)
// ═══════════════════════════════════════════════════════════════════
function Tasks({ todos, setTodos, research, setResearch, bp, addHistory = () => {} }) {
  const isD = bp === "desktop";
  const isT = bp === "tablet";

  const [tab,      setTab]      = useState("tasks");
  const [taskText, setTaskText] = useState("");
  const [resText,  setResText]  = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskFilter, setTaskFilter]     = useState("all");
  const [resFilter,  setResFilter]      = useState("all");
  const [clearConfirm, setClearConfirm] = useState(false);

  // Refs so focus is preserved across renders
  const taskInputRef = useRef(null);
  const resInputRef  = useRef(null);

  // ── Task actions ──────────────────────────────────────────────
  const addTask = useCallback(() => {
    const text = taskText.trim();
    if (!text) return;
    const newItem = {
      id:       uid(),
      text,
      done:     false,
      priority: taskPriority,
      date:     getTodayKey(),
      category: "custom",
    };
    setTodos((prev) => [newItem, ...prev]);
    addHistory({ type: "task_created", label: text, detail: `Priority: ${taskPriority}` });
    setTaskText("");
    taskInputRef.current?.focus();
  }, [taskText, taskPriority, setTodos, addHistory]);

  const addResearch = useCallback(() => {
    const text = resText.trim();
    if (!text) return;
    const newItem = {
      id:   uid(),
      text,
      done: false,
      date: getTodayKey(),
    };
    setResearch((prev) => [newItem, ...prev]);
    addHistory({ type: "research_added", label: text });
    setResText("");
    resInputRef.current?.focus();
  }, [resText, setResearch, addHistory]);

  const toggleTask = useCallback(
    (id) => {
      setTodos((prev) => {
        const item = prev.find((x) => x.id === id);
        if (item) addHistory({ type: item.done ? "task_reopened" : "task_completed", label: item.text });
        return prev.map((x) => x.id === id ? { ...x, done: !x.done } : x);
      });
    },
    [setTodos, addHistory]
  );

  const deleteTask = useCallback(
    (id) => {
      setTodos((prev) => {
        const item = prev.find((x) => x.id === id);
        if (item) addHistory({ type: "task_deleted", label: item.text });
        return prev.filter((x) => x.id !== id);
      });
    },
    [setTodos, addHistory]
  );

  const toggleRes = useCallback(
    (id) => {
      setResearch((prev) => {
        const item = prev.find((x) => x.id === id);
        if (item) addHistory({ type: item.done ? "research_added" : "research_read", label: item.text });
        return prev.map((x) => x.id === id ? { ...x, done: !x.done } : x);
      });
    },
    [setResearch, addHistory]
  );

  const deleteRes = useCallback(
    (id) => {
      setResearch((prev) => {
        const item = prev.find((x) => x.id === id);
        if (item) addHistory({ type: "research_deleted", label: item.text });
        return prev.filter((x) => x.id !== id);
      });
    },
    [setResearch, addHistory]
  );

  const clearDoneTasks = useCallback(() => {
    setTodos((prev) => prev.filter((x) => !x.done));
    setClearConfirm(false);
  }, [setTodos]);

  const clearDoneRes = useCallback(() => {
    setResearch((prev) => prev.filter((x) => !x.done));
    setClearConfirm(false);
  }, [setResearch]);

  // ── Filtered lists ────────────────────────────────────────────
  const filteredTodos = useMemo(() => {
    if (taskFilter === "active")    return todos.filter((t) => !t.done);
    if (taskFilter === "completed") return todos.filter((t) => t.done);
    return todos;
  }, [todos, taskFilter]);

  const filteredRes = useMemo(() => {
    if (resFilter === "unread") return research.filter((r) => !r.done);
    if (resFilter === "read")   return research.filter((r) => r.done);
    return research;
  }, [research, resFilter]);

  const hasDoneTasks = todos.some((t) => t.done);
  const hasDoneRes   = research.some((r) => r.done);

  const TABS = ["tasks", "research", "suggestions"];
  const TASK_FILTERS = [
    { value: "all",       label: "All"       },
    { value: "active",    label: "Active"    },
    { value: "completed", label: "Completed" },
  ];
  const RES_FILTERS = [
    { value: "all",    label: "All"    },
    { value: "unread", label: "Unread" },
    { value: "read",   label: "Read"   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", background: CARD, borderRadius: 12, padding: 4, border: `1px solid ${BORDER}` }}>
        {TABS.map((t) => {
          const counts = {
            tasks:    todos.filter((x) => !x.done).length || null,
            research: research.filter((x) => !x.done).length || null,
          };
          return (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              flex: 1, padding: "9px 4px", position: "relative",
              background: tab === t ? AC : "transparent",
              color: tab === t ? "#000" : MUTED2,
              border: "none", borderRadius: 8, cursor: "pointer",
              fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono',monospace",
              letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.2s",
            }}>
              {t}
              {counts[t] > 0 && (
                <span style={{
                  position: "absolute", top: 4, right: 8,
                  background: tab === t ? "#00000030" : AC,
                  color: tab === t ? "#000" : "#000",
                  borderRadius: 10, fontSize: 9, fontWeight: 700,
                  padding: "1px 5px", fontFamily: "'DM Mono',monospace",
                }}>
                  {counts[t]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ════ TASKS TAB ════ */}
      {tab === "tasks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Stats */}
          <StatsRow items={todos} accentColor={AC}/>

          {/* Input area */}
          <Card style={{ padding: "16px" }}>
            <SLabel mb={12}>✦ Add Custom Task</SLabel>

            {/* Priority selector */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: MUTED2, alignSelf: "center", marginRight: 4 }}>Priority:</span>
              {["high", "medium", "low"].map((p) => (
                <button key={p} type="button" onClick={() => setTaskPriority(p)} style={{
                  padding: "4px 12px",
                  background: taskPriority === p ? PRIORITY_COLOR[p] : "transparent",
                  color: taskPriority === p ? "#000" : MUTED2,
                  border: `1px solid ${taskPriority === p ? PRIORITY_COLOR[p] : BORDER}`,
                  borderRadius: 20, cursor: "pointer",
                  fontSize: 11, fontFamily: "'DM Mono',monospace",
                  fontWeight: taskPriority === p ? 700 : 400,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  transition: "all 0.18s",
                }}>
                  {p}
                </button>
              ))}
            </div>

            <TaskInput
              value={taskText}
              onChange={setTaskText}
              onAdd={addTask}
              placeholder='e.g. "Learn UI/UX from YouTube", "Practice React Hooks"…'
              accentColor={AC}
              inputRef={taskInputRef}
            />
            <p style={{ fontSize: 11, color: MUTED2, margin: "8px 0 0", fontFamily: "'DM Mono',monospace" }}>
              Press Enter or click Add — tasks persist forever until you delete them
            </p>
          </Card>

          {/* Filter + Clear */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <FilterBar filter={taskFilter} setFilter={setTaskFilter} options={TASK_FILTERS}/>
            {hasDoneTasks && (
              clearConfirm
                ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: RED, fontFamily: "'DM Mono',monospace" }}>Delete all done?</span>
                    <button type="button" onClick={clearDoneTasks}
                      style={{ background: RED, color: "#fff", border: "none", borderRadius: 6,
                        padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Yes</button>
                    <button type="button" onClick={() => setClearConfirm(false)}
                      style={{ background: "transparent", color: MUTED2, border: `1px solid ${BORDER}`,
                        borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setClearConfirm(true)}
                    style={{ background: "transparent", color: RED, border: `1px solid ${RED}33`,
                      borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                      fontSize: 11, fontFamily: "'DM Mono',monospace", transition: "all 0.18s" }}>
                    Clear completed
                  </button>
                )
            )}
          </div>

          {/* Task list */}
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: isD ? "repeat(2,1fr)" : "1fr" }}>
            {filteredTodos.length === 0 ? (
              <EmptyState
                icon={taskFilter === "completed" ? "✅" : "📋"}
                title={taskFilter === "completed" ? "No completed tasks yet" : taskFilter === "active" ? "All tasks done! 🎉" : "No tasks yet"}
                sub={taskFilter === "all" ? 'Type something above and press "Add"' : `Switch to "All" to see everything`}
              />
            ) : (
              filteredTodos.map((t) => (
                <TaskItem
                  key={t.id}
                  item={t}
                  onToggle={() => toggleTask(t.id)}
                  onDelete={() => deleteTask(t.id)}
                  accentColor={AC}
                  showPriority
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ════ RESEARCH TAB ════ */}
      {tab === "research" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Stats */}
          <StatsRow items={research} accentColor={BLUE}/>

          {/* Input area */}
          <Card style={{ padding: "16px" }}>
            <SLabel mb={12}>◐ Add Research Topic</SLabel>
            <TaskInput
              value={resText}
              onChange={setResText}
              onAdd={addResearch}
              placeholder='e.g. "Read UI case studies", "Explore Shopify themes"…'
              accentColor={BLUE}
              inputRef={resInputRef}
            />
            <p style={{ fontSize: 11, color: MUTED2, margin: "8px 0 0", fontFamily: "'DM Mono',monospace" }}>
              Track topics you want to read, watch or explore — mark as read when done
            </p>
          </Card>

          {/* Filter + Clear */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <FilterBar filter={resFilter} setFilter={setResFilter} options={RES_FILTERS}/>
            {hasDoneRes && (
              clearConfirm
                ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: RED, fontFamily: "'DM Mono',monospace" }}>Delete all read?</span>
                    <button type="button" onClick={clearDoneRes}
                      style={{ background: RED, color: "#fff", border: "none", borderRadius: 6,
                        padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Yes</button>
                    <button type="button" onClick={() => setClearConfirm(false)}
                      style={{ background: "transparent", color: MUTED2, border: `1px solid ${BORDER}`,
                        borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setClearConfirm(true)}
                    style={{ background: "transparent", color: RED, border: `1px solid ${RED}33`,
                      borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                      fontSize: 11, fontFamily: "'DM Mono',monospace", transition: "all 0.18s" }}>
                    Clear read
                  </button>
                )
            )}
          </div>

          {/* Research list */}
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: isD ? "repeat(2,1fr)" : "1fr" }}>
            {filteredRes.length === 0 ? (
              <EmptyState
                icon={resFilter === "read" ? "📚" : "🔬"}
                title={resFilter === "read" ? "Nothing marked as read yet" : resFilter === "unread" ? "All caught up! 🎉" : "No research topics yet"}
                sub={resFilter === "all" ? "Add topics you want to explore" : `Switch to "All" to see everything`}
              />
            ) : (
              filteredRes.map((r) => (
                <ResearchItem
                  key={r.id}
                  item={r}
                  onToggle={() => toggleRes(r.id)}
                  onDelete={() => deleteRes(r.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ════ SUGGESTIONS TAB ════ */}
      {tab === "suggestions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: MUTED2, margin: 0 }}>
            Tap <strong style={{ color: TEXT }}>+ Add to Research</strong> to save any tip as a research topic.
          </p>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: isD ? "repeat(2,1fr)" : isT ? "repeat(2,1fr)" : "1fr" }}>
            {SUGGESTIONS.map((s) => (
              <Card key={s.cat} style={{ borderTop: `3px solid ${s.color}`, padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, color: s.color }}>{s.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: s.color, fontFamily: "'Cormorant Garamond',serif" }}>{s.cat}</span>
                  </div>
                </div>
                {s.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
                    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", flex: 1 }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: s.color, marginTop: 7, flexShrink: 0 }}/>
                      <span style={{ fontSize: 12, color: TEXT, lineHeight: 1.55 }}>{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newItem = { id: uid(), text: item, done: false, date: getTodayKey() };
                        setResearch((prev) => {
                          const exists = prev.some((r) => r.text === item);
                          return exists ? prev : [newItem, ...prev];
                        });
                        setTab("research");
                      }}
                      title="Save to research"
                      style={{
                        background: s.color + "18", color: s.color,
                        border: `1px solid ${s.color}33`, borderRadius: 6,
                        padding: "3px 8px", cursor: "pointer", fontSize: 10,
                        fontFamily: "'DM Mono',monospace", fontWeight: 600,
                        flexShrink: 0, transition: "all 0.18s", whiteSpace: "nowrap",
                      }}
                    >
                      + Save
                    </button>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD VIEW
// ═══════════════════════════════════════════════════════════════════
function Dashboard({ habitsData, streak, todayPct, weeklyData, bp }) {
  const isD = bp === "desktop";
  const isT = bp === "tablet";

  const { done, quote, todayH } = useMemo(() => {
    const key  = getTodayKey();
    const day  = habitsData[key] ?? {};
    const d    = HABITS.filter((h) => day[h.id]?.done).length;
    const q    = QUOTES[new Date().getDay() % QUOTES.length];
    return { done: d, quote: q, todayH: day };
  }, [habitsData]);

  const heatCells = useMemo(() => Array.from({ length: 84 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (83 - i));
    const k = toDateKey(d);
    const p = pct(HABITS.filter((h) => (habitsData[k] ?? {})[h.id]?.done).length, HABITS.length) / 100;
    return { k, p };
  }), [habitsData]);

  const weeks = [];
  for (let i = 0; i < heatCells.length; i += 7) weeks.push(heatCells.slice(i, i + 7));

  const hc = (p) => {
    if (p === 0)  return "#181818";
    if (p < 0.25) return "#1a2e0a";
    if (p < 0.5)  return "#2e5c10";
    if (p < 0.75) return AC_DIM;
    return AC;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: isD ? "repeat(4,1fr)" : "repeat(2,1fr)" }}>
        <Card glow style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <ProgressRing pct={todayPct} size={isD ? 120 : 100}/>
            <div style={{ position: "absolute", textAlign: "center" }}>
              <p style={{ fontSize: isD ? 28 : 22, fontWeight: 700, color: TEXT, fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{todayPct}%</p>
              <p style={{ fontSize: 9, color: MUTED2, fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em", margin: 0 }}>TODAY</p>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 13, color: TEXT, fontWeight: 500, margin: 0 }}>{done}/{HABITS.length}</p>
            <p style={{ fontSize: 11, color: MUTED2, margin: 0 }}>habits done</p>
          </div>
        </Card>
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <SLabel>🔥 Streak</SLabel>
          <p style={{ fontSize: isD ? 52 : 42, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: AC, lineHeight: 1, margin: 0 }}>{streak}</p>
          <p style={{ fontSize: 12, color: MUTED2, margin: 0 }}>days consistent</p>
        </Card>
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <SLabel>📅 This Week</SLabel>
          <p style={{ fontSize: isD ? 52 : 42, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "#4ade80", lineHeight: 1, margin: 0 }}>
            {weeklyData[weeklyData.length - 1]?.pct ?? 0}%
          </p>
          <p style={{ fontSize: 12, color: MUTED2, margin: 0 }}>weekly avg</p>
        </Card>
        <Card style={{ borderLeft: `3px solid ${AC}`, borderRadius: "0 14px 14px 0",
          gridColumn: isD ? "span 1" : "span 2",
          display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontSize: 10, color: AC, fontFamily: "'DM Mono',monospace", letterSpacing: "0.12em", marginBottom: 8, marginTop: 0 }}>✦ DAILY WISDOM</p>
          <p style={{ fontSize: 14, color: TEXT, fontStyle: "italic", fontFamily: "'Cormorant Garamond',serif", lineHeight: 1.7, marginBottom: 6, marginTop: 0 }}>
            &ldquo;{quote.text}&rdquo;
          </p>
          <p style={{ fontSize: 11, color: MUTED2, margin: 0 }}>— {quote.author}</p>
        </Card>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: isD ? "1.5fr 1fr" : "1fr" }}>
        <Card>
          <SLabel>Weekly Progress Overview</SLabel>
          <ResponsiveContainer width="100%" height={isD ? 190 : 140}>
            <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="dashG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={AC} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={AC} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER2}/>
              <XAxis dataKey="week" tick={{ fill: MUTED2, fontSize: 10, fontFamily: "'DM Mono',monospace" }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0, 100]} tick={{ fill: MUTED2, fontSize: 9 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="pct" stroke={AC} strokeWidth={2} fill="url(#dashG)" dot={{ fill: AC, r: 3 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SLabel>Today by Category</SLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
            {Object.entries(CAT_COLOR).map(([cat, color]) => {
              const catH    = HABITS.filter((h) => h.cat === cat);
              const catDone = catH.filter((h) => todayH[h.id]?.done).length;
              const p       = pct(catDone, catH.length);
              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: TEXT, textTransform: "capitalize" }}>{cat}</span>
                    <span style={{ fontSize: 11, color: MUTED2, fontFamily: "'DM Mono',monospace" }}>{catDone}/{catH.length}</span>
                  </div>
                  <div style={{ height: 5, background: BORDER2, borderRadius: 3 }}>
                    <div style={{ width: `${p}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <SLabel>Activity Heatmap — Last 84 Days</SLabel>
        <div style={{ overflowX: "auto", paddingBottom: 4 }}>
          <div style={{ display: "flex", gap: isD ? 5 : 4, minWidth: "fit-content" }}>
            {weeks.map((wk, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: isD ? 5 : 4 }}>
                {wk.map((cell, di) => (
                  <div key={di} title={`${cell.k}: ${Math.round(cell.p * 100)}%`}
                    style={{ width: isD ? 16 : 13, height: isD ? 16 : 13, borderRadius: 3, background: hc(cell.p), transition: "transform 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.4)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: 10, color: MUTED2 }}>Less</span>
          {[0, 0.2, 0.5, 0.8, 1].map((p) => (
            <div key={p} style={{ width: 11, height: 11, borderRadius: 2, background: hc(p) }}/>
          ))}
          <span style={{ fontSize: 10, color: MUTED2 }}>More</span>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  HABITS VIEW
// ═══════════════════════════════════════════════════════════════════
function Habits({ habitsData, setHabitsData, bp, addHistory = () => {} }) {
  const isD = bp === "desktop";
  const isT = bp === "tablet";
  const [exp, setExp] = useState(null);

  const todayKey = useMemo(() => getTodayKey(), []);
  const todayH   = habitsData[todayKey] ?? {};

  const toggle = useCallback((id) => {
    const habit   = HABITS.find((h) => h.id === id);
    const wasDone = Boolean((habitsData[todayKey] ?? {})[id]?.done);
    addHistory({
      type:  wasDone ? "habit_unchecked" : "habit_checked",
      label: habit?.label ?? id,
      detail: habit?.desc,
    });
    setHabitsData((prev) => ({
      ...prev,
      [todayKey]: { ...prev[todayKey], [id]: { ...prev[todayKey]?.[id], done: !prev[todayKey]?.[id]?.done } },
    }));
  }, [todayKey, setHabitsData, habitsData, addHistory]);

  const setNote = useCallback((id, note) => {
    setHabitsData((prev) => ({
      ...prev,
      [todayKey]: { ...prev[todayKey], [id]: { ...prev[todayKey]?.[id], note } },
    }));
  }, [todayKey, setHabitsData]);

  const done    = HABITS.filter((h) => todayH[h.id]?.done).length;
  const todayPc = pct(done, HABITS.length);
  const cats    = [...new Set(HABITS.map((h) => h.cat))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card glow style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: MUTED2, fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em", margin: 0 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 style={{ fontSize: isD ? 28 : 22, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: TEXT, margin: "4px 0 0" }}>
            Daily Habits
          </h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: isD ? 40 : 32, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: AC, margin: 0 }}>{todayPc}%</p>
          <p style={{ fontSize: 11, color: MUTED2, margin: 0 }}>{done} of {HABITS.length} complete</p>
        </div>
      </Card>
      <div style={{ height: 3, background: BORDER2, borderRadius: 2 }}>
        <div style={{ width: `${todayPc}%`, height: "100%", background: `linear-gradient(90deg,${AC_DIM},${AC})`, borderRadius: 2, transition: "width 0.5s ease" }}/>
      </div>
      {cats.map((cat) => {
        const catH  = HABITS.filter((h) => h.cat === cat);
        const color = CAT_COLOR[cat];
        return (
          <div key={cat}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }}/>
              <span style={{ fontSize: 10, color, fontFamily: "'DM Mono',monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>{cat}</span>
              <div style={{ flex: 1, height: 1, background: BORDER }}/>
            </div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: isD ? "repeat(3,1fr)" : isT ? "repeat(2,1fr)" : "1fr" }}>
              {catH.map((habit) => {
                const data   = todayH[habit.id] ?? {};
                const isDone = Boolean(data.done);
                const isOpen = exp === habit.id;
                return (
                  <div key={habit.id} style={{
                    background: isDone ? `${color}0e` : CARD,
                    border: `1px solid ${isDone ? `${color}44` : BORDER}`,
                    borderRadius: 12, padding: "14px 16px", transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Checkbox checked={isDone} onChange={() => toggle(habit.id)} color={color}/>
                      <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setExp(isOpen ? null : habit.id)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{habit.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: isDone ? color : TEXT,
                            textDecoration: isDone ? "line-through" : "none", transition: "color 0.2s" }}>{habit.label}</span>
                        </div>
                        <p style={{ fontSize: 11, color: MUTED2, margin: "2px 0 0 22px" }}>{habit.desc}</p>
                      </div>
                      <button type="button" onClick={() => setExp(isOpen ? null : habit.id)} aria-label="toggle note"
                        style={{ background: "none", border: "none", color: MUTED2, cursor: "pointer",
                          fontSize: 11, padding: "2px 4px", transition: "transform 0.2s",
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</button>
                    </div>
                    {isOpen && (
                      <div style={{ marginTop: 10, marginLeft: 32 }}>
                        <textarea value={data.note ?? ""} onChange={(e) => setNote(habit.id, e.target.value)}
                          placeholder="Add a note for today…" rows={2}
                          style={{ width: "100%", background: CARD2, border: `1px solid ${BORDER}`,
                            borderRadius: 8, padding: "8px 10px", color: TEXT, fontSize: 12,
                            fontFamily: "'DM Sans',sans-serif", resize: "vertical" }}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ANALYTICS VIEW
// ═══════════════════════════════════════════════════════════════════
function Analytics({ habitsData, streak, weeklyData, bp }) {
  const isD = bp === "desktop";

  const daily30 = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const k    = toDateKey(d);
    const done = HABITS.filter((h) => (habitsData[k] ?? {})[h.id]?.done).length;
    return { day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), pct: pct(done, HABITS.length) };
  }), [habitsData]);

  const habitStats = useMemo(() => {
    const totalDays = Math.max(1, Object.keys(habitsData).length);
    return HABITS.map((h) => ({
      ...h,
      rate: pct(Object.values(habitsData).filter((d) => d[h.id]?.done).length, totalDays),
    })).sort((a, b) => b.rate - a.rate);
  }, [habitsData]);

  const totalDays = Object.keys(habitsData).length;

  const avgComp = useMemo(() => {
    if (!totalDays) return 0;
    const total = Object.values(habitsData).reduce((s, d) => s + HABITS.filter((h) => d[h.id]?.done).length, 0);
    return pct(total, totalDays * HABITS.length);
  }, [habitsData, totalDays]);

  const stats = [
    { label: "Current Streak",  val: streak,        unit: "days", color: AC        },
    { label: "All-time Avg",    val: avgComp,        unit: "%",    color: "#4ade80" },
    { label: "Days Tracked",    val: totalDays,      unit: "",     color: "#c084fc" },
    { label: "Total Habits",    val: HABITS.length,  unit: "",     color: "#fb923c" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isD ? "repeat(4,1fr)" : "repeat(2,1fr)" }}>
        {stats.map((s) => (
          <Card key={s.label} style={{ textAlign: "center" }}>
            <p style={{ fontSize: isD ? 40 : 30, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: s.color, lineHeight: 1.1, margin: 0 }}>
              {s.val}<span style={{ fontSize: 14 }}>{s.unit}</span>
            </p>
            <p style={{ fontSize: 9, color: MUTED2, fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em", marginTop: 5, marginBottom: 0 }}>
              {s.label.toUpperCase()}
            </p>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: isD ? "1.5fr 1fr" : "1fr" }}>
        <Card>
          <SLabel>30-Day Completion Trend</SLabel>
          <ResponsiveContainer width="100%" height={isD ? 200 : 160}>
            <AreaChart data={daily30} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="trend30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={AC} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={AC} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER2}/>
              <XAxis dataKey="day" tick={{ fill: MUTED2, fontSize: 9 }} tickLine={false} axisLine={false} interval={4}/>
              <YAxis domain={[0, 100]} tick={{ fill: MUTED2, fontSize: 9 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="pct" stroke={AC} strokeWidth={2} fill="url(#trend30)" dot={false} activeDot={{ r: 4, fill: AC }}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SLabel>Weekly Progress Bars</SLabel>
          <ResponsiveContainer width="100%" height={isD ? 200 : 160}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER2} vertical={false}/>
              <XAxis dataKey="week" tick={{ fill: MUTED2, fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0, 100]} tick={{ fill: MUTED2, fontSize: 9 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="pct" fill={AC} radius={[5, 5, 0, 0]} opacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SLabel>Habit Success Rate (All Time)</SLabel>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: isD ? "repeat(2,1fr)" : "1fr" }}>
          {habitStats.map((h) => {
            const color = CAT_COLOR[h.cat];
            return (
              <div key={h.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 13 }}>{h.icon}</span>
                    <span style={{ fontSize: 12, color: TEXT }}>{h.label}</span>
                  </div>
                  <span style={{ fontSize: 11, color: MUTED2, fontFamily: "'DM Mono',monospace" }}>{h.rate}%</span>
                </div>
                <div style={{ height: 4, background: BORDER2, borderRadius: 2 }}>
                  <div style={{ width: `${h.rate}%`, height: "100%", borderRadius: 2, transition: "width 0.6s ease",
                    background: h.rate > 70 ? color : h.rate > 40 ? AC_DIM : "#1a2e0a" }}/>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const bp = useBreakpoint();
  const [view,   setView]   = useState("dashboard");
  const [drawer, setDrawer] = useState(false);

  // ── NEW: Auth state ───────────────────────────────────────────
  // user = { userId, email, name } | null
  const [user, setUser] = useState(() => getSession());

  const handleAuth = useCallback((sessionUser) => {
    setUser(sessionUser);
    setView("dashboard");
  }, []);

  const handleLogout = useCallback(() => {
    svcLogout();
    setUser(null);
    setView("dashboard");
  }, []);

  // ── Per-user localStorage keys ────────────────────────────────
  // Keys change when user changes, so each user has isolated data.
  const userId = user?.userId ?? "guest";

  const [habitsData, setHabitsData] = useStorage(`elevate_habits_${userId}`,    {});
  const [todos,      setTodos]      = useStorage(`elevate_todos_${userId}`,      []);
  const [research,   setResearch]   = useStorage(`elevate_research_${userId}`,   []);

  // ── NEW: History helper ──────────────────────────────────────
  const addHistory = useCallback((event) => {
    addHistoryEvent(userId, event);
  }, [userId]);

  // ── NEW: Auth gate — show AuthScreen if not logged in ─────────
  if (!user) {
    return <AuthScreen onAuth={handleAuth}/>;
  }
  const todayPct = useMemo(() => {
    const key  = getTodayKey();
    const day  = habitsData[key] ?? {};
    const done = HABITS.filter((h) => day[h.id]?.done).length;
    return pct(done, HABITS.length);
  }, [habitsData]);

  const streak = useMemo(() => {
    let count = 0;
    const d   = new Date();
    for (let i = 0; i < 365; i++) {
      const k    = toDateKey(d);
      const done = HABITS.filter((h) => (habitsData[k] ?? {})[h.id]?.done).length;
      if (done >= Math.ceil(HABITS.length * 0.5)) { count++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  }, [habitsData]);

  const weeklyData = useMemo(() => Array.from({ length: 7 }, (_, w) => {
    let total = 0, possible = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date(); date.setDate(date.getDate() - (6 - w) * 7 - d);
      const k = toDateKey(date);
      total    += HABITS.filter((h) => (habitsData[k] ?? {})[h.id]?.done).length;
      possible += HABITS.length;
    }
    return { week: `W${w + 1}`, pct: pct(total, possible) };
  }), [habitsData]);

  // Pending task count for nav badge
  const pendingTasks = useMemo(() => todos.filter((t) => !t.done).length, [todos]);

  const isD = bp === "desktop";
  const isT = bp === "tablet";
  const isM = bp === "mobile";

  const shared = { habitsData, streak, todayPct, weeklyData, bp };

  // ── NEW: active nav label (includes "History") ────────────────
  const ALL_NAV_LABELS = {
    dashboard: "Dashboard", habits: "Habits",
    analytics: "Analytics", tasks: "Tasks", history: "History",
  };

  function SideNavBtn({ n }) {
    const Ico    = NAV_ICON[n.id];
    const active = view === n.id;
    return (
      <button type="button" onClick={() => { setView(n.id); setDrawer(false); }} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        padding: "11px 14px", marginBottom: 5,
        background: active ? `${AC}14` : "transparent",
        border: `1px solid ${active ? `${AC}30` : "transparent"}`,
        borderRadius: 10, cursor: "pointer",
        color: active ? AC : MUTED2,
        fontSize: 13, fontWeight: active ? 600 : 400,
        transition: "all 0.2s", textAlign: "left", position: "relative",
      }}>
        <span style={{ display: "flex", opacity: active ? 1 : 0.5 }}><Ico size={16}/></span>
        {n.label}
        {active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: AC }}/>}
        {n.id === "tasks" && pendingTasks > 0 && !active && (
          <span style={{ marginLeft: "auto", background: AC, color: "#000",
            borderRadius: 10, fontSize: 9, fontWeight: 700, padding: "2px 6px",
            fontFamily: "'DM Mono',monospace" }}>{pendingTasks}</span>
        )}
      </button>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'DM Sans',sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { color-scheme: dark; }
        body { background: #060606; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #C8F53530; border-radius: 2px; }
        input, textarea { outline: none; }
        button { font-family: inherit; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.28s cubic-bezier(0.4,0,0.2,1); }
        @keyframes slideIn { from { transform:translateX(-100%); } to { transform:translateX(0); } }
        .slide-in { animation: slideIn 0.25s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      {/* ════ DESKTOP SIDEBAR ════ */}
      {isD && (
        <aside style={{ width: 240, background: SIDEBAR, borderRight: `1px solid ${BORDER}`,
          position: "fixed", height: "100vh", top: 0, left: 0,
          display: "flex", flexDirection: "column", zIndex: 40 }}>
          <div style={{ padding: "26px 22px 18px" }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 26, color: AC, letterSpacing: "0.02em", margin: 0 }}>✦ ELEVATE</h1>
            <p style={{ fontSize: 9, color: MUTED2, fontFamily: "'DM Mono',monospace", letterSpacing: "0.14em", marginTop: 3 }}>SELF-IMPROVEMENT TRACKER</p>
          </div>
          <div style={{ margin: "0 16px 20px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: MUTED2 }}>Today</span>
              <span style={{ fontSize: 12, color: AC, fontFamily: "'DM Mono',monospace", fontWeight: 500 }}>{todayPct}%</span>
            </div>
            <div style={{ height: 4, background: BORDER2, borderRadius: 2 }}>
              <div style={{ width: `${todayPct}%`, height: "100%", background: `linear-gradient(90deg,${AC_DIM},${AC})`, borderRadius: 2, transition: "width 0.5s" }}/>
            </div>
            {streak > 0 && <p style={{ fontSize: 11, color: AC, fontFamily: "'DM Mono',monospace", marginTop: 10, marginBottom: 0 }}>🔥 {streak}-day streak</p>}
            {pendingTasks > 0 && <p style={{ fontSize: 11, color: MUTED2, fontFamily: "'DM Mono',monospace", marginTop: 6, marginBottom: 0 }}>📋 {pendingTasks} task{pendingTasks !== 1 ? "s" : ""} pending</p>}
          </div>
          <nav style={{ padding: "0 10px", flex: 1 }}>
            {NAV.map((n) => <SideNavBtn key={n.id} n={n}/>)}
          </nav>
          {/* ── NEW: User info + logout ── */}
          <div style={{ padding: "14px 16px", borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%",
                background: `${AC}20`, border: `1px solid ${AC}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: AC, fontWeight: 700, fontFamily: "'DM Mono',monospace",
                flexShrink: 0 }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, color: TEXT, fontWeight: 500, margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </p>
                <p style={{ fontSize: 10, color: MUTED2, margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </p>
              </div>
            </div>
            <button type="button" onClick={handleLogout} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "8px 12px", background: "transparent",
              border: `1px solid ${BORDER}`, borderRadius: 8, cursor: "pointer",
              color: MUTED2, fontSize: 12, fontFamily: "'DM Mono',monospace",
              letterSpacing: "0.06em", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = RED + "66"; e.currentTarget.style.color = RED; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER;     e.currentTarget.style.color = MUTED2; }}
            >
              <IcoLogout size={13}/> SIGN OUT
            </button>
            <p style={{ fontSize: 9, color: MUTED, fontFamily: "'DM Mono',monospace", marginTop: 10 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </aside>
      )}

      {/* ════ TABLET DRAWER ════ */}
      {isT && drawer && (
        <>
          <div onClick={() => setDrawer(false)} style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 48 }}/>
          <aside className="slide-in" style={{ position: "fixed", top: 0, left: 0, width: 230, height: "100vh",
            background: SIDEBAR, borderRight: `1px solid ${BORDER}`, zIndex: 49,
            display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "22px 20px 16px", borderBottom: `1px solid ${BORDER}` }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: AC, margin: 0 }}>✦ ELEVATE</h1>
            </div>
            <nav style={{ padding: "10px", flex: 1 }}>
              {NAV.map((n) => <SideNavBtn key={n.id} n={n}/>)}
            </nav>
          </aside>
        </>
      )}

      {/* ════ MAIN ════ */}
      <div style={{ flex: 1, marginLeft: isD ? 240 : 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Top bar — tablet + mobile */}
        {!isD && (
          <header style={{ position: "sticky", top: 0, zIndex: 30,
            background: `${BG}ee`, backdropFilter: "blur(14px)",
            borderBottom: `1px solid ${BORDER}`, padding: "13px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {isT && (
                <button type="button" onClick={() => setDrawer(true)} style={{
                  background: "none", border: `1px solid ${BORDER}`, borderRadius: 8,
                  color: MUTED2, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <IcoMenu size={18}/>
                </button>
              )}
              <div>
                <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 20, color: AC, margin: 0 }}>✦ ELEVATE</h1>
                <p style={{ fontSize: 9, color: MUTED, fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em", margin: 0 }}>SELF-IMPROVEMENT</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {streak > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5,
                  background: `${AC}15`, border: `1px solid ${AC}33`, borderRadius: 20, padding: "4px 11px" }}>
                  <span style={{ fontSize: 12 }}>🔥</span>
                  <span style={{ fontSize: 11, color: AC, fontFamily: "'DM Mono',monospace", fontWeight: 500 }}>{streak}d</span>
                </div>
              )}
              <div style={{ width: 36, height: 36, borderRadius: "50%",
                background: `conic-gradient(${AC} ${todayPct * 3.6}deg, ${BORDER2} 0deg)`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 27, height: 27, borderRadius: "50%", background: BG,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: AC, fontWeight: 600 }}>{todayPct}</span>
                </div>
              </div>
              {/* ── NEW: logout button in mobile/tablet header ── */}
              <button type="button" onClick={handleLogout} title="Sign out"
                style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8,
                  color: MUTED2, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <IcoLogout size={15}/>
              </button>
            </div>
          </header>
        )}

        {/* Tablet pill nav */}
        {isT && (
          <div style={{ display: "flex", gap: 6, padding: "10px 16px", background: SIDEBAR,
            borderBottom: `1px solid ${BORDER}`, overflowX: "auto" }}>
            {NAV.map((n) => {
              const Ico    = NAV_ICON[n.id];
              const active = view === n.id;
              return (
                <button key={n.id} type="button" onClick={() => setView(n.id)} style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", whiteSpace: "nowrap",
                  background: active ? AC : CARD,
                  color: active ? "#000" : MUTED2,
                  border: `1px solid ${active ? AC : BORDER}`,
                  borderRadius: 20, cursor: "pointer",
                  fontSize: 12, fontWeight: active ? 600 : 400, transition: "all 0.2s", position: "relative",
                }}>
                  <span style={{ display: "flex", opacity: active ? 1 : 0.6 }}><Ico size={14}/></span>
                  {n.label}
                  {n.id === "tasks" && pendingTasks > 0 && (
                    <span style={{ background: active ? "#000" : AC, color: active ? AC : "#000",
                      borderRadius: 10, fontSize: 9, fontWeight: 700, padding: "0px 5px",
                      fontFamily: "'DM Mono',monospace", marginLeft: 2 }}>{pendingTasks}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Desktop page title */}
        {isD && (
          <div style={{ padding: "22px 36px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 11, color: MUTED2, fontFamily: "'DM Mono',monospace", letterSpacing: "0.12em", margin: 0 }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
              <h2 style={{ fontSize: 30, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: TEXT, marginTop: 3, marginBottom: 0 }}>
                {ALL_NAV_LABELS[view] ?? "Dashboard"}
              </h2>
            </div>
            {streak > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 7,
                background: `${AC}12`, border: `1px solid ${AC}30`, borderRadius: 24, padding: "8px 20px" }}>
                <span style={{ fontSize: 16 }}>🔥</span>
                <span style={{ fontSize: 14, color: AC, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{streak} day streak</span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <main className="fade-up" key={view} style={{
          flex: 1,
          padding: isD ? "18px 36px 48px" : isT ? "16px 16px 28px" : "14px 14px 90px",
        }}>
          {view === "dashboard"  && <Dashboard  {...shared}/>}
          {view === "habits"     && <Habits     habitsData={habitsData} setHabitsData={setHabitsData} bp={bp} addHistory={addHistory}/>}
          {view === "analytics"  && <Analytics  habitsData={habitsData} streak={streak} weeklyData={weeklyData} bp={bp}/>}
          {view === "tasks"      && <Tasks      todos={todos} setTodos={setTodos} research={research} setResearch={setResearch} bp={bp} addHistory={addHistory}/>}
          {/* ── NEW: History view ── */}
          {view === "history"    && <HistoryView userId={userId} bp={bp}/>}
        </main>

        {/* Mobile bottom nav */}
        {isM && (
          <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0,
            background: `${CARD}f5`, backdropFilter: "blur(16px)",
            borderTop: `1px solid ${BORDER}`, display: "flex", zIndex: 40 }}>
            {NAV.map((n) => {
              const Ico    = NAV_ICON[n.id];
              const active = view === n.id;
              return (
                <button key={n.id} type="button" onClick={() => setView(n.id)} style={{
                  flex: 1, padding: "12px 4px 14px", background: "none", border: "none",
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  color: active ? AC : MUTED2, transition: "all 0.2s",
                  borderTop: active ? `2px solid ${AC}` : "2px solid transparent",
                  position: "relative",
                }}>
                  <span style={{ display: "flex" }}><Ico size={17}/></span>
                  <span style={{ fontSize: 9, fontFamily: "'DM Mono',monospace",
                    letterSpacing: "0.06em", fontWeight: active ? 600 : 400 }}>
                    {n.label.toUpperCase()}
                  </span>
                  {n.id === "tasks" && pendingTasks > 0 && (
                    <span style={{ position: "absolute", top: 8, right: "calc(50% - 18px)",
                      background: AC, color: "#000", borderRadius: 10,
                      fontSize: 8, fontWeight: 700, padding: "1px 4px",
                      fontFamily: "'DM Mono',monospace" }}>{pendingTasks}</span>
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
