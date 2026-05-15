import { gql } from '@apollo/client'

export const PLATFORM_LOGIN = gql`
  mutation PlatformLogin($identifier: String!, $password: String!) {
    platformLogin(identifier: $identifier, password: $password) {
      accessToken
      expiresAt
      role
      scope
    }
  }
`

export const REFRESH_SESSION = gql`
  mutation RefreshSession {
    refreshSession {
      accessToken
      expiresAt
      role
      scope
    }
  }
`

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`

export const PLATFORM_ME = gql`
  query PlatformMe {
    platformMe {
      id
      name
      identifier
      platformRole
      scope
    }
  }
`
