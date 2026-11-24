import React from 'react';
import { DemoAdPlayerModal } from './DemoAdPlayerModal';

interface AdInterstitialModalProps {
  isOpen: boolean;
  accentHex: string;
  onCloseAd: () => void;
  onLearnMorePremium?: () => void;
}

export const AdInterstitialModal: React.FC<AdInterstitialModalProps> = ({
  isOpen,
  accentHex,
  onCloseAd,
}) => {
  return (
    <DemoAdPlayerModal
      isOpen={isOpen}
      placement="six_song_interstitial"
      accentHex={accentHex}
      onRewardCompleted={onCloseAd}
    />
  );
};
