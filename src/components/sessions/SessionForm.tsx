'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const schema = z.object({
  client_id: z.string().uuid('Select a client'),
  date: z.string().min(1, 'Date required'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  total_time_mins: z.number().min(1).max(600),
  hourly_rate: z.number().min(0),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function SessionForm({ clients }: { clients: { id: string; name: string; default_hourly_rate: number }[] }) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  })
  const router = useRouter()
  const supabase = createClient()

  const startTime = watch('start_time')
  const endTime = watch('end_time')

  // Auto-calculate minutes from start/end
  function calcMins() {
    if (!startTime || !endTime) return
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    let mins = (eh * 60 + em) - (sh * 60 + sm)
    if (mins < 0) mins += 1440
    setValue('total_time_mins', mins)
  }

  async function onSubmit(data: FormData) {
    const { error } = await supabase.from('sessions').insert({
      ...data,
      user_id: (await supabase.auth.getUser()).data.user!.id,
    })
    if (!error) {
      router.push('/sessions')
      router.refresh()
    }
  }

  const mins = watch('total_time_mins')
  const rate = watch('hourly_rate')
  const charge = mins && rate ? ((rate * mins) / 60).toFixed(2) : '0.00'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white rounded-xl border border-gray-100 p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
        <select {...register('client_id')} onChange={(e) => {
          register('client_id').onChange(e)
          const client = clients.find(c => c.id === e.target.value)
          if (client) setValue('hourly_rate', client.default_hourly_rate)
        }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select client...</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.client_id && <p className="text-red-500 text-xs mt-1">{errors.client_id.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" {...register('date')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
          <input type="time" {...register('start_time')} onBlur={calcMins} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
          <input type="time" {...register('end_time')} onBlur={calcMins} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
          <input type="number" {...register('total_time_mins', { valueAsNumber: true })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hourly rate ($)</label>
          <input type="number" step="0.01" {...register('hourly_rate', { valueAsNumber: true })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Charge</label>
          <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800">
            ${charge}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea {...register('notes')} rows={3} placeholder="What did you work on?" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
        {isSubmitting ? 'Saving...' : 'Log session'}
      </button>
    </form>
  )
}