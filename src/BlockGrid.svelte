<script>
    // Props
    export let is_mini = false;  // whether to show a mini, non-interactive grid
    export let is_disabled = false;  // whether to disable clicking on the blocks
    export let block_filter_func = block => !block.state;  // which blocks to show on the grid
    export let copied_blocks_arr = null;  // array of copied block objects to use inplace of the shared `task_blocks` from `experiment_stores.js`

    // Imports
    import { task_blocks } from './experiment_stores.js';
    import { send, receive } from './crossfade.js';

    // Initialize variables
    let grid_blocks;  // blocks to display on the grid
    $: {
        if (copied_blocks_arr) {  // if not null
            grid_blocks = copied_blocks_arr;
        } else {
            grid_blocks = $task_blocks;  // cross-component (using $) reference to the blocks in `experiment_stores.js`
        }
    }

    // Click handler
    function click_block(id) {
        // When a block is clicked by the participant, reverse its state (true to false; false to true)
        let current_block = grid_blocks.find(block => block.id === id);
        current_block.state = !current_block.state;

        task_blocks.set(grid_blocks);  // explicit assignment to trigger svelte's reactivity
    }
</script>

<div class="block-grid" class:mini="{is_mini}">
    {#each grid_blocks.filter(block_filter_func) as block (block.id)}
        <div class="block" style="background-color: var(--color{block.color_num}); grid-area: {block.letter};"
        class:mini="{is_mini}" class:disabled="{is_disabled}"
        in:receive="{{key: ((is_mini) ? String(block.id).concat("mini") : block.id)}}" out:send="{{key: ((is_mini) ? String(block.id).concat("mini") : block.id)}}"
        on:click={() => click_block(block.id)}>
            <b>{block.letter}</b>
        </div>
    {/each}
</div>

<style>
    .block-grid {
        /* enough space for 3x3 blocks */
        max-width: calc(3*(var(--block-length) + 2*var(--block-margin)));
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

    .block-grid.mini {
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
</style>