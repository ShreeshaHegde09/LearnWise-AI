"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2 } from "lucide-react";
import axios from "axios";

interface FileUploadProps {
  onFileUploaded: (data: any) => void;
}

export default function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [topic, setTopic] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [],
      "application/vnd.ms-powerpoint": [],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [],
      "image/png": [],
      "image/jpeg": [],
      "image/gif": [],
      "image/bmp": [],
    },
    multiple: false,
  } as any);

  const handleUpload = async () => {
    if (!uploadedFile || !topic.trim()) {
      alert("Please select a file and enter a topic");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("topic", topic);
      formData.append("user_id", "1"); // Default user for now

      const response = await axios.post(
        "http://localhost:5000/api/upload-material",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      onFileUploaded(response.data);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Topic Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-red-400">
          What topic do you want to learn?
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTopic(e.target.value)
          }
          placeholder="e.g., Machine Learning, React Hooks, Data Structures..."
          className="w-full px-4 py-3 bg-gray-900 border border-red-500/30 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-400"
        />
      </div>

      {/* File Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-red-500 bg-red-500/10"
            : uploadedFile
            ? "border-green-500 bg-green-500/10"
            : "border-red-500/30 bg-gray-900/50 hover:border-red-500/50"
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          {uploadedFile ? (
            <>
              <FileText className="h-16 w-16 text-green-500" />
              <div>
                <p className="text-lg font-medium text-green-400">
                  File Selected
                </p>
                <p className="text-gray-400">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-16 w-16 text-red-500" />
              <div>
                <p className="text-lg font-medium">
                  {isDragActive
                    ? "Drop your file here"
                    : "Upload your learning material"}
                </p>
                <p className="text-gray-400 mt-2">
                  Drag & drop or click to select
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports PDF, DOC, DOCX, PPT, PPTX, and images
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Upload Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleUpload}
        disabled={!uploadedFile || !topic.trim() || isUploading}
        className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-all flex items-center justify-center space-x-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            <span>Start Learning Journey</span>
          </>
        )}
      </motion.button>

      {/* File Type Info */}
      <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-red-500/20">
        <h4 className="font-medium mb-2 text-red-400">Supported File Types:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
          <div>• PDF documents</div>
          <div>• Word documents (.doc, .docx)</div>
          <div>• PowerPoint (.ppt, .pptx)</div>
          <div>• Images (PNG, JPG, etc.)</div>
        </div>
      </div>
    </div>
  );
}
