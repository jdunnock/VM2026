import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type {
  AdminQuestion,
  AllTipsParticipant,
  CorrectnessData,
  LeaderboardEntry,
  MatchResult,
  ParticipantScoreDetail,
  ParticipantSession,
  PersistedTipsState,
} from '../types'

// --- Auth ---

export async function signIn(name: string, code: string): Promise<ParticipantSession> {
  const payload = await apiPost<{ participantId: number; name: string }>('/api/auth/sign-in', { name, code })
  return { participantId: payload.participantId, name: payload.name }
}

// --- Config ---

export async function fetchConfig(): Promise<{ globalDeadline: string }> {
  return apiGet('/api/config')
}

// --- Scores ---

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const payload = await apiGet<{ scores: LeaderboardEntry[] }>('/api/scores')
  return Array.isArray(payload.scores) ? payload.scores : []
}

export async function fetchParticipantScore(participantId: number): Promise<ParticipantScoreDetail> {
  return apiGet(`/api/scores/${participantId}`)
}

// --- Results ---

export async function fetchPublicResults(): Promise<MatchResult[]> {
  const payload = await apiGet<{ results: MatchResult[] }>('/api/results')
  return Array.isArray(payload.results) ? payload.results : []
}

export async function fetchCorrectnessData(): Promise<CorrectnessData> {
  return apiGet('/api/results/correctness')
}

// --- Questions ---

export async function fetchPublishedQuestions(): Promise<AdminQuestion[]> {
  const payload = await apiGet<{ questions: AdminQuestion[] }>('/api/questions/published')
  return Array.isArray(payload.questions) ? payload.questions : []
}

// --- Tips ---

export async function fetchTips(participantId: number): Promise<{ tips: PersistedTipsState | null; updatedAt: string | null }> {
  return apiGet(`/api/tips/${participantId}`)
}

export async function saveTips(participantId: number, tips: PersistedTipsState): Promise<{ tips: PersistedTipsState; updatedAt: string }> {
  return apiPut(`/api/tips/${participantId}`, { tips })
}

export async function deleteTips(participantId: number): Promise<void> {
  return apiDelete(`/api/tips/${participantId}`)
}

// --- All Tips ---

export async function fetchAllTips(): Promise<AllTipsParticipant[]> {
  const payload = await apiGet<{ participants: AllTipsParticipant[] }>('/api/tips/all')
  return Array.isArray(payload.participants) ? payload.participants : []
}
