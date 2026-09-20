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
    if (!context) {
      return await readFileAsDataUrl(file);
    }
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function fileToHeroDataUrl(file: File): Promise<string> {
  return readFileAsDataUrl(file);
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
  return readFileAsDataUrl(file);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
