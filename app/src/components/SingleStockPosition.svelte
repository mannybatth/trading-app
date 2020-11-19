<script lang="ts">
  import { API_URL } from '../constants';
  import { round } from '../libs/utils';
  import type { StockPosition } from '../models/alpaca-models';
  import type { EntryPosition } from '../models/models';

  export let stockPosition: StockPosition;

  let detailsOpen = false;
  let badgeColorClass = 'bg-dark-gray';
  let profitLossStr: string = '';
  let entryPositions: EntryPosition[];
  let queueItems: any[];

  $: {
    profitLossStr = round(Math.abs(Number(stockPosition.unrealized_pl))).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    badgeColorClass = (() => {
      const pl = Number(stockPosition.unrealized_pl);
      if (pl > 50) {
        return 'bg-green';
      } else if (pl > 0) {
        return 'bg-light-green';
      } else if (pl < -50) {
        return 'bg-red';
      } else if (pl < 0) {
        return 'bg-light-red';
      }
      return 'bg-dark-gray';
    })();
  }

  async function onDetailToggled() {
    detailsOpen = !detailsOpen;
    if (detailsOpen) {
      entryPositions = null;
      getEntryPositions();
    }
  }

  async function getEntryPositions() {
    const response = await fetch(
      `${API_URL}/stocks/entry-positions.endpoint?symbol=${stockPosition.symbol}`,
      {
        method: 'GET',
      }
    );
    if (response.status !== 200) {
      throw response;
    }
    const { positions, queue } = await response.json();
    entryPositions = positions;
    queueItems = queue;
  }

  async function closeAlert(entry: EntryPosition) {
    await fetch(`${API_URL}/alert.endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'self',
        discriminator: entry.discriminator,
        alert: {
          action: 'STC',
          symbol: entry.symbol,
          risky: false,
        },
      }),
    });
    getEntryPositions();
  }

  async function closePosition() {
    await fetch(`${API_URL}/alert.endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'self',
        discriminator: 'self',
        alert: {
          action: 'STC',
          symbol: stockPosition.symbol,
          risky: false,
        },
      }),
    });
    getEntryPositions();
  }
</script>

<details class="details-reset">
  <summary class="no-outline" on:click="{onDetailToggled}">
    <div class="col-12">
      <div class="col-11 d-table-cell border-top v-align-middle px-2 py-1">
        <div class="f3 text-bold">{stockPosition.symbol}</div>
        <div class="f5">{stockPosition.qty} shares</div>
      </div>
      <div class="col-1 d-table-cell border-top v-align-middle px-2 py-1">
        <div
          class="price-badge rounded-1 text-white text-center f3-light px-3 py-1 {badgeColorClass}"
        >
          {Number(stockPosition.unrealized_pl) > 0 ? '+' : '-'}${profitLossStr}
        </div>
      </div>
    </div>
  </summary>
  <div class="details">
    {#if entryPositions}
      {#if entryPositions.length > 0}
        <div class="d-table width-full py-2">
          {#each entryPositions as entry}
            <div class="col-12 entry-row px-3">
              <div class="col-11 d-table-cell">{entry.discriminator}</div>
              <div class="col-1 d-table-cell">
                <button
                  class="btn btn-danger my-2"
                  type="button"
                  on:click="{() => closeAlert(entry)}"
                >Close Alert</button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="d-flex flex-row flex-justify-between px-3 py-2">
          <div>❗ No alerts found ❗</div>
          <button class="btn btn-danger my-2" type="button" on:click="{closePosition}">
            Close Position
          </button>
        </div>
      {/if}
    {:else}
      <span class="Label bg-blue mx-3 my-2"><span>Loading</span><span
          class="AnimatedEllipsis"
        ></span></span>
    {/if}
  </div>
</details>

<style>
  .no-outline {
    outline: none;
  }
  .details {
    background-color: #f8f8f8;
  }
  .price-badge {
    min-width: 120px;
  }
  .bg-light-green {
    background-color: #8bc34a;
  }
  .bg-light-red {
    background-color: #ff6e63;
  }
  .bg-dark-gray {
    background-color: #9e9e9e;
  }
  .entry-row:hover {
    background-color: #dedede;
  }
</style>
