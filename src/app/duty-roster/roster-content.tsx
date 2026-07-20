'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { StatsSkeleton, TableSkeleton } from '@/components/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, RefreshCw, CalendarPlus, Filter, Plus, Pencil, Trash2, X, Check, List, Users, Wand2 } from 'lucide-react'
import type { DutyRoster, DutyType } from '@/lib/database.types'

interface StaffOption {
  id: string
  staff_id: string
  full_name: string
}

function getWeekDates(from?: string): { monday: string; friday: string; dates: string[] } {
  const now = from ? new Date(from + 'T00:00:00') : new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  const dates: string[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return { monday: dates[0], friday: dates[4], dates }
}

export function RosterContent() {
  const { isAdminOrCommandant, user } = useAuth()
  const [rosters, setRosters] = useState<DutyRoster[]>([])
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([])
  const [allStaff, setAllStaff] = useState<StaffOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [filterDuty, setFilterDuty] = useState('')
  const [showTypeManager, setShowTypeManager] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'week'>('table')

  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeDesc, setNewTypeDesc] = useState('')
  const [newTypeColor, setNewTypeColor] = useState('#3b82f6')
  const [editTypeId, setEditTypeId] = useState<string | null>(null)
  const [editTypeName, setEditTypeName] = useState('')

  const [addStaffId, setAddStaffId] = useState('')
  const [addDutyTypeId, setAddDutyTypeId] = useState('')
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0])
  const [addNotes, setAddNotes] = useState('')

  const [editRosterId, setEditRosterId] = useState<string | null>(null)
  const [editNewStaffId, setEditNewStaffId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAllRosters, setShowAllRosters] = useState(false)
  const displayRosters = showAllRosters ? rosters : rosters.slice(0, 5)

  const weekRange = useMemo(() => getWeekDates(filterDate), [filterDate])

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const params = new URLSearchParams()
      if (viewMode === 'week') {
        const wd = getWeekDates(filterDate)
        params.set('start_date', wd.dates[0])
        params.set('end_date', wd.dates[4])
      } else {
        params.set('date', filterDate)
      }
      if (filterDuty) params.set('duty_type_id', filterDuty)

      const headers: Record<string, string> = {}
      if (user?.email) headers['x-auth-email'] = user.email

      const [rosterRes, dutiesRes, staffRes] = await Promise.all([
        fetch(`/api/rosters?${params}`, { headers }),
        fetch('/api/duties', { headers }),
        fetch('/api/staff', { headers }),
      ])

      if (rosterRes.ok) setRosters(await rosterRes.json())
      if (dutiesRes.ok) setDutyTypes(await dutiesRes.json())
      if (staffRes.ok) setAllStaff(await staffRes.json())
    } catch {
      setError('Failed to load roster data')
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterDuty, viewMode])

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

  const handleAutoAssignWeek = async () => {
    const res = await fetch('/api/duty/week', { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Auto-assign failed')
      return
    }
    loadData()
  }

  const handleGenerateAll = async () => {
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

  const handleAddAssignment = async () => {
    if (!addStaffId || !addDutyTypeId || !addDate) return
    const res = await fetch('/api/rosters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff_id: addStaffId, duty_type_id: addDutyTypeId, date: addDate, notes: addNotes || null }),
    })
    if (res.ok) {
      setShowAddForm(false)
      setAddStaffId('')
      setAddDutyTypeId('')
      setAddNotes('')
      loadData()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to add assignment')
    }
  }

  const handleDeleteRoster = async (id: string) => {
    if (!confirm('Remove this duty assignment?')) return
    const res = await fetch(`/api/rosters?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      loadData()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to delete')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === rosters.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(rosters.map((r) => r.id)))
    }
  }

  const handleDeleteSelected = async () => {
    const count = selectedIds.size
    if (count === 0) return
    if (!confirm(`Delete ${count} selected assignment${count !== 1 ? 's' : ''}?`)) return
    const res = await Promise.allSettled(
      [...selectedIds].map((id) =>
        fetch(`/api/rosters?id=${id}`, { method: 'DELETE' })
      )
    )
    const failed = res.filter((r) => r.status === 'rejected').length
    setSelectedIds(new Set())
    loadData()
    if (failed > 0) setError(`${failed} deletion${failed !== 1 ? 's' : ''} failed`)
  }

  const handleDeleteAll = async () => {
    const count = rosters.length
    if (count === 0) return
    if (!confirm(`Delete ALL ${count} assignments in this view?`)) return
    const res = await Promise.allSettled(
      rosters.map((r) =>
        fetch(`/api/rosters?id=${r.id}`, { method: 'DELETE' })
      )
    )
    const failed = res.filter((r) => r.status === 'rejected').length
    setSelectedIds(new Set())
    loadData()
    if (failed > 0) setError(`${failed} deletion${failed !== 1 ? 's' : ''} failed`)
  }

  const handleEditStaff = async (rosterId: string) => {
    if (!editNewStaffId) return
    const res = await fetch('/api/rosters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rosterId, staff_id: editNewStaffId }),
    })
    if (res.ok) {
      setEditRosterId(null)
      setEditNewStaffId('')
      loadData()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to update staff')
    }
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
          <AlertCircle className="h-10 w-10 text-[var(--color-warning)] mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)] text-sm mb-4">{error}</p>
          <Button onClick={loadData} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent>
      </Card>
    )
  }

  const pending = rosters.filter((r) => r.status === 'pending').length
  const completed = rosters.filter((r) => r.status === 'completed').length
  const missed = rosters.filter((r) => r.status === 'missed').length

  const rosterTitle = viewMode === 'week'
    ? `Weekly Roster (${weekRange.dates[0]} to ${weekRange.dates[4]})`
    : `Roster for ${filterDate}`

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase">Pending</p>
          <p className="text-2xl font-bold text-[var(--color-warning)]">{pending}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase">Completed</p>
          <p className="text-2xl font-bold text-[var(--color-success)]">{completed}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase">Missed</p>
          <p className="text-2xl font-bold text-[var(--color-danger)]">{missed}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setLoading(true) }}
            className="h-9 rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)]"
          />
        </div>
        <select
          value={filterDuty}
          onChange={(e) => { setFilterDuty(e.target.value); setLoading(true) }}
          className="h-9 rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)]"
        >
          <option value="">All Duties</option>
          {dutyTypes.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <div className="flex items-center border border-[var(--color-border-hover)] rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-[var(--color-info)] text-[var(--color-text-sidebar)]' : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'}`}
          >Day</button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'week' ? 'bg-[var(--color-info)] text-[var(--color-text-sidebar)]' : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'}`}
          >Week</button>
        </div>
        {isAdminOrCommandant && (
          <>
            <Button onClick={handleAutoAssignWeek} variant="outline" size="sm" className="gap-2 border-[var(--color-warning)]/40 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10">
              <Wand2 className="h-4 w-4" /> Assign Inspection Duty
            </Button>
            <Button onClick={handleGenerateAll} variant="outline" size="sm" className="gap-2">
              <CalendarPlus className="h-4 w-4" /> Generate All Duties
            </Button>
            <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Assignment
            </Button>
            <Button onClick={() => setShowTypeManager(!showTypeManager)} variant="outline" size="sm" className="gap-2">
              <List className="h-4 w-4" /> {showTypeManager ? 'Close Types' : 'Manage Types'}
            </Button>
            {rosters.length > 0 && (
              <Button onClick={handleDeleteAll} variant="outline" size="sm" className="gap-2 border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10">
                <Trash2 className="h-4 w-4" /> Delete All
              </Button>
            )}
          </>
        )}
      </div>

      {showAddForm && (
        <Card className="border-[var(--color-success)]/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4 text-[var(--color-success)]" />
              New Duty Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Staff</label>
                <select
                  value={addStaffId}
                  onChange={(e) => setAddStaffId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)]"
                >
                  <option value="">Select staff...</option>
                  {allStaff.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.staff_id})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Duty Type</label>
                <select
                  value={addDutyTypeId}
                  onChange={(e) => setAddDutyTypeId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)]"
                >
                  <option value="">Select duty...</option>
                  {dutyTypes.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Date</label>
                <input
                  type="date"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)]"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleAddAssignment} size="sm" className="gap-1.5" disabled={!addStaffId || !addDutyTypeId}>
                  <Plus className="h-3.5 w-3.5" /> Assign
                </Button>
                <Button onClick={() => setShowAddForm(false)} variant="ghost" size="sm">Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showTypeManager && (
        <Card className="border-[var(--color-info)]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <List className="h-4 w-4 text-[var(--color-info)]" />
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
                <label className="text-sm font-medium text-[var(--color-text-primary)]">Color</label>
                <input type="color" value={newTypeColor}
                  onChange={(e) => setNewTypeColor(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-card)] p-1 cursor-pointer" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddType} size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Duty
                </Button>
              </div>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {dutyTypes.map((dt) => (
                <div key={dt.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: dt.color }} />
                    {editTypeId === dt.id ? (
                      <div className="flex items-center gap-2">
                        <input type="text" value={editTypeName}
                          onChange={(e) => setEditTypeName(e.target.value)}
                          className="h-8 rounded border border-[var(--color-info)]/40 px-2 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-[var(--color-ring-focus)]" />
                        <button onClick={() => handleRenameType(dt.id)} className="text-[var(--color-success)] hover:text-[var(--color-success)]">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditTypeId(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{dt.name}</span>
                        {dt.description && (
                          <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">{dt.description}</span>
                        )}
                      </>
                    )}
                  </div>
                  {editTypeId !== dt.id && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditTypeId(dt.id); setEditTypeName(dt.name) }}
                        className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-info)] transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteType(dt.id)}
                        className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors">
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

      {rosters.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>{rosterTitle}</span>
                <span className="text-xs font-normal text-[var(--color-text-muted)]">{rosters.length} assignment{rosters.length !== 1 ? 's' : ''}</span>
              </div>
              {isAdminOrCommandant && selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-secondary)]">{selectedIds.size} selected</span>
                  <Button onClick={handleDeleteSelected} size="sm" variant="outline" className="gap-1.5 text-[var(--color-danger)] border-[var(--color-danger)]/40 hover:bg-[var(--color-danger)]/10 text-xs h-7">
                    <Trash2 className="h-3 w-3" /> Delete Selected
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-secondary)]">
                    {isAdminOrCommandant && (
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={rosters.length > 0 && selectedIds.size === rosters.length}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-[var(--color-border-hover)] text-[var(--color-info)] focus:ring-[var(--color-ring-focus)] cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 font-medium">Staff</th>
                    <th className="px-6 py-3 font-medium">Duty</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    {isAdminOrCommandant && <th className="px-6 py-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {displayRosters.map((r) => (
                    <tr key={r.id} className={`text-sm transition-colors ${selectedIds.has(r.id) ? 'bg-[var(--color-info)]/10' : 'hover:bg-[var(--color-bg-hover)]'}`}>
                      {isAdminOrCommandant && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            className="h-4 w-4 rounded border-[var(--color-border-hover)] text-[var(--color-info)] focus:ring-[var(--color-ring-focus)] cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-6 py-3">
                        {editRosterId === r.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editNewStaffId}
                              onChange={(e) => setEditNewStaffId(e.target.value)}
                              className="text-xs border border-[var(--color-border-hover)] rounded px-2 py-1 bg-[var(--color-bg-card)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring-focus)]"
                            >
                              <option value="">Select...</option>
                              {allStaff.map((s) => (
                                <option key={s.id} value={s.id}>{s.full_name} ({s.staff_id})</option>
                              ))}
                            </select>
                            <button onClick={() => handleEditStaff(r.id)} className="text-[var(--color-success)] hover:text-[var(--color-success)] text-xs font-medium">Save</button>
                            <button onClick={() => setEditRosterId(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] text-xs">Cancel</button>
                          </div>
                        ) : (
                          <div>
                            <span className="font-medium text-[var(--color-text-primary)]">{r.staff?.full_name || 'Unknown'}</span>
                            <p className="text-xs text-[var(--color-text-muted)]">{r.staff?.staff_id}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.duty_type?.color || '#3b82f6' }} />
                          <span>DUTY: {r.duty_type?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[var(--color-text-secondary)]">{r.date}</td>
                      <td className="px-6 py-3">
                        {isAdminOrCommandant ? (
                          <select
                            value={r.status}
                            onChange={(e) => handleStatusChange(r.id, e.target.value)}
                            className="text-xs border border-[var(--color-border-hover)] rounded px-2 py-1 bg-[var(--color-bg-card)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring-focus)]"
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="missed">Missed</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.status === 'completed' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' :
                            r.status === 'missed' ? 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]' :
                            'bg-[var(--color-warning)]/20 text-[var(--color-warning)]'
                          }`}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        )}
                      </td>
                      {isAdminOrCommandant && (
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            {editRosterId !== r.id && (
                              <>
                                <button
                                  onClick={() => { setEditRosterId(r.id); setEditNewStaffId(r.staff_id) }}
                                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-info)] transition-colors"
                                  title="Change staff"
                                >
                                  <Users className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRoster(r.id)}
                                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                                  title="Remove assignment"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                {rosters.length > 5 && (
                  <tfoot>
                    <tr>
                      <td colSpan={99} className="text-center py-2">
                        <button
                          onClick={() => setShowAllRosters(!showAllRosters)}
                          className="flex items-center gap-1 mx-auto py-1.5 px-3 text-xs font-medium text-[var(--color-info)] hover:text-[var(--color-info)] hover:bg-[var(--color-info)]/10 rounded-lg transition-colors"
                        >
                          {showAllRosters ? (
                            <>Show less</>
                          ) : (
                            <>Show {rosters.length - 5} more</>
                          )}
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{rosterTitle}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
              <CalendarPlus className="h-14 w-14 mb-3 stroke-1" />
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">No duty rosters found</p>
              <p className="text-xs mt-1">Use <strong>Assign Inspection Duty</strong> or <strong>Add Assignment</strong> to get started</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
