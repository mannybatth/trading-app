<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CreateOrderResponse } from '../models/alpaca-models';

  export let createOrderResponse: CreateOrderResponse;
  export let loading = false;

  const dispatch = createEventDispatcher();
</script>

<div
  class="flash my-1 text-left d-flex flex-justify-between flash-{createOrderResponse.ok ? 'success' : 'error'}"
>
  {#if createOrderResponse.ok}
    <span>
      {#if createOrderResponse.addedToQueue}
        ✅ &nbsp;Added to the queue!
      {:else}✅ &nbsp;Alert has been closed!{/if}
    </span>
  {:else}
    <span class="mr-2">
      {createOrderResponse.reason || 'Something went wrong'}
      {#if createOrderResponse.addedToQueue}<br />✅ &nbsp;Added to the queue!{/if}
    </span>
    <button
      class="btn btn-sm primary"
      type="submit"
      aria-disabled="{loading}"
      on:click="{() => dispatch('try-again-click')}"
    >Try again</button>
  {/if}
</div>

<style>
  .flash {
    padding: 10px 16px;
    max-width: 400px;
  }
</style>
