# Cài đặt Loopy Frontend

Tài liệu này hướng dẫn chạy frontend Loopy trên máy local.

## Yêu cầu

- Node.js 22.x khuyến nghị theo backend runtime hiện tại.
- Yarn.
- Backend Loopy đang chạy tại `http://localhost:3000` hoặc URL tương đương.

## 1. Cài dependencies

Chạy trong thư mục `loopy-frontend`:

```powershell
yarn install
```

## 2. Cấu hình môi trường

Tạo hoặc cập nhật file `.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

Ghi chú:

- `VITE_API_URL` phải trỏ tới backend Loopy.
- Khi deploy production, biến này phải trỏ tới backend public URL.

## 3. Chạy môi trường development

```powershell
yarn dev
```

Mặc định Vite sẽ mở frontend tại:

```txt
http://localhost:5173
```

## 4. Kiểm tra chất lượng trước khi commit

```powershell
yarn lint:strict && yarn build
```

## 5. Build production

```powershell
yarn build
```

Kết quả build nằm trong thư mục `dist/`.

## Lỗi thường gặp

### Không đăng nhập được hoặc request bị lỗi CORS

Kiểm tra:

- Backend có đang chạy không.
- `VITE_API_URL` có đúng URL backend không.
- Backend đã cấu hình `FRONTEND_URL=http://localhost:5173` chưa.

### Socket PvP không kết nối

Kiểm tra:

- Người dùng đã đăng nhập.
- Backend Socket.IO đang chạy cùng API server.
- Cookie auth được gửi kèm request (`withCredentials`).
