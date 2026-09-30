#! /bin/bash

SESSION_NAME="prod"
DEPLOY_CMD="npm run deploy"
QUIZ_SESSION="quiz"
QUIZ_CMD="npm run quiz:server"
WEBSITE_URL="https://ieee-dev.wpi.edu"

# Restart only the site. The quiz game server runs in its own tmux session so
# a site deploy never kills a live game; use ./deploy-quiz.sh to restart it.
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
echo ">> Server killed"

# Start the quiz server if it isn't already running.
if ! tmux has-session -t "$QUIZ_SESSION" 2>/dev/null; then
  tmux new -d -s "$QUIZ_SESSION" "$QUIZ_CMD"
  echo ">> Quiz server started in tmux session $QUIZ_SESSION."
fi

# Start a new tmux session and run the command inside it
tmux new -s "$SESSION_NAME" "$DEPLOY_CMD"
echo
printf ">> Session $SESSION_NAME started.\n"
printf ">> Use tmux attach to monitor deployment.\n"
printf ">> Exit tmux with Ctrl-B + D.\n"
echo

# Calculate box width and messages
BOX_WIDTH=$((${#WEBSITE_URL} + 4))
HEADER_MESSAGE="Site is up at:"
HEADER_PADDING=$((($BOX_WIDTH - ${#HEADER_MESSAGE}) / 2))

# Print the box with the header and clickable link
echo
printf "%${BOX_WIDTH}s\n" | tr " " "#"
printf "#%-*s%-*s#\n" "$HEADER_PADDING" "" $(($BOX_WIDTH - $HEADER_PADDING - 2)) "$HEADER_MESSAGE"
printf "# %-*s #\n" $((${BOX_WIDTH} - 4)) "$(printf '\033]8;;%s\033\\%s\033]8;;\033\\' "$WEBSITE_URL" "$WEBSITE_URL")"
printf "%${BOX_WIDTH}s\n" | tr " " "#"
echo
