import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { RoleProvider } from '@/contexts/RoleContext'
import { routes } from './routes'

const router = createBrowserRouter(routes)

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <RoleProvider>
        <RouterProvider router={router} />
      </RoleProvider>
    </ThemeProvider>
  )
}

export default App
