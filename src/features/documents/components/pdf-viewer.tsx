"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, FileWarning, Minus, Plus } from "lucide-react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist/legacy/build/pdf.mjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2, 2.5];
const MAX_PIXEL_RATIO = 2;

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; doc: PDFDocumentProxy; ratio: number };

/** Calls `onChange` when the element enters or leaves the (margin-expanded) viewport. */
function useInView(ref: React.RefObject<HTMLElement | null>, margin: string, onChange: (inView: boolean) => void) {
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => callback.current(entry.isIntersecting),
      { rootMargin: margin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, margin]);
}

function PdfPage({
  doc,
  pageNumber,
  width,
  ratio,
  onCentered,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  /** Displayed width in CSS pixels. */
  width: number;
  /** Height divided by width of the first page, used to reserve space before rendering. */
  ratio: number;
  onCentered: (page: number) => void;
}) {
  const t = useTranslations("pdf");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);

  // Render pages within about a screen of the viewport; free the rest.
  useInView(wrapperRef, "100% 0px", setNear);
  // A thin strip at the middle of the screen tells us which page is being read.
  useInView(wrapperRef, "-50% 0px -49% 0px", (inView) => inView && onCentered(pageNumber));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!near) {
      // Releases the bitmap memory of pages far from view.
      canvas.width = 0;
      canvas.height = 0;
      return;
    }

    let cancelled = false;
    let task: RenderTask | null = null;

    (async () => {
      const page = await doc.getPage(pageNumber);
      if (cancelled) return;

      const base = page.getViewport({ scale: 1 });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const viewport = page.getViewport({ scale: (width / base.width) * pixelRatio });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${Math.floor(viewport.height / pixelRatio)}px`;

      task = page.render({ canvas, viewport });
      try {
        await task.promise;
      } catch {
        // A cancelled render (scrolled away or resized) is expected.
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, pageNumber, width, near]);

  return (
    <div
      ref={wrapperRef}
      style={{ width, minHeight: width * ratio }}
      className="mx-auto overflow-hidden rounded-control border border-border bg-white shadow-sm"
    >
      <canvas ref={canvasRef} role="img" aria-label={t("pageLabel", { n: pageNumber })} className="block" />
    </div>
  );
}

/**
 * Reads a PDF inside the app. Pages are drawn on canvases as you scroll, which works on
 * every phone (most mobile browsers cannot show a PDF inside an iframe).
 */
export function PdfViewer({ url, title }: { url: string; title: string }) {
  const t = useTranslations("pdf");
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void> } | null = null;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const task = pdfjs.getDocument({ url, withCredentials: false });
        loadingTask = task;
        const doc = await task.promise;
        if (cancelled) return;

        const first = (await doc.getPage(1)).getViewport({ scale: 1 });
        setState({ status: "ready", doc, ratio: first.height / first.width });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();

    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [url, attempt]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setContainerWidth(Math.floor(entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-border bg-surface px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger">
          <FileWarning className="size-7" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold">{t("error")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("errorHint")}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={retry}>{t("retry")}</Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            <ExternalLink className="size-4" aria-hidden />
            {t("openExternal")}
          </a>
        </div>
      </div>
    );
  }

  const zoom = ZOOM_STEPS[zoomIndex];
  const pageWidth = Math.max(0, Math.floor(containerWidth * zoom));

  return (
    <div aria-label={title} className="space-y-3">
      <div className="sticky top-16 z-20 -mx-4 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-control sm:border">
        <p role="status" className="text-sm font-medium">
          {state.status === "ready"
            ? t("page", { page: currentPage, total: state.doc.numPages })
            : t("loading")}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label={t("zoomOut")}
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          >
            <Minus className="size-4" aria-hidden />
          </Button>
          <span className="w-12 text-center text-sm tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("zoomIn")}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Measured at 100%; zoomed pages scroll sideways inside this box. */}
      <div ref={containerRef} className="w-full overflow-x-auto">
        {state.status === "loading" || containerWidth === 0 ? (
          <Skeleton className="aspect-[3/4] w-full" />
        ) : (
          <div className="space-y-3" style={{ width: pageWidth }}>
            {Array.from({ length: state.doc.numPages }, (_, index) => (
              <PdfPage
                key={index + 1}
                doc={state.doc}
                pageNumber={index + 1}
                width={pageWidth}
                ratio={state.ratio}
                onCentered={setCurrentPage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
