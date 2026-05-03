19:07:12.131 Running build in Washington, D.C., USA (East) – iad1
19:07:12.131 Build machine configuration: 2 cores, 8 GB
19:07:12.251 Cloning github.com/nbv9704/loopy-frontend (Branch: master, Commit: 8b1546a)
19:07:12.252 Previous build caches not available.
19:07:12.775 Cloning completed: 524.000ms
19:07:13.129 Running "vercel build"
19:07:13.872 Vercel CLI 51.6.1
19:07:14.441 Running "install" command: `npm install`...
19:07:17.136 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
19:07:17.507 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
19:07:17.564 npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
19:07:18.279 npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
19:07:18.308 npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
19:08:00.129 npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
19:08:18.182
19:08:18.183 added 368 packages, and audited 369 packages in 1m
19:08:18.183
19:08:18.183 74 packages are looking for funding
19:08:18.183 run `npm fund` for details
19:08:18.340
19:08:18.341 11 vulnerabilities (5 moderate, 6 high)
19:08:18.341
19:08:18.341 To address issues that do not require attention, run:
19:08:18.341 npm audit fix
19:08:18.341
19:08:18.341 To address all issues (including breaking changes), run:
19:08:18.342 npm audit fix --force
19:08:18.342
19:08:18.342 Run `npm audit` for details.
19:08:19.398
19:08:19.399 > loopy-frontend@1.0.0 build
19:08:19.399 > npm run quality:check && tsc && vite build
19:08:19.399
19:08:19.507
19:08:19.508 > loopy-frontend@1.0.0 quality:check
19:08:19.508 > npm run format:check && npm run lint
19:08:19.508
19:08:19.621
19:08:19.621 > loopy-frontend@1.0.0 format:check
19:08:19.622 > prettier --check .
19:08:19.622
19:08:19.719 Checking formatting...
19:08:22.464 All matched files use Prettier code style!
19:08:22.587
19:08:22.587 > loopy-frontend@1.0.0 lint
19:08:22.588 > eslint . --report-unused-disable-directives
19:08:22.588
19:08:27.474
19:08:27.475 /vercel/path0/src/components/admin/auth/AdminAuthManager.tsx
19:08:27.475 22:7 warning Unexpected console statement no-console
19:08:27.475 29:7 warning Unexpected console statement no-console
19:08:27.475 39:9 warning Unexpected console statement no-console
19:08:27.476
19:08:27.476 /vercel/path0/src/components/admin/ui/Modal.example.tsx
19:08:27.476 41:5 warning Unexpected console statement no-console
19:08:27.476
19:08:27.477 /vercel/path0/src/components/admin/ui/Modal.tsx
19:08:27.477 50:6 warning React Hook useEffect has a missing dependency: 'handleClose'. Either include it or remove the dependency array react-hooks/exhaustive-deps
19:08:27.477
19:08:27.477 /vercel/path0/src/components/common/ErrorBoundary.tsx
19:08:27.477 160:16 warning Fast refresh can't handle anonymous components. Add a name to your export react-refresh/only-export-components
19:08:27.478
19:08:27.478 /vercel/path0/src/components/learn/LessonViewer.tsx
19:08:27.478 194:16 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.478 204:23 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.479
19:08:27.479 /vercel/path0/src/components/playground/CodeEditorPane.tsx
19:08:27.479 17:47 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.479
19:08:27.479 /vercel/path0/src/components/pvp/MatchArena.tsx
19:08:27.480 64:6 warning React Hook React.useMemo has an unnecessary dependency: 'question.id'. Either exclude it or remove the dependency array react-hooks/exhaustive-deps
19:08:27.480 79:6 warning React Hook useEffect has a missing dependency: 'question.starter_code'. Either include it or remove the dependency array. If 'setCode' needs the current value of 'question.starter_code', you can also switch to useReducer instead of useState and read 'question.starter_code' in the reducer react-hooks/exhaustive-deps
19:08:27.481 85:5 warning Unexpected console statement no-console
19:08:27.481 87:51 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.481 88:7 warning Unexpected console statement no-console
19:08:27.482 111:11 warning Unexpected console statement no-console
19:08:27.482 113:11 warning Unexpected console statement no-console
19:08:27.484 118:46 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.485 119:7 warning Unexpected console statement no-console
19:08:27.485 123:47 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.485 124:7 warning Unexpected console statement no-console
19:08:27.485 135:5 warning Unexpected console statement no-console
19:08:27.485 139:7 warning Unexpected console statement no-console
19:08:27.486 142:6 warning React Hook useEffect has a missing dependency: 'socket'. Either include it or remove the dependency array react-hooks/exhaustive-deps
19:08:27.486
19:08:27.486 /vercel/path0/src/components/settings/ProfileSettings.tsx
19:08:27.486 57:7 warning Unexpected console statement no-console
19:08:27.486
19:08:27.487 /vercel/path0/src/components/settings/ProgressStats.tsx
19:08:27.487 27:43 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.487 36:7 warning Unexpected console statement no-console
19:08:27.487
19:08:27.487 /vercel/path0/src/contexts/AuthContext.tsx
19:08:27.487 22:78 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.488 23:56 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.488 38:14 warning Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components react-refresh/only-export-components
19:08:27.488 67:9 warning Unexpected console statement no-console
19:08:27.488 75:6 warning React Hook useEffect has a missing dependency: 'scheduleTokenRefresh'. Either include it or remove the dependency array react-hooks/exhaustive-deps
19:08:27.488 102:49 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.488 103:97 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.489 122:7 warning Unexpected console statement no-console
19:08:27.489 134:67 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.489 177:58 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.489 214:45 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.489
19:08:27.489 /vercel/path0/src/hooks/useApi.ts
19:08:27.490 17:45 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.490 18:36 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.490 29:33 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.490 44:69 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.490 45:36 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.491 61:33 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.491 71:6 warning React Hook useEffect has a missing dependency: 'fetchData'. Either include it or remove the dependency array react-hooks/exhaustive-deps
19:08:27.491 76:67 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.491 77:36 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.491 93:33 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.492 103:6 warning React Hook useEffect has a missing dependency: 'fetchData'. Either include it or remove the dependency array react-hooks/exhaustive-deps
19:08:27.492 108:65 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.492 109:36 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.492 125:33 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.492 135:6 warning React Hook useEffect has a missing dependency: 'fetchData'. Either include it or remove the dependency array react-hooks/exhaustive-deps
19:08:27.492 140:48 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.493 141:36 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.493
19:08:27.493 /vercel/path0/src/hooks/useLessonData.ts
19:08:27.493 53:49 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.493 61:9 warning Unexpected console statement no-console
19:08:27.493 96:54 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.494 98:33 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.494 98:75 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.494 103:9 warning Unexpected console statement no-console
19:08:27.494
19:08:27.494 /vercel/path0/src/hooks/usePvPSocket.ts
19:08:27.495 80:7 warning Unexpected console statement no-console
19:08:27.495 86:7 warning Unexpected console statement no-console
19:08:27.495 91:7 warning Unexpected console statement no-console
19:08:27.495 99:36 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.495 103:37 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.496 104:9 warning Unexpected console statement no-console
19:08:27.496
19:08:27.496 /vercel/path0/src/lib/api.ts
19:08:27.496 17:15 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.496 56:21 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.496
19:08:27.497 /vercel/path0/src/lib/supabase.ts
19:08:27.497 40:58 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.497
19:08:27.497 /vercel/path0/src/main.tsx
19:08:27.497 7:21 warning Forbidden non-null assertion @typescript-eslint/no-non-null-assertion
19:08:27.497
19:08:27.504 /vercel/path0/src/pages/AuthPage.tsx
19:08:27.504 23:35 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.504 50:19 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.504
19:08:27.505 /vercel/path0/src/pages/LanguageSelectorPage.tsx
19:08:27.505 12:31 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.505 27:46 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.505 35:51 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.505 39:9 warning Unexpected console statement no-console
19:08:27.506
19:08:27.506 /vercel/path0/src/pages/PvPLobbyPage.tsx
19:08:27.506 51:21 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.506
19:08:27.506 /vercel/path0/src/pages/PvPMatchPage.tsx
19:08:27.506 65:23 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.507 96:6 warning React Hook useEffect has missing dependencies: 'match' and 'socket'. Either include them or remove the dependency array react-hooks/exhaustive-deps
19:08:27.507 140:7 warning Unexpected console statement no-console
19:08:27.507 184:6 warning React Hook useEffect has a missing dependency: 'socket'. Either include it or remove the dependency array react-hooks/exhaustive-deps
19:08:27.507
19:08:27.507 /vercel/path0/src/pages/admin/LoginPage.tsx
19:08:27.507 31:6 warning React Hook useEffect has a missing dependency: 'error'. Either include it or remove the dependency array react-hooks/exhaustive-deps
19:08:27.508 42:19 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.508
19:08:27.508 /vercel/path0/src/services/ErrorLogger.ts
19:08:27.508 209:5 warning Unexpected console statement no-console
19:08:27.508
19:08:27.508 /vercel/path0/src/services/TokenRefreshService.ts
19:08:27.509 32:11 warning Unexpected console statement no-console
19:08:27.509 95:7 warning Unexpected console statement no-console
19:08:27.509
19:08:27.509 /vercel/path0/src/services/admin/apiClient.ts
19:08:27.509 30:17 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.509 51:9 warning Unexpected console statement no-console
19:08:27.510 103:50 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.510 147:9 warning Unexpected console statement no-console
19:08:27.510
19:08:27.510 /vercel/path0/src/services/admin/baseAdminApi.ts
19:08:27.510 56:21 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.511 57:7 warning Unexpected console statement no-console
19:08:27.511
19:08:27.511 /vercel/path0/src/types/api/index.ts
19:08:27.511 11:15 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.511 66:13 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.512
19:08:27.512 /vercel/path0/src/types/common/index.ts
19:08:27.513 55:16 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.513
19:08:27.513 /vercel/path0/src/types/grading.types.ts
19:08:27.513 47:17 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.513 48:19 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.513
19:08:27.514 /vercel/path0/src/types/logger.types.ts
19:08:27.514 15:26 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.514 16:29 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.514 26:26 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.514 27:29 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.515
19:08:27.515 /vercel/path0/src/utils/codeExecution.ts
19:08:27.515 113:30 warning Unexpected console statement no-console
19:08:27.515 116:3 warning Unexpected console statement no-console
19:08:27.515 141:15 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.515 154:5 warning Unexpected console statement no-console
19:08:27.516
19:08:27.516 /vercel/path0/src/utils/languageConfig.ts
19:08:27.516 62:40 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.516
19:08:27.516 /vercel/path0/src/utils/seo.ts
19:08:27.516 144:86 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.517
19:08:27.517 /vercel/path0/src/utils/tokenUtils.ts
19:08:27.517 9:18 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
19:08:27.517
19:08:27.517 ✖ 108 problems (0 errors, 108 warnings)
19:08:27.517
19:08:35.109 [36mvite v5.4.21 [32mbuilding for production...[36m[39m
19:08:35.166 transforming...
19:08:41.662 [32m✓[39m 2450 modules transformed.
19:08:41.792 Circular chunk: vendor-react -> vendor-admin-ui -> vendor-react. Please adjust the manual chunk logic for these chunks.
19:08:42.196 rendering chunks...
19:08:42.701 computing gzip size...
19:08:42.754 [2mdist/[22m[32mindex.html [39m[1m[2m 3.11 kB[22m[1m[22m[2m │ gzip: 1.03 kB[22m
19:08:42.754 [2mdist/[22m[2massets/[22m[32mlogo-128x128-DRwhTfUR.png [39m[1m[2m 30.19 kB[22m[1m[22m
19:08:42.754 [2mdist/[22m[2massets/[22m[32mlogo-w256-Ci9Gtyut.png [39m[1m[2m 55.94 kB[22m[1m[22m
19:08:42.754 [2mdist/[22m[2massets/[22m[32mlogo-256x256-xtdpF5v0.png [39m[1m[2m 80.19 kB[22m[1m[22m
19:08:42.755 [2mdist/[22m[2massets/[22m[35mindex-CIkuEpkD.css [39m[1m[2m 61.57 kB[22m[1m[22m[2m │ gzip: 10.14 kB[22m
19:08:42.755 [2mdist/[22m[2massets/[22m[36mLoginPage-CyL-CKgA.js [39m[1m[2m 7.20 kB[22m[1m[22m[2m │ gzip: 2.25 kB[22m
19:08:42.755 [2mdist/[22m[2massets/[22m[36mvendor-admin-ui-CXUX9b5z.js [39m[1m[2m 10.89 kB[22m[1m[22m[2m │ gzip: 4.20 kB[22m
19:08:42.755 [2mdist/[22m[2massets/[22m[36mDashboardPage-TKiAt1eW.js [39m[1m[2m 14.00 kB[22m[1m[22m[2m │ gzip: 5.15 kB[22m
19:08:42.755 [2mdist/[22m[2massets/[22m[36mvendor-react-BtJBQrN5.js [39m[1m[2m 156.63 kB[22m[1m[22m[2m │ gzip: 51.31 kB[22m
19:08:42.755 [2mdist/[22m[2massets/[22m[36mindex-Do0ZAWNB.js [39m[1m[33m1,571.27 kB[39m[22m[2m │ gzip: 521.87 kB[22m
19:08:42.756 [33m
19:08:42.756 (!) Some chunks are larger than 1000 kB after minification. Consider:
19:08:42.756 - Using dynamic import() to code-split the application
19:08:42.756 - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
19:08:42.756 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
19:08:42.756 [32m✓ built in 7.62s[39m
19:08:42.927 Build Completed in /vercel/output [1m]
19:08:42.973 Deploying outputs...
19:08:44.949 Deployment completed
19:08:45.065 Creating build cache...
19:08:57.302 Created build cache: 12s
19:08:57.302 Uploading build cache [64.65 MB]
19:08:58.699 Build cache uploaded: 1.399s
