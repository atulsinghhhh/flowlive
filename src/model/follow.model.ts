
import mongoose, { Schema, models, model, Document } from "mongoose";

export interface IFollow extends Document {
    followerId: mongoose.Schema.Types.ObjectId;
    followingId: mongoose.Schema.Types.ObjectId;
}

const followSchema = new Schema<IFollow>({
    followerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    followingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    }
}, { timestamps: true });

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export const Follow = models.Follow || model<IFollow>("Follow", followSchema);
