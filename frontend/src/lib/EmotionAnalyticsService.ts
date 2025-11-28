/**
 * EmotionAnalyticsService
 * Manages emotion prediction storage, metrics tracking, and analytics
 * Implements Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { EmotionPrediction, EmotionClass, EmotionProbabilities } from '../config/emotionModels';

// ============================================================================
// Type Definitions (Requirement 8.1, 8.2)
// ============================================================================

/**
 * EmotionPredictionRecord - Extended prediction with session context
 */
export interface EmotionPredictionRecord {
  id: string;
  sessionId: string;
  chunkId: number;
  timestamp: number;
  emotion: EmotionClass;
  probabilities: EmotionProbabilities;
  confidence: number;
  source: 'local' | 'cloud';
  faceDetected: boolean;
  detectionConfidence: number;
}

/**
 * InterventionLog - Records intervention events
 */
export interface InterventionLog {
  id: string;
  sessionId: string;
  timestamp: number;
  tier: 1 | 2;
  emotion: EmotionClass;
  message: string;
  reason: string;
  accepted: boolean;
  dismissed: boolean;
}

/**
 * VisibilityIssueLog - Records visibility problems
 */
export interface VisibilityIssueLog {
  id: string;
  sessionId: string;
  timestamp: number;
  type: 'no_face' | 'poor_lighting' | 'eyes_not_visible';
  message: string;
  severity: 'warning' | 'error';
  consecutiveFrames: number;
  resolved: boolean;
  resolvedAt?: number;
}

/**
 * EmotionSessionMetrics - Aggregated session-level metrics
 */
export interface EmotionSessionMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalPredictions: number;
  emotionDistribution: {
    Focused: number;
    Confused: number;
    Bored: number;
    Tired: number;
  };
  averageConfidence: number;
  tier1Interventions: number;
  tier2Interventions: number;
  interventionsAccepted: number;
  interventionsDismissed: number;
  visibilityIssues: number;
  cloudRecalibrations: number;
  averageProcessingTime: number;
  totalDuration: number;
}

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  PREDICTIONS: 'emotion_predictions',
  INTERVENTIONS: 'emotion_interventions',
  VISIBILITY_ISSUES: 'emotion_visibility_issues',
  SESSION_METRICS: 'emotion_session_metrics',
  LAST_CLEANUP: 'emotion_last_cleanup'
} as const;

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Maximum age of records to keep (7 days)
  MAX_RECORD_AGE_MS: 7 * 24 * 60 * 60 * 1000,
  
  // Cleanup interval (24 hours)
  CLEANUP_INTERVAL_MS: 24 * 60 * 60 * 1000,
  
  // Maximum records per session
  MAX_PREDICTIONS_PER_SESSION: 1000,
  
  // Analytics send interval (5 minutes)
  ANALYTICS_SEND_INTERVAL_MS: 5 * 60 * 1000
} as const;

// ============================================================================
// EmotionAnalyticsService Class
// ============================================================================

export class EmotionAnalyticsService {
  private static instance: EmotionAnalyticsService;
  
  private currentSessionId: string | null = null;
  private sessionStartTime: number = 0;
  private processingTimes: number[] = [];
  private analyticsSendTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Check if cleanup is needed on initialization
    this.checkAndPerformCleanup();
  }

  static getInstance(): EmotionAnalyticsService {
    if (!EmotionAnalyticsService.instance) {
      EmotionAnalyticsService.instance = new EmotionAnalyticsService();
    }
    return EmotionAnalyticsService.instance;
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Start a new emotion tracking session
   */
  startSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.sessionStartTime = Date.now();
    this.processingTimes = [];
    
    // Initialize session metrics
    const metrics: EmotionSessionMetrics = {
      sessionId,
      startTime: this.sessionStartTime,
      totalPredictions: 0,
      emotionDistribution: {
        Focused: 0,
        Confused: 0,
        Bored: 0,
        Tired: 0
      },
      averageConfidence: 0,
      tier1Interventions: 0,
      tier2Interventions: 0,
      interventionsAccepted: 0,
      interventionsDismissed: 0,
      visibilityIssues: 0,
      cloudRecalibrations: 0,
      averageProcessingTime: 0,
      totalDuration: 0
    };
    
    this.saveSessionMetrics(metrics);
    
    // Start periodic analytics sending
    this.startAnalyticsSending();
    
    console.log(`EmotionAnalyticsService: Session ${sessionId} started`);
  }

  /**
   * End the current emotion tracking session
   */
  endSession(): void {
    if (!this.currentSessionId) {
      return;
    }
    
    // Update session metrics with end time
    const metrics = this.getSessionMetrics(this.currentSessionId);
    if (metrics) {
      metrics.endTime = Date.now();
      metrics.totalDuration = metrics.endTime - metrics.startTime;
      this.saveSessionMetrics(metrics);
    }
    
    // Send final analytics
    this.sendAnalyticsToBackend();
    
    // Stop periodic sending
    this.stopAnalyticsSending();
    
    console.log(`EmotionAnalyticsService: Session ${this.currentSessionId} ended`);
    
    this.currentSessionId = null;
    this.sessionStartTime = 0;
    this.processingTimes = [];
  }

  // ============================================================================
  // Prediction Storage (Subtask 12.1)
  // ============================================================================

  /**
   * Store an emotion prediction record
   */
  storePrediction(
    prediction: EmotionPrediction,
    chunkId: number,
    faceDetected: boolean = true,
    detectionConfidence: number = 1.0,
    processingTime?: number
  ): void {
    if (!this.currentSessionId) {
      console.warn('EmotionAnalyticsService: No active session, prediction not stored');
      return;
    }
    
    // Create prediction record
    const record: EmotionPredictionRecord = {
      id: this.generateId(),
      sessionId: this.currentSessionId,
      chunkId,
      timestamp: prediction.timestamp,
      emotion: prediction.emotion,
      probabilities: prediction.probabilities,
      confidence: prediction.confidence,
      source: prediction.source,
      faceDetected,
      detectionConfidence
    };
    
    // Store in local storage
    const predictions = this.loadPredictions();
    predictions.push(record);
    
    // Limit predictions per session
    const sessionPredictions = predictions.filter(p => p.sessionId === this.currentSessionId);
    if (sessionPredictions.length > CONFIG.MAX_PREDICTIONS_PER_SESSION) {
      // Remove oldest predictions for this session
      const toRemove = sessionPredictions.length - CONFIG.MAX_PREDICTIONS_PER_SESSION;
      const oldestIds = sessionPredictions
        .slice(0, toRemove)
        .map(p => p.id);
      
      const filtered = predictions.filter(p => !oldestIds.includes(p.id));
      this.savePredictions(filtered);
    } else {
      this.savePredictions(predictions);
    }
    
    // Track processing time
    if (processingTime !== undefined) {
      this.processingTimes.push(processingTime);
    }
    
    // Update session metrics
    this.updateSessionMetrics(record);
  }

  /**
   * Get all predictions for a session
   */
  getSessionPredictions(sessionId: string): EmotionPredictionRecord[] {
    const predictions = this.loadPredictions();
    return predictions.filter(p => p.sessionId === sessionId);
  }

  /**
   * Get recent predictions (last N)
   */
  getRecentPredictions(count: number): EmotionPredictionRecord[] {
    const predictions = this.loadPredictions();
    return predictions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  // ============================================================================
  // Intervention Logging
  // ============================================================================

  /**
   * Log an intervention event
   */
  logIntervention(
    tier: 1 | 2,
    emotion: EmotionClass,
    message: string,
    reason: string
  ): string {
    if (!this.currentSessionId) {
      console.warn('EmotionAnalyticsService: No active session, intervention not logged');
      return '';
    }
    
    const log: InterventionLog = {
      id: this.generateId(),
      sessionId: this.currentSessionId,
      timestamp: Date.now(),
      tier,
      emotion,
      message,
      reason,
      accepted: false,
      dismissed: false
    };
    
    const interventions = this.loadInterventions();
    interventions.push(log);
    this.saveInterventions(interventions);
    
    // Update session metrics
    const metrics = this.getSessionMetrics(this.currentSessionId);
    if (metrics) {
      if (tier === 1) {
        metrics.tier1Interventions++;
      } else {
        metrics.tier2Interventions++;
      }
      this.saveSessionMetrics(metrics);
    }
    
    return log.id;
  }

  /**
   * Record intervention response
   */
  recordInterventionResponse(interventionId: string, accepted: boolean): void {
    const interventions = this.loadInterventions();
    const intervention = interventions.find(i => i.id === interventionId);
    
    if (intervention) {
      intervention.accepted = accepted;
      intervention.dismissed = !accepted;
      this.saveInterventions(interventions);
      
      // Update session metrics
      const metrics = this.getSessionMetrics(intervention.sessionId);
      if (metrics) {
        if (accepted) {
          metrics.interventionsAccepted++;
        } else {
          metrics.interventionsDismissed++;
        }
        this.saveSessionMetrics(metrics);
      }
    }
  }

  /**
   * Get all interventions for a session
   */
  getSessionInterventions(sessionId: string): InterventionLog[] {
    const interventions = this.loadInterventions();
    return interventions.filter(i => i.sessionId === sessionId);
  }

  // ============================================================================
  // Visibility Issue Logging
  // ============================================================================

  /**
   * Log a visibility issue
   */
  logVisibilityIssue(
    type: 'no_face' | 'poor_lighting' | 'eyes_not_visible',
    message: string,
    severity: 'warning' | 'error',
    consecutiveFrames: number
  ): string {
    if (!this.currentSessionId) {
      return '';
    }
    
    const log: VisibilityIssueLog = {
      id: this.generateId(),
      sessionId: this.currentSessionId,
      timestamp: Date.now(),
      type,
      message,
      severity,
      consecutiveFrames,
      resolved: false
    };
    
    const issues = this.loadVisibilityIssues();
    issues.push(log);
    this.saveVisibilityIssues(issues);
    
    // Update session metrics
    const metrics = this.getSessionMetrics(this.currentSessionId);
    if (metrics) {
      metrics.visibilityIssues++;
      this.saveSessionMetrics(metrics);
    }
    
    return log.id;
  }

  /**
   * Mark visibility issue as resolved
   */
  resolveVisibilityIssue(issueId: string): void {
    const issues = this.loadVisibilityIssues();
    const issue = issues.find(i => i.id === issueId);
    
    if (issue) {
      issue.resolved = true;
      issue.resolvedAt = Date.now();
      this.saveVisibilityIssues(issues);
    }
  }

  /**
   * Get all visibility issues for a session
   */
  getSessionVisibilityIssues(sessionId: string): VisibilityIssueLog[] {
    const issues = this.loadVisibilityIssues();
    return issues.filter(i => i.sessionId === sessionId);
  }

  // ============================================================================
  // Session Metrics
  // ============================================================================

  /**
   * Get session metrics
   */
  getSessionMetrics(sessionId: string): EmotionSessionMetrics | null {
    const allMetrics = this.loadAllSessionMetrics();
    return allMetrics.find(m => m.sessionId === sessionId) || null;
  }

  /**
   * Update session metrics with new prediction
   */
  private updateSessionMetrics(record: EmotionPredictionRecord): void {
    const metrics = this.getSessionMetrics(record.sessionId);
    if (!metrics) {
      return;
    }
    
    // Update total predictions
    metrics.totalPredictions++;
    
    // Update emotion distribution
    metrics.emotionDistribution[record.emotion]++;
    
    // Update average confidence (running average)
    const prevTotal = metrics.averageConfidence * (metrics.totalPredictions - 1);
    metrics.averageConfidence = (prevTotal + record.confidence) / metrics.totalPredictions;
    
    // Update average processing time
    if (this.processingTimes.length > 0) {
      const sum = this.processingTimes.reduce((a, b) => a + b, 0);
      metrics.averageProcessingTime = sum / this.processingTimes.length;
    }
    
    this.saveSessionMetrics(metrics);
  }

  /**
   * Record cloud recalibration event
   */
  recordCloudRecalibration(): void {
    if (!this.currentSessionId) {
      return;
    }
    
    const metrics = this.getSessionMetrics(this.currentSessionId);
    if (metrics) {
      metrics.cloudRecalibrations++;
      this.saveSessionMetrics(metrics);
    }
  }

  // ============================================================================
  // Analytics Sending (Subtask 12.2)
  // ============================================================================

  /**
   * Start periodic analytics sending
   */
  private startAnalyticsSending(): void {
    this.stopAnalyticsSending(); // Clear any existing timer
    
    this.analyticsSendTimer = setInterval(() => {
      this.sendAnalyticsToBackend();
    }, CONFIG.ANALYTICS_SEND_INTERVAL_MS);
  }

  /**
   * Stop periodic analytics sending
   */
  private stopAnalyticsSending(): void {
    if (this.analyticsSendTimer) {
      clearInterval(this.analyticsSendTimer);
      this.analyticsSendTimer = null;
    }
  }

  /**
   * Send analytics to backend
   */
  async sendAnalyticsToBackend(): Promise<void> {
    if (!this.currentSessionId) {
      return;
    }
    
    try {
      const metrics = this.getSessionMetrics(this.currentSessionId);
      const interventions = this.getSessionInterventions(this.currentSessionId);
      const visibilityIssues = this.getSessionVisibilityIssues(this.currentSessionId);
      
      if (!metrics) {
        return;
      }
      
      const payload = {
        sessionMetrics: metrics,
        interventions: interventions.map(i => ({
          timestamp: i.timestamp,
          tier: i.tier,
          emotion: i.emotion,
          reason: i.reason,
          accepted: i.accepted,
          dismissed: i.dismissed
        })),
        visibilityIssues: visibilityIssues.map(v => ({
          timestamp: v.timestamp,
          type: v.type,
          severity: v.severity,
          consecutiveFrames: v.consecutiveFrames,
          resolved: v.resolved,
          resolutionTime: v.resolvedAt ? v.resolvedAt - v.timestamp : null
        }))
      };
      
      const response = await fetch('http://localhost:5000/api/emotion/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log('EmotionAnalyticsService: Analytics sent successfully');
      } else {
        console.warn('EmotionAnalyticsService: Failed to send analytics:', response.statusText);
      }
    } catch (error) {
      console.error('EmotionAnalyticsService: Error sending analytics:', error);
    }
  }

  // ============================================================================
  // Data Cleanup (Subtask 12.1)
  // ============================================================================

  /**
   * Check if cleanup is needed and perform it
   */
  private checkAndPerformCleanup(): void {
    const lastCleanup = this.getLastCleanupTime();
    const now = Date.now();
    
    if (now - lastCleanup > CONFIG.CLEANUP_INTERVAL_MS) {
      this.performCleanup();
      this.setLastCleanupTime(now);
    }
  }

  /**
   * Perform cleanup of old records
   */
  performCleanup(): void {
    const cutoffTime = Date.now() - CONFIG.MAX_RECORD_AGE_MS;
    
    // Clean predictions
    const predictions = this.loadPredictions();
    const filteredPredictions = predictions.filter(p => p.timestamp > cutoffTime);
    this.savePredictions(filteredPredictions);
    
    // Clean interventions
    const interventions = this.loadInterventions();
    const filteredInterventions = interventions.filter(i => i.timestamp > cutoffTime);
    this.saveInterventions(filteredInterventions);
    
    // Clean visibility issues
    const issues = this.loadVisibilityIssues();
    const filteredIssues = issues.filter(i => i.timestamp > cutoffTime);
    this.saveVisibilityIssues(filteredIssues);
    
    // Clean session metrics
    const metrics = this.loadAllSessionMetrics();
    const filteredMetrics = metrics.filter(m => m.startTime > cutoffTime);
    this.saveAllSessionMetrics(filteredMetrics);
    
    const removed = {
      predictions: predictions.length - filteredPredictions.length,
      interventions: interventions.length - filteredInterventions.length,
      issues: issues.length - filteredIssues.length,
      metrics: metrics.length - filteredMetrics.length
    };
    
    console.log('EmotionAnalyticsService: Cleanup completed', removed);
  }

  /**
   * Clear all data for a specific session
   */
  clearSessionData(sessionId: string): void {
    // Remove predictions
    const predictions = this.loadPredictions();
    const filteredPredictions = predictions.filter(p => p.sessionId !== sessionId);
    this.savePredictions(filteredPredictions);
    
    // Remove interventions
    const interventions = this.loadInterventions();
    const filteredInterventions = interventions.filter(i => i.sessionId !== sessionId);
    this.saveInterventions(filteredInterventions);
    
    // Remove visibility issues
    const issues = this.loadVisibilityIssues();
    const filteredIssues = issues.filter(i => i.sessionId !== sessionId);
    this.saveVisibilityIssues(filteredIssues);
    
    // Remove session metrics
    const metrics = this.loadAllSessionMetrics();
    const filteredMetrics = metrics.filter(m => m.sessionId !== sessionId);
    this.saveAllSessionMetrics(filteredMetrics);
    
    console.log(`EmotionAnalyticsService: Session ${sessionId} data cleared`);
  }

  /**
   * Clear all stored data
   */
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.PREDICTIONS);
    localStorage.removeItem(STORAGE_KEYS.INTERVENTIONS);
    localStorage.removeItem(STORAGE_KEYS.VISIBILITY_ISSUES);
    localStorage.removeItem(STORAGE_KEYS.SESSION_METRICS);
    localStorage.removeItem(STORAGE_KEYS.LAST_CLEANUP);
    
    console.log('EmotionAnalyticsService: All data cleared');
  }

  // ============================================================================
  // Local Storage Helpers
  // ============================================================================

  private loadPredictions(): EmotionPredictionRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.PREDICTIONS);
    return data ? JSON.parse(data) : [];
  }

  private savePredictions(predictions: EmotionPredictionRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(predictions));
  }

  private loadInterventions(): InterventionLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.INTERVENTIONS);
    return data ? JSON.parse(data) : [];
  }

  private saveInterventions(interventions: InterventionLog[]): void {
    localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));
  }

  private loadVisibilityIssues(): VisibilityIssueLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.VISIBILITY_ISSUES);
    return data ? JSON.parse(data) : [];
  }

  private saveVisibilityIssues(issues: VisibilityIssueLog[]): void {
    localStorage.setItem(STORAGE_KEYS.VISIBILITY_ISSUES, JSON.stringify(issues));
  }

  private loadAllSessionMetrics(): EmotionSessionMetrics[] {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION_METRICS);
    return data ? JSON.parse(data) : [];
  }

  private saveAllSessionMetrics(metrics: EmotionSessionMetrics[]): void {
    localStorage.setItem(STORAGE_KEYS.SESSION_METRICS, JSON.stringify(metrics));
  }

  private saveSessionMetrics(metrics: EmotionSessionMetrics): void {
    const allMetrics = this.loadAllSessionMetrics();
    const index = allMetrics.findIndex(m => m.sessionId === metrics.sessionId);
    
    if (index >= 0) {
      allMetrics[index] = metrics;
    } else {
      allMetrics.push(metrics);
    }
    
    this.saveAllSessionMetrics(allMetrics);
  }

  private getLastCleanupTime(): number {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_CLEANUP);
    return data ? parseInt(data, 10) : 0;
  }

  private setLastCleanupTime(time: number): void {
    localStorage.setItem(STORAGE_KEYS.LAST_CLEANUP, time.toString());
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export all data as JSON
   */
  exportData(): string {
    const data = {
      predictions: this.loadPredictions(),
      interventions: this.loadInterventions(),
      visibilityIssues: this.loadVisibilityIssues(),
      sessionMetrics: this.loadAllSessionMetrics(),
      exportedAt: Date.now()
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    predictions: number;
    interventions: number;
    visibilityIssues: number;
    sessions: number;
    totalSize: number;
  } {
    const predictions = this.loadPredictions();
    const interventions = this.loadInterventions();
    const issues = this.loadVisibilityIssues();
    const metrics = this.loadAllSessionMetrics();
    
    // Estimate total size in bytes
    const totalSize = 
      JSON.stringify(predictions).length +
      JSON.stringify(interventions).length +
      JSON.stringify(issues).length +
      JSON.stringify(metrics).length;
    
    return {
      predictions: predictions.length,
      interventions: interventions.length,
      visibilityIssues: issues.length,
      sessions: metrics.length,
      totalSize
    };
  }
}

// Export singleton instance
export const emotionAnalyticsService = EmotionAnalyticsService.getInstance();
