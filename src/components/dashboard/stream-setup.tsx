
"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface StreamSetupProps {
  initialTitle?: string;
  initialCategory?: string;
  onSave?: (title: string, category: string, thumbnailUrl?: string) => void;
  isLive?: boolean;
}

export const StreamSetup = ({ initialTitle = "", initialCategory = "Just Chatting", onSave, isLive = false }: StreamSetupProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState(initialCategory);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleTitleChange = (val: string) => {
      setTitle(val);
      if (onSave) onSave(val, category, thumbnailUrl);
  };

  const handleCategoryChange = (val: string) => {
      setCategory(val);
      if (onSave) onSave(title, val, thumbnailUrl);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
          const signRes = await fetch("/api/upload/signature", { method: "POST" });
          const signData = await signRes.json();
          
          if (!signData.signature) throw new Error("Failed to get signature");

          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("api_key", signData.apiKey);
          uploadData.append("timestamp", signData.timestamp.toString());
          uploadData.append("signature", signData.signature);
          uploadData.append("folder", "twitch-clone");

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
              method: "POST",
              body: uploadData
          });
          const result = await uploadRes.json();

          if (result.secure_url) {
              setThumbnailUrl(result.secure_url);
              if (onSave) onSave(title, category, result.secure_url);
          }
      } catch (error) {
          console.error("Thumbnail upload failed", error);
      } finally {
          setUploading(false);
      }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <h2 className="text-xl font-bold text-foreground mb-6">Stream Info</h2>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Enter a catchy title for your stream..."
            className="w-full bg-muted border border-border rounded-lg p-3 text-foreground focus:outline-none focus:border-primary transition-colors"
            disabled={isLive} 
          />
          <p className="text-xs text-muted-foreground">Catchy titles attract more viewers!</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Category</label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full bg-muted border border-border rounded-lg p-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
          >
            <option>Just Chatting</option>
            <option>Gaming</option>
            <option>Coding</option>
            <option>Music</option>
            <option>IRL</option>
            <option>Creative</option>
            <option>Other</option>
          </select>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Thumbnail</label>
            <div className={`border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors ${thumbnailUrl ? 'border-solid border-primary' : ''}`}>
                {thumbnailUrl ? (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden group">
                        <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <p className="text-white text-xs font-bold">Click to Change</p>
                        </div>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleThumbnailUpload} />
                    </div>
                ) : (
                    <div className="relative w-full text-center">
                        <div className="text-muted-foreground mb-2">
                            {uploading ? "Uploading..." : "Upload Stream Thumbnail"}
                        </div>
                        <p className="text-xs text-muted-foreground/50">16:9 recommended</p>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleThumbnailUpload} />
                    </div>
                )}
            </div>
        </div>
        
        {/* Visual feedback for unsaved changes could go here if we were doing manual save */}
      </div>
    </motion.div>
  );
};
