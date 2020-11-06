<script lang="ts">
  import { Doc } from 'sveltefire';
  import { API_URL, etradeApiKey, etradeAuthUrl } from '../../constants';
  import type { ETradeAccessToken, ETradeOAuthToken } from '../../models/etrade-models';
  import { notifier } from '../notifier';
  import { eTradeClient } from './etrade-client';

  let verifyCode: string;
  let oauthToken: string;
  let oauthTokenSecret: string;

  async function loginClicked(event) {
    const json: ETradeOAuthToken = await eTradeClient.getOAuthToken();
    console.log(json);
    oauthToken = json.oauth_token;
    oauthTokenSecret = json.oauth_token_secret;
    const authUrl = `${etradeAuthUrl}/e/t/etws/authorize?key=${encodeURIComponent(etradeApiKey)}&token=${encodeURIComponent(oauthToken)}`;
    window.open(authUrl, '_blank');
  }

  async function getAccessTokenClicked(event) {
    const json: ETradeAccessToken = await eTradeClient.getAccessToken(oauthToken, oauthTokenSecret, verifyCode);
    console.log(json);
  }

  async function refreshToken() {
    try {
      await fetch(`${API_URL}/etrade/refresh-token.endpoint`, {
        method: 'GET',
      });
      notifier.success('Token refreshed');
    } catch (err) {
      console.error(err);
      notifier.success('Failed to refresh token');
    }
  }

  function logout() {
    fetch(`${API_URL}/etrade/logout.endpoint`, {
      method: 'GET',
    });
  }
</script>

<svelte:head>
  <title>ETrade</title>
</svelte:head>

<h1 class="my-1">ETrade</h1>

<Doc path="{'app-config/etrade-tokens'}" log let:data="{tokens}">
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
  <div slot="fallback">
    <button class="btn btn-primary my-2" type="button" on:click="{loginClicked}">Login to ETrade</button>
    <div>
      <input class="form-control input-lg" type="text" placeholder="Verify Code" aria-label="Verify Code" bind:value="{verifyCode}" />
      <button class="btn btn-outline my-2" type="button" on:click="{getAccessTokenClicked}">Get Access Token</button>
    </div>
  </div>
</Doc>

<div></div>
