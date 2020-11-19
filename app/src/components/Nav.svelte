<script lang="ts">
  export let segment: string;
</script>

<nav class="UnderlineNav">
  <div class="UnderlineNav-body" role="tablist">
    <a
      class="UnderlineNav-item"
      role="tab"
      type="button"
      href="."
      aria-selected="{segment === undefined}"
    >Home</a>
    <a
      class="UnderlineNav-item"
      role="tab"
      type="button"
      href="stocks"
      aria-selected="{segment === 'stocks'}"
    >Stocks</a>
    <a
      class="UnderlineNav-item"
      role="tab"
      type="button"
      href="options"
      aria-selected="{segment === 'options'}"
    >Options</a>
    <a
      class="UnderlineNav-item"
      role="tab"
      type="button"
      href="etrade"
      aria-selected="{segment === 'etrade'}"
    >ETrade</a>
    <a
      class="UnderlineNav-item"
      role="tab"
      type="button"
      href="td"
      aria-selected="{segment === 'td'}"
    >TD Ameritrade</a>
  </div>
</nav>

<style>
</style>
