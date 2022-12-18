<script lang="ts">
  import { TextureAssetNode } from "../../../../core/nodes/concrete/meta/assets/textureAssetNode";
  import Events from "../../../events";

  let texture: TextureAssetNode | undefined = undefined;

  Events.selection.project.setSingle.bind((node) => {
    if (node.is(TextureAssetNode)) {
      texture = node.cast<TextureAssetNode>();
    }
  });
</script>

<project-preview>
  {#if texture}
    <div class="texturePreview">
      {#await texture.getResource()}
        <p>...waiting</p>
      {:then img}
        <!-- svelte-ignore a11y-missing-attribute -->
        <img src={img.src} />
      {:catch error}
        <p style="color: red">{error.message}</p>
      {/await}
    </div>
  {/if}
</project-preview>

<style>
  project-preview {
    font-style: italic;
    color: #666;

    background-color: #2f2f2f;
    width: 100%;
    height: 100%;
    padding: 5px;
    display: block;
    border: 1px outset #666a;
    border-radius: 5px;
  }

  .texturePreview {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .texturePreview img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
