export const MY_SUBSCRIPTION_QUERY = `
  query MySubscription {
    me {
      id
      subscription {
        id
        tier
        status
        startDate
        endDate
      }
    }
  }
` as const;

export const CREATE_SUBSCRIPTION_MUTATION = `
  mutation CreateSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      id
      tier
      status
      startDate
      endDate
    }
  }
` as const;

export const CANCEL_SUBSCRIPTION_MUTATION = `
  mutation CancelSubscription {
    cancelSubscription {
      id
      tier
      status
      startDate
      endDate
    }
  }
` as const;
