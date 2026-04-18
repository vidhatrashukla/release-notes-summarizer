export const VERSION_FIELDS = [
  { field: 'osBE', label: 'Backend Version', placeholder: 'e.g., 4.3.1' },
  { field: 'osFE', label: 'Web App Version', placeholder: 'e.g., 12.3.1' },
  { field: 'proFE', label: 'Mobile App Version', placeholder: 'e.g., 3.0.1' },
  { field: 'proNative', label: 'Native Build Version', placeholder: 'e.g., 10.2.0' }
]

export const FIELD_LABELS = {
  osBE: 'Backend',
  osFE: 'Web App',
  proFE: 'Mobile App',
  proNative: 'Native Build'
}

export const EMPTY_FORM_DATA = {
  osBE: '',
  osFE: '',
  proFE: '',
  proNative: '',
  releaseDate: '',
  releaseTime: '',
  ticketDetails: '',
  downtime: ''
}

export const EXAMPLE_TICKETS = `FM-123: Fixed login timeout issue for mobile users
FM-124: Added dark mode toggle to settings
FM-125: Improved dashboard loading speed

Bug fixes:
- Fixed crash when accessing reports page
- Resolved notification delay issue

Features:
- New export to CSV functionality
- Enhanced search filters`

const DOWNTIME_MAP = {
  '15min': 'FarMart OS will not be accessible for approximately 15 minutes during this release.',
  '30min': 'FarMart OS will not be accessible for approximately 30 minutes during this release.',
  '1hour': 'FarMart OS will not be accessible for approximately 1 hour during this release.',
  custom: 'FarMart OS will not be accessible during this release window.'
}

export const getLocalDateInputValue = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const formatDate = (dateString) => {
  if (!dateString) return ''
  return parseLocalDate(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatTime = (timeString) => {
  if (!timeString) return ''
  const [hours, minutes] = timeString.split(':')
  const hour = Number.parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes}${ampm}`
}

export const buildVersionLine = (formData) => {
  const versionParts = []
  if (formData.osBE) versionParts.push(`FarMart OS BE v${formData.osBE}`)
  if (formData.osFE) versionParts.push(`FE v${formData.osFE}`)
  if (formData.proFE) versionParts.push(`Pro FE v${formData.proFE}`)
  if (formData.proNative) versionParts.push(`Native ${formData.proNative}`)
  return versionParts.join(' / ')
}

export const buildClosingStatement = (formData) => {
  const downtimeMessage = formData.downtime ? DOWNTIME_MAP[formData.downtime] || DOWNTIME_MAP.custom : 'There will be no downtime for this release.'
  if (!formData.proNative) {
    return downtimeMessage
  }

  if (downtimeMessage === 'There will be no downtime for this release.') {
    return 'There will be no downtime for FarMart OS and FMT Pro users will need to update their apps once the release is complete.'
  }

  return `${downtimeMessage} FMT Pro users will need to update their apps once the release is complete.`
}

export const buildReleasePrompt = (formData) => {
  const versionLine = buildVersionLine(formData)
  const formattedDate = formatDate(formData.releaseDate)
  const formattedTime = formatTime(formData.releaseTime)
  const closingStatement = buildClosingStatement(formData)

  return `You are writing a release message for FarMart's internal team. The audience is non-technical end users of FarMart OS (web-based tool) and FarMart Pro (mobile app).

Version: ${versionLine}
Release Date: ${formattedDate}
Release Time: ${formattedTime}
Closing Statement: ${closingStatement}

Ticket Details:
${formData.ticketDetails}

Generate a release message following this EXACT format:

IMPORTANT - The message MUST follow this exact structure and use WhatsApp-compatible formatting (use asterisks * for bold, ensure proper spacing):

Line 1: 📱 ${versionLine}
Line 2: 📅 ${formattedDate}
Line 3: ⏰ ${formattedTime}

CRITICAL: Use plain text emojis (📱 📅 ⏰) WITHOUT any code blocks, backticks, or special wrappers. Do NOT wrap emojis in :: or any other characters. The emojis must copy directly as shown.

[Blank line]

*Subject:* [Create a clear subject line based on the nature of changes. If any ticket is a "story", "epic", or "feature", explicitly mention this in the subject line]

[Blank line]

Dear all,

We are making a *[RELEASE TYPE]* release which is aimed at [briefly state the main goal].

[RELEASE TYPE] should be one of:
- *MAJOR* - if introducing significant new features, breaking changes, or major system updates (e.g., new modules, major UI overhauls)
- *MINOR* - if introducing new features or substantial improvements without breaking changes
- *PATCH* - if primarily bug fixes, small tweaks, or performance optimizations with no new features

Explicitly call out the release type in the first paragraph using the exact word "MAJOR", "MINOR", or "PATCH" in uppercase with asterisks.

[Then organize the actual changes in numbered sections in this EXACT ORDER of magnitude:]

*1. New Features:*
   - [Detail 1]
   - [Detail 2]

*2. Improvements:*
   - [Detail 1]
   - [Detail 2]

*3. Bug Fixes:*
   - [Detail 1]
   - [Detail 2]

[Only include sections that have relevant changes. If there are no new features, skip that section.]

[Blank line]

${closingStatement}

Style guidelines:
- CRITICAL: Format must be WhatsApp-compatible - use *asterisks* for bold text
- Release type (MAJOR/MINOR/PATCH) must be explicitly stated in the first paragraph
- If any ticket is a story/epic/feature, highlight this in the subject line
- Bullet points must be ordered by magnitude: New Features first, Improvements second, Bug Fixes last
- Use simple, non-technical language focused on business impact
- Focus on WHAT changed and WHY it matters, not HOW it works
- Keep sentences clear and concise
- Group related changes together

Return ONLY the formatted release message, nothing else.`
}

export const summarizeVersionLookup = (results) => {
  const successCount = results.filter(Boolean).length
  const failureCount = results.length - successCount

  if (successCount && !failureCount) {
    return {
      type: 'success',
      message: `Fetched all ${successCount} version values.`
    }
  }

  if (successCount) {
    return {
      type: 'error',
      message: `Fetched ${successCount} version value${successCount === 1 ? '' : 's'}. ${failureCount} field${failureCount === 1 ? '' : 's'} still need manual entry.`
    }
  }

  return {
    type: 'error',
    message: 'Version lookup is unavailable right now. Enter versions manually.'
  }
}
