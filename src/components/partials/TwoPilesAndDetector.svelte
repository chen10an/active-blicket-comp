<script>
    // Props
    // parent component should bind this:
    export let show_positive_detector = false;  // whether the participant wants the detector to show a positive response
    
    // input
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js
    export let num_on_blocks_limit;  // limit on the _combined_ number of blickets and nonblickets that the participant can put onto the detector
    export let is_disabled;  // boolean for disabling clicking on the piles and detector

    // set some default values for convenience during testing, but do this only in dev mode
    if ($dev_mode) {
        if (collection_id === undefined) {
            collection_id = "TEST_blicket_nonblicket_piles";
        }
        
        if (num_on_blocks_limit === undefined) {
            num_on_blocks_limit = 6;
        }
        
        if (is_disabled === undefined) {
            is_disabled = false;
        }
    }

    // Imports
    import { block_dict, dev_mode } from '../../modules/experiment_stores.js';
    import { Block as BlockClass, TOTAL_CSS_GRID_AREAS } from '../../modules/block_classes.js';
    import BlockGrid from './BlockGrid.svelte';
    import Block from './Block.svelte';

    // the combined num of blickets and nonblickets should not exceed the max number off blocks that can be placed on a detector / css grid
    console.assert(num_on_blocks_limit <= TOTAL_CSS_GRID_AREAS); 

    // [0..NONBLICKET_START_DEX) in block_dict contains blickets; [NONBLICKET_START_DEX..NON_BLICKET_START_DEX*2) in block_dict contains nonblickets
    const NONBLICKET_START_DEX = TOTAL_CSS_GRID_AREAS+1;
    // there are a total of TOTAL_CSS_GRID_AREAS+1 (above num_on_blocks_limit) blocks for each blicket/nonblicket pile, allowing the first (index 0) block in each pile to be used as the button for moving that pile's blocks to the detector

    // if they don't exist, create one collections of blocks for blickets AND nonblickets
    if (!(collection_id in $block_dict)) {
        let blicket_pile = []
        let nonblicket_pile = []
        
        for (let i=0; i < NONBLICKET_START_DEX; i++) {
            // visually separate blickets vs nonblickets via different gray-scale colors; the hardcoded color strings need to correspond to css variable names that contain the color
            // one blicket OR one nonblicket can fill a position on the detector (0-8)
            // except the first blicket/nonblicket which has position -1; this first block is used as a button for moving other blocks in their pile onto the detector
            let blicket = new BlockClass(i, false, "dark-gray", "&#9734;", i-1);
            let nonblicket = new BlockClass(i+NONBLICKET_START_DEX, false, "light-gray", "", i-1);
            blicket_pile.push(blicket);
            nonblicket_pile.push(nonblicket);
        }
        
        block_dict.update(dict => {
            dict[collection_id] = blicket_pile.concat(nonblicket_pile);
            return dict;
        });
    }

    // Initialize variables
    let next_detector_pos = 0;  // track where the next block (from either the blicket or nonblicket pile) should go next on the detector
    let hide_limit_warning = true;  // whether to hide a warning that no more blickets/nonblickets can be added to the detector

    // Click handlers
    // customize block (id 0 or id NONBLICKET_START_DEX) response to clicking so that blocks from the same pile move onto the next position (i.e. next_detector_pos) on the detector
    function to_next_detector_pos(block) {
        // stop adding if the limit has been reached
        if (next_detector_pos >= num_on_blocks_limit) {
            hide_limit_warning = false;
            return;
        }

        // only the first block of each pile should call this function when clicked
        console.assert(block.id === 0 || block.id === NONBLICKET_START_DEX)
        
        // put block at the right position onto the detector
        if (block.id === 0) {
            $block_dict[collection_id].filter(block => block.id < NONBLICKET_START_DEX && block.position === next_detector_pos)[0].flip();
        } else if (block.id === NONBLICKET_START_DEX) {
            $block_dict[collection_id].filter(block => block.id >= NONBLICKET_START_DEX && block.position === next_detector_pos)[0].flip();
        }

        next_detector_pos += 1;
        
        block_dict.set($block_dict);  // explicit update to trigger svelte's reactivity
    }

    // let the participant start over for choosing blickets/nonblickets to put on the machine
    function combined_reset() {
        // reset all blickets and nonblickets to the off state
        for (let i=0; i < $block_dict[collection_id].length; i++) {
            block_dict.update(dict => {
                dict[collection_id][i].off();
                return dict;
            });
        }

        // reset the next detector position and warning
        next_detector_pos = 0;
        hide_limit_warning = true;
    }

    // flip the response (boolean) of the detector
    function flip_detector() {
        show_positive_detector = !show_positive_detector;
    }

</script>

<div class="row-container">
    <div class="col-container">
        <div class="col-container">
            <Block block={$block_dict[collection_id][0]} is_mini={true} is_disabled={is_disabled} click={(block) => to_next_detector_pos(block)}/>
            
            <Block block={$block_dict[collection_id][NONBLICKET_START_DEX]} is_mini={true} is_disabled={is_disabled} click={(block) => to_next_detector_pos(block)} />
        </div>

        <button disabled="{is_disabled}" on:click={combined_reset} style="min-width: var(--mini-block-length); justify-self: flex-end;">
            Reset
        </button>
    </div>

    <div class="col-container">
        <BlockGrid collection_id={collection_id} is_mini={true} is_disabled={true} block_filter_func={block => block.state} is_detector={true} show_positive={show_positive_detector} />
        
        <button disabled="{is_disabled}" on:click="{flip_detector}" >
            {show_positive_detector ? "Deactivate" : "Activate"} the <br> blicket machine
        </button>
    </div>
</div>

<div class="row-container">
    <p class:hide="{hide_limit_warning}" style="color: red; margin: 0;">You've reached the maximum number ({num_on_blocks_limit}) of blickets and non-blickets. You can press the "Reset" button to start over.</p>
</div>

<!-- 
TODO: might need to make this responsive so that the piles and detector are always visible together on the screen
-->
<style>
    .row-container {
        width: 100%;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: center;
        align-items: stretch;
    }
    .col-container {
        margin: 0 var(--mini-block-container-margin);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
    }
</style>

