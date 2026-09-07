export function downloadQRCode(svgElementId: string, filename: string = "qrcode") {
  if (typeof window === "undefined") return;
  const svg = document.getElementById(svgElementId);
  if (!svg) {
    console.error(`SVG element with id "${svgElementId}" not found.`);
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const URL = window.URL || window.webkitURL || window;
  const blobURL = URL.createObjectURL(svgBlob);

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    const padding = 24;
    const scale = 2; // 2x resolution for high quality / crisp printing
    const baseWidth = image.width || 250;
    const baseHeight = image.height || 250;

    canvas.width = (baseWidth + padding * 2) * scale;
    canvas.height = (baseHeight + padding * 2) * scale;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(scale, scale);
      // Clean white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, baseWidth + padding * 2, baseHeight + padding * 2);

      // Draw SVG centered with padding
      ctx.drawImage(image, padding, padding, baseWidth, baseHeight);

      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      const sanitizedFilename = filename.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
      downloadLink.download = `${sanitizedFilename || "qr_code"}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
    URL.revokeObjectURL(blobURL);
  };

  image.onerror = (err) => {
    console.error("Error loading SVG for QR download:", err);
    URL.revokeObjectURL(blobURL);
  };

  image.src = blobURL;
}
