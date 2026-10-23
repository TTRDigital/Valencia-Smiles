/* eslint-disable @next/next/no-img-element -- static export: WebP sizes come from scripts/optimize-images.mjs, and the live site's image classes are kept for the ported CSS */
import type { Img as ImgT } from "@/lib/types";

// Keep in sync with WIDTHS in scripts/optimize-images.mjs.
const WIDTHS = [96, 256, 384, 640, 720, 828, 1200, 1920];

const local = (src: string) => src.startsWith("/images/") && /\.(png|jpe?g|webp)$/i.test(src);
const variant = (src: string, w: number) => `/_img${src.replace(/\.(png|jpe?g|webp)$/i, "")}-${w}.webp`;

/** src + srcset for a local photo: WebP copies at fixed widths, never wider than the original. */
export function imgSources(img: ImgT) {
  if (img.src.startsWith("https://cdn.sanity.io/")) {
    const w = img.width ?? 1200;
    const list = WIDTHS.filter((x) => x < w).concat(w);
    const sep = img.src.includes("?") ? "&" : "?";
    return { src: `${img.src}${sep}w=${w}&auto=format&q=75`, srcSet: list.map((x) => `${img.src}${sep}w=${x}&auto=format&q=75 ${x}w`).join(", ") };
  }
  if (!local(img.src)) return { src: img.src, srcSet: undefined };
  const w = img.width ?? 1920;
  const smaller = WIDTHS.filter((x) => x < w);
  const top = WIDTHS.find((x) => x >= w) ?? 1920;
  const list = [...smaller.map((x) => `${variant(img.src, x)} ${x}w`), `${variant(img.src, top)} ${Math.min(w, top)}w`];
  return { src: variant(img.src, top), srcSet: list.join(", ") };
}

/** CSS background / preload URL for a local photo (the 1920 copy, or the original size when smaller). */
export function bgUrl(src: string) {
  return local(src) ? variant(src, 1920) : src;
}

type Props = {
  img: ImgT;
  className?: string;
  priority?: boolean;
  sizes?: string;
  itemProp?: string;
};

export function Img({ img, className, priority, sizes, itemProp }: Props) {
  const { src, srcSet } = imgSources(img);
  const cls = className ?? img.cls;
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes ?? img.sizes ?? (img.width ? `(max-width: ${img.width}px) 100vw, ${img.width}px` : "100vw") : undefined}
      width={img.width}
      height={img.height}
      alt={img.alt ?? ""}
      title={img.title}
      className={cls || undefined}
      itemProp={itemProp}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
    />
  );
}
