const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

/**
 * Returns full URL for an API endpoint
 */
export function getApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

/**
 * Fetch all stored images metadata from MongoDB
 */
export async function fetchStoredImages() {
  const res = await fetch(getApiUrl('/api/images'));
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch images (${res.status})`);
  }
  const result = await res.json();
  return result.data || [];
}

/**
 * Upload image file and metadata to MongoDB GridFS
 */
export async function uploadImageToDatabase(file, metadata = {}) {
  const formData = new FormData();
  formData.append('image', file);
  if (metadata.width) formData.append('width', metadata.width);
  if (metadata.height) formData.append('height', metadata.height);

  const res = await fetch(getApiUrl('/api/images'), {
    method: 'POST',
    body: formData,
  });

  const result = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(result.message || `Upload failed with status ${res.status}`);
  }

  return result.data;
}

/**
 * Delete image from database and GridFS
 */
export async function deleteImageFromDatabase(id) {
  const res = await fetch(getApiUrl(`/api/images/${id}`), {
    method: 'DELETE',
  });

  const result = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(result.message || `Failed to delete image (${res.status})`);
  }

  return result;
}

/**
 * Construct URL to stream image directly from GridFS
 */
export function getGridFsImageUrl(id) {
  if (!id) return '';
  return getApiUrl(`/api/images/${id}/file`);
}
