// Web Speech API wrapper for real-time speech-to-text in Chinese (Taiwan) with cross-browser resilience
export class SpeechRecognizer {
  private recognition: any = null;
  public isListening = false;
  private onResultCallback?: (text: string, isFinal: boolean) => void;
  private onErrorCallback?: (error: string) => void;
  private onEndCallback?: () => void;
  private accumulatedFinalText = '';

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition
    );
  }

  public async start(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (err: string) => void,
    onEnd?: () => void,
    initialText: string = ''
  ) {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;
    this.accumulatedFinalText = initialText ? initialText.trim() + ' ' : '';

    if (!this.isSupported()) {
      onError?.('您的瀏覽器或環境不支援 Web Speech 語音辨識，請使用 Chrome/Safari 或以文字輸入。');
      return;
    }

    // Try requesting mic permission explicitly if mediaDevices is supported
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        console.warn('Microphone permission request issue:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          onError?.('麥克風權限被封鎖，請在瀏覽器網址列左側允許麥克風權限後重試。');
          return;
        }
      }
    }

    // Stop any existing active instance
    this.stop();

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'zh-TW';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let currentFinal = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentFinal) {
          this.accumulatedFinalText += currentFinal;
        }

        const fullText = (this.accumulatedFinalText + currentInterim).trim();
        if (this.onResultCallback && fullText) {
          this.onResultCallback(fullText, Boolean(currentFinal));
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          this.onErrorCallback?.('麥克風權限未開啟，請在瀏覽器設定允許使用麥克風，或使用手機鍵盤上的「🎙️ 麥克風」輸入。');
        } else if (event.error === 'service-not-allowed') {
          this.onErrorCallback?.('已切換為手機原生語音模式！請直接點擊手機鍵盤上的「🎙️ 麥克風」進行口述。');
        } else if (event.error === 'no-speech') {
          // ignore silent pause
        } else if (event.error === 'network') {
          this.onErrorCallback?.('網路連線不穩，請直接使用手機鍵盤上的「🎙️ 麥克風」輸入。');
        } else {
          this.onErrorCallback?.('已切換為鍵盤語音模式，請使用手機鍵盤上的「🎙️ 麥克風」口述輸入。');
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      };

      this.recognition.start();
      this.isListening = true;
    } catch (err: any) {
      console.warn('Speech recognition start failed:', err);
      this.isListening = false;
      this.onErrorCallback?.('啟動語音辨識失敗，請直接使用文字輸入。');
    }
  }

  public stop() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
  }
}

