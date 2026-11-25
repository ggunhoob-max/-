import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const MODEL_CANDIDATES = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function isTransientError(error: any): boolean {
  const msg = String(error?.message || error || '');
  const status = error?.status || error?.code;
  return (
    status === 503 ||
    status === 500 ||
    status === 429 ||
    status === 404 ||
    /503|UNAVAILABLE|high demand|overloaded|429|RESOURCE_EXHAUSTED|404|NOT_FOUND|timed out|ECONNRESET|ETIMEDOUT/i.test(msg)
  );
}

// Endpoint for 10-year veteran sound curator AI mixset generation
app.post('/api/curate', async (req, res) => {
  const startedAt = Date.now();
  try {
    const { moodPrompt, userApiKey } = req.body;
    if (!moodPrompt || typeof moodPrompt !== 'string' || !moodPrompt.trim()) {
      return res.status(400).json({ error: '기분이나 상황을 입력해주세요 (예: 비 오는 날 들을 감성적인 시티팝)' });
    }

    const activeKey = (typeof userApiKey === 'string' && userApiKey.trim()) || process.env.GEMINI_API_KEY;
    if (!activeKey) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY가 설정되어 있지 않습니다. Settings > Secrets 패널에서 API 키를 확인해주세요.',
      });
    }

    const clientAi =
      typeof userApiKey === 'string' && userApiKey.trim()
        ? new GoogleGenAI({
            apiKey: activeKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          })
        : ai;

    const systemInstruction = `당신은 멜론(Melon)에서 10년 동안 활동한 대한민국 최정상 음원 큐레이터이자 사운드 디렉터입니다.
사용자가 입력한 기분, 시간대, 날씨, 장소, 상황에 완벽히 몰입할 수 있는 '맞춤형 15초 하이라이트 믹스셋'을 기획합니다.

[큐레이션 원칙]
1. 3곡의 트랙은 단순 나열이 아닌 '기승전결(1번: 인트로 그루브 -> 2번: 클라이맥스/킬링파트 -> 3번: 여운을 주는 아웃트로)'의 유기적 흐름을 갖춥니다.
2. 실존하는 명곡(K-POP, 감성 시티팝, 힙합, R&B, 인디 밴드, 신스웨이브, 로파이, 재즈 등)을 기반으로 선곡합니다.
3. 15초 미리듣기에 어울리는 킬링 구간의 무드(previewVibe)를 생생하게 묘사합니다.
4. 분위기에 맞는 메인 헥스 컬러(themeColor)를 제안하여 시각적 파형 및 독 UI와 공감각적으로 어우러지게 합니다. (예: 시티팝/비: #00E5FF 또는 #38BDF8, 딥한 새벽: #A855F7, 멜론 오리지널: #00CD3C, 따뜻한 어쿠스틱: #F59E0B 등)

[응답 JSON 스키마]
반드시 지정된 JSON 스키마 규격으로만 응답하세요.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        mixsetTitle: {
          type: Type.STRING,
          description: '15초 믹스셋의 감각적이고 매력적인 타이틀 (예: 빗방울 머금은 네온 시티팝 15s 믹스)',
        },
        curatorComment: {
          type: Type.STRING,
          description: '10년 차 큐레이터의 한 줄 큐레이션 노트 (선곡 의도 및 톤앤매너 흐름 설명)',
        },
        themeColor: {
          type: Type.STRING,
          description: '믹스셋 분위기를 대변하는 메인 헥스 컬러 (예: #00E5FF, #00CD3C, #A855F7, #EC4899)',
        },
        tracks: {
          type: Type.ARRAY,
          description: '정확히 3곡의 추천 트랙 리스트',
          items: {
            type: Type.OBJECT,
            properties: {
              rank: { type: Type.INTEGER, description: '1, 2, 3 순위' },
              title: { type: Type.STRING, description: '곡 제목' },
              artist: { type: Type.STRING, description: '아티스트명' },
              genre: { type: Type.STRING, description: '세부 장르 (예: City Pop · 80s Synth)' },
              tag: { type: Type.STRING, description: '독 카드 상단 태그 (예: 01 인트로 그루브, 02 킬링 파트, 03 칠 아웃트로)' },
              previewVibe: { type: Type.STRING, description: '15초 하이라이트 구간의 사운드 질감' },
              badge: { type: Type.STRING, description: '재생 시 상단 미세 뱃지에 뜰 문구 (예: 젖은 밤거리를 울리는 베이스라인 재생 중)' },
              color: { type: Type.STRING, description: '트랙 테마 헥스 컬러' },
              gradient: { type: Type.STRING, description: 'Tailwind gradient 클래스 (예: from-emerald-600 to-teal-400)' },
            },
            required: ['rank', 'title', 'artist', 'genre', 'tag', 'previewVibe', 'badge', 'color', 'gradient'],
          },
        },
      },
      required: ['mixsetTitle', 'curatorComment', 'themeColor', 'tracks'],
    };

    let lastError: any = null;

    for (let i = 0; i < MODEL_CANDIDATES.length; i++) {
      const model = MODEL_CANDIDATES[i];
      const attemptStart = Date.now();
      try {
        const config: Record<string, any> = {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        };

        if (model === 'gemini-4-hydrogen') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        } else if (model === 'gemini-3.1-flash-lite') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
        }

        const response = await withTimeout(
          clientAi.models.generateContent({
            model,
            contents: `사용자 큐레이션 요청: "${moodPrompt.trim()}"`,
            config,
          }),
          15000,
          `Model ${model}`
        );

        const rawText = (response.text || '{}')
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();

        const data = JSON.parse(rawText);
        if (!data || !Array.isArray(data.tracks) || data.tracks.length < 3) {
          throw new Error('트랙 리스트 형식이 올바르지 않습니다.');
        }

        console.log(`Curation succeeded with ${model} in ${Date.now() - attemptStart}ms`);
        return res.json(data);
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed after ${Date.now() - attemptStart}ms:`, err?.message || err);
        if (!isTransientError(err)) {
          break;
        }
        if (i < MODEL_CANDIDATES.length - 1) {
          await sleep(300 * (i + 1));
        }
      }
    }

    const errMsg = String(lastError?.message || '');
    console.error(`All models failed after ${Date.now() - startedAt}ms:`, errMsg);

    if (/API_KEY_INVALID|API key not valid|PERMISSION_DENIED|403/i.test(errMsg)) {
      return res.status(401).json({
        error: 'Gemini API 키가 유효하지 않거나 권한이 없습니다. Settings > Secrets 패널에서 API 키를 확인해주세요.',
      });
    }

    if (/429|RESOURCE_EXHAUSTED/i.test(errMsg)) {
      return res.status(429).json({
        error: 'Gemini API 할당량이 초과되었습니다. 잠시 후 다시 시도하거나 Settings > Secrets 패널에서 API 키를 확인해주세요.',
      });
    }

    if (/timed out/i.test(errMsg)) {
      return res.status(504).json({
        error: 'AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
      });
    }

    return res.status(503).json({
      error: `현재 AI 서버 요청량이 많아 지연되고 있습니다. 잠시 후 다시 시도해주세요. (${errMsg.slice(0, 120)})`,
    });
  } catch (error: any) {
    console.error('Curation generation failed:', error);
    return res.status(500).json({
      error: error.message || '큐레이션 생성 도중 오류가 발생했습니다.',
    });
  }
});

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Melon Showroom Server listening on port ${PORT}`);
});
