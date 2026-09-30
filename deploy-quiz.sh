#! /bin/bash
# Restart the live quiz game server. This ENDS ANY GAME IN PROGRESS
# (results of in-progress games are saved first). Don't run it during an event.

QUIZ_SESSION="quiz"
QUIZ_CMD="npm run quiz:server"

if [ "$1" != "-y" ]; then
  health=$(curl -s --max-time 2 http://localhost:9001/health)
  echo ">> Current quiz server status: ${health:-not running}"
  read -r -p ">> Restart the quiz server and end any live games? [y/N] " answer
  [ "$answer" = "y" ] || { echo ">> Cancelled."; exit 1; }
fi

tmux send-keys -t "$QUIZ_SESSION" C-c 2>/dev/null && sleep 1
tmux kill-session -t "$QUIZ_SESSION" 2>/dev/null || true
tmux new -d -s "$QUIZ_SESSION" "$QUIZ_CMD"
echo ">> Quiz server restarting in tmux session $QUIZ_SESSION (tmux attach -t $QUIZ_SESSION)."
sleep 4
echo ">> $(curl -s --max-time 2 http://localhost:9001/health || echo 'not responding yet; check tmux')"
