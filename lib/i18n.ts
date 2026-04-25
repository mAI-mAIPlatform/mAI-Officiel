"use client";

export const LANGUAGE_STORAGE_KEY = "mai.language.v1";

export const SUPPORTED_LANGUAGES = ["fr", "en", "es", "de", "it", "pt", "zh"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const fallbackLanguage: AppLanguage = "fr";

export const dictionary = {
  en: {
    notifications: "Notifications",
    noNotifications: "No notifications.",
    showNotifications: "Show notifications",
    ghostMode: "Ghost mode",
    ghostModeActive: "Ghost mode active",
    voiceMode: "mAI Voice",
    voiceModeLabel: "Pure voice mode (Experimental)",
    voiceListening: "Listening...",
    voiceStart: "Start voice mode",
    voiceStop: "Stop",
    voiceTranscript: "Transcript",
    voiceSend: "Send to chat",
    voiceCaptions: "Subtitles",
    "errors.database": "An error occurred while executing a database query.",
    "errors.badRequestApi":
      "The request couldn't be processed. Please check your input and try again.",
    "errors.gateway":
      "AI Gateway requires a valid credit card on file to service requests.",
    "errors.authRequired": "You need to sign in before continuing.",
    "errors.authForbidden":
      "Your account does not have access to this feature.",
    "errors.rateLimit":
      "You've reached the message limit. Come back in 1 hour to continue chatting.",
    "errors.chatNotFound":
      "The requested chat was not found. Please check the chat ID and try again.",
    "errors.chatForbidden":
      "This chat belongs to another user. Please check the chat ID and try again.",
    "errors.chatUnauthorized":
      "You need to sign in to view this chat. Please sign in and try again.",
    "errors.offline":
      "We're having trouble sending your message. Please check your internet connection and try again.",
    "errors.documentNotFound":
      "The requested document was not found. Please check the document ID and try again.",
    "errors.documentForbidden":
      "This document belongs to another user. Please check the document ID and try again.",
    "errors.documentUnauthorized":
      "You need to sign in to view this document. Please sign in and try again.",
    "errors.documentBadRequest":
      "The request to create or update the document was invalid. Please check your input and try again.",
    "errors.default": "Something went wrong. Please try again later.",
  },
  es: {
    notifications: "Notificaciones",
    noNotifications: "Sin notificaciones.",
    showNotifications: "Mostrar notificaciones",
    ghostMode: "Modo Fantasma",
    ghostModeActive: "Modo Fantasma activo",
    voiceMode: "mAI Voice",
    voiceModeLabel: "Modo voz pura (Experimental)",
    voiceListening: "Escuchando...",
    voiceStart: "Iniciar modo voz",
    voiceStop: "Detener",
    voiceTranscript: "Transcripción",
    voiceSend: "Enviar al chat",
    voiceCaptions: "Subtítulos",
    "errors.database":
      "Se ha producido un error al ejecutar una consulta en la base de datos.",
    "errors.badRequestApi":
      "No se ha podido procesar la solicitud. Por favor, comprueba tu entrada e inténtalo de nuevo.",
    "errors.gateway":
      "AI Gateway requiere una tarjeta de crédito válida para procesar solicitudes.",
    "errors.authRequired": "Debes iniciar sesión antes de continuar.",
    "errors.authForbidden": "Tu cuenta no tiene acceso a esta función.",
    "errors.rateLimit":
      "Has alcanzado el límite de mensajes. Vuelve en 1 hora para seguir chateando.",
    "errors.chatNotFound":
      "No se ha encontrado el chat solicitado. Por favor, comprueba el ID del chat e inténtalo de nuevo.",
    "errors.chatForbidden":
      "Este chat pertenece a otro usuario. Por favor, comprueba el ID del chat e inténtalo de nuevo.",
    "errors.chatUnauthorized":
      "Debes iniciar sesión para ver este chat. Por favor, inicia sesión e inténtalo de nuevo.",
    "errors.offline":
      "Tenemos problemas para enviar tu mensaje. Por favor, comprueba tu conexión a internet e inténtalo de nuevo.",
    "errors.documentNotFound":
      "No se ha encontrado el documento solicitado. Por favor, comprueba el ID del documento e inténtalo de nuevo.",
    "errors.documentForbidden":
      "Este documento pertenece a otro usuario. Por favor, comprueba el ID del documento e inténtalo de nuevo.",
    "errors.documentUnauthorized":
      "Debes iniciar sesión para ver este documento. Por favor, inicia sesión e inténtalo de nuevo.",
    "errors.documentBadRequest":
      "La solicitud para crear o actualizar el documento no es válida. Por favor, comprueba tu entrada e inténtalo de nuevo.",
    "errors.default":
      "Algo ha ido mal. Por favor, inténtalo de nuevo más tarde.",
  },
  de: {
    notifications: "Benachrichtigungen",
    noNotifications: "Keine Benachrichtigungen.",
    showNotifications: "Benachrichtigungen anzeigen",
    ghostMode: "Geistermodus",
    ghostModeActive: "Geistermodus aktiv",
    voiceMode: "mAI Voice",
    voiceModeLabel: "Reiner Sprachmodus (Experimentell)",
    voiceListening: "Hört zu...",
    voiceStart: "Sprachmodus starten",
    voiceStop: "Stopp",
    voiceTranscript: "Transkript",
    voiceSend: "An den Chat senden",
    voiceCaptions: "Untertitel",
    "errors.database":
      "Beim Ausführen einer Datenbankabfrage ist ein Fehler aufgetreten.",
    "errors.badRequestApi":
      "Die Anfrage konnte nicht verarbeitet werden. Bitte Eingabe prüfen und erneut versuchen.",
    "errors.gateway":
      "AI Gateway benötigt eine gültige Kreditkarte, um Anfragen zu verarbeiten.",
    "errors.authRequired": "Sie müssen sich anmelden, bevor Sie fortfahren.",
    "errors.authForbidden":
      "Ihr Konto hat keinen Zugriff auf diese Funktion.",
    "errors.rateLimit":
      "Sie haben das Nachrichtenlimit erreicht. Kommen Sie in 1 Stunde zurück.",
    "errors.chatNotFound":
      "Der angeforderte Chat wurde nicht gefunden. Bitte die Chat-ID prüfen.",
    "errors.chatForbidden":
      "Dieser Chat gehört zu einem anderen Benutzer. Bitte die Chat-ID prüfen.",
    "errors.chatUnauthorized":
      "Sie müssen sich anmelden, um diesen Chat anzuzeigen.",
    "errors.offline":
      "Wir haben Probleme beim Senden Ihrer Nachricht. Bitte prüfen Sie Ihre Internetverbindung.",
    "errors.documentNotFound":
      "Das angeforderte Dokument wurde nicht gefunden. Bitte die Dokument-ID prüfen.",
    "errors.documentForbidden":
      "Dieses Dokument gehört zu einem anderen Benutzer. Bitte die Dokument-ID prüfen.",
    "errors.documentUnauthorized":
      "Sie müssen sich anmelden, um dieses Dokument anzuzeigen.",
    "errors.documentBadRequest":
      "Die Anfrage zum Erstellen oder Aktualisieren des Dokuments ist ungültig.",
    "errors.default":
      "Etwas ist schiefgelaufen. Bitte versuchen Sie es später erneut.",
  },
  it: {
    notifications: "Notifiche",
    noNotifications: "Nessuna notifica.",
    showNotifications: "Mostra notifiche",
    ghostMode: "Modalità fantasma",
    ghostModeActive: "Modalità fantasma attiva",
    voiceMode: "mAI Voice",
    voiceModeLabel: "Modalità voce pura (Sperimentale)",
    voiceListening: "In ascolto...",
    voiceStart: "Avvia modalità voce",
    voiceStop: "Stop",
    voiceTranscript: "Trascrizione",
    voiceSend: "Invia alla chat",
    voiceCaptions: "Sottotitoli",
    "errors.database":
      "Si è verificato un errore durante l'esecuzione di una query del database.",
    "errors.badRequestApi":
      "La richiesta non può essere elaborata. Controlla l'input e riprova.",
    "errors.gateway":
      "AI Gateway richiede una carta di credito valida per elaborare le richieste.",
    "errors.authRequired": "Devi accedere prima di continuare.",
    "errors.authForbidden":
      "Il tuo account non ha accesso a questa funzionalità.",
    "errors.rateLimit":
      "Hai raggiunto il limite di messaggi. Torna tra 1 ora.",
    "errors.chatNotFound":
      "La chat richiesta non è stata trovata. Controlla l'ID chat.",
    "errors.chatForbidden":
      "Questa chat appartiene a un altro utente. Controlla l'ID chat.",
    "errors.chatUnauthorized":
      "Devi accedere per visualizzare questa chat.",
    "errors.offline":
      "Problemi nell'invio del messaggio. Controlla la connessione Internet.",
    "errors.documentNotFound":
      "Il documento richiesto non è stato trovato. Controlla l'ID documento.",
    "errors.documentForbidden":
      "Questo documento appartiene a un altro utente. Controlla l'ID documento.",
    "errors.documentUnauthorized":
      "Devi accedere per visualizzare questo documento.",
    "errors.documentBadRequest":
      "La richiesta per creare o aggiornare il documento non è valida.",
    "errors.default": "Si è verificato un problema. Riprova più tardi.",
  },

  pt: {
    notifications: "Notificações",
    noNotifications: "Sem notificações.",
    showNotifications: "Mostrar notificações",
    ghostMode: "Modo Fantasma",
    ghostModeActive: "Modo Fantasma ativo",
    voiceMode: "mAI Voice",
    voiceModeLabel: "Modo de voz puro (Experimental)",
    voiceListening: "Ouvindo...",
    voiceStart: "Iniciar modo de voz",
    voiceStop: "Parar",
    voiceTranscript: "Transcrição",
    voiceSend: "Enviar ao chat",
    voiceCaptions: "Legendas",
    "errors.database": "Ocorreu um erro ao executar uma consulta no banco de dados.",
    "errors.badRequestApi": "A solicitação não pôde ser processada.",
    "errors.gateway": "AI Gateway requer um cartão de crédito válido.",
    "errors.authRequired": "Você precisa entrar antes de continuar.",
    "errors.authForbidden": "Sua conta não tem acesso a este recurso.",
    "errors.rateLimit": "Você atingiu o limite de mensagens.",
    "errors.chatNotFound": "Chat não encontrado.",
    "errors.chatForbidden": "Este chat pertence a outro usuário.",
    "errors.chatUnauthorized": "Você precisa entrar para ver este chat.",
    "errors.offline": "Problema de conexão ao enviar sua mensagem.",
    "errors.documentNotFound": "Documento não encontrado.",
    "errors.documentForbidden": "Este documento pertence a outro usuário.",
    "errors.documentUnauthorized": "Você precisa entrar para ver este documento.",
    "errors.documentBadRequest": "A solicitação de documento é inválida.",
    "errors.default": "Algo deu errado. Tente novamente mais tarde.",
  },
  zh: {
    notifications: "通知",
    noNotifications: "暂无通知。",
    showNotifications: "显示通知",
    ghostMode: "隐身模式",
    ghostModeActive: "隐身模式已开启",
    voiceMode: "mAI 语音",
    voiceModeLabel: "纯语音模式（实验）",
    voiceListening: "正在聆听...",
    voiceStart: "开始语音模式",
    voiceStop: "停止",
    voiceTranscript: "转录",
    voiceSend: "发送到聊天",
    voiceCaptions: "字幕",
    "errors.database": "执行数据库查询时发生错误。",
    "errors.badRequestApi": "请求无法处理，请检查输入。",
    "errors.gateway": "AI Gateway 需要有效信用卡。",
    "errors.authRequired": "请先登录后继续。",
    "errors.authForbidden": "您的账号无权使用此功能。",
    "errors.rateLimit": "您已达到消息上限。",
    "errors.chatNotFound": "未找到对应聊天。",
    "errors.chatForbidden": "该聊天属于其他用户。",
    "errors.chatUnauthorized": "请先登录查看聊天。",
    "errors.offline": "发送失败，请检查网络连接。",
    "errors.documentNotFound": "未找到对应文档。",
    "errors.documentForbidden": "该文档属于其他用户。",
    "errors.documentUnauthorized": "请先登录查看文档。",
    "errors.documentBadRequest": "文档请求无效。",
    "errors.default": "发生错误，请稍后再试。",
  },
  fr: {
    notifications: "Notifications",
    noNotifications: "Aucune notification.",
    showNotifications: "Afficher les notifications",
    ghostMode: "Mode Fantôme",
    ghostModeActive: "Mode Fantôme actif",
    voiceMode: "mAI Voice",
    voiceModeLabel: "Mode vocal pur (Expérimental)",
    voiceListening: "Écoute en cours…",
    voiceStart: "Lancer le mode vocal",
    voiceStop: "Arrêter",
    voiceTranscript: "Transcription",
    voiceSend: "Envoyer au chat",
    voiceCaptions: "Sous-titres",
    "errors.database":
      "Une erreur est survenue lors de l'exécution d'une requête dans la base de données.",
    "errors.badRequestApi":
      "La requête n'a pas pu être traitée. Veuillez vérifier votre saisie et réessayer.",
    "errors.gateway":
      "AI Gateway nécessite une carte de crédit valide pour traiter les requêtes.",
    "errors.authRequired": "Vous devez vous connecter avant de continuer.",
    "errors.authForbidden":
      "Votre compte n'a pas accès à cette fonctionnalité.",
    "errors.rateLimit":
      "Vous avez atteint la limite de messages. Revenez dans 1 heure pour continuer.",
    "errors.chatNotFound":
      "Le chat demandé est introuvable. Veuillez vérifier l'identifiant du chat et réessayer.",
    "errors.chatForbidden":
      "Ce chat appartient à un autre utilisateur. Veuillez vérifier l'identifiant du chat et réessayer.",
    "errors.chatUnauthorized":
      "Vous devez vous connecter pour voir ce chat. Veuillez vous connecter et réessayer.",
    "errors.offline":
      "Nous rencontrons des problèmes pour envoyer votre message. Veuillez vérifier votre connexion Internet et réessayer.",
    "errors.documentNotFound":
      "Le document demandé est introuvable. Veuillez vérifier l'identifiant du document et réessayer.",
    "errors.documentForbidden":
      "Ce document appartient à un autre utilisateur. Veuillez vérifier l'identifiant du document et réessayer.",
    "errors.documentUnauthorized":
      "Vous devez vous connecter pour voir ce document. Veuillez vous connecter et réessayer.",
    "errors.documentBadRequest":
      "La requête pour créer ou mettre à jour le document est invalide. Veuillez vérifier votre saisie et réessayer.",
    "errors.default": "Un problème est survenu. Veuillez réessayer plus tard.",
  },
} as const;

export type TranslationKey = keyof (typeof dictionary)["fr"];

export function resolveLanguage(value: string | null | undefined): AppLanguage {
  if (!value) {
    return fallbackLanguage;
  }

  return SUPPORTED_LANGUAGES.includes(value as AppLanguage)
    ? (value as AppLanguage)
    : fallbackLanguage;
}

export function getLanguageFromStorage(): AppLanguage {
  if (typeof window === "undefined") {
    return fallbackLanguage;
  }

  return resolveLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function setLanguageInStorage(language: AppLanguage) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  window.dispatchEvent(
    new CustomEvent("mai:language-updated", { detail: { language } })
  );
}

export function t(key: TranslationKey, language: AppLanguage): string {
  return dictionary[language][key] ?? dictionary.fr[key];
}
