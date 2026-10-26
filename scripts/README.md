# Scripts frontend

`smoke-production.mjs` kiểm compiled bundle qua `yarn test:production`, dùng API fixture và preview riêng; không chứng nhận backend/production. Xem [release](../../docs/RELEASE.md).

`sync-content-i18n.js` là utility legacy ghi trực tiếp locale JSON từ collection API; không dùng trong CI/prebuild mặc định. Script còn limit1000 và không đọc toàn bộ pages, nên không dùng làm nguồn CMS/fallback đầy đủ. CMS runtime dùng batch/cache/fallback theo [CMS workflow](../../docs/CMS_WORKFLOW.md). Muốn bảo trì utility phải review pagination/metadata và diff locale trước khi ghi.
