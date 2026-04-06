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
}

/** Connector definition from registry */
export interface ConnectorDefinition {
  slug: string;
  name: string;
  category: ConnectorCategory;
  authType: AuthType;
  fields: ConnectorField[];
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
}

/** Base metric shape */
export interface BaseMetric {
  value: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

/** Standard API response */
export interface ApiResponse<T = Record<string, unknown>> {
  status: 'ok' | 'error';
  data: T;
  lastUpdated: string;
  error?: string;
}

/** Client card summary for agency overview */
export interface ClientSummary {
  client: Client;
  connectedCount: number;
  totalConnectors: number;
  topMetric?: { label: string; value: string };
}
