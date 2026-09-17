import type { APIRoute } from "astro";
import { generateReclamacionPdf } from "../../features/reclamaciones/pdf";
import { createSupabaseAdmin } from "../../features/reclamaciones/supabaseAdmin";
import type { ReclamacionRecord } from "../../features/reclamaciones/types";
import { validateReclamacionPayload } from "../../features/reclamaciones/validation";

export const prerender = false;

const submissionAttempts = new Map<string, number[]>();
const windowMs = 60_000;
const maxAttempts = 5;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });

const getClientKey = (request: Request): string => {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
};

const isRateLimited = (key: string): boolean => {
  const now = Date.now();
  const recent = (submissionAttempts.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
  recent.push(now);
  submissionAttempts.set(key, recent);
  return recent.length > maxAttempts;
};

export const POST: APIRoute = async ({ request }) => {
  if (isRateLimited(getClientKey(request))) {
    return json({ message: "Demasiados intentos. Inténtalo nuevamente en un momento." }, 429);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json({ message: "Solicitud inválida." }, 400);
  }

  const validation = validateReclamacionPayload(payload);

  if (!validation.ok) {
    return json({ message: "Revisa los campos indicados.", errors: validation.errors }, 400);
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("reclamaciones")
      .insert({
        tipo_documento: validation.data.tipo_documento,
        numero_documento: validation.data.numero_documento,
        nombres_apellidos: validation.data.nombres_apellidos,
        domicilio_consumidor: validation.data.domicilio_consumidor,
        telefono: validation.data.telefono,
        email: validation.data.email,
        es_menor: validation.data.es_menor,
        representante_nombre: validation.data.representante_nombre,
        representante_domicilio: validation.data.representante_domicilio,
        representante_telefono: validation.data.representante_telefono,
        representante_email: validation.data.representante_email,
        servicio: validation.data.servicio,
        monto_reclamado: validation.data.monto_reclamado,
        tipo_registro: validation.data.tipo_registro,
        asunto: validation.data.asunto,
        descripcion: validation.data.descripcion,
        pedido: validation.data.pedido,
      })
      .select(
        "id, correlativo, fecha_reclamo, tipo_documento, numero_documento, nombres_apellidos, domicilio_consumidor, telefono, email, es_menor, representante_nombre, representante_domicilio, representante_telefono, representante_email, servicio, monto_reclamado, tipo_registro, asunto, descripcion, pedido",
      )
      .single<ReclamacionRecord>();

    if (error || !data) {
      console.error("Supabase reclamacion insert failed", error);
      return json({ message: "No pudimos registrar tu reclamo en este momento. Por favor, inténtalo nuevamente." }, 500);
    }

    const pdf = await generateReclamacionPdf(data);

    return json({
      correlativo: data.correlativo,
      fecha_reclamo: data.fecha_reclamo,
      pdf,
    });
  } catch (error) {
    console.error("Reclamacion endpoint failed", error);
    return json({ message: "No pudimos registrar tu reclamo en este momento. Por favor, inténtalo nuevamente." }, 500);
  }
};
