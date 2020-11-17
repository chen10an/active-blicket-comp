<script>
    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js
    export let is_mini;  // boolean, whether to show a mini, non-interactive grid
    export let is_disabled;  // boolean, whether to disable clicking on the blocks
    export let block_filter_func;  // lambda function that determines which blocks to show on the grid, e.g. block => !block.state
    export let is_detector;  // boolean, whether the grid is a detector
    export let key_prefix;  // send/receive transitions will apply between blocks with the same key_prefix and id
    
    export let copied_blocks_arr = null;  // array of copied block objects to use inplace of the shared `block_dict[collection_id]` from `experiment_stores.js`
    export let show_positive = false;  // boolean, whether to show a positive response from the detector
    export let show_negative = false;  // boolean, whether to show a negative response from the detector
    export let use_overlay = false;  // boolean, whether to use an overlay that describes the detector's response

    // Imports
    import { block_dict } from '../modules/experiment_stores.js';
    import { send, receive } from '../modules/crossfade.js';

    // Initialize variables
    let grid_blocks;  // blocks to display on the grid
    $: {
        if (copied_blocks_arr) {  // if not null
            grid_blocks = copied_blocks_arr;
        } else {
            grid_blocks = $block_dict[collection_id];  // cross-component (using $) reference to the blocks in `experiment_stores.js`
        }
    }

    // Click handler
    function click_block(id) {
        // When a block is clicked by the participant, reverse its state (true to false; false to true)
        let current_block = grid_blocks.find(block => block.id === id);
        current_block.state = !current_block.state;

        block_dict.update(dict => {
            dict[collection_id] = grid_blocks;
            return dict;
        });  // explicit update to trigger svelte's reactivity
    }
</script>

<div class="container">
    <!-- The regular grid has an outer grid while the mini version does not. -->
    <div class:outer-flex="{!is_mini}" class:not-allowed="{is_disabled}" class:detector="{is_detector && !is_mini}" class:active="{show_positive && !is_mini}">
        <div class="inner-grid" class:mini="{is_mini}" class:detector="{is_detector && is_mini}" class:active="{show_positive && is_mini}">
            {#each grid_blocks.filter(block_filter_func) as block (block.id)}
                <div class="block" style="background-color: var(--{block.color}); grid-area: {block.letter};"
                class:mini="{is_mini}" class:disabled="{is_disabled}"
                in:receive="{{key: key_prefix.concat(String(block.id))}}" out:send="{{key: key_prefix.concat(String(block.id))}}"
                on:click={() => click_block(block.id)}>
                    <b>{block.letter}</b>
                </div>
            {/each}
        </div>
    </div>

    <!-- Overlay for showing the detector response -->
    {#if is_detector && use_overlay} 
        {#if show_positive}
            <div class="overlay not-allowed" class:mini="{is_mini}">    
                Activated!
            </div>
        {:else if show_negative}
            <div class="overlay not-allowed" class:mini="{is_mini}">   
                Nothing happened.
            </div>
        {/if}
    {/if}
</div>
    

<style>
    .outer-flex {
        min-height: var(--block-outer-length);
        width: var(--block-outer-length);
        margin: var(--block-outer-margin);
        
        border-radius: var(--container-border-radius);
        box-shadow: var(--container-box-shadow);

        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    }

    .inner-grid {
        /* enough space for 3x3 blocks */
        width: calc(3*(var(--block-length) + 2*var(--block-margin)));
        height: calc(3*(var(--block-length) + 2*var(--block-margin)));

        /* 3x3 grid that blocks can be placed into according to their letter label */
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        grid-template-areas: 
        "A B C"
        "D E F"
        "G H I";
    }

    .inner-grid.mini {
        /* enough space for 3x3 mini blocks */
        width: calc(3*(var(--mini-block-length) + 2*var(--mini-block-margin)));
        height: calc(3*(var(--mini-block-length) + 2*var(--mini-block-margin)));

        border: solid;
        border-color: var(--light-gray);
        border-radius: var(--container-border-radius);
        
        flex-shrink: 0;
    }

    .block {
        width: var(--block-length);
        height: var(--block-length);
        margin: var(--block-margin);
        border-radius: var(--block-margin);

        cursor: pointer;

        color: var(--background-color);
        font-size: 2rem;
        /* center text */
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .block.mini {
        width: var(--mini-block-length);
        height: var(--mini-block-length);
        margin: var(--mini-block-margin);
        border-radius: var(--block-margin);
        font-size: 1rem;
    }

    .block.disabled {
        pointer-events: none;
    }

    .detector {
        background-image: url("../images/cogwheel.svg");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 80%;
    }

    .detector.active {
        background-color: var(--active-color);
    }

    /* Overlay styling is adapted from https://www.w3schools.com/howto/howto_css_image_overlay_title.asp */
    .container {
        position: relative;
    }

    .overlay {
        position: absolute;
        top: var(--block-outer-margin);
        right: var(--block-outer-margin);
        bottom: var(--block-outer-margin);
        left: var(--block-outer-margin);
        
        border-radius: var(--container-border-radius);

        background: rgba(255, 255, 255, 0.1);  /* almost see through, provides contrast for the black overlay text */
        transition: .5s ease;
        z-index: 10;  /* on top */

        display: flex;
        justify-content: center;
        align-items: center;

        text-align: center;
        font-size: x-large;
        font-weight: bold;
    }

    .overlay.mini {
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        font-size: small;
    }

    .outer-flex.not-allowed, .overlay.not-allowed {
        cursor: not-allowed;
    }
</style>