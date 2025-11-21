// WebView detection and utilities

interface AndroidBridge {
  postMessage?: (message: string) => void;
  [key: string]: unknown;
}

interface WindowWithAndroid extends Window {
  Android?: AndroidBridge;
  ReactNativeWebView?: {
    postMessage: (message: string) => void;
  };
}

class WebViewBridge {
  private isWebView: boolean;
  private isAndroid: boolean;
  private isIOS: boolean;

  constructor() {
    const windowWithBridge = window as WindowWithAndroid;
    
    // Detect WebView environment
    this.isAndroid = typeof windowWithBridge.Android !== 'undefined' || 
                     /Android/i.test(navigator.userAgent);
    this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.isWebView = typeof windowWithBridge.Android !== 'undefined' ||
                     typeof windowWithBridge.ReactNativeWebView !== 'undefined' ||
                     (this.isAndroid && /wv/.test(navigator.userAgent));
  }

  /**
   * Check if running in WebView
   */
  isInWebView(): boolean {
    return this.isWebView;
  }

  /**
   * Check if running on Android
   */
  isAndroidPlatform(): boolean {
    return this.isAndroid;
  }

  /**
   * Check if running on iOS
   */
  isIOSPlatform(): boolean {
    return this.isIOS;
  }

  /**
   * Get camera constraints optimized for WebView
   */
  getCameraConstraints(facingMode: 'user' | 'environment' = 'user'): MediaStreamConstraints {
    return {
      video: {
        facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };
  }

  /**
   * Get video recording constraints
   */
  getVideoConstraints(facingMode: 'user' | 'environment' = 'environment'): MediaStreamConstraints {
    return {
      video: {
        facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: true,
    };
  }

  /**
   * Request camera permission (WebView will handle native prompt)
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Check if device supports getUserMedia
   */
  supportsGetUserMedia(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Post message to native Android
   */
  postMessage(type: string, data?: unknown): void {
    const windowWithBridge = window as WindowWithAndroid;
    const message = JSON.stringify({ type, data });
    
    if (windowWithBridge.Android?.postMessage) {
      windowWithBridge.Android.postMessage(message);
    } else if (windowWithBridge.ReactNativeWebView) {
      windowWithBridge.ReactNativeWebView.postMessage(message);
    }
  }

  /**
   * Get optimized file input accept string
   */
  getFileAccept(type: 'image' | 'video' | 'both' = 'both'): string {
    switch (type) {
      case 'image':
        return 'image/jpeg,image/png,image/webp';
      case 'video':
        return 'video/mp4,video/webm';
      case 'both':
        return 'image/jpeg,image/png,image/webp,video/mp4,video/webm';
      default:
        return '*/*';
    }
  }

  /**
   * Create file input with proper attributes for WebView
   */
  createFileInput(options: {
    accept?: string;
    multiple?: boolean;
    capture?: boolean | 'user' | 'environment';
  }): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    
    if (options.accept) {
      input.accept = options.accept;
    }
    
    if (options.multiple) {
      input.multiple = true;
    }
    
    // Enable camera capture on mobile
    if (options.capture) {
      if (typeof options.capture === 'boolean') {
        input.setAttribute('capture', 'environment');
      } else {
        input.setAttribute('capture', options.capture);
      }
    }
    
    return input;
  }
}

// Singleton instance
export const webViewBridge = new WebViewBridge();

// Utility functions
export function isWebView(): boolean {
  return webViewBridge.isInWebView();
}

export function isMobile(): boolean {
  return webViewBridge.isAndroidPlatform() || webViewBridge.isIOSPlatform();
}

export function getPlatform(): 'web' | 'android' | 'ios' | 'webview' {
  if (webViewBridge.isInWebView()) return 'webview';
  if (webViewBridge.isAndroidPlatform()) return 'android';
  if (webViewBridge.isIOSPlatform()) return 'ios';
  return 'web';
}
