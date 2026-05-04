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
      console.log('WebSocket connected');

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
  if (stompClient?.active) {
    stompClient.deactivate();
  }
};
