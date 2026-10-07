# Технологии v11

## Реализовано

- React 18, Framer Motion, View Transitions с учётом prefers-reduced-motion.
- Three.js, React Three Fiber и локальный GLB с текстурами, скелетом, 13 лицевыми формами.
- GLTF sparse accessors и EXT_texture_webp уменьшают передаваемый размер аватара.
- React.lazy/Suspense отделяют 3D-модуль от основного интерфейса.
- IntersectionObserver и Page Visibility API приостанавливают невидимый 3D-рендер.
- FastAPI SSE и AbortController для потокового ответа и корректной отмены.
- Edge TTS / необязательный Azure Speech: женский русский ru-RU-SvetlanaNeural.
- Web Audio AnalyserNode: движения рта связаны с реальным аудиосигналом.
- Native dialog для поиска, локальные закладки, заметки, режим чтения, учебный таймер.
- Service Worker кеширует интерфейс и локальную модель; API не кешируется.

## Первичные источники

- Microsoft Rocketbox — модель и условия MIT: https://github.com/microsoft/Microsoft-Rocketbox
- Оригинальная модель: Assets/Avatars/Adults/Female_Adult_01/Export/Female_Adult_01_facial.fbx в этом репозитории. Изменения: конвертация GLB, выбор лицевых форм, адаптация материалов и оптимизация текстур.
- Microsoft — список голосов: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
- edge-tts — реализация и управление темпом: https://github.com/rany2/edge-tts
- Three.js — загрузка моделей: https://threejs.org/manual/pages/loading-3d-models.html
- Khronos — morph targets: https://github.khronos.org/glTF-Tutorials/gltfTutorial/gltfTutorial_017_SimpleMorphTarget.html
- FastAPI StreamingResponse: https://fastapi.tiangolo.com/advanced/custom-response/
- IntersectionObserver: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API

Система синхронизации рта использует амплитуду и несколько форм; точное распознавание фонем не заявляется. Для фотореализма уровня видеозаписи потребуется отдельная специализированная цифровая модель и более сложный рендер; эта версия использует оптимизированный человеческий игровой аватар.
