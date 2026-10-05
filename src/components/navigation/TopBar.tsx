import React from 'react';
import { Settings, ShieldAlert, User, LogIn } from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { UserAccount } from '../../lib/auth/authService';

interface TopBarProps {
  currentUser: UserAccount | null;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenINeedYou: () => void;
  unreadAlertCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  onOpenSettings,
  onOpenAuth,
  onOpenINeedYou,
  unreadAlertCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FBFBF9]/95 backdrop-blur-md border-b border-[#EBE7DF] px-4 py-2.5 transition-colors">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Zone 1: Brand title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#283A2E] flex items-center justify-center text-[#E2D4B7] shadow-xs">
            <span className="font-serif font-bold text-sm tracking-tighter">أ</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-base tracking-tight text-[#1F2421] leading-none">
              Amanah
            </span>
            <span className="text-[10px] text-[#7A6B53] tracking-widest uppercase font-mono mt-0.5">
              أمانة
            </span>
          </div>
        </div>

        {/* Zone 2 & 3: Actions */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* User Sign In / Profile Avatar */}
          {currentUser ? (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#D5CEC2] bg-white text-xs text-[#1F2421] hover:bg-[#F4F1EA] transition-all"
              title={`Logged in as ${currentUser.display_name}`}
              aria-label="User Account"
            >
              <div className="w-4 h-4 rounded-full bg-[#2E473B] text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline font-medium text-[11px] truncate max-w-[80px]">
                {currentUser.display_name}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D5CEC2] text-xs font-medium text-[#2E473B] hover:bg-[#F4F1EA] transition-all"
              aria-label="Sign In or Register"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="text-[11px]">Sign In</span>
            </button>
          )}

          {/* Quick "I NEED YOU" trigger */}
          <button
            onClick={onOpenINeedYou}
            className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              unreadAlertCount > 0
                ? 'bg-[#B93815] text-white animate-pulse'
                : 'bg-[#FAECE7] text-[#B93815] hover:bg-[#F6DDD6]'
            }`}
            title="Emergency signal to your person"
            aria-label="I Need You emergency signal"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden xs:inline text-[11px]">I Need You</span>
            {unreadAlertCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-white ml-0.5" />
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-lg border border-[#DDD7CB] flex items-center justify-center text-[#505D54] hover:text-[#1F2421] hover:bg-[#EFECE6] active:scale-95 transition-all"
            aria-label="Open Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

