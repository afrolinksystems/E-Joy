import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PrintRetryResult } from './PrintRetryResult'

describe('PrintRetryResult', () => {
  it('only renders when a retry result exists', () => {
    const { rerender } = render(<PrintRetryResult result="" />)

    expect(screen.queryByText(/processed/)).not.toBeInTheDocument()
    rerender(<PrintRetryResult result={'{"processed":1}'} />)
    expect(screen.getByText('{"processed":1}')).toBeInTheDocument()
  })
})
