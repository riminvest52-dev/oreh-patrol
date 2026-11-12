#!/bin/bash
# Скриншот 390×844 (через рамку dev/phone.html, масштаб 2): phone.sh имя "параметры" [время]
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
D="$(cd "$(dirname "$0")" && pwd)"; W=$(cygpath -w "$D")
Q=$(python -c "import sys,urllib.parse;print(urllib.parse.quote('shot-vol.html?'+sys.argv[1],safe=''))" "$2")
"$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,900 --force-device-scale-factor=2 --virtual-time-budget=${3:-3000} --screenshot="$W/raw-$1.png" "http://localhost:${PORT:-8765}/dev/phone.html?$Q" >/dev/null 2>&1
python -c "from PIL import Image;import sys;im=Image.open(sys.argv[1]);im.crop((0,0,780,1688)).save(sys.argv[2])" "$D/raw-$1.png" "$D/$1-390x844.png" && rm -f "$D/raw-$1.png"
echo "$1"
