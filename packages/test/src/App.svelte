<script lang="ts">
  import { create } from './app';
  import { onMount } from 'svelte';
  import { Router, Route, navigate } from 'svelte-routing';
  import Test from './lib/Test.svelte';

  let container: HTMLElement;

  onMount(() => {
    create(container);
  });

  const onChange = (event) => {
    const link = (event.target as HTMLSelectElement).value;
    navigate(link, { replace: true });
  };
</script>

<main>
  <Router>
    <nav>
      <select on:change={onChange}>
        <option>--- SELECT ---</option>
        <option value="test">Test</option>
      </select>
    </nav>
    <div id="content" bind:this={container}>
      {#if container}
        <Route path="test" component={Test} />
      {:else}
        <p>Loading...</p>
      {/if}
    </div>
  </Router>
</main>

<style>
  main {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  nav {
    height: 35px;
    background-color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #content {
    flex-grow: 1;
  }
</style>
