"use client";

import { useState, useCallback, type DragEvent } from "react";
import { Upload } from "lucide-react";

interface Props {
  onDrop: (files: FileList) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function DropZone({ onDrop, disabled, children }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleDrag = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragging(true);
      } else if (e.type === "dragleave") {
        setDragging(false);
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onDrop(files);
      }
    },
    [onDrop, disabled]
  );

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative rounded-xl border-2 border-dashed transition-colors ${
        dragging
          ? "border-violet-400 bg-violet-50"
          : "border-gray-200 hover:border-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children || (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Upload
            className={`h-10 w-10 mb-3 ${
              dragging ? "text-violet-500" : "text-gray-300"
            }`}
          />
          <p className="text-sm font-medium text-gray-600">
            {dragging ? "Drop files here" : "Drag & drop MP3/WAV files"}
          </p>
          <p className="text-xs text-gray-400 mt-1">or click Upload Songs above</p>
        </div>
      )}
    </div>
  );
}
