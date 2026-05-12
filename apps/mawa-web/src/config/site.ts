const DEFAULT_ORDERING_URL = "http://localhost:9602";

export const ORDERING_URL =
  import.meta.env.VITE_ORDERING_URL?.trim() || DEFAULT_ORDERING_URL;
