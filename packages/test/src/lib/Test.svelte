<script lang="ts">
  import {Test} from 'core';
  import {app} from '../app';
  
  const test = new Test();
  app.stage.addChild(test);
  test.x = 100;
  test.y = 100;
  </script>

<h1>test</h1>