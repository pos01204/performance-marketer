
import type { ImageFile } from '../types';

/**
 * A high-quality, generic placeholder image to be used when fetching a real image
 * from a URL is not feasible or fails, ensuring the application's core functionality
 * remains stable and unaffected by network issues.
 * This is a base64 encoded, 1x1 transparent PNG. It is compatible with Gemini API.
 */
export const PLACEHOLDER_IMAGE_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';


// Pre-create the ImageFile object to avoid repeated processing
const base64String = PLACEHOLDER_IMAGE_DATA.split(',')[1];

export const PLACEHOLDER_IMAGE: ImageFile = {
  name: 'placeholder.png',
  base64: base64String,
  mimeType: 'image/png',
};