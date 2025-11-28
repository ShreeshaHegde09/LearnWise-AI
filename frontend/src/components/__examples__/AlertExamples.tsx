"use client";

import { useState } from "react";
import EmotionAlert from "../EmotionAlert";
import VisibilityAlert from "../VisibilityAlert";

/**
 * Example usage of EmotionAlert and VisibilityAlert components
 * This file demonstrates how to use the alert components
 */
export default function AlertExamples() {
  const [showTier1, setShowTier1] = useState(false);
  const [showTier2, setShowTier2] = useState(false);
  const [showNoFace, setShowNoFace] = useState(false);
  const [showPoorLighting, setShowPoorLighting] = useState(false);
  const [showNoEyes, setShowNoEyes] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Alert Components Examples
        </h1>

        {/* Emotion Alerts Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Emotion Alerts (Interventions)
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-2">
                Tier 1: Persistent Confusion/Boredom
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Triggered after 1-3 minutes of confused or bored state
              </p>
              <button
                onClick={() => setShowTier1(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white"
              >
                Show Tier 1 Alert
              </button>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-2">
                Tier 2: Prolonged Disengagement
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Triggered after 5+ minutes of disengagement
              </p>
              <button
                onClick={() => setShowTier2(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
              >
                Show Tier 2 Alert
              </button>
            </div>
          </div>
        </section>

        {/* Visibility Alerts Section */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Visibility Alerts (Technical Issues)
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-2">
                No Face Detected
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Shown when MediaPipe fails to detect face for 3+ frames
              </p>
              <button
                onClick={() => setShowNoFace(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                Show No Face Alert
              </button>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-2">
                Poor Lighting
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Shown when detection confidence is below 0.3
              </p>
              <button
                onClick={() => setShowPoorLighting(true)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white"
              >
                Show Poor Lighting Alert
              </button>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-2">
                Eyes Not Visible
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Shown when key eye landmarks are not detected
              </p>
              <button
                onClick={() => setShowNoEyes(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
              >
                Show No Eyes Alert
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Alert Components */}
      {showTier1 && (
        <EmotionAlert
          tier={1}
          message="Seems tough — shall I simplify this?"
          emotion="Confused"
          confidence={0.75}
          onSimplify={() => {
            console.log("Simplify action triggered");
            setShowTier1(false);
          }}
          onDismiss={() => setShowTier1(false)}
        />
      )}

      {showTier2 && (
        <EmotionAlert
          tier={2}
          message="You've been disengaged for a while — would you like a short break?"
          emotion="Tired"
          confidence={0.82}
          onBreak={() => {
            console.log("Break action triggered");
            setShowTier2(false);
          }}
          onDismiss={() => setShowTier2(false)}
        />
      )}

      {showNoFace && (
        <VisibilityAlert
          issueType="no_face"
          message="Face not visible — please adjust camera position"
          consecutiveFrames={5}
          onDismiss={() => setShowNoFace(false)}
          autoResolve={true}
        />
      )}

      {showPoorLighting && (
        <VisibilityAlert
          issueType="poor_lighting"
          message="Poor lighting detected — please improve lighting for better accuracy"
          consecutiveFrames={4}
          onDismiss={() => setShowPoorLighting(false)}
          autoResolve={true}
        />
      )}

      {showNoEyes && (
        <VisibilityAlert
          issueType="eyes_not_visible"
          message="Eyes not visible — please ensure your face is fully visible"
          consecutiveFrames={3}
          onDismiss={() => setShowNoEyes(false)}
          autoResolve={true}
        />
      )}
    </div>
  );
}
