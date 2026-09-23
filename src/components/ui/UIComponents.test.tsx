import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card, CardHeader, CardBody, CardFooter } from './Card'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { PageHeader } from './PageHeader'
import { Spinner } from './Spinner'
import { StatusIndicator } from './StatusIndicator'
import { CheckCircle, Info } from 'lucide-react'

describe('Reusable UI Components (Milestone 02 Foundation)', () => {
  describe('Badge', () => {
    it('renders text and handles default variant', () => {
      render(<Badge>Test Badge</Badge>)
      expect(screen.getByText('Test Badge')).toBeInTheDocument()
    })

    it('renders with custom icon', () => {
      render(
        <Badge variant="verified" icon={<CheckCircle data-testid="verified-icon" />}>
          Verified
        </Badge>
      )
      expect(screen.getByText('Verified')).toBeInTheDocument()
      expect(screen.getByTestId('verified-icon')).toBeInTheDocument()
    })

    it('renders wine and emerald brand variants', () => {
      const { rerender } = render(<Badge variant="wine">Wine Variant</Badge>)
      expect(screen.getByText('Wine Variant')).toHaveClass('text-brand-wine')

      rerender(<Badge variant="emerald">Emerald Variant</Badge>)
      expect(screen.getByText('Emerald Variant')).toHaveClass('text-brand-emerald')
    })
  })

  describe('Button', () => {
    it('renders button with click handler', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click Me</Button>)
      fireEvent.click(screen.getByRole('button', { name: 'Click Me' }))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('displays loading spinner and sets aria-busy when loading', () => {
      render(<Button loading>Submit</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toHaveAttribute('aria-busy', 'true')
      expect(btn).toBeDisabled()
    })

    it('renders as anchor when href is provided', () => {
      render(<Button href="https://example.com">External Link</Button>)
      const link = screen.getByRole('link', { name: 'External Link' })
      expect(link).toHaveAttribute('href', 'https://example.com')
    })
  })

  describe('Card', () => {
    it('renders header, body, and footer slots', () => {
      render(
        <Card interactive>
          <CardHeader>Header Content</CardHeader>
          <CardBody>Body Content</CardBody>
          <CardFooter>Footer Content</CardFooter>
        </Card>
      )
      expect(screen.getByText('Header Content')).toBeInTheDocument()
      expect(screen.getByText('Body Content')).toBeInTheDocument()
      expect(screen.getByText('Footer Content')).toBeInTheDocument()
    })
  })

  describe('EmptyState', () => {
    it('renders icon, title, description, and action button', () => {
      const handleAction = vi.fn()
      render(
        <EmptyState
          icon={Info}
          title="No records found"
          description="Try updating your search filters"
          action={{ label: 'Reset', onClick: handleAction }}
        />
      )
      expect(screen.getByText('No records found')).toBeInTheDocument()
      expect(screen.getByText('Try updating your search filters')).toBeInTheDocument()
      const btn = screen.getByRole('button', { name: 'Reset' })
      fireEvent.click(btn)
      expect(handleAction).toHaveBeenCalledTimes(1)
    })
  })

  describe('ErrorState', () => {
    it('renders user-facing error message with retry button', () => {
      const handleRetry = vi.fn()
      render(
        <ErrorState
          title="Network Error"
          message="Could not load resource. Please try again."
          onRetry={handleRetry}
        />
      )
      expect(screen.getByText('Network Error')).toBeInTheDocument()
      expect(screen.getByText('Could not load resource. Please try again.')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
      expect(handleRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('Spinner', () => {
    it('renders accessible loading spinner with role="status"', () => {
      render(<Spinner size="lg" label="Processing request…" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-label', 'Processing request…')
      expect(screen.getByText('Processing request…')).toHaveClass('sr-only')
    })
  })

  describe('StatusIndicator', () => {
    it('renders requirement status with dot, icon, and text', () => {
      render(<StatusIndicator status="met" />)
      const indicator = screen.getByRole('status')
      expect(indicator).toHaveAttribute('aria-label', 'Met')
      expect(screen.getByText('Met')).toBeInTheDocument()
    })

    it('renders missing status with appropriate aria label', () => {
      render(<StatusIndicator status="missing" />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Missing')
    })

    it('renders unverified and stale statuses', () => {
      const { rerender } = render(<StatusIndicator status="unverified" />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Unverified')

      rerender(<StatusIndicator status="stale" />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Stale')
    })
  })

  describe('PageHeader', () => {
    it('renders single h1 title, subtitle, and actions slot', () => {
      render(
        <PageHeader
          title="My Dashboard"
          subtitle="Overview of your college journey"
          actions={<button>Export</button>}
        />
      )
      const heading = screen.getByRole('heading', { level: 1, name: 'My Dashboard' })
      expect(heading).toBeInTheDocument()
      expect(screen.getByText('Overview of your college journey')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
    })
  })
})
