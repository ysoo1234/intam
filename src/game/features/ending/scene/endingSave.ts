/**
 * Saving the certificate on this device only. On touch devices (classroom
 * tablets) the share sheet offers "이미지 저장" into the photo album; on a
 * computer the picture is downloaded. Nothing is uploaded.
 */
export function makeCertificateBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | undefined>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? undefined), "image/png");
  });
}

export type CertificateSaveResult = "shared" | "downloaded" | "cancelled" | "failed";

export async function saveCertificate(blob: Blob, fileName: string): Promise<CertificateSaveResult> {
  const touchFirst = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
  if (touchFirst && typeof File !== "undefined" && navigator.canShare) {
    const file = new File([blob], fileName, { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return "shared";
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
        // Fall through to a plain download.
      }
    }
  }
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
