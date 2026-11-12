#!/bin/bash
# Скриншоты Объёмной мастерской: shoot.sh имя "параметры" [ширина высота время]
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
D="$(cd "$(dirname "$0")" && pwd)"; W=$(cygpath -w "$D")
"$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=${3:-1280},${4:-800} --virtual-time-budget=${5:-3000} --screenshot="$W/$1.png" "http://localhost:${PORT:-8765}/dev/shot-vol.html?$2" 2>&1 | grep -v ERROR
echo "$1"
