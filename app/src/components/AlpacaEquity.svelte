<script lang="ts">
  import { of, Subscription } from 'rxjs';
  import { delay, mergeMap, repeat } from 'rxjs/operators';
  import { onDestroy, onMount } from 'svelte';
  import { API_URL } from '../constants';
  import { round } from '../libs/utils';

  let account;
  $: profitLoss = round(account?.equity - account?.last_equity);
  $: profitLossPercent = round((account?.equity - account?.last_equity) / account?.equity);

  const poll = of({}).pipe(
    mergeMap((_) => fetchAccount()),
    delay(10000),
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
    <h1 class="text-shadow-light">${round(Number(account.equity)).toLocaleString()}</h1>
    <div class="{profitLoss >= 0 ? 'profit' : 'loss'}">
      {profitLoss >= 0 ? '▲' : '▼'}
      ${Math.abs(profitLoss)}
      ({profitLossPercent}%)
    </div>
  {/if}
</div>

<style>
  .container {
    border: 1px solid #dcdcdc;
    border-radius: 8px;
  }
  .profit {
    color: green;
  }

  .loss {
    color: red;
  }
</style>
