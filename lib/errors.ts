import { t } from "./i18n";
export type ErrorType =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limit"
  | "offline";

export type Surface =
  | "chat"
  | "auth"
  | "api"
  | "stream"
  | "database"
  | "history"
  | "vote"
  | "document"
  | "suggestions"
  | "activate_gateway";

export type ErrorCode = `${ErrorType}:${Surface}`;

export type ErrorVisibility = "response" | "log" | "none";

export const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  database: "log",
  chat: "response",
  auth: "response",
  stream: "response",
  api: "response",
  history: "response",
  vote: "response",
  document: "response",
  suggestions: "response",
  activate_gateway: "response",
};

export class ChatbotError extends Error {
  type: ErrorType;
  surface: Surface;
  statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string) {
    super();

    const [type, surface] = errorCode.split(":");

    this.type = type as ErrorType;
    this.cause = cause;
    this.surface = surface as Surface;
    this.message = getMessageByErrorCode(errorCode);
    this.statusCode = getStatusCodeByType(this.type);
  }

  toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const visibility = visibilityBySurface[this.surface];

    const { message, cause, statusCode } = this;

    if (visibility === "log") {
      console.error({
        code,
        message,
        cause,
      });

      return Response.json(
        { code: "", message: "Quelque chose à mal fonctionné, réessayez plus tard" },
        { status: statusCode }
      );
    }

    return Response.json({ code, message, cause }, { status: statusCode });
  }
}

export function getMessageByErrorCode(errorCode: ErrorCode): string {
  if (errorCode.includes("database")) {
    return t("errors.database", "fr");
  }

  switch (errorCode) {
    case "bad_request:api":
      return t("errors.badRequestApi", "fr");

    case "bad_request:activate_gateway":
      return t("errors.gateway", "fr");

    case "unauthorized:auth":
      return t("errors.authRequired", "fr");
    case "forbidden:auth":
      return t("errors.authForbidden", "fr");

    case "rate_limit:chat":
      return t("errors.rateLimit", "fr");
    case "not_found:chat":
      return t("errors.chatNotFound", "fr");
    case "forbidden:chat":
      return t("errors.chatForbidden", "fr");
    case "unauthorized:chat":
      return t("errors.chatUnauthorized", "fr");
    case "offline:chat":
      return t("errors.offline", "fr");

    case "not_found:document":
      return t("errors.documentNotFound", "fr");
    case "forbidden:document":
      return t("errors.documentForbidden", "fr");
    case "unauthorized:document":
      return t("errors.documentUnauthorized", "fr");
    case "bad_request:document":
      return t("errors.documentBadRequest", "fr");

    default:
      return t("errors.default", "fr");
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case "bad_request":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "rate_limit":
      return 429;
    case "offline":
      return 503;
    default:
      return 500;
  }
}
