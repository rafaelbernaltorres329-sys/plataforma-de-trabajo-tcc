import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  workspaceId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId | null;
  senderId: mongoose.Types.ObjectId;
  recipientId?: mongoose.Types.ObjectId; // solo en DMs
  content: string;
  isDirect: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    isDirect: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Índices para consultas eficientes
MessageSchema.index({ workspaceId: 1, projectId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1, recipientId: 1, createdAt: 1 });

export const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);
