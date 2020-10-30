<script lang="ts">
  import { Doc } from 'sveltefire';
  import { API_URL } from '../../constants';
  import { notifier } from '../notifier';
  import { clientOAuth } from './client-oauth2';

  function loginClicked(event) {
    clientOAuth.startOAuth();
  }

  async function refreshToken() {
    try {
      await fetch(`${API_URL}/td/refresh-token.endpoint`, {
        method: 'GET',
      });
      notifier.success('Token refreshed');
    } catch (err) {
      console.error(err);
      notifier.success('Failed to refresh token');
    }
  }

  function logout() {
    fetch(`${API_URL}/td/logout.endpoint`, {
      method: 'GET',
    });
  }
</script>

<svelte:head>
  <title>TD Ameritrade</title>
</svelte:head>

<h1 class="my-1">TD Ameritrade</h1>

<Doc path="{'app-config/tokens'}" log let:data="{tokens}">
  <button class="btn btn-primary my-2 mr-2" type="button" on:click="{refreshToken}">Refresh Token</button>
  <button class="btn btn-danger my-2" type="button" on:click="{logout}">Logout</button>

  <!-- prettier-ignore -->
  <details class="my-1">
    <summary class="btn">View Tokens</summary>
    <div class="mt-2">
      <div class="markdown-body">
        <pre><code class="wrap-text">
          {JSON.stringify(tokens)}
        </code></pre>
      </div>
    </div>
  </details>

  <!-- Only shown when loading -->
  <div slot="loading">⌛</div>

  <!-- Shown on error or if nothing loads after maxWait time-->
  <div slot="fallback"><button class="btn btn-primary my-2" type="button" on:click="{loginClicked}">Login to TD Ameritrade</button></div>
</Doc>

<div></div>
