import React from 'react';
import { FamilyMember, FAMILY_MEMBERS_CONFIG } from '../types';
import { 
  Home, 
  Database, 
  Nfc, 
  Bell, 
  Smartphone, 
  UserCheck,
  Sparkles,
  Key
} from 'lucide-react';

interface NavbarProps {
  activeMember: FamilyMember;
  onSelectMember: (member: FamilyMember) => void;
  currentTab: 'frontstage' | 'backstage';
  onChangeTab: (tab: 'frontstage' | 'backstage') => void;
  urgentCount: number;
  onOpenNfcModal: () => void;
  onOpenBriefingModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMember,
  onSelectMember,
  currentTab,
  onChangeTab,
  urgentCount,
  onOpenNfcModal,
  onOpenBriefingModal,
  onOpenSettingsModal,
}) => {
  const members: FamilyMember[] = ['瑋', '珍', '朋', '淨', '炘', '豐', '柔'];
  const activeConfig = FAMILY_MEMBERS_CONFIG[activeMember];

  return (
    <header className="sticky top-0 z-40 bg-[#f2f2f7]/90 backdrop-blur-md border-b border-[#d1d1d6] transition-all">
      {/* Top iOS Status & Branding Bar */}
      <div className="max-w-4xl mx-auto px-4 pt-2.5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              高
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-base font-bold text-gray-900 tracking-tight">高家智能管家</h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Spark AI
                </span>
              </div>
              <p className="text-[11px] text-gray-500 flex items-center space-x-1">
                <span>專屬家庭管家</span>
                <span>•</span>
                <span className="text-emerald-600 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1 animate-pulse"></span>
                  已連線
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center space-x-1.5">
            {/* NFC Quick Button */}
            <button
              id="navbar-nfc-btn"
              onClick={onOpenNfcModal}
              title="NFC 感應物品/櫃位"
              className="p-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-xs"
            >
              <Nfc className="w-4 h-4 text-blue-600" />
            </button>

            {/* LINE / Spark Weekly Briefing Button */}
            <button
              id="navbar-briefing-btn"
              onClick={onOpenBriefingModal}
              title="週一/週五 LINE 定期快報"
              className="relative p-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-xs"
            >
              <Bell className="w-4 h-4 text-amber-600" />
              {urgentCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] text-center text-[10px] font-bold bg-red-500 text-white rounded-full border-2 border-white animate-bounce">
                  {urgentCount}
                </span>
              )}
            </button>

            {/* AI / Gemini Key Settings Button */}
            <button
              id="navbar-settings-btn"
              onClick={onOpenSettingsModal}
              title="AI 雙核心與金鑰設定"
              className="p-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-xs"
            >
              <Key className="w-4 h-4 text-indigo-600" />
            </button>

            {/* Front / Back Stage Segmented Control */}
            <div className="bg-[#e5e5ea] p-0.5 rounded-lg flex items-center">
              <button
                id="tab-frontstage-btn"
                onClick={() => onChangeTab('frontstage')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                  currentTab === 'frontstage'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>前台</span>
              </button>
              <button
                id="tab-backstage-btn"
                onClick={() => onChangeTab('backstage')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                  currentTab === 'backstage'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>後台</span>
              </button>
            </div>
          </div>
        </div>

        {/* Family Member Switcher - Horizontal Scrollable Pill Bar */}
        <div className="mt-2.5 pt-2 border-t border-gray-200/70 flex items-center justify-between">
          <div className="flex items-center space-x-1 text-xs text-gray-500 font-medium shrink-0 mr-2">
            <UserCheck className="w-3.5 h-3.5 text-gray-400" />
            <span>目前操作人:</span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            {members.map((member) => {
              const cfg = FAMILY_MEMBERS_CONFIG[member];
              const isSelected = activeMember === member;
              return (
                <button
                  key={member}
                  id={`member-btn-${member}`}
                  onClick={() => onSelectMember(member)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center space-x-1 shrink-0 ${
                    isSelected
                      ? `${cfg.avatarBg} text-white shadow-xs ring-2 ${cfg.ringColor} ring-offset-1`
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : `${cfg.avatarBg} text-white`
                  }`}>
                    {member}
                  </span>
                  <span>{member}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
