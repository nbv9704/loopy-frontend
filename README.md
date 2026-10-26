# Loopy Frontend

Loopy Frontend là ứng dụng web dành cho người học lập trình trên nền tảng Loopy. Ứng dụng tập trung vào trải nghiệm newbie-first: học theo lộ trình có hướng dẫn, thực hành trực tiếp trong trình soạn thảo code, chạy thử kết quả, kiểm tra bài làm và theo dõi tiến độ học tập.

## Vai trò trong hệ thống

Frontend chịu trách nhiệm cung cấp giao diện người dùng cho các luồng chính:

- Đăng ký, đăng nhập và quản lý phiên người dùng.
- Khám phá lộ trình học, chương học và bài học.
- Thực hành code trong editor tích hợp.
- Chạy thử code và hiển thị output.
- Gửi bài để backend kiểm tra bằng checker/test case.
- Theo dõi tiến độ học tập, streak, điểm và các chỉ số cá nhân.
- Tham gia PvP coding match theo thời gian thực qua Socket.IO.
- Giao diện quản trị nội dung và dashboard vận hành.

## Công nghệ chính

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Socket.IO Client
- CodeMirror
- i18next

## Hướng dẫn cài đặt

- [Cài đặt và chạy local](./INSTALL.vi.md)

Tài liệu nghiệp vụ và vận hành dùng chung tại [mục lục dự án](../docs/README.md); không duy trì bản sao audit/roadmap riêng trong repo app.

## Liên kết liên quan

- Backend API: `../loopy-backend`
- Kiểm tra local: `yarn lint:strict && yarn build && yarn test`.
- Test types: `yarn test:types`; browser: `yarn playwright install chromium` rồi `yarn test:e2e` (mock mọi API, không dùng DB thật).
- Dev Login mặc định ẩn. Chỉ dùng `VITE_ENABLE_DEV_LOGIN=true` với backend đã cho phép trên DB development riêng; xem backend INSTALL trước khi bật.
- English là mặc định; preference VI được giữ. Khởi động/đổi ngôn ngữ chuẩn bị toàn bộ interface copy và route modules qua màn loading chung, giữ bản nháp khi chuyển locale. Chi tiết [kiến trúc](../docs/ARCHITECTURE.md) và [CMS cache](../docs/CMS_WORKFLOW.md).
- License: [LICENSE](./LICENSE)

## License

Dự án sử dụng MIT License. Xem chi tiết tại [LICENSE](./LICENSE).
