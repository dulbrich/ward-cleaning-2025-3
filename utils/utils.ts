
/**
 * Creates a URL string with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to add query parameters to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {string} The URL string with encoded query parameters.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
): string {
  return `${path}?type=${type}&message=${encodeURIComponent(message)}`;
}
