"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Handshake, Users, Trophy, UserPlus } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import { toast } from "sonner";

const SOCIAL_STORAGE_KEY = "mai.quizzly.social.v1";

type SocialState = {
  blockedUsers: string[];
  friendRequests: string[];
  friends: string[];
  reportedUsers: string[];
};
const REACTIONS = ["👍", "🔥", "😂", "🧠", "⭐", "💀"] as const;

export default function QuizzlySocialPage() {
  const [activeTab, setActiveTab] = useState<"friends" | "chat">("friends");
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [friendInput, setFriendInput] = useState("");
  const [social, setSocial] = useState<SocialState>({
    blockedUsers: [],
    friends: [],
    friendRequests: ["Leo92", "NinaMath"],
    reportedUsers: [],
  });
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const [reactionsByMessage, setReactionsByMessage] = useState<Record<string, Record<string, number>>>({});

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
    window.localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(social));
  }, [social]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.emit("join-room", "quizzly-global");
    const listener = (msg: { text?: string }) => {
      if (!msg?.text) return;
      setMessages((prev) => [...prev, `Ami: ${msg.text}`]);
    };
    socket.on("receive-message", listener);

    return () => {
      socket.off("receive-message", listener);
    };
  }, [socket]);

  const handleSend = () => {
    if (!input.trim() || !socket) return;
    socket.emit("send-message", { roomId: "quizzly-global", text: input });
    setMessages((prev) => [...prev, `Moi: ${input}`]);
    setInput("");
  };

  const pinMessage = (message: string) => {
    if (pinnedMessages.includes(message)) return;
    setPinnedMessages((prev) => [message, ...prev].slice(0, 5));
    toast.success("Message épinglé.");
  };

  const exportDiscussion = () => {
    const content = messages.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quizzly-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Discussion exportée.");
  };

  const reactToMessage = (message: string, emoji: string) => {
    setReactionsByMessage((prev) => {
      const current = prev[message] ?? {};
      return {
        ...prev,
        [message]: {
          ...current,
          [emoji]: (current[emoji] ?? 0) + 1,
        },
      };
    });
  };

  const blockFriend = (pseudo: string) => {
    setSocial((prev) => ({
      ...prev,
      blockedUsers: Array.from(new Set([pseudo, ...prev.blockedUsers])),
      friends: prev.friends.filter((friend) => friend !== pseudo),
    }));
    toast.success(`${pseudo} a été bloqué.`);
  };

  const reportFriend = (pseudo: string) => {
    setSocial((prev) => ({
      ...prev,
      reportedUsers: Array.from(new Set([pseudo, ...prev.reportedUsers])),
    }));
    toast.success(`Signalement envoyé pour ${pseudo}.`);
  };

  const addFriend = () => {
    const pseudo = friendInput.trim();
    if (!pseudo) return;
    if (social.friends.includes(pseudo)) {
      toast.error("Cet ami est déjà ajouté.");
      return;
    }
    setSocial((prev) => ({ ...prev, friends: [pseudo, ...prev.friends] }));
    setFriendInput("");
    toast.success("Ami ajouté !");
  };

  const acceptRequest = (pseudo: string) => {
    setSocial((prev) => ({
      ...prev,
      friendRequests: prev.friendRequests.filter((item) => item !== pseudo),
      friends: [pseudo, ...prev.friends],
    }));
    toast.success(`${pseudo} rejoint tes amis.`);
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
                  <button onClick={addFriend} className="bg-violet-600 text-white font-bold px-4 py-2 rounded-xl">Ajouter</button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="font-black text-slate-800 flex items-center gap-2"><Handshake className="w-4 h-4 text-amber-500" /> Demandes reçues</p>
                <div className="mt-3 space-y-2">
                  {social.friendRequests.length === 0 && <p className="text-sm text-slate-500">Aucune demande.</p>}
                  {social.friendRequests.map((pseudo) => (
                    <div key={pseudo} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                      <span>{pseudo}</span>
                      <button onClick={() => acceptRequest(pseudo)} className="text-xs font-bold bg-emerald-500 text-white px-2 py-1 rounded">Accepter</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="font-black text-slate-800 flex items-center gap-2"><Users className="w-4 h-4 text-violet-600" /> Mes amis ({social.friends.length})</p>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {social.friends.length === 0 && <p className="text-sm text-slate-500">Tu n'as pas encore d'amis.</p>}
                {social.friends.map((friend) => (
                  <div key={friend} className="bg-violet-50 text-violet-700 px-3 py-2 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span>{friend}</span>
                      <Trophy className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => blockFriend(friend)} className="text-[10px] font-bold bg-slate-800 text-white px-2 py-1 rounded">Bloquer</button>
                      <button onClick={() => reportFriend(friend)} className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded">Signaler</button>
                    </div>
                  </div>
                ))}
              </div>
              {social.blockedUsers.length > 0 && (
                <p className="text-xs text-slate-500 mt-3">Bloqués: {social.blockedUsers.join(", ")}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/3 border-r border-slate-100 p-4">
              <div className="bg-violet-50 text-violet-700 font-bold p-4 rounded-xl">
                Tribu Globale
                <span className={`block text-xs mt-1 ${isConnected ? "text-green-600" : "text-red-500"}`}>
                  {isConnected ? "Connecté" : "Déconnecté"}
                </span>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  {pinnedMessages.length > 0 ? `📌 ${pinnedMessages[0]}` : "Aucun message épinglé"}
                </div>
                <button onClick={exportDiscussion} className="text-xs font-bold bg-slate-100 px-2 py-1 rounded">
                  Exporter
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400 mt-20 flex flex-col items-center"><MessageSquare className="w-12 h-12 mb-3 text-slate-300" />Commence la discussion.</div>
                ) : (
                  messages.map((m, i) => (
                    <div key={`${m}-${i}`} className={`max-w-[75%] ${m.startsWith("Moi") ? "ml-auto" : ""}`}>
                      <button
                        onClick={() => pinMessage(m)}
                        className={`block w-full p-3 rounded-xl text-left ${m.startsWith("Moi") ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-700"}`}
                      >
                        {m}
                      </button>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {REACTIONS.map((emoji) => (
                          <button
                            key={`${m}-${emoji}`}
                            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs"
                            onClick={() => reactToMessage(m, emoji)}
                            type="button"
                          >
                            {emoji} {reactionsByMessage[m]?.[emoji] ?? 0}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Écrire un message..." className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl" />
                <button onClick={handleSend} className="bg-violet-600 text-white font-bold px-6 py-3 rounded-xl">Envoyer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
