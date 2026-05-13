import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMessagesFn, sendMessageFn } from "@/lib/api";
import { socket } from "@/lib/socket"; // tu conexión socket
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  otherUserId: string;
}

export default function TaskMessagesDialog({
  isOpen,
  onClose,
  workspaceId,
  otherUserId,
}: Props) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  // 🔹 Obtener mensajes iniciales
  const { data } = useQuery({
    queryKey: ["messages", workspaceId, otherUserId],
    queryFn: () => getMessagesFn(workspaceId, otherUserId),
    enabled: isOpen,
  });

  useEffect(() => {
    if (data?.data) {
      setMessages(data.data);
    }
  }, [data]);

  useEffect(() => {
  type MessageSocket = {
    message: string;
    data: {
      content: string;
    };
  };

  const handleMessage = (msg: MessageSocket) => {
    setMessages((prev) => [...prev, msg.data]);
  };

  socket.on("new-message", handleMessage);

  return () => {
    socket.off("new-message", handleMessage);
  };
}, []);

  // 🔹 Enviar mensaje
  const handleSend = async () => {
    if (!message.trim()) return;

    const res = await sendMessageFn({
      workspaceId,
      receiverId: otherUserId,
      content: message,
    });

    setMessages((prev) => [...prev, res.data]);
    setMessage("");
  };

 return (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-md p-0 bg-[#161b22] border border-[#30363d]">

      {/* 🔹 HEADER */}
      <DialogHeader className="px-4 py-2 border-b border-[#30363d] bg-[#21262d]">
        <DialogTitle className="text-sm text-[#58a6ff]">
          💬 Chat de la tarea
        </DialogTitle>
      </DialogHeader>

      {/* 🔹 MENSAJES */}
      <div className="h-72 overflow-y-auto p-3 bg-[#0d1117] space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="text-sm text-[#c9d1d9] bg-[#21262d] px-3 py-2 rounded w-fit max-w-[80%]"
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* 🔹 INPUT */}
      <div className="flex gap-2 p-3 border-t border-[#30363d] bg-[#161b22]">
        <input
          className="flex-1 px-3 py-2 text-sm rounded bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:border-[#58a6ff]"
          placeholder="Escribe un mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <button
          onClick={handleSend}
          className="px-4 py-2 text-sm bg-[#238636] hover:opacity-80 rounded text-white"
        >
          Enviar
        </button>
      </div>
    </DialogContent>
  </Dialog>
);
}