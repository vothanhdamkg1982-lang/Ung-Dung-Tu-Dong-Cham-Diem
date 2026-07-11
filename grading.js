/**
 * grading.js - AI Grading Logic
 * Handles automatic grading with similarity scoring and feedback generation
 */

const Grading = {
    /**
     * Grade student work
     */
    async gradeWork(studentText, answerKey, settings = {}) {
        try {
            const severity = settings.severity || 'medium';
            const similarityThreshold = settings.similarityThreshold || 75;
            
            const results = {
                id: Utils.generateId(),
                totalScore: 0,
                maxScore: 0,
                questionResults: [],
                feedback: '',
                severity,
                threshold: similarityThreshold,
                gradedAt: new Date()
            };

            // Parse student text by questions
            const studentAnswers = this.parseStudentAnswers(studentText);
            
            // Grade each question
            for (let i = 0; i < answerKey.length; i++) {
                const question = answerKey[i];
                const studentAnswer = studentAnswers[i] || '';
                
                const questionResult = this.gradeQuestion(
                    question,
                    studentAnswer,
                    similarityThreshold,
                    severity
                );
                
                results.questionResults.push({
                    questionNumber: i + 1,
                    ...questionResult
                });
                
                results.totalScore += questionResult.score;
                results.maxScore += question.points;
            }

            // Convert to 10-point scale
            results.finalScore = this.convertToScale(results.totalScore, results.maxScore, 10);
            results.percentage = (results.totalScore / results.maxScore) * 100;
            
            // Generate AI feedback
            results.feedback = this.generateFeedback(
                results.questionResults,
                results.finalScore,
                results.percentage
            );

            return results;
        } catch (error) {
            console.error('Grading error:', error);
            Utils.notify('Lỗi chấm bài', 'error');
            return null;
        }
    },

    /**
     * Parse student answers from text
     */
    parseStudentAnswers(text) {
        // Simple parsing: split by common patterns
        const answers = [];
        const lines = text.split('\n').filter(l => l.trim());
        
        let currentAnswer = '';
        for (const line of lines) {
            // Check if line is a question number (Câu 1:, Question 1:, etc.)
            if (/^(câu|question|q)\s*\d+[\s:]/i.test(line)) {
                if (currentAnswer) answers.push(currentAnswer.trim());
                currentAnswer = line.replace(/^(câu|question|q)\s*\d+[\s:]/i, '').trim();
            } else {
                currentAnswer += ' ' + line;
            }
        }
        if (currentAnswer) answers.push(currentAnswer.trim());
        
        return answers;
    },

    /**
     * Grade individual question
     */
    gradeQuestion(question, studentAnswer, threshold, severity) {
        const normalizedAnswer = Utils.normalizeText(studentAnswer);
        const normalizedExpected = Utils.normalizeText(question.answer);
        
        // Calculate similarity
        let similarity = Utils.calculateSimilarity(question.answer, studentAnswer);
        
        // Adjust threshold based on severity
        let adjustedThreshold = threshold;
        if (severity === 'easy') {
            adjustedThreshold = threshold - 15;
        } else if (severity === 'hard') {
            adjustedThreshold = threshold + 15;
        }
        
        // Determine result
        let status = 'wrong';
        let score = 0;
        
        if (similarity >= 95) {
            status = 'correct';
            score = question.points;
        } else if (similarity >= adjustedThreshold) {
            status = 'partial';
            score = question.points * 0.5;
        } else if (similarity >= adjustedThreshold - 20) {
            status = 'partial';
            score = question.points * 0.3;
        }
        
        // Find missing keywords
        const expectedKeywords = Utils.extractKeywords(question.answer);
        const studentKeywords = Utils.extractKeywords(studentAnswer);
        const missingKeywords = expectedKeywords.filter(k => !studentKeywords.includes(k));
        
        return {
            question: question.question,
            expectedAnswer: question.answer,
            studentAnswer,
            similarity: similarity.toFixed(1),
            status,
            score,
            maxScore: question.points,
            missingKeywords,
            percentageScore: ((score / question.points) * 100).toFixed(0)
        };
    },

    /**
     * Convert score to scale
     */
    convertToScale(score, maxScore, scale = 10) {
        const percentage = (score / maxScore) * 100;
        return ((percentage / 100) * scale).toFixed(1);
    },

    /**
     * Generate AI feedback
     */
    generateFeedback(results, finalScore, percentage) {
        let feedback = '';
        
        // Overall assessment
        if (percentage >= 85) {
            feedback += '✓ Em nắm rất tốt kiến thức bài học. ';
        } else if (percentage >= 70) {
            feedback += '✓ Em nắm khá tốt kiến thức bài học. ';
        } else if (percentage >= 50) {
            feedback += '△ Em nắm được phần nào kiến thức nhưng cần cải thiện. ';
        } else {
            feedback += '✗ Em cần ôn lại và luyện thêm kiến thức bài học. ';
        }
        
        feedback += '\n\n📝 Chi tiết:\n';
        
        // Find wrong answers
        const wrongAnswers = results.filter(r => r.status === 'wrong');
        const partialAnswers = results.filter(r => r.status === 'partial');
        
        if (wrongAnswers.length > 0) {
            feedback += `- Câu sai: ${wrongAnswers.map(r => `Câu ${r.questionNumber}`).join(', ')}\n`;
        }
        
        if (partialAnswers.length > 0) {
            feedback += `- Câu cần xem lại: ${partialAnswers.map(r => `Câu ${r.questionNumber}`).join(', ')}\n`;
        }
        
        // Missing keywords
        const allMissing = [];
        results.forEach(r => {
            allMissing.push(...r.missingKeywords);
        });
        
        if (allMissing.length > 0) {
            const uniqueMissing = [...new Set(allMissing)].slice(0, 3);
            feedback += `- Từ khóa thiếu sót: ${uniqueMissing.join(', ')}\n`;
        }
        
        // Suggestions
        if (percentage < 60) {
            feedback += '\n💡 Gợi ý:\n- Đọc lại bài học\n- Làm thêm bài tập tương tự\n- Hỏi giáo viên nếu chưa hiểu\n';
        } else if (percentage < 80) {
            feedback += '\n💡 Gợi ý:\n- Chú ý cách trình bày đáp án\n- Luyện thêm để nâng điểm\n';
        } else {
            feedback += '\n💡 Tiếp tục giữ vững kết quả!\n';
        }
        
        return feedback;
    },

    /**
     * Get statistics from results
     */
    getStatistics(results) {
        if (!results || results.length === 0) {
            return {
                totalGraded: 0,
                avgScore: 0,
                maxScore: 0,
                minScore: 0,
                passRate: 0,
                failRate: 0
            };
        }
        
        const scores = results.map(r => parseFloat(r.finalScore));
        const passed = scores.filter(s => s >= 5).length;
        
        return {
            totalGraded: results.length,
            avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
            maxScore: Math.max(...scores),
            minScore: Math.min(...scores),
            passRate: ((passed / results.length) * 100).toFixed(1),
            failRate: (((results.length - passed) / results.length) * 100).toFixed(1)
        };
    }
};

/**
 * Feedback generator with AI-like suggestions
 */
const FeedbackGenerator = {
    /**
     * Generate comment based on score
     */
    generateComment(score, percentage) {
        const comments = {
            excellent: [
                'Em làm bài rất tốt, nắm vững kiến thức và cách trình bày đạo.',
                'Tuyệt vời! Em đã hiểu sâu sắc nội dung bài học.',
                'Xuất sắc! Em là tấm gương tốt cho cả lớp.'
            ],
            good: [
                'Em làm bài khá tốt, hiểu rõ nội dung chính của bài học.',
                'Tốt! Em nắm được kiến thức cơ bản của bài.',
                'Rất tốt! Chỉ cần chú ý thêm một số chi tiết nhỏ.'
            ],
            average: [
                'Em làm bài có được một số nội dung đúng nhưng cần cải thiện.',
                'Cần nỗ lực hơn để hiểu rõ kiến thức bài học.',
                'Em đang tiến bộ, hãy ôn lại và luyện thêm.'
            ],
            poor: [
                'Em cần ôn lại kỹ kiến thức bài học.',
                'Hãy đọc kỹ lý thuyết và làm thêm bài tập.',
                'Em cần sự hỗ trợ thêm để hiểu rõ nội dung.'
            ]
        };
        
        let category = 'poor';
        if (percentage >= 85) category = 'excellent';
        else if (percentage >= 70) category = 'good';
        else if (percentage >= 50) category = 'average';
        
        return comments[category][Math.floor(Math.random() * comments[category].length)];
    },

    /**
     * Generate suggestions for improvement
     */
    generateSuggestions(questionResults) {
        const suggestions = [];
        
        const wrongQuestions = questionResults.filter(r => r.status === 'wrong');
        if (wrongQuestions.length > 0) {
            suggestions.push(`Xem lại câu ${wrongQuestions.map(q => q.questionNumber).join(', ')}`);
        }
        
        const allMissing = [];
        questionResults.forEach(r => {
            allMissing.push(...r.missingKeywords);
        });
        
        if (allMissing.length > 0) {
            const unique = [...new Set(allMissing)].slice(0, 2);
            suggestions.push(`Cần bổ sung: ${unique.join(', ')}`);
        }
        
        return suggestions;
    }
};
