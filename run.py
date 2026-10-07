"""Serve the included frontend build and API on one port."""
import argparse
import importlib.util
import socket
import sys
import threading
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--host', default='127.0.0.1')
parser.add_argument('--port', type=int, default=8000)
parser.add_argument('--no-browser', action='store_true')
args = parser.parse_args()
missing = [m for m in ('fastapi', 'uvicorn', 'httpx', 'dotenv', 'edge_tts') if importlib.util.find_spec(m) is None]
if missing:
    print('Install dependencies first: python -m pip install -r backend/requirements.txt')
    sys.exit(1)
if not (ROOT / 'frontend/dist/index.html').exists():
    print('Frontend build missing. Run npm ci and npm run build in frontend/.')
    sys.exit(1)
sys.path.insert(0, str(ROOT / 'backend'))
import uvicorn
url = f'http://127.0.0.1:{args.port}'
def open_ready():
    import time
    for _ in range(80):
        try:
            with socket.create_connection(('127.0.0.1', args.port), timeout=.2):
                webbrowser.open(url)
                return
        except OSError:
            time.sleep(.1)
if not args.no_browser:
    threading.Thread(target=open_ready, daemon=True).start()
print(f'Russian Tutor: {url}; press Ctrl+C to stop.')
uvicorn.run('main:app', host=args.host, port=args.port)
