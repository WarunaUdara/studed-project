export const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        fullName
        role
        grade
        preferredLanguage
        totalXp
      }
    }
  }
` as const;

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        fullName
        role
        grade
        preferredLanguage
        totalXp
      }
    }
  }
` as const;

export const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      user {
        id
        email
        fullName
        role
        grade
        preferredLanguage
        totalXp
      }
    }
  }
` as const;

export const LOGOUT_MUTATION = `
  mutation Logout {
    logout
  }
` as const;

export const ME_QUERY = `
  query Me {
    me {
      id
      email
      fullName
      role
      grade
      preferredLanguage
      totalXp
      streak
    }
  }
` as const;
