export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface TranscriptionResponse {
  originalText?: string;
  burmeseText: string;
}

export interface AudioRecording {
  blob: Blob;
  url: string;
}
