"use client";

import React, { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { firestoreService } from "@/lib/firestoreService";

interface FileUploadProps {
  onFileUploaded: (data: any) => void;
}

export default function FileUploadSimple({ onFileUploaded }: FileUploadProps) {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file && topic && user) {
      setIsUploading(true);
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("topic", topic);
        formData.append("user_id", user.uid);

        const response = await fetch("http://localhost:5000/api/upload-material", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        
        if (response.ok) {
          // Save to Firestore
          try {
            await firestoreService.addStudyMaterial(user.uid, {
              title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
              topic: topic,
              content: JSON.stringify(data.chunks || []),
              progress: 0
            });
            console.log('✅ Material saved to Firestore');
          } catch (firestoreError) {
            console.error('Firestore save error:', firestoreError);
            // Continue anyway - backend has the data
          }

          // Pass the response data including chunks to the parent
          onFileUploaded({
            ...data,
            content: { chunks: data.chunks || [] }
          });
        } else {
          alert(`Upload failed: ${data.error}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload file. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-900/50 rounded-lg border border-red-500/20 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic Input */}
          <div>
            <label className="block text-sm font-medium mb-2 text-red-400">
              What topic do you want to learn?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Machine Learning, React Hooks, Data Structures..."
              className="w-full px-4 py-3 bg-gray-900 border border-red-500/30 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-400 transition-colors"
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2 text-red-400">
              Select File
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.bmp"
                className="w-full px-4 py-3 bg-gray-900 border border-red-500/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 transition-colors"
                required
              />
            </div>
            
            {/* File Info */}
            {file && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-green-400">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            type="submit"
            disabled={!file || !topic || isUploading}
            className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-all flex items-center justify-center space-x-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Start Learning Journey</span>
              </>
            )}
          </button>
        </form>

        {/* Supported File Types */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h4 className="font-medium mb-2 text-red-400 text-sm">Supported File Types:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>• PDF documents</div>
            <div>• Word documents (.doc, .docx)</div>
            <div>• PowerPoint (.ppt, .pptx)</div>
            <div>• Images (PNG, JPG, etc.)</div>
          </div>
        </div>
      </div>
    </div>
  );
}