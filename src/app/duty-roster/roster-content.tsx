'use client'

import { useEffect, useState, useCallback } from 'react'
import { RosterTable } from '@/components/roster-table'
import { StatsSkeleton, TableSkeleton } from '@/components/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, RefreshCw, CalendarPlus, Filter, Plus, Pencil, Trash2, X, Check, List } from 'lucide-react'
import type { DutyRoster, DutyType } from '@/lib/database.types'

export function RosterContent() {
  const { isAdminOrCommandant } = useAuth()
  const [rosters, setRosters] = useState<DutyRoster[]>([])
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [filterDuty, setFilterDuty] = useState('')
  const [showTypeManager, setShowTypeManager] = useState(false)

  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeDesc, setNewTypeDesc] = useState('')
  const [newTypeColor, setNewTypeColor] = useState('#3b82f6')
  const [editTypeId, setEditTypeId] = useState<string | null>(null)
  const [editTypeName, setEditTypeName] = useState('')

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const params = new URLSearchParams({ date: filterDate })
      if (filterDuty) params.set('duty_type_id', filterDuty)

      const [rosterRes, dutiesRes] = await Promise.all([
        fetch(`/api/rosters?${params}`),
        fetch('/api/duties'),
      ])

      if (rosterRes.ok) setRosters(await rosterRes.json())
      if (dutiesRes.ok) setDutyTypes(await dutiesRes.json())
    } catch {
      setError('Failed to load roster data')
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterDuty])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [loadData])

  const handleStatusChange = async (id: string, status: string) => {
    await fetch('/api/rosters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    loadData()
  }

  const handleGenerate = async () => {
    const end = new Date(filterDate)
    end.setDate(end.getDate() + 6)
    await fetch('/api/rosters/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: filterDate, end_date: end.toISOString().split('T')[0] }),
    })
    loadData()
  }

  const handleAddType = async () => {
    if (!newTypeName.trim()) return
    await fetch('/api/duties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTypeName.trim(), description: newTypeDesc.trim(), color: newTypeColor }),
    })
    setNewTypeName('')
    setNewTypeDesc('')
    setNewTypeColor('#3b82f6')
    loadData()
  }

  const handleRenameType = async (id: string) => {
    if (!editTypeName.trim()) return
    await fetch('/api/duties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editTypeName.trim() }),
    })
    setEditTypeId(null)
    loadData()
  }

  const handleDeleteType = async (id: string) => {
    if (!confirm('Delete this duty type? Existing rosters will keep the reference.')) return
    await fetch(`/api/duties?id=${id}`, { method: 'DELETE' })
    loadData()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsSkeleton />
        <TableSkeleton rows={6} />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm mb-4">{error}</p>
          <Button onClick={loadData} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent>
      </Card>
    )
  }

  const pending = rosters.filter((r) => r.status === 'pending').length
  const completed = rosters.filter((r) => r.status === 'completed').length
  const missed = rosters.filter((r) => r.status === 'missed').length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-zinc-500 uppercase">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-zinc-500 uppercase">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{completed}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-zinc-500 uppercase">Missed</p>
          <p className="text-2xl font-bold text-red-600">{missed}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setLoading(true) }}
            className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterDuty}
          onChange={(e) => { setFilterDuty(e.target.value); setLoading(true) }}
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Duties</option>
          {dutyTypes.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        {isAdminOrCommandant && (
          <>
            <Button onClick={handleGenerate} variant="outline" size="sm" className="gap-2">
              <CalendarPlus className="h-4 w-4" /> Generate Week
            </Button>
            <Button onClick={() => setShowTypeManager(!showTypeManager)} variant="outline" size="sm" className="gap-2">
              <List className="h-4 w-4" /> {showTypeManager ? 'Close Types' : 'Manage Types'}
            </Button>
          </>
        )}
      </div>

      {showTypeManager && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <List className="h-4 w-4 text-blue-500" />
              Duty Types Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input label="Duty Name" placeholder="e.g. Gate Duty" value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)} />
              <Input label="Description" placeholder="Brief description" value={newTypeDesc}
                onChange={(e) => setNewTypeDesc(e.target.value)} />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Color</label>
                <input type="color" value={newTypeColor}
                  onChange={(e) => setNewTypeColor(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-300 bg-white p-1 cursor-pointer" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddType} size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Duty
                </Button>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              {dutyTypes.map((dt) => (
                <div key={dt.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: dt.color }} />
                    {editTypeId === dt.id ? (
                      <div className="flex items-center gap-2">
                        <input type="text" value={editTypeName}
                          onChange={(e) => setEditTypeName(e.target.value)}
                          className="h-8 rounded border border-blue-300 px-2 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <button onClick={() => handleRenameType(dt.id)} className="text-emerald-600 hover:text-emerald-800">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditTypeId(null)} className="text-zinc-400 hover:text-zinc-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-zinc-800">{dt.name}</span>
                        {dt.description && (
                          <span className="text-xs text-zinc-400 hidden sm:inline">{dt.description}</span>
                        )}
                      </>
                    )}
                  </div>
                  {editTypeId !== dt.id && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditTypeId(dt.id); setEditTypeName(dt.name) }}
                        className="p-1 text-zinc-400 hover:text-blue-600 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteType(dt.id)}
                        className="p-1 text-zinc-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <RosterTable
        rosters={rosters}
        title={`Roster for ${filterDate}`}
        onStatusChange={isAdminOrCommandant ? handleStatusChange : undefined}
      />
    </div>
  )
}
