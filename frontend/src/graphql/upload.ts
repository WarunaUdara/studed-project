export const MEDIA_ASSETS_QUERY = `
  query MediaAssets($mimeTypePrefix: String) {
    mediaAssets(mimeTypePrefix: $mimeTypePrefix) {
      id
      uploaderId
      filename
      mimeType
      sizeBytes
      storageKey
      cdnUrl
      status
      createdAt
    }
  }
` as const;

export const MEDIA_ASSET_QUERY = `
  query MediaAsset($id: ID!) {
    mediaAsset(id: $id) {
      id
      uploaderId
      filename
      mimeType
      sizeBytes
      storageKey
      cdnUrl
      status
      createdAt
    }
  }
` as const;

export const DELETE_MEDIA_ASSET_MUTATION = `
  mutation DeleteMediaAsset($id: ID!) {
    deleteMediaAsset(id: $id)
  }
` as const;
