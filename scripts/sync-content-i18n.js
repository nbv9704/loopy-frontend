/**
 * Content Sync Script - Sync content from database with i18n JSON files
 *
 * This script fetches content items from the backend API and generates
 * i18n JSON files for each supported language (VI, EN).
 *
 * Usage:
 *   node scripts/sync-content-i18n.js
 *
 * Environment Variables:
 *   VITE_API_URL - Backend API URL (default: http://localhost:3000)
 *
 * Implements Task 4.1 - Create Content Sync Script
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000'
const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales')
const SUPPORTED_LANGUAGES = ['vi', 'en']

/**
 * Fetch content from API for a specific language
 */
async function fetchContentFromAPI(language) {
  try {
    console.log(`📥 Fetching content for language: ${language}`)

    const url = new URL(`${API_URL}/api/content`)
    url.searchParams.append('language', language)
    url.searchParams.append('limit', '1000') // Fetch all items

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(`API returned error: ${JSON.stringify(data)}`)
    }

    console.log(`✅ Fetched ${data.data.items.length} items for language: ${language}`)
    return data.data.items
  } catch (error) {
    console.error(`❌ Error fetching content for language ${language}:`, error.message)
    throw error
  }
}

/**
 * Convert flat content items to nested i18n structure
 * Example: "nav.learn" -> { nav: { learn: "Learn" } }
 */
function convertToI18nStructure(items) {
  const result = {}

  for (const item of items) {
    const keys = item.key.split('.')
    let current = result

    // Navigate/create nested structure
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!current[key]) {
        current[key] = {}
      }
      current = current[key]
    }

    // Set the final value
    const lastKey = keys[keys.length - 1]
    current[lastKey] = item.value
  }

  return result
}

/**
 * Save i18n JSON file
 */
function saveI18nFile(language, content) {
  try {
    const filePath = path.join(LOCALES_DIR, `${language}.json`)

    // Ensure directory exists
    if (!fs.existsSync(LOCALES_DIR)) {
      fs.mkdirSync(LOCALES_DIR, { recursive: true })
      console.log(`📁 Created locales directory: ${LOCALES_DIR}`)
    }

    // Write file with pretty formatting
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8')

    console.log(`💾 Saved i18n file: ${filePath}`)
  } catch (error) {
    console.error(`❌ Error saving i18n file for language ${language}:`, error.message)
    throw error
  }
}

/**
 * Merge new content with existing i18n file
 * This preserves any existing keys that are not in the database
 */
function mergeWithExisting(language, newContent) {
  try {
    const filePath = path.join(LOCALES_DIR, `${language}.json`)

    if (!fs.existsSync(filePath)) {
      return newContent
    }

    const existingContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // Deep merge: new content takes precedence
    const merged = deepMerge(existingContent, newContent)

    return merged
  } catch (error) {
    console.warn(`⚠️  Could not merge with existing file for ${language}, using new content only`)
    return newContent
  }
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const result = { ...target }

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(result[key], source[key])
      } else {
        result[key] = source[key]
      }
    }
  }

  return result
}

/**
 * Main sync function
 */
async function syncContentI18n() {
  console.log('🚀 Starting content sync...\n')

  try {
    let successCount = 0
    let errorCount = 0

    for (const language of SUPPORTED_LANGUAGES) {
      try {
        // Fetch content from API
        const items = await fetchContentFromAPI(language)

        if (items.length === 0) {
          console.warn(`⚠️  No content items found for language: ${language}`)
          continue
        }

        // Convert to i18n structure
        const i18nContent = convertToI18nStructure(items)

        // Merge with existing content
        const mergedContent = mergeWithExisting(language, i18nContent)

        // Save to file
        saveI18nFile(language, mergedContent)

        successCount++
        console.log(`✨ Successfully synced ${language}.json\n`)
      } catch (error) {
        errorCount++
        console.error(`❌ Failed to sync ${language}.json\n`)
      }
    }

    // Summary
    console.log('📊 Sync Summary:')
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Failed: ${errorCount}`)

    if (errorCount === 0) {
      console.log('\n✨ All i18n files synced successfully!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Some files failed to sync')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Fatal error during sync:', error.message)
    process.exit(1)
  }
}

// Run the sync
syncContentI18n()
