'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-300">Progress</span>
        <span className="text-sm font-medium text-red-400">{Math.round(progress)}%</span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2">
        <motion.div
          className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      
      <div className="mt-2 text-xs text-gray-400">
        {progress === 100 ? 'Completed!' : 'Keep going, you\'re doing great!'}
      </div>
    </div>
  );
}