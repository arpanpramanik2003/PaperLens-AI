/**
 * Centralized Error Handler for Frontend
 * 
 * - Logs complete technical details to the browser developer console (console.error).
 * - Returns clean, production-grade, user-friendly error messages for UI alerts, banners, and toasts.
 */

export function handleApiError(
  error: unknown,
  contextTitle: string = "Operation"
): string {
  // Always log detailed technical error to the developer console
  console.error(`[API Error - ${contextTitle}]`, error);

  if (!error) {
    return `An unexpected issue occurred while processing ${contextTitle.toLowerCase()}. Please try again.`;
  }

  if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, any>;
    const status = errObj.status || errObj.statusCode;
    const code = errObj.code || errObj.payload?.code;
    const rawMessage = errObj.payload?.error || errObj.message || errObj.error;

    if (status === 413 || code === "PAPER_TOO_LENGTHY" || (typeof rawMessage === "string" && rawMessage.toLowerCase().includes("too lengthy"))) {
      return "This paper exceeds the length or file size limit for processing. Please upload a shorter paper.";
    }

    if (code === "INVALID_DOCUMENT_FORMAT" || (typeof rawMessage === "string" && rawMessage.toLowerCase().includes("only pdf or docx"))) {
      return "Invalid file format. Please upload a PDF or DOCX file.";
    }

    if (status === 400 && typeof rawMessage === "string" && rawMessage.trim().length > 0) {
      if (!rawMessage.toLowerCase().includes("traceback") && !rawMessage.toLowerCase().includes("exception") && !rawMessage.toLowerCase().includes("sql")) {
        return rawMessage;
      }
      return "Invalid request parameters. Please check your inputs and try again.";
    }

    if (status === 404) {
      return "The requested item or document was not found. Please try again.";
    }

    if (status === 500 || code === "INTERNAL_SERVER_ERROR") {
      return "An unexpected server error occurred. Please try again later.";
    }
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed")) {
      return "Unable to connect to the server. Please check your network connection and try again.";
    }
  }

  return `${contextTitle} could not be completed at this time. Please try again later.`;
}
