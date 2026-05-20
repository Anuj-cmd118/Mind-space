/**
 * Mindspace Native Bridge
 * This service handles communication with Capacitor plugins for Android features.
 * In the web preview, it simulates native behavior.
 */

import { registerPlugin } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface NativeScreenTime {
  appName: string;
  minutes: number;
  category: string;
}

interface SettingsPluginType {
  openUsageSettings(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  checkPermissions(): Promise<{ usageStats: boolean; overlay: boolean }>;
  updateBlockedApps(options: { appsJson: string }): Promise<void>;
  getInterceptedApp(): Promise<{ interceptedApp: string }>;
}

const SettingsPlugin = registerPlugin<SettingsPluginType>('SettingsPlugin');

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
   * Request system-level app blocking permission (Simulated on web, intent-driven on Android)
   */
  async requestBlockingPermission(): Promise<boolean> {
    console.log('[Native] Requesting Usage Access and Overlay permissions...');
    await Haptics.impact({ style: ImpactStyle.Medium });
    if (this.isNative) {
      try {
        await SettingsPlugin.openUsageSettings();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await SettingsPlugin.openOverlaySettings();
        return true;
      } catch (err) {
        console.error(err);
      }
    }
    return true;
  }

  /**
   * Request system-level Usage Statistics Access permission
   */
  async requestUsageStatsPermission(): Promise<boolean> {
    console.log('[Native] Requesting Usage Access permission...');
    await Haptics.impact({ style: ImpactStyle.Medium });
    if (this.isNative) {
      try {
        await SettingsPlugin.openUsageSettings();
        return true;
      } catch (err) {
        console.error('Failed to open usage settings:', err);
        return false;
      }
    }
    return true;
  }

  /**
   * Request system-level System Overlay permission
   */
  async requestOverlayPermission(): Promise<boolean> {
    console.log('[Native] Requesting System Overlay permission...');
    await Haptics.impact({ style: ImpactStyle.Medium });
    if (this.isNative) {
      try {
        await SettingsPlugin.openOverlaySettings();
        return true;
      } catch (err) {
        console.error('Failed to open overlay settings:', err);
        return false;
      }
    }
    return true;
  }

  /**
   * Check permissions natively on Android
   */
  async checkPermissions(): Promise<{ usageStats: boolean; overlay: boolean }> {
    if (this.isNative) {
      try {
        return await SettingsPlugin.checkPermissions();
      } catch (err) {
        console.error('Failed to check native permissions:', err);
      }
    }
    return {
      usageStats: localStorage.getItem('mindspace_perm_usage_stats') === 'granted',
      overlay: localStorage.getItem('mindspace_perm_overlay') === 'granted',
    };
  }

  /**
   * Sync active blocked packages JSON list into Shared Preferences for background service
   */
  async updateBlockedApps(appsList: string[]): Promise<void> {
    if (this.isNative) {
      try {
        await SettingsPlugin.updateBlockedApps({ appsJson: JSON.stringify(appsList) });
      } catch (err) {
        console.error('Failed to update blocked apps on Android:', err);
      }
    }
  }

  /**
   * Query the latest background intercetion event
   */
  async getInterceptedApp(): Promise<string | null> {
    if (this.isNative) {
      try {
        const result = await SettingsPlugin.getInterceptedApp();
        return result.interceptedApp || null;
      } catch (err) {
        console.error('Failed to poll background interception:', err);
      }
    }
    return null;
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
