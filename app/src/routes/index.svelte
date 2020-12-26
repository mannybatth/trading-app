<script lang="ts">
  import { onMount } from 'svelte';
  import { Collection } from 'sveltefire';
  import SingleEntryPosition from '../components/SingleEntryPosition.svelte';
  import { API_URL } from '../constants';
  import { timeSince } from '../libs/utils';
  import type { StockPosition } from '../models/alpaca-models';
  import type { EntryPosition } from '../models/models';

  let stockPositions: StockPosition[] = [];
  let entryPositions: EntryPosition[];
  let positionsWithoutUser: StockPosition[] = [];
  let entriesWithoutPosition: EntryPosition[] = [];
  let oldEntryPositions: EntryPosition[] = [];

  onMount(async () => {
    await Promise.all([getStockPositions(), getEntryPositions()]);

    positionsWithoutUser = stockPositions
      .map((pos) => {
        return !entryPositions.some((entry) => entry.symbol === pos.symbol) ? pos : null;
      })
      .filter((x) => x);

    entriesWithoutPosition = entryPositions
      .map((entryPos) => {
        return !stockPositions.some((pos) => pos.symbol === entryPos.symbol) ? entryPos : null;
      })
      .filter((x) => x);

    const secondsNow = Date.now() / 1000;
    oldEntryPositions = entryPositions
      .map((entryPos) => {
        const time = secondsNow - entryPos.created._seconds;
        return time > 60 * 60 * 24 * 14 ? entryPos : null;
      })
      .filter((x) => x)
      .sort((a, b) => (a.created._seconds > b.created._seconds ? 1 : -1));
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

  async function getEntryPositions() {
    const response = await fetch(`${API_URL}/stocks/entry-positions.endpoint`, {
      method: 'GET',
    });
    if (response.status !== 200) {
      throw response;
    }
    const { positions } = await response.json();
    entryPositions = positions;
  }

  async function cancelAlert(alertsRef: any, alertId: string, orderId: string) {
    const response = await fetch(`${API_URL}/alpaca/order.endpoint?orderId=${orderId}`, {
      method: 'DELETE',
    });
    if (response.status !== 200) {
      throw response;
    }
    alertsRef.doc(alertId).delete();
  }
</script>

<svelte:head>
  <title>Trading App</title>
</svelte:head>

<div class="grid-container">
  <div>
    <h2>Pending Alerts</h2>
    <Collection path="{'alerts'}" let:data="{alerts}" let:ref="{alertsRef}">
      {#if alerts.length > 0}
        <table>
          <tr>
            <th>Symbol</th>
            <th>Discriminator</th>
            <th>Price</th>
            <th>Age</th>
          </tr>
          {#each alerts as alert}
            <tr>
              <td>{alert.symbol}</td>
              <td>{alert.discriminator}</td>
              <td>{alert.price}</td>
              <td>{timeSince(alert.created.seconds)}</td>
              <td>
                <button
                  class="btn btn-danger btn-sm"
                  type="button"
                  on:click="{() => cancelAlert(alertsRef, alert.id, alert.order_id)}"
                >X</button>
              </td>
            </tr>
          {/each}
        </table>
      {:else}None{/if}

      <div slot="loading">⌛</div>

      <div slot="fallback">Error loading data</div>
    </Collection>
  </div>

  <div>
    <h2>In Queue</h2>
    <Collection path="{'queue'}" let:data="{items}" let:ref="{queueRef}">
      {#if items.length > 0}
        <table>
          <tr>
            <th>Symbol</th>
            <th>Discriminator</th>
            <th>Age</th>
          </tr>
          {#each items as item}
            <tr>
              <td>{item.symbol}</td>
              <td>{item.discriminator}</td>
              <td>{timeSince(item.created.seconds)}</td>
              <td>
                <button
                  class="btn btn-danger btn-sm"
                  type="button"
                  on:click="{() => queueRef.doc(item.id).delete()}"
                >X</button>
              </td>
            </tr>
          {/each}
        </table>
      {:else}None{/if}

      <div slot="loading">⌛</div>

      <div slot="fallback">Error loading data</div>
    </Collection>
  </div>

  <div>
    <h2>Positions Without a User</h2>
    {#if positionsWithoutUser.length > 0}
      <table>
        <tr>
          <th>Symbol</th>
        </tr>
        {#each positionsWithoutUser as pos}
          <tr>
            <td>{pos.symbol}</td>
          </tr>
        {/each}
      </table>
    {:else}None{/if}
  </div>

  <div>
    <h2>Entries without a position</h2>
    {#if entriesWithoutPosition.length > 0}
      {#each entriesWithoutPosition as entry}
        {entry.symbol}
        <SingleEntryPosition entryPosition="{entry}" />
      {/each}
    {:else}None{/if}
  </div>

  <div class="old-positions">
    <h2>Old Positions</h2>
    {#if oldEntryPositions.length > 0}
      {#each oldEntryPositions as entry}
        {entry.symbol}
        <SingleEntryPosition entryPosition="{entry}" />
      {/each}
    {:else}None{/if}
  </div>
</div>

<style>
  .grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: max-content max-content 1fr;
    gap: 1em 1em;
    grid-template-areas:
      '. .'
      '. .'
      'a a';
  }

  .old-positions {
    grid-area: a;
  }

  td,
  th {
    padding: 0.2em 0.5em;
  }
</style>
