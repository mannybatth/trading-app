<script lang="ts">
  import { API_URL } from '../constants';
  import { timeSince } from '../libs/utils';
  import type { CreateOrderResponse } from '../models/alpaca-models';
  import type { EntryPosition } from '../models/models';
  import CloseOrderResponse from './CloseOrderResponse.svelte';

  export let entryPosition: EntryPosition = undefined;
  export let symbol: string = undefined;
  export let inQueue = false;

  let closeOrderResponse: CreateOrderResponse;
  let loading = false;

  async function closeAlert(symbol: string, discriminator: string) {
    closeOrderResponse = null;
    loading = true;
    const response = await fetch(`${API_URL}/alert.endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'self',
        discriminator: discriminator,
        alert: {
          action: 'STC',
          symbol: symbol,
          risky: false,
        },
      }),
    });
    const result: CreateOrderResponse = await response.json();
    // await sleep(3000);
    // const result: CreateOrderResponse = {
    //   ok: false,
    //   reason: 'Some error blah blah blah blah blah blah blah',
    //   addedToQueue: true,
    // };
    closeOrderResponse = result;
    loading = false;
  }
</script>

{#if entryPosition}
  <tr class="entry-row">
    <td class="pl-3">
      <div class="f5">{entryPosition.discriminator}</div>
    </td>
    <td class="pl-3">
      <div class="f5">{entryPosition.quantity} shares</div>
    </td>
    <td>{timeSince(entryPosition.created._seconds)} ago</td>
    <td class="text-right pr-3 col-6">
      <div class="d-flex flex-row flex-items-center flex-justify-end">
        {#if inQueue}
          <div class="flex-shrink-0"><span class="Label mr-1 Label--green">In Queue</span></div>
        {/if}
        {#if closeOrderResponse}
          <CloseOrderResponse
            loading="{loading}"
            createOrderResponse="{closeOrderResponse}"
            on:try-again-click="{() => closeAlert(entryPosition.symbol, entryPosition.discriminator)}"
          />
        {:else}
          <button
            class="btn btn-danger my-2"
            type="button"
            aria-disabled="{loading}"
            on:click="{() => closeAlert(entryPosition.symbol, entryPosition.discriminator)}"
          >Close Alert</button>
        {/if}
      </div>
    </td>
  </tr>
{:else}
  <div class="d-flex flex-row flex-justify-between flex-items-center px-3 py-2">
    <div>❗ No alerts found ❗</div>
    <div class="d-flex flex-row flex-items-center flex-justify-end">
      {#if inQueue}
        <div class="flex-shrink-0"><span class="Label mr-1 Label--green">In Queue</span></div>
      {/if}
      {#if closeOrderResponse}
        <CloseOrderResponse
          loading="{loading}"
          createOrderResponse="{closeOrderResponse}"
          on:try-again-click="{() => closeAlert(symbol, 'self')}"
        />
      {:else}
        <button
          class="btn btn-danger"
          type="button"
          aria-disabled="{loading}"
          on:click="{() => closeAlert(symbol, 'self')}"
        >
          Close Position
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .entry-row:hover {
    background-color: #eeeeee;
  }
</style>
