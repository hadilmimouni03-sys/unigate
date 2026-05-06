import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';

let stompClient = null;

export const connectWebSocket = (userEmail, callbacks = {}) => {
  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    },
    reconnectDelay: 5000,
    onConnect: () => {
      if (callbacks.onNotification) {
        stompClient.subscribe(`/user/${userEmail}/queue/notifications`, (msg) => {
          callbacks.onNotification(JSON.parse(msg.body));
        });
      }
      if (callbacks.onApplicationStatus) {
        stompClient.subscribe(`/user/${userEmail}/queue/application-status`, (msg) => {
          callbacks.onApplicationStatus(JSON.parse(msg.body));
        });
      }
      if (callbacks.onDocumentValidation) {
        stompClient.subscribe(`/user/${userEmail}/queue/document-validation`, (msg) => {
          callbacks.onDocumentValidation(JSON.parse(msg.body));
        });
      }
    },
    onDisconnect: () => console.log('WebSocket disconnected'),
    onStompError: (frame) => console.error('STOMP error', frame),
  });

  stompClient.activate();
  return stompClient;
};

export const disconnectWebSocket = () => {
  if (stompClient?.active) stompClient.deactivate();
};

/**
 * Creates an isolated STOMP client for grade simulation.
 * Returns { send, disconnect }.
 * onResult receives a SimulationResult object each time the server responds.
 */
export const createSimulationClient = (userEmail, onResult) => {
  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    },
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe(`/user/${userEmail}/queue/grades/simulation`, (msg) => {
        onResult(JSON.parse(msg.body));
      });
    },
    onStompError: (frame) => console.error('Simulation WS error', frame),
  });
  client.activate();

  return {
    send: (grades) => {
      if (client.active) {
        client.publish({
          destination: '/app/grades/simulate',
          body: JSON.stringify({ grades }),
        });
      }
    },
    disconnect: () => { if (client.active) client.deactivate(); },
  };
};
