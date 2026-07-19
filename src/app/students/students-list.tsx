'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Plus, Search, GraduationCap, UserPlus, Pencil, X, Check, Power, PowerOff, BookOpen, Trash2, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/skeleton'
import { QRButton } from '@/components/qr-code'


interface PrefectRole {
  id: string
  name: string
  display_order: number
}

interface Student {
  id: string
  student_id: string
  full_name: string
  class_id: string
  parent_name: string | null
  parent_phone: string | null
  parent_email: string | null
  is_active: boolean
  prefect_role_id: string | null
  prefect_role: PrefectRole | null
  class: { id: string; name: string; arm: string } | null
}

interface Class {
  id: string
  name: string
  arm: string
}

export function StudentsList() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [prefectRoles, setPrefectRoles] = useState<PrefectRole[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [prefectFilter, setPrefectFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [showClasses, setShowClasses] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassArm, setNewClassArm] = useState('')
  const [assignRoleId, setAssignRoleId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    student_id: '',
    full_name: '',
    class_id: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
  })

  const [editForm, setEditForm] = useState({
    full_name: '',
    class_id: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    prefect_role_id: '',
  })

  const loadData = async () => {
    setError('')
    try {
      const [studentRes, classRes, roleRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/classes'),
        fetch('/api/prefect-roles'),
      ])
      if (studentRes.ok) setStudents(await studentRes.json())
      else setError('Failed to load students')
      if (classRes.ok) setClasses(await classRes.json())
      else setError('Failed to load classes')
      if (roleRes.ok) setPrefectRoles(await roleRes.json())
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setAdding(true)
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowAdd(false)
        setForm({ student_id: '', full_name: '', class_id: '', parent_name: '', parent_phone: '', parent_email: '' })
        loadData()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add student')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (id: string, data: Record<string, string>): Promise<boolean> => {
    setError('')
    try {
      const res = await fetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to update')
        return false
      }
      loadData()
      return true
    } catch {
      setError('Network error. Please try again.')
      return false
    }
  }

  const startEdit = (student: Student) => {
    setError('')
    setEditForm({
      full_name: student.full_name,
      class_id: student.class_id,
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      parent_email: student.parent_email || '',
      prefect_role_id: student.prefect_role?.id || '',
    })
    setEditId(student.id)
  }

  const saveEdit = async (id: string) => {
    const ok = await handleUpdate(id, editForm)
    if (ok) setEditId(null)
  }

  const toggleActive = async (student: Student) => {
    await handleUpdate(student.id, { is_active: (!student.is_active).toString() })
  }

  const handleDelete = async (student: Student) => {
    if (!confirm(`Delete ${student.full_name} (${student.student_id})? This cannot be undone.`)) return
    setError('')
    try {
      const res = await fetch(`/api/students?id=${student.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to delete')
        return
      }
      loadData()
    } catch {
      setError('Network error. Please try again.')
    }
  }

  const filtered = students.filter((s) => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()) ||
      (s.parent_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchClass = !classFilter || s.class_id === classFilter
    const matchPrefect = !prefectFilter || s.prefect_role?.id === prefectFilter || (prefectFilter === 'none' && !s.prefect_role)
    return matchSearch && matchClass && matchPrefect
  })

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4">
            <Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-3 w-20 mb-3" /><Skeleton className="h-3 w-24" />
          </CardContent></Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text" placeholder="Search by name, ID, or parent..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          />
        </div>
        <select
          value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
          className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
          ))}
        </select>
        <select
          value={prefectFilter} onChange={(e) => setPrefectFilter(e.target.value)}
          className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="none">No Prefect Role</option>
          {prefectRoles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Student
        </Button>
        <Button onClick={() => setShowClasses(!showClasses)} variant="outline" className="gap-2">
          <BookOpen className="h-4 w-4" /> {showClasses ? 'Close Classes' : 'Manage Classes'}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showAdd && (
        <Card className="border-violet-200 bg-violet-50/50">
          <CardContent className="p-4">
            <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input id="ns-id" label="Student ID" placeholder="e.g. STU-0021" value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })} required />
              <Input id="ns-name" label="Full Name" placeholder="Full name" value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              <Select id="ns-class" label="Class" value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                options={classes.map((c) => ({ value: c.id, label: `${c.name} ${c.arm}` }))}
                placeholder="Select class" />
              <Input id="ns-parent" label="Parent Name" placeholder="Parent/Guardian" value={form.parent_name}
                onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
              <Input id="ns-phone" label="Parent Phone" placeholder="+234 800 000 0000" value={form.parent_phone}
                onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} />
              <Input id="ns-email" label="Parent Email" type="email" placeholder="parent@example.com" value={form.parent_email}
                onChange={(e) => setForm({ ...form, parent_email: e.target.value })} />
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={adding}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  {adding ? 'Saving...' : 'Save Student'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showClasses && (
        <Card className="border-violet-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-violet-500" />
              <p className="text-sm font-semibold text-zinc-700">Classes Management</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <Input placeholder="e.g. JS1" value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)} label="Class Name" />
              <Input placeholder="e.g. A" value={newClassArm}
                onChange={(e) => setNewClassArm(e.target.value)} label="Arm" />
              <div className="flex items-end">
                <Button onClick={async () => {
                  setError('')
                  if (!newClassName.trim() || !newClassArm.trim()) return
                  try {
                    const res = await fetch('/api/classes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: newClassName.trim(), arm: newClassArm.trim() }),
                    })
                    if (!res.ok) {
                      const data = await res.json()
                      setError(data.error || 'Failed to add class')
                      return
                    }
                    setNewClassName('')
                    setNewClassArm('')
                    loadData()
                  } catch {
                    setError('Network error. Please try again.')
                  }
                }} size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Class
                </Button>
              </div>
            </div>
            <div className="divide-y divide-zinc-100">
              {classes.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-zinc-700">{c.name} {c.arm}</span>
                  <button onClick={async () => {
                    if (!confirm(`Delete class ${c.name} ${c.arm}?`)) return
                    await fetch(`/api/classes?id=${c.id}`, { method: 'DELETE' })
                    loadData()
                  }} className="p-1 text-zinc-400 hover:text-red-600 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <GraduationCap className="h-12 w-12 mx-auto mb-3 stroke-1" />
          <p className="font-medium text-zinc-500">No students found</p>
          <p className="text-xs mt-1">{search || classFilter ? 'Try different filters' : 'Click "Add Student" to get started'}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            Showing {filtered.length} of {students.length} student{students.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {editId === s.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold uppercase text-zinc-400">Editing</p>
                        <button onClick={() => { setEditId(null); setError('') }} className="text-zinc-400 hover:text-zinc-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <Input label="Full Name" value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
                      <Select label="Class" value={editForm.class_id}
                        onChange={(e) => setEditForm({ ...editForm, class_id: e.target.value })}
                        options={classes.map((c) => ({ value: c.id, label: `${c.name} ${c.arm}` }))}
                        placeholder="Select class" />
                      <Input label="Parent Name" value={editForm.parent_name}
                        onChange={(e) => setEditForm({ ...editForm, parent_name: e.target.value })} />
                      <Input label="Parent Phone" value={editForm.parent_phone}
                        onChange={(e) => setEditForm({ ...editForm, parent_phone: e.target.value })} />
                      <Input label="Parent Email" type="email" value={editForm.parent_email}
                        onChange={(e) => setEditForm({ ...editForm, parent_email: e.target.value })} />
                      <Select label="Prefect Role" value={editForm.prefect_role_id}
                        onChange={(e) => setEditForm({ ...editForm, prefect_role_id: e.target.value })}
                        options={[
                          { value: '', label: 'None' },
                          ...prefectRoles.map((r) => ({ value: r.id, label: r.name })),
                        ]}
                        placeholder="No prefect role" />
                      <Button onClick={() => saveEdit(s.id)} size="sm" className="gap-1.5 w-full">
                        <Check className="h-3.5 w-3.5" /> Save Changes
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-900 truncate">{s.full_name}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{s.student_id}</p>
                        </div>
                        <Badge variant={s.is_active ? 'success' : 'danger'}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-zinc-500">
                        <p className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase text-zinc-400 w-16">Class:</span>
                          <span>{s.class ? `${s.class.name} ${s.class.arm}` : '-'}</span>
                        </p>
                        {s.parent_name && (
                          <p className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase text-zinc-400 w-16">Parent:</span>
                            <span>{s.parent_name}</span>
                          </p>
                        )}
                        {s.parent_phone && (
                          <p className="text-xs flex items-center gap-1.5">
                            <span className="text-[10px] uppercase text-zinc-400 w-16">Phone:</span>
                            <span>{s.parent_phone}</span>
                          </p>
                        )}
                        {s.parent_email && (
                          <p className="text-xs flex items-center gap-1.5">
                            <span className="text-[10px] uppercase text-zinc-400 w-16">Email:</span>
                            <span className="truncate">{s.parent_email}</span>
                          </p>
                        )}
                        {s.prefect_role && (
                          <p className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] uppercase text-zinc-400 w-16">Prefect:</span>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-800">{s.prefect_role.name}</span>
                          </p>
                        )}
                        <p className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] uppercase text-zinc-400 w-16">Role:</span>
                          <select
                            value={s.prefect_role_id || ''}
                            onChange={async (e) => {
                              await handleUpdate(s.id, { prefect_role_id: e.target.value })
                            }}
                            className="text-xs border border-zinc-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 max-w-[180px]"
                          >
                            <option value="">No role</option>
                            {prefectRoles.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-zinc-100 flex-wrap">
                        <button
                          onClick={() => startEdit(s)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <QRButton id={s.student_id} name={s.full_name} title="Student ID Card" />
                        <button
                          onClick={() => toggleActive(s)}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            s.is_active ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'
                          }`}
                        >
                          {s.is_active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                          {s.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

    </div>
  )
}
