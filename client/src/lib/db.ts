import { openDB } from 'idb';
import type { DBSchema } from 'idb';
import { Issue } from '@/types';

interface LokisaDB extends DBSchema {
  issues: {
    key: number;
    value: Issue;
    indexes: { 'by-type': string };
  };
  pendingReports: {
    key: string;
    value: {
      id: string;
      type: string;
      latitude: number;
      longitude: number;
      address: string;
      notes?: string;
      photo?: File;
      reportId: string;
      status: string;
      createdAt: Date;
    };
  };
  pendingSupports: {
    key: string;
    value: {
      id: string;
      issueId: number;
      deviceId: string;
      createdAt: Date;
    };
  };
}

// Open and initialize the database
export const dbPromise = openDB<LokisaDB>('lokisa', 1, {
  upgrade(db) {
    // Store for cached issues
    if (!db.objectStoreNames.contains('issues')) {
      const issuesStore = db.createObjectStore('issues', { keyPath: 'id' });
      issuesStore.createIndex('by-type', 'type');
    }

    // Store for pending reports to be synchronized
    if (!db.objectStoreNames.contains('pendingReports')) {
      db.createObjectStore('pendingReports', { keyPath: 'id' });
    }

    // Store for pending supports to be synchronized
    if (!db.objectStoreNames.contains('pendingSupports')) {
      db.createObjectStore('pendingSupports', { keyPath: 'id' });
    }
  },
});

// Function to save issues to IndexedDB
export async function saveIssues(issues: Issue[]) {
  const db = await dbPromise;
  const tx = db.transaction('issues', 'readwrite');
  await Promise.all(issues.map(issue => tx.store.put(issue)));
  await tx.done;
}

// Function to get all issues from IndexedDB
export async function getIssues(): Promise<Issue[]> {
  const db = await dbPromise;
  return db.getAll('issues');
}

// Function to get a specific issue by ID
export async function getIssueById(id: number): Promise<Issue | undefined> {
  const db = await dbPromise;
  return db.get('issues', id);
}

// Function to add a pending report for offline synchronization
export async function addPendingReport(report: LokisaDB['pendingReports']['value']) {
  const db = await dbPromise;
  return db.add('pendingReports', report);
}

// Function to add a pending support for offline synchronization
export async function addPendingSupport(support: LokisaDB['pendingSupports']['value']) {
  const db = await dbPromise;
  return db.add('pendingSupports', support);
}

// Function to get all pending reports
export async function getPendingReports() {
  const db = await dbPromise;
  return db.getAll('pendingReports');
}

// Function to get all pending supports
export async function getPendingSupports() {
  const db = await dbPromise;
  return db.getAll('pendingSupports');
}

// Function to remove a pending report once it's been synchronized
export async function removePendingReport(id: string) {
  const db = await dbPromise;
  return db.delete('pendingReports', id);
}

// Function to remove a pending support once it's been synchronized
export async function removePendingSupport(id: string) {
  const db = await dbPromise;
  return db.delete('pendingSupports', id);
}

// Function to trigger background sync when online
export async function triggerSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Trigger report sync
      await registration.sync.register('sync-reports');
      
      // Trigger support sync
      await registration.sync.register('sync-supports');
      
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }
  return false;
}