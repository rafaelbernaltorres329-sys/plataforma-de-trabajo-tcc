import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket, ChatMessage, TypingUser } from "@/hooks/use-socket";
import  useWorkspaceId  from "@/hooks/use-workspace-id";
import axios from "axios";

// ─── Tipos locales ─────────────────────────────────────────────────────────────

interface WorkspaceChatProps {
  currentUserId: string;
  currentUserName: string;
  token: string;
  projectId?: string; // opcional: chat de proyecto específico
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AVATAR_COLORS = [
  "bg-blue-500","bg-emerald-500","bg-violet-500",
  "bg-rose-500","bg-amber-500","bg-cyan-500",
];

const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Componente Avatar ─────────────────────────────────────────────────────────

const Avatar = ({ name, imageUrl, size = "md" }: { name: string; imageUrl?: string; size?: "sm" | "md" }) => {
  const sz = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";
  if (imageUrl) return <img src={imageUrl} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${avatarColor(name)}`}>
      {getInitials(name)}
    </div>
  );
};

// ─── Componente MessageBubble ──────────────────────────────────────────────────

const MessageBubble = ({
  message,
  isOwn,
  showAvatar,
}: {
  message: ChatMessage & { isPending?: boolean };
  isOwn: boolean;
  showAvatar: boolean;
}) => {
  const name = message.senderId?.name || "Usuario";

  return (
    <div className={`flex items-end gap-2 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="w-8 flex-shrink-0">
        {showAvatar && !isOwn && (
          <Avatar name={name} imageUrl={message.senderId?.imageUrl} />
        )}
      </div>

      <div className={`flex flex-col gap-0.5 max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Nombre + hora */}
        {showAvatar && (
          <div className={`flex items-center gap-2 px-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
            <span className="text-xs font-medium text-gray-700">
              {isOwn ? "Tú" : name}
            </span>
            <span className="text-[10px] text-gray-400">
              {message.createdAt ? formatTime(message.createdAt) : ""}
            </span>
          </div>
        )}

        {/* Burbuja */}
        <div
          className={`
            px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words
            ${isOwn
              ? "bg-neutral-900 text-white rounded-br-sm"
              : "bg-gray-100 text-gray-900 rounded-bl-sm"
            }
            ${message.isPending ? "opacity-60" : "opacity-100"}
            transition-opacity
          `}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};

// ─── Componente TypingIndicator ────────────────────────────────────────────────

const TypingIndicator = ({ typers }: { typers: TypingUser[] }) => {
  if (typers.length === 0) return null;

  const names = typers.map((t) => t.username).join(", ");
  const verb = typers.length === 1 ? "está escribiendo" : "están escribiendo";

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 italic">
        {names} {verb}...
      </span>
    </div>
  );
};

// ─── Componente principal WorkspaceChat ───────────────────────────────────────

export const WorkspaceChat = ({
  currentUserId,
  currentUserName,
  token,
  projectId,
}: WorkspaceChatProps) => {
  const workspaceId = useWorkspaceId();

  const [messages, setMessages] = useState<(ChatMessage & { isPending?: boolean })[]>([]);
  const [input, setInput] = useState("");
  const [typers, setTypers] = useState<TypingUser[]>([]);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Cargar historial de mensajes ───────────────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const url = projectId
          ? `/api/messages?workspaceId=${workspaceId}&projectId=${projectId}`
          : `/api/messages?workspaceId=${workspaceId}`;

        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(data.messages || data);
      } catch (err) {
        console.error("Error cargando historial:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (workspaceId && token) fetchHistory();
  }, [workspaceId, projectId, token]);

  // ── Socket ─────────────────────────────────────────────────────────────────
  const { sendMessage, emitTyping, stopTyping } = useSocket({
    token,
    workspaceIds: [workspaceId],
    projectIds: projectId ? [projectId] : [],

    onMessageNew: (msg) => {
      setMessages((prev) => [...prev, msg]);
    },

    onMessageSent: ({ tempId, message }) => {
      // Reemplazar mensaje optimista con el real del servidor
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...message } : m))
      );
    },

    onTypingStart: (user) => {
      if (user.userId === currentUserId) return;
      setTypers((prev) => {
        if (prev.find((t) => t.userId === user.userId)) return prev;
        return [...prev, user];
      });
      // Auto-limpiar después de 3s
      setTimeout(() => {
        setTypers((prev) => prev.filter((t) => t.userId !== user.userId));
      }, 3000);
    },

    onTypingStop: ({ userId }) => {
      setTypers((prev) => prev.filter((t) => t.userId !== userId));
    },

    onUserOnline: ({ userId }) => {
      setOnlineIds((prev) => [...new Set([...prev, userId])]);
    },

    onUserOffline: ({ userId }) => {
      setOnlineIds((prev) => prev.filter((id) => id !== userId));
    },

    onUsersOnline: (ids) => setOnlineIds(ids),
  });

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typers]);

  // ── Enviar mensaje ─────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content) return;

    // Optimistic UI: agregar mensaje local inmediatamente
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: ChatMessage & { isPending: boolean; _id: string } = {
      _id: tempId,
      workspaceId,
      projectId,
      senderId: {
        _id: currentUserId,
        name: currentUserName,
        email: "",
      },
      content,
      createdAt: new Date().toISOString(),
      isPending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");

    sendMessage({ workspaceId, projectId, content });
    stopTyping({ workspaceId, projectId });
    inputRef.current?.focus();
  }, [input, workspaceId, projectId, currentUserId, currentUserName, sendMessage, stopTyping]);

  // ── Manejo de teclado ──────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (e.target.value.trim()) {
      emitTyping({ workspaceId, projectId, username: currentUserName });
    } else {
      stopTyping({ workspaceId, projectId });
    }
  };

  // ── Agrupar mensajes consecutivos ─────────────────────────────────────────
  const isConsecutive = (i: number) => {
    if (i === 0) return false;
    return messages[i].senderId?._id === messages[i - 1].senderId?._id;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">
            {projectId ? "Chat del proyecto" : "Chat general"}
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {messages.length} mensajes
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500">{onlineIds.length} en línea</span>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scroll-smooth">
        {isLoading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="h-9 rounded-2xl bg-gray-200" style={{ width: `${120 + i * 30}px` }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <div className="text-4xl">💬</div>
            <p className="text-sm font-medium">Sin mensajes aún</p>
            <p className="text-xs">¡Sé el primero en escribir!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={msg.senderId?._id === currentUserId}
              showAvatar={!isConsecutive(i)}
            />
          ))
        )}

        <TypingIndicator typers={typers} />
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-200 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje... (Enter para enviar)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none outline-none max-h-32 py-0.5 leading-relaxed"
            style={{ scrollbarWidth: "none" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="
              flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
              bg-neutral-900 text-white
              disabled:opacity-30 disabled:cursor-not-allowed
              hover:bg-neutral-700 active:scale-95
              transition-all duration-150
            "
            title="Enviar (Enter)"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-gray-400 text-center">
          <kbd className="font-mono bg-gray-100 px-1 rounded">Enter</kbd> enviar ·{" "}
          <kbd className="font-mono bg-gray-100 px-1 rounded">Shift+Enter</kbd> nueva línea
        </p>
      </div>
    </div>
  );
};

export default WorkspaceChat;
