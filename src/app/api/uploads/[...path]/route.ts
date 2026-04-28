import { readFile } from "node:fs/promises";
import { join, normalize, resolve } from "node:path";
import { sep as posixSep } from "node:path/posix";
import { NextRequest, NextResponse } from "next/server";

const UPLOADS_ROOT = resolve(process.cwd(), "uploads");

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function contentTypeFor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  // Path-traversal guard: resolve the target and confirm it's still inside
  // the uploads root. Rejects ".." segments, absolute paths, and symlink
  // escapes (resolve collapses the whole thing before we check). Uses
  // posix sep ("/") explicitly — prod runs on Linux; the OS-derived sep
  // would silently change behaviour if anyone ever shipped on Windows.
  const target = resolve(normalize(join(UPLOADS_ROOT, ...path)));
  if (target !== UPLOADS_ROOT && !target.startsWith(UPLOADS_ROOT + posixSep)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const file = await readFile(target);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentTypeFor(target),
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
