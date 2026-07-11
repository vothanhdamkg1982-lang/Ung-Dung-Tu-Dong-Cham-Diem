/**
 * export.js - Export Functionality
 * Handles exporting results to PDF, Excel, Word, and CSV formats
 */

const Export = {
    /**
     * Export to PDF
     */
    async exportToPDF(result) {
        try {
            Utils.showLoading('Đang tạo PDF...');
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Vietnamese font
            doc.setFont('helvetica');
            
            // Title
            doc.setFontSize(18);
            doc.text('Kết Quả Chấm Bài', 105, 15, { align: 'center' });
            
            // Date
            doc.setFontSize(10);
            doc.text(`Ngày: ${Utils.formatDate(result.gradedAt)}`, 20, 25);
            
            // Score
            doc.setFontSize(14);
            doc.setTextColor(33, 150, 243);
            doc.text(`Điểm: ${result.finalScore}/10 (${result.percentage.toFixed(1)}%)`, 20, 35);
            
            // Feedback
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.text('Nhận xét:', 20, 50);
            
            const feedbackLines = doc.splitTextToSize(result.feedback, 170);
            doc.setFontSize(9);
            doc.text(feedbackLines, 20, 55);
            
            let yPosition = 55 + feedbackLines.length * 4;
            
            // Question results
            if (yPosition > 220) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFontSize(11);
            doc.text('Chi tiết từng câu:', 20, yPosition + 10);
            yPosition += 15;
            
            result.questionResults.forEach((qr, index) => {
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                const statusText = qr.status === 'correct' ? '✓ Đúng' :
                                  qr.status === 'partial' ? '△ Tạm được' : '✗ Sai';
                const statusColor = qr.status === 'correct' ? [76, 175, 80] :
                                   qr.status === 'partial' ? [255, 152, 0] : [244, 67, 54];
                
                doc.setTextColor(...statusColor);
                doc.setFontSize(10);
                doc.text(`Câu ${qr.questionNumber}: ${statusText} (${qr.percentageScore}%)`, 20, yPosition);
                yPosition += 5;
                
                doc.setTextColor(0);
                doc.setFontSize(8);
                const answerLines = doc.splitTextToSize(qr.studentAnswer, 170);
                doc.text('Trả lời: ' + answerLines.join(' '), 25, yPosition);
                yPosition += answerLines.length * 3 + 3;
            });
            
            const filename = `Ket_qua_cham_${new Date().getTime()}.pdf`;
            doc.save(filename);
            
            Utils.hideLoading();
            Utils.notify('Xuất PDF thành công', 'success');
        } catch (error) {
            console.error('PDF export error:', error);
            Utils.hideLoading();
            Utils.notify('Lỗi xuất PDF', 'error');
        }
    },

    /**
     * Export to Excel
     */
    exportToExcel(result) {
        try {
            Utils.showLoading('Đang tạo Excel...');
            
            const data = [
                ['Kết Quả Chấm Bài'],
                [],
                ['Ngày chấm:', Utils.formatDate(result.gradedAt)],
                ['Điểm:', `${result.finalScore}/10`],
                ['Phần trăm:', `${result.percentage.toFixed(1)}%`],
                [],
                ['Câu', 'Kết quả', 'Điểm', 'Tương đồng (%)', 'Trả lời của học sinh']
            ];

            result.questionResults.forEach(qr => {
                data.push([
                    qr.questionNumber,
                    qr.status === 'correct' ? 'Đúng' : qr.status === 'partial' ? 'Tạm' : 'Sai',
                    `${qr.score}/${qr.maxScore}`,
                    qr.similarity,
                    qr.studentAnswer
                ]);
            });

            data.push([]);
            data.push(['Nhận xét:']);
            const feedbackLines = result.feedback.split('\n');
            feedbackLines.forEach(line => {
                data.push([line]);
            });

            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Kết quả');

            const filename = `Ket_qua_cham_${new Date().getTime()}.xlsx`;
            XLSX.writeFile(wb, filename);

            Utils.hideLoading();
            Utils.notify('Xuất Excel thành công', 'success');
        } catch (error) {
            console.error('Excel export error:', error);
            Utils.hideLoading();
            Utils.notify('Lỗi xuất Excel', 'error');
        }
    },

    /**
     * Export to CSV
     */
    exportToCSV(result) {
        try {
            let csv = 'Kết Quả Chấm Bài\n\n';
            csv += `Ngày chấm,${Utils.formatDate(result.gradedAt)}\n`;
            csv += `Điểm,${result.finalScore}/10\n`;
            csv += `Phần trăm,${result.percentage.toFixed(1)}%\n\n`;
            csv += 'Câu,Kết quả,Điểm,Tương đồng (%),Trả lời của học sinh\n';

            result.questionResults.forEach(qr => {
                const status = qr.status === 'correct' ? 'Đúng' :
                              qr.status === 'partial' ? 'Tạm' : 'Sai';
                const answer = `"${qr.studentAnswer.replace(/"/g, '""')}"`;
                csv += `${qr.questionNumber},${status},${qr.score}/${qr.maxScore},${qr.similarity},${answer}\n`;
            });

            csv += '\nNhận xét:\n';
            csv += result.feedback.replace(/\n/g, '\n');

            const filename = `Ket_qua_cham_${new Date().getTime()}.csv`;
            Utils.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
            Utils.notify('Xuất CSV thành công', 'success');
        } catch (error) {
            console.error('CSV export error:', error);
            Utils.notify('Lỗi xuất CSV', 'error');
        }
    },

    /**
     * Print results
     */
    print(result) {
        try {
            const printWindow = window.open('', '_blank');
            
            let html = `
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <title>Kết Quả Chấm Bài</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { text-align: center; color: #2196F3; }
                        .info { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; }
                        .score { font-size: 24px; font-weight: bold; color: #2196F3; }
                        .feedback { background: #fff; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #2196F3; color: white; }
                        .correct { background-color: #e8f5e9; }
                        .partial { background-color: #fff3e0; }
                        .wrong { background-color: #ffebee; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <h1>Kết Quả Chấm Bài</h1>
                    <div class="info">
                        <div>Ngày: ${Utils.formatDate(result.gradedAt)}</div>
                        <div class="score">Điểm: ${result.finalScore}/10 (${result.percentage.toFixed(1)}%)</div>
                    </div>
                    
                    <div class="feedback">
                        <h3>Nhận xét:</h3>
                        <p>${result.feedback.replace(/\n/g, '<br>')}</p>
                    </div>
                    
                    <h3>Chi tiết từng câu:</h3>
                    <table>
                        <tr>
                            <th>Câu</th>
                            <th>Kết quả</th>
                            <th>Điểm</th>
                            <th>Tương đồng (%)</th>
                            <th>Trả lời</th>
                        </tr>
            `;
            
            result.questionResults.forEach(qr => {
                const statusClass = qr.status;
                const statusText = qr.status === 'correct' ? '✓ Đúng' :
                                  qr.status === 'partial' ? '△ Tạm' : '✗ Sai';
                
                html += `
                    <tr class="${statusClass}">
                        <td>Câu ${qr.questionNumber}</td>
                        <td>${statusText}</td>
                        <td>${qr.score}/${qr.maxScore}</td>
                        <td>${qr.similarity}</td>
                        <td>${qr.studentAnswer}</td>
                    </tr>
                `;
            });
            
            html += `
                    </table>
                </body>
                </html>
            `;
            
            printWindow.document.write(html);
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.print();
            }, 250);
            
            Utils.notify('Mở cửa sổ in', 'success');
        } catch (error) {
            console.error('Print error:', error);
            Utils.notify('Lỗi in tài liệu', 'error');
        }
    }
};
