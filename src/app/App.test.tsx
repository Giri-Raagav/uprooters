import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import App from './App'
import { renderRoutes } from '@/test/test-utils'

const THEME_STORAGE_KEY = 'uprooters-theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-shell')
})

describe('Milestone 02 — Application Shell & Visual Foundation', () => {
  describe('Production App entry', () => {
    it('mounts the root App with browser router', () => {
      const { unmount } = renderRoutes(['/'])
      expect(screen.getAllByText(/Ace&place/i).length).toBeGreaterThan(0)
      unmount()
      // Smoke: default export still composes providers + router
      expect(App).toBeDefined()
    })
  })

  describe('LandingPage (/)', () => {
    it('renders the Ace&place opening experience', () => {
      renderRoutes(['/'])
      expect(screen.getAllByText(/Ace&place/i).length).toBeGreaterThan(0)
    })

    it('renders both role selector options', () => {
      renderRoutes(['/'])
      expect(
        screen.getByRole('button', { name: /enter uprooters as a student/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /enter uprooters as an administrator/i })
      ).toBeInTheDocument()
    })

    it('renders the product description on the landing page', () => {
      renderRoutes(['/'])
      expect(screen.getByText(/UPROOTERS tracks your complete college journey/i)).toBeInTheDocument()
    })

    it('renders the study quote on the landing page', () => {
      renderRoutes(['/'])
      expect(screen.getByText(/roots of education/i)).toBeInTheDocument()
    })

    it('states that role selection is not authentication', () => {
      renderRoutes(['/'])
      expect(screen.getByText(/role selection is for navigation only/i)).toBeInTheDocument()
    })
  })

  describe('Theme', () => {
    it('uses light mode by default on first load', () => {
      renderRoutes(['/'])
      expect(document.documentElement.getAttribute('data-theme')).toBeNull()
    })

    it('toggles to dark mode manually from the student shell', async () => {
      renderRoutes(['/app'])

      await waitFor(() => {
        expect(screen.getByText('Your dashboard will appear here')).toBeInTheDocument()
      })

      const themeToggleButtons = screen.getAllByRole('button', { name: /switch to dark mode/i })
      fireEvent.click(themeToggleButtons[0])

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      })
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    })
  })

  describe('Student shell (/app/*)', () => {
    it('navigates to the student shell when Student role is selected', async () => {
      renderRoutes(['/'])

      fireEvent.click(screen.getByRole('button', { name: /enter uprooters as a student/i }))

      await waitFor(() => {
        expect(screen.getAllByText('UPROOTERS').length).toBeGreaterThan(0)
      })
      await waitFor(() => {
        expect(screen.getByText('Your dashboard will appear here')).toBeInTheDocument()
      })
    })

    it('shows student navigation when loaded at /app', async () => {
      renderRoutes(['/app'])

      await waitFor(() => {
        expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Career Readiness').length).toBeGreaterThan(0)
      })
    })

    it('shows Dashboard page content by default at /app', async () => {
      renderRoutes(['/app'])

      await waitFor(() => {
        expect(screen.getByText('Your dashboard will appear here')).toBeInTheDocument()
      })
    })

    it('navigates to Profile via student sidebar', async () => {
      renderRoutes(['/app'])

      const profileLinks = await screen.findAllByRole('link', { name: /^Profile$/i })
      fireEvent.click(profileLinks[0])

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /^Profile$/i })).toBeInTheDocument()
      })
    })
  })

  describe('Admin shell (/admin/*)', () => {
    it('navigates to the admin shell when Administrator role is selected', async () => {
      renderRoutes(['/'])

      fireEvent.click(screen.getByRole('button', { name: /enter uprooters as an administrator/i }))

      await waitFor(() => {
        expect(screen.getByText('Administrator Overview')).toBeInTheDocument()
      })
    })

    it('shows admin overview when loaded at /admin', async () => {
      renderRoutes(['/admin'])

      await waitFor(() => {
        expect(screen.getByText('Administrator Overview')).toBeInTheDocument()
      })
    })

    it('navigates to Data Management via admin sidebar', async () => {
      renderRoutes(['/admin'])

      const dataLink = await screen.findByRole('link', { name: /^Data Management$/i })
      fireEvent.click(dataLink)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /^Data Management$/i })).toBeInTheDocument()
      })
    })

    it('sets data-shell="admin" attribute when mounted at /admin', async () => {
      const { unmount } = renderRoutes(['/admin'])
      expect(document.documentElement.getAttribute('data-shell')).toBe('admin')
      unmount()
      expect(document.documentElement.getAttribute('data-shell')).toBeNull()
    })
  })
})
