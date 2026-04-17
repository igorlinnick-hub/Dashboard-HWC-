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
