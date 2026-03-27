# CLAUDE.md

## Project Context

This is a React-based web application using JavaScript. The main codebase involves React components, Firebase (Firestore + Auth), and Google Calendar API integration.

### App Summary

**What it does:** A React-based Todo & Task Scheduler that unifies task management with Google Calendar. Users can create/manage todos with due dates, deadlines, priority levels, estimated time, and recurring schedules — all synced with Firebase and integrated with Google Calendar.

**Key features:**
- Todo creation with rich properties (priority, deadlines, recurrence, estimated time)
- Folder/list organization via a sidebar
- Google Calendar sync to view calendar events alongside todos
- Firebase Auth (Google OAuth) with real-time Firestore persistence
- Offline support via IndexedDB persistence

### Tech Stack

> **Note:** These versions reflect the target state from open PRs (#12–#17). Master is still on React 16, MUI v5, and date-fns v2.

| Category           | Technology                                    |
|--------------------|-----------------------------------------------|
| UI Framework       | React 18.3.1                                  |
| Component Library  | Material UI (MUI) v6 + @mui/x-date-pickers   |
| Styling            | Emotion (CSS-in-JS)                           |
| Animations         | Framer Motion v4                              |
| Backend/Auth       | Firebase v9 (Firestore, Realtime DB, Auth)    |
| Calendar API       | Google Calendar API (gapi)                     |
| Date Utilities     | date-fns v4                                   |
| Build Tool         | Create React App (react-scripts v5)           |
| Testing            | React Testing Library                         |

### Structure

```
src/
├── components/     # Form, TodoList, TodoItem, Sidebar, CalendarIntegration, etc.
├── utils/          # todosFunctions.js, gapiFunctions.js, eventBus.js
├── App.js          # Root — manages gapi + Firebase auth state
└── firebase.js     # Firebase config
```

### Branch State (as of 2026-03-20)

**Master** — includes sort-todos (PR #17, merged).

**Feature PRs** (merge into master):
1. `sidebar` (PR #19) → `master` — Sidebar, eventBus, react-scripts 5, code cleanup

**Staging branch:**
- `upgrade/react-18.3.1` — branched from `master`, will be the target for all React 18 migration PRs. Merge into master when complete.

**React 18 migration PRs** (merge into `upgrade/react-18.3.1` in order):
1. `refactor/react18-core-deps` (PR #12) — React 18.3.1 + testing lib updates
2. `refactor/react18-create-root` (PR #13) — Migrate to `createRoot` API
3. `fix/react18-strict-mode-effects` (PR #14) — useEffect cleanup for Strict Mode
4. `chore/mui-v6-migration` (PR #15) — MUI v6 + date-fns v4 + `@mui/x-date-pickers`
5. `chore/cleanup-deps` (PR #16) — Remove unused deps, update utilities

**Merged branches (deleted):** `add-folders-and-lists`, `buffer-priority-calculation`, `calculate-overshoots`, `firebase-users`, `quick-add-todo`, `recurring-todos`, `sort-todos`, `update-to-firestore`

**To delete:** `test-branch` — just a test commit, no unique work

## General Principles

When proposing solutions, start with the simplest approach.

## Workflow

Before editing code, confirm the approach with the user. Do not jump straight to editing files. When the user provides a hypothesis or context, address that specifically before exploring alternatives.

## Git & Commits

For commit messages: use conventional commits format with the scope. Do not use 'fix' when 'feat' is more appropriate. Keep closely related changes in a single commit unless explicitly asked to split. Always verify the commit type matches the actual change.

## Code Review & PRs

When reviewing code or writing PR descriptions, only describe what actually changed. Do not infer or assume root causes — ask the user to confirm before writing descriptions of bugs or fixes.
