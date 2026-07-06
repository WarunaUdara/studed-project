export const CONTENT_BLOCKS_QUERY = `
  query ContentBlocks($waveId: ID, $type: ContentBlockType) {
    contentBlocks(waveId: $waveId, type: $type) {
      id
      waveId
      title
      type
      payloadJson
      version
      status
      createdBy
      createdAt
      updatedAt
    }
  }
` as const;

export const CONTENT_BLOCK_QUERY = `
  query ContentBlock($id: ID!) {
    contentBlock(id: $id) {
      id
      waveId
      title
      type
      payloadJson
      version
      status
      createdBy
      createdAt
      updatedAt
    }
  }
` as const;

export const CONTENT_VERSION_HISTORY_QUERY = `
  query ContentVersionHistory($contentBlockId: ID!) {
    contentVersionHistory(contentBlockId: $contentBlockId) {
      id
      contentBlockId
      versionNumber
      payloadJson
      createdAt
    }
  }
` as const;

export const CREATE_CONTENT_BLOCK_MUTATION = `
  mutation CreateContentBlock($input: CreateContentBlockInput!) {
    createContentBlock(input: $input) {
      id
      waveId
      title
      type
      payloadJson
      version
      status
      createdAt
      updatedAt
    }
  }
` as const;

export const UPDATE_CONTENT_BLOCK_MUTATION = `
  mutation UpdateContentBlock($id: ID!, $input: UpdateContentBlockInput!) {
    updateContentBlock(id: $id, input: $input) {
      id
      waveId
      title
      type
      payloadJson
      version
      status
      createdAt
      updatedAt
    }
  }
` as const;

export const PUBLISH_CONTENT_BLOCK_MUTATION = `
  mutation PublishContentBlock($id: ID!) {
    publishContentBlock(id: $id) {
      id
      status
    }
  }
` as const;

export const DELETE_CONTENT_BLOCK_MUTATION = `
  mutation DeleteContentBlock($id: ID!) {
    deleteContentBlock(id: $id)
  }
` as const;
