/**
 * Quita acentos/diacríticos para comparar texto sin importar tildes.
 * GROQ's match es sensible a acentos y muchos títulos de producto se
 * importaron sin ellos (ej. "Presion" en vez de "Presión"), así que
 * las búsquedas se normalizan antes de mandarlas a Sanity.
 */
export function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
