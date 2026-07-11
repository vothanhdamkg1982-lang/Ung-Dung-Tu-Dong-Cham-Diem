/**
 * ocr.js - Optical Character Recognition
 * Handles text extraction from images using Tesseract.js
 */

const OCR = {
    currentWorker: null,

    /**
     * Initialize Tesseract worker
     */
    async initWorker() {
        if (!window.Tesseract) {
            Utils.notify('Tesseract.js không sẵn sàng', 'error');
            return null;
        }
        
        try {
            this.currentWorker = await Tesseract.createWorker({
                logger: (m) => {
                    if (m.status === 'recognizing') {
                        const progress = Math.round(m.progress * 100);
                        document.getElementById('progress-text').textContent = 
                            `Đang nhận dạng: ${progress}%`;
                    }
                }
            });
            
            await this.currentWorker.loadLanguage('vie+eng');
            await this.currentWorker.initialize('vie+eng');
            return this.currentWorker;
        } catch (error) {
            console.error('Worker initialization failed:', error);
            Utils.notify('Lỗi khởi tạo OCR', 'error');
            return null;
        }
    },

    /**
     * Recognize text from image
     */
    async recognizeImage(imageData) {
        try {
            let worker = this.currentWorker;
            if (!worker) {
                worker = await this.initWorker();
                if (!worker) throw new Error('Worker not initialized');
            }

            const result = await worker.recognize(imageData);
            return result.data.text;
        } catch (error) {
            console.error('OCR error:', error);
            Utils.notify('Lỗi nhận dạng văn bản', 'error');
            return '';
        }
    },

    /**
     * Recognize text from URL
     */
    async recognizeUrl(url) {
        try {
            let worker = this.currentWorker;
            if (!worker) {
                worker = await this.initWorker();
                if (!worker) throw new Error('Worker not initialized');
            }

            const result = await worker.recognize(url);
            return result.data.text;
        } catch (error) {
            console.error('OCR error:', error);
            Utils.notify('Lỗi nhận dạng từ URL', 'error');
            return '';
        }
    },

    /**
     * Process image file
     */
    async processImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const result = await this.recognizeImage(e.target.result);
                resolve(result);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Extract text from multiple images
     */
    async processMultipleImages(files) {
        const results = [];
        
        for (let i = 0; i < files.length; i++) {
            try {
                const text = await this.processImageFile(files[i]);
                results.push({
                    filename: files[i].name,
                    text: text,
                    timestamp: new Date()
                });
                
                // Update progress
                const progress = ((i + 1) / files.length) * 100;
                document.getElementById('progress-fill').style.width = progress + '%';
            } catch (error) {
                console.error(`Error processing ${files[i].name}:`, error);
            }
        }
        
        return results;
    },

    /**
     * Extract text from PDF
     */
    async extractTextFromPDF(arrayBuffer) {
        try {
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const textsArray = [];
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                textsArray.push(pageText);
            }
            
            return textsArray.join('\n');
        } catch (error) {
            console.error('PDF extraction error:', error);
            Utils.notify('Lỗi trích xuất PDF', 'error');
            return '';
        }
    },

    /**
     * Extract text from DOCX
     */
    async extractTextFromDocx(arrayBuffer) {
        try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            console.error('DOCX extraction error:', error);
            Utils.notify('Lỗi trích xuất DOCX', 'error');
            return '';
        }
    },

    /**
     * Terminate worker
     */
    async terminate() {
        if (this.currentWorker) {
            await this.currentWorker.terminate();
            this.currentWorker = null;
        }
    }
};

// Image processing utilities
const ImageProcessor = {
    /**
     * Rotate image
     */
    rotateImage(canvas, angle = 90) {
        const rotated = document.createElement('canvas');
        const ctx = rotated.getContext('2d');
        
        if (angle === 90 || angle === -270) {
            rotated.width = canvas.height;
            rotated.height = canvas.width;
            ctx.translate(canvas.height, 0);
        } else if (angle === -90 || angle === 270) {
            rotated.width = canvas.height;
            rotated.height = canvas.width;
            ctx.translate(0, canvas.width);
        } else if (angle === 180) {
            rotated.width = canvas.width;
            rotated.height = canvas.height;
            ctx.translate(canvas.width, canvas.height);
        }
        
        ctx.rotate((angle * Math.PI) / 180);
        ctx.drawImage(canvas, 0, 0);
        
        return rotated;
    },

    /**
     * Increase contrast
     */
    adjustContrast(canvas, factor = 1.5) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, (data[i] - 128) * factor + 128);
            data[i + 1] = Math.min(255, (data[i + 1] - 128) * factor + 128);
            data[i + 2] = Math.min(255, (data[i + 2] - 128) * factor + 128);
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    },

    /**
     * Sharpen image
     */
    sharpenImage(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        const side = Math.round(Math.sqrt(kernel.length));
        const half = Math.floor(side / 2);
        
        for (let i = half * canvas.width * 4 + half * 4; i < data.length - half * canvas.width * 4 - half * 4; i += 4) {
            let r = 0, g = 0, b = 0;
            
            for (let j = 0; j < kernel.length; j++) {
                const x = (i / 4 + j % side - half) % canvas.width;
                const y = Math.floor(i / 4 / canvas.width) + Math.floor(j / side) - half;
                const idx = (y * canvas.width + x) * 4;
                
                r += data[idx] * kernel[j];
                g += data[idx + 1] * kernel[j];
                b += data[idx + 2] * kernel[j];
            }
            
            data[i] = Math.min(255, Math.max(0, r));
            data[i + 1] = Math.min(255, Math.max(0, g));
            data[i + 2] = Math.min(255, Math.max(0, b));
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    },

    /**
     * Remove background (simple white background removal)
     */
    removeBackground(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // If pixel is white or very light
            if (r > 240 && g > 240 && b > 240) {
                data[i + 3] = 0; // Make transparent
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    },

    /**
     * Convert image to grayscale
     */
    toGrayscale(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
};
