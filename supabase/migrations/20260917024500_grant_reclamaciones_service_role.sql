GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT
  ON TABLE public.reclamaciones
  TO service_role;

GRANT USAGE
  ON SEQUENCE public.reclamaciones_correlativo_seq
  TO service_role;
