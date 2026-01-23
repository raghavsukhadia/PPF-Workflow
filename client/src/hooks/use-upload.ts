import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { UppyFile } from "@uppy/core";

interface UploadResponse {
  uploadURL: string;
  objectPath: string;
}

interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        const fileExt = file.name.split('.').pop() || '';
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file, {
            upsert: false,
            contentType: file.type
          });

        if (uploadError) {
          console.error("Supabase Storage Upload Error:", uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        const response = {
          uploadURL: publicUrl,
          objectPath: data.path
        };

        setProgress(100);
        options.onSuccess?.(response);
        return response;
      } catch (err: any) {
        console.error("Upload Hook Error details:", err);
        const error = err instanceof Error ? err : new Error(err.message || "Upload failed");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [options]
  );

  // Minimal placeholder for Uppy since we prefer direct upload with Supabase
  const getUploadParameters = useCallback(async (file: UppyFile<any, any>) => {
    // For Supabase, direct upload is often easier than presigned URLs for Uppy
    // This is a stub if Uppy is strictly required, but usually we'd switch to direct upload.
    throw new Error("Please use uploadFile for Supabase Storage");
  }, []);

  return {
    uploadFile,
    getUploadParameters,
    isUploading,
    error,
    progress,
  };
}

