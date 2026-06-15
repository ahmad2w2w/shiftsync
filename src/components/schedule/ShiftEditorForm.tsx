import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { useOrgConfig } from '../../context/OrgConfigContext'

export interface ShiftFormValues {
  start_time: string
  end_time: string
  position: string
  user_id: string | null
}

interface ShiftEditorFormProps {
  values: ShiftFormValues
  onChange: (patch: Partial<ShiftFormValues>) => void
  onSubmit: () => void
  onCancel?: () => void
  submitLabel?: string
  loading?: boolean
  employees?: { id: string; full_name: string }[]
  showEmployee?: boolean
}

export function ShiftEditorForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = 'Opslaan',
  loading,
  employees,
  showEmployee,
}: ShiftEditorFormProps) {
  const { positionOptions } = useOrgConfig()
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {showEmployee && employees && (
        <div className="sm:col-span-2">
          <Select
            label="Medewerker"
            value={values.user_id ?? ''}
            onChange={(e) => onChange({ user_id: e.target.value || null })}
            options={[
              { value: '', label: 'Open dienst (nog niet toegewezen)' },
              ...employees.map((e) => ({ value: e.id, label: e.full_name })),
            ]}
          />
        </div>
      )}
      <Input label="Start" type="time" value={values.start_time} onChange={(e) => onChange({ start_time: e.target.value })} />
      <Input label="Eind" type="time" value={values.end_time} onChange={(e) => onChange({ end_time: e.target.value })} />
      <div className="sm:col-span-2">
        <Select
          label="Functie"
          value={values.position}
          onChange={(e) => onChange({ position: e.target.value })}
          options={positionOptions}
        />
      </div>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="button" size="sm" loading={loading} onClick={onSubmit}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
            Annuleren
          </Button>
        )}
      </div>
    </div>
  )
}
