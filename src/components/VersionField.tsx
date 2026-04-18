import React from 'react'

interface VersionFieldProps {
  field: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export default function VersionField({
  field,
  label,
  placeholder,
  value,
  onChange
}: VersionFieldProps) {
  return (
    <div>
      <label className="field-label" htmlFor={field}>
        {label}
      </label>
      <input
        id={field}
        type="text"
        name={field}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field-input"
      />
    </div>
  )
}
