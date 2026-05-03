/**
 * PvP Lobby Page
 * Matchmaking and match creation
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Swords, Trophy, Zap, Users, Clock, Target } from 'lucide-react'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import { useAuth } from '../contexts/AuthContext'
import { pvpService } from '../services/pvp.service'
import toast from 'react-hot-toast'

const PvPLobbyPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [isSearching, setIsSearching] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'1v1' | 'battle_royale'>('1v1')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const handleQuickMatch = async () => {
    if (!user) {
      toast.error('Please login to play')
      navigate('/auth')
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      toast.error('Authentication token not found. Please login again.')
      navigate('/auth')
      return
    }

    setIsSearching(true)

    try {
      const match = await pvpService.findMatch(
        {
          mode: selectedMode,
          difficulty: selectedDifficulty,
        },
        token
      )

      toast.success('Match found!')
      navigate(`/pvp/match/${match.room_code}`)
    } catch (error: any) {
      
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message ||
                          error.message || 
                          'Failed to find match'
      
      toast.error(errorMessage)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-brand-ocean/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      <Header />

      <main className="flex-grow pt-32 pb-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <Swords className="w-12 h-12 text-brand-teal" />
              <h1 className="text-5xl font-bold text-white">PvP Arena</h1>
            </div>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto">
              Compete with other developers in real-time coding challenges
            </p>
          </motion.div>

          {/* Mode Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Game Mode</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* 1v1 Mode */}
              <button
                onClick={() => setSelectedMode('1v1')}
                className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                  selectedMode === '1v1'
                    ? 'bg-brand-teal/10 border-brand-teal shadow-lg shadow-brand-teal/20'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <Users className="w-12 h-12 text-brand-teal mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-white mb-2">1v1 Duel</h3>
                <p className="text-slate-400 text-sm">
                  Face off against one opponent in an intense coding battle
                </p>
              </button>

              {/* Battle Royale Mode */}
              <button
                onClick={() => setSelectedMode('battle_royale')}
                disabled
                className="p-8 rounded-2xl border-2 bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
              >
                <Trophy className="w-12 h-12 text-slate-500 mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-white mb-2">Battle Royale</h3>
                <p className="text-slate-400 text-sm">Coming soon - Compete with multiple players</p>
              </button>
            </div>
          </motion.div>

          {/* Difficulty Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Difficulty</h2>
            <div className="flex gap-4 justify-center">
              {(['easy', 'medium', 'hard'] as const).map(difficulty => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    selectedDifficulty === difficulty
                      ? 'bg-brand-teal text-[#0a0e1a]'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Quick Match Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-16"
          >
            <button
              onClick={handleQuickMatch}
              disabled={isSearching}
              className="group relative px-12 py-6 bg-gradient-to-r from-brand-teal to-brand-cyan text-[#0a0e1a] text-xl font-bold rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-brand-teal/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                {isSearching ? (
                  <>
                    <div className="w-6 h-6 border-2 border-[#0a0e1a] border-t-transparent rounded-full animate-spin" />
                    Searching for opponent...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    Quick Match
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-brand-cyan transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
            </button>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <Clock className="w-8 h-8 text-brand-teal mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Real-time</h3>
              <p className="text-slate-400 text-sm">
                Compete in real-time with instant feedback and live scoring
              </p>
            </div>

            <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <Target className="w-8 h-8 text-brand-teal mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Skill-based</h3>
              <p className="text-slate-400 text-sm">
                Matched with opponents of similar skill level for fair competition
              </p>
            </div>

            <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <Trophy className="w-8 h-8 text-brand-teal mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Ranked</h3>
              <p className="text-slate-400 text-sm">
                Climb the leaderboard and prove your coding skills
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PvPLobbyPage
