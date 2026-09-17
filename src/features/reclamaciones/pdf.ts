import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { provider } from "./data";
import type { PdfResult, ReclamacionRecord } from "./types";

const navy = rgb(0.008, 0.051, 0.114);
const gold = rgb(0.788, 0.592, 0.196);
const muted = rgb(0.35, 0.35, 0.35);

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const wrapText = (text: string, maxChars = 88): string[] => {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
};

export const generateReclamacionPdf = async (record: ReclamacionRecord): Promise<PdfResult> => {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const marginX = 48;
  let y = 784;

  const ensureSpace = (needed: number) => {
    if (y - needed >= 48) {
      return;
    }

    page = pdf.addPage([595.28, 841.89]);
    y = 784;
  };

  const drawText = (text: string, x: number, size = 10, font = regular, color = navy) => {
    page.drawText(text, { x, y, size, font, color });
  };

  const section = (title: string) => {
    ensureSpace(36);
    y -= 28;
    page.drawLine({ start: { x: marginX, y: y + 14 }, end: { x: 547, y: y + 14 }, thickness: 0.5, color: gold });
    drawText(title, marginX, 9, bold, gold);
    y -= 18;
  };

  const row = (label: string, value: string) => {
    ensureSpace(18);
    drawText(`${label}:`, marginX, 9, bold, muted);
    const lines = wrapText(value, 78);
    lines.forEach((line, index) => {
      if (index > 0) {
        y -= 14;
      }
      drawText(line, 180, 9, regular, navy);
    });
    y -= 16;
  };

  const paragraph = (label: string, value: string) => {
    ensureSpace(48);
    drawText(label, marginX, 9, bold, muted);
    y -= 15;
    wrapText(value, 94).forEach((line) => {
      ensureSpace(14);
      drawText(line, marginX, 9, regular, navy);
      y -= 13;
    });
    y -= 5;
  };

  drawText("LIBRO DE RECLAMACIONES VIRTUAL", marginX, 14, bold, gold);
  y -= 26;
  drawText(`HOJA DE RECLAMACIÓN N.° ${record.correlativo}`, marginX, 18, bold, navy);
  y -= 12;
  page.drawLine({ start: { x: marginX, y }, end: { x: 547, y }, thickness: 1, color: gold });

  section("DATOS DEL PROVEEDOR");
  row("Proveedor", provider.name);
  row("RUC", provider.ruc);
  row("Domicilio", provider.address);
  row("Fecha del reclamo", formatDate(record.fecha_reclamo));
  row("Correlativo", record.correlativo);

  section("DATOS DEL CONSUMIDOR");
  row("Tipo de documento", record.tipo_documento);
  row("Número de documento", record.numero_documento);
  row("Nombres y apellidos", record.nombres_apellidos);
  row("Domicilio", record.domicilio_consumidor);
  row("Teléfono", record.telefono);
  row("Email", record.email);

  if (record.es_menor) {
    section("DATOS DEL REPRESENTANTE");
    row("Nombre", record.representante_nombre ?? "");
    row("Domicilio", record.representante_domicilio ?? "");
    row("Teléfono", record.representante_telefono ?? "");
    row("Email", record.representante_email ?? "");
  }

  section("SERVICIO");
  row("Servicio relacionado", record.servicio);
  row("Monto reclamado", `S/ ${formatMoney(record.monto_reclamado)}`);

  section("DETALLE");
  row("Tipo", record.tipo_registro.toUpperCase());
  row("Asunto", record.asunto);
  paragraph("Descripción", record.descripcion);
  paragraph("Pedido del consumidor", record.pedido);

  section("OBSERVACIONES Y ACCIONES TOMADAS POR EL PROVEEDOR");
  row("Estado", "Pendiente de atención");
  paragraph("Observaciones", "Pendiente de atención");

  ensureSpace(42);
  page.drawLine({ start: { x: marginX, y: y - 4 }, end: { x: 547, y: y - 4 }, thickness: 0.4, color: rgb(0.78, 0.78, 0.78) });
  y -= 24;
  drawText(
    "Esta hoja corresponde al registro generado mediante el Libro de Reclamaciones Virtual.",
    marginX,
    8,
    regular,
    muted,
  );

  const bytes = await pdf.save();
  const base64 = Buffer.from(bytes).toString("base64");

  return {
    filename: `hoja-reclamacion-${record.correlativo}.pdf`,
    contentType: "application/pdf",
    base64,
  };
};
