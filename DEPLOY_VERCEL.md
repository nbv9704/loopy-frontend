# Deploy Frontend lên Vercel

## Bước 1: Chuẩn bị

### 1.1. Đảm bảo code đã push lên GitHub

```bash
git status
git push origin master
```

### 1.2. Kiểm tra build locally

```bash
npm run build
npm run preview
```

## Bước 2: Tạo tài khoản Vercel (nếu chưa có)

1. Truy cập: https://vercel.com/signup
2. Chọn "Continue with GitHub"
3. Authorize Vercel truy cập GitHub của bạn

## Bước 3: Import Project

### 3.1. Từ Vercel Dashboard

1. Click "Add New..." → "Project"
2. Chọn "Import Git Repository"
3. Tìm và chọn `loopy-frontend`
4. Click "Import"

### 3.2. Configure Project

**Framework Preset:** Vite (Vercel sẽ tự detect)
**Root Directory:** `./` (để mặc định)
**Build Command:** `npm run build` (hoặc để mặc định)
**Output Directory:** `dist` (Vercel tự detect)
**Install Command:** `npm install` (để mặc định)

## Bước 4: Thêm Environment Variables

Click "Environment Variables" và thêm các biến sau:

### Required Variables:

```
# Backend API URL (từ backend đã deploy)
VITE_API_URL=https://loopy-backend-xxx.vercel.app

# Supabase (lấy từ Supabase Dashboard)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Lưu ý:**

- `VITE_API_URL` phải là URL backend đã deploy (không có trailing slash)
- Thay `your-project.supabase.co` bằng URL Supabase thật
- Thay `your-anon-key` bằng anon key từ Supabase

### Lấy Supabase Keys:

1. Truy cập: https://supabase.com/dashboard
2. Chọn project của bạn
3. Settings → API
4. Copy "Project URL" và "anon public" key

## Bước 5: Deploy

1. Click "Deploy"
2. Đợi build hoàn thành (2-3 phút)
3. Sau khi deploy xong, bạn sẽ có URL: `https://loopy-frontend-xxx.vercel.app`

## Bước 6: Update Backend CORS

Sau khi có URL frontend, cần update backend:

1. Vào Vercel Dashboard của **Backend**
2. Settings → Environment Variables
3. Tìm `FRONTEND_URL`
4. Update thành: `https://loopy-frontend-xxx.vercel.app`
5. Click "Save"
6. Redeploy backend: Deployments → Latest → "..." → "Redeploy"

## Bước 7: Verify Deployment

### 7.1. Test Frontend

Mở browser và truy cập:

```
https://loopy-frontend-xxx.vercel.app
```

### 7.2. Test Authentication

1. Click "Sign Up" hoặc "Login"
2. Thử đăng ký/đăng nhập
3. Verify có kết nối được với backend

### 7.3. Test PvP

1. Navigate to PvP section
2. Create a match
3. Verify Socket.IO connection

## Bước 8: Setup Custom Domain (Optional)

1. Settings → Domains
2. Add domain: `yourdomain.com` hoặc `www.yourdomain.com`
3. Follow DNS configuration instructions:
   - Type: A Record
   - Name: @ (hoặc www)
   - Value: 76.76.21.21 (Vercel IP)
4. Wait for DNS propagation (5-30 phút)

## Bước 9: Configure Supabase Redirect URLs

Sau khi có domain, cần update Supabase:

1. Truy cập Supabase Dashboard
2. Authentication → URL Configuration
3. Add Redirect URLs:
   ```
   https://loopy-frontend-xxx.vercel.app
   https://loopy-frontend-xxx.vercel.app/auth/callback
   https://yourdomain.com (nếu có custom domain)
   https://yourdomain.com/auth/callback
   ```
4. Site URL: `https://loopy-frontend-xxx.vercel.app`

## Troubleshooting

### Build Failed

**Lỗi:** TypeScript errors
**Fix:**

```bash
# Check locally
npm run build

# Fix errors rồi push lại
git add .
git commit -m "fix: build errors"
git push
```

### API Connection Failed

**Lỗi:** Cannot connect to backend
**Fix:**

1. Check `VITE_API_URL` đã đúng chưa
2. Check backend có đang chạy không
3. Check CORS đã config đúng chưa

### Socket.IO Not Working

**Lỗi:** Real-time features không hoạt động
**Note:** Vercel serverless có thể không support WebSocket tốt
**Fix:** Consider deploy backend lên Railway hoặc Render

### Authentication Failed

**Lỗi:** Cannot login/signup
**Fix:**

1. Check Supabase keys đã đúng chưa
2. Check Redirect URLs trong Supabase
3. Check browser console for errors

### 404 on Refresh

**Lỗi:** Page not found khi refresh
**Fix:** Vercel tự động handle SPA routing, không cần config thêm

## Performance Optimization

### 1. Enable Compression

Vercel tự động enable gzip/brotli compression

### 2. Image Optimization

Nếu có nhiều images, consider dùng Vercel Image Optimization:

```tsx
import Image from 'next/image' // Nếu dùng Next.js
```

### 3. Code Splitting

Vite đã tự động code splitting, không cần config thêm

### 4. Caching

Vercel tự động cache static assets (CSS, JS, images)

## Monitoring

### 1. Analytics

1. Settings → Analytics
2. Enable Web Analytics
3. View traffic, performance metrics

### 2. Logs

1. Deployments → Latest → "View Function Logs"
2. Check errors, warnings

### 3. Performance

1. Speed Insights (Pro plan)
2. Core Web Vitals monitoring

## Environment-Specific Builds

Nếu cần build khác nhau cho staging/production:

### Staging:

```
VITE_API_URL=https://loopy-backend-staging.vercel.app
```

### Production:

```
VITE_API_URL=https://api.yourdomain.com
```

## Automatic Deployments

Vercel tự động deploy khi:

- Push to `master` branch → Production
- Push to other branches → Preview deployments
- Pull requests → Preview deployments

Disable auto-deploy:

1. Settings → Git
2. Uncheck "Production Branch"

## Notes

- Vercel free plan: 100GB bandwidth/month
- Build time: ~2-3 phút
- Deploy time: ~30 giây
- SSL certificate: Tự động (Let's Encrypt)
- CDN: Global edge network

## Next Steps

1. ✅ Deploy backend
2. ✅ Deploy frontend
3. ✅ Update CORS
4. ✅ Test authentication
5. ✅ Test PvP features
6. 🔄 Setup custom domain (optional)
7. 🔄 Enable analytics (optional)
8. 🔄 Setup monitoring (optional)
