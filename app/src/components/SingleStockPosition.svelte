<script lang="ts">
  import { API_URL } from '../constants';
  import { roundStrToFraction, roundToFraction } from '../libs/utils';
  import type { StockPosition } from '../models/alpaca-models';
  import type { EntryPosition } from '../models/models';
  import SingleEntryPosition from './SingleEntryPosition.svelte';

  export let stockPosition: StockPosition;

  let detailsOpen = false;
  let badgeColorClass = 'bg-dark-gray';
  let entryPositions: EntryPosition[];
  let queueItems: any[];

  $: stockPriceChangePerc = roundToFraction(
    ((parseFloat(stockPosition.current_price) - parseFloat(stockPosition.lastday_price)) /
      parseFloat(stockPosition.lastday_price)) *
      100
  );

  $: {
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
      `${API_URL}/stocks/entry-positions.endpoint?symbol=${stockPosition.symbol}&queue=1`,
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

  function isInQueue(symbol: string, discriminator: string) {
    return !!queueItems[`STC-${discriminator}-${symbol}`];
  }
</script>

<tr class="position-row" on:click="{onDetailToggled}">
  <td class="border-top v-align-middle px-2 py-1">
    <div class="f3 text-bold">{stockPosition.symbol}</div>
    <div class="f5">{stockPosition.qty} shares</div>
  </td>
  <td
    class="border-top v-align-middle px-2 py-1 {Number(stockPosition.unrealized_intraday_pl) > 0 ? 'text-green' : 'text-red'}"
  >
    <div class="f5">
      {Number(stockPosition.unrealized_intraday_pl) > 0 ? '+' : '-'}${roundStrToFraction(stockPosition.unrealized_intraday_pl)}
    </div>
    <div class="f5">
      {Number(stockPosition.unrealized_intraday_plpc) > 0 ? '+' : '-'}{roundToFraction(parseFloat(stockPosition.unrealized_intraday_plpc) * 100)}%
    </div>
  </td>
  <td class="border-top v-align-middle px-2 py-1">
    <div class="f4">${roundStrToFraction(stockPosition.market_value)}</div>
  </td>
  <td class="border-top v-align-middle text-right px-2 py-1">
    <div class="f4 {Number(stockPosition.unrealized_plpc) > 0 ? 'text-green' : 'text-red'}">
      {Number(stockPosition.unrealized_plpc) > 0 ? '+' : '-'}{roundToFraction(parseFloat(stockPosition.unrealized_plpc) * 100)}%
    </div>
  </td>
  <td class="border-top v-align-middle px-2 py-1 price-badge-cell">
    <div class="rounded-1 text-white text-center f3-light px-3 py-1 {badgeColorClass}">
      {Number(stockPosition.unrealized_pl) > 0 ? '+' : '-'}${roundStrToFraction(stockPosition.unrealized_pl)}
    </div>
  </td>
</tr>

{#if detailsOpen}
  <tr class="details">
    <td colspan="5">
      <div class="py-2 px-3">
        Current Price:
        <span
          class="Label Label--large Label--gray-darker mr-1"
          title="Label: design"
        >${stockPosition.current_price}</span>
        <span class="{Number(stockPosition.change_today) > 0 ? 'text-green' : 'text-red'}">
          {Number(stockPosition.change_today) > 0 ? '+' : '-'}{stockPriceChangePerc}%
        </span>
      </div>
      {#if entryPositions}
        {#if entryPositions.length > 0}
          <table class="width-full">
            {#each entryPositions as entry}
              <SingleEntryPosition
                entryPosition="{entry}"
                inQueue="{isInQueue(entry.symbol, entry.discriminator)}"
              />
            {/each}
          </table>
        {:else}
          <SingleEntryPosition
            symbol="{stockPosition.symbol}"
            inQueue="{isInQueue(stockPosition.symbol, 'self')}"
          />
        {/if}
      {:else}
        <span class="Label bg-blue mx-3 my-2"><span>Loading</span><span
            class="AnimatedEllipsis"
          ></span></span>
      {/if}
    </td>
  </tr>
{/if}

<style>
  .position-row {
    cursor: pointer;
  }
  .details {
    background-color: #f8f8f8;
  }
  .price-badge-cell {
    width: 155px;
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
</style>
