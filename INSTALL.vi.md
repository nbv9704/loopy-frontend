# Cài đặt Loopy Frontend

Tài liệu này hướng dẫn chạy frontend Loopy trên máy local.

## Yêu cầu

- Node.js 22.x khuyến nghị theo backend runtime hiện tại.
- Yarn Classic 1.22.x.
- Backend Loopy đang chạy tại `http://localhost:3000` hoặc URL tương đương.

## 1. Cài dependencies

Chạy trong thư mục `loopy-frontend`:

```powershell
yarn install --frozen-lockfile
```

## 2. Cấu hình môi trường

Copy `.env.example` thành `.env.local`, rồi cấu hình:

```env
VITE_API_URL=http://localhost:3000
```

Ghi chú:

- `VITE_API_URL` phải trỏ tới backend Loopy.
- Khi deploy production, biến này phải trỏ tới backend public URL.
- Dùng origin, ví dụ `https://api.example.com`, không thêm `/api`, query, hash hoặc credentials. Dấu `/` cuối được chuẩn hóa. REST/Socket.IO dùng cùng origin.
- Build kiểm tra cấu hình trước khi tạo bundle; thiếu/sai URL hoặc có biến `VITE_*` ngoài các setting được app dùng sẽ dừng. Không đặt service key, Redis hoặc AI key trong frontend env.
- Metadata `VITE_VERCEL_*` được nền tảng tự thêm được nhận diện theo danh sách trong validator; chúng không được đưa vào `envPrefix` của app. Biến lạ hoặc key nhạy cảm vẫn bị chặn, không bỏ toàn bộ kiểm tra env để deploy.
- Production yêu cầu HTTPS (HTTP localhost dành cho preview local) và `VITE_ENABLE_DEV_LOGIN=false`. Thay URL sau build cần build lại.

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
yarn lint:strict && yarn test:types && yarn build && yarn test
```

## 5. Build production

```powershell
yarn build
```

Kết quả build nằm trong thư mục `dist/`.

Trên Vercel, `vercel.json` quy định Install Command là `yarn install --frozen-lockfile`, Build Command là `yarn build` và Output Directory là `dist`. Chỉ giữ `yarn.lock`; không tạo hoặc commit `package-lock.json`. Cấu hình `VITE_API_URL` thành origin HTTPS của backend và `VITE_ENABLE_DEV_LOGIN=false` trong môi trường Production/Preview phù hợp. Node.js 22.x trong `package.json` được ưu tiên hơn phiên bản ở Project Settings; cảnh báo khác phiên bản này không phải lỗi build.

Xem quy trình bàn giao ở `../docs/RELEASE.md`. Gói source không chứa dependencies, `dist` hay `.env` thật; cài/build trên host đích. Dùng `yarn preview` để xem output local, không dùng Vite dev/preview làm production server.

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
