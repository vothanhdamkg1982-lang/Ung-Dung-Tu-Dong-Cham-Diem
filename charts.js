/**
 * charts.js - Data Visualization
 * Handles chart rendering using Chart.js
 */

const Charts = {
    charts: {},

    /**
     * Create score distribution chart
     */
    createScoreChart(results) {
        const ctx = document.getElementById('score-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.scoreChart) {
            this.charts.scoreChart.destroy();
        }

        // Group scores into ranges
        const ranges = {
            '0-2': 0, '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0
        };

        results.forEach(result => {
            const score = parseFloat(result.finalScore);
            if (score < 2) ranges['0-2']++;
            else if (score < 4) ranges['2-4']++;
            else if (score < 6) ranges['4-6']++;
            else if (score < 8) ranges['6-8']++;
            else ranges['8-10']++;
        });

        this.charts.scoreChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(ranges),
                datasets: [{
                    label: 'Số lượng bài',
                    data: Object.values(ranges),
                    backgroundColor: [
                        '#f44336', '#ff9800', '#ffc107', '#8bc34a', '#4caf50'
                    ],
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: Math.max(...Object.values(ranges)) + 1
                    }
                }
            }
        });
    },

    /**
     * Create statistics chart
     */
    createStatsChart(results) {
        const ctx = document.getElementById('stats-chart');
        if (!ctx) return;

        if (this.charts.statsChart) {
            this.charts.statsChart.destroy();
        }

        const stats = Grading.getStatistics(results);

        this.charts.statsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Đạt (≥5)', 'Chưa đạt (<5)'],
                datasets: [{
                    data: [stats.passRate, stats.failRate],
                    backgroundColor: ['#4caf50', '#f44336'],
                    borderColor: ['#45a049', '#d32f2f'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Update dashboard stats
     */
    updateDashboardStats(results) {
        const stats = Grading.getStatistics(results);

        document.getElementById('total-graded').textContent = stats.totalGraded;
        document.getElementById('avg-score').textContent = stats.avgScore;
        document.getElementById('max-score').textContent = stats.maxScore;
        document.getElementById('min-score').textContent = stats.minScore;

        // Update history
        this.updateHistory(results);
        this.createScoreChart(results);
    },

    /**
     * Update grading history
     */
    updateHistory(results) {
        const historyList = document.getElementById('grading-history');
        if (!historyList) return;

        historyList.innerHTML = '';

        const recentResults = results.slice(0, 10);
        recentResults.forEach(result => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            const date = new Date(result.gradedAt);
            const timeStr = Utils.formatDate(date);
            
            const gradeColor = parseFloat(result.finalScore) >= 5 ? '#4caf50' : '#f44336';
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>Điểm: ${result.finalScore}/10</strong>
                        <div class="history-item-time">${timeStr}</div>
                    </div>
                    <div style="color: ${gradeColor}; font-weight: bold; font-size: 18px;">
                        ${result.finalScore >= 5 ? '✓' : '✗'}
                    </div>
                </div>
            `;
            
            historyList.appendChild(item);
        });
    },

    /**
     * Update statistics page
     */
    updateStatistics(results) {
        const stats = Grading.getStatistics(results);

        document.getElementById('pass-rate').textContent = stats.passRate + '%';
        document.getElementById('fail-rate').textContent = stats.failRate + '%';

        // Find most wrong question
        const questionErrors = {};
        results.forEach(result => {
            result.questionResults.forEach(qr => {
                if (qr.status === 'wrong') {
                    const num = qr.questionNumber;
                    questionErrors[num] = (questionErrors[num] || 0) + 1;
                }
            });
        });

        if (Object.keys(questionErrors).length > 0) {
            const mostWrong = Object.keys(questionErrors).reduce((a, b) =>
                questionErrors[a] > questionErrors[b] ? a : b
            );
            document.getElementById('most-wrong-question').textContent = `Câu ${mostWrong}`;
        }

        // Generate keywords cloud
        this.generateKeywordsCloud(results);
        this.createStatsChart(results);
    },

    /**
     * Generate keywords cloud
     */
    generateKeywordsCloud(results) {
        const keywordContainer = document.getElementById('missing-keywords');
        if (!keywordContainer) return;

        keywordContainer.innerHTML = '';

        // Collect all missing keywords
        const keywordCount = {};
        results.forEach(result => {
            result.questionResults.forEach(qr => {
                qr.missingKeywords.forEach(keyword => {
                    keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
                });
            });
        });

        // Sort and get top 10
        const topKeywords = Object.entries(keywordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (topKeywords.length === 0) {
            keywordContainer.textContent = 'Không có từ khóa thiếu sót';
            return;
        }

        topKeywords.forEach(([keyword, count]) => {
            const tag = document.createElement('div');
            tag.className = 'keyword-tag';
            tag.textContent = `${keyword} (${count})`;
            keywordContainer.appendChild(tag);
        });
    },

    /**
     * Destroy all charts
     */
    destroyAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
};
