<style>
  .alert {
    padding: 16px;
    border-radius: 4px;
    background-color: #4caf50;
    color: white;
    display: flex;
    flex-direction: row;
  }
  .content {
    margin-left: 16px;
  }
</style>

<div class="alert">
  <Icon class="material-icons">check_circle</Icon>
  <div class="content">
    <slot />
  </div>
</div>

<script>
  import { Icon } from "@smui/common";
</script>
