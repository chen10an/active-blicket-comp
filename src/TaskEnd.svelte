<script>
    // TODO: click to continue
    export let time_up;  // whether the time limit has been reached
    export let found_all_combos;  // whether the participant has found all block combinations that produce the activation
    export let num_found_combos;  // number of active block combinations that the participant has found

    // Event dispatcher for communicating with parent components
    import {createEventDispatcher} from "svelte";
    const dispatch = createEventDispatcher();
    
    // Click handler
    function cont() {
        // Tell parent components to move on to the next task/quiz
        dispatch("continue", {});
    }
</script>

<!-- text to show the participant -->
{#if found_all_combos}
	<p>Congratulations! You have found all {num_found_combos} unique ways to cause an activation.</p>
{:else if time_up}
	<p>Time's up! You have found {num_found_combos} unique ways to cause an activation within the time limit.</p>
{/if}
<!-- TODO: deal with 1 and 0 combos -->

<button on:click={cont}>Click to continue</button>

<!-- TODO: {:else} error -->