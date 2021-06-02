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
    import { Block, TOTAL_CSS_GRID_AREAS } from '../../modules/block_classes.js';
    import BlockPile from './BlockPile.svelte';
    import BlockGrid from './BlockGrid.svelte';

    // the combined num of blickets and nonblickets should not exceed the max number off blocks that can be placed on a detector / css grid
    console.assert(num_on_blocks_limit <= TOTAL_CSS_GRID_AREAS); 

    const COMBINED_COLLECTION_ID = "blicket_nonblicket_pile";
    // [0..NONBLICKET_START_DEX) in block_dict contains blickets; [NONBLICKET_START_DEX..NON_BLICKET_START_DEX*2) in block_dict contains nonblickets
    const NONBLICKET_START_DEX = TOTAL_CSS_GRID_AREAS+1;
    // there are a total of TOTAL_CSS_GRID_AREAS+1 (above num_on_blocks_limit) blocks for each blicket/nonblicket pile so that the participant never sees the empty "bottom" of the pile

    // if they don't exist, create one collections of blocks for blickets AND nonblickets
    // although blickets and nonblickets will become separate piles (via the BlockPile component)
    if (!(COMBINED_COLLECTION_ID in $block_dict)) {
        let blicket_pile = []
        let nonblicket_pile = []
        
        for (let i=0; i < NONBLICKET_START_DEX; i++) {
            // visually separate blickets vs nonblickets via different gray-scale colors; the hardcoded color strings need to correspond to css variable names that contain the color
            // note that the position is -1, which is just the special "marker" I use for indicating that all blocks are going to overlap in position (the BlockPile component expects blocks that all have position=-1)
            let blicket = new Block(i, false, "light-gray", "", -1);
            let nonblicket = new Block(i+NONBLICKET_START_DEX, false, "dark-gray", "", -1);
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

    // customize block response to clicking so that clicked blocks move from their pile onto the next position (i.e. next_detector_pos) on the detector
    function to_next_detector_pos(block) {
        // When a block is clicked by the participant, reverse its state (true to false; false to true)
        console.log(`you clicked on block ${block.id}`)
        block.flip();

        // **Custom Part***
        if (block.state) {
            // after flip, block goes on the detector
            block.position = next_detector_pos;  // a copy of next_detector_pos
            next_detector_pos += 1;
        } else {
            // after flip, block goes off the detector
            block.position = -1;
            next_detector_pos -= 1;
        }
        
        block_dict.set($block_dict);  // explicit update to trigger svelte's reactivity
        console.log(block);
        console.log($block_dict);
    }
</script>

<BlockPile collection_id={COMBINED_COLLECTION_ID} start_dex=0 end_dex={NONBLICKET_START_DEX} block_click_func={(block) => to_next_detector_pos(block)} is_disabled={is_disabled} key_prefix="two_piles_and_detector" />
<BlockPile collection_id={COMBINED_COLLECTION_ID} start_dex={NONBLICKET_START_DEX} end_dex={NONBLICKET_START_DEX*2} block_click_func={(block) => to_next_detector_pos(block)} is_disabled={is_disabled} key_prefix="two_piles_and_detector" />

<BlockGrid collection_id={COMBINED_COLLECTION_ID} is_mini={false} is_disabled={is_disabled} block_filter_func={block => block.state} is_detector={false} key_prefix="two_piles_and_detector" />

<!-- TODO: combine both piles under one collection so that they work with the grid -->

<!-- 
TODO: might need to make this responsive so that the piles and detector are always visible together on the screen
-->
