<script lang="ts" context="module">
  export interface ButtonBarItem {
    id: string;
    label: string;
    icon?: string;
    onClick: (e: MouseEvent) => void;
  }
</script>

<script lang="ts">
  export let items: ButtonBarItem[];
  export let size: "small" | "large";
</script>

<button-bar class:large={size === "large"} class:small={size === "small"}>
  {#each items as item (item.id)}
    <!-- svelte-ignore a11y-missing-attribute -->
    <a title={item.label} on:click={(e) => item.onClick(e)}>
      {#if item.icon}
        <img src={item.icon} alt={item.label} class="icon" />
      {/if}
      {#if size === "large"}
        {item.label}
      {/if}
    </a>
  {/each}
</button-bar>

<style>
  button-bar {
    display: flex;
    flex-direction: row;
    height: 40px;
    justify-content: start;
    background-color: #2b2b2b;
  }

  button-bar:global(.small) {
    height: 25px;
  }

  a:first-child {
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
    border-left-width: 1px;
  }

  a:last-child {
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
    border-right-width: 1px;
  }

  a {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0;
    border: 1px outset #64646482;
    min-width: 40px;
    border-radius: 0;
    border-left-width: 2px;
    border-right-width: 2px;
    cursor: pointer;
    background-color: #343434;
  }

  a:hover {
    background-color: #383737;
  }

  a:active {
    background-color: #302f2f;
  }

  .icon {
    width: 16px;
    pointer-events: none;
  }
</style>
