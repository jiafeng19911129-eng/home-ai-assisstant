import React, { useState, useRef, useEffect } from 'react';
import { 
  InventoryItem, 
  TodoItem, 
  FamilyMember, 
  FAMILY_MEMBERS_CONFIG, 
  CATEGORY_LABELS, 
  ItemCategory,
  GeminiAnalysisResult,
  normalizeMemberAlias
} from '../types';
import { KAO_LOCATION_STRUCTURE } from '../data/initialData';
import { SpeechRecognizer } from '../utils/speechRecognition';
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
  Layers, 
  ShieldCheck, 
  RefreshCw,
  PlusCircle,
  MoveRight,
  MinusCircle,
  HelpCircle,
  Package,
  CheckSquare,
  ShoppingBag,
  ExternalLink,
  Receipt,
  Link as LinkIcon
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
  // Input Modes: 'smart' (AI analysis) | 'manual' (Direct Entry)
  const [smartMode, setSmartMode] = useState<'photo' | 'voice' | 'text'>('text');
  
  // Record Type: 'item' (物品庫存) | 'todo' (待辦事項)
  const [recordType, setRecordType] = useState<'item' | 'todo'>('item');

  // Input states for AI
  const [transcript, setTranscript] = useState('');
  const [closeUpPhoto, setCloseUpPhoto] = useState<string | null>(null);
  const [widePhoto, setWidePhoto] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null);

  // Missing Info Dialog state & Speech Recognition
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [missingFieldAnswer, setMissingFieldAnswer] = useState('');
  const [isMissingRecording, setIsMissingRecording] = useState(false);

  // Conflict / Existing Item Dialog state
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictChoice, setConflictChoice] = useState<'new_purchase' | 'move_item' | 'consume'>('new_purchase');

  // Active Draft Item State (Always ready to edit and save)
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
  const [itemWarrantyDate, setItemWarrantyDate] = useState('');
  const [itemIsWarrantyValid, setItemIsWarrantyValid] = useState(false);
  const [itemManualUrl, setItemManualUrl] = useState('');
  const [itemEstimatedLifespanWeeks, setItemEstimatedLifespanWeeks] = useState(4);

  // Purchase Source, Link & Proof (購買來源、連結與證明)
  const [itemPurchaseSource, setItemPurchaseSource] = useState('');
  const [itemPurchaseUrl, setItemPurchaseUrl] = useState('');
  const [itemPurchaseProofUrl, setItemPurchaseProofUrl] = useState<string | null>(null);

  // Active Draft Todo State
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

  // Common purchase source presets
  const PURCHASE_SOURCES = [
    '好市多 Costco',
    '全聯福利中心',
    '蝦皮購物',
    'Momo 購物',
    '家樂福',
    '屈臣氏 / 康是美',
    '大潭實體門市',
    '海外代購',
    '親友贈送'
  ];

  // Reset or initialize state when opening modal
  useEffect(() => {
    if (isOpen) {
      setItemOwner(activeMember);
      setTodoAssignedTo(activeMember);
      setTranscript('');
      setCloseUpPhoto(null);
      setWidePhoto(null);
      setAnalysisResult(null);
      setShowMissingDialog(false);
      setShowConflictDialog(false);
      setItemName('');
      setItemCategory('daily');
      setItemFloor('1樓');
      setItemRoom('客廳');
      setItemStorageUnit('白色塑膠4層櫃');
      setItemSubLocation('第1層');
      setItemQuantity(1);
      setItemUnit('件');
      setItemExpiryDate('');
      setItemWarrantyDate('');
      setItemIsWarrantyValid(false);
      setItemManualUrl('');
      setItemEstimatedLifespanWeeks(4);
      setItemPurchaseSource('');
      setItemPurchaseUrl('');
      setItemPurchaseProofUrl(null);
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
    if (isRecording) {
      speechRecognizerRef.current?.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      speechRecognizerRef.current?.start(
        (text) => {
          setTranscript(text);
          // Auto resolve alias for owner if mentioned in speech
          const detectedOwner = normalizeMemberAlias(text, itemOwner);
          if (detectedOwner !== itemOwner) {
            setItemOwner(detectedOwner);
            setTodoAssignedTo(detectedOwner);
          }
        },
        (err) => {
          console.warn(err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
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
        }
      );
    }
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'close' | 'wide' | 'proof') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'close') setCloseUpPhoto(dataUrl);
      else if (type === 'wide') setWidePhoto(dataUrl);
      else if (type === 'proof') setItemPurchaseProofUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Trigger AI Analysis
  const handleAnalyzeInput = async () => {
    if (!transcript.trim() && !closeUpPhoto && !widePhoto) {
      alert('請先輸入說明文字、語音或上傳照片！');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          currentUser: activeMember,
          closeUpPhotoBase64: closeUpPhoto,
          widePhotoBase64: widePhoto,
          existingInventory: existingItems.map((i) => ({
            id: i.id,
            name: i.name,
            locations: i.locations,
            owner: i.owner,
          })),
        }),
      });

      const data: GeminiAnalysisResult = await response.json();
      setAnalysisResult(data);

      // Check Missing Fields
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
        setTodoLocationTag(data.todoData.locationTag || '');
        setTodoNote(data.todoData.note || transcript);
      } else if (data.itemData) {
        setRecordType('item');
        const itemD = data.itemData;
        setItemName(itemD.name || transcript.slice(0, 15) || '新物品');
        setItemCategory((itemD.category as ItemCategory) || 'daily');
        const resolvedOwner = normalizeMemberAlias(itemD.owner || '', activeMember);
        setItemOwner(resolvedOwner);
        
        if (itemD.purchaseSource) {
          setItemPurchaseSource(itemD.purchaseSource);
        }
        if (itemD.purchaseUrl) {
          setItemPurchaseUrl(itemD.purchaseUrl);
        }
        if (itemD.purchaseProofUrl) {
          setItemPurchaseProofUrl(itemD.purchaseProofUrl);
        }

        if (itemD.location) {
          setItemFloor(itemD.location.floor || '1樓');
          setItemRoom(itemD.location.room || '客廳');
          setItemStorageUnit(itemD.location.storageUnit || '白色塑膠4層櫃');
          setItemSubLocation(itemD.location.subLocation || '第1層');
          setItemQuantity(itemD.location.quantity || itemD.totalQuantity || 1);
          setItemUnit(itemD.location.unit || itemD.unit || '件');
        }
        
        if (itemD.expiryDate) setItemExpiryDate(itemD.expiryDate);
        if (itemD.warrantyDate) setItemWarrantyDate(itemD.warrantyDate);
        setItemIsWarrantyValid(Boolean(itemD.isWarrantyValid));
        if (itemD.manualUrl) setItemManualUrl(itemD.manualUrl);
        if (itemD.estimatedLifespanWeeks) setItemEstimatedLifespanWeeks(itemD.estimatedLifespanWeeks);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback: parse basic info into fields
      setRecordType('item');
      setItemName(transcript.slice(0, 15) || '新登錄物品');
      const resolvedOwner = normalizeMemberAlias(transcript, activeMember);
      setItemOwner(resolvedOwner);
      alert('AI 分析連線超時，已為您自動載入輸入文字，請確認下方欄位後直接存檔！');
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

  // Final Save Item or Todo
  const handleFinalSave = () => {
    if (recordType === 'todo') {
      const finalTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        title: todoTitle.trim() || transcript.trim() || '高家待辦事項',
        assignedTo: todoAssignedTo,
        recordedBy: activeMember,
        targetDate: todoTargetDate,
        locationTag: todoLocationTag.trim() || undefined,
        note: todoNote.trim() || transcript.trim() || undefined,
        isCompleted: false,
        priority: 'high',
        createdAt: new Date().toISOString(),
      };
      onSaveTodo(finalTodo);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onClose();
      return;
    }

    // Saving Inventory Item
    const locFullPath = `${itemFloor}${itemRoom}${itemStorageUnit}${itemSubLocation ? ` ${itemSubLocation}` : ''}`;
    const cleanName = itemName.trim() || (transcript.trim() ? transcript.trim().slice(0, 15) : '高家新物品');

    // Handle existing conflict
    if (analysisResult?.existingItemMatch) {
      const existing = existingItems.find((i) => i.id === analysisResult.existingItemMatch?.id);
      if (existing) {
        if (conflictChoice === 'move_item') {
          existing.locations = [
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
          ];
          existing.updatedAt = new Date().toISOString();
          onSaveItem(existing);
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          onClose();
          return;
        } else if (conflictChoice === 'consume') {
          existing.totalQuantity = Math.max(0, existing.totalQuantity - itemQuantity);
          existing.updatedAt = new Date().toISOString();
          onSaveItem(existing);
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
          onClose();
          return;
        }
      }
    }

    const tagsList = [itemFloor, `${itemFloor}${itemRoom}`, itemStorageUnit, itemOwner];
    if (itemPurchaseSource) {
      tagsList.push(itemPurchaseSource.split(' ')[0]);
    }

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
      purchaseSource: itemPurchaseSource.trim() || undefined,
      purchaseUrl: itemPurchaseUrl.trim() || undefined,
      purchaseProofUrl: itemPurchaseProofUrl || undefined,
      closeUpPhotoUrl: closeUpPhoto || undefined,
      widePhotoUrl: widePhoto || undefined,
      expiryDate: itemCategory === 'food' && itemExpiryDate ? itemExpiryDate : undefined,
      warrantyDate: itemCategory === 'appliance' && itemWarrantyDate ? itemWarrantyDate : undefined,
      isWarrantyValid: itemCategory === 'appliance' ? itemIsWarrantyValid : false,
      manualUrl: itemManualUrl.trim() || undefined,
      estimatedLifespanWeeks: (itemCategory === 'medical' || itemCategory === 'daily') ? itemEstimatedLifespanWeeks : undefined,
      tags: tagsList,
      recordedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rawInputTranscript: transcript || undefined,
      aiAnalysisSummary: analysisResult?.itemData?.summary || `${itemOwner} 於 ${locFullPath} 存放 ${cleanName}${itemPurchaseSource ? `（購自 ${itemPurchaseSource}）` : ''}`,
    };

    onSaveItem(finalItem);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    onClose();
  };

  const ownerConfig = FAMILY_MEMBERS_CONFIG[itemOwner] || FAMILY_MEMBERS_CONFIG[activeMember];
  const members: FamilyMember[] = ['瑋', '珍', '朋', '淨', '炘', '豐', '柔'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#f2f2f7] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-200">
        {/* iOS Modal Header */}
        <div className="px-5 py-3.5 bg-white border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">智能家庭登錄中心</h2>
              <p className="text-[11px] text-gray-500">
                操作者：<span className="font-semibold text-blue-600">{activeMember}（{FAMILY_MEMBERS_CONFIG[activeMember]?.relation}）</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Target Type Selector: 物品庫存 (Item) vs 待辦事項 (Todo) */}
          <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#e5e5ea] rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setRecordType('item')}
                className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  recordType === 'item' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>📦 登錄物品庫存</span>
              </button>
              <button
                type="button"
                onClick={() => setRecordType('todo')}
                className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  recordType === 'todo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>📝 建立家庭待辦</span>
              </button>
            </div>
          </div>

          {/* AI Smart Input Box (Speech / Text / Dual Photos) */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>AI 語音/文字/雙照智能速填</span>
              </span>
              <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold text-gray-600">
                <button
                  type="button"
                  onClick={() => setSmartMode('text')}
                  className={`px-2 py-0.5 rounded-md ${smartMode === 'text' ? 'bg-white text-blue-600 shadow-2xs' : ''}`}
                >
                  文字
                </button>
                <button
                  type="button"
                  onClick={() => setSmartMode('voice')}
                  className={`px-2 py-0.5 rounded-md ${smartMode === 'voice' ? 'bg-white text-blue-600 shadow-2xs' : ''}`}
                >
                  語音
                </button>
                <button
                  type="button"
                  onClick={() => setSmartMode('photo')}
                  className={`px-2 py-0.5 rounded-md ${smartMode === 'photo' ? 'bg-white text-blue-600 shadow-2xs' : ''}`}
                >
                  拍照
                </button>
              </div>
            </div>

            {/* Photo Mode */}
            {smartMode === 'photo' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600">1. 物品近照 (清楚特寫)</label>
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
                        <span className="text-[11px] font-semibold text-gray-600">拍攝/上傳近照</span>
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
                        <span className="text-[11px] font-semibold text-gray-600">拍攝/上傳遠照</span>
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
            )}

            {/* Voice & Text Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <textarea
                  id="input-register-transcript"
                  rows={2}
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    if (!itemName) setItemName(e.target.value.slice(0, 15));
                    const detected = normalizeMemberAlias(e.target.value, itemOwner);
                    if (detected !== itemOwner) {
                      setItemOwner(detected);
                    }
                  }}
                  placeholder="例如：老爸在好市多買的鮮奶放在1樓廚房冰箱冷藏中層；或是：美珍買了普拿疼放1樓客廳白色4層櫃..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse shadow-xs ring-2 ring-red-400'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isRecording ? '正在聆聽...' : '語音輸入'}</span>
                </button>

                <button
                  id="btn-trigger-analyze"
                  type="button"
                  disabled={isAnalyzing || (!transcript.trim() && !closeUpPhoto && !widePhoto)}
                  onClick={handleAnalyzeInput}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs hover:shadow-md active:scale-98 transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>AI 解析中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>開始 AI 分析自動填表</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Speech Chips with Aliases */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <span className="text-[10px] text-gray-400 shrink-0">稱謂範例:</span>
                {[
                  '老爸在好市多買的鮮奶放1樓冰箱冷藏中層',
                  '老媽在全聯買的普拿疼放1樓客廳白色4層櫃第2層',
                  '哥哥在蝦皮買的五金工具放車庫鐵架',
                  '姊姊在Momo買的吹風機放主臥大衣櫃',
                  '語炘買的象印電子鍋放廚房電器架第2層',
                  '家豐買的日用品放儲藏室',
                  '彩柔買的面膜放2樓衛浴'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTranscript(chip);
                      setItemName(chip.slice(0, 15));
                      const resolved = normalizeMemberAlias(chip, itemOwner);
                      setItemOwner(resolved);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-[10px] text-gray-600 shrink-0 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Missing Info Prompt Dialog with Voice Input */}
          {showMissingDialog && analysisResult?.missingFields && (
            <div className="bg-amber-50 p-3.5 rounded-2xl border-2 border-amber-300 space-y-2.5 shadow-xs">
              <div className="flex items-start space-x-2 text-amber-900">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-xs font-bold">請補充存放位置或相關資訊</h4>
                    <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-md font-semibold">可語音補充</span>
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
                    className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 pr-9"
                  />
                  <button
                    type="button"
                    onClick={handleToggleMissingVoice}
                    title="使用語音辨識補充訊息"
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                      isMissingRecording
                        ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-400'
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

              {isMissingRecording && (
                <p className="text-[10px] text-red-600 font-bold flex items-center space-x-1 animate-pulse">
                  <span>🎙️ 正在聆聽補充語音，請直接說出存放地點或說明...</span>
                </p>
              )}
            </div>
          )}

          {/* Conflict Dialog */}
          {showConflictDialog && analysisResult?.existingItemMatch && (
            <div className="bg-blue-50 p-3.5 rounded-2xl border-2 border-blue-300 space-y-2.5">
              <div className="flex items-start space-x-2 text-blue-900">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">在庫存中發現已有同名物品！</h4>
                  <p className="text-xs text-blue-800 mt-0.5">
                    物品「{analysisResult.existingItemMatch.name}」已存在於高家。請選擇：
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setConflictChoice('new_purchase')}
                  className={`p-2 rounded-xl border text-center transition-all text-xs font-bold flex flex-col items-center justify-center space-y-1 ${
                    conflictChoice === 'new_purchase'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>新添購入庫</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConflictChoice('move_item')}
                  className={`p-2 rounded-xl border text-center transition-all text-xs font-bold flex flex-col items-center justify-center space-y-1 ${
                    conflictChoice === 'move_item'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <MoveRight className="w-4 h-4" />
                  <span>移動原位置</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConflictChoice('consume')}
                  className={`p-2 rounded-xl border text-center transition-all text-xs font-bold flex flex-col items-center justify-center space-y-1 ${
                    conflictChoice === 'consume'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>消耗/拿取</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Section: Item Form */}
          {recordType === 'item' ? (
            <div className={`bg-white p-4 rounded-2xl border-2 ${ownerConfig.cardBorder} shadow-sm space-y-3.5`}>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-700 flex items-center space-x-1">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>物品詳細資訊 (即時編輯存檔)</span>
                </span>
                <span className="text-[11px] text-gray-400">
                  登錄者: {activeMember} ({FAMILY_MEMBERS_CONFIG[activeMember]?.relation})
                </span>
              </div>

              {/* Item Name & Quantity */}
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
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                      className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-center focus:bg-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                      placeholder="件/瓶/包"
                      className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-center focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Owner (with explicit alias display) & Category */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">歸屬人 (自動對應稱謂)</label>
                  <select
                    id="select-item-owner"
                    value={itemOwner}
                    onChange={(e) => setItemOwner(e.target.value as FamilyMember)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none"
                  >
                    {members.map((m) => (
                      <option key={m} value={m}>
                        {m}（{FAMILY_MEMBERS_CONFIG[m]?.relation}）
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">物品分類</label>
                  <select
                    id="select-item-category"
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as ItemCategory)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none"
                  >
                    {(Object.keys(CATEGORY_LABELS) as ItemCategory[])
                      .filter((c) => c !== 'todo')
                      .map((catKey) => (
                        <option key={catKey} value={catKey}>
                          {CATEGORY_LABELS[catKey].icon} {CATEGORY_LABELS[catKey].label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Purchase Source, Link & Proof Section (購買來源與證明) */}
              <div className="bg-[#fcfcff] p-3 rounded-xl border border-blue-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-blue-900 flex items-center space-x-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                    <span>購買來源與證明 / 電商連結</span>
                  </label>
                  <span className="text-[10px] text-blue-500 font-medium">選填 (自動加上標籤)</span>
                </div>

                {/* Purchase Source Input & Quick Chips */}
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={itemPurchaseSource}
                      onChange={(e) => setItemPurchaseSource(e.target.value)}
                      placeholder="購買來源（例如：好市多 Costco、全聯、蝦皮、大潭）"
                      className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* Preset Chips */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {PURCHASE_SOURCES.map((source) => (
                      <button
                        key={source}
                        type="button"
                        onClick={() => setItemPurchaseSource(source)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 transition-colors ${
                          itemPurchaseSource === source
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {source}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purchase URL & Proof Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 flex items-center space-x-1 mb-1">
                      <LinkIcon className="w-3 h-3 text-gray-400" />
                      <span>購買連結 / 商品網址</span>
                    </label>
                    <input
                      type="url"
                      value={itemPurchaseUrl}
                      onChange={(e) => setItemPurchaseUrl(e.target.value)}
                      placeholder="https://shopee.tw/... 或 商品頁"
                      className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 flex items-center space-x-1 mb-1">
                      <Receipt className="w-3 h-3 text-gray-400" />
                      <span>購買證明 / 發票截圖</span>
                    </label>
                    <div className="flex items-center space-x-1.5">
                      {itemPurchaseProofUrl ? (
                        <div className="flex items-center space-x-1.5 bg-white border border-green-300 px-2 py-1 rounded-lg flex-1">
                          <img src={itemPurchaseProofUrl} alt="證明" className="w-5 h-5 rounded object-cover" />
                          <span className="text-[10px] text-green-700 font-bold truncate flex-1">已附加購買證明</span>
                          <button
                            type="button"
                            onClick={() => setItemPurchaseProofUrl(null)}
                            className="text-gray-400 hover:text-red-500 text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full p-1.5 bg-white border border-dashed border-gray-300 hover:border-blue-400 rounded-lg flex items-center justify-center space-x-1 cursor-pointer text-gray-500 hover:text-blue-600 transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span className="text-[11px]">上傳證明/發票圖檔</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'proof')}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Hierarchy Selectors */}
              <div className="bg-[#f9f9fb] p-3 rounded-xl border border-gray-200 space-y-2">
                <label className="text-[11px] font-bold text-gray-700 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>高家存放地點層級</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                  {/* Floor */}
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-0.5">樓層</span>
                    <select
                      value={itemFloor}
                      onChange={(e) => setItemFloor(e.target.value)}
                      className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="1樓">1樓</option>
                      <option value="2樓">2樓</option>
                      <option value="3樓">3樓</option>
                      <option value="4樓">4樓/頂樓</option>
                      <option value="戶外車庫">戶外車庫</option>
                    </select>
                  </div>

                  {/* Room */}
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-0.5">空間/房間</span>
                    <input
                      type="text"
                      value={itemRoom}
                      onChange={(e) => setItemRoom(e.target.value)}
                      placeholder="客廳/廚房"
                      className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  {/* Storage Unit */}
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-0.5">櫃位/家具</span>
                    <input
                      type="text"
                      value={itemStorageUnit}
                      onChange={(e) => setItemStorageUnit(e.target.value)}
                      placeholder="白色塑膠4層櫃"
                      className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  {/* SubLocation */}
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-0.5">層級/抽屜</span>
                    <input
                      type="text"
                      value={itemSubLocation}
                      onChange={(e) => setItemSubLocation(e.target.value)}
                      placeholder="第1層/冷藏中層"
                      className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Category-specific inputs */}
              {itemCategory === 'food' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">食品到期日 (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={itemExpiryDate}
                    onChange={(e) => setItemExpiryDate(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              )}

              {itemCategory === 'appliance' && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block">保固狀態 (默認過期)</label>
                    <select
                      value={itemIsWarrantyValid ? 'valid' : 'expired'}
                      onChange={(e) => setItemIsWarrantyValid(e.target.value === 'valid')}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    >
                      <option value="expired">已過期 (默認)</option>
                      <option value="valid">保固中 (有效)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block">說明書/Google Drive連結</label>
                    <input
                      type="text"
                      value={itemManualUrl}
                      onChange={(e) => setItemManualUrl(e.target.value)}
                      placeholder="說明書雲端連結"
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {(itemCategory === 'medical' || itemCategory === 'daily') && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block">
                    耗材預估可用時長 (低於2週將主動提醒)
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="number"
                      step="0.5"
                      min={0.5}
                      value={itemEstimatedLifespanWeeks}
                      onChange={(e) => setItemEstimatedLifespanWeeks(Number(e.target.value))}
                      className="w-20 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-center"
                    />
                    <span className="text-xs text-gray-600">週用量</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Form Section: Todo Form */
            <div className="bg-white p-4 rounded-2xl border-2 border-indigo-400 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <span>家庭待辦事項 (3天內提醒)</span>
                </span>
                <span className="text-[11px] text-gray-400">
                  登錄者: {activeMember} ({FAMILY_MEMBERS_CONFIG[activeMember]?.relation})
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">待辦標題 *</label>
                <input
                  type="text"
                  required
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  placeholder="例如：拿蔬菜去大潭、去全聯買鮮奶"
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">執行人 (稱謂對應)</label>
                  <select
                    value={todoAssignedTo}
                    onChange={(e) => setTodoAssignedTo(e.target.value as FamilyMember)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
                  >
                    {members.map((m) => (
                      <option key={m} value={m}>
                        {m}（{FAMILY_MEMBERS_CONFIG[m]?.relation}）
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">目標提醒日期</label>
                  <input
                    type="date"
                    value={todoTargetDate}
                    onChange={(e) => setTodoTargetDate(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">地點標籤 (選填)</label>
                <input
                  type="text"
                  value={todoLocationTag}
                  onChange={(e) => setTodoLocationTag(e.target.value)}
                  placeholder="例如：大潭、全聯、1樓廚房"
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
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

        {/* Modal Footer */}
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
      </div>
    </div>
  );
};
