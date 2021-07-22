<script>
    // Props
    export let collection_id;   // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js

    // Imports
    import BlockGrid from '../partials/BlockGrid.svelte';
    import { block_dict, task_data_dict } from '../../modules/experiment_stores.js';
    import { flip } from 'svelte/animate';
    import { receive } from '../../modules/crossfade.js';

    // Constants
    const FLIP_DURATION_MS = 300;  // duration of animation in milliseconds

    // Derive block combos from stored bitstring combos
    let blocks = $block_dict[collection_id];
    let shown_block_combos = [];  // list of lists of block objects

    let shown_activations = [];
    $: {  // should run whenever $task_data_dict[collection_id].all_combos changes
       let all_combos = $task_data_dict[collection_id].all_combos;

       // deep copy of blocks, where states are set according to the bitstring combo
       let all_block_combos = all_combos.length == 0 ? [] : all_combos.map(x => x.set_block_states(blocks));
       
       let all_activations = all_combos.length == 0 ? [] : all_combos.map(x => x.activates_detector);

       // show the reversed array on the UI
       shown_block_combos = all_block_combos.reverse();
       shown_activations = all_activations.reverse();
       }
</script>

<div class="row-container">
    <div id="all-combos">
        <!-- Use `shown_block_combos.length - i` in the key because we are adding new block combos to the front of the array -->
        {#each shown_block_combos as block_arr, i (("combo_").concat(shown_block_combos.length - i))}  
            <div in:receive="{{key: ("combo_").concat(shown_block_combos.length - i)}}"
                 animate:flip="{{duration: FLIP_DURATION_MS}}">
                <BlockGrid copied_blocks_arr={block_arr} collection_id={null} is_mini={true} is_disabled={true} use_transitions={false} block_filter_func={block => block.state} is_detector={true}
                                             show_positive={shown_activations[i]}/>
            </div>
        {/each}
    </div>
</div>


<style>
    #all-combos {
        height: calc(3*(var(--mini-block-length) + 2*var(--mini-block-margin)) + 1rem);
        max-width: calc(2*var(--block-container-length) + 2*var(--block-container-margin));
        margin: var(--block-container-margin);

        flex-basis: calc(2*var(--block-container-length) + 2*var(--block-container-margin));

        border-radius: var(--container-border-radius);
        box-shadow: var(--container-box-shadow);

        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;

        overflow: auto;
    }

    .row-container {
        width: 100%;
        
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
    }
</style>
