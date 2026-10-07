# GitHub Pages + Cloudflare Worker: деплой без FastAPI

Проект переделан так, что GitHub Pages обслуживает весь интерфейс, конспекты, практику, прогресс, 3D-модель и браузерную озвучку. Python/FastAPI больше не нужен для публичной версии.

## Новая архитектура

```text
GitHub Pages
  React / Vite
  ├─ notes-data.json -> темы и конспекты локально
  ├─ localStorage -> прогресс, история, закладки
  ├─ Web Speech API -> TTS и голосовой ввод
  ├─ tutor.glb -> 3D локально
  └─ HTTPS -> Cloudflare Worker -> Groq API
                                  └─ GROQ_API_KEY хранится только как secret
```

Нельзя помещать `GROQ_API_KEY` в `VITE_*`, JavaScript, `.env` фронтенда или GitHub Pages: всё, что попадает в клиентскую сборку, пользователь может увидеть.

## 1. Развернуть AI Worker

Откройте терминал в:

```bash
cd serverless/cloudflare-worker
npm install
```

В `wrangler.jsonc` замените:

```json
"ALLOWED_ORIGINS": "http://localhost:5173"
```

на origin вашего GitHub Pages, например:

```json
"ALLOWED_ORIGINS": "https://jarv1s-stack.github.io"
```

Важно: origin содержит только протокол + домен, без `/metu_rus_silabus/`.

Авторизуйтесь и добавьте Groq key как secret:

```bash
npx wrangler login
npx wrangler secret put GROQ_API_KEY
```

Затем:

```bash
npm run deploy
```

После деплоя Cloudflare покажет URL примерно такого вида:

```text
https://metu-russian-ai.<your-subdomain>.workers.dev
```

Проверьте:

```text
https://metu-russian-ai.<your-subdomain>.workers.dev/api/health
```

## 2. Передать URL Worker во frontend

В GitHub откройте репозиторий:

`Settings -> Secrets and variables -> Actions -> Variables -> New repository variable`

Создайте переменную:

```text
Name: VITE_AI_API_URL
Value: https://metu-russian-ai.<your-subdomain>.workers.dev
```

Это не секрет. Секретным является только `GROQ_API_KEY`, и он остаётся в Cloudflare.

## 3. Включить GitHub Pages

В GitHub:

`Settings -> Pages -> Build and deployment -> Source -> GitHub Actions`

После push в ветку `main` workflow `.github/workflows/deploy-pages.yml` автоматически:

1. установит зависимости;
2. соберёт `frontend`;
3. загрузит `frontend/dist` в GitHub Pages.

Vite настроен с `base: './'`, поэтому проект работает как на корневом домене, так и по адресу вида:

```text
https://USERNAME.github.io/REPOSITORY/
```

## 4. Локальная разработка без Python

Frontend:

```bash
cd frontend
npm ci
npm run dev
```

Без `VITE_AI_API_URL` сайт запускается в полностью статическом режиме: конспекты, практика, прогресс, поиск, 3D и браузерный TTS работают, а AI заменяется локальным поиском по конспектам.

Чтобы тестировать Worker локально, создайте:

```text
serverless/cloudflare-worker/.dev.vars
```

с содержимым:

```env
GROQ_API_KEY=ваш_ключ
```

затем:

```bash
cd serverless/cloudflare-worker
npm run dev
```

И запустите frontend с:

```bash
VITE_AI_API_URL=http://localhost:8787 npm run dev
```

В PowerShell:

```powershell
$env:VITE_AI_API_URL="http://localhost:8787"
npm run dev
```

## Что теперь не зависит от FastAPI

- `/api/topics` удалён из frontend: темы читаются из `src/notes-data.json`;
- `/api/topics/:id` удалён: текст темы уже встроен в frontend;
- `/api/tts` удалён: используется `speechSynthesis` браузера;
- `/api/health` FastAPI больше не нужен;
- `/api/chat` перенесён в Cloudflare Worker;
- PWA, логотип и `tutor.glb` используют корректный base path GitHub Pages.

## Что делать со старой папкой backend

Она оставлена только как legacy/local-вариант и больше не нужна для GitHub Pages. Её можно удалить после того, как убедитесь, что Worker и Pages работают. Публичный workflow её не устанавливает и не запускает.
