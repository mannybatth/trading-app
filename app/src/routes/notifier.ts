import { notificationStore } from './store';

function send(message: string, type = 'default', timeout: number) {
  notificationStore.set({ type, message, timeout });
}

function danger(msg: string, timeout = 3000) {
  send(msg, 'danger', timeout);
}

function warning(msg: string, timeout = 3000) {
  send(msg, 'warning', timeout);
}

function info(msg: string, timeout = 3000) {
  send(msg, 'info', timeout);
}

function success(msg: string, timeout = 3000) {
  send(msg, 'success', timeout);
}

export const notifier = { send, danger, warning, info, success };
