import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Plus, 
  ShieldAlert, 
  Copy, 
  Check, 
  Link2, 
  Unlink, 
  Trash2, 
  Sparkles, 
  Compass, 
  CheckCircle2, 
  Clock,
  CalendarDays,
  User,
  Heart
} from 'lucide-react';
import { SharedGoal, Goal, Relationship, EmergencyRequest, SharedGoalCategory, Memory } from '../../types/database';
import { dataService } from '../../lib/storage/dataService';
import { triggerHapticFeedback, playCalmChime } from '../../lib/notifications/notificationService';
import { SpiritualCheckInCard } from './SpiritualCheckInCard';
import { CouplesGallery } from './CouplesGallery';

interface UsViewProps {
  onOpenINeedYou: () => void;
}

const CATEGORIES: SharedGoalCategory[] = [
  'Marriage preparation',
  'Deen',
  'Character',
  'Family',
  'Education',
  'Career',
  'Money',
  'Health',
];

export const UsView: React.FC<UsViewProps> = ({ onOpenINeedYou }) => {
  const [relationship, setRelationship] = useState<Relationship>(dataService.getRelationship());
  const [personalGoals, setPersonalGoals] = useState<Goal[]>(dataService.getGoals());
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>(dataService.getSharedGoals());
  const [memories, setMemories] = useState<Memory[]>(dataService.getMemories());
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>(dataService.getEmergencyRequests());

  // Tab order: My Goals -> Her Goals -> Our Goals -> Gallery -> Our Journey -> Connection
  const [activeTab, setActiveTab] = useState<'my_goals' | 'her_goals' | 'our_goals' | 'gallery' | 'journey' | 'link'>('our_goals');
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputInviteCode, setInputInviteCode] = useState('');

  // Add / Edit Shared Goal Modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<SharedGoalCategory>('Marriage preparation');
  const [newProgress, setNewProgress] = useState(0);

  // Add Personal Goal Modal
  const [showPersonalGoalModal, setShowPersonalGoalModal] = useState(false);
  const [personalTitle, setPersonalTitle] = useState('');
  const [personalDesc, setPersonalDesc] = useState('');
  const [personalCategory, setPersonalCategory] = useState('Deen');

  const loadData = () => {
    setRelationship(dataService.getRelationship());
    setPersonalGoals(dataService.getGoals());
    setSharedGoals(dataService.getSharedGoals());
    setMemories(dataService.getMemories());
    setEmergencyRequests(dataService.getEmergencyRequests());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(relationship.invite_code);
    setCopiedCode(true);
    triggerHapticFeedback();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConnectPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputInviteCode.trim()) return;
    const updated = await dataService.updateRelationship({
      status: 'accepted',
      partner_name: 'Connected Person',
      accepted_at: new Date().toISOString(),
    });
    setRelationship(updated);
    setInputInviteCode('');
    playCalmChime();
  };

  const handleDisconnect = async () => {
    if (confirm('Disconnect from your partner? This will keep your data private.')) {
      const updated = await dataService.updateRelationship({
        status: 'disconnected',
        partner_name: undefined,
      });
      setRelationship(updated);
    }
  };

  const handleCreateSharedGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = await dataService.createSharedGoal({
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      progress: newProgress,
      status: 'in_progress',
    });
    setSharedGoals((prev) => [...prev, created]);
    setNewTitle('');
    setNewDesc('');
    setNewProgress(0);
    setShowGoalModal(false);
    playCalmChime();
  };

  const handleCreatePersonalGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalTitle.trim()) return;
    const created = await dataService.createGoal({
      title: personalTitle.trim(),
      description: personalDesc.trim(),
      category: personalCategory,
      progress: 0,
      status: 'in_progress',
    });
    setPersonalGoals((prev) => [...prev, created]);
    setPersonalTitle('');
    setPersonalDesc('');
    setShowPersonalGoalModal(false);
    playCalmChime();
  };

  const handleUpdateSharedProgress = async (goalId: string, currentProg: number, step: number) => {
    triggerHapticFeedback();
    const nextVal = Math.min(100, Math.max(0, currentProg + step));
    const updated = await dataService.updateSharedGoal(goalId, { progress: nextVal });
    if (updated) {
      setSharedGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
    }
  };

  const handleDeleteSharedGoal = async (goalId: string) => {
    if (confirm('Delete this shared goal?')) {
      await dataService.deleteSharedGoal(goalId);
      setSharedGoals((prev) => prev.filter((g) => g.id !== goalId));
    }
  };

  const handleDeletePersonalGoal = async (goalId: string) => {
    if (confirm('Delete this personal goal?')) {
      await dataService.deleteGoal(goalId);
      setPersonalGoals((prev) => prev.filter((g) => g.id !== goalId));
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    const updated = await dataService.acknowledgeEmergencyRequest(alertId);
    if (updated) {
      setEmergencyRequests((prev) =>
        prev.map((r) => (r.id === alertId ? updated : r))
      );
    }
  };

  const isLinked = relationship.status === 'accepted';
  const activeAlerts = emergencyRequests.filter((r) => r.status === 'active');

  // Her / Partner Goals (when connected)
  const partnerGoals: Goal[] = isLinked
    ? [
        {
          id: 'pg-1',
          user_id: 'partner',
          title: 'Daily Qur’an Muraaja (3 Pages)',
          description: 'Maintaining consistency before Fajr or after Maghrib',
          category: 'Deen',
          progress: 80,
          status: 'in_progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'pg-2',
          user_id: 'partner',
          title: 'Arabic Syntax & Grammar Study',
          description: 'Focusing on Quranic vocabulary and comprehension',
          category: 'Education',
          progress: 50,
          status: 'in_progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'pg-3',
          user_id: 'partner',
          title: 'Emotional Restraint & Quiet Patience',
          description: 'Responding with gentleness and mindful reflection',
          category: 'Character',
          progress: 75,
          status: 'in_progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
    : [];

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HeartHandshake className="w-5 h-5 text-[#7F5353]" />
          <h1 className="text-2xl font-serif font-bold text-[#1F2421]">
            Us · Halal Future
          </h1>
        </div>
        <p className="text-xs text-[#7A6B53]">
          «Growing separately. Growing together.» Preparing with dignity and restraint.
        </p>
      </div>

      {/* Prominent Emergency Button Banner (PRD 18) */}
      <div className="p-4 rounded-2xl bg-[#FAECE7] border border-[#F3C7B9] flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#B93815] text-white flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#9E2F11] uppercase tracking-wider">
              Emergency Alert System
            </h2>
            <p className="text-xs text-[#6B756E]">
              Send an urgent notification if you need immediate reassurance or support.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenINeedYou}
          className="px-3.5 py-2 rounded-xl bg-[#B93815] text-white text-xs font-bold whitespace-nowrap hover:bg-[#9E2F11] active:scale-95 transition-all shadow-xs"
        >
          I NEED YOU
        </button>
      </div>

      {/* Active Alerts (if any) */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 rounded-xl bg-[#FAECE7] border-2 border-[#B93815] flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-[#B93815] uppercase tracking-wider">
                  Urgent: {alert.message}
                </span>
                <p className="text-[10px] text-[#6B756E]">
                  Sent at {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={() => handleAcknowledgeAlert(alert.id)}
                className="px-3 py-1 rounded-lg bg-[#2E473B] text-white text-xs font-medium hover:bg-[#23372E]"
              >
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Spiritual Check-in Module (with Calendar Integration) */}
      <SpiritualCheckInCard
        relationship={relationship}
        onUpdateRelationship={setRelationship}
      />

      {/* Sub-Navigation Tabs matching PRD order */}
      <div className="flex items-center gap-1 p-1 bg-[#EFECE6] rounded-xl text-xs font-medium overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('my_goals')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'my_goals'
              ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
              : 'text-[#6B756E] hover:text-[#1F2421]'
          }`}
        >
          My Goals ({personalGoals.length})
        </button>
        <button
          onClick={() => setActiveTab('her_goals')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'her_goals'
              ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
              : 'text-[#6B756E] hover:text-[#1F2421]'
          }`}
        >
          Her Goals {isLinked ? `(${partnerGoals.length})` : '🔒'}
        </button>
        <button
          onClick={() => setActiveTab('our_goals')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'our_goals'
              ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
              : 'text-[#6B756E] hover:text-[#1F2421]'
          }`}
        >
          Our Goals ({sharedGoals.length})
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'gallery'
              ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
              : 'text-[#6B756E] hover:text-[#1F2421]'
          }`}
        >
          Gallery ({memories.length})
        </button>
        <button
          onClick={() => setActiveTab('journey')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'journey'
              ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
              : 'text-[#6B756E] hover:text-[#1F2421]'
          }`}
        >
          Our Journey
        </button>
        <button
          onClick={() => setActiveTab('link')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'link'
              ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
              : 'text-[#6B756E] hover:text-[#1F2421]'
          }`}
        >
          Connection {isLinked ? '✓' : ''}
        </button>
      </div>

      {/* 1. MY GOALS */}
      {activeTab === 'my_goals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1F2421] uppercase tracking-wider">
              My Personal Goals
            </span>
            <button
              onClick={() => setShowPersonalGoalModal(true)}
              className="flex items-center gap-1 text-xs font-medium text-[#2E473B] hover:text-[#1F2421]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </div>

          <div className="space-y-3">
            {personalGoals.map((g) => (
              <div
                key={g.id}
                className="p-4 rounded-2xl bg-white border border-[#EAE6DD] shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#7A6B53] font-semibold uppercase tracking-wider">
                    {g.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-[#1F2421]">
                      {g.progress}%
                    </span>
                    <button
                      onClick={() => handleDeletePersonalGoal(g.id)}
                      className="p-1 text-[#9CA69F] hover:text-[#B93815] transition-colors"
                      aria-label="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xs font-semibold text-[#1F2421]">{g.title}</h3>
                {g.description && (
                  <p className="text-xs text-[#505D54] leading-relaxed">{g.description}</p>
                )}
                <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#2E473B] transition-all duration-300"
                    style={{ width: `${g.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. HER GOALS (Only available when properly linked and authorized) */}
      {activeTab === 'her_goals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1F2421] uppercase tracking-wider">
              Her Goals {isLinked ? `(${relationship.partner_name})` : ''}
            </span>
          </div>

          {isLinked ? (
            <div className="space-y-3">
              {partnerGoals.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-2xl bg-white border border-[#EAE6DD] shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#7F5353] font-semibold uppercase tracking-wider">
                      {g.category}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#1F2421]">
                      {g.progress}%
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-[#1F2421]">{g.title}</h3>
                  {g.description && (
                    <p className="text-xs text-[#505D54] leading-relaxed">{g.description}</p>
                  )}
                  <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7F5353] transition-all duration-300"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#FAF8F3] border border-[#ECE6D9] text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EFECE6] text-[#7A6B53] flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-serif font-bold text-[#1F2421]">
                Partner Goals are Private
              </h3>
              <p className="text-xs text-[#6B756E] max-w-xs mx-auto leading-relaxed">
                Connect with your prospective partner using an invitation code to view her personal growth goals with mutual permission.
              </p>
              <button
                onClick={() => setActiveTab('link')}
                className="px-4 py-2 rounded-xl bg-[#2E473B] text-white text-xs font-medium hover:bg-[#23372E]"
              >
                Go to Connection Setup
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. OUR GOALS (Shared Goals across 8 Categories) */}
      {activeTab === 'our_goals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1F2421] uppercase tracking-wider">
              Shared Preparation Goals
            </span>
            <button
              onClick={() => setShowGoalModal(true)}
              className="flex items-center gap-1 text-xs font-medium text-[#2E473B] hover:text-[#1F2421]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </div>

          <div className="space-y-3">
            {sharedGoals.map((goal) => (
              <div
                key={goal.id}
                className="p-4 rounded-2xl bg-white border border-[#EAE6DD] shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[#7A6B53] font-semibold uppercase tracking-wider block mb-0.5">
                      {goal.category}
                    </span>
                    <h3 className="text-sm font-semibold text-[#1F2421]">
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className="text-xs text-[#505D54] mt-1 leading-relaxed">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteSharedGoal(goal.id)}
                    className="p-1 text-[#9CA69F] hover:text-[#B93815] transition-colors"
                    aria-label="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress bar and adjuster */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B756E]">Progress</span>
                    <span className="font-mono tabular-nums font-semibold text-[#1F2421]">
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EFECE6] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2E473B] transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => handleUpdateSharedProgress(goal.id, goal.progress, -5)}
                      className="px-2 py-0.5 rounded-md border border-[#D5CEC2] text-[10px] text-[#505D54]"
                    >
                      -5%
                    </button>
                    <button
                      onClick={() => handleUpdateSharedProgress(goal.id, goal.progress, 5)}
                      className="px-2 py-0.5 rounded-md border border-[#D5CEC2] text-[10px] text-[#505D54]"
                    >
                      +5%
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. COUPLES GALLERY */}
      {activeTab === 'gallery' && (
        <CouplesGallery
          memories={memories}
          onUpdateMemories={setMemories}
        />
      )}

      {/* 5. OUR JOURNEY (Timeline) */}
      {activeTab === 'journey' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1F2421] uppercase tracking-wider">
              Journey Timeline & Milestones
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E3DDD1]">
            {memories.map((m) => (
              <div key={m.id} className="relative group">
                <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-[#988158] border-2 border-white shadow-xs" />
                <div className="p-4 rounded-2xl bg-white border border-[#EAE6DD] shadow-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-[#7A6B53] uppercase tracking-wider">
                        {m.event_type} · {new Date(m.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <h3 className="text-sm font-semibold text-[#1F2421] mt-0.5">
                        {m.title}
                      </h3>
                    </div>
                  </div>
                  {m.description && (
                    <p className="text-xs text-[#505D54] leading-relaxed">
                      {m.description}
                    </p>
                  )}
                  {m.image_url && (
                    <div className="rounded-xl overflow-hidden mt-2 max-h-48 border border-[#EAE6DD]">
                      <img
                        src={m.image_url}
                        alt={m.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. CONNECTION LINKING */}
      {activeTab === 'link' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EAE6DD] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#2E473B]" />
              <h3 className="text-sm font-semibold text-[#1F2421]">
                Private Connection Status
              </h3>
            </div>

            {isLinked ? (
              <div className="p-4 rounded-xl bg-[#EBF3ED] border border-[#C1DEC9] space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1C512C]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connected with {relationship.partner_name}</span>
                </div>
                <p className="text-xs text-[#405646] leading-relaxed">
                  Both individuals can view shared goals, partner goals, and dispatch I Need You emergency signals.
                </p>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D5CEC2] bg-white text-xs text-[#B93815] hover:bg-[#FAECE7]"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#ECE6D9]">
                  <span className="text-[10px] font-semibold text-[#7A6B53] uppercase tracking-wider block mb-1">
                    Your Private Invitation Code
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-[#1F2421] tracking-wider">
                      {relationship.invite_code}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2E473B] text-white text-xs font-medium hover:bg-[#23372E]"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#7A857D] mt-2 leading-relaxed">
                    Share this code with your prospective partner to link your goals and emergency alerts.
                  </p>
                </div>

                <form onSubmit={handleConnectPartner} className="space-y-2">
                  <label className="block text-xs font-medium text-[#445047]">
                    Or enter partner’s invitation code:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputInviteCode}
                      onChange={(e) => setInputInviteCode(e.target.value.toUpperCase())}
                      placeholder="e.g. AMANAH-XXXX"
                      className="flex-1 px-3 py-2 rounded-xl border border-[#D5CEC2] text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#2E473B]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#2E473B] text-white text-xs font-medium hover:bg-[#23372E]"
                    >
                      Link
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Shared Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleCreateSharedGoal} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-[#E3DDD1] space-y-3">
            <h4 className="text-sm font-serif font-bold text-[#1F2421]">New Shared Goal</h4>
            
            <div>
              <label className="block text-[11px] font-medium text-[#505D54] mb-1">Goal Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Complete premarital guidance study"
                required
                className="w-full px-3 py-2 rounded-xl border border-[#D5CEC2] text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#505D54] mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as SharedGoalCategory)}
                className="w-full px-3 py-2 rounded-xl border border-[#D5CEC2] text-xs bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#505D54] mb-1">Description (Optional)</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-[#D5CEC2] text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
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

      {/* Create Personal Goal Modal */}
      {showPersonalGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleCreatePersonalGoal} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-[#E3DDD1] space-y-3">
            <h4 className="text-sm font-serif font-bold text-[#1F2421]">New Personal Goal</h4>
            
            <div>
              <label className="block text-[11px] font-medium text-[#505D54] mb-1">Goal Title</label>
              <input
                type="text"
                value={personalTitle}
                onChange={(e) => setPersonalTitle(e.target.value)}
                placeholder="e.g. Daily Arabic reading"
                required
                className="w-full px-3 py-2 rounded-xl border border-[#D5CEC2] text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#505D54] mb-1">Category</label>
              <input
                type="text"
                value={personalCategory}
                onChange={(e) => setPersonalCategory(e.target.value)}
                placeholder="e.g. Deen, Health, Career"
                className="w-full px-3 py-2 rounded-xl border border-[#D5CEC2] text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#505D54] mb-1">Description</label>
              <textarea
                value={personalDesc}
                onChange={(e) => setPersonalDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-[#D5CEC2] text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPersonalGoalModal(false)}
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
