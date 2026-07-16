# Project instructions

**Read [MYTURN.md](MYTURN.md) in full before doing anything else in this project.** It contains Ann's standing instructions, cross-session file-edit coordination (claims/queue), quick debriefs on how auth/deployment/backend work, and outstanding manual action items she's waiting on. This applies to every session in this repo, every time — not just the first one.

A `SessionStart` hook (`.claude/hooks/session_start_myturn.py`, wired in `.claude/settings.json`) already auto-injects MYTURN.md's contents into context at the start of each session. This file is a backstop: if that hook is ever skipped, disabled, or not yet picked up (e.g. `.claude/settings.json` just changed and hasn't been reloaded), reading this line is what tells you to go read MYTURN.md manually before touching any file.

Everything else project-specific — file locations, shared files to watch, account/backend details, what's still outstanding — lives in MYTURN.md, not here, so there's one source of truth to keep updated.
