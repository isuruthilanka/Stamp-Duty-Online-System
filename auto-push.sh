#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Auto-commit & push watcher
#  Usage: ./auto-push.sh
#  Watches for file changes and automatically commits + pushes.
# ─────────────────────────────────────────────────────────────

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SSH_KEY="$HOME/.ssh/isuruthilanka-GitHub"
BRANCH="main"
DEBOUNCE=3   # seconds to wait after last change before committing

export GIT_SSH_COMMAND="ssh -i $SSH_KEY -o StrictHostKeyChecking=no"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Auto-push watcher started"
echo "  Repo : $REPO_DIR"
echo "  Branch: $BRANCH"
echo "  Press Ctrl+C to stop."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$REPO_DIR"

PENDING=0

do_push() {
    cd "$REPO_DIR"
    if [ -n "$(git status --porcelain)" ]; then
        TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
        git add -A
        git commit -m "auto: changes at $TIMESTAMP"
        if git push origin "$BRANCH" 2>&1; then
            echo "✅  Pushed at $TIMESTAMP"
        else
            echo "❌  Push failed at $TIMESTAMP — check SSH key / network"
        fi
    fi
    PENDING=0
}

# Watch everything except node_modules, .git, dist, sqlite files
fswatch -r -o \
    --exclude ".*node_modules.*" \
    --exclude ".*\.git.*" \
    --exclude ".*dist.*" \
    --exclude ".*\.sqlite$" \
    --exclude ".*auto-push\.sh$" \
    "$REPO_DIR" | while read -r; do
        PENDING=1
        sleep $DEBOUNCE
        if [ "$PENDING" -eq 1 ]; then
            do_push
        fi
    done
