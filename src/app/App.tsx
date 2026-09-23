import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { RoleProvider } from '@/contexts/RoleContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { routes } from './routes'

const router = createBrowserRouter(routes)

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <RoleProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </RoleProvider>
    </ThemeProvider>
  )
}

export default App
