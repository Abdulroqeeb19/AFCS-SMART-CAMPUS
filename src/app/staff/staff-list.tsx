'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Plus, UserPlus, Search, Users, Pencil, X, Check, Power, PowerOff, Trash2, AlertCircle, Shield, GraduationCap } from 'lucide-react'
import { Skeleton } from '@/components/skeleton'

interface StaffMember {
  id: string
  staff_id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  department: { id: string; name: string } | null
  department_id: string | null
  is_active: boolean
}

interface Department {
  id: string
  name: string
  code: string
}

interface ClassInfo {
  id: string
  name: string
  arm: string
  class_teacher_id: string | null
}

const roleConfig: Record<string, { label: string; variant: 'info' | 'warning' | 'danger' | 'secondary'; icon: typeof Shield }> = {
  teacher: { label: 'Teacher', variant: 'info', icon: GraduationCap },
  admin: { label: 'Admin', variant: 'warning', icon: Shield },
  commandant: { label: 'Commandant', variant: 'danger', icon: Shield },
  support: { label: 'Support', variant: 'secondary', icon: Shield },
}

export function StaffList() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [classTeacherIds, setClassTeacherIds] = useState<string[]>([])
  const [assigning, setAssigning] = useState<string | null>(null)

  const [form, setForm] = useState({
    staff_id: '',
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    role: 'teacher',
  })

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    role: 'teacher',
  })

  const loadStaff = async () => {
    setError('')
    try {
      const [staffRes, deptRes, classesRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/departments'),
        fetch('/api/classes'),
      ])
      if (!staffRes.ok) { setError('Failed to load staff'); return }
      if (!deptRes.ok) { setError('Failed to load departments'); return }
      setStaff(await staffRes.json())
      if (deptRes.ok) setDepartments(await deptRes.json())
      if (classesRes.ok) {
        const allClasses: ClassInfo[] = await classesRes.json()
        setClasses(allClasses)
        setClassTeacherIds(allClasses.map((c) => c.class_teacher_id).filter(Boolean) as string[])
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadStaff() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setAdding(true)
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowAdd(false)
        setForm({ staff_id: '', full_name: '', email: '', phone: '', department_id: '', role: 'teacher' })
        loadStaff()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add staff')
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
      const res = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to update')
        return false
      }
      loadStaff()
      return true
    } catch {
      setError('Network error. Please try again.')
      return false
    }
  }

  const startEdit = (member: StaffMember) => {
    setError('')
    setEditForm({
      full_name: member.full_name,
      email: member.email,
      phone: member.phone || '',
      department_id: member.department_id || '',
      role: member.role,
    })
    setEditId(member.id)
  }

  const saveEdit = async (id: string) => {
    const ok = await handleUpdate(id, editForm)
    if (ok) setEditId(null)
  }

  const toggleActive = async (member: StaffMember) => {
    await handleUpdate(member.id, { is_active: member.is_active ? 'false' : 'true' })
  }

  const handleDelete = async (member: StaffMember) => {
    if (!confirm(`Delete ${member.full_name} (${member.staff_id})? This cannot be undone.`)) return
    setError('')
    try {
      const res = await fetch(`/api/staff?id=${member.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to delete')
        return
      }
      loadStaff()
    } catch {
      setError('Network error. Please try again.')
    }
  }

  const assignClassTeacher = async (staffId: string, classId: string) => {
    setError('')
    try {
      const res = await fetch('/api/classes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: classId, class_teacher_id: staffId }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to assign')
        return
      }
      setAssigning(null)
      loadStaff()
    } catch {
      setError('Network error. Please try again.')
    }
  }

  const unassignClassTeacher = async (classId: string) => {
    setError('')
    try {
      const res = await fetch('/api/classes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: classId, class_teacher_id: null }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to unassign')
        return
      }
      setAssigning(null)
      loadStaff()
    } catch {
      setError('Network error. Please try again.')
    }
  }

  const getTeacherClasses = (staffId: string) =>
    classes.filter((c) => c.class_teacher_id === staffId)

  const filtered = staff.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.staff_id.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
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
            type="text"
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          />
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showAdd && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                id="new-staff-id"
                label="Staff ID"
                placeholder="e.g. AFC-0020"
                value={form.staff_id}
                onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                required
              />
              <Input
                id="new-full-name"
                label="Full Name"
                placeholder="e.g. John Doe"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
              <Input
                id="new-email"
                label="Email"
                type="email"
                placeholder="john@afcs.edu.ng"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                id="new-phone"
                label="Phone"
                placeholder="+234 800 000 0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Select
                id="new-dept"
                label="Department"
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                placeholder="Select department"
              />
              <Select
                id="new-role"
                label="Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                options={[
                  { value: 'teacher', label: 'Teacher' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'commandant', label: 'Commandant' },
                  { value: 'support', label: 'Support Staff' },
                ]}
              />
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={adding}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  {adding ? 'Saving...' : 'Save Staff'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <Users className="h-12 w-12 mx-auto mb-3 stroke-1" />
          <p className="font-medium text-zinc-500">No staff found</p>
          <p className="text-xs mt-1">{search ? 'Try a different search term' : 'Click "Add Staff" to get started'}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            Showing {filtered.length} of {staff.length} staff member{staff.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((member) => {
              const roleInfo = roleConfig[member.role] || roleConfig.teacher
              const RoleIcon = roleInfo.icon
              return (
                <Card key={member.id} className="hover:shadow-md transition-shadow relative">
                  <CardContent className="p-4">
                    {editId === member.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold uppercase text-zinc-400">Editing</p>
                          <button onClick={() => { setEditId(null); setError('') }} className="text-zinc-400 hover:text-zinc-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <Input
                          label="Full Name"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        />
                        <Input
                          label="Email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                        <Input
                          label="Phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                        <Select
                          label="Department"
                          value={editForm.department_id}
                          onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                          options={departments.map((d) => ({ value: d.id, label: d.name }))}
                          placeholder="Select department"
                        />
                        <Select
                          label="Role"
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          options={[
                            { value: 'teacher', label: 'Teacher' },
                            { value: 'admin', label: 'Admin' },
                            { value: 'commandant', label: 'Commandant' },
                            { value: 'support', label: 'Support Staff' },
                          ]}
                        />
                        <Button onClick={() => saveEdit(member.id)} size="sm" className="gap-1.5 w-full">
                          <Check className="h-3.5 w-3.5" /> Save Changes
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-zinc-900 truncate">{member.full_name}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{member.staff_id}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {member.role === 'teacher' && classTeacherIds.includes(member.id) && (
                              <Badge variant="info">Class Teacher</Badge>
                            )}
                            <Badge variant={member.is_active ? 'success' : 'danger'}>
                              {member.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1.5 text-sm text-zinc-500">
                          <p className="flex items-center gap-1.5">
                            <RoleIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span className="capitalize">{roleInfo.label}</span>
                          </p>
                          {member.department && (
                            <p className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase text-zinc-400 w-16">Dept:</span>
                              <span>{member.department.name}</span>
                            </p>
                          )}
                          <p className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase text-zinc-400 w-16">Email:</span>
                            <span className="truncate text-xs">{member.email}</span>
                          </p>
                          {member.phone && (
                            <p className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase text-zinc-400 w-16">Phone:</span>
                              <span className="text-xs">{member.phone}</span>
                            </p>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-zinc-100">
                          <button
                            onClick={() => startEdit(member)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button
                            onClick={() => toggleActive(member)}
                            className={`flex items-center gap-1 text-xs transition-colors ${
                              member.is_active ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'
                            }`}
                          >
                            {member.is_active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                            {member.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                          {member.role === 'teacher' && (
                            assigning === member.id ? (
                              <div className="flex items-center gap-1">
                                <select
                                  className="text-[10px] border border-zinc-300 rounded px-1 py-0.5 max-w-[100px]"
                                  onChange={(e) => {
                                    if (e.target.value) assignClassTeacher(member.id, e.target.value)
                                  }}
                                  defaultValue=""
                                >
                                  <option value="" disabled>Select class...</option>
                                  {classes
                                    .filter((c) => !c.class_teacher_id || c.class_teacher_id === member.id)
                                    .map((c) => (
                                      <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                                    ))}
                                </select>
                                <button
                                  onClick={() => setAssigning(null)}
                                  className="text-zinc-400 hover:text-zinc-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAssigning(member.id)}
                                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 transition-colors"
                              >
                                <GraduationCap className="h-3 w-3" /> {classTeacherIds.includes(member.id) ? 'Classes' : 'Assign'}
                              </button>
                            )
                          )}
                        </div>
                        {member.role === 'teacher' && !assigning && getTeacherClasses(member.id).length > 0 && (
                          <div className="mt-2 pt-1.5 border-t border-zinc-100">
                            <div className="flex flex-wrap gap-1">
                              {getTeacherClasses(member.id).map((c) => (
                                <span key={c.id} className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                  {c.name} {c.arm}
                                  <button
                                    onClick={() => unassignClassTeacher(c.id)}
                                    className="hover:text-red-600"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
