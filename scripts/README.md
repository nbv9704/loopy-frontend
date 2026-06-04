# Content Sync Scripts

This directory contains utility scripts for managing content synchronization between the backend database and frontend i18n files.

## Scripts

### sync-content-i18n.js

Synchronizes content items from the backend API with i18n JSON files.

**Purpose:**
- Fetches content items from the backend API (`/api/content`)
- Converts flat content structure to nested i18n format
- Generates/updates i18n JSON files for each supported language (VI, EN)
- Merges new content with existing i18n files to preserve manual edits

**Usage:**

```bash
# Using npm/yarn
npm run sync:content
yarn sync:content

# Direct execution
node scripts/sync-content-i18n.js
```

**Environment Variables:**

- `VITE_API_URL` - Backend API URL (default: `http://localhost:3000`)

**Example:**

```bash
# Sync with default backend
yarn sync:content

# Sync with custom backend URL
VITE_API_URL=https://api.example.com yarn sync:content
```

**Output:**

The script generates/updates the following files:
- `src/i18n/locales/vi.json` - Vietnamese translations
- `src/i18n/locales/en.json` - English translations

**Features:**

1. **Flat to Nested Conversion**: Converts flat content keys (e.g., `nav.learn`) to nested structure:
   ```json
   {
     "nav": {
       "learn": "Học tập"
     }
   }
   ```

2. **Deep Merge**: Preserves existing i18n keys that are not in the database, allowing manual edits to coexist with synced content

3. **Error Handling**: Gracefully handles API errors and provides detailed error messages

4. **Progress Reporting**: Shows detailed progress with emoji indicators for easy tracking

**Example Content Structure:**

The script expects content items from the API with the following structure:

```typescript
interface ContentItem {
  id: string
  categoryId: string
  key: string              // e.g., "nav.learn", "landing.hero.title"
  language: string         // "vi" or "en"
  value: string           // The actual content text
  description?: string
  type: 'text' | 'markdown' | 'html'
  createdAt: string
  updatedAt: string
}
```

**Error Handling:**

- **API Connection Error**: If the backend is not running or unreachable, the script will fail with a clear error message
- **No Content Found**: If no content items are found for a language, the script will warn but continue
- **File Write Error**: If there's an issue writing to the i18n files, the script will report the error

**Exit Codes:**

- `0` - Success: All i18n files synced successfully
- `1` - Failure: One or more languages failed to sync

### sync-content-i18n.test.js

Unit tests for the sync script functionality.

**Usage:**

```bash
node scripts/sync-content-i18n.test.js
```

**Tests:**

1. **Flat to Nested Conversion**: Verifies that flat content keys are correctly converted to nested structure
2. **Deep Merge**: Verifies that objects are correctly merged while preserving existing keys
3. **Empty Arrays**: Verifies that empty content arrays are handled correctly
4. **Single Level Keys**: Verifies that single-level keys (no dots) are handled correctly
5. **Deep Nested Keys**: Verifies that deeply nested keys (multiple dots) are handled correctly

## Integration with CI/CD

To automatically sync content during deployment:

1. Add to your CI/CD pipeline:
   ```yaml
   - name: Sync Content i18n
     run: yarn sync:content
     env:
       VITE_API_URL: ${{ secrets.API_URL }}
   ```

2. Or add as a pre-build step in `package.json`:
   ```json
   {
     "scripts": {
       "prebuild": "yarn sync:content",
       "build": "tsc && vite build"
     }
   }
   ```

## Troubleshooting

### Script fails with "API error: 404 Not Found"

**Cause**: The backend API is not running or the `/api/content` endpoint is not available.

**Solution**:
1. Ensure the backend is running: `yarn dev` in `loopy-backend` directory
2. Check that the API URL is correct: `echo $VITE_API_URL`
3. Verify the content tables exist in the database

### Script fails with "Cannot find module 'fs'"

**Cause**: The script is being run with an incompatible Node.js version or module loader.

**Solution**:
1. Ensure you're using Node.js 14+ (which has native ES modules support)
2. Run the script directly: `node scripts/sync-content-i18n.js`

### i18n files are not being updated

**Cause**: The script may have failed silently or the API returned no content.

**Solution**:
1. Check the script output for error messages
2. Verify that content items exist in the database
3. Check that the language parameter is correct (vi or en)

## Implementation Details

### Task 4.1 - Create Content Sync Script

This script implements Task 4.1 from the CMS Content Management System specification.

**Acceptance Criteria:**
- ✅ Script runs successfully
- ✅ i18n files updated correctly
- ✅ No errors during sync

**Subtasks:**
- ✅ Fetch content from API
- ✅ Generate i18n JSON files
- ✅ Save to `loopy-frontend/src/locales/[language].json`

## Related Files

- `src/i18n/config.ts` - i18n configuration
- `src/i18n/locales/vi.json` - Vietnamese translations
- `src/i18n/locales/en.json` - English translations
- `package.json` - npm scripts configuration

## Future Enhancements

1. **Incremental Sync**: Only sync changed content items
2. **Backup**: Create backups before syncing
3. **Validation**: Validate content structure before saving
4. **Dry Run**: Preview changes before applying
5. **Scheduled Sync**: Automatically sync on a schedule
