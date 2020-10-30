import { writable } from 'svelte/store';

export interface INotification {
  type: string;
  message: string;
  timeout: number;
}

export const notificationStore = writable<INotification>(null);
