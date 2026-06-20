#!/usr/bin/env bash
# Stop hook: auto-commit and push any working-tree changes after each turn.
# Exits 0 (non-blocking) in all cases so a failed push never interrupts the session.

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

git add -A
# Nothing staged → nothing changed this turn; do nothing.
git diff --cached --quiet && exit 0

git commit -q \
  -m "Auto-commit $(date '+%Y-%m-%d %H:%M:%S %Z')" \
  -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" >/dev/null 2>&1 || exit 0

git push -q origin HEAD >/dev/null 2>&1
push_status=$?

sha=$(git rev-parse --short HEAD 2>/dev/null)
if [ "$push_status" -eq 0 ]; then
  printf '{"systemMessage":"Auto-committed & pushed %s"}\n' "$sha"
else
  printf '{"systemMessage":"Auto-committed %s (push failed — push manually)"}\n' "$sha"
fi
exit 0
