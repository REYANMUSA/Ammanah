import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Bell, 
  BellOff, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  HelpCircle, 
  Compass, 
  Check, 
  BookMarked,
  Share2,
  Sun,
  Moon
} from 'lucide-react';
import { DhikrProgress, HadithItem, QuranTask, PrayerSettings } from '../../types/database';
import { dataService, getTodayKey } from '../../lib/storage/dataService';
import { AUTHENTIC_HADITHS, getHadithForDay } from '../../data/hadiths';
import { AUTHENTIC_CHALLENGES } from '../../data/challenges';
import { getCalculatedPrayerTimes, PrayerSchedule } from '../../lib/prayer/prayerTimes';
import { playCalmChime, triggerHapticFeedback } from '../../lib/notifications/notificationService';
import { DailyDhikrModule } from './DailyDhikrModule';
import confetti from 'canvas-confetti';

interface DeenViewProps {
  onBack?: () => void;
}

export const DeenView: React.FC<DeenViewProps> = () => {
  const todayKey = getTodayKey();
  const dayOfYear = Math.floor(
    (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );

  const [activeSection, setActiveSection] = useState<'prayer' | 'dhikr' | 'hadith' | 'quran' | 'challenge'>('prayer');
  const [dhikrTab, setDhikrTab] = useState<'daily' | 'istighfar'>('daily');
  
  // Prayer State
  const [schedule, setSchedule] = useState<PrayerSchedule>(getCalculatedPrayerTimes());
  const [prayerSettings, setPrayerSettings] = useState<PrayerSettings>(dataService.getPrayerSettings());

  // Dhikr State
  const [dhikr, setDhikr] = useState<DhikrProgress>(dataService.getDhikrProgress(todayKey));
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetInput, setTargetInput] = useState(dhikr.target.toString());

  // Hadith State
  const [selectedDay, setSelectedDay] = useState(dayOfYear);
  const currentHadith = getHadithForDay(selectedDay);

  // Quran State
  const [quranTask, setQuranTask] = useState<QuranTask>(dataService.getQuranTask(todayKey));

  // Challenge State
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    // Update prayer times clock
    const timer = setInterval(() => {
      setSchedule(getCalculatedPrayerTimes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleIncrementDhikr = async () => {
    triggerHapticFeedback();
    const updated = await dataService.incrementDhikr(1, todayKey);
    setDhikr(updated);

    if (updated.count === updated.target) {
      playCalmChime();
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#2E473B', '#D3C5A3', '#8FA38F'],
        });
      } catch {}
    }
  };

  const handleResetDhikr = async () => {
    if (confirm('Reset today’s Astaghfirullah counter to 0?')) {
      const reset = await dataService.resetDhikr(todayKey);
      setDhikr(reset);
    }
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(targetInput, 10);
    if (!isNaN(val) && val > 0) {
      const updated = await dataService.setDhikrTarget(val, todayKey);
      setDhikr(updated);
      setShowTargetModal(false);
    }
  };

  const handlePageChange = async (increment: number) => {
    const next = Math.max(0, quranTask.pages_completed + increment);
    const updated = await dataService.updateQuranPages(next, todayKey);
    setQuranTask(updated);
    if (updated.completed && !quranTask.completed) {
      playCalmChime();
    }
  };

  const handleTogglePrayerNotif = async (prayerKey: keyof PrayerSettings) => {
    const updated = await dataService.updatePrayerSettings({
      [prayerKey]: !prayerSettings[prayerKey],
    });
    setPrayerSettings(updated);
  };

  const currentChallenge = AUTHENTIC_CHALLENGES[challengeIndex % AUTHENTIC_CHALLENGES.length];

  const handleAnswerSelect = (option: 'A' | 'B' | 'C' | 'D') => {
    if (hasAnswered) return;
    setSelectedAnswer(option);
    setHasAnswered(true);
    triggerHapticFeedback();
    if (option === currentChallenge.correct_answer) {
      playCalmChime();
    }
  };

  const handleNextChallenge = () => {
    setSelectedAnswer(null);
    setHasAnswered(false);
    setChallengeIndex((prev) => (prev + 1) % AUTHENTIC_CHALLENGES.length);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#1F2421]">
          Deen Sanctuary
        </h1>
        <p className="text-xs text-[#7A6B53]">
          Authentic remembrance, Quranic reflection, and daily prophetic guidance.
        </p>
      </div>

      {/* Segmented Sub-Navigation in PRD Order */}
      <div className="flex items-center gap-1 p-1 bg-[#EFECE6] rounded-xl overflow-x-auto text-xs font-medium no-scrollbar">
        <button
          onClick={() => setActiveSection('prayer')}
          className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
            activeSection === 'prayer'
              ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
              : 'text-[#6B756E] hover:text-[#1F2421]'
          }`}
        >
          Prayer Times
        </button>
        <button
          onClick={() => setActiveSection('dhikr')}
          className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
            activeSection === 'dhikr'
              ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
              : 'text-[#6B756E] hover:text-[#1F2421]'
          }`}
        >
          Daily Dhikr
        </button>
        <button
          onClick={() => setActiveSection('hadith')}
          className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
            activeSection === 'hadith'
              ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
              : 'text-[#6B756E] hover:text-[#1F2421]'
          }`}
        >
          365 Hadith
        </button>
        <button
          onClick={() => setActiveSection('quran')}
          className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
            activeSection === 'quran'
              ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
              : 'text-[#6B756E] hover:text-[#1F2421]'
          }`}
        >
          Qur’an Muraaja
        </button>
        <button
          onClick={() => setActiveSection('challenge')}
          className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
            activeSection === 'challenge'
              ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
              : 'text-[#6B756E] hover:text-[#1F2421]'
          }`}
        >
          Deen Challenge
        </button>
      </div>

      {/* 1. DHIKR SECTION */}
      {activeSection === 'dhikr' && (
        <div className="space-y-4">
          {/* Sub-Tabs for Dhikr Mode */}
          <div className="flex items-center gap-1 p-1 bg-[#F4F1EA] rounded-xl text-xs font-medium">
            <button
              onClick={() => setDhikrTab('daily')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                dhikrTab === 'daily'
                  ? 'bg-white text-[#1F2421] font-semibold shadow-xs'
                  : 'text-[#6B756E] hover:text-[#1F2421]'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-[#D99A26]" />
              <span>Daily Adhkar (Morning & Evening)</span>
            </button>
            <button
              onClick={() => setDhikrTab('istighfar')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                dhikrTab === 'istighfar'
                  ? 'bg-white text-[#1F2421] font-semibold shadow-xs'
                  : 'text-[#6B756E] hover:text-[#1F2421]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#2E473B]" />
              <span>Istighfar Tasbih</span>
            </button>
          </div>

          {/* Daily Adhkar Module (Morning / Evening Tap Counter) */}
          {dhikrTab === 'daily' && <DailyDhikrModule />}

          {/* Istighfar Counter */}
          {dhikrTab === 'istighfar' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-6 rounded-3xl bg-white border border-[#EAE6DD] text-center shadow-xs">
                <span className="text-[11px] font-semibold text-[#8B7853] uppercase tracking-wider">
                  Personal Istighfar Counter
                </span>
                <p className="font-serif text-3xl font-bold text-[#1F2421] my-3 leading-relaxed" dir="rtl">
                  أَسْتَغْفِرُ اللَّهَ
                </p>
                <p className="text-xs text-[#6B756E] italic mb-6">
                  «I seek the forgiveness of Allah.»
                </p>

                {/* Circular Interactive Counter Trigger */}
                <div className="flex justify-center my-6">
                  <button
                    onClick={handleIncrementDhikr}
                    className="w-48 h-48 rounded-full bg-gradient-to-b from-[#2E473B] to-[#23382D] text-white flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all select-none border-4 border-[#E2D4B7]"
                    aria-label="Tap to count Dhikr"
                  >
                    <span className="font-mono text-4xl font-bold tabular-nums">
                      {dhikr.count}
                    </span>
                    <span className="text-xs text-[#E2D4B7] mt-1 font-medium">
                      Target: {dhikr.target}
                    </span>
                    <span className="text-[10px] text-[#A5B8A3] mt-2 tracking-wider uppercase">
                      Tap to count
                    </span>
                  </button>
                </div>

                {/* Counter actions */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setShowTargetModal(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-[#D5CEC2] text-xs font-medium text-[#505D54] hover:bg-[#F4F1EA]"
                  >
                    Set Target ({dhikr.target})
                  </button>
                  <button
                    onClick={handleResetDhikr}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#D5CEC2] text-xs font-medium text-[#B93815] hover:bg-[#FAECE7]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F4ED] border border-[#E5DFD3] text-xs text-[#505D54] leading-relaxed">
                <strong className="text-[#1F2421] block mb-1">The Gift of Istighfar:</strong>
                The Prophet (ﷺ) said: «By Allah, I seek the forgiveness of Allah and turn to Him in repentance more than seventy times a day.» (Sahih al-Bukhari 6307).
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PRAYER TIMES */}
      {activeSection === 'prayer' && (
        <div className="space-y-4">
          {/* Active Prayer Card */}
          <div className="p-5 rounded-2xl bg-[#283A2E] text-white shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#E2D4B7] mb-2">
              <span className="uppercase tracking-wider">Current Period: {schedule.currentPrayer}</span>
              <span className="font-mono">{schedule.timeUntilNext} until {schedule.nextPrayer}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-1">
              Next Prayer: {schedule.nextPrayer}
            </h2>
            <p className="text-xs text-[#A2B49E]">
              Calculated for your current timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'}).
            </p>
          </div>

          {/* 5 Daily Prayers List */}
          <div className="p-4 rounded-2xl bg-white border border-[#EAE6DD] shadow-xs space-y-3">
            {[
              { name: 'Fajr', key: 'fajr_enabled' as const, time: schedule.fajr },
              { name: 'Sunrise', key: null, time: schedule.sunrise },
              { name: 'Dhuhr', key: 'dhuhr_enabled' as const, time: schedule.dhuhr },
              { name: 'Asr', key: 'asr_enabled' as const, time: schedule.asr },
              { name: 'Maghrib', key: 'maghrib_enabled' as const, time: schedule.maghrib },
              { name: 'Isha', key: 'isha_enabled' as const, time: schedule.isha },
            ].map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-[#F4F1EA] last:border-0"
              >
                <div>
                  <span className="text-sm font-semibold text-[#1F2421]">{p.name}</span>
                  {p.key === null && (
                    <span className="text-[10px] text-[#7E8B82] ml-2">(Shuruq)</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums text-sm font-semibold text-[#1F2421]">
                    {p.time}
                  </span>
                  {p.key && (
                    <button
                      onClick={() => handleTogglePrayerNotif(p.key as keyof PrayerSettings)}
                      className="p-1 text-[#8B988E] hover:text-[#2E473B]"
                      title="Toggle reminder"
                    >
                      {prayerSettings[p.key as keyof PrayerSettings] ? (
                        <Bell className="w-4 h-4 text-[#2E473B]" />
                      ) : (
                        <BellOff className="w-4 h-4 text-[#C1C9C3]" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[#7A857D] text-center">
            Prayer reminders are personal reminders for presence, not task scoring mechanics.
          </p>
        </div>
      )}

      {/* 3. 365 DAYS HADITH */}
      {activeSection === 'hadith' && (
        <div className="space-y-4">
          {/* Day Navigation */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#EAE6DD]">
            <button
              onClick={() => setSelectedDay((prev) => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-[#D5CEC2] text-[#505D54] hover:bg-[#F4F1EA]"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <span className="text-xs font-semibold text-[#1F2421]">
                Day {currentHadith.day_number} of 365
              </span>
              <p className="text-[10px] text-[#7A6B53]">{currentHadith.topic}</p>
            </div>
            <button
              onClick={() => setSelectedDay((prev) => Math.min(365, prev + 1))}
              className="p-1.5 rounded-lg border border-[#D5CEC2] text-[#505D54] hover:bg-[#F4F1EA]"
              aria-label="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hadith Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#EAE6DD] shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs text-[#7A6B53]">
              <span className="font-semibold uppercase tracking-wider">
                {currentHadith.source}
              </span>
              <span className="font-mono">{currentHadith.reference}</span>
            </div>

            {/* Arabic */}
            <p className="font-serif text-xl text-[#1F2421] text-right leading-loose pt-2 pb-1" dir="rtl">
              {currentHadith.arabic}
            </p>

            {/* Transliteration */}
            {currentHadith.transliteration && (
              <p className="text-xs text-[#6B756E] italic leading-relaxed">
                {currentHadith.transliteration}
              </p>
            )}

            {/* English */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#ECE6D9]">
              <p className="text-sm text-[#1F2421] leading-relaxed">
                «{currentHadith.english}»
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. QUR'AN MURAAJA */}
      {activeSection === 'quran' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EAE6DD] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-[#1F2421]">
                  Deen Together Qur’an
                </h3>
                <p className="text-xs text-[#7A6B53]">Daily Muraaja — 3 Pages</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#EBF3ED] flex items-center justify-center text-[#2E473B]">
                <BookMarked className="w-4 h-4" />
              </div>
            </div>

            {/* Stepper */}
            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#ECE6D9] text-center">
              <span className="text-xs text-[#6B756E] block mb-1">Pages Completed Today</span>
              <div className="flex items-center justify-center gap-4 my-2">
                <button
                  onClick={() => handlePageChange(-1)}
                  className="w-9 h-9 rounded-full border border-[#D5CEC2] bg-white text-base font-bold text-[#505D54] hover:bg-[#F4F1EA]"
                >
                  -
                </button>
                <span className="font-mono text-3xl font-bold tabular-nums text-[#1F2421]">
                  {quranTask.pages_completed} / {quranTask.pages_target}
                </span>
                <button
                  onClick={() => handlePageChange(1)}
                  className="w-9 h-9 rounded-full bg-[#2E473B] text-white text-base font-bold hover:bg-[#23372E]"
                >
                  +
                </button>
              </div>
              <p className="text-[11px] text-[#7A857D]">
                {quranTask.completed ? '✓ Today’s recitation complete' : '3 pages daily maintains consistency throughout the year'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. DEEN CHALLENGE */}
      {activeSection === 'challenge' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EAE6DD] shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs text-[#7A6B53]">
              <span className="font-semibold uppercase tracking-wider">{currentChallenge.category}</span>
              <span>Question {challengeIndex + 1} of {AUTHENTIC_CHALLENGES.length}</span>
            </div>

            <h3 className="text-sm font-semibold text-[#1F2421] leading-relaxed">
              {currentChallenge.question}
            </h3>

            {/* Options */}
            <div className="space-y-2">
              {[
                { key: 'A' as const, text: currentChallenge.option_a },
                { key: 'B' as const, text: currentChallenge.option_b },
                { key: 'C' as const, text: currentChallenge.option_c },
                { key: 'D' as const, text: currentChallenge.option_d },
              ].map((opt) => {
                const isSelected = selectedAnswer === opt.key;
                const isCorrect = currentChallenge.correct_answer === opt.key;

                let btnStyle = 'bg-white border-[#EAE6DD] text-[#1F2421] hover:border-[#D5CEC2]';
                if (hasAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-[#EBF3ED] border-[#81B98F] text-[#1C512C] font-semibold';
                  } else if (isSelected) {
                    btnStyle = 'bg-[#FAECE7] border-[#E8927A] text-[#9E2F11]';
                  } else {
                    btnStyle = 'opacity-50 border-[#EAE6DD] text-[#6B756E]';
                  }
                }

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleAnswerSelect(opt.key)}
                    disabled={hasAnswered}
                    className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${btnStyle}`}
                  >
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {opt.key}
                    </span>
                    <span className="flex-1 leading-snug">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Explanation & Source */}
            {hasAnswered && (
              <div className="p-4 rounded-xl bg-[#F6F4ED] border border-[#E5DFD3] text-xs space-y-2 animate-in fade-in duration-300">
                <div className="flex items-center gap-1.5 font-semibold text-[#2E473B]">
                  <Sparkles className="w-3.5 h-3.5 text-[#988158]" />
                  <span>Explanation & Authentic Source</span>
                </div>
                <p className="text-[#505D54] leading-relaxed">
                  {currentChallenge.explanation}
                </p>
                <p className="text-[11px] text-[#7A6B53] font-mono">
                  Source: {currentChallenge.source}
                </p>

                <button
                  onClick={handleNextChallenge}
                  className="mt-3 w-full py-2 rounded-xl bg-[#2E473B] text-white text-xs font-medium hover:bg-[#23372E] transition-colors"
                >
                  Next Question
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Target Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleSaveTarget} className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl border border-[#E3DDD1]">
            <h4 className="text-sm font-serif font-bold text-[#1F2421] mb-2">Set Daily Target</h4>
            <input
              type="number"
              min="1"
              max="9999"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D5CEC2] text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-[#2E473B]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowTargetModal(false)}
                className="flex-1 py-2 rounded-xl border border-[#DCD6C8] text-xs text-[#505D54]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-[#2E473B] text-white text-xs font-medium"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
