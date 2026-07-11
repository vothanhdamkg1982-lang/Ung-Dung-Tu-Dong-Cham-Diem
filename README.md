# 🎯 Thầy Chấm - Ứng dụng Chấm Bài Tự Động Bằng AI

Một ứng dụng web hoàn chỉnh để chấm bài tự động sử dụng AI, OCR, và phân tích tương đồng văn bản. Được xây dựng bằng HTML5, CSS3, và JavaScript ES6+ - không cần backend!

## ✨ Tính Năng Chính

### 📋 Quản Lý Đáp Án
- Upload đáp án từ DOCX, PDF, hoặc TXT
- Nhập đáp án trực tiếp với trình soạn thảo
- Lưu ngân hàng đáp án
- Xem trước và chỉnh sửa

### 📸 Upload Bài Làm
- Chụp ảnh trực tiếp từ webcam
- Upload từ thư mục máy tính
- Hỗ trợ hình ảnh và PDF
- Xử lý hình ảnh: xoay, cắt, làm nét, tương phản, xóa nền

### 🤖 Nhận Dạng Và Chấm Điểm
- OCR hỗ trợ tiếng Việt sử dụng Tesseract.js
- Phân tích tương đồng văn bản thông minh
- Điều chỉnh mức độ nghiêm khắc (Dễ, Trung bình, Nghiêm)
- Phân loại kết quả: Đúng, Tạm được, Sai

### 💬 Nhận Xét AI
- Sinh nhận xét tự động dựa trên kết quả chấm
- Gợi ý từ khóa thiếu sót
- Biên soạn nhận xét trước khi lưu

### 📊 Thống Kê Và Phân Tích
- Dashboard với 4 chỉ số chính
- Biểu đồ phân bố điểm
- Tỷ lệ đạt/chưa đạt
- Câu hỏi sai nhiều nhất
- Từ khóa thiếu sót

### 📤 Xuất Kết Quả
- PDF: Kết quả chi tiết có định dạng
- Excel: Bảng tính dễ xử lý
- CSV: Đơn giản và mở rộng
- In trực tiếp từ trình duyệt

### 💾 Lưu Trữ Dữ Liệu
- IndexedDB: Lưu trữ lớn, cấu trúc hóa
- LocalStorage: Cài đặt và tùy chỉnh
- Sao lưu/Khôi phục JSON
- Xóa dữ liệu toàn bộ

## 🎨 Giao Diện

- **Material Design**: Hiện đại và chuyên nghiệp
- **Dark Mode**: Hỗ trợ chế độ tối/sáng
- **Responsive**: Hoạt động tốt trên máy tính, tablet, điện thoại
- **Smooth Animations**: Hiệu ứng chuyển động mượt mà

## 🚀 Cách Sử Dụng

### 1. Mở ứng dụng
```
- Mở file index.html trong trình duyệt (Chrome, Firefox, Edge khuyến nghị)
- Hoặc host trên web server
```

### 2. Tạo đáp án
```
- Vào mục "Đáp án"
- Upload file hoặc nhập trực tiếp
- Lưu đáp án
```

### 3. Upload bài làm
```
- Vào mục "Upload bài"
- Chụp ảnh hoặc upload tệp
- Xử lý hình ảnh nếu cần
```

### 4. Chấm bài
```
- Vào mục "Chấm bài"
- Điều chỉnh mức độ nghiêm khắc và ngưỡng tương đồng
- Nhấn "Bắt đầu chấm bài"
```

### 5. Xem kết quả
```
- Kết quả hiển thị tự động sau khi chấm
- Chỉnh sửa nhận xét nếu cần
- Xuất kết quả (PDF, Excel, CSV, In)
```

### 6. Xem thống kê
```
- Vào mục "Thống kê"
- Xem biểu đồ và phân tích chi tiết
```

## 📁 Cấu Trúc File

```
project/
├── index.html          # File HTML chính
├── style.css           # Stylesheet với Dark Mode
├── app.js              # Controller chính
├── utils.js            # Hàm tiện ích (normalize text, similarity, etc)
├── storage.js          # IndexedDB & LocalStorage management
├── ocr.js              # Tesseract.js OCR & Image processing
├── grading.js          # Logic chấm điểm & sinh feedback
├── charts.js           # Chart.js visualizations
├── export.js           # Export PDF, Excel, CSV
└── README.md          # File hướng dẫn này
```

## 🔧 Công Nghệ Sử Dụng

### Thư viện JavaScript
- **Tesseract.js**: OCR - nhận dạng văn bản
- **pdf.js**: Đọc file PDF
- **mammoth.js**: Đọc file DOCX
- **Chart.js**: Biểu đồ và visualizations
- **SheetJS**: Xuất Excel
- **jsPDF**: Xuất PDF
- **html2canvas**: Chụp màn hình

### API Trình Duyệt
- **IndexedDB**: Lưu trữ dữ liệu có cấu trúc
- **LocalStorage**: Lưu cài đặt
- **File API**: Xử lý file
- **Canvas API**: Xử lý hình ảnh
- **MediaDevices API**: Truy cập webcam

## 💡 Thuật Toán Chấm Điểm

1. **Chuẩn hóa văn bản**
   - Chuyển về chữ thường
   - Loại bỏ dấu thanh (mã hóa Unicode)
   - Xóa khoảng trắng thừa

2. **Tính tương đồng**
   - Sử dụng Levenshtein distance
   - Tính phần trăm tương đồng (0-100%)

3. **Phân loại kết quả**
   - Đúng: tương đồng ≥ 95%
   - Tạm được: tương đồng ≥ ngưỡng (điều chỉnh)
   - Sai: tương đồng < ngưỡng

4. **Điều chỉnh theo mức độ nghiêm khắc**
   - Dễ: Ngưỡng - 15%
   - Trung bình: Ngưỡng gốc
   - Nghiêm: Ngưỡng + 15%

5. **Sinh feedback**
   - Tự động nhận xét dựa trên kết quả
   - Gợi ý từ khóa thiếu sót
   - Đề xuất cải thiện

## ⚙️ Cài Đặt & Điều Chỉnh

### Ngưỡng Tương Đồng
- Default: 75%
- Range: 30% - 100%
- Điều chỉnh dễ dàng trong giao diện

### Mức Độ Nghiêm Khắc
- **Dễ**: Cho học sinh cơ bản
- **Trung bình**: Cân bằng (khuyên)
- **Nghiêm**: Cho học sinh nâng cao

### Dark Mode
- Tự động lưu lựa chọn
- Nút chuyển đổi ở góc trên phải

## 🌐 Trình Duyệt Hỗ Trợ

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📝 Lưu Ý Quan Trọng

1. **OCR có thể chậm** - Tesseract.js xử lý trên trình duyệt, mất vài giây
2. **Chất lượng OCR** - Phụ thuộc vào chất lượng hình ảnh, nên chụp ảnh rõ
3. **Dữ liệu cục bộ** - Tất cả dữ liệu lưu trên máy của bạn, không upload lên server
4. **Sao lưu định kỳ** - Khuyên sao lưu dữ liệu thường xuyên

## 🚀 Phát Triển Tương Lai

- [ ] Tích hợp API Claude/OpenAI để nâng cao feedback
- [ ] Hỗ trợ thêm ngôn ngữ
- [ ] Tích hợp Firebase cho đa thiết bị
- [ ] App di động (React Native)
- [ ] Nhận dạng chữ viết tay
- [ ] Hỗ trợ bài trắc nghiệm

## 🐛 Báo Cáo Lỗi

Nếu gặp vấn đề:
1. Kiểm tra bảng điều khiển (F12)
2. Xóa cache trình duyệt
3. Thử trình duyệt khác
4. Khôi phục dữ liệu mặc định

## 📄 License

Mã nguồn tự do sử dụng và phát triển

## 👨‍💼 Tác Giả

Được xây dựng bằng tình yêu cho những giáo viên Việt Nam ❤️

---

**Thầy Chấm** - Giúp giáo viên tiết kiệm thời gian, chấm bài nhanh, chính xác và công bằng!

v1.0.0 - 2024
