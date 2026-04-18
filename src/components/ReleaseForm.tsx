import React from 'react'
import { Loader2 } from 'lucide-react'
import VersionField from './VersionField'
import { VERSION_FIELDS } from '../lib/release'

interface ReleaseFormProps {
  formData: {
    osBE: string
    osFE: string
    proFE: string
    proNative: string
    releaseDate: string
    releaseTime: string
    ticketDetails: string
    downtime: string
  }
  isGenerating: boolean
  canGenerate: boolean
  onFieldChange: (name: string, value: string) => void
  onToday: () => void
  onGenerate: () => void
  onClear: () => void
  onToggleExample: () => void
}

export default function ReleaseForm({
  formData,
  isGenerating,
  canGenerate,
  onFieldChange,
  onToday,
  onGenerate,
  onClear,
  onToggleExample
}: ReleaseFormProps) {
  return (
    <section className="panel-card" aria-labelledby="release-form-heading">
      <div className="section-header">
        <h2 id="release-form-heading" className="section-title">
          Details
        </h2>
      </div>

      <div className="form-stack">
        <div className="version-grid">
          {VERSION_FIELDS.map(({ field, label, placeholder }) => (
            <VersionField
              key={field}
              field={field}
              label={label}
              placeholder={placeholder}
              value={formData[field]}
              onChange={(value) => onFieldChange(field, value)}
            />
          ))}
        </div>

        <div className="schedule-grid">
          <div>
            <label className="field-label" htmlFor="releaseDate">
              Release Date *
            </label>
            <div className="field-row">
              <input
                id="releaseDate"
                type="date"
                name="releaseDate"
                value={formData.releaseDate}
                onChange={(event) => onFieldChange('releaseDate', event.target.value)}
                className="field-input"
              />
              <button type="button" onClick={onToday} className="field-inline-button">
                Today
              </button>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="releaseTime">
              Release Time *
            </label>
            <input
              id="releaseTime"
              type="time"
              name="releaseTime"
              value={formData.releaseTime}
              onChange={(event) => onFieldChange('releaseTime', event.target.value)}
              className="field-input"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="downtime">
            Downtime for Web Application
          </label>
          <select
            id="downtime"
            name="downtime"
            value={formData.downtime}
            onChange={(event) => onFieldChange('downtime', event.target.value)}
            className="field-input"
          >
            <option value="">No downtime</option>
            <option value="15min">15 minutes</option>
            <option value="30min">30 minutes</option>
            <option value="1hour">1 hour</option>
            <option value="custom">Custom (specify in message)</option>
          </select>
        </div>

        <div>
          <div className="field-heading-row">
            <label className="field-label field-label-inline" htmlFor="ticketDetails">
              Ticket Details *
            </label>
            <button type="button" onClick={onToggleExample} className="ghost-link">
              {formData.ticketDetails.trim() ? 'Clear Example' : 'Insert Example'}
            </button>
          </div>
          <textarea
            id="ticketDetails"
            name="ticketDetails"
            value={formData.ticketDetails}
            onChange={(event) => onFieldChange('ticketDetails', event.target.value)}
            placeholder="Paste ticket details."
            rows={12}
            className="field-input field-textarea"
          />
        </div>

        <div className="action-stack">
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating}
            className="generate-action"
          >
            {isGenerating ? (
              <>
                <Loader2 className="icon-medium spin-icon" />
                Generating...
              </>
            ) : (
              <>
                Generate Release Message
              </>
            )}
          </button>

          <div className="action-helper-row">
            <p className="helper-copy helper-copy-compact">
              {canGenerate
                ? 'Ready to generate.'
                : 'Release date, time, and ticket details are required.'}
            </p>
            <button type="button" onClick={onClear} className="field-inline-button">
              Clear All
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
