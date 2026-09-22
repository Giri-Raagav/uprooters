import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App Shell Foundation', () => {
  it('renders the UPROOTERS brand header and navigation shell', () => {
    render(<App />)

    // Check brand header presence
    const brandElements = screen.getAllByText('UPROOTERS')
    expect(brandElements.length).toBeGreaterThan(0)

    // Check navigation item presence (Dashboard appears in nav; Career Readiness appears in both brand tagline and nav)
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Career Readiness').length).toBeGreaterThan(0)

    // Check placeholder page content renders for default route
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument()
  })
})
