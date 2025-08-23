import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generatePDF(canvasElementId = "canvas") {
  const canvas = document.getElementById(canvasElementId);
  if (!canvas) {
    throw new Error("Canvas element not found");
  }

  const canvasImage = await html2canvas(canvas);
  const imgData = canvasImage.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [canvasImage.width, canvasImage.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvasImage.width, canvasImage.height);
  pdf.save("workshop_output.pdf");
}
