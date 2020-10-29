<script>
  import Button from '@smui/button';
  import { Label } from '@smui/common';
  import { Collection } from 'sveltefire';
  import { clientOAuth } from './client-oauth2';

  function loginClicked(event) {
    clientOAuth.startOAuth();
  }
</script>

<svelte:head>
  <title>TD Ameritrade</title>
</svelte:head>

<h1>TD Ameritrade</h1>

<Collection path="{'app-config'}" log let:data="{tokens}">
  <!-- prettier-ignore -->
  {#each tokens as token}
    {token.value}
  {:else}
    <Button on:click={loginClicked}>
      <Label>Login to Ameritrade</Label>
    </Button>
  {/each}

  <!-- Only shown when loading -->
  <div slot="loading">⌛</div>

  <!-- Shown on error or if nothing loads after maxWait time-->
  <div slot="fallback">Failed to load tokens</div>
</Collection>

<div></div>
