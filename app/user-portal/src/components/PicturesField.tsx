import { useEffect, useMemo, useState, type ChangeEvent } from "react";

export const ACCEPTED_PICTURE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PICTURES = 5;

/**
 * Picture picker used by both the create-fly and edit-fly forms. `existingPictures`
 * (already-uploaded URLs) is optional so the same component works for a fresh fly
 * that has no pictures yet.
 */
export function PicturesField({
  existingPictures = [],
  onRemoveExisting,
  pictures,
  onChange,
}: {
  existingPictures?: string[];
  onRemoveExisting?: (index: number) => void;
  pictures: File[];
  onChange: (pictures: File[]) => void;
}) {
  const [error, setError] = useState<string>();
  const previews = useMemo(() => pictures.map((f) => URL.createObjectURL(f)), [pictures]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const remainingSlots = Math.max(0, MAX_PICTURES - existingPictures.length);

  const addFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.some((f) => !ACCEPTED_PICTURE_TYPES.includes(f.type))) {
      setError("Pictures must be JPG, PNG, or WEBP images");
      return;
    }
    const combined = [...pictures, ...selected];
    setError(combined.length > remainingSlots ? `You can upload up to ${MAX_PICTURES} pictures` : undefined);
    onChange(combined.slice(0, remainingSlots));
  };

  const removeAt = (index: number) => {
    setError(undefined);
    onChange(pictures.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {(existingPictures.length > 0 || previews.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {existingPictures.map((url, i) => (
            <div key={url} className="relative h-16 w-16">
              <img src={url} alt="" className="h-16 w-16 rounded-md object-cover" />
              <button
                type="button"
                onClick={() => onRemoveExisting?.(i)}
                aria-label="Remove picture"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs text-white hover:bg-slate-900"
              >
                ✕
              </button>
            </div>
          ))}
          {previews.map((url, i) => (
            <div key={url} className="relative h-16 w-16">
              <img src={url} alt="" className="h-16 w-16 rounded-md object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove picture"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs text-white hover:bg-slate-900"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        type="file"
        accept={ACCEPTED_PICTURE_TYPES.join(",")}
        multiple
        disabled={pictures.length >= remainingSlots}
        onChange={addFiles}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-600 disabled:opacity-50"
      />
      <p className="text-xs text-slate-500">Up to {MAX_PICTURES} pictures — JPG, PNG, or WEBP.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
