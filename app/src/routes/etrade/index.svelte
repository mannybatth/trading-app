<script lang="ts">
  import { Doc } from 'sveltefire';
  import { API_URL, etradeApiKey, etradeAuthUrl } from '../../constants';
  import type {
    ETradeAccessToken,
    ETradeAccount,
    ETradeOAuthToken,
  } from '../../models/etrade-models';
  import { notifier } from '../notifier';
  import { eTradeClient } from './etrade-client';

  let verifyCode: string;
  let oauthToken: string;
  let oauthTokenSecret: string;
  let accounts: ETradeAccount[];
  let selectedAccountIdKey: string;

  async function loginClicked(event) {
    const json: ETradeOAuthToken = await eTradeClient.getOAuthToken();
    console.log(json);
    oauthToken = json.oauth_token;
    oauthTokenSecret = json.oauth_token_secret;
    const authUrl = `${etradeAuthUrl}/e/t/etws/authorize?key=${encodeURIComponent(
      etradeApiKey
    )}&token=${encodeURIComponent(oauthToken)}`;
    window.open(authUrl, '_blank');
  }

  async function getAccessTokenClicked(event) {
    const json: ETradeAccessToken = await eTradeClient.getAccessToken(
      oauthToken,
      oauthTokenSecret,
      verifyCode
    );
    console.log(json);
  }

  async function refreshToken() {
    try {
      const response = await eTradeClient.refreshToken();
      notifier.success('Token refreshed');
    } catch (err) {
      console.error(err);
      notifier.danger('Failed to refresh token');
    }
  }

  function logout() {
    fetch(`${API_URL}/etrade/logout.endpoint`, {
      method: 'GET',
    });
    accounts = null;
  }

  async function getAccounts() {
    try {
      accounts = await eTradeClient.getAccounts();
    } catch (err) {
      console.error(err);
      notifier.danger('Failed to get list of accounts');
    }
  }

  async function getAccountPortfolio(accountIdKey: string) {
    try {
      const response = await eTradeClient.getAccountPortfolio(accountIdKey);
      console.log('portfolio', response);
    } catch (err) {
      console.error(err);
      notifier.danger('Failed to get account portfolio');
    }
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

  <button class="btn btn-primary my-2 mr-2" type="button" on:click="{getAccounts}">Get Accounts</button>

  {#if accounts}
    <!-- svelte-ignore a11y-no-onchange -->
    <select
      class="form-select"
      aria-label="Accounts"
      bind:value="{selectedAccountIdKey}"
      on:change="{() => getAccountPortfolio(selectedAccountIdKey)}"
    >
      <option value="0">- Select an Account -</option>
      {#each accounts as account}
        <option value="{account.accountIdKey}">{account.accountId} - {account.accountDesc}</option>
      {/each}
    </select>
  {/if}

  <!-- Only shown when loading -->
  <div slot="loading">⌛</div>

  <!-- Shown on error or if nothing loads after maxWait time-->
  <div slot="fallback">
    <button class="btn btn-primary my-2" type="button" on:click="{loginClicked}">Login to ETrade</button>
    <div>
      <input
        class="form-control input-lg"
        type="text"
        placeholder="Verify Code"
        aria-label="Verify Code"
        bind:value="{verifyCode}"
      />
      <button class="btn btn-outline my-2" type="button" on:click="{getAccessTokenClicked}">Get
        Access Token</button>
    </div>
  </div>
</Doc>

<div></div>
