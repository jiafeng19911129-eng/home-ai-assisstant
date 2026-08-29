import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { getDb, getFirebaseStorage, isFirebaseConfigured } from './firebase';
import { InventoryItem, TodoItem } from '../types';

const ITEMS_COLLECTION = 'kao_inventory_items';
const TODOS_COLLECTION = 'kao_todos';

// 1. Subscribe to Items in Real-Time
export function subscribeItemsRealtime(
  onUpdate: (items: InventoryItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  const db = getDb();
  if (!db) return null;

  try {
    const q = query(collection(db, ITEMS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: InventoryItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as InventoryItem);
        });
        onUpdate(items);
      },
      (error) => {
        console.warn('Firestore items real-time subscription error:', error);
        onError?.(error);
      }
    );
  } catch (e: any) {
    console.warn('Failed to setup items listener:', e);
    onError?.(e);
    return null;
  }
}

// 2. Subscribe to Todos in Real-Time
export function subscribeTodosRealtime(
  onUpdate: (todos: TodoItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  const db = getDb();
  if (!db) return null;

  try {
    const q = query(collection(db, TODOS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const todos: TodoItem[] = [];
        snapshot.forEach((docSnap) => {
          todos.push(docSnap.data() as TodoItem);
        });
        onUpdate(todos);
      },
      (error) => {
        console.warn('Firestore todos real-time subscription error:', error);
        onError?.(error);
      }
    );
  } catch (e: any) {
    console.warn('Failed to setup todos listener:', e);
    onError?.(e);
    return null;
  }
}

// 3. Save Item to Firestore
export async function saveItemToFirestore(item: InventoryItem): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    const docRef = doc(db, ITEMS_COLLECTION, item.id);
    await setDoc(docRef, item, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving item to Firestore:', error);
    return false;
  }
}

// 4. Delete Item from Firestore
export async function deleteItemFromFirestore(itemId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    const docRef = doc(db, ITEMS_COLLECTION, itemId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting item from Firestore:', error);
    return false;
  }
}

// 5. Save Todo to Firestore
export async function saveTodoToFirestore(todo: TodoItem): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    const docRef = doc(db, TODOS_COLLECTION, todo.id);
    await setDoc(docRef, todo, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving todo to Firestore:', error);
    return false;
  }
}

// 6. Delete Todo from Firestore
export async function deleteTodoFromFirestore(todoId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    const docRef = doc(db, TODOS_COLLECTION, todoId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting todo from Firestore:', error);
    return false;
  }
}

// 7. Upload Photo to Firebase Cloud Storage and return public URL
export async function uploadPhotoToFirebaseStorage(
  base64Data: string,
  prefix = 'photo'
): Promise<string> {
  // If already an HTTP/HTTPS URL, return as is
  if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
    return base64Data;
  }

  const storage = getFirebaseStorage();
  if (!storage) {
    return base64Data; // fallback to base64 if storage not configured
  }

  try {
    const filename = 'photos/' + Date.now() + '_' + prefix + '_' + Math.random().toString(36).substring(2, 7) + '.jpg';
    const storageRef = ref(storage, filename);
    await uploadString(storageRef, base64Data, 'data_url');
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage upload failed, keeping local image data:', error);
    return base64Data;
  }
}

// 8. Bulk Sync Local Data to Cloud
export async function syncAllLocalItemsToCloud(
  items: InventoryItem[],
  todos: TodoItem[]
): Promise<{ itemsCount: number; todosCount: number; success: boolean }> {
  const db = getDb();
  if (!db) return { itemsCount: 0, todosCount: 0, success: false };

  try {
    const batch = writeBatch(db);

    items.forEach((item) => {
      const docRef = doc(db, ITEMS_COLLECTION, item.id);
      batch.set(docRef, item, { merge: true });
    });

    todos.forEach((todo) => {
      const docRef = doc(db, TODOS_COLLECTION, todo.id);
      batch.set(docRef, todo, { merge: true });
    });

    await batch.commit();
    return { itemsCount: items.length, todosCount: todos.length, success: true };
  } catch (error) {
    console.error('Bulk sync to Firestore failed:', error);
    return { itemsCount: 0, todosCount: 0, success: false };
  }
}
