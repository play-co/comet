<script lang="ts" context="module">
  export interface ButtonBarItem {
    id: string;
    label: string;
    icon?: string;
    isEnabled?: boolean;
    onClick: (e: MouseEvent) => void;
  }
</script>

<script lang="ts">
  export let items: ButtonBarItem[];
  export let size: "small" | "large";
  export let update: ((callback: (items: ButtonBarItem[]) => void) => void) | undefined = undefined;

  const onUpdate = (updatedItems: ButtonBarItem[]) => {
    items = [...updatedItems];
  };

  update && update(onUpdate);
</script>

<button-bar class:large={size === "large"} class:small={size === "small"}>
  {#each items as item (item.id)}
    <!-- svelte-ignore a11y-missing-attribute -->
    <a
      title={item.label}
      class:disabled={item.isEnabled === false}
      on:click={(e) => item.isEnabled !== false && item.onClick(e)}
    >
      {#if item.icon}
        <img src={item.icon} alt={item.label} class="icon" draggable="false" />
      {/if}
      {#if size === "large"}
        {item.label}
      {/if}
    </a>
  {/each}
</button-bar>

<style>
  button-bar {
    user-select: none;
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
    background-color: var(--control-hover);
  }

  a.disabled {
    opacity: 0.2;
  }

  a:active {
    background-color: var(--control-active);
  }

  .icon {
    width: 16px;
    user-select: none;
  }

  .icon:active {
    position: relative;
    top: 2px;
    left: 2px;
  }
</style>
