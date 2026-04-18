import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildClosingStatement,
  buildReleasePrompt,
  formatDate,
  formatTime
} from '../src/lib/release.js'

test('formatDate keeps the intended local calendar day', () => {
  assert.equal(formatDate('2026-04-18'), 'Saturday, Apr 18, 2026')
})

test('formatTime converts 24-hour time to 12-hour display', () => {
  assert.equal(formatTime('00:05'), '12:05AM')
  assert.equal(formatTime('13:45'), '1:45PM')
})

test('buildClosingStatement adds native update guidance when needed', () => {
  assert.equal(
    buildClosingStatement({ downtime: '', proNative: '10.2.0' }),
    'There will be no downtime for FarMart OS and FMT Pro users will need to update their apps once the release is complete.'
  )
})

test('buildReleasePrompt includes formatted schedule information', () => {
  const prompt = buildReleasePrompt({
    osBE: '1.2.3',
    osFE: '4.5.6',
    proFE: '',
    proNative: '',
    releaseDate: '2026-04-18',
    releaseTime: '13:45',
    ticketDetails: 'FM-101: Improved search',
    downtime: ''
  })

  assert.match(prompt, /Saturday, Apr 18, 2026/)
  assert.match(prompt, /1:45PM/)
  assert.match(prompt, /FarMart OS BE v1.2.3 \/ FE v4.5.6/)
})
