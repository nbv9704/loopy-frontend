import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '../../lib/api'
import { pvpService } from '../../services/pvp.service'

vi.mock('../../lib/api', () => ({ api: { request: vi.fn() } }))
const match = {
  id: '11111111-1111-4111-8111-111111111111',
  room_code: 'ROOM01',
  status: 'waiting',
  mode: '1v1',
  language_id: 'javascript',
  difficulty: 'medium',
  question_ids: ['question'],
  current_question_index: 0,
  max_players: 2,
  time_per_question: 30,
  created_at: 'today',
  updated_at: 'today',
  participants: [],
}
beforeEach(() => vi.resetAllMocks())

it.each([
  undefined,
  {},
  { match: {} },
  { match: { ...match, room_code: 'invalid' } },
  { match: { ...match, status: 'unknown' } },
  { match: { ...match, participants: [{}] } },
])('does not navigate on a malformed match acknowledgement (%j)', async data => {
  vi.mocked(api.request).mockResolvedValue({ success: true, data } as never)
  await expect(pvpService.findMatch({ mode: '1v1' })).rejects.toThrow('thông tin phòng hợp lệ')
})

it('normalizes room codes and checks the returned room identity', async () => {
  vi.mocked(api.request).mockResolvedValue({ success: true, data: { match } } as never)
  await expect(pvpService.joinMatch('room01')).resolves.toEqual(match)
  expect(api.request).toHaveBeenCalledWith('/api/pvp/matches/ROOM01/join', { method: 'POST' })
  await expect(pvpService.getMatch('OTHER1')).rejects.toThrow('không khớp phòng')
})

it.each(['bad', '../ROOM01', '------'])(
  'rejects invalid room input without making a request (%s)',
  async value => {
    await expect(pvpService.joinMatch(value)).rejects.toThrow('không hợp lệ')
    expect(api.request).not.toHaveBeenCalled()
  }
)

it('preserves service errors instead of calling every failure an invalid room code', async () => {
  vi.mocked(api.request).mockResolvedValue({
    success: false,
    error: { message: 'Service unavailable', code: 'SCHEMA_NOT_READY' },
  } as never)
  await expect(pvpService.joinMatch('ROOM01')).rejects.toMatchObject({
    message: 'Service unavailable',
    code: 'SCHEMA_NOT_READY',
  })
})

it.each([{}, { eligible: true, onboardingCompleted: true, hasCompletedLesson: false }])(
  'rejects missing or contradictory eligibility (%j)',
  async data => {
    vi.mocked(api.request).mockResolvedValue({ success: true, data } as never)
    await expect(pvpService.getEligibility()).rejects.toThrow('điều kiện tham gia PvP')
  }
)

it('accepts server eligibility independently of profile points and forwards cancellation', async () => {
  const data = { eligible: true, onboardingCompleted: true, hasCompletedLesson: true }
  const controller = new AbortController()
  vi.mocked(api.request).mockResolvedValue({ success: true, data } as never)
  await expect(pvpService.getEligibility(controller.signal)).resolves.toEqual(data)
  expect(api.request).toHaveBeenCalledWith('/api/pvp/eligibility', { signal: controller.signal })
})
