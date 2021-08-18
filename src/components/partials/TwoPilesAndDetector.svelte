<script>
    // Props
    // parent component should bind these:
    export let show_positive_detector = null;  // whether the participant wants the detector to show a positive response, null represents the unanswered state
    export let blicket_nonblicket_combo = "";  // string for a special kind of combo that shows the blickets ("*") and nonblickets (".") currently on the detector, indexed by the order the participant placed them on the detector (rather than block id, as used in regular combos)
    export let test_is_pressed = false;  // whether the test button is currently pressed on the testable blicket machine (i.e., when blicket_activation is a lambda function)
    
    // input
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js
    export let num_on_blocks_limit;  // limit on the _combined_ number of blickets and nonblickets that the participant can put onto the detector
    export let is_disabled;  // boolean for disabling clicking on the piles and detector

    // note that this (only blicket states as input) is DIFFERENT from the `activation` (all block states as input) function used elsewhere
    export let blicket_activation = null;  // when this is set to a lambda function (input: blicket binary states; output: true/false), it is used to calculate the machine's response (as opposed to letting the participant select pos/neg machine response)
    
    export let test_button_html = "Test the blicket machine";  // html to display on the test button when `blicket_activation` is a lambda function

    import { dev_mode } from '../../modules/experiment_stores.js';
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
    import { block_dict, make_dummy_blicket, make_dummy_nonblicket} from '../../modules/experiment_stores.js';
    import { TOTAL_CSS_GRID_AREAS } from '../../modules/block_classes.js';
    import { CROSSFADE_DURATION_MS } from '../../modules/crossfade.js';
    import BlockGrid from './BlockGrid.svelte';
    import Block from './Block.svelte';

    // the combined num of blickets and nonblickets should not exceed the max number off blocks that can be placed on a detector / css grid
    console.assert(num_on_blocks_limit <= TOTAL_CSS_GRID_AREAS); 

    // Constants:
    // [0..NONBLICKET_START_DEX) in block_dict contains blickets; [NONBLICKET_START_DEX..NON_BLICKET_START_DEX*2) in block_dict contains nonblickets
    const NONBLICKET_START_DEX = TOTAL_CSS_GRID_AREAS+1;
    // there are a total of TOTAL_CSS_GRID_AREAS+1 (above num_on_blocks_limit) blocks for each blicket/nonblicket pile, allowing the first (index 0) block in each pile to be used as the button for moving that pile's blocks to the detector
    const ACTIVATION_TIMEOUT_MS = 500;  // duration of the background's activation in milliseconds

    // if they don't exist, create one collections of blocks for blickets AND nonblickets
    if (!(collection_id in $block_dict)) {
        let blicket_pile = []
        let nonblicket_pile = []
        
        for (let i=0; i < NONBLICKET_START_DEX; i++) {
            // visually separate blickets vs nonblickets via different gray-scale colors; the hardcoded color strings need to correspond to css variable names that contain the color
            // one blicket OR one nonblicket can fill a position on the detector (0-8)
            // except the first blicket/nonblicket which has position -1; this first block is used as a button for moving other blocks in their pile onto the detector
            let blicket = make_dummy_blicket(i, i-1);
            let nonblicket = make_dummy_nonblicket(i+NONBLICKET_START_DEX, i-1);
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
    let already_set_hide_timeout = false;
    function to_next_detector_pos(block) {
        // stop adding if the limit has been reached
        if (next_detector_pos >= num_on_blocks_limit) {
            hide_limit_warning = false;

            // hide warning again after timeout, without allowing overlapping timeouts
            if (!already_set_hide_timeout) {
                already_set_hide_timeout = true;
                
                setTimeout(function() {
                    hide_limit_warning = true;
                    already_set_hide_timeout = false;
                }, 3000);
            }
            
            return;
        }

        // only the first block of each pile should call this function when clicked
        console.assert(block.id === 0 || block.id === NONBLICKET_START_DEX)
        
        // put block at the right position onto the detector
        if (block.id === 0) {
            // show the blicket at next_detector_pos
            $block_dict[collection_id].filter(block => block.id < NONBLICKET_START_DEX && block.position === next_detector_pos)[0].flip();

            blicket_nonblicket_combo += "*";
        } else if (block.id === NONBLICKET_START_DEX) {
            // show the nonblicket at next_detector_pos
            $block_dict[collection_id].filter(block => block.id >= NONBLICKET_START_DEX && block.position === next_detector_pos)[0].flip();

            blicket_nonblicket_combo += ".";
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
        blicket_nonblicket_combo = "";
        hide_limit_warning = true;
    }

    let show_negative_detector = false;
    async function test() {
        // Test whether the blocks in the detector (i.e. blocks with state=true) will cause an activation
        
        // copy the array of block objects and sort by the id
        let blocks_copy = [...$block_dict[collection_id]];
        blocks_copy.sort((a, b) => a.id - b.id);

        // only use blicket blocks for determining activation
        let blickets = blocks_copy.slice(1, NONBLICKET_START_DEX);
        // exclude the 0th blicket because it's used as a button
        
        // use blicket states as input to `blicket_activation`
        let blicket_states = blickets.map(block => block.state);
        
        // change the detector's response and turn off button interactions
        let activates_detector = blicket_activation(...blicket_states);
        if (activates_detector) {
            show_positive_detector = true;
        } else {
            show_negative_detector = true;
        }
        
        is_disabled = true;

        // set to true only after blicket_nonblicket_combo and show_positive_detector reflect their most current values; this is so that a parent component can bind these values and use them when test_is_pressed=true
        test_is_pressed = true;

        // wait before returning everything to their default state
        await new Promise(r => setTimeout(r, ACTIVATION_TIMEOUT_MS));

        // set back to false before resetting/changing blicket_nonblicket_combo and show_positive_detector values; this is so that these values are stable whenever test_is_pressed=true
        test_is_pressed = false;

        // revert to the default detector background color
        show_positive_detector = false;
        show_negative_detector = false;
        
        // return all block states back to false
        combined_reset();

        // wait for crossfade transition
        await new Promise(r => setTimeout(r, CROSSFADE_DURATION_MS));

        is_disabled = false;
    }
</script>

<div class="row-container">
    <div class="col-container" >
        <div class="col-container" style="user-select: none;">
            <button class="block-button" disabled="{is_disabled}" on:click={to_next_detector_pos($block_dict[collection_id][0])}><Block block={$block_dict[collection_id][0]} is_mini={true} is_disabled={true} use_transitions="{false}"/></button>
            
            <button class="block-button" disabled="{is_disabled}" on:click={to_next_detector_pos($block_dict[collection_id][NONBLICKET_START_DEX])}><Block block={$block_dict[collection_id][NONBLICKET_START_DEX]} is_mini={true} is_disabled={true} use_transitions="{false}" /></button>
        </div>

        <button disabled="{is_disabled}" on:click={combined_reset} style="min-width: var(--mini-block-length); justify-self: flex-end;">
            Reset
        </button>
    </div>

    <div class="col-container">
        <BlockGrid collection_id="{collection_id}" is_mini="{true}" is_disabled="{true}" block_filter_func="{block => block.state}" is_detector="{true}" show_positive="{show_positive_detector}" show_negative="{show_negative_detector}" use_transitions="{true}" use_overlay="{typeof blicket_activation === 'function'}" />

        {#if typeof blicket_activation === 'function'}
            <!-- the detector response is testable via the blicket_activation lambda function -->

            <button disabled="{is_disabled}" on:click={test}>
                {@html test_button_html}
            </button>
            
        {:else}
            <!-- let the participant choose the detector response -->
            <div style="margin: 1rem 0;">
                <label><input type="radio" value="{true}" bind:group="{show_positive_detector}" ><span style="background: var(--active-color); padding: 0 0.3rem;">Activate</span></label>
                <br>
                <label><input type="radio" value="{false}" bind:group="{show_positive_detector}" >Do Nothing</label>
            </div>
        {/if}
    </div>
</div>

<div class="row-container">
    <p class:hide="{hide_limit_warning}" style="color: red; margin: 0; font-size: 0.8rem;">You've reached the max number ({num_on_blocks_limit}) of blickets and plain blocks. You can press "Reset" to start over.</p>
</div>

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

