import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Bhashini wrapper — Govt of India's own ASR + TTS stack (ULCA pipeline).
 * Falls back to a mock when credentials aren't configured, so the whole system
 * runs end-to-end in dev without needing a Bhashini account.
 */

const MOCK = !config.bhashini.apiKey;

export async function asrTamil(audioBase64) {
  if (MOCK) {
    logger.warn('bhashini ASR mocked — returning placeholder transcript');
    return { text: '[mock transcript]', confidence: 0.0, mocked: true };
  }
  try {
    const resp = await axios.post(config.bhashini.asrUrl, {
      pipelineTasks: [{
        taskType: 'asr',
        config: { language: { sourceLanguage: 'ta' }, serviceId: 'ai4bharat/conformer-ta-gpu--t4', audioFormat: 'wav', samplingRate: 16000 },
      }],
      inputData: { audio: [{ audioContent: audioBase64 }] },
    }, {
      headers: {
        'Authorization': config.bhashini.apiKey,
        'userID': config.bhashini.userId,
      },
      timeout: 10000,
    });
    const text = resp.data?.pipelineResponse?.[0]?.output?.[0]?.source || '';
    return { text, confidence: 1.0, mocked: false };
  } catch (err) {
    logger.error({ err: err.message }, 'bhashini ASR failed');
    return { text: '', confidence: 0.0, error: err.message };
  }
}

export async function ttsTamil(text) {
  if (MOCK) {
    logger.debug({ text: text.slice(0, 60) }, 'bhashini TTS mocked');
    return { audioBase64: '', mocked: true };
  }
  try {
    const resp = await axios.post(config.bhashini.ttsUrl, {
      pipelineTasks: [{
        taskType: 'tts',
        config: { language: { sourceLanguage: 'ta' }, serviceId: 'ai4bharat/indic-tts-coqui-misc-gpu--t4', gender: 'female' },
      }],
      inputData: { input: [{ source: text }] },
    }, {
      headers: {
        'Authorization': config.bhashini.apiKey,
        'userID': config.bhashini.userId,
      },
      timeout: 15000,
    });
    const audioBase64 = resp.data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent || '';
    return { audioBase64, mocked: false };
  } catch (err) {
    logger.error({ err: err.message }, 'bhashini TTS failed');
    return { audioBase64: '', error: err.message };
  }
}
