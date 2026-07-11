/**
 * app.js - Main Application Controller
 * Coordinates all modules and handles user interactions
 */

const App = {
    currentAnswerKey: null,
    currentGradingResult: null,
    currentUploadedWorks: [],
    allGradingResults: [],

    /**
     * Initialize app
     */
    async init() {
        console.log('Initializing Thầy Chấm...');
        
        // Initialize storage
        await Storage.init();
        
        // Setup event listeners
        this.setupNavigation();
        this.setupThemeToggle();
        this.setupAnswerKeyModule();
        this.setupUploadModule();
        this.setupGradingModule();
        this.setupResultsModule();
        this.setupSettingsModule();
        
        // Load initial data
        await this.loadAllData();
        
        console.log('✓ Application ready');
    },

    /**
     * Setup navigation
     */
    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const menuName = link.dataset.menu;
                this.switchSection(menuName);
            });
        });
    },

    /**
     * Switch section
     */
    switchSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const section = document.getElementById(sectionName);
        if (section) {
            section.classList.add('active');
        }

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.menu === sectionName) {
                link.classList.add('active');
            }
        });

        // Load section-specific data
        if (sectionName === 'dashboard') {
            this.updateDashboard();
        } else if (sectionName === 'stats') {
            this.updateStatistics();
        }
    },

    /**
     * Setup theme toggle
     */
    setupThemeToggle() {
        const themeBtn = document.getElementById('theme-btn');
        const isDark = localStorage.getItem('darkMode') === 'true';
        
        if (isDark) {
            document.body.classList.add('dark-mode');
            themeBtn.textContent = '☀️';
        }

        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);
            themeBtn.textContent = isDarkMode ? '☀️' : '🌙';
        });
    },

    /**
     * Setup answer key module
     */
    setupAnswerKeyModule() {
        const uploadBtn = document.getElementById('upload-answer-btn');
        const manualBtn = document.getElementById('manual-answer-btn');
        const fileInput = document.getElementById('answer-file-input');
        const addBtn = document.querySelector('.add-question-btn');
        const saveBtn = document.querySelector('.save-answer-btn');

        uploadBtn.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            Utils.showLoading('Đang xử lý tệp...');
            
            try {
                let text = '';
                if (file.type.includes('pdf')) {
                    const buffer = await file.arrayBuffer();
                    text = await OCR.extractTextFromPDF(buffer);
                } else if (file.type.includes('word')) {
                    const buffer = await file.arrayBuffer();
                    text = await OCR.extractTextFromDocx(buffer);
                } else {
                    text = await file.text();
                }

                // Parse and save answer key
                const parsedAnswers = this.parseUploadedAnswers(text);
                this.currentAnswerKey = parsedAnswers;
                this.displayAnswerPreview(parsedAnswers);
                Utils.notify('Tải đáp án thành công', 'success');
            } catch (error) {
                Utils.notify('Lỗi xử lý tệp', 'error');
            } finally {
                Utils.hideLoading();
                fileInput.value = '';
            }
        });

        manualBtn.addEventListener('click', () => {
            document.getElementById('manual-answer-section').style.display = 'block';
            manualBtn.style.display = 'none';
        });

        addBtn.addEventListener('click', () => {
            this.addQuestionRow();
        });

        saveBtn.addEventListener('click', async () => {
            const questions = this.collectQuestions();
            if (questions.length === 0) {
                Utils.notify('Vui lòng thêm ít nhất một câu', 'warning');
                return;
            }

            this.currentAnswerKey = questions;
            await Storage.saveAnswerKey({
                id: Utils.generateId(),
                questions: questions,
                createdAt: new Date().getTime()
            });

            this.displayAnswerPreview(questions);
            document.getElementById('manual-answer-section').style.display = 'none';
            document.getElementById('manual-answer-btn').style.display = 'inline-block';
            Utils.notify('Lưu đáp án thành công', 'success');
        });
    },

    /**
     * Parse uploaded answers
     */
    parseUploadedAnswers(text) {
        const questions = [];
        const lines = text.split('\n').filter(l => l.trim());
        
        let currentQuestion = null;
        let currentAnswer = '';

        for (const line of lines) {
            if (/^(câu|question|q)\s*\d+[\s:]/i.test(line)) {
                if (currentQuestion) {
                    currentQuestion.answer = currentAnswer.trim();
                    questions.push(currentQuestion);
                }
                const questionText = line.replace(/^(câu|question|q)\s*\d+[\s:]/i, '').trim();
                currentQuestion = {
                    question: questionText,
                    answer: '',
                    points: 1
                };
                currentAnswer = '';
            } else if (currentQuestion) {
                currentAnswer += line + ' ';
            }
        }

        if (currentQuestion) {
            currentQuestion.answer = currentAnswer.trim();
            questions.push(currentQuestion);
        }

        return questions;
    },

    /**
     * Add question row to editor
     */
    addQuestionRow() {
        const editor = document.querySelector('.answer-editor');
        const inputs = editor.querySelectorAll('input, textarea');
        
        const question = inputs[0].value;
        const answer = inputs[1].value;
        const points = parseInt(inputs[2].value) || 1;

        if (!question || !answer) {
            Utils.notify('Vui lòng nhập câu hỏi và đáp án', 'warning');
            return;
        }

        if (!this.currentAnswerKey) {
            this.currentAnswerKey = [];
        }

        this.currentAnswerKey.push({
            question,
            answer,
            points
        });

        inputs[0].value = '';
        inputs[1].value = '';
        inputs[2].value = '1';

        this.displayAnswerPreview(this.currentAnswerKey);
        Utils.notify('Thêm câu hỏi thành công', 'success');
    },

    /**
     * Collect questions from form
     */
    collectQuestions() {
        const questions = [];
        const editor = document.querySelector('.answer-editor');
        const inputs = editor.querySelectorAll('input, textarea');
        
        const question = inputs[0].value;
        const answer = inputs[1].value;
        const points = parseInt(inputs[2].value) || 1;

        if (question && answer) {
            questions.push({ question, answer, points });
        }

        return [...(this.currentAnswerKey || []), ...questions];
    },

    /**
     * Display answer preview
     */
    displayAnswerPreview(answers) {
        const preview = document.getElementById('answer-preview');
        preview.innerHTML = '';

        answers.forEach((q, index) => {
            const item = document.createElement('div');
            item.className = 'answer-item';
            item.innerHTML = `
                <div class="answer-item-question">Câu ${index + 1}: ${q.question}</div>
                <div class="answer-item-content"><strong>Đáp án:</strong> ${q.answer}</div>
                <div class="answer-item-points">Điểm: ${q.points}</div>
            `;
            preview.appendChild(item);
        });
    },

    /**
     * Setup upload module
     */
    setupUploadModule() {
        const webcamBtn = document.getElementById('webcam-btn');
        const uploadBtn = document.getElementById('upload-work-btn');
        const fileInput = document.getElementById('work-file-input');
        const captureBtn = document.getElementById('capture-btn');
        const stopBtn = document.getElementById('stop-webcam-btn');
        const confirmImageBtn = document.getElementById('confirm-image-btn');

        let webcamStream = null;
        let uploadedImages = [];

        webcamBtn.addEventListener('click', async () => {
            try {
                Utils.showLoading('Đang kết nối webcam...');
                
                // Check if browser supports getUserMedia
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('getUserMedia not supported');
                }

                // Try different constraints
                let constraints = { video: { facingMode: 'environment' } };
                
                try {
                    webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (err) {
                    // Fallback to user-facing camera if environment fails
                    constraints = { video: { facingMode: 'user' } };
                    webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
                }
                
                const video = document.getElementById('video');
                video.srcObject = webcamStream;
                
                // Ensure video plays
                video.setAttribute('autoplay', 'autoplay');
                video.setAttribute('muted', 'muted');
                video.setAttribute('playsinline', 'playsinline');
                
                // Add event listener for when video is ready
                video.onloadedmetadata = () => {
                    video.play().catch(err => {
                        console.error('Play error:', err);
                        Utils.notify('Lỗi phát video', 'error');
                    });
                };

                // Fallback: start playing immediately
                video.play().catch(err => {
                    console.error('Play error:', err);
                });
                
                document.getElementById('webcam-section').style.display = 'block';
                webcamBtn.style.display = 'none';
                Utils.hideLoading();
                Utils.notify('Webcam kết nối thành công', 'success');
                
            } catch (error) {
                Utils.hideLoading();
                console.error('Webcam error:', error);
                
                let errorMsg = 'Không thể truy cập webcam';
                if (error.name === 'NotAllowedError') {
                    errorMsg = 'Bạn từ chối quyền truy cập webcam. Kiểm tra cài đặt trình duyệt.';
                } else if (error.name === 'NotFoundError') {
                    errorMsg = 'Không tìm thấy webcam. Kiểm tra thiết bị của bạn.';
                } else if (error.name === 'NotReadableError') {
                    errorMsg = 'Webcam đang được sử dụng bởi ứng dụng khác.';
                } else if (error.message === 'getUserMedia not supported') {
                    errorMsg = 'Trình duyệt không hỗ trợ webcam. Dùng Chrome, Firefox hoặc Edge.';
                }
                
                Utils.notify(errorMsg, 'error');
            }
        });

        captureBtn.addEventListener('click', () => {
            const video = document.getElementById('video');
            const canvas = document.getElementById('editor-canvas');
            const ctx = canvas.getContext('2d');

            // Check if video has loaded
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                Utils.notify('Video chưa tải. Chờ một chút rồi thử lại.', 'warning');
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            document.getElementById('image-editor').style.display = 'block';
            document.getElementById('webcam-section').style.display = 'none';
            Utils.notify('Chụp ảnh thành công', 'success');
        });

        stopBtn.addEventListener('click', () => {
            if (webcamStream) {
                webcamStream.getTracks().forEach(track => track.stop());
                webcamStream = null;
            }
            
            const video = document.getElementById('video');
            if (video) {
                video.srcObject = null;
            }
            
            document.getElementById('webcam-section').style.display = 'none';
            webcamBtn.style.display = 'inline-block';
            Utils.notify('Đã tắt webcam', 'success');
        });

        uploadBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        uploadedImages.push({
                            data: event.target.result,
                            name: file.name
                        });
                        this.displayUploadedItems(uploadedImages);
                    };
                    reader.readAsDataURL(file);
                } else if (file.type === 'application/pdf') {
                    const buffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const canvas = await page.render({
                            canvasContext: document.createElement('canvas').getContext('2d'),
                            scale: 2
                        }).promise;
                        
                        uploadedImages.push({
                            data: canvas,
                            name: `${file.name} (page ${i})`
                        });
                    }
                    this.displayUploadedItems(uploadedImages);
                }
            }
            
            fileInput.value = '';
        });

        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const canvas = document.getElementById('editor-canvas');
                
                switch(action) {
                    case 'rotate':
                        const rotated = ImageProcessor.rotateImage(canvas, 90);
                        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                        canvas.width = rotated.width;
                        canvas.height = rotated.height;
                        canvas.getContext('2d').drawImage(rotated, 0, 0);
                        break;
                    case 'contrast':
                        ImageProcessor.adjustContrast(canvas, 1.5);
                        break;
                    case 'sharpen':
                        ImageProcessor.sharpenImage(canvas);
                        break;
                    case 'remove-bg':
                        ImageProcessor.removeBackground(canvas);
                        break;
                }
            });
        });

        confirmImageBtn.addEventListener('click', () => {
            const canvas = document.getElementById('editor-canvas');
            uploadedImages.push({
                data: canvas.toDataURL(),
                name: `Capture_${new Date().getTime()}.png`
            });
            this.displayUploadedItems(uploadedImages);
            document.getElementById('image-editor').style.display = 'none';
            if (webcamStream) {
                webcamStream.getTracks().forEach(track => track.stop());
            }
            document.getElementById('webcam-section').style.display = 'none';
            document.getElementById('webcam-btn').style.display = 'inline-block';
        });

        // Store for later use
        window.uploadedImages = uploadedImages;
    },

    /**
     * Display uploaded items
     */
    displayUploadedItems(items) {
        const container = document.getElementById('uploaded-items');
        container.innerHTML = '';

        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'uploaded-item';
            
            let imgHtml = '';
            if (typeof item.data === 'string') {
                imgHtml = `<img src="${item.data}" alt="${item.name}">`;
            } else if (item.data instanceof HTMLCanvasElement) {
                imgHtml = `<img src="${item.data.toDataURL()}" alt="${item.name}">`;
            }
            
            div.innerHTML = `
                ${imgHtml}
                <div class="item-name">${item.name}</div>
            `;
            
            container.appendChild(div);
        });
    },

    /**
     * Setup grading module
     */
    setupGradingModule() {
        const startBtn = document.getElementById('start-grading-btn');
        const similaritySlider = document.getElementById('similarity-threshold');

        similaritySlider.addEventListener('input', (e) => {
            document.getElementById('similarity-value').textContent = e.target.value;
        });

        startBtn.addEventListener('click', async () => {
            if (!this.currentAnswerKey || this.currentAnswerKey.length === 0) {
                Utils.notify('Vui lòng tạo đáp án trước', 'warning');
                return;
            }

            if (!window.uploadedImages || window.uploadedImages.length === 0) {
                Utils.notify('Vui lòng upload bài làm trước', 'warning');
                return;
            }

            await this.performGrading();
        });
    },

    /**
     * Perform grading
     */
    async performGrading() {
        Utils.showLoading('Đang nhận dạng và chấm bài...');
        document.getElementById('grading-progress').style.display = 'block';

        try {
            const severity = document.querySelector('input[name="severity"]:checked').value;
            const threshold = parseInt(document.getElementById('similarity-threshold').value);

            let studentText = '';

            // OCR all images
            for (let i = 0; i < window.uploadedImages.length; i++) {
                const image = window.uploadedImages[i];
                document.getElementById('progress-text').textContent = 
                    `Nhận dạng ảnh ${i + 1}/${window.uploadedImages.length}...`;

                const progress = ((i + 1) / window.uploadedImages.length) * 100;
                document.getElementById('progress-fill').style.width = progress + '%';

                let imageData = image.data;
                if (typeof imageData === 'string') {
                    imageData = imageData.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
                } else if (imageData instanceof HTMLCanvasElement) {
                    imageData = imageData.toDataURL().replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
                }

                const text = await OCR.recognizeImage(imageData);
                studentText += text + '\n';
            }

            document.getElementById('progress-text').textContent = 'Đang xử lý kết quả...';

            // Grade the work
            const result = await Grading.gradeWork(studentText, this.currentAnswerKey, {
                severity,
                similarityThreshold: threshold
            });

            if (result) {
                this.currentGradingResult = result;
                await Storage.saveGradingResult(result);
                await this.loadAllData();
                this.displayResults(result);
                this.switchSection('results');
            }
        } catch (error) {
            console.error('Grading error:', error);
            Utils.notify('Lỗi chấm bài', 'error');
        } finally {
            Utils.hideLoading();
            document.getElementById('grading-progress').style.display = 'none';
        }
    },

    /**
     * Setup results module
     */
    setupResultsModule() {
        const saveFeedbackBtn = document.getElementById('save-feedback-btn');
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        const exportExcelBtn = document.getElementById('export-excel-btn');
        const exportWordBtn = document.getElementById('export-word-btn');
        const printBtn = document.getElementById('print-btn');

        saveFeedbackBtn.addEventListener('click', async () => {
            if (!this.currentGradingResult) return;

            this.currentGradingResult.feedback = document.getElementById('ai-feedback').textContent;
            await Storage.saveGradingResult(this.currentGradingResult);
            Utils.notify('Lưu kết quả thành công', 'success');
        });

        exportPdfBtn.addEventListener('click', () => {
            if (this.currentGradingResult) {
                Export.exportToPDF(this.currentGradingResult);
            }
        });

        exportExcelBtn.addEventListener('click', () => {
            if (this.currentGradingResult) {
                Export.exportToExcel(this.currentGradingResult);
            }
        });

        exportWordBtn.addEventListener('click', () => {
            if (this.currentGradingResult) {
                Utils.notify('Tính năng sẽ được cập nhật', 'info');
            }
        });

        printBtn.addEventListener('click', () => {
            if (this.currentGradingResult) {
                Export.print(this.currentGradingResult);
            }
        });
    },

    /**
     * Display results
     */
    displayResults(result) {
        document.getElementById('no-results').style.display = 'none';
        document.getElementById('results-content').style.display = 'block';

        // Overall score
        document.getElementById('final-score').textContent = result.finalScore;
        document.getElementById('result-feedback').textContent = 
            result.percentage >= 70 ? '✓ Hoàn thành tốt!' :
            result.percentage >= 50 ? '△ Cần cải thiện' : '✗ Cần ôn lại';

        // Question details
        const details = document.getElementById('results-details');
        details.innerHTML = '';

        result.questionResults.forEach(qr => {
            const statusColor = qr.status === 'correct' ? 'correct' :
                               qr.status === 'partial' ? 'partial' : 'wrong';
            const statusText = qr.status === 'correct' ? '✓ Đúng' :
                              qr.status === 'partial' ? '△ Tạm được' : '✗ Sai';

            const div = document.createElement('div');
            div.className = `question-result ${statusColor}`;
            div.innerHTML = `
                <div class="question-result-header">${statusText} - Câu ${qr.questionNumber}</div>
                <div class="question-result-detail">Điểm: ${qr.score}/${qr.maxScore}</div>
                <div class="question-result-detail">Tương đồng: ${qr.similarity}%</div>
                <div class="question-result-detail">Trả lời: ${qr.studentAnswer}</div>
                ${qr.missingKeywords.length > 0 ? 
                    `<div class="question-result-detail">Thiếu: ${qr.missingKeywords.join(', ')}</div>` : ''}
            `;
            details.appendChild(div);
        });

        // AI Feedback
        document.getElementById('ai-feedback').textContent = result.feedback;
    },

    /**
     * Setup settings module
     */
    setupSettingsModule() {
        const backupBtn = document.getElementById('backup-btn');
        const restoreBtn = document.getElementById('restore-btn');
        const clearBtn = document.getElementById('clear-btn');
        const restoreInput = document.getElementById('restore-file-input');

        backupBtn.addEventListener('click', async () => {
            try {
                const data = await Storage.backupData();
                const json = JSON.stringify(data, null, 2);
                Utils.downloadFile(json, `backup_${new Date().getTime()}.json`, 'application/json');
                Utils.notify('Sao lưu thành công', 'success');
            } catch (error) {
                Utils.notify('Lỗi sao lưu', 'error');
            }
        });

        restoreBtn.addEventListener('click', () => {
            restoreInput.click();
        });

        restoreInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);
                const success = await Storage.restoreData(data);
                if (success) {
                    await this.loadAllData();
                    Utils.notify('Khôi phục thành công', 'success');
                }
            } catch (error) {
                Utils.notify('Lỗi khôi phục dữ liệu', 'error');
            }
            restoreInput.value = '';
        });

        clearBtn.addEventListener('click', async () => {
            if (confirm('Bạn chắc chắn muốn xóa tất cả dữ liệu?')) {
                try {
                    await Storage.clearAll();
                    this.currentAnswerKey = null;
                    this.currentGradingResult = null;
                    this.currentUploadedWorks = [];
                    this.allGradingResults = [];
                    window.uploadedImages = [];
                    Utils.notify('Xóa dữ liệu thành công', 'success');
                } catch (error) {
                    Utils.notify('Lỗi xóa dữ liệu', 'error');
                }
            }
        });

        // Update app info
        document.getElementById('storage-size').textContent = Utils.getStorageSize();
        document.getElementById('browser-info').textContent = navigator.userAgent.split(' ').slice(-1)[0];
    },

    /**
     * Load all data
     */
    async loadAllData() {
        try {
            this.allGradingResults = await Storage.getGradingResults();
            this.updateDashboard();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    },

    /**
     * Update dashboard
     */
    updateDashboard() {
        Charts.updateDashboardStats(this.allGradingResults);
    },

    /**
     * Update statistics
     */
    updateStatistics() {
        Charts.updateStatistics(this.allGradingResults);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});