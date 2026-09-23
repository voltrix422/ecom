"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { ChevronLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { MediaImage } from "@/components/media-image";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/format";
import { fileToDataUrl } from "@/lib/image-upload";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

const fieldClass =
  "h-7 rounded-none border-0 border-b border-foreground/15 px-0 shadow-none focus-visible:border-foreground/40 focus-visible:ring-0";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { upsertProduct, canEdit, canAccess, categories, addCategory } =
    useStore();

  const initialImages =
    product?.images?.length
      ? product.images
      : product?.image
        ? [product.image]
        : [];

  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [stock, setStock] = useState(String(product?.stock ?? "10"));
  const [color, setColor] = useState(product?.color ?? "");
  const [category, setCategory] = useState(
    product?.category ?? categories[0] ?? "Lawn"
  );
  const [newCategory, setNewCategory] = useState("");
  const [description, setDescription] = useState(product?.description ?? "");
  const [details, setDetails] = useState(product?.details?.join("\n") ?? "");
  const [images, setImages] = useState<string[]>(initialImages);
  const [urlInput, setUrlInput] = useState("");
  const [featured, setFeatured] = useState(Boolean(product?.featured));
  const [uploading, setUploading] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (!canAccess("products") || !canEdit()) {
    return (
      <p className="text-sm text-muted-foreground">
        You do not have permission to edit products.
      </p>
    );
  }

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        next.push(await fileToDataUrl(file));
      }
      if (!next.length) {
        toast.error("Choose image files only");
        return;
      }
      setImages((current) => [...current, ...next]);
      toast.success(`${next.length} image${next.length > 1 ? "s" : ""} added`);
    } catch {
      toast.error("Could not upload image");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addImageUrl() {
    const url = urlInput.trim();
    if (!url) return;
    setImages((current) => [...current, url]);
    setUrlInput("");
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  function reorderImages(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    setImages((current) => {
      if (from >= current.length || to >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  async function onAddCategory() {
    const result = await addCategory(newCategory);
    if (!result.ok) {
      toast.error(result.error ?? "Could not add category");
      return;
    }
    const trimmed = newCategory.trim();
    setCategory(trimmed);
    setNewCategory("");
    toast.success(`Category “${trimmed}” added`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Enter a product name");
      return;
    }
    if (!images.length) {
      toast.error("Add at least one image");
      return;
    }

    const next: Product = {
      id: product?.id ?? `p-${Date.now()}`,
      name: name.trim(),
      slug: slugify(product?.slug || name),
      description: description.trim(),
      price: Number(price || 0),
      category,
      image: images[0],
      images,
      fabric: images[1] || images[0],
      color: color.trim() || "Neutral",
      stock: Number(stock || 0),
      featured,
      details: details
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };

    upsertProduct(next);
    toast.success(product ? "Product updated" : "Product added");
    router.push("/admin/products");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <Link
        href="/admin/products"
        aria-label="Back"
        className="-ml-2 inline-flex size-9 items-center justify-center"
      >
        <ChevronLeft className="size-6" strokeWidth={1.75} />
      </Link>

      <Input
        id="name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
        aria-label="Name"
        className={cn(
          fieldClass,
          "h-auto border-0 py-0 font-heading text-xl tracking-tight md:text-xl"
        )}
      />

      <div className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-4">
        <label className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-[11px] text-muted-foreground">
            Price
          </span>
          <Input
            id="price"
            type="number"
            min="0"
            required
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-[11px] text-muted-foreground">
            Stock
          </span>
          <Input
            id="stock"
            type="number"
            min="0"
            required
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-[11px] text-muted-foreground">
            Color
          </span>
          <Input
            id="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className={fieldClass}
          />
        </label>
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-[11px] text-muted-foreground">
            Category
          </span>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              className={cn(
                fieldClass,
                "w-full min-w-0 rounded-none px-0 shadow-none !border-0 border-b border-foreground/15 focus-visible:ring-0"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Input
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          placeholder="New category"
          className={cn(fieldClass, "max-w-[12rem]")}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddCategory();
            }
          }}
        />
        <button
          type="button"
          onClick={onAddCategory}
          className="inline-flex size-7 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Add category"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-[11px] text-muted-foreground">Photos</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => onFilesSelected(event.target.files)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <Input
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="Image URL"
            className={cn(fieldClass, "max-w-[12rem]")}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addImageUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={addImageUrl}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Add
          </button>
        </div>

        {images.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No photos yet</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((src, index) => {
              const isDragging = draggingIndex === index;
              const isOver =
                overIndex === index &&
                draggingIndex !== null &&
                draggingIndex !== index;

              return (
                <div
                  key={`photo-${index}`}
                  draggable
                  onDragStart={(event) => {
                    setDraggingIndex(index);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(index));
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    if (overIndex !== index) setOverIndex(index);
                  }}
                  onDragLeave={() => {
                    if (overIndex === index) setOverIndex(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const from = Number(
                      event.dataTransfer.getData("text/plain") || draggingIndex
                    );
                    if (!Number.isNaN(from)) reorderImages(from, index);
                    setDraggingIndex(null);
                    setOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggingIndex(null);
                    setOverIndex(null);
                  }}
                  className={cn(
                    "w-16 cursor-grab active:cursor-grabbing",
                    isDragging && "opacity-40",
                    isOver && "opacity-70"
                  )}
                >
                  <div className="mb-0.5 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {index === 0 ? "Cover" : index + 1}
                    </span>
                    <GripVertical
                      className="size-3 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                  <div className="relative aspect-[3/4]">
                    <MediaImage
                      src={src}
                      alt={`Photo ${index + 1}`}
                      fill
                      sizes="64px"
                      className="pointer-events-none object-contain"
                    />
                  </div>
                  <div className="mt-0.5 flex justify-end">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => removeImage(index)}
                      aria-label="Remove photo"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[11px] text-muted-foreground">Description</p>
        <Textarea
          id="description"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-0.5 min-h-16 rounded-none border-0 border-b border-foreground/15 px-0 text-sm shadow-none focus-visible:border-foreground/40 focus-visible:ring-0"
        />
      </div>

      <div className="mt-3">
        <p className="text-[11px] text-muted-foreground">Details</p>
        <Textarea
          id="details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="One per line"
          className="mt-0.5 min-h-16 rounded-none border-0 border-b border-foreground/15 px-0 text-sm shadow-none focus-visible:border-foreground/40 focus-visible:ring-0"
        />
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <Checkbox
          checked={featured}
          onCheckedChange={(value) => setFeatured(value === true)}
        />
        Featured on homepage
      </label>

      <button
        type="submit"
        disabled={uploading}
        className="mt-4 text-sm disabled:opacity-50"
      >
        {product ? "Save" : "Add product"}
      </button>
    </form>
  );
}
