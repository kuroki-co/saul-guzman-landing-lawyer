CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.reclamaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correlativo text NOT NULL,
  fecha_reclamo timestamptz NOT NULL DEFAULT now(),
  tipo_documento text NOT NULL,
  numero_documento text NOT NULL,
  nombres_apellidos text NOT NULL,
  domicilio_consumidor text NOT NULL,
  telefono text NOT NULL,
  email text NOT NULL,
  es_menor boolean NOT NULL DEFAULT false,
  representante_nombre text,
  representante_domicilio text,
  representante_telefono text,
  representante_email text,
  servicio text NOT NULL,
  monto_reclamado numeric(12, 2) NOT NULL,
  tipo_registro text NOT NULL,
  asunto text NOT NULL,
  descripcion text NOT NULL,
  pedido text NOT NULL,
  observaciones_proveedor text,
  estado text NOT NULL DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reclamaciones_correlativo_key UNIQUE (correlativo),
  CONSTRAINT reclamaciones_tipo_documento_check CHECK (tipo_documento IN ('DNI', 'CE')),
  CONSTRAINT reclamaciones_tipo_registro_check CHECK (tipo_registro IN ('reclamo', 'queja')),
  CONSTRAINT reclamaciones_estado_check CHECK (estado IN ('pendiente', 'en_revision', 'respondido', 'cerrado')),
  CONSTRAINT reclamaciones_monto_reclamado_check CHECK (monto_reclamado >= 0),
  CONSTRAINT reclamaciones_menor_representante_check CHECK (
    es_menor = false
    OR (
      representante_nombre IS NOT NULL
      AND representante_domicilio IS NOT NULL
      AND representante_telefono IS NOT NULL
      AND representante_email IS NOT NULL
    )
  )
);

CREATE INDEX reclamaciones_fecha_reclamo_idx
  ON public.reclamaciones (fecha_reclamo);

CREATE INDEX reclamaciones_estado_idx
  ON public.reclamaciones (estado);

ALTER TABLE public.reclamaciones ENABLE ROW LEVEL SECURITY;
