<style>
</style>

<svelte:head>
  <title>Users - Trading App</title>
</svelte:head>

<h2>Users</h2>

<DataTable table$aria-label="People list">
  <Head>
    <Row>
      <Cell>Id</Cell>
      <Cell>Discriminator</Cell>
      <Cell>Username</Cell>
      <Cell>Actions</Cell>
    </Row>
  </Head>
  <Body>
    <Collection path="{'users'}" let:data="{users}" let:ref="{usersRef}" log>
      {#each users as user}
        <Row>
          <Cell>{user.id}</Cell>
          <Cell>{user.discriminator}</Cell>
          <Cell>{user.username}</Cell>
          <Cell>
            <IconButton class="material-icons">edit</IconButton>
            <IconButton class="material-icons">delete</IconButton>
          </Cell>
        </Row>
      {/each}
    </Collection>
  </Body>
</DataTable>

<script context="module">
  // // the (optional) preload function takes a
  // // `{ path, params, query }` object and turns it into
  // // the data we need to render the page
  // export async function preload(page, session) {
  // 	// the `slug` parameter is available because this file
  // 	// is called [slug].svelte
  // 	const { slug } = page.params;

  // 	// `this.fetch` is a wrapper around `fetch` that allows
  // 	// you to make credentialled requests on both
  // 	// server and client
  // 	const res = await this.fetch(`blog/${slug}.json`);
  // 	const article = await res.json();

  // 	return { article };
  // }
</script>

<script>
  import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";
  import IconButton from "@smui/icon-button";
  import { Collection } from "sveltefire";
</script>
