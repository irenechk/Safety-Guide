export interface SafetyAdvice {
  tips: string[];
  avoid: string[];
  steps: string[];
  emergencyGuide: string[];
  reminders: string[];
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SafePlace {
  title: string;
  uri: string;
  phoneNumber?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING_ADVICE = 'LOADING_ADVICE',
  SHOWING_ADVICE = 'SHOWING_ADVICE',
  LOADING_SAFE_PLACES = 'LOADING_SAFE_PLACES',
  SHOWING_SAFE_PLACES = 'SHOWING_SAFE_PLACES',
}