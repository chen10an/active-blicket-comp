<script>
    // Props
    export let num_on_blocks_limit;  // limit on the _combined_ number of blickets and nonblickets that the participant can put onto the detector
    export let is_disabled;  // boolean for disabling clicking on the piles and detector

    // set some default values for convenience during testing, but do this only in dev mode
    if ($dev_mode) {
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

    const COMBINED_COLLECTION_ID = "blicket_nonblicket_pile";
    // [0..NONBLICKET_START_DEX) in block_dict contains blickets; [NONBLICKET_START_DEX..NON_BLICKET_START_DEX*2) in block_dict contains nonblickets
    const NONBLICKET_START_DEX = TOTAL_CSS_GRID_AREAS+1;
    // there are a total of TOTAL_CSS_GRID_AREAS+1 (above num_on_blocks_limit) blocks for each blicket/nonblicket pile, allowing the first (index 0) block in each pile to be used as the button for moving that pile's blocks to the detector

    // if they don't exist, create one collections of blocks for blickets AND nonblickets
    if (!(COMBINED_COLLECTION_ID in $block_dict)) {
        let blicket_pile = []
        let nonblicket_pile = []
        
        for (let i=0; i < NONBLICKET_START_DEX; i++) {
            // visually separate blickets vs nonblickets via different gray-scale colors; the hardcoded color strings need to correspond to css variable names that contain the color
            // one blicket OR one nonblicket can fill a position on the detector (0-8)
            // except the first blicket/nonblicket which has position -1; this first block is used as a button for moving other blocks in their pile onto the detector
            let blicket = new BlockClass(i, false, "light-gray", "", i-1);
            let nonblicket = new BlockClass(i+NONBLICKET_START_DEX, false, "dark-gray", "", i-1);
            blicket_pile.push(blicket);
            nonblicket_pile.push(nonblicket);
        }
        
        block_dict.update(dict => {
            dict[COMBINED_COLLECTION_ID] = blicket_pile.concat(nonblicket_pile);
            return dict;
        });
    }

    // track where the next block (from either the blicket or nonblicket pile) should go next on the detector
    let next_detector_pos = 0;
    // whether to hide a warning that no more blickets/nonblickets can be added to the detector
    let hide_limit_warning = true;

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
                $block_dict[COMBINED_COLLECTION_ID].filter(block => block.id < NONBLICKET_START_DEX && block.position === next_detector_pos)[0].flip();
        } else if (block.id === NONBLICKET_START_DEX) {
            $block_dict[COMBINED_COLLECTION_ID].filter(block => block.id >= NONBLICKET_START_DEX && block.position === next_detector_pos)[0].flip();
        }

        next_detector_pos += 1;
        
        block_dict.set($block_dict);  // explicit update to trigger svelte's reactivity
    }

    // let the participant start over for choosing blickets/nonblickets to put on the machine
    function combined_reset() {
        // reset all blickets and nonblickets to the off state
        for (let i=0; i < $block_dict[COMBINED_COLLECTION_ID].length; i++) {
            block_dict.update(dict => {
                dict[COMBINED_COLLECTION_ID][i].off();
                return dict;
            });
        }

        // reset the next detector position and warning
        next_detector_pos = 0;
        hide_limit_warning = true;
    }

</script>

<Block block={$block_dict[COMBINED_COLLECTION_ID][0]} is_mini={false} is_disabled={is_disabled} click={(block) => to_next_detector_pos(block)}/>

<Block block={$block_dict[COMBINED_COLLECTION_ID][NONBLICKET_START_DEX]} is_mini={false} is_disabled={is_disabled} click={(block) => to_next_detector_pos(block)} />

<button disabled="{is_disabled}" on:click={combined_reset}>
    Reset
</button>
<p class:hide="{hide_limit_warning}" style="color: red;">You've reached the maximum number ({num_on_blocks_limit}) of blickets and non-blickets. You can press the "Reset" button to start over.</p>

<BlockGrid collection_id={COMBINED_COLLECTION_ID} is_mini={false} is_disabled={true} block_filter_func={block => block.state} is_detector={false} />

<!-- 
TODO: might need to make this responsive so that the piles and detector are always visible together on the screen
-->
