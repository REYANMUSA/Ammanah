import React, { useState, useEffect } from 'react';
import { TopBar } from './components/navigation/TopBar';
import { BottomNav, NavTab } from './components/navigation/BottomNav';
import { HomeView } from './components/home/HomeView';
import { ProgressView } from './components/progress/ProgressView';
import { DeenView } from './components/deen/DeenView';
import { UsView } from './components/us/UsView';
import { CoursesModal } from './components/courses/CoursesModal';
import { JourneyModal } from './components/journey/JourneyModal';
import { INeedYouModal } from './components/emergency/INeedYouModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { AuthModal } from './components/auth/AuthModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { Profile, ThemePreference, Gender } from './types/database';
import { dataService } from './lib/storage/dataService';
import { authService, UserAccount } from './lib/auth/authService';

export default function App() {
  const [profile, setProfile] = useState<Profile>(dataService.getProfile());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(authService.getSession().user);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Modals state
  const [showCourses, setShowCourses] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [showINeedYou, setShowINeedYou] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Check initial profile
    const currentProfile = dataService.getProfile();
    setProfile(currentProfile);

    // Subscribe to auth session changes
    const unsubscribeAuth = authService.subscribe((session) => {
      setCurrentUser(session.user);
      if (session.user) {
        // Sync display name if user has one
        if (session.user.display_name && session.user.display_name !== currentProfile.display_name) {
          dataService.updateProfile({ display_name: session.user.display_name }).then((p) => {
            setProfile(p);
          });
        }
      }
    });

    // Splash screen timer
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      if (!currentProfile.onboarding_completed) {
        setShowOnboarding(true);
      }
    }, 1200);

    // Android back-button handling
    const handlePopState = (e: PopStateEvent) => {
      if (showCourses || showJourney || showINeedYou || showSettings || showOnboarding || showAuthModal) {
        e.preventDefault();
        setShowCourses(false);
        setShowJourney(false);
        setShowINeedYou(false);
        setShowSettings(false);
        setShowAuthModal(false);
        window.history.pushState(null, '', window.location.pathname);
      } else if (activeTab !== 'home') {
        e.preventDefault();
        setActiveTab('home');
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearTimeout(splashTimer);
      unsubscribeAuth();
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showCourses, showJourney, showINeedYou, showSettings, showOnboarding, showAuthModal, activeTab]);

  const handleOnboardingComplete = async (data: {
    displayName: string;
    gender: Gender;
    theme: ThemePreference;
  }) => {
    const updated = await dataService.updateProfile({
      display_name: data.displayName,
      gender: data.gender,
      theme_preference: data.theme,
      onboarding_completed: true,
    });
    setProfile(updated);
    setShowOnboarding(false);
  };

  const handleAuthSuccess = async (user: UserAccount) => {
    setCurrentUser(user);
    if (user.display_name) {
      const updated = await dataService.updateProfile({
        display_name: user.display_name,
        user_id: user.id,
      });
      setProfile(updated);
    }
  };

  const handleLogOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine theme class & apply to body
  const themeClass = 
    profile.theme_preference === 'feminine'
      ? 'theme-feminine bg-[#FAF8F6] text-[#241D1E]'
      : profile.theme_preference === 'minimal_dark'
      ? 'theme-dark bg-[#141815] text-[#ECEFEA]'
      : 'theme-personal bg-[#FBFBF9] text-[#1F2421]';

  // Splash Screen (PRD Section 49 & 50)
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#283A2E] text-white p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-3xl bg-[#1E2D23] border border-[#3E5244] flex items-center justify-center text-[#E2D4B7] shadow-xl mb-6">
          <span className="font-serif text-3xl font-bold">أ</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#F7F3E9] tracking-tight mb-1">
          Amanah
        </h1>
        <p className="text-xs font-mono uppercase tracking-widest text-[#D3C5A3] mb-4">
          أمانة
        </p>
        <div className="h-0.5 w-12 bg-[#8FA38F]/40 mx-auto my-3" />
        <p className="text-sm text-[#C8D7C6] font-serif italic max-w-xs leading-relaxed">
          Becoming better, one day at a time.
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${themeClass}`}>
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Top Application Bar */}
      <TopBar
        currentUser={currentUser}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenINeedYou={() => setShowINeedYou(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-3 pb-20">
        {activeTab === 'home' && (
          <HomeView
            profile={profile}
            onNavigateTab={handleTabChange}
            onOpenCourses={() => setShowCourses(true)}
            onOpenJourney={() => setShowJourney(true)}
            onOpenINeedYou={() => setShowINeedYou(true)}
          />
        )}

        {activeTab === 'progress' && <ProgressView />}

        {activeTab === 'deen' && <DeenView />}

        {activeTab === 'us' && (
          <UsView onOpenINeedYou={() => setShowINeedYou(true)} />
        )}
      </main>

      {/* Fixed Bottom Ergonomic Tab Bar */}
      <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />

      {/* Modals */}
      <CoursesModal
        isOpen={showCourses}
        onClose={() => setShowCourses(false)}
      />

      <JourneyModal
        isOpen={showJourney}
        onClose={() => setShowJourney(false)}
      />

      <INeedYouModal
        isOpen={showINeedYou}
        onClose={() => setShowINeedYou(false)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        profile={profile}
        currentUser={currentUser}
        onUpdateProfile={setProfile}
        onOpenAuth={() => {
          setShowSettings(false);
          setShowAuthModal(true);
        }}
        onLogOut={handleLogOut}
        onReplayOnboarding={() => {
          setShowSettings(false);
          setShowOnboarding(true);
        }}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}
