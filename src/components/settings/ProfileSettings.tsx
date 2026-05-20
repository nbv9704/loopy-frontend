import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Upload, Save, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

const ProfileSettings = () => {
  const { t } = useTranslation()
  const { user, refreshUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // For now, using base64 for development (not recommended for production)
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t('common.fileTooLarge'))
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveSuccess(false)

    try {
      const response = await api.updateProfile({
        displayName,
        avatarUrl,
        bio,
      })

      if (response.success) {
        await refreshUser()
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-white font-bold text-2xl mb-8">{t('settings.personalProfile')}</h2>

      {/* Avatar Upload */}
      <div className="mb-8">
        <label className="text-slate-400 text-sm font-medium mb-3 block">
          {t('settings.avatar')}
        </label>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-full flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <button
              onClick={handleAvatarClick}
              className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Upload className="w-6 h-6 text-brand-teal" />
            </button>
          </div>
          <div>
            <button
              onClick={handleAvatarClick}
              className="px-4 py-2 bg-brand-teal/10 border border-brand-teal/30 text-brand-teal text-sm font-medium rounded-button cursor-pointer hover:bg-brand-teal/20 hover:border-brand-teal transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {t('settings.uploadPhoto')}
            </button>
            <p className="text-slate-500 text-xs mt-2">{t('settings.photoFormat')}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Display Name */}
      <div className="mb-6">
        <label className="text-slate-400 text-sm font-medium mb-3 block">
          {t('settings.displayName')}
        </label>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="w-full bg-white/5 border border-brand-teal/20 rounded px-4 py-3 text-white focus:border-brand-teal focus:outline-none transition-all"
          placeholder={t('settings.displayNamePlaceholder')}
        />
      </div>

      {/* Email (read-only) */}
      <div className="mb-6">
        <label className="text-slate-400 text-sm font-medium mb-3 block">
          {t('settings.email')}
        </label>
        <input
          type="email"
          value={user?.email || ''}
          disabled
          className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-slate-500 cursor-not-allowed"
        />
      </div>

      {/* Bio */}
      <div className="mb-8">
        <label className="text-slate-400 text-sm font-medium mb-3 block">{t('settings.bio')}</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={4}
          className="w-full bg-white/5 border border-brand-teal/20 rounded px-4 py-3 text-white focus:border-brand-teal focus:outline-none transition-all resize-none"
          placeholder={t('settings.bioPlaceholder')}
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="px-6 py-3 bg-brand-teal text-bg-primary font-semibold rounded-button cursor-pointer hover:bg-brand-cyan hover:shadow-lg hover:shadow-brand-teal/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin"></div>
              {t('settings.saving')}
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {t('settings.saveChanges')}
            </>
          )}
        </button>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-green-400 text-sm"
          >
            <CheckCircle className="w-5 h-5" />
            {t('settings.savedSuccessfully')}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default ProfileSettings
