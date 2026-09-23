async function publishFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file, file.name || "upload");
  const response = await fetch("/api/upload", { method: "POST", body: form });
  const data = (await response.json().catch(() => ({}))) as {
    mode?: string;
    url?: string;
    error?: string;
  };
  if (data.mode === "local") return readFileAsDataUrl(file);
  if (!response.ok || !data.url) {
    throw new Error(data.error || "Could not upload");
  }
  return data.url;
}

export async function fileToDataUrl(
  file: File,
  maxWidth = 1200,
  quality = 0.72
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, maxWidth / image.width);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return publishFile(file);
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
    if (!blob) return publishFile(file);
    return publishFile(
      new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
        type: "image/jpeg",
      })
    );
  } catch {
    return publishFile(file);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function fileToHeroDataUrl(file: File): Promise<string> {
  return publishFile(file);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read image"));
    image.src = src;
  });
}

export function fileToDataUrlRaw(file: File) {
  return publishFile(file);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
