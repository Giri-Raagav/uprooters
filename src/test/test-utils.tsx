import { render, type RenderOptions } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { RoleProvider } from '@/contexts/RoleContext'
import { routes } from '@/app/routes'

/**
 * Renders the application route tree with MemoryRouter for reliable Vitest navigation.
 * Production uses BrowserRouter via App.tsx — behavior under test matches route config.
 */
export function renderRoutes(initialEntries: string[] = ['/'], options?: RenderOptions) {
  const router = createMemoryRouter(routes, { initialEntries })

  return {
    router,
    ...render(
      <ThemeProvider>
        <RoleProvider>
          <RouterProvider router={router} />
        </RoleProvider>
      </ThemeProvider>,
      options
    ),
  }
}
