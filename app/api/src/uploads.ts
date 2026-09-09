import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./middleware.js";

export const UPLOADS_DIR = path.resolve("data/uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const MAX_PICTURES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${MIME_EXTENSIONS[file.mimetype]}`);
  },
});

const picturesUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_PICTURES },
  fileFilter: (_req, file, cb) => {
    if (!(file.mimetype in MIME_EXTENSIONS)) {
      cb(new HttpError(400, "Pictures must be JPG, PNG, or WEBP images"));
      return;
    }
    cb(null, true);
  },
});

/** Parses up to MAX_PICTURES `pictures` files from a multipart request, normalising multer's errors into HttpError. */
export function uploadPictures(req: Request, res: Response, next: NextFunction): void {
  picturesUpload.array("pictures", MAX_PICTURES)(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof HttpError) {
      next(err);
      return;
    }
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? `Each picture must be under ${MAX_FILE_SIZE / (1024 * 1024)}MB`
          : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
            ? `You can upload at most ${MAX_PICTURES} pictures`
            : err.message;
      next(new HttpError(400, message));
      return;
    }
    next(err);
  });
}

export function pictureUrlsFor(req: Request): string[] {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  return files.map((file) => `/api/uploads/${file.filename}`);
}
