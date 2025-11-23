/**
 * State Stream - Continuous state synchronization via SSE/WebSocket
 */

import {
    StateStreamEvent,
    StreamEventType,
    StreamEventData,
    StateDelta,
    InteractionEvent,
} from './types';

// ============================================================================
// Transport Types
// ============================================================================

export type TransportType = 'sse' | 'websocket';

export interface StreamOptions {
    transport: TransportType;
    url: string;
    reconnect?: boolean;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
}

export type EventHandler = (event: StateStreamEvent) => void;
export type ErrorHandler = (error: Error) => void;

// ============================================================================
// State Stream Class
// ============================================================================

export class StateStream {
    private options: StreamOptions;
    private eventSource?: EventSource;
    private webSocket?: WebSocket;
    private handlers: Map<StreamEventType | '*', Set<EventHandler>>;
    private errorHandlers: Set<ErrorHandler>;
    private reconnectAttempts: number;
    private connected: boolean;

    constructor(options: StreamOptions) {
        this.options = {
            reconnect: true,
            reconnectDelay: 1000,
            maxReconnectAttempts: 5,
            ...options,
        };
        this.handlers = new Map();
        this.errorHandlers = new Set();
        this.reconnectAttempts = 0;
        this.connected = false;
    }

    /**
     * Connect to the state stream
     */
    connect(): void {
        if (this.connected) {
            console.warn('StateStream: Already connected');
            return;
        }

        if (this.options.transport === 'sse') {
            this.connectSSE();
        } else {
            this.connectWebSocket();
        }
    }

    /**
     * Disconnect from the state stream
     */
    disconnect(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = undefined;
        }

        if (this.webSocket) {
            this.webSocket.close();
            this.webSocket = undefined;
        }

        this.connected = false;
    }

    /**
     * Subscribe to events
     */
    on(eventType: StreamEventType | '*', handler: EventHandler): () => void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        this.handlers.get(eventType)!.add(handler);

        // Return unsubscribe function
        return () => {
            this.handlers.get(eventType)?.delete(handler);
        };
    }

    /**
     * Subscribe to errors
     */
    onError(handler: ErrorHandler): () => void {
        this.errorHandlers.add(handler);
        return () => {
            this.errorHandlers.delete(handler);
        };
    }

    /**
     * Send interaction back to agent (WebSocket only)
     */
    sendInteraction(interaction: InteractionEvent): void {
        if (this.options.transport !== 'websocket' || !this.webSocket) {
            console.error('StateStream: sendInteraction requires WebSocket transport');
            return;
        }

        if (this.webSocket.readyState !== WebSocket.OPEN) {
            console.error('StateStream: WebSocket not connected');
            return;
        }

        const event: StateStreamEvent = {
            event: 'interaction',
            data: interaction,
        };

        this.webSocket.send(JSON.stringify(event));
    }

    // ============================================================================
    // Private Methods
    // ============================================================================

    private connectSSE(): void {
        try {
            this.eventSource = new EventSource(this.options.url);

            this.eventSource.onopen = () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                console.log('StateStream: SSE connected');
            };

            this.eventSource.onmessage = (e) => {
                this.handleMessage(e.data);
            };

            this.eventSource.onerror = (e) => {
                this.handleError(new Error('SSE connection error'));
                this.handleReconnect();
            };

            // Listen to custom event types
            const eventTypes: StreamEventType[] = ['status', 'ui_delta', 'blocker', 'log'];
            eventTypes.forEach((type) => {
                this.eventSource!.addEventListener(type, (e: Event) => {
                    const messageEvent = e as MessageEvent;
                    this.handleMessage(messageEvent.data, type);
                });
            });
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    private connectWebSocket(): void {
        try {
            this.webSocket = new WebSocket(this.options.url);

            this.webSocket.onopen = () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                console.log('StateStream: WebSocket connected');
            };

            this.webSocket.onmessage = (e) => {
                this.handleMessage(e.data);
            };

            this.webSocket.onerror = (e) => {
                this.handleError(new Error('WebSocket connection error'));
            };

            this.webSocket.onclose = () => {
                this.connected = false;
                this.handleReconnect();
            };
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    private handleMessage(data: string, eventType?: StreamEventType): void {
        try {
            const parsed = JSON.parse(data);

            let event: StateStreamEvent;
            if (eventType) {
                // SSE with custom event type
                event = { event: eventType, data: parsed };
            } else if (parsed.event && parsed.data) {
                // Full event structure
                event = parsed;
            } else {
                // Legacy format - wrap in ui_delta
                event = { event: 'ui_delta', data: parsed };
            }

            this.emit(event);
        } catch (error) {
            this.handleError(new Error(`Failed to parse message: ${error}`));
        }
    }

    private emit(event: StateStreamEvent): void {
        // Emit to specific event type handlers
        const handlers = this.handlers.get(event.event);
        if (handlers) {
            handlers.forEach((handler) => handler(event));
        }

        // Emit to wildcard handlers
        const wildcardHandlers = this.handlers.get('*');
        if (wildcardHandlers) {
            wildcardHandlers.forEach((handler) => handler(event));
        }
    }

    private handleError(error: Error): void {
        this.errorHandlers.forEach((handler) => handler(error));
    }

    private handleReconnect(): void {
        if (!this.options.reconnect) {
            return;
        }

        if (this.reconnectAttempts >= this.options.maxReconnectAttempts!) {
            this.handleError(new Error('Max reconnect attempts reached'));
            return;
        }

        this.reconnectAttempts++;
        const delay = this.options.reconnectDelay! * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`StateStream: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.disconnect();
            this.connect();
        }, delay);
    }

    /**
     * Get connection status
     */
    isConnected(): boolean {
        return this.connected;
    }
}

// ============================================================================
// Delta Applicator Utility
// ============================================================================

/**
 * Apply a state delta to an object
 */
export function applyDelta(target: any, delta: StateDelta): any {
    const { operation, payload, path } = delta;

    // Simple operations without path
    if (!path) {
        switch (operation) {
            case 'replace':
                return payload;
            case 'update':
                return { ...target, ...payload };
            case 'append':
                if (Array.isArray(target)) {
                    return [...target, payload];
                }
                return target;
            default:
                return target;
        }
    }

    // Path-based operations (JSON Pointer)
    const pathParts = path.split('/').filter((p) => p !== '');

    const result = JSON.parse(JSON.stringify(target)); // Deep clone
    let current = result;

    // Navigate to parent
    for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!(part in current)) {
            current[part] = {};
        }
        current = current[part];
    }

    const lastPart = pathParts[pathParts.length - 1];

    switch (operation) {
        case 'patch':
        case 'update':
            if (typeof current[lastPart] === 'object' && typeof payload === 'object') {
                current[lastPart] = { ...current[lastPart], ...payload };
            } else {
                current[lastPart] = payload;
            }
            break;
        case 'delete':
            if (Array.isArray(current)) {
                current.splice(parseInt(lastPart), 1);
            } else {
                delete current[lastPart];
            }
            break;
        case 'append':
            if (Array.isArray(current[lastPart])) {
                current[lastPart].push(payload);
            }
            break;
        case 'replace':
            current[lastPart] = payload;
            break;
        case 'create':
            current[lastPart] = payload;
            break;
    }

    return result;
}
