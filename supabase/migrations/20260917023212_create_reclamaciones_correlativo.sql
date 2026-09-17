CREATE SEQUENCE public.reclamaciones_correlativo_seq
  START WITH 1
  INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generar_correlativo_reclamacion()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  numero bigint;
  anio text;
BEGIN
  numero := nextval('public.reclamaciones_correlativo_seq');
  anio := EXTRACT(YEAR FROM now())::text;

  RETURN lpad(numero::text, 6, '0') || '-' || anio;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_correlativo_reclamacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.correlativo IS NULL OR btrim(new.correlativo) = '' THEN
    new.correlativo := public.generar_correlativo_reclamacion();
  END IF;

  RETURN new;
END;
$$;

CREATE TRIGGER set_reclamaciones_correlativo
BEFORE INSERT ON public.reclamaciones
FOR EACH ROW
EXECUTE FUNCTION public.set_correlativo_reclamacion();
