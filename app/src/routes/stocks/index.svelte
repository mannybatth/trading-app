<script lang="ts">
  import { onMount } from 'svelte';
  import AlpacaEquity from '../../components/AlpacaEquity.svelte';
  import SingleStockPosition from '../../components/SingleStockPosition.svelte';
  import { API_URL } from '../../constants';
  import type { StockPosition } from '../../models/alpaca-models';

  let stockPositions: StockPosition[] = [];

  onMount(() => {
    getStockPositions();
  });

  async function getStockPositions() {
    const response = await fetch(`${API_URL}/stocks/stock-positions.endpoint`, {
      method: 'GET',
    });
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
  </div>
  <AlpacaEquity />
</div>

<div class="d-table width-full my-4">
  {#each stockPositions as position}
    <SingleStockPosition stockPosition="{position}" />
  {/each}
</div>
