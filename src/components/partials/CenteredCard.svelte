<script>
    export let is_large = false;  // whether to show a larger card
    export let has_button = true;  // whether to include a button that dispatches the continue event
    export let button_text = "Continue";  // text to show on the button

    import { FADE_DURATION_MS, FADE_IN_DELAY_MS } from '../../modules/experiment_stores.js';
    import { fade } from 'svelte/transition';

    // Event dispatcher for communicating with parent components
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();
    
    // Click handler
    function cont() {
        // Tell parent components to move on to the next task/quiz
        dispatch("continue");
    }
</script>

<div class="centering-container" in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}">
    <div class="col-container" class:large="{is_large}">
        <slot></slot>
        {#if has_button}
            <button on:click={cont}>{button_text}</button>
        {/if}
    </div>
</div>

<style>
    .col-container {
        max-width: 500px;
        min-height: 200px;
        margin: 5px;
        padding: 30px;

        border-radius: var(--container-border-radius);
        box-shadow: var(--container-box-shadow);

        /* note that the parent element of this component should be a flexbox */
        flex-grow: 1;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .large {
        max-width: 50rem;
        min-height: 30rem;
    }
</style>