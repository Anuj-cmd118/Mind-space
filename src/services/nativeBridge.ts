/**
 * Mindspace Native Bridge
 * This service handles communication with Capacitor plugins for Android features.
 * In the web preview, it simulates native behavior.
 */

import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface NativeScreenTime {
  appName: string;
  minutes: number;
  category: string;
}

class NativeBridge {
  private isNative: boolean = false;

  constructor() {
    this.checkPlatform();
  }

  private async checkPlatform() {
    const info = await Device.getInfo();
    this.isNative = info.platform === 'android' || info.platform === 'ios';
  }

  /**
   * Request system-level app blocking permission (Simulated)
   */
  async requestBlockingPermission(): Promise<boolean> {
    console.log('[Native] Requesting Usage Access and Overlay permissions...');
    await Haptics.impact({ style: ImpactStyle.Medium });
    // In a real Android build, this would trigger Intent for Settings.ACTION_USAGE_ACCESS_SETTINGS
    return true;
  }

  /**
   * Fetch native screen time data (Mocked for browser, real for Android)
   */
  async getScreenTimeMetrics(): Promise<NativeScreenTime[]> {
    if (this.isNative) {
      // In a real scenario, we'd use a custom Capacitor plugin or UsageStats
      // For now, return structured mocks that would be replaced by native calls
      return [
        { appName: 'Instagram', minutes: 120, category: 'Social' },
        { appName: 'YouTube', minutes: 95, category: 'Entertainment' },
        { appName: 'Twitter/X', minutes: 45, category: 'Social' },
        { appName: 'Chrome', minutes: 30, category: 'Utility' },
      ];
    }

    // Default mock data for Web Preview
    return [
      { appName: 'Instagram', minutes: 145, category: 'Social' },
      { appName: 'YouTube', minutes: 110, category: 'Video' },
      { appName: 'TikTok', minutes: 85, category: 'Entertainment' },
    ];
  }

  /**
   * Trigger Haptic Feedback (Works in Capacitor)
   */
  async vibrate() {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
}

export const nativeBridge = new NativeBridge();
