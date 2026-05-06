// ─────────────────────────────────────────────────────────────────
//  ELEVATE — Storage Service Layer  (v1)
//  Pure functions. No React. Easy to swap for a real backend later.
//
//  localStorage keys used:
//    elevate_users          → array of all registered users
//    elevate_session        → { userId, email, name } of logged-in user
//    elevate_habits_{uid}   → per-user habit data
//    elevate_todos_{uid}    → per-user custom tasks
//    elevate_research_{uid} → per-user research topics
//    elevate_history_{uid}  → per-user event history
// ─────────────────────────────────────────────────────────────────

// ─── Internal helpers ────────────────────────────────────────────

/** Read a JSON value from localStorage, returns fallback on any error */
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** Write a JSON value to localStorage */
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // storage quota exceeded
  }
}

/**
 * Very lightweight hash using btoa.
 * NOT cryptographic — only for local-storage simulated auth.
 * Good enough so plain passwords aren't stored.
 */
function hashPassword(password) {
  return btoa(encodeURIComponent(password + "elevate_salt_2024"));
}

/** Generate a simple unique user ID */
function generateUserId() {
  return "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── Auth ────────────────────────────────────────────────────────

/**
 * signup(name, email, password)
 * Returns { ok: true, user } or { ok: false, error: string }
 */
export function signup(name, email, password) {
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return { ok: false, error: "All fields are required." };
  }
  if (!email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const users = lsGet("elevate_users", []);
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const newUser = {
    id:        generateUserId(),
    name:      name.trim(),
    email:     email.toLowerCase().trim(),
    password:  hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  lsSet("elevate_users", [...users, newUser]);

  // Auto-login after signup
  const session = { userId: newUser.id, email: newUser.email, name: newUser.name };
  lsSet("elevate_session", session);

  return { ok: true, user: session };
}

/**
 * login(email, password)
 * Returns { ok: true, user } or { ok: false, error: string }
 */
export function login(email, password) {
  if (!email?.trim() || !password?.trim()) {
    return { ok: false, error: "Email and password are required." };
  }

  const users = lsGet("elevate_users", []);
  const found = users.find((u) => u.email === email.toLowerCase().trim());

  if (!found) {
    return { ok: false, error: "No account found with this email." };
  }
  if (found.password !== hashPassword(password)) {
    return { ok: false, error: "Incorrect password. Please try again." };
  }

  const session = { userId: found.id, email: found.email, name: found.name };
  lsSet("elevate_session", session);

  return { ok: true, user: session };
}

/**
 * logout()
 * Clears the current session.
 */
export function logout() {
  localStorage.removeItem("elevate_session");
}

/**
 * getSession()
 * Returns current session { userId, email, name } or null.
 */
export function getSession() {
  return lsGet("elevate_session", null);
}

// ─── Per-user data ────────────────────────────────────────────────
// All data functions require a userId so data is per-user.

export function getHabits(userId) {
  return lsGet(`elevate_habits_${userId}`, {});
}
export function saveHabits(userId, data) {
  return lsSet(`elevate_habits_${userId}`, data);
}

export function getTasks(userId) {
  return lsGet(`elevate_todos_${userId}`, []);
}
export function saveTasks(userId, tasks) {
  return lsSet(`elevate_todos_${userId}`, tasks);
}

export function getResearch(userId) {
  return lsGet(`elevate_research_${userId}`, []);
}
export function saveResearch(userId, research) {
  return lsSet(`elevate_research_${userId}`, research);
}

// ─── History ──────────────────────────────────────────────────────

/**
 * getHistory(userId)
 * Returns array of history events, newest first.
 */
export function getHistory(userId) {
  return lsGet(`elevate_history_${userId}`, []);
}

/**
 * addHistoryEvent(userId, event)
 * event shape: { type, label, detail?, status }
 *
 * type values:
 *   "task_created"    — user added a new custom task
 *   "task_completed"  — user checked off a task
 *   "task_reopened"   — user unchecked a task
 *   "task_deleted"    — user deleted a task
 *   "research_added"  — user added a research topic
 *   "research_read"   — user marked research as read
 *   "research_deleted"— user deleted a research topic
 *   "habit_checked"   — user completed a daily habit
 *   "habit_unchecked" — user unchecked a daily habit
 */
export function addHistoryEvent(userId, event) {
  if (!userId) return;
  const history = getHistory(userId);
  const newEvent = {
    id:        "h_" + Date.now().toString(36),
    timestamp: new Date().toISOString(),
    ...event,
  };
  // Keep newest first, cap at 500 entries to avoid storage bloat
  const updated = [newEvent, ...history].slice(0, 500);
  lsSet(`elevate_history_${userId}`, updated);
}

/**
 * clearHistory(userId)
 * Wipes all history for this user.
 */
export function clearHistory(userId) {
  localStorage.removeItem(`elevate_history_${userId}`);
}
