import React, { useState, useEffect, useMemo } from 'react';
import { 
  InventoryItem, 
  TodoItem, 
  FamilyMember 
} from './types';
import { 
  INITIAL_ITEMS, 
  INITIAL_TODOS 
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { Frontstage } from './components/Frontstage';
import { Backstage } from './components/Backstage';
import { RegisterModal } from './components/RegisterModal';
import { SearchModal } from './components/SearchModal';
import { ConsumeModal } from './components/ConsumeModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { NfcModal } from './components/NfcModal';
import { BriefingModal } from './components/BriefingModal';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  // 1. Core State
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('kao_inventory_items_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
    }
    return INITIAL_ITEMS;
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('kao_todos_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
    }
    return INITIAL_TODOS;
  });

  // Active Family Member (瑋、珍、朋、淨、炘、豐、柔)
  const [activeMember, setActiveMember] = useState<FamilyMember>(() => {
    const saved = localStorage.getItem('kao_active_member');
    return (saved as FamilyMember) || '瑋';
  });

  // Navigation tab ('frontstage' | 'backstage')
  const [currentTab, setCurrentTab] = useState<'frontstage' | 'backstage'>('frontstage');

  // Filter by family member in frontstage
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<FamilyMember | 'all'>('all');
  const [lastSavedItemId, setLastSavedItemId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInitialTag, setSearchInitialTag] = useState<string | undefined>(undefined);
  const [consumeItem, setConsumeItem] = useState<InventoryItem | null>(null);
  const [lightboxItem, setLightboxItem] = useState<InventoryItem | null>(null);
  const [isNfcOpen, setIsNfcOpen] = useState(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Save to localStorage with Quota Protection & Fallback
  useEffect(() => {
    try {
      localStorage.setItem('kao_inventory_items_v2', JSON.stringify(items));
    } catch (err) {
      console.warn('LocalStorage save failed, applying lightweight fallback:', err);
      try {
        // Strip heavy base64 strings if quota exceeded so items data is NEVER lost
        const safeItems = items.map((it) => ({
          ...it,
          closeUpPhotoUrl: it.closeUpPhotoUrl && it.closeUpPhotoUrl.length > 500000 ? undefined : it.closeUpPhotoUrl,
          widePhotoUrl: it.widePhotoUrl && it.widePhotoUrl.length > 500000 ? undefined : it.widePhotoUrl,
        }));
        localStorage.setItem('kao_inventory_items_v2', JSON.stringify(safeItems));
      } catch (fatalErr) {
        console.error('Fatal storage save error:', fatalErr);
      }
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('kao_todos_v2', JSON.stringify(todos));
    } catch (err) {
      console.warn('Failed to save todos to localStorage:', err);
    }
  }, [todos]);

  useEffect(() => {
    try {
      localStorage.setItem('kao_active_member', activeMember);
    } catch (err) {
      console.warn('Failed to save active member:', err);
    }
  }, [activeMember]);

  // Urgent Count Calculation for Navbar
  const urgentCount = useMemo(() => {
    const today = new Date();
    const urgentFoods = items.filter((item) => {
      if (item.category === 'food' && item.expiryDate) {
        const exp = new Date(item.expiryDate);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 3;
      }
      return false;
    });

    const lowStock = items.filter(
      (item) => item.estimatedLifespanWeeks !== undefined && item.estimatedLifespanWeeks <= 2
    );

    const pendingTodos = todos.filter((t) => !t.isCompleted);

    return urgentFoods.length + lowStock.length + pendingTodos.length;
  }, [items, todos]);

  // Item Handlers
  const handleSaveItem = (newItem: InventoryItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === newItem.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newItem;
        return next;
      }
      return [newItem, ...prev];
    });

    // Reset filters and navigate to frontstage so the user sees it immediately
    setCurrentTab('frontstage');
    setSelectedMemberFilter('all');
    setLastSavedItemId(newItem.id);
    setToastMessage(`✨ 物品「${newItem.name}」已成功登錄至高家物品清單！`);

    // Clear highlight after 6 seconds
    setTimeout(() => {
      setLastSavedItemId(null);
    }, 6000);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleUpdateItem = (updated: InventoryItem) => {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Todo Handlers
  const handleSaveTodo = (newTodo: TodoItem) => {
    setTodos((prev) => [newTodo, ...prev]);
    setCurrentTab('frontstage');
    setToastMessage(`📝 待辦「${newTodo.title}」已建立！`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleToggleTodo = (todoId: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === todoId ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  };

  const handleOpenSearchModal = (initialTag?: string) => {
    setSearchInitialTag(initialTag);
    setIsSearchOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] text-gray-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* iOS App Navigation Header */}
      <Navbar
        activeMember={activeMember}
        onSelectMember={setActiveMember}
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        urgentCount={urgentCount}
        onOpenNfcModal={() => setIsNfcOpen(true)}
        onOpenBriefingModal={() => setIsBriefingOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gray-900/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 border border-white/20">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-3.5 sm:px-4 pt-3">
        {currentTab === 'frontstage' ? (
          <Frontstage
            items={items}
            todos={todos}
            activeMember={activeMember}
            selectedMemberFilter={selectedMemberFilter}
            onSelectMemberFilter={setSelectedMemberFilter}
            lastSavedItemId={lastSavedItemId}
            onOpenRegisterModal={() => setIsRegisterOpen(true)}
            onOpenSearchModal={handleOpenSearchModal}
            onOpenConsumeModal={(item) => setConsumeItem(item)}
            onViewPhotoLightbox={(item) => setLightboxItem(item)}
            onToggleTodo={handleToggleTodo}
          />
        ) : (
          <Backstage
            items={items}
            todos={todos}
            activeMember={activeMember}
            onRefreshItems={() => {}}
          />
        )}
      </main>

      {/* 2. Registration Modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        activeMember={activeMember}
        existingItems={items}
        onSaveItem={handleSaveItem}
        onSaveTodo={handleSaveTodo}
      />

      {/* 3. Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        items={items}
        initialTag={searchInitialTag}
        onOpenConsumeModal={(item) => setConsumeItem(item)}
        onViewPhotoLightbox={(item) => setLightboxItem(item)}
      />

      {/* 4. Consume / Relocate Modal */}
      <ConsumeModal
        isOpen={Boolean(consumeItem)}
        item={consumeItem}
        onClose={() => setConsumeItem(null)}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
      />

      {/* 5. Photo Lightbox Modal */}
      <PhotoLightbox
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
      />

      {/* 6. NFC Modal */}
      <NfcModal
        isOpen={isNfcOpen}
        onClose={() => setIsNfcOpen(false)}
        items={items}
        onSelectItem={(item) => setConsumeItem(item)}
      />

      {/* 7. LINE Weekly Briefing Modal */}
      <BriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        items={items}
        todos={todos}
      />

      {/* 8. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
