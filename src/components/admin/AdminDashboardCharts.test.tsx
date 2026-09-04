import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { RoomOccupancyWidget } from './AdminDashboardCharts'

afterEach(() => cleanup())

describe('RoomOccupancyWidget', () => {
  it('renders total and only Available / Occupied / Maintenance counts', () => {
    render(
      <RoomOccupancyWidget total={10} available={5} occupied={3} maintenance={2} />,
    )

    expect(screen.getByText('Total rooms')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Occupied')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.queryByText(/reserved/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/not ready/i)).not.toBeInTheDocument()

    expect(
      screen.getByRole('img', {
        name: /Room status: 5 available, 3 occupied, 2 maintenance/i,
      }),
    ).toBeInTheDocument()
  })

  it('segment widths sum to 100% of total when all statuses present', () => {
    const { container } = render(
      <RoomOccupancyWidget total={10} available={5} occupied={3} maintenance={2} />,
    )
    const segments = container.querySelectorAll('[role="img"] > div')
    const widths = [...segments].map((el) => parseFloat((el as HTMLElement).style.width))
    expect(widths).toEqual([50, 30, 20])
    expect(widths.reduce((a, b) => a + b, 0)).toBe(100)
  })
})
