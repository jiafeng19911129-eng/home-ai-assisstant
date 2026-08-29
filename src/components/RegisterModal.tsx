import React, { useState, useRef, useEffect } from 'react';
import { 
  InventoryItem, 
  TodoItem, 
  FamilyMember, 
  FAMILY_MEMBERS_CONFIG, 
  CATEGORY_LABELS, 
  ItemCategory,
  GeminiAnalysisResult,
  AnalyzedItemDraft,
  normalizeMemberAlias
} from '../types';
import { KAO_LOCATION_STRUCTURE } from '../data/initialData';
import { SpeechRecognizer } from '../utils/speechRecognition';
import { analyzeSmartInput } from '../utils/aiService';
import confetti from 'canvas-confetti';
import { 
  X, 
  Camera, 
  Mic, 
  MicOff, 
  Sparkles, 
  Upload, 
  Check, 
  AlertCircle, 
  MapPin, 
  Calendar, 
  FileText, 
  RefreshCw,
  Package,
  CheckSquare,
  Trash2,
  ListPlus,
  Plus
} from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMember: FamilyMember;
  existingItems: InventoryItem[];
  onSaveItem: (item: InventoryItem) => void;
  onSaveTodo: (todo: TodoItem) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  activeMember,
  existingItems,
  onSaveItem,
  onSaveTodo,
}) => {
  // Input Modes: 'text' | 'voice' | 'photo'
  const [smartMode, setSmartMode] = useState<'photo' | 'voice' | 'text'>('voice');
  
  // Record Type: 'item' (物品庫存) | 'todo' (待辦事項)
  const [recordType, setRecordType] = useState<'item' | 'todo'>('item');

  // Input states for AI
  const [transcript, setTranscript] = useState('');
  const [closeUpPhoto, setCloseUpPhoto] = useState<string | null>(null);
  const [widePhoto, setWidePhoto] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Analysis result & Batch Items List
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null);
  const [batchItems, setBatchItems] = useState<AnalyzedItemDraft[]>([]);

  // Missing Info Dialog state & Speech Recognition
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [missingFieldAnswer, setMissingFieldAnswer] = useState('');
  const [isMissingRecording, setIsMissingRecording] = useState(false);

  // Conflict / Existing Item Dialog state
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictChoice, setConflictChoice] = useState<'new_purchase' | 'move_item' | 'consume'>('new_purchase');

  // Single Item Draft State
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<ItemCategory>('daily');
  const [itemOwner, setItemOwner] = useState<FamilyMember>(activeMember);
  const [itemFloor, setItemFloor] = useState('1樓');
  const [itemRoom, setItemRoom] = useState('客廳');
  const [itemStorageUnit, setItemStorageUnit] = useState('白色塑膠4層櫃');
  const [itemSubLocation, setItemSubLocation] = useState('第1層');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemUnit, setItemUnit] = useState('件');
  const [itemExpiryDate, setItemExpiryDate] = useState('');

  // Todo State
  const [todoTitle, setTodoTitle] = useState('');
  const [todoAssignedTo, setTodoAssignedTo] = useState<FamilyMember>(activeMember);
  const [todoTargetDate, setTodoTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [todoLocationTag, setTodoLocationTag] = useState('');
  const [todoNote, setTodoNote] = useState('');

  const speechRecognizerRef = useRef<SpeechRecognizer | null>(null);
  const missingSpeechRecognizerRef = useRef<SpeechRecognizer | null>(null);

  // Reset or initialize state when opening modal
  useEffect(() => {
    if (isOpen) {
      setItemOwner(activeMember);
      setTodoAssignedTo(activeMember);
      setTranscript('');
      setCloseUpPhoto(null);
      setWidePhoto(null);
      setAnalysisResult(null);
      setBatchItems([]);
      setShowMissingDialog(false);
      setShowConflictDialog(false);
      setVoiceError(null);
      setItemName('');
      setItemCategory('daily');
      setItemFloor('1樓');
      setItemRoom('客廳');
      setItemStorageUnit('白色塑膠4層櫃');
      setItemSubLocation('第1層');
      setItemQuantity(1);
      setItemUnit('件');
      setItemExpiryDate('');
      setRecordType('item');
    }
  }, [isOpen, activeMember]);

  useEffect(() => {
    speechRecognizerRef.current = new SpeechRecognizer();
    missingSpeechRecognizerRef.current = new SpeechRecognizer();
    return () => {
      speechRecognizerRef.current?.stop();
      missingSpeechRecognizerRef.current?.stop();
    };
  }, []);

  if (!isOpen) return null;

  // Toggle main voice recording
  const handleToggleVoice = () => {
    setVoiceError(null);
    if (isRecording) {
      speechRecognizerRef.current?.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      speechRecognizerRef.current?.start(
        (text) => {
          setTranscript(text);
          const detectedOwner = normalizeMemberAlias(text, itemOwner);
          if (detectedOwner !== itemOwner) {
            setItemOwner(detectedOwner);
            setTodoAssignedTo(detectedOwner);
          }
        },
        (err) => {
          console.warn(err);
          setVoiceError(err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        },
        transcript
      );
    }
  };

  // Toggle missing field voice recording
  const handleToggleMissingVoice = () => {
    if (isMissingRecording) {
      missingSpeechRecognizerRef.current?.stop();
      setIsMissingRecording(false);
    } else {
      setIsMissingRecording(true);
      missingSpeechRecognizerRef.current?.start(
        (text) => {
          setMissingFieldAnswer(text);
        },
        (err) => {
          console.warn(err);
          setIsMissingRecording(false);
        },
        () => {
          setIsMissingRecording(false);
        },
        missingFieldAnswer
      );
    }
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'close' | 'wide') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'close') setCloseUpPhoto(dataUrl);
      else if (type === 'wide') setWidePhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Trigger AI Analysis
  const handleAnalyzeInput = async () => {
    if (!transcript.trim() && !closeUpPhoto && !widePhoto) {
      alert('請先輸入說明文字、使用語音或上傳照片！');
      return;
    }

    if (isRecording) {
      speechRecognizerRef.current?.stop();
      setIsRecording(false);
    }

    setIsAnalyzing(true);
    try {
      const data = await analyzeSmartInput({
        transcript,
        currentUser: activeMember,
        closeUpPhoto,
        widePhoto,
        existingInventory: existingItems.map((i) => ({
          id: i.id,
          name: i.name,
          locations: i.locations,
          owner: i.owner,
        })),
      });

      setAnalysisResult(data);

      // Multi-Item Batch Detected
      if (data.itemsList && data.itemsList.length > 1) {
        setBatchItems(data.itemsList);
        setRecordType('item');
        return;
      } else {
        setBatchItems([]);
      }

      // Check Missing Fields for single item
      if (data.missingFields && data.missingFields.length > 0) {
        setShowMissingDialog(true);
        setMissingFieldAnswer(data.missingFields[0].defaultValue || '');
      }

      // Check Conflict
      const match = existingItems.find(
        (it) => it.name.trim().toLowerCase() === (data.itemData?.name || '').trim().toLowerCase()
      );
      if (match && !data.isTodo) {
        data.conflictDetected = true;
        data.existingItemMatch = {
          id: match.id,
          name: match.name,
          currentLocations: match.locations,
          owner: match.owner,
        };
        setShowConflictDialog(true);
      }

      // Apply data to form fields
      if (data.isTodo && data.todoData) {
        setRecordType('todo');
        setTodoTitle(data.todoData.title || transcript || '新待辦事項');
        const resolvedOwner = normalizeMemberAlias(data.todoData.assignedTo || '', activeMember);
        setTodoAssignedTo(resolvedOwner);
        setTodoTargetDate(data.todoData.targetDate || todoTargetDate);
      } else if (data.itemData) {
        setRecordType('item');
        const itemD = data.itemData;
        setItemName(itemD.name || transcript.slice(0, 15) || '新物品');
        setItemCategory((itemD.category as ItemCategory) || 'daily');
        const resolvedOwner = normalizeMemberAlias(itemD.owner || '', activeMember);
        setItemOwner(resolvedOwner);
        
        if (itemD.location) {
          setItemFloor(itemD.location.floor || '1樓');
          setItemRoom(itemD.location.room || '客廳');
          setItemStorageUnit(itemD.location.storageUnit || '白色塑膠4層櫃');
          setItemSubLocation(itemD.location.subLocation || '第1層');
          setItemQuantity(itemD.location.quantity || itemD.totalQuantity || 1);
          setItemUnit(itemD.location.unit || itemD.unit || '件');
        }
        
        if (itemD.expiryDate) setItemExpiryDate(itemD.expiryDate);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setRecordType('item');
      setItemName(transcript.slice(0, 15) || '新登錄物品');
      const resolvedOwner = normalizeMemberAlias(transcript, activeMember);
      setItemOwner(resolvedOwner);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit Missing Field Answer
  const handleMissingFieldSubmit = () => {
    if (isMissingRecording) {
      missingSpeechRecognizerRef.current?.stop();
      setIsMissingRecording(false);
    }
    if (missingFieldAnswer) {
      if (missingFieldAnswer.includes('2樓')) setItemFloor('2樓');
      else if (missingFieldAnswer.includes('3樓')) setItemFloor('3樓');
      else if (missingFieldAnswer.includes('4樓')) setItemFloor('4樓');

      if (missingFieldAnswer.includes('廚房') || missingFieldAnswer.includes('冰箱')) {
        setItemRoom('廚房');
        setItemStorageUnit('雙門大冰箱');
      } else if (missingFieldAnswer.includes('玄關')) {
        setItemRoom('玄關');
        setItemStorageUnit('玄關4層收納架');
      }
    }
    setShowMissingDialog(false);
  };

  // Save All Batch Items at once
  const handleSaveAllBatchItems = () => {
    if (batchItems.length === 0) return;
    
    batchItems.forEach((draft, idx) => {
      const locFullPath = `${draft.location.floor}${draft.location.room}${draft.location.storageUnit}${draft.location.subLocation ? ` ${draft.location.subLocation}` : ''}`;
      const finalItem: InventoryItem = {
        id: `item-${Date.now()}-${idx}`,
        name: draft.name.trim() || '高家新物品',
        category: draft.category || 'daily',
        owner: draft.owner || activeMember,
        recordedBy: activeMember,
        locations: [
          {
            id: `loc-${Date.now()}-${idx}`,
            floor: draft.location.floor || '1樓',
            room: draft.location.room || '客廳',
            storageUnit: draft.location.storageUnit || '白色塑膠4層櫃',
            subLocation: draft.location.subLocation || '第1層',
            quantity: draft.location.quantity || draft.totalQuantity || 1,
            unit: draft.location.unit || draft.unit || '件',
            fullPath: locFullPath,
          },
        ],
        totalQuantity: draft.totalQuantity || 1,
        unit: draft.unit || '件',
        closeUpPhotoUrl: closeUpPhoto || undefined,
        widePhotoUrl: widePhoto || undefined,
        expiryDate: draft.category === 'food' ? draft.expiryDate : undefined,
        warrantyDate: draft.category === 'appliance' ? draft.warrantyDate : undefined,
        isWarrantyValid: Boolean(draft.isWarrantyValid),
        manualUrl: draft.manualUrl || undefined,
        estimatedLifespanWeeks: draft.estimatedLifespanWeeks || 4,
        tags: [draft.location.floor, `${draft.location.floor}${draft.location.room}`, draft.location.storageUnit, draft.owner].filter(Boolean),
        recordedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rawInputTranscript: transcript,
        aiAnalysisSummary: draft.summary,
      };
      onSaveItem(finalItem);
    });

    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    onClose();
  };

  // Final Save Single Item or Todo
  const handleFinalSave = () => {
    if (recordType === 'todo') {
      const finalTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        title: todoTitle.trim() || transcript.trim() || '高家待辦事項',
        assignedTo: todoAssignedTo,
        recordedBy: activeMember,
        targetDate: todoTargetDate,
        isCompleted: false,
        priority: 'high',
        createdAt: new Date().toISOString(),
      };
      onSaveTodo(finalTodo);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onClose();
      return;
    }

    const locFullPath = `${itemFloor}${itemRoom}${itemStorageUnit}${itemSubLocation ? ` ${itemSubLocation}` : ''}`;
    const cleanName = itemName.trim() || (transcript.trim() ? transcript.trim().slice(0, 15) : '高家新物品');
    const tagsList = [itemFloor, `${itemFloor}${itemRoom}`, itemStorageUnit, itemOwner];

    const finalItem: InventoryItem = {
      id: `item-${Date.now()}`,
      name: cleanName,
      category: itemCategory,
      owner: itemOwner,
      recordedBy: activeMember,
      locations: [
        {
          id: `loc-${Date.now()}`,
          floor: itemFloor,
          room: itemRoom,
          storageUnit: itemStorageUnit,
          subLocation: itemSubLocation,
          quantity: itemQuantity,
          unit: itemUnit,
          fullPath: locFullPath,
        },
      ],
      totalQuantity: itemQuantity,
      unit: itemUnit,
      closeUpPhotoUrl: closeUpPhoto || undefined,
      widePhotoUrl: widePhoto || undefined,
      expiryDate: itemCategory === 'food' && itemExpiryDate ? itemExpiryDate : undefined,
      isWarrantyValid: false,
      tags: tagsList,
      recordedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rawInputTranscript: transcript.trim() || undefined,
      aiAnalysisSummary: analysisResult?.itemData?.summary,
    };

    onSaveItem(finalItem);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    onClose();
  };

  const ownerConfig = FAMILY_MEMBERS_CONFIG[itemOwner] || FAMILY_MEMBERS_CONFIG['瑋'];
  const allMembers: FamilyMember[] = ['瑋', '珍', '朋', '淨', '炘', '豐', '柔'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-[#f2f2f7] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-300 flex flex-col max-h-[92vh] my-auto">
        {/* iOS Header */}
        <div className="px-5 py-3.5 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">AI 智能登錄速填</h3>
              <p className="text-[11px] text-gray-500">支援語音口述、多照辨識、多物品同時解析</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Top Segmented Controls: Record Type (Item / Todo) */}
          <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
            <div className="grid grid-cols-2 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRecordType('item')}
                className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  recordType === 'item' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>📦 登錄物品庫存</span>
              </button>
              <button
                type="button"
                onClick={() => setRecordType('todo')}
                className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  recordType === 'todo' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>📝 建立家庭待辦</span>
              </button>
            </div>
          </div>

          {/* AI Smart Input Box */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            {/* Input Mode Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>輸入方式</span>
              </span>
              <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg text-xs font-semibold text-gray-600">
                <button
                  type="button"
                  onClick={() => setSmartMode('voice')}
                  className={`px-2.5 py-1 rounded-md flex items-center space-x-1 ${smartMode === 'voice' ? 'bg-white text-blue-600 shadow-2xs font-bold' : ''}`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>語音</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSmartMode('photo')}
                  className={`px-2.5 py-1 rounded-md flex items-center space-x-1 ${smartMode === 'photo' ? 'bg-white text-blue-600 shadow-2xs font-bold' : ''}`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>拍照</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSmartMode('text')}
                  className={`px-2.5 py-1 rounded-md flex items-center space-x-1 ${smartMode === 'text' ? 'bg-white text-blue-600 shadow-2xs font-bold' : ''}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>文字</span>
                </button>
              </div>
            </div>

            {/* Error banner if voice blocked */}
            {voiceError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center space-x-1.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{voiceError}</span>
              </div>
            )}

            {/* 1. Voice Mode: Large interactive recording center */}
            {smartMode === 'voice' && (
              <div className="p-5 bg-gradient-to-b from-blue-50/60 to-indigo-50/40 rounded-2xl border border-blue-100 text-center space-y-4">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording
                        ? 'bg-rose-500 text-white shadow-xl scale-110 ring-8 ring-rose-400/40 animate-pulse'
                        : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8 animate-bounce" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>

                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-800">
                      {isRecording ? '🎙️ 正在聆聽口述中... (說完再次點擊停止)' : '點擊麥克風開始說話'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      支援多物品口述，例如：「老媽買了2罐鮮奶放冰箱，還有3盒普拿疼放客廳」
                    </p>
                  </div>
                </div>

                {/* Live Transcript Preview */}
                <div className="relative">
                  <textarea
                    rows={2}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="口述語音內容將即時顯示於此，亦可在此手動微調..."
                    className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* 2. Photo Mode: Dual photo uploads with attached voice description */}
            {smartMode === 'photo' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">1. 物品照片 (清楚特寫/多物品)</label>
                    <div className="relative aspect-4/3 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer">
                      {closeUpPhoto ? (
                        <>
                          <img src={closeUpPhoto} alt="近照" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setCloseUpPhoto(null)}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2 text-center">
                          <Upload className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-[11px] font-semibold text-gray-600">拍照 / 上傳物品圖</span>
                          <span className="text-[9px] text-gray-400 mt-0.5">AI 可數出數量</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'close')}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">2. 環境遠照 (存放位置)</label>
                    <div className="relative aspect-4/3 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer">
                      {widePhoto ? (
                        <>
                          <img src={widePhoto} alt="遠照" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setWidePhoto(null)}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2 text-center">
                          <Upload className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-[11px] font-semibold text-gray-600">拍照 / 上傳位置圖</span>
                          <span className="text-[9px] text-gray-400 mt-0.5">櫃位環境遠景</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'wide')}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photo Description with Voice */}
                <div className="relative">
                  <input
                    type="text"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="搭配文字或語音說明照片（例如：在1樓廚房雙門冰箱拍的鮮奶與布丁）..."
                    className="w-full py-2 pl-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* 3. Text Mode */}
            {smartMode === 'text' && (
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    id="input-register-transcript"
                    rows={2}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="例如：老媽買了2罐好市多鮮奶放1樓冰箱，還有3盒普拿疼放客廳櫃子，以及5包衛生紙放2樓儲藏室..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400'
                        : 'bg-gray-200 hover:bg-blue-100 text-gray-700 hover:text-blue-700'
                    }`}
                    title="使用語音快速輸入"
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Trigger AI Button */}
            <button
              id="btn-trigger-analyze"
              type="button"
              disabled={isAnalyzing || (!transcript.trim() && !closeUpPhoto && !widePhoto)}
              onClick={handleAnalyzeInput}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md hover:shadow-lg active:scale-98 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI 正在分析物品、數量與存放位置...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>開始 AI 智能分析與數量辨識</span>
                </>
              )}
            </button>
          </div>

          {/* Missing Info Dialog */}
          {showMissingDialog && analysisResult?.missingFields && (
            <div className="bg-amber-50 p-3.5 rounded-2xl border-2 border-amber-300 space-y-2.5 shadow-xs animate-fadeIn">
              <div className="flex items-start space-x-2 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-xs font-bold">請補充存放位置或相關資訊</h4>
                  </div>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {analysisResult.missingFields[0].question}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={missingFieldAnswer}
                    onChange={(e) => setMissingFieldAnswer(e.target.value)}
                    placeholder="例如：1樓客廳白色塑膠4層櫃第2層..."
                    className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 pr-9"
                  />
                  <button
                    type="button"
                    onClick={handleToggleMissingVoice}
                    title="使用語音辨識補充訊息"
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                      isMissingRecording
                        ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                    }`}
                  >
                    {isMissingRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleMissingFieldSubmit}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
                >
                  確認
                </button>
              </div>
            </div>
          )}

          {/* Conflict Dialog */}
          {showConflictDialog && analysisResult?.existingItemMatch && (
            <div className="bg-blue-50 p-3.5 rounded-2xl border-2 border-blue-300 space-y-2.5 animate-fadeIn">
              <div className="flex items-start space-x-2 text-blue-900">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">在庫存中發現已有同名物品！</h4>
                </div>
              </div>
            </div>
          )}

          {/* BATCH ITEMS MULTI-REVIEW PANEL */}
          {recordType === 'item' && batchItems.length > 1 ? (
            <div className="bg-white p-4 rounded-2xl border-2 border-indigo-400 shadow-md space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-1.5">
                  <span className="p-1 rounded-md bg-indigo-100 text-indigo-700">
                    <ListPlus className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-indigo-950">
                    AI 批量辨識出 {batchItems.length} 項物品與數量
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBatchItems([])}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  切換單項編輯
                </button>
              </div>

              {/* Items Cards List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {batchItems.map((itemDraft, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 hover:bg-indigo-50/40 rounded-xl border border-gray-200 space-y-2 transition-all relative"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const updated = batchItems.filter((_, i) => i !== idx);
                        setBatchItems(updated);
                        if (updated.length === 1) {
                          setItemName(updated[0].name);
                          setItemQuantity(updated[0].totalQuantity);
                          setItemUnit(updated[0].unit);
                          setItemCategory(updated[0].category);
                          setItemOwner(updated[0].owner);
                        }
                      }}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="刪除此項"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center space-x-2 pr-6">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={itemDraft.name}
                        onChange={(e) => {
                          const updated = [...batchItems];
                          updated[idx].name = e.target.value;
                          setBatchItems(updated);
                        }}
                        className="flex-1 px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                        placeholder="物品名稱"
                      />
                      <div className="flex items-center space-x-1 shrink-0">
                        <input
                          type="number"
                          min={1}
                          value={itemDraft.totalQuantity}
                          onChange={(e) => {
                            const updated = [...batchItems];
                            const qty = Math.max(1, Number(e.target.value));
                            updated[idx].totalQuantity = qty;
                            updated[idx].location.quantity = qty;
                            setBatchItems(updated);
                          }}
                          className="w-12 px-1.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-center"
                        />
                        <input
                          type="text"
                          value={itemDraft.unit}
                          onChange={(e) => {
                            const updated = [...batchItems];
                            updated[idx].unit = e.target.value;
                            updated[idx].location.unit = e.target.value;
                            setBatchItems(updated);
                          }}
                          className="w-10 px-1 py-1 bg-white border border-gray-300 rounded-lg text-xs text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center space-x-1 bg-white p-1.5 rounded-lg border border-gray-200">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate text-gray-700 font-medium">
                          {itemDraft.location.floor} {itemDraft.location.room} {itemDraft.location.storageUnit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-white p-1 rounded-lg border border-gray-200">
                        <span className="text-gray-500 pl-1">歸屬:</span>
                        <div className="flex items-center space-x-0.5">
                          {allMembers.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                const updated = [...batchItems];
                                updated[idx].owner = m;
                                setBatchItems(updated);
                              }}
                              className={`w-5 h-5 rounded-md text-[10px] font-bold ${
                                itemDraft.owner === m
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setBatchItems([
                    ...batchItems,
                    {
                      name: `新物品 ${batchItems.length + 1}`,
                      category: 'daily',
                      owner: activeMember,
                      location: {
                        floor: '1樓',
                        room: '客廳',
                        storageUnit: '白色塑膠4層櫃',
                        subLocation: '第1層',
                        quantity: 1,
                        unit: '件',
                      },
                      totalQuantity: 1,
                      unit: '件',
                      tags: ['1樓', '1樓客廳', activeMember],
                      summary: '手動新增之物品',
                    }
                  ]);
                }}
                className="w-full py-1.5 border border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-bold flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增一項物品至批量清單</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAllBatchItems}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center space-x-2 active:scale-98 transition-all"
              >
                <Check className="w-5 h-5" />
                <span>一鍵批量登錄全部 ({batchItems.length} 件物品)</span>
              </button>
            </div>
          ) : recordType === 'item' ? (
            /* Single Item Form */
            <div className={`bg-white p-4 rounded-2xl border-2 ${ownerConfig.cardBorder} shadow-sm space-y-3.5`}>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-700 flex items-center space-x-1">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>物品詳細資訊</span>
                </span>
                <span className="text-[11px] text-gray-400">
                  操作人: {activeMember} ({FAMILY_MEMBERS_CONFIG[activeMember]?.relation})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">物品名稱 *</label>
                  <input
                    id="input-item-name"
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="例如：鮮乳、普拿疼、象印電子鍋"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">數量 / 單位</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-center focus:bg-white focus:outline-hidden"
                    />
                    <input
                      type="text"
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                      placeholder="罐/盒/包"
                      className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-center focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 block">物品歸屬人 *</label>
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {allMembers.map((m) => {
                    const cfg = FAMILY_MEMBERS_CONFIG[m];
                    const isSelected = itemOwner === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setItemOwner(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shrink-0 ${
                          isSelected
                            ? `${cfg.avatarBg} text-white shadow-xs ring-2 ${cfg.ringColor} ring-offset-1`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span>{m}</span>
                        <span className="text-[10px] opacity-80">({cfg.relation})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <label className="text-[11px] font-bold text-blue-950 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>存放空間與收納櫃位 *</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={itemFloor}
                    onChange={(e) => setItemFloor(e.target.value)}
                    className="p-2 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-gray-800"
                  >
                    <option value="1樓">1樓 (客廳/廚房/玄關/車庫)</option>
                    <option value="2樓">2樓 (主臥室/儲藏室/衛浴)</option>
                    <option value="3樓">3樓 (次臥室/洗衣陽台)</option>
                    <option value="4樓">4樓 (頂樓水塔雜物區)</option>
                  </select>
                  <input
                    type="text"
                    value={itemRoom}
                    onChange={(e) => setItemRoom(e.target.value)}
                    placeholder="空間 (如: 廚房、客廳)"
                    className="p-2 bg-white border border-blue-200 rounded-lg text-xs text-gray-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={itemStorageUnit}
                    onChange={(e) => setItemStorageUnit(e.target.value)}
                    placeholder="櫃位 (如: 雙門大冰箱、白色4層櫃)"
                    className="p-2 bg-white border border-blue-200 rounded-lg text-xs text-gray-800"
                  />
                  <input
                    type="text"
                    value={itemSubLocation}
                    onChange={(e) => setItemSubLocation(e.target.value)}
                    placeholder="細分層 (如: 第1層、冷凍庫)"
                    className="p-2 bg-white border border-blue-200 rounded-lg text-xs text-gray-800"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Todo Form */
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">待辦任務標題 *</label>
                <input
                  type="text"
                  required
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  placeholder="例如：修理3樓陽台水龍頭、去全聯買牛奶..."
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">指派家人</label>
                  <select
                    value={todoAssignedTo}
                    onChange={(e) => setTodoAssignedTo(e.target.value as FamilyMember)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    {allMembers.map((m) => (
                      <option key={m} value={m}>
                        {m} ({FAMILY_MEMBERS_CONFIG[m]?.relation})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">預計完成日</label>
                  <input
                    type="date"
                    value={todoTargetDate}
                    onChange={(e) => setTodoTargetDate(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">備註說明 (選填)</label>
                <textarea
                  rows={2}
                  value={todoNote}
                  onChange={(e) => setTodoNote(e.target.value)}
                  placeholder="補充詳細資訊..."
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (When not batch items) */}
        {batchItems.length <= 1 && (
          <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
            >
              取消
            </button>

            <button
              id="btn-save-database"
              type="button"
              onClick={handleFinalSave}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{recordType === 'item' ? '建立並存入高家物品清單' : '建立並存入家庭待辦事項'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

