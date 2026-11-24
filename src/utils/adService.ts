/**
 * ZORB Ad Provider Abstraction (AdMob-Ready)
 * ------------------------------------------------------------
 * Swap DemoAdService with @capacitor-community/admob or Google IMA
 * by implementing ZorbAdAdapter and registering it in setAdAdapter().
 */

export type AdPlacement = 'offline_unlock_6h' | 'six_song_interstitial';

export interface AdRequestConfig {
  placement: AdPlacement;
  durationSec: number;
  skipAfterSec: number;
  rewardLabel: string;
}

export interface ZorbAdAdapter {
  providerName: string;
  isReady: (placement: AdPlacement) => boolean;
  getConfig: (placement: AdPlacement) => AdRequestConfig;
}

// Placeholder / AdMob Test Unit IDs for drop-in production replacement
export const ADMOB_UNIT_IDS = {
  rewardedOffline6h: 'ca-app-pub-3940256099942544/5224354917',
  interstitialSixTracks: 'ca-app-pub-3940256099942544/1033173712',
} as const;

export const DemoAdAdapter: ZorbAdAdapter = {
  providerName: 'ZORB Demo AdMob Adapter',
  isReady: () => true,
  getConfig: (placement: AdPlacement): AdRequestConfig => {
    if (placement === 'offline_unlock_6h') {
      return {
        placement,
        durationSec: 15,
        skipAfterSec: 5,
        rewardLabel: '6 Hours Offline Mode',
      };
    }
    return {
      placement,
      durationSec: 15,
      skipAfterSec: 5,
      rewardLabel: 'Next 6 Tracks Ad-Free',
    };
  },
};

let activeAdapter: ZorbAdAdapter = DemoAdAdapter;

export function getAdAdapter(): ZorbAdAdapter {
  return activeAdapter;
}

export function setAdAdapter(next: ZorbAdAdapter): void {
  activeAdapter = next;
}
