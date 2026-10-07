import json
from pathlib import Path
root = Path(__file__).resolve().parent
rows = [{'id': p.name, 'title': p.read_text(encoding='utf-8').splitlines()[0], 'text': p.read_text(encoding='utf-8')} for p in sorted((root / 'backend/notes').glob('*.md'))]
(root / 'frontend/src/notes-data.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Synced {len(rows)} notes. Rebuild frontend and restart server.')
