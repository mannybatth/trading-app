<style>
</style>

<svelte:head>
  <title>Trading App</title>
</svelte:head>

<h2>Trading App</h2>

<Card style="width: 320px;">
  <Content>A card with a full-bleed action.</Content>
  <Actions>
    <Button>
      <Label>Action</Label>
    </Button>
  </Actions>
</Card>

<script>
  import Button from '@smui/button';
  import Card, { Actions, Content } from '@smui/card';
  import { Label } from '@smui/common';
</script>
