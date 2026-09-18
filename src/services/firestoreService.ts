import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Client, CallRecord, Operator, Territory, Regional, AppSettings } from '../types';

// Collections References
const CLIENTS_COL = 'clients';
const CALLS_COL = 'calls';
const OPERATORS_COL = 'operators';
const TERRITORIES_COL = 'territories';
const REGIONAIS_COL = 'regionais';
const SETTINGS_COL = 'settings';

export const FirestoreService = {
  // --- REAL-TIME LISTENERS ---
  listenClients: (
    onData: (clients: Client[]) => void,
    onError?: (err: Error) => void
  ) => {
    return onSnapshot(
      collection(db, CLIENTS_COL),
      (snap) => {
        const list: Client[] = [];
        snap.forEach((d) => {
          list.push(d.data() as Client);
        });
        onData(list);
      },
      (err) => {
        console.error('Erro no listener de clientes:', err);
        if (onError) onError(err);
      }
    );
  },

  listenCalls: (
    onData: (calls: CallRecord[]) => void,
    onError?: (err: Error) => void
  ) => {
    return onSnapshot(
      collection(db, CALLS_COL),
      (snap) => {
        const list: CallRecord[] = [];
        snap.forEach((d) => {
          list.push(d.data() as CallRecord);
        });
        onData(list);
      },
      (err) => {
        console.error('Erro no listener de chamadas:', err);
        if (onError) onError(err);
      }
    );
  },

  listenOperators: (
    onData: (ops: Operator[]) => void,
    onError?: (err: Error) => void
  ) => {
    return onSnapshot(
      collection(db, OPERATORS_COL),
      (snap) => {
        const list: Operator[] = [];
        snap.forEach((d) => {
          list.push(d.data() as Operator);
        });
        onData(list);
      },
      (err) => {
        console.error('Erro no listener de operadores:', err);
        if (onError) onError(err);
      }
    );
  },

  listenTerritories: (
    onData: (territories: Territory[]) => void,
    onError?: (err: Error) => void
  ) => {
    return onSnapshot(
      collection(db, TERRITORIES_COL),
      (snap) => {
        const list: Territory[] = [];
        snap.forEach((d) => {
          list.push(d.data() as Territory);
        });
        onData(list);
      },
      (err) => {
        console.error('Erro no listener de territórios:', err);
        if (onError) onError(err);
      }
    );
  },

  listenRegionais: (
    onData: (regionais: Regional[]) => void,
    onError?: (err: Error) => void
  ) => {
    return onSnapshot(
      collection(db, REGIONAIS_COL),
      (snap) => {
        const list: Regional[] = [];
        snap.forEach((d) => {
          list.push(d.data() as Regional);
        });
        onData(list);
      },
      (err) => {
        console.error('Erro no listener de regionais:', err);
        if (onError) onError(err);
      }
    );
  },

  listenSettings: (
    onData: (settings: AppSettings | null) => void,
    onError?: (err: Error) => void
  ) => {
    return onSnapshot(
      doc(db, SETTINGS_COL, 'app_settings'),
      (snap) => {
        if (snap.exists()) {
          onData(snap.data() as AppSettings);
        } else {
          onData(null);
        }
      },
      (err) => {
        console.error('Erro no listener de configurações:', err);
        if (onError) onError(err);
      }
    );
  },

  // --- WRITE OPERATIONS ---
  saveClient: async (client: Client): Promise<void> => {
    const docRef = doc(db, CLIENTS_COL, client.id);
    await setDoc(docRef, client, { merge: true });
  },

  deleteClient: async (clientId: string): Promise<void> => {
    await deleteDoc(doc(db, CLIENTS_COL, clientId));
  },

  saveCall: async (call: CallRecord): Promise<void> => {
    const docRef = doc(db, CALLS_COL, call.id);
    await setDoc(docRef, call, { merge: true });
  },

  deleteCall: async (callId: string): Promise<void> => {
    await deleteDoc(doc(db, CALLS_COL, callId));
  },

  saveOperator: async (op: Operator): Promise<void> => {
    const docRef = doc(db, OPERATORS_COL, op.id);
    await setDoc(docRef, op, { merge: true });
  },

  deleteOperator: async (opId: string): Promise<void> => {
    await deleteDoc(doc(db, OPERATORS_COL, opId));
  },

  saveTerritories: async (territories: Territory[]): Promise<void> => {
    // Save in batches of 400
    const chunkSize = 400;
    for (let i = 0; i < territories.length; i += chunkSize) {
      const chunk = territories.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((t) => {
        batch.set(doc(db, TERRITORIES_COL, t.id), t, { merge: true });
      });
      await batch.commit();
    }
  },

  saveRegionais: async (regionais: Regional[]): Promise<void> => {
    const batch = writeBatch(db);
    regionais.forEach((r) => {
      batch.set(doc(db, REGIONAIS_COL, r.id), r, { merge: true });
    });
    await batch.commit();
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    await setDoc(doc(db, SETTINGS_COL, 'app_settings'), settings, { merge: true });
  },

  // Batch upload clients (for CSV imports, 400 per batch)
  batchSaveClients: async (
    clients: Client[],
    onProgress?: (saved: number, total: number) => void
  ): Promise<void> => {
    const chunkSize = 400;
    const total = clients.length;
    let saved = 0;

    for (let i = 0; i < clients.length; i += chunkSize) {
      const chunk = clients.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((client) => {
        batch.set(doc(db, CLIENTS_COL, client.id), client, { merge: true });
      });
      await batch.commit();
      saved += chunk.length;
      if (onProgress) {
        onProgress(Math.min(saved, total), total);
      }
    }
  },

  // Initial seeding: check if cloud has operators, if not, seeds initial data
  checkCloudHasData: async (): Promise<boolean> => {
    try {
      const snap = await getDocs(collection(db, OPERATORS_COL));
      return !snap.empty;
    } catch (e) {
      console.warn('Erro ao checar dados na nuvem:', e);
      return false;
    }
  }
};
