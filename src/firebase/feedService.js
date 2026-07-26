import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

// Pre-populated demo feed data for instant UI preview when Firebase is not connected yet
const INITIAL_DEMO_FEEDS = [
  {
    id: 'demo-feed-1',
    apiName: 'AC_POWER_METRICS',
    source: 'Chronicle Docker Worker #1',
    timestamp: new Date().toISOString(),
    status: 'success',
    payload: {
      voltage: 234.5,
      current: 4.82,
      power_kw: 1.13,
      frequency_hz: 50.02,
      status: 'OPTIMAL',
      location: 'Server Room Alpha'
    }
  },
  {
    id: 'demo-feed-2',
    apiName: 'WEATHER_SYNC',
    source: 'Chronicle Docker Worker #2',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'success',
    payload: {
      temperature_c: 28.4,
      humidity: 62,
      condition: 'Partly Cloudy',
      wind_speed_kmh: 14.2
    }
  },
  {
    id: 'demo-feed-3',
    apiName: 'CRYPTO_TICKER',
    source: 'Chronicle Cron #4',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'success',
    payload: {
      pair: 'BTC/USD',
      price: 64230.50,
      change_24h: '+2.41%',
      volume_24h: 3829104.12
    }
  }
];

// In-memory array for demo mode changes during session
let demoFeedsStore = [...INITIAL_DEMO_FEEDS];
let demoListeners = [];

const notifyDemoListeners = () => {
  demoListeners.forEach(cb => cb([...demoFeedsStore]));
};

/**
 * Subscribe to real-time feed updates from Firestore or Demo mode
 */
export const subscribeToApiFeeds = (callback) => {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'api_feeds'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      return onSnapshot(q, (snapshot) => {
        const feeds = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate().toISOString() : (doc.data().timestamp || new Date().toISOString())
        }));
        callback(feeds);
      }, (error) => {
        console.error("Firestore snapshot error, switching to demo store:", error);
        callback([...demoFeedsStore]);
      });
    } catch (e) {
      console.warn("Failed Firestore query, using demo store:", e);
      callback([...demoFeedsStore]);
      return () => {};
    }
  } else {
    // Demo mode: trigger callback immediately and return unsubscribe handle
    callback([...demoFeedsStore]);
    demoListeners.push(callback);
    return () => {
      demoListeners = demoListeners.filter(l => l !== callback);
    };
  }
};

/**
 * Push a new API feed entry (used by manual dashboard test or simulated Chronicle worker)
 */
export const pushApiFeedRecord = async (apiName, payload, source = 'Dashboard Manual Trigger') => {
  const newRecord = {
    apiName: apiName.toUpperCase(),
    source,
    timestamp: isFirebaseConfigured ? serverTimestamp() : new Date().toISOString(),
    status: 'success',
    payload
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'api_feeds'), newRecord);
      return { success: true, id: docRef.id };
    } catch (err) {
      console.error("Failed to push feed to Firestore:", err);
      throw err;
    }
  } else {
    // Demo Mode Push
    const demoRecord = {
      ...newRecord,
      id: 'demo-' + Date.now(),
      timestamp: new Date().toISOString()
    };
    demoFeedsStore = [demoRecord, ...demoFeedsStore];
    notifyDemoListeners();
    return { success: true, id: demoRecord.id, demo: true };
  }
};

/**
 * Clear all feeds (for testing)
 */
export const clearAllFeeds = async () => {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'api_feeds'));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'api_feeds', docSnap.id)));
    await Promise.all(deletePromises);
  } else {
    demoFeedsStore = [];
    notifyDemoListeners();
  }
};
