<!-- code is adapted from https://svelte.dev/repl/dd6754a2ad0547c5b1c1ea37c0293fef?version=3.38.3 (App.svelte) -->

<script>
	  export let title;
	  export let x;
	  export let y;
</script>

<div style="top: {y + 5}px; left: {x + 5}px;">{title}</div>

<style>
	  div {
		    border: 3px solid black;
        border-radius: var(--container-border-radius);
        max-width: 500px;
		    background: white;
		    padding: 4px;
		    position: absolute;
	  }
</style>
