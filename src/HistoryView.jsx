// ─────────────────────────────────────────────────────────────────
//  HistoryView — Task & Habit Activity Log
//  Same Card/SLabel/colors as App.jsx. Pure read-only view.
//  Props: userId, bp
// ─────────────────────────────────────────────────────────────────
import { useState, useMemo, useCallback } from "react";
import { getHistory, clearHistory } from "./services/storage.js";

// Same tokens as App.jsx
const AC      = "#C8F535";
const AC_DIM  = "#6FA81A";
const BG      = "#060606";
const CARD    = "#0e0e0e";
const CARD2   = "#131313";
const BORDER  = "#1c1c1c";
const BORDER2 = "#252525";
const TEXT     = "#e8e8e8";
const MUTED    = "#454545";
const MUTED2   = "#686868";
const RED      = "#f87171";
const BLUE     = "#7a8fff";

// ─── Event config ────────────────────────────────────────────────
const EVENT_META = {
  task_created:     { label: "Task Created",     icon: "＋", color: AC        },
  task_completed:   { label: "Task Completed",   icon: "✓",  color: "#4ade80" },
  task_reopened:    { label: "Task Reopened",    icon: "↺",  color: "#fb923c" },
  task_deleted:     { label: "Task Deleted",     icon: "✕",  color: RED       },
  research_added:   { label: "Research Added",   icon: "◐",  color: BLUE      },
  research_read:    { label: "Marked as Read",   icon: "✓",  color: "#4ade80" },
  research_deleted: { label: "Research Removed", icon: "✕",  color: RED       },
  habit_checked:    { label: "Habit Done",       icon: "✦",  color: AC        },
  habit_unchecked:  { label: "Habit Undone",     icon: "◌",  color: MUTED2    },
};

// ─── Helpers ─────────────────────────────────────────────────────
const getTodayKey     = () => new Date().toISOString().split("T")[0];
const getYesterdayKey = () => {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

function groupLabel(dateKey) {
  const today     = getTodayKey();
  const yesterday = getYesterdayKey();
  if (dateKey === today)     return "Today";
  if (dateKey === yesterday) return "Yesterday";
  return new Date(dateKey).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function timeStr(isoStr) {
  return new Date(isoStr).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─── Sub-components (module-level to avoid remount bug) ──────────

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

function Card({ children, style }) {
  return (
    <div style={{
      background: CARD, borderRadius: 14,
      border: `1px solid ${BORDER}`,
      padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

function EventRow({ event }) {
  const meta = EVENT_META[event.type] ?? { label: event.type, icon: "·", color: MUTED2 };
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "11px 0",
      borderBottom: `1px solid ${BORDER}`,
    }}>
      {/* Icon dot */}
      <div style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
        background: meta.color + "14",
        border: `1px solid ${meta.color}33`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, color: meta.color,
        fontFamily: "'DM Mono',monospace",
      }}>
        {meta.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 9, fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: meta.color,
            background: meta.color + "12",
            border: `1px solid ${meta.color}30`,
            borderRadius: 4, padding: "2px 7px",
          }}>
            {meta.label}
          </span>
          <span style={{ fontSize: 10, color: MUTED2, fontFamily: "'DM Mono',monospace" }}>
            {timeStr(event.timestamp)}
          </span>
        </div>
        <p style={{
          fontSize: 13, color: TEXT, margin: "5px 0 0",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {event.label}
        </p>
        {event.detail && (
          <p style={{ fontSize: 11, color: MUTED2, margin: "2px 0 0" }}>{event.detail}</p>
        )}
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, children, color }) {
  const col = color || AC;
  return (
    <button type="button" onClick={onClick} style={{
      padding: "4px 12px",
      background: active ? col : "transparent",
      color: active ? "#000" : MUTED2,
      border: `1px solid ${active ? col : BORDER}`,
      borderRadius: 20, cursor: "pointer",
      fontSize: 11, fontFamily: "'DM Mono',monospace",
      fontWeight: active ? 600 : 400, transition: "all 0.18s",
    }}>
      {children}
    </button>
  );
}

// ─── Main View ───────────────────────────────────────────────────
export default function HistoryView({ userId, bp }) {
  const isD = bp === "desktop";

  const [filter,        setFilter]        = useState("all");
  const [clearConfirm,  setClearConfirm]  = useState(false);
  const [, forceUpdate] = useState(0);   // to re-render after clear

  // Read history fresh from localStorage each render (no stale state)
  const allHistory = getHistory(userId);

  const FILTER_OPTIONS = [
    { value: "all",      label: "All"       },
    { value: "tasks",    label: "Tasks"     },
    { value: "research", label: "Research"  },
    { value: "habits",   label: "Habits"    },
  ];

  const TYPE_MAP = {
    tasks:    ["task_created","task_completed","task_reopened","task_deleted"],
    research: ["research_added","research_read","research_deleted"],
    habits:   ["habit_checked","habit_unchecked"],
  };

  const filtered = useMemo(() => {
    if (filter === "all") return allHistory;
    return allHistory.filter((e) => (TYPE_MAP[filter] ?? []).includes(e.type));
  }, [allHistory, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Group by date
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      const dateKey = e.timestamp.split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(e);
    });
    // Sort dates newest first
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const handleClear = useCallback(() => {
    clearHistory(userId);
    setClearConfirm(false);
    forceUpdate((n) => n + 1);
  }, [userId]);

  const totalToday = allHistory.filter((e) => e.timestamp.startsWith(getTodayKey())).length;
  const totalDone  = allHistory.filter((e) => ["task_completed","research_read","habit_checked"].includes(e.type)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Summary row */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isD ? "repeat(3,1fr)" : "repeat(3,1fr)" }}>
        {[
          { label: "Total Events",   val: allHistory.length, color: TEXT        },
          { label: "Today's Actions",val: totalToday,        color: AC          },
          { label: "Completions",    val: totalDone,         color: "#4ade80"   },
        ].map((s) => (
          <Card key={s.label} style={{ textAlign: "center", padding: "14px" }}>
            <p style={{ fontSize: isD ? 36 : 28, fontFamily: "'Cormorant Garamond',serif",
              fontWeight: 700, color: s.color, lineHeight: 1.1, margin: 0 }}>
              {s.val}
            </p>
            <p style={{ fontSize: 9, color: MUTED2, fontFamily: "'DM Mono',monospace",
              letterSpacing: "0.1em", marginTop: 4, marginBottom: 0 }}>
              {s.label.toUpperCase()}
            </p>
          </Card>
        ))}
      </div>

      {/* Filter + clear row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTER_OPTIONS.map((o) => (
            <FilterBtn key={o.value} active={filter === o.value} onClick={() => setFilter(o.value)}>
              {o.label}
            </FilterBtn>
          ))}
        </div>
        {allHistory.length > 0 && (
          clearConfirm ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: RED, fontFamily: "'DM Mono',monospace" }}>Clear all history?</span>
              <button type="button" onClick={handleClear}
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
              Clear history
            </button>
          )
        )}
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "48px 20px" }}>
          <p style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>📋</p>
          <p style={{ fontSize: 14, color: MUTED2, margin: 0, fontWeight: 500 }}>No activity yet</p>
          <p style={{ fontSize: 12, color: MUTED, margin: "6px 0 0" }}>
            {filter === "all"
              ? "Start completing habits and tasks — everything will be logged here."
              : `No "${filter}" events yet. Switch to "All" to see everything.`}
          </p>
        </Card>
      ) : (
        grouped.map(([dateKey, events]) => (
          <Card key={dateKey}>
            {/* Date group header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <p style={{
                fontSize: 13, fontWeight: 600, color: TEXT,
                fontFamily: "'Cormorant Garamond',serif", margin: 0,
              }}>
                {groupLabel(dateKey)}
              </p>
              <div style={{ flex: 1, height: 1, background: BORDER }}/>
              <span style={{
                fontSize: 9, color: MUTED2, fontFamily: "'DM Mono',monospace",
                background: CARD2, border: `1px solid ${BORDER2}`,
                borderRadius: 10, padding: "2px 8px",
              }}>
                {events.length} event{events.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Events */}
            <div>
              {events.map((event) => (
                <EventRow key={event.id} event={event}/>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
