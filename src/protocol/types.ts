/**
 * Chameleon Protocol - MCP View Extension
 * 
 * Core types and interfaces for the Chameleon Protocol extending MCP
 */

// ============================================================================
// View Content Types
// ============================================================================

export type ContentType = 'text' | 'component';

export interface TextContent {
  type: 'text';
  text: string;
}

export type ComponentLayer = 'peripheral' | 'focus' | 'interrupt';

export interface ComponentMetadata {
  priority?: number;
  transient?: boolean;
  ttl?: number;
}

export interface ViewContent {
  type: 'component';
  component_name: string;
  data: Record<string, any>;
  interactive?: boolean;
  stream_id?: string;
  layer?: ComponentLayer;
  metadata?: ComponentMetadata;
}

export type Content = TextContent | ViewContent;

// ============================================================================
// MCP Response Types
// ============================================================================

export interface MCPViewResponse {
  content: Content[];
  stream_url?: string;
}

// ============================================================================
// State Delta Types
// ============================================================================

export type DeltaOperation = 'create' | 'update' | 'delete' | 'append' | 'patch' | 'replace';

export interface StateDelta {
  target_id: string;
  operation: DeltaOperation;
  payload: any;
  path?: string; // JSON Pointer (RFC 6901)
  timestamp: number;
}

// ============================================================================
// Interaction Types
// ============================================================================

export type InteractionEventType = 'click' | 'submit' | 'change' | 'select' | 'drag' | 'custom';

export interface InteractionEvent {
  component_id: string;
  event_type: InteractionEventType;
  payload: Record<string, any>;
  timestamp: number;
}

// ============================================================================
// Stream Event Types
// ============================================================================

export type StreamEventType = 'status' | 'ui_delta' | 'interaction' | 'blocker' | 'log';

export interface StatusEvent {
  phase: string;
  progress?: number;
  message?: string;
}

export interface UIDeltaEvent {
  layer?: ComponentLayer;
  component?: ViewContent;
  delta?: StateDelta;
}

export interface ActionButton {
  id: string;
  label: string;
  type?: 'primary' | 'secondary' | 'danger' | 'cancel';
}

export interface BlockerEvent {
  requires: string;
  message: string;
  component?: ViewContent;
  actions?: ActionButton[];
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEvent {
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
}

export type StreamEventData = StatusEvent | UIDeltaEvent | InteractionEvent | BlockerEvent | LogEvent;

export interface StateStreamEvent {
  event: StreamEventType;
  data: StreamEventData;
}

// ============================================================================
// Protocol Metadata
// ============================================================================

export interface ProtocolInfo {
  protocol_version: 'chameleon/1.0';
  mcp_compatibility: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isTextContent(content: Content): content is TextContent {
  return content.type === 'text';
}

export function isViewContent(content: Content): content is ViewContent {
  return content.type === 'component';
}

export function isStatusEvent(data: StreamEventData): data is StatusEvent {
  return 'phase' in data;
}

export function isUIDeltaEvent(data: StreamEventData): data is UIDeltaEvent {
  return 'layer' in data || 'delta' in data;
}

export function isInteractionEvent(data: StreamEventData): data is InteractionEvent {
  return 'component_id' in data && 'event_type' in data;
}

export function isBlockerEvent(data: StreamEventData): data is BlockerEvent {
  return 'requires' in data;
}

export function isLogEvent(data: StreamEventData): data is LogEvent {
  return 'level' in data && 'message' in data;
}
