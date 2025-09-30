export const uploadFileToS3 = async (file: File): Promise<string> => {
  try {
    // Get presigned POST URL
    const presignedResponse = await fetch("/admin/s3-presigned-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: file.name,
        type: file.type,
      }),
    });

    if (!presignedResponse.ok) {
      const errorData = await presignedResponse.json();
      throw new Error(errorData.message || "Failed to get upload URL");
    }

    const presignedData = await presignedResponse.json();
    const { url, fields, fileUrl } = presignedData;

    // Create form data for POST upload
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append("file", file);

    // Upload to S3
    const uploadResponse = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status ${uploadResponse.status}`);
    }

    return fileUrl;
  } catch (error) {
    console.error("Error in file upload process:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to upload file"
    );
  }
};
