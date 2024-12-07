#! /bin/bash

SESSION_NAME="prod"
DEPLOY_CMD="npm run deploy"
WEBSITE_URL="https://ieee-dev.wpi.edu"

# Kill tmux sessions (proceed even if command fails)
tmux kill-server || true
echo ">> Server killed"

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
