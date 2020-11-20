<script lang="ts">
  import { of, Subscription } from 'rxjs';
  import { delay, mergeMap, repeat } from 'rxjs/operators';
  import { onDestroy, onMount } from 'svelte';
  import { API_URL } from '../constants';
  import { roundToFraction } from '../libs/utils';

  let account;
  $: profitLoss = parseFloat(account?.equity) - parseFloat(account?.last_equity);
  $: profitLossPercent = (profitLoss / parseFloat(account?.last_equity)) * 100;

  const poll = of({}).pipe(
    mergeMap((_) => fetchAccount()),
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

  async function fetchAccount() {
    const response = await fetch(`${API_URL}/alpaca/account.endpoint`, {
      method: 'GET',
    });
    if (response.status !== 200) {
      throw response;
    }
    account = await response.json();
  }
</script>

<div class="container px-4 py-2">
  {#if account}
    <h1 class="text-shadow-light">${roundToFraction(account.equity, false)}</h1>
    <div class="{profitLoss >= 0 ? 'text-green' : 'text-red'}">
      {profitLoss >= 0 ? '▲' : '▼'}
      ${roundToFraction(profitLoss)}
      ({roundToFraction(profitLossPercent, false)}%)
    </div>
  {/if}
</div>

<style>
  .container {
    border: 1px solid #dcdcdc;
    border-radius: 8px;
  }
</style>
