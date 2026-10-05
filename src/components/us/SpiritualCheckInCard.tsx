import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Download, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Check
} from 'lucide-react';
import { Relationship } from '../../types/database';
import { dataService, getTodayKey } from '../../lib/storage/dataService';
import { triggerHapticFeedback, playCalmChime } from '../../lib/notifications/notificationService';
import confetti from 'canvas-confetti';

interface SpiritualCheckInCardProps {
  relationship: Relationship;
  onUpdateRelationship: (updated: Relationship) => void;
}

type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

const DAY_MAP: Record<DayOfWeek, string> = {
  Sunday: 'SU',
  Monday: 'MO',
  Tuesday: 'TU',
  Wednesday: 'WE',
  Thursday: 'TH',
  Friday: 'FR',
  Saturday: 'SA',
};

const DAY_NUMBER_MAP: Record<DayOfWeek, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const PROMPTS = [
  {
    category: 'Spiritual Health',
    question: 'How was your connection with Allah this week? (Prayers, quiet moments, or struggles?)',
  },
  {
    category: 'Mutual Support',
    question: 'Is there anything weighing on your mind or heart that I can help lighten?',
  },
  {
    category: 'Gratitude & Mawaddah',
    question: 'What is one thing you appreciated or that brought you comfort between us this week?',
  },
  {
    category: 'Future & Intention',
    question: 'What is one shared deen or practical goal we should focus on in the coming week?',
  },
];

export const SpiritualCheckInCard: React.FC<SpiritualCheckInCardProps> = ({
  relationship,
  onUpdateRelationship,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    relationship.weekly_checkin_day || 'Sunday'
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    relationship.weekly_checkin_time || '20:00'
  );
  const [showPrompts, setShowPrompts] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const todayKey = getTodayKey();
  const isCompletedThisWeek = relationship.last_checkin_date 
    ? (new Date().getTime() - new Date(relationship.last_checkin_date).getTime()) < 6 * 24 * 60 * 60 * 1000
    : false;

  const handleSaveSchedule = async (day: DayOfWeek, time: string) => {
    setSelectedDay(day);
    setSelectedTime(time);
    triggerHapticFeedback();

    const updated = await dataService.updateRelationship({
      weekly_checkin_day: day,
      weekly_checkin_time: time,
    });
    onUpdateRelationship(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleMarkCompleted = async () => {
    triggerHapticFeedback();
    playCalmChime();
    const updated = await dataService.updateRelationship({
      last_checkin_date: todayKey,
    });
    onUpdateRelationship(updated);

    try {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#2E473B', '#E2D4B7', '#8F9E8B'],
      });
    } catch {}
  };

  // Helper to generate next occurrence date for the calendar event
  const getNextEventDate = (dayName: DayOfWeek, timeStr: string): Date => {
    const targetDay = DAY_NUMBER_MAP[dayName];
    const [hours, minutes] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);

    const date = new Date();
    const currentDay = date.getDay();
    let distance = (targetDay - currentDay + 7) % 7;
    if (distance === 0) {
      // If today is the day, but the time has already passed, schedule for next week
      const currentMin = date.getHours() * 60 + date.getMinutes();
      const targetMin = hours * 60 + minutes;
      if (currentMin >= targetMin) {
        distance = 7;
      }
    }
    date.setDate(date.getDate() + distance);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatICSDate = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // 1. Download .ics iCalendar file (works with Apple Calendar, Android, Outlook, etc.)
  const handleDownloadICS = () => {
    triggerHapticFeedback();
    const startDate = getNextEventDate(selectedDay, selectedTime);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min duration
    const byDay = DAY_MAP[selectedDay];

    const description = [
      'Amanah Weekly Spiritual Check-in for Husband & Wife.',
      '',
      'Reflections & Prompts:',
      '1. How was your connection with Allah this week?',
      '2. What is weighing on your mind that I can help lighten?',
      '3. What is one thing you appreciated between us this week?',
      '4. What is our shared goal for the coming week?',
      '',
      'Grounded in mutual tranquility and mercy (Mawaddah & Rahmah).'
    ].join('\\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Amanah//Spiritual Check-in//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:amanah-spiritual-checkin-${Date.now()}@amanah.app`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
      'SUMMARY:🕊️ Amanah · Weekly Spiritual Check-in',
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Weekly Spiritual Check-in in 15 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Amanah-Spiritual-Check-in-${selectedDay}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    playCalmChime();
  };

  // 2. Direct Google Calendar link
  const getGoogleCalendarUrl = () => {
    const startDate = getNextEventDate(selectedDay, selectedTime);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    const title = encodeURIComponent('🕊️ Amanah · Weekly Spiritual Check-in');
    const details = encodeURIComponent(
      'A quiet, tranquil 20-minute weekly conversation to nurture our deen, emotional bond, and mutual mercy (Mawaddah & Rahmah).\n\nPrompts:\n1. How was your connection with Allah this week?\n2. What is weighing on your mind that I can help lighten?\n3. What did you appreciate between us this week?\n4. What is our shared intention for next week?'
    );
    const dates = `${formatICSDate(startDate)}/${formatICSDate(endDate)}`;
    const recur = `RRULE:FREQ=WEEKLY;BYDAY=${DAY_MAP[selectedDay]}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&recur=${encodeURIComponent(recur)}`;
  };

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FAF8F5] to-[#F3EFE7] border border-[#E4DDD0] shadow-xs space-y-4">
      {/* Title & Badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#FAF0E6] border border-[#EADBBD] flex items-center justify-center text-[#7F5353] shadow-xs">
            <Calendar className="w-4 h-4 text-[#7F5353]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#8B6E38] uppercase tracking-wider">
                Weekly Sanctuary
              </span>
              {isCompletedThisWeek && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#EBF3ED] text-[#1C512C] text-[9px] font-semibold border border-[#C1DEC9]">
                  ✓ This Week Completed
                </span>
              )}
            </div>
            <h3 className="text-sm font-serif font-bold text-[#1F2421]">
              Weekly Spiritual Check-in
            </h3>
          </div>
        </div>

        {/* Completion button */}
        <button
          onClick={handleMarkCompleted}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
            isCompletedThisWeek
              ? 'bg-[#EBF3ED] text-[#1C512C] border border-[#C1DEC9]'
              : 'bg-white border border-[#D5CEC2] text-[#505D54] hover:bg-[#F4F1EA]'
          }`}
          title="Mark check-in completed for this week"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E473B]" />
          <span>{isCompletedThisWeek ? 'Done' : 'Mark Done'}</span>
        </button>
      </div>

      <p className="text-xs text-[#505D54] leading-relaxed">
        A dedicated 20-minute weekly conversation for husband and wife to sit together calmly, review their shared intentions, listen with an open heart, and renew their bond for the sake of Allah.
      </p>

      {/* Schedule Picker Form */}
      <div className="p-3.5 rounded-2xl bg-white/90 border border-[#E8E1D2] space-y-3">
        <div className="flex items-center justify-between text-xs font-medium text-[#1F2421]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#7A6B53]" />
            <span>Scheduled Recurring Day & Time</span>
          </span>
          {savedSuccess && (
            <span className="text-[11px] text-[#1C512C] font-semibold animate-in fade-in">
              ✓ Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[#7A857D] font-medium mb-1">
              Day of Week
            </label>
            <select
              value={selectedDay}
              onChange={(e) => handleSaveSchedule(e.target.value as DayOfWeek, selectedTime)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-[#D5CEC2] text-xs bg-white font-medium text-[#1F2421] focus:outline-none focus:ring-1 focus:ring-[#2E473B]"
            >
              <option value="Sunday">Every Sunday</option>
              <option value="Friday">Every Friday</option>
              <option value="Thursday">Every Thursday</option>
              <option value="Saturday">Every Saturday</option>
              <option value="Monday">Every Monday</option>
              <option value="Tuesday">Every Tuesday</option>
              <option value="Wednesday">Every Wednesday</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#7A857D] font-medium mb-1">
              Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => handleSaveSchedule(selectedDay, e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-[#D5CEC2] text-xs bg-white font-mono text-[#1F2421] focus:outline-none focus:ring-1 focus:ring-[#2E473B]"
            />
          </div>
        </div>

        {/* Action Buttons to Add to Calendar */}
        <div className="pt-1 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleDownloadICS}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#2E473B] text-white text-xs font-semibold hover:bg-[#23372E] active:scale-95 transition-all shadow-xs"
            aria-label="Add Spiritual Check-in reminder to your device calendar"
          >
            <Download className="w-3.5 h-3.5 text-[#E2D4B7]" />
            <span>Add to Local Calendar (.ics)</span>
          </button>

          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#D5CEC2] bg-white text-xs font-medium text-[#505D54] hover:bg-[#F4F1EA] transition-colors"
            title="Open in Google Calendar"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#7A6B53]" />
            <span>Google Calendar</span>
          </a>
        </div>
      </div>

      {/* Foldable Discussion Prompts */}
      <div className="pt-1">
        <button
          onClick={() => setShowPrompts(!showPrompts)}
          className="w-full flex items-center justify-between text-xs font-medium text-[#7A6B53] hover:text-[#1F2421] py-1"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#A58957]" />
            <span>Check-in Reflection Prompts ({PROMPTS.length})</span>
          </span>
          {showPrompts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showPrompts && (
          <div className="mt-2 space-y-2 text-xs text-[#525E56] animate-in fade-in duration-200">
            {PROMPTS.map((p, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-white/80 border border-[#ECE5D8] space-y-0.5">
                <span className="text-[10px] font-semibold text-[#8B6E38] uppercase tracking-wider block">
                  {p.category}
                </span>
                <p className="text-[11px] text-[#1F2421] leading-relaxed">
                  {p.question}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
