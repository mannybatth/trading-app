<style>
</style>

<svelte:head>
  <title>Username Changes - Trading App</title>
</svelte:head>

<h2>Username changes</h2>

<DataTable>
  <Head>
    <Row>
      <Cell>Id</Cell>
      <Cell>oldUsername</Cell>
      <Cell>newUsername</Cell>
      <Cell>date</Cell>
    </Row>
  </Head>
  <Body>
    <Collection
      path="{'usernameChanges'}"
      let:data="{usernameChanges}"
      let:ref="{usernameChangesRef}"
      log
    >
      {#each usernameChanges as change}
        <Row>
          <Cell>{change.userid}</Cell>
          <Cell>{change.oldUsername}</Cell>
          <Cell>{change.newUsername}</Cell>
          <Cell>{change.created.toDate().toDateString()}</Cell>
        </Row>
      {/each}
    </Collection>
  </Body>
</DataTable>

<script>
  import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";
  import { Collection } from "sveltefire";
</script>
