import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch, AsyncMock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
import main
from fastapi.testclient import TestClient

class FakeResponse:
    def raise_for_status(self): pass
    async def aiter_lines(self):
        for token in ['Тема ', 'объяснена.']:
            yield 'data: ' + json.dumps({'choices': [{'delta': {'content': token}}]})
        yield 'data: [DONE]'
    async def __aenter__(self): return self
    async def __aexit__(self, *args): pass

class FakeClient:
    payload = None
    def __init__(self, **kwargs): pass
    async def __aenter__(self): return self
    async def __aexit__(self, *args): pass
    def stream(self, *args, **kwargs):
        FakeClient.payload = kwargs['json']
        return FakeResponse()

class BrokenResponse(FakeResponse):
    def raise_for_status(self): raise RuntimeError('provider unavailable')
class BrokenClient(FakeClient):
    def stream(self, *args, **kwargs): return BrokenResponse()

class CourseTests(unittest.TestCase):
    def setUp(self): self.client = TestClient(main.app)
    def test_materials_and_unknown_paths(self):
        topics = self.client.get('/api/topics').json()
        self.assertEqual(len(topics), 15)
        for topic in topics:
            result = self.client.get('/api/topics/' + topic['id'])
            self.assertEqual(result.status_code, 200)
            self.assertIn('Разобранный пример', result.json()['text'])
        self.assertEqual(self.client.get('/api/topics/requirements.txt').status_code, 404)
        self.assertEqual(self.client.get('/api/nonexistent').status_code, 404)
        self.assertEqual(self.client.get('/nonexistent.glb').status_code, 404)
    def test_question_validation(self):
        for question in ['', '  ', 'x' * 2001]:
            self.assertEqual(self.client.post('/api/chat', json={'question': question}).status_code, 422)
    def test_local_chat_and_exam(self):
        with patch.object(main, 'KEY', ''):
            r = self.client.post('/api/chat', json={'question': 'Что такое коммуникативная задача текста? '})
            self.assertEqual(r.status_code, 200)
            self.assertIn('text/event-stream', r.headers['content-type'])
            self.assertIn('Локальный поиск', r.text)
            self.assertIn('КЗТ', r.text)
            quiz = self.client.post('/api/chat', json={'question': 'Задай студенту вопрос по теме «Научный стиль».'})
            self.assertIn('Объясните понятие', quiz.text)
    def test_ai_stream_and_history_contract(self):
        with patch.object(main, 'KEY', 'test-key'), patch.object(main.httpx, 'AsyncClient', FakeClient):
            r = self.client.post('/api/chat', json={'question': 'Объясни научный стиль', 'history': [{'role':'user','content':'Привет'}, {'role':'assistant','content':'Здравствуйте'}]})
        events = [json.loads(part[6:]) for part in r.text.strip().split('\n\n')]
        self.assertEqual(''.join(e['value'] for e in events if e['type'] == 'text'), 'Тема объяснена.')
        self.assertEqual(events[-1]['type'], 'done')
        self.assertEqual(FakeClient.payload['messages'][0]['role'], 'system')
        self.assertEqual(FakeClient.payload['messages'][-1]['content'], 'Объясни научный стиль')
        self.assertEqual(FakeClient.payload['messages'][1]['content'], 'Привет')
    def test_provider_failure_is_readable(self):
        with patch.object(main, 'KEY', 'test-key'), patch.object(main.httpx, 'AsyncClient', BrokenClient):
            r = self.client.post('/api/chat', json={'question':'Тема'})
        self.assertIn('AI недоступен', r.text)
        self.assertNotIn('provider unavailable', r.text)
    def test_female_speech_and_validation(self):
        main.TTS_CACHE.clear()
        for payload in [{'text':' '}, {'text':'x','speed':1.4}, {'text':'x'*1401}]:
            self.assertEqual(self.client.post('/api/tts',json=payload).status_code,422)
        with patch.object(main,'synthesize',AsyncMock(return_value=b'ID3-fake-audio')) as mock:
            response=self.client.post('/api/tts',json={'text':'Здравствуйте','speed':1.0})
            self.assertEqual(response.status_code,200)
            self.assertEqual(response.headers['content-type'],'audio/mpeg')
            self.assertEqual(response.headers['x-tts-voice'],'ru-RU-SvetlanaNeural')
            mock.assert_awaited_once_with('Здравствуйте',1.0)
            self.client.post('/api/tts',json={'text':'Здравствуйте','speed':1.0})
            self.assertEqual(mock.await_count,1)
    def test_speech_error_and_asset(self):
        with patch.object(main,'synthesize',AsyncMock(side_effect=RuntimeError('private speech error'))):
            result=self.client.post('/api/tts',json={'text':'Ошибка провайдера'})
        self.assertEqual(result.status_code,503)
        self.assertNotIn('private speech error',result.text)
        model=self.client.get('/models/tutor.glb')
        self.assertEqual(model.status_code,200)
        self.assertEqual(model.content[:4],b'glTF')

    def test_static_build_and_no_shared_log(self):
        self.assertEqual(self.client.get('/').status_code, 200)
        self.assertIn('root', self.client.get('/').text)
        self.assertEqual(self.client.get('/api/stats').json()['total'], 0)
        self.assertEqual(self.client.get('/sw.js').status_code, 200)

if __name__ == '__main__': unittest.main()
