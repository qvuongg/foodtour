import { useMemo } from "react";
import { qrcodegen } from "@/lib/qrcodegen";

export interface QRCodeSVGProps {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  bgColor?: string;
  fgColor?: string;
  className?: string;
  title?: string;
}

const ECC_MAP = {
  L: qrcodegen.QrCode.Ecc.LOW,
  M: qrcodegen.QrCode.Ecc.MEDIUM,
  Q: qrcodegen.QrCode.Ecc.QUARTILE,
  H: qrcodegen.QrCode.Ecc.HIGH,
} as const;

export function QRCodeSVG({
  value,
  size = 160,
  level = "M",
  bgColor = "#ffffff",
  fgColor = "#1a1008",
  className,
  title,
}: QRCodeSVGProps) {
  const { pathData, totalSize } = useMemo(() => {
    if (!value || typeof value !== "string") {
      return { pathData: "", totalSize: 0 };
    }

    try {
      const ecc = ECC_MAP[level] ?? qrcodegen.QrCode.Ecc.MEDIUM;
      const qr = qrcodegen.QrCode.encodeText(value, ecc);
      const border = 4;
      const totalSize = qr.size + border * 2;
      const parts: string[] = [];

      for (let y = 0; y < qr.size; y++) {
        for (let x = 0; x < qr.size; x++) {
          if (qr.getModule(x, y)) {
            parts.push(`M${x + border},${y + border}h1v1h-1z`);
          }
        }
      }

      return { pathData: parts.join(" "), totalSize };
    } catch {
      return { pathData: "", totalSize: 0 };
    }
  }, [value, level]);

  if (!pathData) return null;

  return (
    <svg
      role="img"
      aria-label={title ?? "QR Code"}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      width={size}
      height={size}
      className={className}
      style={{ display: "block", shapeRendering: "crispEdges" }}
    >
      {title && <title>{title}</title>}
      <rect width={totalSize} height={totalSize} fill={bgColor} />
      <path d={pathData} fill={fgColor} />
    </svg>
  );
}
