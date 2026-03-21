import { Platform } from 'react-native';

let Voice = null;

// Lazy load @react-native-voice/voice only on native platforms
async function getVoiceModule() {
  if (Platform.OS === 'web') return null;
  if (!Voice) {
    try {
      const mod = await import('@react-native-voice/voice');
      Voice = mod.default;
    } catch {
      return null;
    }
  }
  return Voice;
}

class VoiceService {
  constructor() {
    this._resultCallback = null;
    this._errorCallback = null;
    this._startCallback = null;
    this._endCallback = null;
    this._webRecognition = null;
    this._isListening = false;
  }

  async isAvailable() {
    if (Platform.OS === 'web') {
      return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    const v = await getVoiceModule();
    if (!v) return false;
    try {
      const available = await v.isAvailable();
      return !!available;
    } catch {
      return false;
    }
  }

  onResult(callback) { this._resultCallback = callback; }
  onError(callback) { this._errorCallback = callback; }
  onStart(callback) { this._startCallback = callback; }
  onEnd(callback) { this._endCallback = callback; }

  async startListening() {
    if (this._isListening) return;
    this._isListening = true;

    if (Platform.OS === 'web') {
      this._startWebListening();
    } else {
      await this._startNativeListening();
    }
  }

  async stopListening() {
    this._isListening = false;
    if (Platform.OS === 'web') {
      this._stopWebListening();
    } else {
      await this._stopNativeListening();
    }
  }

  // Web Speech API
  _startWebListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this._errorCallback?.('浏览器不支持语音识别');
      return;
    }
    this._webRecognition = new SpeechRecognition();
    this._webRecognition.lang = 'zh-CN';
    this._webRecognition.continuous = false;
    this._webRecognition.interimResults = true;

    this._webRecognition.onstart = () => {
      this._startCallback?.();
    };
    this._webRecognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const text = last[0].transcript;
      this._resultCallback?.(text, last.isFinal);
    };
    this._webRecognition.onerror = (event) => {
      this._isListening = false;
      this._errorCallback?.(event.error);
    };
    this._webRecognition.onend = () => {
      this._isListening = false;
      this._endCallback?.();
    };
    this._webRecognition.start();
  }

  _stopWebListening() {
    if (this._webRecognition) {
      this._webRecognition.stop();
      this._webRecognition = null;
    }
  }

  // Native voice
  async _startNativeListening() {
    const v = await getVoiceModule();
    if (!v) {
      this._errorCallback?.('语音识别不可用');
      return;
    }

    v.onSpeechStart = () => this._startCallback?.();
    v.onSpeechEnd = () => {
      this._isListening = false;
      this._endCallback?.();
    };
    v.onSpeechResults = (e) => {
      const text = e.value?.[0] || '';
      this._resultCallback?.(text, true);
    };
    v.onSpeechPartialResults = (e) => {
      const text = e.value?.[0] || '';
      this._resultCallback?.(text, false);
    };
    v.onSpeechError = (e) => {
      this._isListening = false;
      this._errorCallback?.(e.error?.message || '识别出错');
    };

    try {
      await v.start('zh-CN');
    } catch (err) {
      this._isListening = false;
      this._errorCallback?.(err.message);
    }
  }

  async _stopNativeListening() {
    const v = await getVoiceModule();
    if (v) {
      try { await v.stop(); } catch {}
    }
  }

  get isListening() {
    return this._isListening;
  }

  async destroy() {
    this._stopWebListening();
    const v = await getVoiceModule();
    if (v) {
      try { await v.destroy(); } catch {}
    }
  }
}

export const voiceService = new VoiceService();
