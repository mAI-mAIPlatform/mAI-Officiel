"use client";

export const LANGUAGE_STORAGE_KEY = "mai.language.v1";

export const SUPPORTED_LANGUAGES = [
  "fr",
  "en",
  "es",
  "de",
  "it",
  "pt",
  "zh",
  "ar",
  "ko",
  "pl",
  "hr",
  "sv",
] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_OPTIONS: Array<{ code: AppLanguage; label: string }> = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "zh", label: "中文（普通话）" },
  { code: "ar", label: "العربية" },
  { code: "ko", label: "한국어" },
  { code: "pl", label: "Polski" },
  { code: "hr", label: "Hrvatski" },
  { code: "sv", label: "Svenska" },
];

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
    "quizzly.stats.bestScore": "Best score",
    "quizzly.stats.fastestQuiz": "Fastest quiz",
    "quizzly.stats.longestStreak": "Longest streak",
    "quizzly.stats.netDiamonds": "Net diamonds",
    "quizzly.stats.soon": "coming soon",
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
    "quizzly.stats.bestScore": "Mejor puntuación",
    "quizzly.stats.fastestQuiz": "Quiz más rápido",
    "quizzly.stats.longestStreak": "Racha más larga",
    "quizzly.stats.netDiamonds": "Diamantes netos",
    "quizzly.stats.soon": "próximamente",
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
    "quizzly.stats.bestScore": "Beste Punktzahl",
    "quizzly.stats.fastestQuiz": "Schnellstes Quiz",
    "quizzly.stats.longestStreak": "Längste Serie",
    "quizzly.stats.netDiamonds": "Nettodiamanten",
    "quizzly.stats.soon": "bald verfügbar",
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
    "quizzly.stats.bestScore": "Punteggio migliore",
    "quizzly.stats.fastestQuiz": "Quiz più veloce",
    "quizzly.stats.longestStreak": "Serie più lunga",
    "quizzly.stats.netDiamonds": "Diamanti netti",
    "quizzly.stats.soon": "prossimamente",
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
    "quizzly.stats.bestScore": "Melhor pontuação",
    "quizzly.stats.fastestQuiz": "Quiz mais rápido",
    "quizzly.stats.longestStreak": "Maior sequência",
    "quizzly.stats.netDiamonds": "Diamantes líquidos",
    "quizzly.stats.soon": "em breve",
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
    "quizzly.stats.bestScore": "最佳得分",
    "quizzly.stats.fastestQuiz": "最快测验",
    "quizzly.stats.longestStreak": "最长连胜",
    "quizzly.stats.netDiamonds": "净钻石",
    "quizzly.stats.soon": "即将推出",
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
  ar: {
    notifications: "الإشعارات",
    noNotifications: "لا توجد إشعارات.",
    showNotifications: "إظهار الإشعارات",
    ghostMode: "الوضع الخفي",
    ghostModeActive: "الوضع الخفي مفعّل",
    voiceMode: "mAI Voice",
    voiceModeLabel: "وضع الصوت فقط (تجريبي)",
    voiceListening: "جارٍ الاستماع...",
    voiceStart: "بدء وضع الصوت",
    voiceStop: "إيقاف",
    voiceTranscript: "النص المكتوب",
    voiceSend: "إرسال إلى الدردشة",
    voiceCaptions: "الترجمة النصية",
    "quizzly.stats.bestScore": "أفضل نتيجة",
    "quizzly.stats.fastestQuiz": "أسرع اختبار",
    "quizzly.stats.longestStreak": "أطول سلسلة",
    "quizzly.stats.netDiamonds": "صافي الماس",
    "quizzly.stats.soon": "قريبًا",
    "errors.database": "حدث خطأ أثناء تنفيذ استعلام قاعدة البيانات.",
    "errors.badRequestApi": "تعذر معالجة الطلب. يرجى التحقق من الإدخال والمحاولة مرة أخرى.",
    "errors.gateway": "يتطلب AI Gateway بطاقة ائتمان صالحة لمعالجة الطلبات.",
    "errors.authRequired": "يجب تسجيل الدخول قبل المتابعة.",
    "errors.authForbidden": "حسابك لا يملك صلاحية الوصول إلى هذه الميزة.",
    "errors.rateLimit": "لقد وصلت إلى حد الرسائل. عُد بعد ساعة للمتابعة.",
    "errors.chatNotFound": "لم يتم العثور على الدردشة المطلوبة. يرجى التحقق من المعرّف.",
    "errors.chatForbidden": "هذه الدردشة تخص مستخدمًا آخر.",
    "errors.chatUnauthorized": "يجب تسجيل الدخول لعرض هذه الدردشة.",
    "errors.offline": "توجد مشكلة في إرسال الرسالة. تحقّق من اتصال الإنترنت.",
    "errors.documentNotFound": "لم يتم العثور على المستند المطلوب.",
    "errors.documentForbidden": "هذا المستند يخص مستخدمًا آخر.",
    "errors.documentUnauthorized": "يجب تسجيل الدخول لعرض هذا المستند.",
    "errors.documentBadRequest": "طلب إنشاء المستند أو تحديثه غير صالح.",
    "errors.default": "حدث خطأ ما. يرجى المحاولة لاحقًا.",
  },
  ko: {
    notifications: "알림",
    noNotifications: "알림이 없습니다.",
    showNotifications: "알림 보기",
    ghostMode: "고스트 모드",
    ghostModeActive: "고스트 모드 활성화됨",
    voiceMode: "mAI Voice",
    voiceModeLabel: "순수 음성 모드 (실험적)",
    voiceListening: "듣는 중...",
    voiceStart: "음성 모드 시작",
    voiceStop: "중지",
    voiceTranscript: "전사",
    voiceSend: "채팅으로 보내기",
    voiceCaptions: "자막",
    "quizzly.stats.bestScore": "최고 점수",
    "quizzly.stats.fastestQuiz": "가장 빠른 퀴즈",
    "quizzly.stats.longestStreak": "최장 연속 기록",
    "quizzly.stats.netDiamonds": "순 다이아몬드",
    "quizzly.stats.soon": "곧 제공",
    "errors.database": "데이터베이스 쿼리 실행 중 오류가 발생했습니다.",
    "errors.badRequestApi": "요청을 처리할 수 없습니다. 입력을 확인하고 다시 시도하세요.",
    "errors.gateway": "AI Gateway 요청 처리에는 유효한 신용카드가 필요합니다.",
    "errors.authRequired": "계속하려면 로그인해야 합니다.",
    "errors.authForbidden": "이 기능에 접근할 권한이 없습니다.",
    "errors.rateLimit": "메시지 한도에 도달했습니다. 1시간 후 다시 시도하세요.",
    "errors.chatNotFound": "요청한 채팅을 찾을 수 없습니다.",
    "errors.chatForbidden": "이 채팅은 다른 사용자에게 속합니다.",
    "errors.chatUnauthorized": "이 채팅을 보려면 로그인해야 합니다.",
    "errors.offline": "메시지 전송에 문제가 있습니다. 인터넷 연결을 확인하세요.",
    "errors.documentNotFound": "요청한 문서를 찾을 수 없습니다.",
    "errors.documentForbidden": "이 문서는 다른 사용자에게 속합니다.",
    "errors.documentUnauthorized": "이 문서를 보려면 로그인해야 합니다.",
    "errors.documentBadRequest": "문서 생성/업데이트 요청이 올바르지 않습니다.",
    "errors.default": "문제가 발생했습니다. 잠시 후 다시 시도하세요.",
  },
  pl: {
    notifications: "Powiadomienia",
    noNotifications: "Brak powiadomień.",
    showNotifications: "Pokaż powiadomienia",
    ghostMode: "Tryb ducha",
    ghostModeActive: "Tryb ducha aktywny",
    voiceMode: "mAI Voice",
    voiceModeLabel: "Tryb tylko głosowy (eksperymentalny)",
    voiceListening: "Słucham...",
    voiceStart: "Uruchom tryb głosowy",
    voiceStop: "Zatrzymaj",
    voiceTranscript: "Transkrypcja",
    voiceSend: "Wyślij do czatu",
    voiceCaptions: "Napisy",
    "quizzly.stats.bestScore": "Najlepszy wynik",
    "quizzly.stats.fastestQuiz": "Najszybszy quiz",
    "quizzly.stats.longestStreak": "Najdłuższa passa",
    "quizzly.stats.netDiamonds": "Diamenty netto",
    "quizzly.stats.soon": "wkrótce",
    "errors.database": "Wystąpił błąd podczas wykonywania zapytania do bazy danych.",
    "errors.badRequestApi": "Nie udało się przetworzyć żądania. Sprawdź dane i spróbuj ponownie.",
    "errors.gateway": "AI Gateway wymaga ważnej karty kredytowej.",
    "errors.authRequired": "Musisz się zalogować, aby kontynuować.",
    "errors.authForbidden": "Twoje konto nie ma dostępu do tej funkcji.",
    "errors.rateLimit": "Osiągnięto limit wiadomości. Wróć za 1 godzinę.",
    "errors.chatNotFound": "Nie znaleziono żądanego czatu.",
    "errors.chatForbidden": "Ten czat należy do innego użytkownika.",
    "errors.chatUnauthorized": "Musisz się zalogować, aby wyświetlić ten czat.",
    "errors.offline": "Wystąpił problem z wysłaniem wiadomości. Sprawdź połączenie internetowe.",
    "errors.documentNotFound": "Nie znaleziono żądanego dokumentu.",
    "errors.documentForbidden": "Ten dokument należy do innego użytkownika.",
    "errors.documentUnauthorized": "Musisz się zalogować, aby wyświetlić ten dokument.",
    "errors.documentBadRequest": "Żądanie utworzenia/aktualizacji dokumentu jest nieprawidłowe.",
    "errors.default": "Coś poszło nie tak. Spróbuj ponownie później.",
  },
  hr: {
    notifications: "Obavijesti",
    noNotifications: "Nema obavijesti.",
    showNotifications: "Prikaži obavijesti",
    ghostMode: "Ghost način",
    ghostModeActive: "Ghost način je aktivan",
    voiceMode: "mAI Voice",
    voiceModeLabel: "Samo glasovni način (eksperimentalno)",
    voiceListening: "Slušam...",
    voiceStart: "Pokreni glasovni način",
    voiceStop: "Zaustavi",
    voiceTranscript: "Transkript",
    voiceSend: "Pošalji u chat",
    voiceCaptions: "Titlovi",
    "quizzly.stats.bestScore": "Najbolji rezultat",
    "quizzly.stats.fastestQuiz": "Najbrži kviz",
    "quizzly.stats.longestStreak": "Najdulji niz",
    "quizzly.stats.netDiamonds": "Neto dijamanti",
    "quizzly.stats.soon": "uskoro",
    "errors.database": "Dogodila se pogreška pri izvršavanju upita baze podataka.",
    "errors.badRequestApi": "Zahtjev nije moguće obraditi. Provjerite unos i pokušajte ponovno.",
    "errors.gateway": "AI Gateway zahtijeva valjanu kreditnu karticu.",
    "errors.authRequired": "Morate se prijaviti prije nastavka.",
    "errors.authForbidden": "Vaš račun nema pristup ovoj značajci.",
    "errors.rateLimit": "Dosegnuli ste ograničenje poruka. Vratite se za 1 sat.",
    "errors.chatNotFound": "Traženi chat nije pronađen.",
    "errors.chatForbidden": "Ovaj chat pripada drugom korisniku.",
    "errors.chatUnauthorized": "Morate se prijaviti za prikaz ovog chata.",
    "errors.offline": "Imamo problem sa slanjem poruke. Provjerite internetsku vezu.",
    "errors.documentNotFound": "Traženi dokument nije pronađen.",
    "errors.documentForbidden": "Ovaj dokument pripada drugom korisniku.",
    "errors.documentUnauthorized": "Morate se prijaviti za prikaz ovog dokumenta.",
    "errors.documentBadRequest": "Zahtjev za izradu/ažuriranje dokumenta nije valjan.",
    "errors.default": "Došlo je do pogreške. Pokušajte ponovno kasnije.",
  },
  sv: {
    notifications: "Notiser",
    noNotifications: "Inga notiser.",
    showNotifications: "Visa notiser",
    ghostMode: "Spökläge",
    ghostModeActive: "Spökläge aktivt",
    voiceMode: "mAI Voice",
    voiceModeLabel: "Rent röstläge (experimentellt)",
    voiceListening: "Lyssnar...",
    voiceStart: "Starta röstläge",
    voiceStop: "Stopp",
    voiceTranscript: "Transkription",
    voiceSend: "Skicka till chatten",
    voiceCaptions: "Undertexter",
    "quizzly.stats.bestScore": "Bästa poäng",
    "quizzly.stats.fastestQuiz": "Snabbaste quiz",
    "quizzly.stats.longestStreak": "Längsta streak",
    "quizzly.stats.netDiamonds": "Netto-diamanter",
    "quizzly.stats.soon": "kommer snart",
    "errors.database": "Ett fel uppstod vid körning av en databasfråga.",
    "errors.badRequestApi": "Begäran kunde inte behandlas. Kontrollera indata och försök igen.",
    "errors.gateway": "AI Gateway kräver ett giltigt kreditkort.",
    "errors.authRequired": "Du måste logga in innan du fortsätter.",
    "errors.authForbidden": "Ditt konto har inte åtkomst till denna funktion.",
    "errors.rateLimit": "Du har nått meddelandegränsen. Kom tillbaka om 1 timme.",
    "errors.chatNotFound": "Den begärda chatten hittades inte.",
    "errors.chatForbidden": "Den här chatten tillhör en annan användare.",
    "errors.chatUnauthorized": "Du måste logga in för att visa chatten.",
    "errors.offline": "Problem med att skicka meddelandet. Kontrollera internetanslutningen.",
    "errors.documentNotFound": "Det begärda dokumentet hittades inte.",
    "errors.documentForbidden": "Det här dokumentet tillhör en annan användare.",
    "errors.documentUnauthorized": "Du måste logga in för att visa dokumentet.",
    "errors.documentBadRequest": "Begäran om att skapa/uppdatera dokumentet är ogiltig.",
    "errors.default": "Något gick fel. Försök igen senare.",
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
    "quizzly.stats.bestScore": "Meilleur score",
    "quizzly.stats.fastestQuiz": "Quiz le plus rapide",
    "quizzly.stats.longestStreak": "Plus long streak",
    "quizzly.stats.netDiamonds": "Diamants net",
    "quizzly.stats.soon": "bientôt",
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
