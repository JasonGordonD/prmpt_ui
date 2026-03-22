export type AgentConfig = {
  id: string;
  displayName: string;
  description: string;
  agentName: string;
  passwordEnvKey: string;
  livekitEnvPrefix: string;
  routeGroup: string;
  theme: {
    background: string;
    surface: string;
    primary: string;
    accent: string;
    text: string;
    textMuted: string;
    border: string;
    auraColor: string;
    auraColorShift: number;
  };
  nodeMap: Record<string, {
    label: string;
    color: string;
    auraColor?: string;
  }>;
};

export const AGENTS: AgentConfig[] = [
  {
    id: 'minka',
    displayName: 'Minka Moor',
    description: 'Voice experience with Minka Moor',
    agentName: 'minka-moor-primary',
    passwordEnvKey: 'AGENT_PASSWORD_MINKA',
    livekitEnvPrefix: 'MINKA',
    routeGroup: 'minka',
    theme: {
      background: '#1a1a2e',
      surface: '#2d1f3d',
      primary: '#c9302c',
      accent: '#d4a853',
      text: '#e8dff5',
      textMuted: '#a090c0',
      border: '#3d2a50',
      auraColor: '#c9302c',
      auraColorShift: 0.2,
    },
    nodeMap: {
      'Qualification': { label: 'Connecting...', color: '#888780' },
      'MM Session': { label: 'Minka Moor', color: '#c9302c', auraColor: '#c9302c' },
      'Rami': { label: 'Private Mode', color: '#185FA5', auraColor: '#185FA5' },
      'Real MM': { label: 'Minka (Personal)', color: '#BA7517', auraColor: '#BA7517' },
      'RMM+R': { label: 'Group Session', color: '#7F77DD', auraColor: '#7F77DD' },
    },
  },
  {
    id: 'coaching',
    displayName: 'Executive Coaching',
    description: 'Premium executive coaching with Ara Thompson',
    agentName: 'exec-coach-primary',
    passwordEnvKey: 'AGENT_PASSWORD_COACHING',
    livekitEnvPrefix: 'COACHING',
    routeGroup: 'coaching',
    theme: {
      background: '#0f1923',
      surface: '#1a2a3a',
      primary: '#2e8b8b',
      accent: '#4a9eca',
      text: '#d8e8f0',
      textMuted: '#7a9ab0',
      border: '#253545',
      auraColor: '#2e8b8b',
      auraColorShift: 0.15,
    },
    nodeMap: {
      'Qualification': { label: 'Intake', color: '#4a9eca' },
      'Standalone': { label: 'Coaching', color: '#2e8b8b' },
      'Dark Jess': { label: 'Shadow Mode', color: '#7b3fa0' },
      'Dark Ara': { label: 'Shadow Coaching', color: '#7b3fa0' },
    },
  },
  {
    id: 'lovebirds',
    displayName: 'Lovebirds',
    description: 'AI couples mediation with Raven Voss',
    agentName: 'LuvByrds',
    passwordEnvKey: 'AGENT_PASSWORD_LOVEBIRDS',
    livekitEnvPrefix: 'LOVEBIRDS',
    routeGroup: 'lovebirds',
    theme: {
      background: '#1c1410',
      surface: '#2a1f18',
      primary: '#c46a3a',
      accent: '#6b5b8d',
      text: '#f0dcc8',
      textMuted: '#b89070',
      border: '#3a2c22',
      auraColor: '#c46a3a',
      auraColorShift: 0.2,
    },
    nodeMap: {
      'Raven (vocal)': { label: 'Raven', color: '#c46a3a' },
      'Raven (cognitive cycle)': { label: 'Raven (analyzing)', color: '#d4a050' },
      'Tijoux (closing)': { label: 'Dr. Tijoux', color: '#6b5b8d', auraColor: '#6b5b8d' },
    },
  },
  {
    id: 'jrvs',
    displayName: 'JRVS',
    description: 'Flagship voice agent',
    agentName: 'JRVS',
    passwordEnvKey: 'AGENT_PASSWORD_JRVS',
    livekitEnvPrefix: 'JRVS',
    routeGroup: 'jrvs',
    theme: {
      background: '#0a0f1a',
      surface: '#131b2e',
      primary: '#3b82f6',
      accent: '#60a5fa',
      text: '#e2e8f0',
      textMuted: '#64748b',
      border: '#1e293b',
      auraColor: '#3b82f6',
      auraColorShift: 0.15,
    },
    nodeMap: {},
  },
  {
    id: 'pack',
    displayName: 'The Pack',
    description: 'Multi-agent voice experience',
    agentName: 'the-pack',
    passwordEnvKey: 'AGENT_PASSWORD_PACK',
    livekitEnvPrefix: 'PACK',
    routeGroup: 'pack',
    theme: {
      background: '#0f0f0f',
      surface: '#1c1c1c',
      primary: '#a855f7',
      accent: '#c084fc',
      text: '#f0e6ff',
      textMuted: '#8b7aac',
      border: '#2d2640',
      auraColor: '#a855f7',
      auraColorShift: 0.25,
    },
    nodeMap: {},
  },
  {
    id: 'tijoux',
    displayName: 'Dr. Tijoux',
    description: 'Clinical excavation with Dr. Annette Tijoux',
    agentName: 'dr-tijoux',
    passwordEnvKey: 'AGENT_PASSWORD_TIJOUX',
    livekitEnvPrefix: 'TIJOUX',
    routeGroup: 'tijoux',
    theme: {
      background: '#0f0f17',
      surface: '#1a1a28',
      primary: '#6b5b8d',
      accent: '#8b7aac',
      text: '#e8e0f0',
      textMuted: '#8878a0',
      border: '#2d2640',
      auraColor: '#6b5b8d',
      auraColorShift: 0.18,
    },
    nodeMap: {},
  },
];

export function getAgentById(id: string): AgentConfig | undefined {
  return AGENTS.find((a) => a.id === id);
}
