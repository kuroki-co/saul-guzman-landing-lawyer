export type ReclamacionPayload = {
  tipo_documento: "DNI" | "CE";
  numero_documento: string;
  nombres_apellidos: string;
  domicilio_consumidor: string;
  telefono: string;
  email: string;
  es_menor: boolean;
  representante_nombre: string | null;
  representante_domicilio: string | null;
  representante_telefono: string | null;
  representante_email: string | null;
  servicio: string;
  monto_reclamado: number;
  tipo_registro: "reclamo" | "queja";
  asunto: string;
  descripcion: string;
  pedido: string;
};

export type ReclamacionRecord = ReclamacionPayload & {
  id: string;
  correlativo: string;
  fecha_reclamo: string;
};

export type ValidationResult =
  | {
      ok: true;
      data: ReclamacionPayload;
    }
  | {
      ok: false;
      errors: Record<string, string>;
    };

export type PdfResult = {
  filename: string;
  contentType: "application/pdf";
  base64: string;
};
