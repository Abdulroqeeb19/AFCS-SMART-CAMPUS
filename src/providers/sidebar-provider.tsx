'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface SidebarContextValue {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  toggleMobile: () => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue>({
  mobileOpen: false,
  setMobileOpen: () => {},
  toggleMobile: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <SidebarContext.Provider
      value={{ mobileOpen, setMobileOpen, toggleMobile: () => setMobileOpen((v) => !v), sidebarCollapsed, setSidebarCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
