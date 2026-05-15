import { MockedProvider } from '@apollo/client/testing/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PLATFORM_LOGIN } from '../../../graphql/session'
import { LoginScreen } from './LoginScreen'

const apolloMocks = vi.hoisted(() => ({
  resetStore: vi.fn(),
  setSuperAdminAccessToken: vi.fn(),
}))

vi.mock('../../../lib/apollo', () => ({
  apolloClient: { resetStore: apolloMocks.resetStore },
  setSuperAdminAccessToken: apolloMocks.setSuperAdminAccessToken,
}))

describe('LoginScreen', () => {
  beforeEach(() => {
    apolloMocks.resetStore.mockResolvedValue(undefined)
    apolloMocks.setSuperAdminAccessToken.mockClear()
  })

  it('keeps submit disabled until credentials are present', () => {
    render(
      <MockedProvider>
        <LoginScreen onLoggedIn={vi.fn()} />
      </MockedProvider>,
    )

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled()
  })

  it('sets the token and marks login success', async () => {
    const user = userEvent.setup()
    const onLoggedIn = vi.fn()

    render(
      <MockedProvider mocks={[{
        request: { query: PLATFORM_LOGIN, variables: { identifier: 'owner@ejoy.local', password: 'secret' } },
        result: { data: { platformLogin: { accessToken: 'token-1', expiresAt: '2026-05-15T10:00:00.000Z' } } },
      }]}>
        <LoginScreen onLoggedIn={onLoggedIn} />
      </MockedProvider>,
    )

    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(apolloMocks.setSuperAdminAccessToken).toHaveBeenCalledWith('token-1')
      expect(onLoggedIn).toHaveBeenCalledWith('2026-05-15T10:00:00.000Z')
    })
  })
})
