import mongoose,{ Document,Schema,model,models } from 'mongoose';

export interface IStream extends Document {
    streamerId: mongoose.Schema.Types.ObjectId;
    title: string;
    category: string;
    agoraChannel: string;
    isLive: boolean;
    peakViewers?: number;
    blockedUsers: mongoose.Schema.Types.ObjectId[];
    thumbnailUrl?: string;
}

const streamSchema = new Schema<IStream>({
    streamerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    agoraChannel: {
      type: String,
      required: true,
      index: true 
    },
    isLive: {
      type: Boolean,
      default: false,
      index: true
    },
    peakViewers: {
      type: Number,
      default: 0
    },
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
},{timestamps: true});

export const Stream = models.Stream || model<IStream>("Stream",streamSchema);
