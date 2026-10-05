import React, { useState, useEffect, useMemo } from 'react';
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
  Moon,
  Award,
  Trophy,
  Filter
} from 'lucide-react';
import { DhikrProgress, HadithItem, QuranTask, PrayerSettings, DailyQuizRecord, DeenChallenge } from '../../types/database';
import { dataService, getTodayKey } from '../../lib/storage/dataService';
import { AUTHENTIC_HADITHS, getHadithForDay } from '../../data/hadiths';
import { getDaily5Questions, getAllQuestions, getChallengeCategories, getDayOfYear } from '../../data/challenges';
import { getCalculatedPrayerTimes, PrayerSchedule } from '../../lib/prayer/prayerTimes';
import { playCalmChime, triggerHapticFeedback } from '../../lib/notifications/notificationService';
import { DailyDhikrModule } from './DailyDhikrModule';
import confetti from 'canvas-confetti';

interface DeenViewProps {
  onBack?: () => void;
}

export const DeenView: React.FC<DeenViewProps> = () => {
  const todayKey = getTodayKey();
  const dayOfYear = getDayOfYear();

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

  // Challenge (Daily 5 & All Questions) State
  const [challengeSubTab, setChallengeSubTab] = useState<'daily5' | 'all'>('daily5');
  const dailyQuestions = useMemo(() => getDaily5Questions(todayKey), [todayKey]);
  const allQuestions = useMemo(() => getAllQuestions(), []);
  const allCategories = useMemo(() => ['All', ...getChallengeCategories()], []);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [dailyIndex, setDailyIndex] = useState(0);
  const [quizRecord, setQuizRecord] = useState<DailyQuizRecord>(dataService.getDailyQuizRecord(todayKey));
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [allAnswerMap, setAllAnswerMap] = useState<Record<string, { answer: string; hasAnswered: boolean }>>({});

  useEffect(() => {
    // Update prayer times clock
    const timer = setInterval(() => {
      setSchedule(getCalculatedPrayerTimes());
    }, 60000);

    const unsubscribeQuiz = dataService.subscribeQuizScore((rec) => {
      setQuizRecord(rec);
    });

    return () => {
      clearInterval(timer);
      unsubscribeQuiz();
    };
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

  const currentDailyQ = dailyQuestions[dailyIndex] || dailyQuestions[0];

  const handleAnswerSelect = async (option: 'A' | 'B' | 'C' | 'D') => {
    if (hasAnswered) return;
    setSelectedAnswer(option);
    setHasAnswered(true);
    triggerHapticFeedback();

    const isCorrect = option === currentDailyQ.correct_answer;
    if (isCorrect) {
      playCalmChime();
    }

    const updated = await dataService.saveDailyQuizAnswer(todayKey, currentDailyQ.id, option, isCorrect);
    setQuizRecord(updated);

    // If finished 5th question, trigger celebration
    if (dailyIndex === 4 || Object.keys(updated.answers).length >= 5) {
      try {
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2E473B', '#E2D4B7', '#7F5353'],
        });
      } catch {}
    }
  };

  const handleNextChallenge = () => {
    if (dailyIndex < 4) {
      const nextIdx = dailyIndex + 1;
      setDailyIndex(nextIdx);
      const nextQ = dailyQuestions[nextIdx];
      const prevAnswer = quizRecord.answers[nextQ.id];
      if (prevAnswer) {
        setSelectedAnswer(prevAnswer);
        setHasAnswered(true);
      } else {
        setSelectedAnswer(null);
        setHasAnswered(false);
      }
    }
  };

  const handleSelectDailyIndex = (idx: number) => {
    setDailyIndex(idx);
    const q = dailyQuestions[idx];
    const prevAnswer = quizRecord.answers[q.id];
    if (prevAnswer) {
      setSelectedAnswer(prevAnswer);
      setHasAnswered(true);
    } else {
      setSelectedAnswer(null);
      setHasAnswered(false);
    }
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
          Hadith Questions (5 Daily)
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

      {/* 5. HADITH QUESTIONS (DAILY 5 FOR 365 DAYS & ALL QUESTIONS) */}
      {activeSection === 'challenge' && (
        <div className="space-y-4">
          {/* Sub-Tabs: Today's 5 Questions vs All Questions */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F4F1EA] rounded-xl text-xs font-medium">
            <button
              onClick={() => setChallengeSubTab('daily5')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                challengeSubTab === 'daily5'
                  ? 'bg-white text-[#1F2421] font-semibold shadow-xs'
                  : 'text-[#6B756E] hover:text-[#1F2421]'
              }`}
            >
              <Award className="w-4 h-4 text-[#2E473B]" />
              <span>Today’s 5 Questions · Day {dayOfYear}/365</span>
            </button>
            <button
              onClick={() => setChallengeSubTab('all')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                challengeSubTab === 'all'
                  ? 'bg-white text-[#1F2421] font-semibold shadow-xs'
                  : 'text-[#6B756E] hover:text-[#1F2421]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#7F5353]" />
              <span>All Questions Library ({allQuestions.length})</span>
            </button>
          </div>

          {/* Daily 5 Score & Progress Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#EAE6DD] shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] border border-[#EADBBD] flex items-center justify-center text-[#7F5353] shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1F2421]">
                    Today’s Score: {quizRecord.score} / 5
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    quizRecord.completed
                      ? 'bg-[#EBF3ED] text-[#1C512C] border-[#C1DEC9]'
                      : 'bg-[#FAF4E8] text-[#8C6014] border-[#E9D9B2]'
                  }`}>
                    {quizRecord.completed ? 'Completed ✓' : `${5 - Object.keys(quizRecord.answers).length} to go`}
                  </span>
                </div>
                <p className="text-[11px] text-[#7A6B53] mt-0.5">
                  Synchronized with the Us section for your partner to observe.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-base font-serif font-bold text-[#2E473B]">
                {Math.round((quizRecord.score / 5) * 100)}%
              </span>
              <span className="block text-[9px] text-[#7A6B53]">Accuracy</span>
            </div>
          </div>

          {challengeSubTab === 'daily5' ? (
            <div className="space-y-4">
              {/* Question Stepper 1..5 */}
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-white rounded-xl border border-[#EAE6DD]">
                {dailyQuestions.map((q, idx) => {
                  const isAnswered = quizRecord.answers[q.id] !== undefined;
                  const isCurrent = idx === dailyIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleSelectDailyIndex(idx)}
                      className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        isCurrent
                          ? 'bg-[#2E473B] text-white shadow-xs'
                          : isAnswered
                          ? 'bg-[#EBF3ED] text-[#1C512C]'
                          : 'bg-[#F4F1EA] text-[#6B756E] hover:bg-[#EAE6DD]'
                      }`}
                    >
                      {isAnswered && <CheckCircle2 className="w-3 h-3" />}
                      <span>Q{idx + 1}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Daily Question Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#EAE6DD] shadow-xs space-y-4">
                <div className="flex items-center justify-between text-xs text-[#7A6B53]">
                  <span className="font-semibold uppercase tracking-wider bg-[#F4F1EA] px-2 py-0.5 rounded-md text-[10px]">
                    {currentDailyQ.category}
                  </span>
                  <span className="font-mono text-[11px]">
                    Question {dailyIndex + 1} of 5 · Day {dayOfYear}/365
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[#1F2421] leading-relaxed">
                  {currentDailyQ.question}
                </h3>

                {/* Options */}
                <div className="space-y-2">
                  {[
                    { key: 'A' as const, text: currentDailyQ.option_a },
                    { key: 'B' as const, text: currentDailyQ.option_b },
                    { key: 'C' as const, text: currentDailyQ.option_c },
                    { key: 'D' as const, text: currentDailyQ.option_d },
                  ].map((opt) => {
                    const isSelected = selectedAnswer === opt.key;
                    const isCorrect = currentDailyQ.correct_answer === opt.key;

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
                      <span>Authentic Explanation & Source</span>
                    </div>
                    <p className="text-[#505D54] leading-relaxed">
                      {currentDailyQ.explanation}
                    </p>
                    <p className="text-[11px] text-[#7A6B53] font-mono">
                      Source: {currentDailyQ.source}
                    </p>

                    {dailyIndex < 4 ? (
                      <button
                        onClick={handleNextChallenge}
                        className="mt-3 w-full py-2.5 rounded-xl bg-[#2E473B] text-white text-xs font-semibold hover:bg-[#23372E] transition-colors shadow-xs"
                      >
                        Next Question ({dailyIndex + 2} of 5)
                      </button>
                    ) : (
                      <div className="mt-3 p-3 rounded-xl bg-[#EBF3ED] border border-[#C1DEC9] text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#1C512C]">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Masha’Allah! Today’s 5 Questions Complete</span>
                        </div>
                        <p className="text-[11px] text-[#405646]">
                          Your final score of {quizRecord.score}/5 is saved and visible in the Us section.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ALL QUESTIONS LIBRARY */
            <div className="space-y-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#2E473B] text-white font-semibold shadow-xs'
                        : 'bg-white text-[#6B756E] border border-[#EAE6DD] hover:text-[#1F2421]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {allQuestions
                  .filter((q) => selectedCategory === 'All' || q.category === selectedCategory)
                  .map((q, idx) => {
                    const ansState = allAnswerMap[q.id];
                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl bg-white border border-[#EAE6DD] shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs text-[#7A6B53]">
                          <span className="font-semibold uppercase tracking-wider text-[10px] bg-[#F4F1EA] px-2 py-0.5 rounded-md">
                            {q.category}
                          </span>
                          <span className="text-[10px] font-mono text-[#7A6B53]">
                            Question {idx + 1}
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-[#1F2421] leading-relaxed">
                          {q.question}
                        </h4>

                        <div className="space-y-1.5">
                          {[
                            { key: 'A' as const, text: q.option_a },
                            { key: 'B' as const, text: q.option_b },
                            { key: 'C' as const, text: q.option_c },
                            { key: 'D' as const, text: q.option_d },
                          ].map((opt) => {
                            const isChosen = ansState?.answer === opt.key;
                            const isCorrect = q.correct_answer === opt.key;
                            let style = 'bg-[#FAF8F3] border-[#EAE6DD] text-[#333E35]';
                            if (ansState?.hasAnswered) {
                              if (isCorrect) {
                                style = 'bg-[#EBF3ED] border-[#81B98F] text-[#1C512C] font-semibold';
                              } else if (isChosen) {
                                style = 'bg-[#FAECE7] border-[#E8927A] text-[#9E2F11]';
                              } else {
                                style = 'opacity-40 border-[#EAE6DD] text-[#6B756E]';
                              }
                            }
                            return (
                              <button
                                key={opt.key}
                                onClick={() => {
                                  if (!ansState?.hasAnswered) {
                                    setAllAnswerMap((prev) => ({
                                      ...prev,
                                      [q.id]: { answer: opt.key, hasAnswered: true },
                                    }));
                                    triggerHapticFeedback();
                                    if (opt.key === q.correct_answer) playCalmChime();
                                  }
                                }}
                                className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-start gap-2 transition-all ${style}`}
                              >
                                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                                  {opt.key}
                                </span>
                                <span className="flex-1">{opt.text}</span>
                              </button>
                            );
                          })}
                        </div>

                        {ansState?.hasAnswered && (
                          <div className="p-3 rounded-xl bg-[#F6F4ED] border border-[#E5DFD3] text-xs space-y-1.5">
                            <p className="text-[#505D54] leading-relaxed">
                              {q.explanation}
                            </p>
                            <p className="text-[10px] text-[#7A6B53] font-mono">
                              Source: {q.source}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
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
