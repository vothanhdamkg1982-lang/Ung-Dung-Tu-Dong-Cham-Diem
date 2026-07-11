/**
 * utils.js - Utility Functions
 * Contains helper functions for text processing, validation, and common operations
 */

const Utils = {
    /**
     * Normalize Vietnamese text for comparison
     */
    normalizeText(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[.,!?;:\-—]/g, '')
            .replace(/[àáảãạăằắẳẵặâầấẩẫậ]/g, 'a')
            .replace(/[èéẻẽẹêềếểễệ]/g, 'e')
            .replace(/[ìíỉĩị]/g, 'i')
            .replace(/[òóỏõọôồốổỗộơờớởỡợ]/g, 'o')
            .replace(/[ùúủũụưừứửữự]/g, 'u')
            .replace(/[ỳýỷỹỵ]/g, 'y')
            .replace(/đ/g, 'd');
    },

    /**
     * Calculate similarity between two texts (0-100)
     */
    calculateSimilarity(text1, text2) {
        const s1 = this.normalizeText(text1);
        const s2 = this.normalizeText(text2);

        if (s1 === s2) return 100;

        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;

        if (longer.length === 0) return 100;

        const editDistance = this.getEditDistance(longer, shorter);
        return ((longer.length - editDistance) / longer.length) * 100;
    },

    /**
     * Levenshtein distance algorithm
     */
    getEditDistance(s1, s2) {
        const costs = [];
        for (let k = 0; k <= s1.length; k++) {
            let lastValue = k;
            for (let i = 0; i <= s2.length; i++) {
                if (k === 0) {
                    costs[i] = i;
                } else if (i > 0) {
                    let newValue = costs[i - 1];
                    if (s1.charAt(k - 1) !== s2.charAt(i - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[i]) + 1;
                    }
                    costs[i - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (k > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    },

    /**
     * Extract keywords from text
     */
    extractKeywords(text, count = 5) {
        const words = text.split(/\s+/).filter(w => w.length > 2);
        const freq = {};
        words.forEach(word => {
            const normalized = this.normalizeText(word);
            freq[normalized] = (freq[normalized] || 0) + 1;
        });
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([word]) => word);
    },

    /**
     * Format date to Vietnamese format
     */
    formatDate(date) {
        if (!(date instanceof Date)) date = new Date(date);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${hours}:${minutes} ${day}/${month}/${year}`;
    },

    /**
     * Generate UUID
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Format score as grade
     */
    gradeScore(score) {
        if (score >= 8.5) return 'A';
        if (score >= 7) return 'B';
        if (score >= 5.5) return 'C';
        if (score >= 4) return 'D';
        return 'F';
    },

    /**
     * Show loading modal
     */
    showLoading(message = 'Đang xử lý...') {
        const modal = document.getElementById('loading-modal');
        const text = document.getElementById('loading-text');
        if (modal && text) {
            text.textContent = message;
            modal.style.display = 'flex';
        }
    },

    /**
     * Hide loading modal
     */
    hideLoading() {
        const modal = document.getElementById('loading-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    /**
     * Show notification
     */
    notify(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            padding: 16px 24px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    },

    /**
     * Convert file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Download file
     */
    downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Get storage size
     */
    getStorageSize() {
        let size = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                size += localStorage[key].length + key.length;
            }
        }
        return (size / 1024).toFixed(2) + ' KB';
    }
};

// CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
