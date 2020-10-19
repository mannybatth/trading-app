<style>
  .controls {
    margin: 10px 0px;
  }
  .margin {
    margin: 10px 0px;
  }
</style>

<svelte:head>
  <title>Users - Trading App</title>
</svelte:head>

<h2>Users</h2>

<div class="controls">
  <Button
    variant="unelevated"
    on:click="{() => {
      resetUser();
      userDialogRef.open();
    }}"
  >
    <Label>Add User</Label>
  </Button>

  <Button
    variant="unelevated"
    on:click="{() => {
      bulkUpdateText = '';
      updateUsersDialogRef.open();
    }}"
  >
    <Label>Update Existing Users</Label>
  </Button>
</div>

<DataTable>
  <Head>
    <Row>
      <Cell>Id</Cell>
      <Cell>Discriminator</Cell>
      <Cell>Username</Cell>
      <Cell>Actions</Cell>
    </Row>
  </Head>
  <Body>
    <Collection
      path="{'users'}"
      let:data="{users}"
      let:ref="{usersRef}"
      log
      on:ref="{(event) => {
        // eslint-disable-next-line no-unused-vars
        usersCollectionRef = event.detail.ref;
      }}"
    >
      {#each users as user}
        <Row>
          <Cell>{user.userid}</Cell>
          <Cell>{user.discriminator}</Cell>
          <Cell>{user.username}</Cell>
          <Cell>
            <IconButton
              class="material-icons"
              on:click="{() => editUserBtnClicked(user)}"
            >
              edit
            </IconButton>
            <IconButton
              class="material-icons"
              on:click="{() => user.ref.delete()}"
            >
              delete
            </IconButton>
          </Cell>
        </Row>
      {/each}
    </Collection>
  </Body>
</DataTable>

<Dialog bind:this="{userDialogRef}">
  <Title>{editMode ? 'Edit User' : 'Add User'}</Title>
  <Content>
    <div class="margin">
      <Textfield
        style="min-width: 250px;"
        dense
        variant="outlined"
        bind:value="{dialogUser.userid}"
        label="id"
      />
    </div>
    <div class="margin">
      <Textfield
        style="min-width: 250px;"
        dense
        variant="outlined"
        bind:value="{dialogUser.discriminator}"
        label="discriminator"
      />
    </div>
    <div class="margin">
      <Textfield
        style="min-width: 250px;"
        dense
        variant="outlined"
        bind:value="{dialogUser.username}"
        label="username"
      />
    </div>
  </Content>
  <Actions>
    <Button
      on:click="{() => {
        userDialogRef.close();
        editMode = false;
      }}"
    >
      <Label>Cancel</Label>
    </Button>
    <Button on:click="{saveUserDialog}">
      <Label>{editMode ? 'Update' : 'Add'}</Label>
    </Button>
  </Actions>
</Dialog>

<Dialog bind:this="{updateUsersDialogRef}">
  <Title>Bulk update users</Title>
  <Content>
    <div class="margin">
      <Textfield
        textarea
        style="min-width: 300px; min-height: 200px"
        variant="outlined"
        bind:value="{bulkUpdateText}"
        label="data"
      />
    </div>
  </Content>
  <Actions>
    <Button
      on:click="{() => {
        updateUsersDialogRef.close();
      }}"
    >
      <Label>Cancel</Label>
    </Button>
    <Button on:click="{saveBulkUpdateUsersDialog}">
      <Label>Update</Label>
    </Button>
  </Actions>
</Dialog>

<script>
  import Button, { Label } from "@smui/button";
  import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import IconButton from "@smui/icon-button";
  import Textfield from "@smui/textfield";
  import { Collection } from "sveltefire";
  import { API_URL } from "../../constants";

  let usersCollectionRef;
  let userDialogRef;

  let updateUsersDialogRef;

  let dialogUser = {
    userid: "",
    discriminator: "",
    username: "",
  };
  let editMode = false;

  let bulkUpdateText = "";
  let usersUpdatedList = [];

  function resetUser() {
    dialogUser = {
      userid: "",
      discriminator: "",
      username: "",
    };
  }

  function editUserBtnClicked(user) {
    editMode = true;
    dialogUser = user;
    userDialogRef.open();
  }

  function saveUserDialog() {
    if (editMode) {
      dialogUser.ref.update({
        userid: dialogUser.userid,
        discriminator: dialogUser.discriminator,
        username: dialogUser.username,
      });
    } else {
      usersCollectionRef.add({
        userid: dialogUser.userid,
        discriminator: dialogUser.discriminator,
        username: dialogUser.username,
      });
    }
    userDialogRef.close();
    editMode = false;
  }

  async function saveBulkUpdateUsersDialog() {
    const response = await fetch(`${API_URL}/users.endpoint`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: JSON.parse(bulkUpdateText),
      }),
    });

    const json = await response.json();

    if (json && json.success) {
      usersUpdatedList = json.usersChanged || [];
      alert(`Users updated! Count: ${usersUpdatedList.length}`);
    }
  }
</script>
