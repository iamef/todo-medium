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

| Category           | Technology                                    |
|--------------------|-----------------------------------------------|
| UI Framework       | React 18.3.1                                  |
| Component Library  | Material UI (MUI) v6 + @mui/x-date-pickers   |
| Styling            | Emotion (CSS-in-JS)                           |
| Animations         | Framer Motion v4                              |
| Backend/Auth       | Firebase v9 (Firestore, Realtime DB, Auth)    |
| Calendar API       | Google Calendar API (gapi)                     |
| Date Utilities     | date-fns v4                                   |
| Build Tool         | Vite                                          |
| Testing            | Vitest + React Testing Library                |

### Structure

```
src/
├── components/     # Form, TodoList, TodoItem, Sidebar, CalendarIntegration, etc. (.jsx)
├── utils/          # todosFunctions.js, gapiFunctions.js, eventBus.js
├── App.jsx         # Root — manages gapi + Firebase auth state
└── firebase.js     # Firebase config
```

### Branch State (as of 2026-03-27)

**Master** — React 18 migration complete (PR #29), CRA-to-Vite migration (PR #27), sort-todos crash fix (PR #28) all merged.

**Open PRs** (merge into master):
1. `cleanup/remove-debug-statements` (PR #30) — Remove debugger statements and console.logs
2. `fix/eventbus-memory-leak` (PR #31) — Store listener references for proper cleanup
3. `cleanup/remove-dead-code` (PR #32) — Remove dead code, unused files, and deps
4. `refactor/firebase-auth` (PR #33) — Simplify auth and use env vars for config

**Merged PRs (recent):** `upgrade/react-18.3.1` (#29), `fix/sort-empty-duedate-crash` (#28), `build/migrate-cra-to-vite` (#27), `fix/gapi-init-teardown` (#22), `sidebar` (#19), `sort-todos` (#17)

## General Principles

When proposing solutions, start with the simplest approach.

## Workflow

Before editing code, confirm the approach with the user. Do not jump straight to editing files. When the user provides a hypothesis or context, address that specifically before exploring alternatives.

## Git & Commits

For commit messages: use conventional commits format with the scope. Do not use 'fix' when 'feat' is more appropriate. Keep closely related changes in a single commit unless explicitly asked to split. Always verify the commit type matches the actual change.

## Code Review & PRs

When reviewing code or writing PR descriptions, only describe what actually changed. Do not infer or assume root causes — ask the user to confirm before writing descriptions of bugs or fixes.
