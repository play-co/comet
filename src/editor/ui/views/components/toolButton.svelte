<script lang="ts">
  export let icon: string;
  export let tip: string | undefined = undefined;
</script>

<tool-button>
  <!-- svelte-ignore a11y-missing-attribute -->
  <a title={tip}>
    <img src={icon} draggable="false" alt={tip} />
  </a>
</tool-button>

<style>
  tool-button {
    width: 100%;
    height: 40px;
    border-radius: 5px;
    background-color: var(--panel-bg-color-light);
    cursor: pointer;
    border: 1px outset #a699998f;
    margin-bottom: 8px;
    display: block;
  }

  tool-button:hover {
    background-color: var(--control-hover);
  }

  tool-button:active {
    background-color: var(--control-active);
  }

  a {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  img:active {
    position: relative;
    top: 2px;
    left: 2px;
  }

  img {
    width: 30px;
    user-select: none;
  }
</style>
