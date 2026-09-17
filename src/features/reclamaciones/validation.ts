import { documentTypes, registroTypes, serviceOptions } from "./data";
import type { ReclamacionPayload, ValidationResult } from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cePattern = /^[a-zA-Z0-9-]{4,20}$/;

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const readString = (source: Record<string, unknown>, key: string): string => {
  const value = source[key];
  return typeof value === "string" ? value.trim() : "";
};

const readBoolean = (source: Record<string, unknown>, key: string): boolean => {
  const value = source[key];
  return value === true || value === "true" || value === "on";
};

const required = (value: string, message: string): string | undefined => (value.length > 0 ? undefined : message);

export const validateReclamacionPayload = (rawValue: unknown): ValidationResult => {
  const raw = asRecord(rawValue);
  const errors: Record<string, string> = {};

  const tipoDocumento = readString(raw, "tipo_documento").toUpperCase();
  const numeroDocumento = readString(raw, "numero_documento");
  const nombresApellidos = readString(raw, "nombres_apellidos");
  const domicilioConsumidor = readString(raw, "domicilio_consumidor");
  const telefono = readString(raw, "telefono");
  const email = readString(raw, "email").toLowerCase();
  const esMenor = readBoolean(raw, "es_menor");
  const representanteNombre = readString(raw, "representante_nombre");
  const representanteDomicilio = readString(raw, "representante_domicilio");
  const representanteTelefono = readString(raw, "representante_telefono");
  const representanteEmail = readString(raw, "representante_email").toLowerCase();
  const servicioSeleccionado = readString(raw, "servicio");
  const servicioOtro = readString(raw, "servicio_otro");
  const montoText = readString(raw, "monto_reclamado");
  const tipoRegistro = readString(raw, "tipo_registro").toLowerCase();
  const asunto = readString(raw, "asunto");
  const descripcion = readString(raw, "descripcion");
  const pedido = readString(raw, "pedido");
  const declaracion = readBoolean(raw, "declaracion");
  const consentimientoDatos = readBoolean(raw, "consentimiento_datos");

  if (!documentTypes.includes(tipoDocumento as ReclamacionPayload["tipo_documento"])) {
    errors.tipo_documento = "Selecciona DNI o CE.";
  }

  if (tipoDocumento === "DNI" && !/^\d{8}$/.test(numeroDocumento)) {
    errors.numero_documento = "El DNI debe tener exactamente 8 dígitos.";
  }

  if (tipoDocumento === "CE" && !cePattern.test(numeroDocumento)) {
    errors.numero_documento = "Ingresa un CE válido con letras o números.";
  }

  errors.nombres_apellidos = required(nombresApellidos, "Ingresa tus nombres y apellidos.") ?? "";
  errors.domicilio_consumidor = required(domicilioConsumidor, "Ingresa tu domicilio.") ?? "";
  errors.telefono = required(telefono, "Ingresa un teléfono de contacto.") ?? "";

  if (!emailPattern.test(email)) {
    errors.email = "Ingresa un email válido.";
  }

  if (esMenor) {
    errors.representante_nombre = required(representanteNombre, "Ingresa el nombre del representante.") ?? "";
    errors.representante_domicilio = required(representanteDomicilio, "Ingresa el domicilio del representante.") ?? "";
    errors.representante_telefono = required(representanteTelefono, "Ingresa el teléfono del representante.") ?? "";
    if (!emailPattern.test(representanteEmail)) {
      errors.representante_email = "Ingresa un email válido del representante.";
    }
  }

  if (!serviceOptions.includes(servicioSeleccionado as (typeof serviceOptions)[number])) {
    errors.servicio = "Selecciona un servicio.";
  }

  const servicioFinal = servicioSeleccionado === "Otro" ? servicioOtro : servicioSeleccionado;
  if (servicioSeleccionado === "Otro" && !servicioOtro) {
    errors.servicio_otro = "Especifica el servicio.";
  }

  const monto = Number(montoText);
  if (!Number.isFinite(monto) || monto < 0) {
    errors.monto_reclamado = "Ingresa un monto igual o mayor a 0.";
  }

  if (!registroTypes.includes(tipoRegistro as ReclamacionPayload["tipo_registro"])) {
    errors.tipo_registro = "Selecciona reclamo o queja.";
  }

  errors.asunto = required(asunto, "Ingresa el asunto.") ?? "";
  errors.descripcion = required(descripcion, "Describe qué ocurrió.") ?? "";
  errors.pedido = required(pedido, "Indica qué solución solicitas.") ?? "";

  if (!declaracion) {
    errors.declaracion = "Debes confirmar que la información consignada corresponde a los hechos.";
  }

  if (!consentimientoDatos) {
    errors.consentimiento_datos = "Debes autorizar el tratamiento de datos para gestionar el registro.";
  }

  for (const [key, message] of Object.entries(errors)) {
    if (!message) {
      delete errors[key];
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      tipo_documento: tipoDocumento as ReclamacionPayload["tipo_documento"],
      numero_documento: numeroDocumento,
      nombres_apellidos: nombresApellidos,
      domicilio_consumidor: domicilioConsumidor,
      telefono,
      email,
      es_menor: esMenor,
      representante_nombre: esMenor ? representanteNombre : null,
      representante_domicilio: esMenor ? representanteDomicilio : null,
      representante_telefono: esMenor ? representanteTelefono : null,
      representante_email: esMenor ? representanteEmail : null,
      servicio: servicioFinal,
      monto_reclamado: Number(monto.toFixed(2)),
      tipo_registro: tipoRegistro as ReclamacionPayload["tipo_registro"],
      asunto,
      descripcion,
      pedido,
    },
  };
};
