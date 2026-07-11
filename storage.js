/**
 * storage.js - Data Storage Management
 * Handles data persistence using LocalStorage and IndexedDB
 */

const Storage = {
    dbName: 'ThayChame',
    version: 1,
    db: null,

    /**
     * Initialize database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('answerKeys')) {
                    db.createObjectStore('answerKeys', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('uploadedWorks')) {
                    db.createObjectStore('uploadedWorks', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('gradingResults')) {
                    db.createObjectStore('gradingResults', { keyPath: 'id' });
                }
            };
        });
    },

    /**
     * Save answer key
     */
    async saveAnswerKey(answerKey) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['answerKeys'], 'readwrite');
            const store = transaction.objectStore('answerKeys');
            const request = store.put({
                ...answerKey,
                id: answerKey.id || Utils.generateId(),
                createdAt: answerKey.createdAt || new Date().getTime()
            });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get all answer keys
     */
    async getAnswerKeys() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['answerKeys'], 'readonly');
            const store = transaction.objectStore('answerKeys');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get specific answer key
     */
    async getAnswerKey(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['answerKeys'], 'readonly');
            const store = transaction.objectStore('answerKeys');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Save uploaded work
     */
    async saveUploadedWork(work) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['uploadedWorks'], 'readwrite');
            const store = transaction.objectStore('uploadedWorks');
            const request = store.put({
                ...work,
                id: work.id || Utils.generateId(),
                uploadedAt: work.uploadedAt || new Date().getTime()
            });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get all uploaded works
     */
    async getUploadedWorks() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['uploadedWorks'], 'readonly');
            const store = transaction.objectStore('uploadedWorks');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Save grading result
     */
    async saveGradingResult(result) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gradingResults'], 'readwrite');
            const store = transaction.objectStore('gradingResults');
            const request = store.put({
                ...result,
                id: result.id || Utils.generateId(),
                gradedAt: result.gradedAt || new Date().getTime()
            });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get all grading results
     */
    async getGradingResults() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gradingResults'], 'readonly');
            const store = transaction.objectStore('gradingResults');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const results = request.result.sort((a, b) => b.gradedAt - a.gradedAt);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get specific grading result
     */
    async getGradingResult(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gradingResults'], 'readonly');
            const store = transaction.objectStore('gradingResults');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Delete data
     */
    async deleteData(storeName, id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Clear all data
     */
    async clearAll() {
        if (!this.db) await this.init();
        
        const stores = ['answerKeys', 'uploadedWorks', 'gradingResults'];
        
        for (const store of stores) {
            await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([store], 'readwrite');
                const objStore = transaction.objectStore(store);
                const request = objStore.clear();
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    },

    /**
     * Backup data to JSON
     */
    async backupData() {
        const answerKeys = await this.getAnswerKeys();
        const uploadedWorks = await this.getUploadedWorks();
        const gradingResults = await this.getGradingResults();
        
        return {
            version: this.version,
            exportedAt: new Date().toISOString(),
            answerKeys,
            uploadedWorks,
            gradingResults
        };
    },

    /**
     * Restore data from JSON
     */
    async restoreData(data) {
        try {
            await this.clearAll();
            
            for (const answerKey of data.answerKeys) {
                await this.saveAnswerKey(answerKey);
            }
            
            for (const work of data.uploadedWorks) {
                await this.saveUploadedWork(work);
            }
            
            for (const result of data.gradingResults) {
                await this.saveGradingResult(result);
            }
            
            return true;
        } catch (error) {
            console.error('Error restoring data:', error);
            return false;
        }
    },

    /**
     * Save to localStorage (for small data)
     */
    setLocal(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('LocalStorage error:', error);
        }
    },

    /**
     * Get from localStorage
     */
    getLocal(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('LocalStorage error:', error);
            return null;
        }
    },

    /**
     * Remove from localStorage
     */
    removeLocal(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('LocalStorage error:', error);
        }
    }
};

// Initialize storage on load
document.addEventListener('DOMContentLoaded', () => {
    Storage.init().catch(error => {
        console.error('Database initialization failed:', error);
        Utils.notify('Lỗi khởi tạo cơ sở dữ liệu', 'error');
    });
});
