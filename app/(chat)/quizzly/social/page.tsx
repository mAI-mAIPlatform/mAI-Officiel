"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Handshake, Users, Trophy, UserPlus, Reply, Flame, Swords, Medal, Flag, ShieldAlert, Gavel, Trash2, VolumeX } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import { toast } from "sonner";
import { getFriendStreaks, getMonthlyReferralLeaderboard, getQuizzlyProfile } from "@/lib/quizzly/actions";
import { analyzeMessageForModeration, getNextSanction, getSendRestriction, type ModerationReason, type UserModerationStatus } from "@/lib/quizzly/moderation";

const SOCIAL_STORAGE_KEY = "mai.quizzly.social.v1";
const DUEL_HISTORY_KEY = "mai.quizzly.duel-history.v1";
const MODERATION_STORAGE_KEY = "mai.quizzly.moderation.v1";
const REACTIONS = ["👍", "🔥", "😂", "🧠", "⭐", "💀"] as const;
const CURRENT_USER_ID = "me";

type SocialState = {
  blockedUsers: string[];
  friendRequests: string[];
  friends: string[];
  reportedUsers: string[];
};

type ChatMessage = {
  id: string;
  text: string;
  author: string;
  senderId: string;
  channel?: string;
  parentId?: string;
  reactionsByUser: Record<string, string>;
  filtered?: boolean;
  removed?: boolean;
};
type DuelHistoryEntry = {
  id: string;
  playedAt: string;
  subject: string;
  playerA: string;
  playerB: string;
  scoreA: number;
  scoreB: number;
  winner: string | "égalité";
};
type ReportReason = "Insulte ou harcèlement" | "Spam" | "Contenu inapproprié" | "Tentative d'arnaque" | "Autre";
type ModerationReport = {
  id: string;
  messageId: string;
  channel: string;
  reportedUser: string;
  reason: ReportReason;
  comment?: string;
  reporter: string;
  createdAt: string;
  status: "open" | "resolved" | "escalated";
};
type ModerationState = {
  reports: ModerationReport[];
  sanctionsByUser: Record<string, UserModerationStatus>;
};

export default function QuizzlySocialPage() {
  const [activeTab, setActiveTab] = useState<"friends" | "chat">("friends");
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [friendInput, setFriendInput] = useState("");
  const [social, setSocial] = useState<SocialState>({
    blockedUsers: [],
    friends: [],
    friendRequests: ["Leo92", "NinaMath"],
    reportedUsers: [],
  });
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [friendStreaks, setFriendStreaks] = useState<Record<string, number>>({});
  const [activeChannel, setActiveChannel] = useState<string>("global");
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [friendProfileTab, setFriendProfileTab] = useState<"overview" | "history">("overview");
  const [duelHistory, setDuelHistory] = useState<DuelHistoryEntry[]>([]);
  const [myProfile, setMyProfile] = useState<{ level: number; createdAt: string } | null>(null);
  const [moderation, setModeration] = useState<ModerationState>({ reports: [], sanctionsByUser: {} });
  const [reportModalFor, setReportModalFor] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("Insulte ou harcèlement");
  const [reportComment, setReportComment] = useState("");
  const [monthlyReferralBoard, setMonthlyReferralBoard] = useState<Array<{ userId: string; pseudo: string; activeReferrals: number }>>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SOCIAL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SocialState;
      if (Array.isArray(parsed.friends) && Array.isArray(parsed.friendRequests)) {
        setSocial(parsed);
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    getMonthlyReferralLeaderboard()
      .then((result) => setMonthlyReferralBoard(result.entries))
      .catch(() => setMonthlyReferralBoard([]));
  }, []);

  useEffect(() => {
    getQuizzlyProfile()
      .then((profile) => setMyProfile({ level: profile.level, createdAt: String(profile.createdAt) }))
      .catch(() => setMyProfile(null));
    try {
      const raw = localStorage.getItem(MODERATION_STORAGE_KEY);
      if (raw) setModeration(JSON.parse(raw) as ModerationState);
    } catch {
      setModeration({ reports: [], sanctionsByUser: {} });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(MODERATION_STORAGE_KEY, JSON.stringify(moderation));
  }, [moderation]);

  useEffect(() => {
    window.localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(social));
  }, [social]);

  useEffect(() => {
    getFriendStreaks()
      .then((rows) =>
        setFriendStreaks(
          Object.fromEntries(rows.map((row) => [row.pseudo, row.streak]))
        )
      )
      .catch(() => setFriendStreaks({}));
  }, [social.friends]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join-room", "quizzly-global");
    const listener = (msg: { text?: string }) => {
      if (!msg?.text) return;
      setMessages((prev) => {
        const moderationScan = analyzeMessageForModeration(msg.text ?? "", prev.slice(-3).map((item) => item.text));
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            text: moderationScan.blocked ? (moderationScan.replacementText ?? "[Message filtré automatiquement par la modération]") : (msg.text ?? ""),
            author: "Ami",
            senderId: "friend:socket",
            reactionsByUser: {},
            filtered: moderationScan.blocked,
          },
        ];
      });
    };
    socket.on("receive-message", listener);

    return () => {
      socket.off("receive-message", listener);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const roomId =
      activeChannel === "global"
        ? "quizzly-global"
        : `quizzly-friend-${activeChannel}`;
    socket.emit("join-room", roomId);
  }, [socket, activeChannel]);

  useEffect(() => {
    try {
      setDuelHistory(JSON.parse(localStorage.getItem(DUEL_HISTORY_KEY) ?? "[]"));
    } catch {
      setDuelHistory([]);
    }
  }, []);

  const pairHistory = useMemo(() => {
    if (!selectedFriend) return [];
    return duelHistory
      .filter((entry) => [entry.playerA, entry.playerB].includes("Moi") && [entry.playerA, entry.playerB].includes(selectedFriend))
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
  }, [duelHistory, selectedFriend]);

  const rivalsRanking = useMemo(() => {
    const countByRival = new Map<string, number>();
    duelHistory.forEach((entry) => {
      const rival = entry.playerA === "Moi" ? entry.playerB : entry.playerB === "Moi" ? entry.playerA : null;
      if (!rival) return;
      countByRival.set(rival, (countByRival.get(rival) ?? 0) + 1);
    });
    return Array.from(countByRival.entries())
      .map(([pseudo, duels]) => ({ pseudo, duels }))
      .sort((a, b) => b.duels - a.duels);
  }, [duelHistory]);

  const pairSummary = useMemo(() => {
    if (!selectedFriend) return null;
    const wins = pairHistory.filter((entry) => entry.winner === "Moi").length;
    const losses = pairHistory.filter((entry) => entry.winner === selectedFriend).length;
    const draws = pairHistory.filter((entry) => entry.winner === "égalité").length;
    const winRate = pairHistory.length > 0 ? Math.round((wins / pairHistory.length) * 100) : 0;
    let streak = 0;
    let bestStreak = 0;
    [...pairHistory].reverse().forEach((entry) => {
      if (entry.winner === "Moi") {
        streak += 1;
        bestStreak = Math.max(bestStreak, streak);
      } else {
        streak = 0;
      }
    });
    const bySubject = new Map<string, number>();
    pairHistory.forEach((entry) => {
      const meWon = entry.winner === "Moi" ? 1 : entry.winner === selectedFriend ? -1 : 0;
      bySubject.set(entry.subject, (bySubject.get(entry.subject) ?? 0) + meWon);
    });
    const bestSubject = Array.from(bySubject.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const rivalBestSubject = Array.from(bySubject.entries()).sort((a, b) => a[1] - b[1])[0]?.[0] ?? "—";
    return { wins, losses, draws, winRate, bestStreak, bestSubject, rivalBestSubject };
  }, [pairHistory, selectedFriend]);

  const displayedMessages = useMemo(
    () =>
      messages.filter(
        (msg) =>
          !social.blockedUsers.includes(msg.author) &&
          (activeChannel === "global"
            ? (msg.channel ?? "global") === "global"
            : (msg.channel ?? "global") === activeChannel)
      ),
    [messages, social.blockedUsers, activeChannel]
  );

  const handleSend = () => {
    if (!input.trim()) return;
    const restriction = getSendRestriction(moderation.sanctionsByUser[CURRENT_USER_ID]);
    if (restriction.blocked) {
      toast.error(restriction.reason);
      return;
    }
    const recentMine = messages.filter((m) => m.senderId === CURRENT_USER_ID).slice(-3).map((m) => m.text);
    const moderationScan = analyzeMessageForModeration(input.trim(), recentMine);
    if (moderationScan.blocked) {
      const reasonText = moderationScan.reasons.join(", ");
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: moderationScan.replacementText ?? "[Message filtré automatiquement par la modération]",
          author: "Moi",
          senderId: CURRENT_USER_ID,
          channel: activeChannel,
          reactionsByUser: {},
          filtered: true,
        },
      ]);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: `⚠️ Avertissement privé: message bloqué (${reasonText}). Merci de respecter les règles de la communauté.`,
          author: "Modération",
          senderId: "system:moderation",
          channel: activeChannel,
          reactionsByUser: {},
        },
      ]);
      setModeration((prev) => {
        const current = prev.sanctionsByUser[CURRENT_USER_ID] ?? { warnings: 0, offenseCount: 0 };
        const escalation = getNextSanction(current);
        return {
          ...prev,
          sanctionsByUser: {
            ...prev.sanctionsByUser,
            [CURRENT_USER_ID]: { ...escalation.next, lastReason: moderationScan.reasons[0] },
          },
        };
      });
      toast.error(`Message bloqué automatiquement: ${reasonText}`);
      setInput("");
      setReplyTo(null);
      return;
    }
    const payload = {
      id: crypto.randomUUID(),
      text: input.trim(),
      author: "Moi",
      senderId: CURRENT_USER_ID,
      channel: activeChannel,
      parentId: replyTo?.id,
      reactionsByUser: {},
    } satisfies ChatMessage;

    socket?.emit("send-message", { roomId: activeChannel === "global" ? "quizzly-global" : `quizzly-friend-${activeChannel}`, text: payload.text });
    setMessages((prev) => [...prev, payload]);
    setInput("");
    setReplyTo(null);
  };

  const pinMessage = (message: string) => {
    if (pinnedMessages.includes(message)) return;
    setPinnedMessages((prev) => [message, ...prev].slice(0, 5));
    toast.success("Message épinglé.");
  };

  const reactToMessage = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentEmoji = msg.reactionsByUser[CURRENT_USER_ID];
        return {
          ...msg,
          reactionsByUser: {
            ...msg.reactionsByUser,
            [CURRENT_USER_ID]: currentEmoji === emoji ? "" : emoji,
          },
        };
      })
    );
  };

  const reactionCount = (msg: ChatMessage, emoji: string) =>
    Object.values(msg.reactionsByUser).filter((item) => item === emoji).length;

  const exportDiscussion = () => {
    const content = displayedMessages.map((m) => `${m.author}: ${m.text}`).join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quizzly-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const blockFriend = (pseudo: string) => {
    setSocial((prev) => ({
      ...prev,
      blockedUsers: Array.from(new Set([pseudo, ...prev.blockedUsers])),
      friends: prev.friends.filter((friend) => friend !== pseudo),
    }));
  };

  const reportFriend = (pseudo: string) => {
    setSocial((prev) => ({
      ...prev,
      reportedUsers: Array.from(new Set([pseudo, ...prev.reportedUsers])),
    }));
  };

  const canModerate = useMemo(() => {
    if (!myProfile) return false;
    const ageDays = Math.floor((Date.now() - new Date(myProfile.createdAt).getTime()) / 86400000);
    const myStatus = moderation.sanctionsByUser[CURRENT_USER_ID];
    const noSanction = !myStatus || (myStatus.offenseCount ?? 0) === 0;
    return myProfile.level >= 20 && ageDays >= 30 && noSanction;
  }, [moderation.sanctionsByUser, myProfile]);

  const submitReport = () => {
    if (!reportModalFor) return;
    const report: ModerationReport = {
      id: crypto.randomUUID(),
      messageId: reportModalFor.id,
      channel: reportModalFor.channel ?? "global",
      reportedUser: reportModalFor.author,
      reason: reportReason,
      comment: reportComment.trim() || undefined,
      reporter: "Moi",
      createdAt: new Date().toISOString(),
      status: "open",
    };
    setModeration((prev) => ({ ...prev, reports: [report, ...prev.reports] }));
    toast.success("Signalement envoyé dans la file de modération.");
    setReportModalFor(null);
    setReportComment("");
    setReportReason("Insulte ou harcèlement");
  };

  const moderateReport = (reportId: string, action: "delete" | "mute1h" | "mute24h" | "escalate") => {
    const report = moderation.reports.find((item) => item.id === reportId);
    if (!report) return;
    if (action === "delete") {
      setMessages((prev) => prev.map((message) => (message.id === report.messageId ? { ...message, text: "[Message supprimé par la modération]", removed: true } : message)));
    }
    if (action === "mute1h" || action === "mute24h") {
      const durationMs = action === "mute1h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      setModeration((prev) => ({
        ...prev,
        sanctionsByUser: {
          ...prev.sanctionsByUser,
          [report.reportedUser]: {
            ...(prev.sanctionsByUser[report.reportedUser] ?? { warnings: 0, offenseCount: 0 }),
            mutedUntil: new Date(Date.now() + durationMs).toISOString(),
            offenseCount: (prev.sanctionsByUser[report.reportedUser]?.offenseCount ?? 0) + 1,
          },
        },
      }));
    }
    setModeration((prev) => ({
      ...prev,
      reports: prev.reports.map((item) => (item.id === reportId ? { ...item, status: action === "escalate" ? "escalated" : "resolved" } : item)),
    }));
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-800">Social</h1>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab("friends")} className={`px-6 py-2 rounded-lg font-bold text-sm transition ${activeTab === "friends" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>Mes amis</button>
          <button onClick={() => setActiveTab("chat")} className={`px-6 py-2 rounded-lg font-bold text-sm transition ${activeTab === "chat" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>Discussions</button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {activeTab === "friends" ? (
          <div className="p-8 flex-1 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="font-black text-slate-800 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Ajouter un ami</p>
                <div className="mt-3 flex gap-2">
                  <input value={friendInput} onChange={(e) => setFriendInput(e.target.value)} placeholder="Pseudo du joueur..." className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl" />
                  <button onClick={() => setSocial((prev) => ({ ...prev, friends: [friendInput.trim(), ...prev.friends].filter(Boolean) }))} className="bg-violet-600 text-white font-bold px-4 py-2 rounded-xl">Ajouter</button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="font-black text-slate-800 flex items-center gap-2"><Handshake className="w-4 h-4 text-amber-500" /> Demandes reçues</p>
                <div className="mt-3 space-y-2">
                  {social.friendRequests.map((pseudo) => (
                    <div key={pseudo} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                      <span>{pseudo}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setSocial((prev) => ({ ...prev, friendRequests: prev.friendRequests.filter((r) => r !== pseudo), friends: [pseudo, ...prev.friends] }))} className="text-xs font-bold bg-emerald-500 text-white px-2 py-1 rounded">Accepter</button>
                        <button onClick={() => setSocial((prev) => ({ ...prev, friendRequests: prev.friendRequests.filter((r) => r !== pseudo) }))} className="text-xs font-bold bg-slate-400 text-white px-2 py-1 rounded">Refuser</button>
                        <button onClick={() => { setSocial((prev) => ({ ...prev, friendRequests: prev.friendRequests.filter((r) => r !== pseudo), blockedUsers: Array.from(new Set([pseudo, ...prev.blockedUsers])) })); toast.success(`${pseudo} bloqué.`); }} className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded">Bloquer</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="font-black text-slate-800 flex items-center gap-2"><Users className="w-4 h-4 text-violet-600" /> Mes amis ({social.friends.length})</p>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {social.friends.map((friend) => (
                  <div key={friend} className="bg-violet-50 text-violet-700 px-3 py-2 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span>{friend} <span className="text-xs text-orange-500">🔥 {friendStreaks[friend] ?? 0}</span></span>
                      <Trophy className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedFriend(friend); setFriendProfileTab("overview"); }} className="text-[10px] font-bold bg-violet-600 text-white px-2 py-1 rounded">Profil</button>
                      <button onClick={() => blockFriend(friend)} className="text-[10px] font-bold bg-slate-800 text-white px-2 py-1 rounded">Bloquer</button>
                      <button onClick={() => reportFriend(friend)} className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded">Signaler</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="font-black text-slate-800 flex items-center gap-2"><Swords className="w-4 h-4 text-orange-500" /> Mes meilleurs rivaux</p>
              <div className="mt-3 space-y-2">
                {rivalsRanking.slice(0, 8).map((rival) => (
                  <div key={`rival-${rival.pseudo}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span>{rival.pseudo}</span>
                    <span className="font-bold text-slate-700">{rival.duels} défis {rival.duels > 10 ? <Flame className="ml-1 inline h-4 w-4 text-orange-500" /> : null}</span>
                  </div>
                ))}
                {rivalsRanking.length === 0 ? <p className="text-xs text-slate-500">Aucun duel enregistré pour le moment.</p> : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
              <div className="w-1/3 border-r border-slate-100 p-4 space-y-2">
              <button className={`w-full text-left font-bold p-4 rounded-xl ${activeChannel === "global" ? "bg-violet-100 text-violet-800" : "bg-violet-50 text-violet-700"}`} onClick={() => setActiveChannel("global")} type="button">
                Tribu Globale
                <span className={`block text-xs mt-1 ${isConnected ? "text-green-600" : "text-red-500"}`}>
                  {isConnected ? "Connecté" : "Déconnecté"}
                </span>
              </button>
              <p className="pt-2 text-xs font-bold uppercase text-slate-500">Discussions amis</p>
              {social.friends.map((friend) => (
                <button key={`dm-${friend}`} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${activeChannel === friend ? "bg-slate-200 text-slate-900" : "bg-slate-100 text-slate-700"}`} onClick={() => setActiveChannel(friend)} type="button">
                  💬 {friend}
                </button>
              ))}
            </div>
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  <span className="mr-2 rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-700">
                    {activeChannel === "global" ? "🌍 Global" : `💬 ${activeChannel}`}
                  </span>
                  {pinnedMessages.length > 0 ? `📌 ${pinnedMessages[0]}` : "Aucun message épinglé"}
                </div>
                <button onClick={exportDiscussion} className="text-xs font-bold bg-slate-100 px-2 py-1 rounded">Exporter</button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
                {displayedMessages.length === 0 ? (
                  <div className="text-center text-slate-400 mt-20 flex flex-col items-center"><MessageSquare className="w-12 h-12 mb-3 text-slate-300" />Commence la discussion.</div>
                ) : (
                  displayedMessages.map((m) => (
                    <div key={m.id} className={`max-w-[80%] ${m.author === "Moi" ? "ml-auto" : ""}`}>
                      {m.parentId && <p className="mb-1 text-[11px] text-slate-500">↪ réponse</p>}
                      <button onClick={() => pinMessage(m.text)} className={`block w-full p-3 rounded-xl text-left ${m.author === "Moi" ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>{m.author}: {m.text}</button>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <button className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs" onClick={() => setReplyTo(m)} type="button"><Reply className="inline h-3 w-3" /> Répondre</button>
                        <button className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs" onClick={() => setReportModalFor(m)} type="button"><Flag className="inline h-3 w-3" /> Signaler</button>
                        {REACTIONS.map((emoji) => (
                          <button key={`${m.id}-${emoji}`} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs" onClick={() => reactToMessage(m.id, emoji)} type="button">{emoji} {reactionCount(m, emoji)}</button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2">
                {replyTo && <p className="text-xs text-slate-500">Réponse à: {replyTo.text}</p>}
                <div className="flex gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Écrire un message..." className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl" />
                  <button onClick={handleSend} className="bg-violet-600 text-white font-bold px-6 py-3 rounded-xl">Envoyer</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
        <p className="font-black text-slate-800 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-rose-500" /> Modération active</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
          <li>Filtre temps réel: insultes, spam répétitif, contenus inappropriés et partage de données personnelles.</li>
          <li>Messages bloqués remplacés par « Message filtré » + avertissement privé automatique.</li>
          <li>Sanctions progressives: avertissement → mute 24h → ban 7 jours → ban permanent.</li>
        </ul>
      </div>

      {canModerate && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-black text-amber-900 flex items-center gap-2"><Gavel className="h-4 w-4" /> Tableau de modération communautaire</p>
          <p className="mt-1 text-xs text-amber-800">Signalements en attente: {moderation.reports.filter((item) => item.status === "open").length}</p>
          <div className="mt-3 space-y-2">
            {moderation.reports.filter((item) => item.status === "open").slice(0, 20).map((report) => (
              <div key={report.id} className="rounded-xl border border-amber-200 bg-white p-3 text-xs">
                <p className="font-bold text-slate-800">{report.reason} • {report.reportedUser} • {new Date(report.createdAt).toLocaleString("fr-FR")}</p>
                <p className="text-slate-600">Canal: {report.channel} • Commentaire: {report.comment ?? "—"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="rounded-lg bg-rose-600 px-2 py-1 font-bold text-white" onClick={() => moderateReport(report.id, "delete")} type="button"><Trash2 className="mr-1 inline h-3 w-3" /> Supprimer</button>
                  <button className="rounded-lg bg-slate-700 px-2 py-1 font-bold text-white" onClick={() => moderateReport(report.id, "mute1h")} type="button"><VolumeX className="mr-1 inline h-3 w-3" /> Mute 1h</button>
                  <button className="rounded-lg bg-slate-900 px-2 py-1 font-bold text-white" onClick={() => moderateReport(report.id, "mute24h")} type="button"><VolumeX className="mr-1 inline h-3 w-3" /> Mute 24h</button>
                  <button className="rounded-lg bg-amber-500 px-2 py-1 font-bold text-white" onClick={() => moderateReport(report.id, "escalate")} type="button">Escalader admin</button>
                </div>
              </div>
            ))}
            {moderation.reports.filter((item) => item.status === "open").length === 0 && <p className="text-xs text-amber-800">Aucun signalement en attente.</p>}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <p className="font-black text-slate-800">Top parrains du mois</p>
        <div className="mt-2 space-y-1 text-sm">
          {monthlyReferralBoard.slice(0, 10).map((entry, index) => (
            <div key={`ref-rank-${entry.userId}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>#{index + 1} {entry.pseudo}</span>
              <span className="font-bold text-violet-700">{entry.activeReferrals}</span>
            </div>
          ))}
          {monthlyReferralBoard.length === 0 && <p className="text-xs text-slate-500">Aucun parrainage actif sur le mois en cours.</p>}
        </div>
      </div>

      {reportModalFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <p className="text-lg font-black text-slate-800">Signaler un message</p>
            <p className="mt-1 text-xs text-slate-500">Message de {reportModalFor.author}: {reportModalFor.text}</p>
            <div className="mt-3 space-y-2 text-sm">
              {(["Insulte ou harcèlement", "Spam", "Contenu inapproprié", "Tentative d'arnaque", "Autre"] as ReportReason[]).map((reason) => (
                <label key={reason} className="flex items-center gap-2">
                  <input checked={reportReason === reason} name="report-reason" onChange={() => setReportReason(reason)} type="radio" />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            <textarea className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" onChange={(e) => setReportComment(e.target.value)} placeholder="Commentaire optionnel..." rows={3} value={reportComment} />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700" onClick={() => setReportModalFor(null)} type="button">Annuler</button>
              <button className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white" onClick={submitReport} type="button">Envoyer le signalement</button>
            </div>
          </div>
        </div>
      )}
      {selectedFriend && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">Profil de {selectedFriend}</h3>
              <button className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold" onClick={() => setSelectedFriend(null)} type="button">Fermer</button>
            </div>
            <div className="mb-4 flex gap-2">
              <button className={`rounded-lg px-3 py-1 text-xs font-bold ${friendProfileTab === "overview" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`} onClick={() => setFriendProfileTab("overview")} type="button">Aperçu</button>
              <button className={`rounded-lg px-3 py-1 text-xs font-bold ${friendProfileTab === "history" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`} onClick={() => setFriendProfileTab("history")} type="button">Notre historique</button>
            </div>
            {friendProfileTab === "overview" ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Rivalité active: <span className="font-black text-slate-800">{pairHistory.length} duels</span></p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {["Première rivalité", "Rival acharné", "Domination", "Meilleur ennemi"].map((badge) => {
                    const unlocked =
                      (badge === "Première rivalité" && pairHistory.length >= 1) ||
                      (badge === "Rival acharné" && pairHistory.length >= 10) ||
                      (badge === "Meilleur ennemi" && pairHistory.length >= 50) ||
                      (badge === "Domination" && (pairSummary?.bestStreak ?? 0) >= 5);
                    return (
                      <div key={badge} className={`rounded-xl border px-3 py-2 text-xs ${unlocked ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-100 text-slate-500"}`}>
                        <Medal className="mr-1 inline h-4 w-4" /> {badge}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">Victoires: <span className="font-black">{pairSummary?.wins ?? 0}</span></div>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">Défaites: <span className="font-black">{pairSummary?.losses ?? 0}</span></div>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">Égalités: <span className="font-black">{pairSummary?.draws ?? 0}</span></div>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">Winrate: <span className="font-black">{pairSummary?.winRate ?? 0}%</span></div>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">Série max: <span className="font-black">{pairSummary?.bestStreak ?? 0}</span></div>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">Matière dominée: <span className="font-black">{pairSummary?.bestSubject ?? "—"}</span></div>
                </div>
                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="mb-2 text-xs font-bold uppercase text-slate-500">Évolution du bilan</p>
                  <div className="h-20 w-full rounded-lg bg-slate-50 p-2">
                    <svg className="h-full w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="#7c3aed"
                        strokeWidth="1.5"
                        points={pairHistory.slice().reverse().map((entry, idx) => {
                          const delta = entry.winner === "Moi" ? 1 : entry.winner === selectedFriend ? -1 : 0;
                          const cumulative = pairHistory.slice().reverse().slice(0, idx + 1).reduce((sum, row) => sum + (row.winner === "Moi" ? 1 : row.winner === selectedFriend ? -1 : 0), 0);
                          const x = pairHistory.length <= 1 ? 50 : (idx / (pairHistory.length - 1)) * 100;
                          const y = 20 - cumulative * 3;
                          return `${x},${Math.max(2, Math.min(38, y + delta * 0))}`;
                        }).join(" ")}
                      />
                    </svg>
                  </div>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-100 p-3">
                  {pairHistory.map((entry) => (
                    <div key={entry.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                      <p className="font-bold">{new Date(entry.playedAt).toLocaleDateString("fr-FR")} · {entry.subject} · Moi {entry.scoreA} - {entry.scoreB} {selectedFriend}</p>
                      <p>Vainqueur: {entry.winner === "Moi" ? "Moi 🏆" : entry.winner === selectedFriend ? `${selectedFriend} 🏆` : "Égalité"}</p>
                    </div>
                  ))}
                  {pairHistory.length === 0 ? <p className="text-sm text-slate-500">Aucun duel entre vous pour le moment.</p> : null}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
