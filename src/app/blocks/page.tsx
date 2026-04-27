import Link from "next/link";
import { BLOCK_PREVIEWS, renderBlockToHtml } from "@/modules/email-templates/dev";
import type { BlockPreview } from "@/modules/email-templates/dev";

// Dev catalog of every atomic block in the email-templates library, rendered
// in isolation. Variants of the same block (e.g. logo_header background,
// editorial_split imageSide) cluster together so designers can compare.

export const dynamic = "force-static";

export const metadata = {
  title: "Block Catalog · Theo Grace",
};

interface RenderedPreview extends BlockPreview {
  html: string;
}

async function loadPreviews(): Promise<RenderedPreview[]> {
  return Promise.all(
    BLOCK_PREVIEWS.map(async (preview) => ({
      ...preview,
      html: await renderBlockToHtml(preview.jsx),
    })),
  );
}

export default async function BlocksPage() {
  const previews = await loadPreviews();
  const grouped = new Map<string, RenderedPreview[]>();
  for (const p of previews) {
    if (!grouped.has(p.label)) grouped.set(p.label, []);
    grouped.get(p.label)!.push(p);
  }

  return (
    <div>
      <header className="mb-8">
        <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          Email-templates dev catalog
        </p>
        <h1 className="font-serif text-3xl">Block Catalog</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {previews.length} previews across {grouped.size} block types. Each
          tile renders the block in isolation — no skeleton, no surrounding
          email layout. Use this to spot-check a block during design review or
          when adding a new one.{" "}
          <Link href="/skeletons" className="underline">
            See skeletons →
          </Link>
        </p>
      </header>

      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([label, items]) => (
          <section
            key={label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="mb-4 border-b border-border/60 pb-2 font-mono text-sm text-muted-foreground">
              {label}
            </h2>
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id}>
                  {item.variant && (
                    <p className="mb-1.5 font-mono text-xs text-muted-foreground">
                      {item.variant}
                    </p>
                  )}
                  <iframe
                    title={item.id}
                    srcDoc={item.html}
                    style={{ height: `${item.height}px` }}
                    className="block w-full max-w-[640px] border border-border/60 bg-white"
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
