export interface ClinicalCase {
  id: string;
  backendId?: string;
  reference: string;
  name: string;
  subject: string;
  status: 'stable' | 'volatile' | 'passive';
  complexity: number;
  location: string;
  summary: string;
  objectives: string[];
  warning?: string;
}

export interface Decision {
  id: string;
  style: string;
  title: string;
  body: string;
  tone: 'cyan' | 'green' | 'amber';
  xp: number;
  feedback: string;
}

export interface Scenario {
  id: string;
  label: string;
  location: string;
  title: string;
  body: string;
  stress: number;
  volatility: string;
  next: string;
  decisions: Decision[];
}

export interface Reflection {
  analysis: string;
  improvement: string;
  cognitiveLoad: number;
  tags: string[];
}
