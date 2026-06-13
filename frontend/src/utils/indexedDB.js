/**
 * IndexedDB Helper for TaskFlow
 * Handles offline local storage and sync
 */

const DB_NAME = 'TaskFlowDB';
const DB_VERSION = 1;
const STORES = {
  TASKS: 'tasks',
  PENDING_SYNC: 'pendingSync',
  USER: 'user',
  SYNC_LOG: 'syncLog'
};

class TaskFlowDB {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB init failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create tasks store
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const tasksStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
          tasksStore.createIndex('status', 'status', { unique: false });
          tasksStore.createIndex('dueDate', 'dueDate', { unique: false });
          tasksStore.createIndex('priority', 'priority', { unique: false });
          tasksStore.createIndex('syncedAt', 'syncedAt', { unique: false });
        }

        // Create pending sync store
        if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
          db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id', autoIncrement: true });
        }

        // Create user store
        if (!db.objectStoreNames.contains(STORES.USER)) {
          db.createObjectStore(STORES.USER, { keyPath: 'id' });
        }

        // Create sync log store
        if (!db.objectStoreNames.contains(STORES.SYNC_LOG)) {
          const syncStore = db.createObjectStore(STORES.SYNC_LOG, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('status', 'status', { unique: false });
        }

        console.log('IndexedDB stores created');
      };
    });
  }

  /**
   * Save task locally
   */
  async saveTask(task) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.TASKS], 'readwrite');
      const store = transaction.objectStore(STORES.TASKS);
      const request = store.put({
        ...task,
        locallyModified: true,
        lastModifiedLocal: new Date().toISOString()
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all tasks from local storage
   */
  async getAllTasks() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.TASKS], 'readonly');
      const store = transaction.objectStore(STORES.TASKS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get task by ID
   */
  async getTask(taskId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.TASKS], 'readonly');
      const store = transaction.objectStore(STORES.TASKS);
      const request = store.get(taskId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete task from local storage
   */
  async deleteTask(taskId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.TASKS], 'readwrite');
      const store = transaction.objectStore(STORES.TASKS);
      const request = store.delete(taskId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all tasks
   */
  async clearTasks() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.TASKS], 'readwrite');
      const store = transaction.objectStore(STORES.TASKS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add operation to pending sync queue
   */
  async addPendingSync(operation, taskId, data) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.PENDING_SYNC], 'readwrite');
      const store = transaction.objectStore(STORES.PENDING_SYNC);
      const request = store.add({
        operation, // 'CREATE', 'UPDATE', 'DELETE'
        taskId,
        data,
        timestamp: new Date().toISOString(),
        synced: false
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending sync operations
   */
  async getPendingSync() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.PENDING_SYNC], 'readonly');
      const store = transaction.objectStore(STORES.PENDING_SYNC);
      const request = store.getAll();

      request.onsuccess = () => {
        const pending = request.result.filter(item => !item.synced);
        resolve(pending);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark sync operation as completed
   */
  async markSyncCompleted(syncId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.PENDING_SYNC], 'readwrite');
      const store = transaction.objectStore(STORES.PENDING_SYNC);
      const request = store.get(syncId);

      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          item.synced = true;
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save user info
   */
  async saveUser(user) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.USER], 'readwrite');
      const store = transaction.objectStore(STORES.USER);
      const request = store.put({ id: 'current', ...user });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get user info
   */
  async getUser() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.USER], 'readonly');
      const store = transaction.objectStore(STORES.USER);
      const request = store.get('current');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Log sync operation
   */
  async logSync(type, status, details) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SYNC_LOG], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_LOG);
      const request = store.add({
        type, // 'upload', 'download', 'conflict'
        status, // 'success', 'error', 'pending'
        details,
        timestamp: new Date().toISOString()
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if offline
   */
  isOffline() {
    return !navigator.onLine;
  }
}

// Export singleton instance
export const taskFlowDB = new TaskFlowDB();

export default TaskFlowDB;
