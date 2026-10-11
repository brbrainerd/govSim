<script lang="ts">
  import { Session } from './app/session.svelte';
  import { fromData, us } from './data/us';
  import Game from './screens/Game.svelte';
  import NewGame from './screens/NewGame.svelte';

  let session = $state.raw<Session | null>(null);
</script>

{#if session}
  <Game {session} />
{:else}
  <NewGame onStart={(o) => (session = new Session(Date.now() | 0, fromData(us), o))} />
{/if}
