<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { INotification } from '../routes/store';
  import { notificationStore } from '../routes/store';

  export let timeout = 3000;

  let count = 0;
  let toasts = [];
  let unsubscribe: () => void;

  function animateOut(node, { delay = 0, duration = 300 }) {
    return {
      delay,
      duration,
      css: (t: number) => `opacity: ${(t - 0.1) * 1}; transform-origin: top right;`,
    };
  }

  function createToast(notification: INotification) {
    toasts = [
      {
        id: count,
        msg: notification.message,
        type: notification.type,
        timeout: notification.timeout || timeout,
        width: '100%',
      },
      ...toasts,
    ];
    count = count + 1;
  }

  unsubscribe = notificationStore.subscribe((value) => {
    if (!value) {
      return;
    }
    createToast(value);
    notificationStore.set(null);
  });

  onDestroy(unsubscribe);

  function removeToast(id) {
    toasts = toasts.filter((t) => t.id != id);
  }
</script>

<div class="toasts">
  {#each toasts as toast (toast.id)}
    {#if toast.type === 'success'}
      <div class="Toast Toast--success" out:animateOut>
        <span class="Toast-icon">
          <!-- <%= octicon "check" %> -->
          <svg width="12" height="16" viewBox="0 0 12 16" class="octicon octicon-check" aria-hidden="true">
            <path fill-rule="evenodd" d="M12 5l-8 8-4-4 1.5-1.5L4 10l6.5-6.5L12 5z"></path>
          </svg>
        </span>
        <span class="Toast-content">{toast.msg}</span>
        <div class="progress" style="animation-duration: {toast.timeout}ms;" on:animationend="{() => removeToast(toast.id)}"></div>
      </div>
    {:else if toast.type === 'warning'}
      <div class="Toast Toast--warning" out:animateOut>
        <span class="Toast-icon">
          <!-- <%= octicon "alert" %> -->
          <svg width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-alert" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"
            ></path>
          </svg>
        </span>
        <span class="Toast-content">{toast.msg}</span>
        <div class="progress" style="animation-duration: {toast.timeout}ms;" on:animationend="{() => removeToast(toast.id)}"></div>
      </div>
    {:else if toast.type === 'danger'}
      <div class="Toast Toast--error" out:animateOut>
        <span class="Toast-icon">
          <!-- <%= octicon "stop" %> -->
          <svg width="14" height="16" viewBox="0 0 14 16" class="octicon octicon-stop" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M10 1H4L0 5v6l4 4h6l4-4V5l-4-4zm3 9.5L9.5 14h-5L1 10.5v-5L4.5 2h5L13 5.5v5zM6 4h2v5H6V4zm0 6h2v2H6v-2z"
            ></path>
          </svg>
        </span>
        <span class="Toast-content">{toast.msg}</span>
        <div class="progress" style="animation-duration: {toast.timeout}ms;" on:animationend="{() => removeToast(toast.id)}"></div>
      </div>
    {:else if toast.type === 'info'}
      <div class="Toast" out:animateOut>
        <span class="Toast-icon">
          <!-- <%= octicon "info" %> -->
          <svg width="14" height="16" viewBox="0 0 14 16" class="octicon octicon-info" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"
            ></path>
          </svg>
        </span>
        <span class="Toast-content">{toast.msg}</span>
        <div class="progress" style="animation-duration: {toast.timeout}ms;" on:animationend="{() => removeToast(toast.id)}"></div>
      </div>
    {/if}
  {/each}
</div>

<style>
  :global(.toasts) {
    list-style: none;
    position: fixed;
    top: 0;
    right: 0;
    padding: 0;
    margin: 0;
    z-index: 9999;
  }

  :global(.toasts) > .Toast > .progress {
    position: absolute;
    opacity: 0;
    animation-name: shrink;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
  }

  @keyframes animate-in {
    0%,
    60%,
    75%,
    90%,
    to {
      -webkit-animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
      animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    }

    0% {
      opacity: 0;
      transform: translate3d(3000px, 0, 0);
    }

    60% {
      opacity: 1;
      transform: translate3d(-25px, 0, 0);
    }

    75% {
      transform: translate3d(10px, 0, 0);
    }

    90% {
      transform: translate3d(-5px, 0, 0);
    }

    to {
      transform: none;
    }
  }

  @keyframes shrink {
    0% {
      width: 98vw;
    }
    100% {
      width: 0;
    }
  }

  @media (min-width: 480px) {
    @keyframes animate-in {
      0%,
      60%,
      75%,
      90%,
      to {
        -webkit-animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
        animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
      }

      0% {
        opacity: 0;
        transform: translate3d(3000px, 0, 0);
      }

      60% {
        opacity: 1;
        transform: translate3d(-25px, 0, 0);
      }

      75% {
        transform: translate3d(10px, 0, 0);
      }

      90% {
        transform: translate3d(-5px, 0, 0);
      }

      to {
        transform: none;
      }
    }

    @keyframes shrink {
      0% {
        width: 40vw;
      }
      100% {
        width: 0;
      }
    }
  }
</style>
