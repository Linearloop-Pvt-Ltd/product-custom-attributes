"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@medusajs/ui";
import { useDropzone } from "react-dropzone";
import { CloudArrowUp, Spinner } from "@medusajs/icons";
import { uploadFileToS3 } from "../lib/utils";

type Props = {
  onUploaded: (url: string) => Promise<void> | void;
  initialUrl?: string;
  isShowPreview?: boolean;
};
export const FileUpload = ({
  onUploaded,
  initialUrl,
  isShowPreview = true,
}: Props) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialUrl);
  const [error, setError] = useState<string | null>(null);

  const selectedFile = useMemo(() => files[0] ?? null, [files]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles?.length) {
      setFiles([acceptedFiles[0]]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "image/*": [] },
  });

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadFileToS3(selectedFile);
      setPreviewUrl(url);
      setFiles([]);
      await onUploaded?.(url);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [selectedFile, onUploaded]);

  const preview = isShowPreview && initialUrl ? initialUrl : previewUrl;

  return (
    <>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition ${
          isDragActive
            ? "border-ui-border-strong bg-ui-bg-subtle"
            : "border-ui-border-base bg-ui-bg-field"
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUp className="w-6 h-6 text-ui-fg-subtle mb-2" />
        <p className="text-ui-fg-subtle text-sm">
          {selectedFile ? selectedFile.name : "Click or drag files to upload"}
        </p>

        <Button
          size="small"
          variant="secondary"
          className="mt-2"
          disabled={uploading}
          onClick={(e) => {
            e.stopPropagation();
            if (selectedFile) {
              handleUpload();
            } else {
              open();
            }
          }}
        >
          {uploading ? (
            <Spinner className="animate-spin" />
          ) : selectedFile ? (
            "Upload"
          ) : (
            "Browse files"
          )}
        </Button>
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      {preview && (
        <div className="mt-4 flex flex-col items-center">
          <img
            src={preview}
            alt="Preview"
            className="w-24 h-24 object-cover rounded mb-2"
          />
          <p className="text-xs text-ui-fg-subtle">Preview</p>
        </div>
      )}
    </>
  );
};
