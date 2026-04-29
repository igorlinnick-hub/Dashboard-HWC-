// ==========================================
// Global types for the multi-client agency dashboard
// ==========================================

/** Connection status */
export type ConnectorStatus = 'connected' | 'error' | 'loading' | 'disconnected';

/** Connector category */
export type ConnectorCategory = 'finance' | 'ads' | 'analytics' | 'reviews';

/** Auth method */
export type AuthType = 'api_key' | 'oauth' | 'plaid';

/** A field definition for the connect modal */
export interface ConnectorField {
  key: string;
  label: string;
  placeholder: string;
  secret: boolean;
  hint?: string;
  docsUrl?: string;
}

/** Connector definition from registry */
export interface ConnectorDefinition {
  slug: string;
  name: string;
  category: ConnectorCategory;
  authType: AuthType;
  fields: ConnectorField[];
  setupSteps?: string[];
  docsUrl?: string;
}

/** Client (clinic) */
export interface Client {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Per-client connector credentials row */
export interface ConnectorCredential {
  id: string;
  clientId: string;
  connectorSlug: string;
  isConnected: boolean;
  connectedAt: string | null;
}

/** Connector status merged with registry info — used in UI */
export interface ClientConnector {
  definition: ConnectorDefinition;
  isConnected: boolean;
  connectedAt: string | null;
  hasSavedCredentials: boolean;
}

/** Base metric shape */
export interface BaseMetric {
  value: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

/** Typed error codes returned by connector data routes */
export type ConnectorErrorCode =
  | 'INVALID_KEY'
  | 'CONNECTION_TIMEOUT'
  | 'RATE_LIMIT'
  | 'NOT_CONNECTED'
  | 'UNKNOWN';

/** Standard API response */
export interface ApiResponse<T = Record<string, unknown>> {
  status: 'ok' | 'error';
  data: T;
  lastUpdated: string;
  error?: string;
  code?: ConnectorErrorCode;
}

/** Client card summary for agency overview */
export interface ClientSummary {
  client: Client;
  connectedCount: number;
  totalConnectors: number;
  topMetric?: { label: string; value: string };
}

// ==========================================
// Universal Data Model (Ch 2.1)
// ==========================================

/** A single KPI metric */
export interface Metric {
  key: string;
  label: string;
  value: number;
  format: 'currency' | 'number' | 'percent' | 'duration' | 'rating';
}

/** A single timeseries data point */
export interface TimeseriesPoint {
  [key: string]: string | number;
  date: string;
  value: number;
}

/** A breakdown item (e.g. top service, campaign) */
export interface BreakdownItem {
  label: string;
  value: number;
  meta?: Record<string, string | number | boolean>;
}

/** Universal connector response — every transformer returns this */
export interface ConnectorResponse {
  metrics: Metric[];
  timeseries: TimeseriesPoint[];
  breakdowns: BreakdownItem[];
}

// ==========================================
// Adapter / Orchestrator contracts (Layer 0+1 refactor)
// ==========================================

/** Raw row from connector_credentials Supabase table */
export interface ConnectorCredentialsRow {
  id: string;
  client_id: string;
  connector_slug: string;
  api_key: string | null;
  extra_config: Record<string, unknown> | null;
  is_connected: boolean;
  connected_at: string | null;
  use_mock?: boolean;
}

/** Adapter input — pure function: creds + period in, response out */
export interface AdapterInput {
  creds: ConnectorCredentialsRow;
  period: { from: string; to: string };
}

export type AdapterSuccess = { status: 'ok'; data: ConnectorResponse };
export type AdapterError = { status: 'error'; code: ConnectorErrorCode; error: string };
export type AdapterOutput = AdapterSuccess | AdapterError;

/** Per-connector adapter — pure: knows external API, nothing about cache/db/http */
export type ConnectorAdapter = (input: AdapterInput) => Promise<AdapterOutput>;

/** Orchestrator input — full request context from HTTP route */
export interface OrchestratorInput {
  clientId: string;
  slug: string;
  period: { from: string; to: string };
  refresh?: boolean;
}

export type OrchestratorSuccess = {
  status: 'ok';
  data: ConnectorResponse;
  lastUpdated: string;
  meta: {
    cached?: boolean;
    mock?: boolean;
    notConnected?: boolean;
    clientId?: string;
    connector?: string;
    period?: { from: string; to: string };
  };
};

export type OrchestratorError = {
  status: 'error';
  code: ConnectorErrorCode;
  error: string;
  data: null;
  lastUpdated: string;
  meta?: {
    clientId?: string;
    connector?: string;
    period?: { from: string; to: string };
  };
};

export type OrchestratorOutput = OrchestratorSuccess | OrchestratorError;
