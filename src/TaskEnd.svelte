<script>
    export let num_combos;  // number of unique block combinations (active or not) that the participant has tried

    import { fade } from 'svelte/transition';

    // Event dispatcher for communicating with parent components
    import {createEventDispatcher} from "svelte";
    const dispatch = createEventDispatcher();
    
    // Click handler
    function cont() {
        // Tell parent components to move on to the next task/quiz
        dispatch("continue");
    }
</script>

<body transition:fade="{{duration: 300}}">
    <div class="centering-container">
        <div class="col-container">
            <p>Time's up! You have made a total of {num_combos} {num_combos === 1 ? 'attempt' : 'attempts'}.</p>
            <button on:click={cont}>Click to continue</button>
        </div>
    </div>
</body>

<style>
    .col-container {
        max-width: 30rem;
        min-height: 15rem;
        margin: 1rem;
        padding: 1rem;

        border-radius: var(--container-border-radius);
        box-shadow: var(--container-box-shadow);

        /* note that the parent element of this component should be a flexbox */
        flex-grow: 1;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
</style>