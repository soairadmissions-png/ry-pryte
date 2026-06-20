import { useState } from 'react';
import { validateCloudinaryVideoUrl } from '../lib/cmsState';

export interface CloudinaryUploadState {
  loading: boolean;
  error: string | null;
  secureUrl: string | null;
  publicId: string | null;
  validationError: string | null;
}

export function useCloudinaryUpload() {
  const [state, setState] = useState<CloudinaryUploadState>({
    loading: false,
    error: null,
    secureUrl: null,
    publicId: null,
    validationError: null,
  });

  /**
   * Directly uploads a pre-selected video File or Blob to the backend Cloudinary proxy.
   * Leverages the large chunked uploading architecture to guarantee reliability in production.
   */
  const uploadFile = async (file: File | Blob): Promise<{ secure_url: string; public_id: string } | null> => {
    setState({
      loading: true,
      error: null,
      secureUrl: null,
      publicId: null,
      validationError: null,
    });

    try {
      // 1. Initial frontend video validation
      const mimeType = file.type || '';
      const name = (file as File).name || 'video.mp4';
      const extension = name.split('.').pop()?.toLowerCase();
      
      const isVideoType = mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension || '');
      if (!isVideoType) {
        throw new Error("Rejected: The file must be a valid video format (.mp4, .webm).");
      }

      const maxSize = 10 * 1024 * 1024 * 1024; // 10GB limit to support high quality event videos
      if (file.size > maxSize) {
        throw new Error("Rejected: Video file size exceeds the 10GB limit.");
      }

      console.info(`[useCloudinaryUpload] Direct uploading initiated for ${name} (${file.size} bytes)`);

      // 2. Perform chunked upload request to be production robust and avoid Cloud Run HTTP request size boundaries (32MB)
      const CHUNK_SIZE = 15 * 1024 * 1024; // Safe 15MB chunks
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      let finalSecureUrl = "";
      let finalPublicId = "";

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        console.info(`[useCloudinaryUpload] Transferring chunk ${i + 1}/${totalChunks}...`);

        const response = await fetch('/api/upload-chunk', {
          method: "POST",
          headers: {
            "X-Upload-Id": uploadId,
            "X-File-Name": name,
            "X-Chunk-Index": String(i),
            "X-Chunk-Total": String(totalChunks),
            "Content-Type": "application/octet-stream"
          },
          body: chunk
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Chunk ${i + 1}/${totalChunks} rejected by server: ${errorText || response.statusText}`);
        }

        const data = await response.json();
        if (data.completed && data.secure_url) {
          finalSecureUrl = data.secure_url;
          finalPublicId = data.public_id || "";
        }
      }

      if (!finalSecureUrl) {
        throw new Error("Local persistence server did not return a valid secure_url.");
      }

      // 3. Confirm secure_url complies with valid Cloudinary patterns and playable streams
      const valErr = validateCloudinaryVideoUrl(finalSecureUrl);
      if (valErr) {
        setState(prev => ({ ...prev, validationError: valErr }));
        throw new Error(`Cloudinary URL Validation Error: ${valErr}`);
      }

      setState({
        loading: false,
        error: null,
        secureUrl: finalSecureUrl,
        publicId: finalPublicId,
        validationError: null,
      });

      console.info(`[useCloudinaryUpload SUCCESS] Secure URL created: ${finalSecureUrl}`);
      return { secure_url: finalSecureUrl, public_id: finalPublicId };
    } catch (err: any) {
      console.error("[useCloudinaryUpload ERROR]:", err);
      setState({
        loading: false,
        error: err.message || "Failed to upload file to Cloudinary",
        secureUrl: null,
        publicId: null,
        validationError: null,
      });
      return null;
    }
  };

  /**
   * Triggers a programmatic HTML file input dialog to prompt the user for a file selection,
   * and subsequently uploads the selected file.
   */
  const selectAndUpload = (): Promise<{ secure_url: string; public_id: string } | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      
      input.onchange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const file = target.files[0];
          const result = await uploadFile(file);
          resolve(result);
        } else {
          resolve(null);
        }
      };

      input.onerror = () => {
        resolve(null);
      };

      input.click();
    });
  };

  return {
    ...state,
    uploadFile,
    selectAndUpload,
  };
}
