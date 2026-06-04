22:03:27.910 Running build in Washington, D.C., USA (East) – iad1
22:03:27.912 Build machine configuration: 2 cores, 8 GB
22:03:27.930 Cloning github.com/nbv9704/loopy-frontend (Branch: master, Commit: 8b0604a)
22:03:27.931 Skipping build cache, deployment was triggered without cache.
22:03:28.654 Cloning completed: 724.000ms
22:03:29.402 Running "vercel build"
22:03:30.662 Vercel CLI 51.6.1
22:03:32.103 Running "install" command: `npm install`...
22:03:34.632 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
22:03:34.921 npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
22:03:34.981 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
22:03:35.653 npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
22:03:35.688 npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
22:04:16.880 npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
22:04:34.814
22:04:34.815 added 368 packages, and audited 369 packages in 1m
22:04:34.816
22:04:34.816 74 packages are looking for funding
22:04:34.816 run `npm fund` for details
22:04:34.969
22:04:34.970 11 vulnerabilities (5 moderate, 6 high)
22:04:34.970
22:04:34.970 To address issues that do not require attention, run:
22:04:34.971 npm audit fix
22:04:34.971
22:04:34.971 To address all issues (including breaking changes), run:
22:04:34.971 npm audit fix --force
22:04:34.976
22:04:34.978 Run `npm audit` for details.
22:04:36.069
22:04:36.070 > loopy-frontend@1.0.0 build
22:04:36.071 > npm run quality:check && tsc && vite build
22:04:36.071
22:04:36.178
22:04:36.179 > loopy-frontend@1.0.0 quality:check
22:04:36.179 > npm run format:check && npm run lint
22:04:36.180
22:04:36.284
22:04:36.284 > loopy-frontend@1.0.0 format:check
22:04:36.285 > prettier --check .
22:04:36.285
22:04:36.380 Checking formatting...
22:04:39.229 [[33mwarn[39m] vercel.json
22:04:39.229 [[33mwarn[39m] Code style issues found in the above file. Run Prettier with --write to fix.
22:04:39.259 Error: Command "npm run build" exited with 1
