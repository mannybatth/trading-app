<script lang="ts">
  import { of, Subscription } from 'rxjs';
  import { delay, mergeMap, repeat } from 'rxjs/operators';
  import { onDestroy, onMount } from 'svelte';
  import AlpacaEquity from '../../components/AlpacaEquity.svelte';
  import SingleStockPosition from '../../components/SingleStockPosition.svelte';
  import { API_URL } from '../../constants';
  import type { StockPosition } from '../../models/alpaca-models';

  let stockPositions: StockPosition[] = [];
  let loading = false;

  const poll = of({}).pipe(
    mergeMap((_) => getStockPositions()),
    delay(30000),
    repeat()
  );
  let pollSubscription: Subscription;

  onMount(() => {
    pollSubscription = poll.subscribe();
  });

  onDestroy(() => {
    pollSubscription.unsubscribe();
  });

  async function getStockPositions() {
    loading = true;
    const response = await fetch(`${API_URL}/stocks/stock-positions.endpoint`, {
      method: 'GET',
    });
    loading = false;
    if (response.status !== 200) {
      throw response;
    }
    stockPositions = await response.json();
  }
</script>

<svelte:head>
  <title>Stock Positions</title>
</svelte:head>

<div class="d-flex flex-row flex-justify-between">
  <div>
    <h1>Stock Positions</h1>
    <button class="btn mt-3" aria-disabled="{loading}" on:click="{getStockPositions}">
      {#if loading}
        <span>Loading</span><span class="AnimatedEllipsis"></span>
      {:else}<span>Reload Positions</span>{/if}
    </button>
  </div>
  <AlpacaEquity />
</div>

<table class="width-full my-3">
  <tr>
    <th class="text-left px-2 py-1">
      <div class="f5">Symbol</div>
    </th>
    <th class="text-left px-2 py-1">
      <div class="f5">Today</div>
    </th>
    <th class="text-left px-2 py-1">
      <div class="f5">Market Value</div>
    </th>
    <th class="text-right px-2 py-1">
      <div class="f5">% Change</div>
    </th>
    <th class="text-center px-2 py-1">
      <div class="f5">Profit/Loss</div>
    </th>
  </tr>
  {#each stockPositions as position (position.asset_id)}
    <SingleStockPosition stockPosition="{position}" />
  {/each}
</table>

<style>
</style>
