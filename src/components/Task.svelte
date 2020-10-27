<!-- 
    This Task component runs a behavioral task where participants actively learn the underlying causal relationships by
    interacting with a number of different blocks. They can click on the blocks to turn them on (true) or off (false), and
    they can press the test button to observe whether their combination of block states (on/off) will cause an "activation".
    An activation is indicated by a change in the background color, where the background is called the "detector" in the code.
    The task ends when a time limit is reached or when the participant has found all possible activation combinations.

    This Task component accepts three Svelte props:
    * activation: Lambda function that represents the underlying causal relationship. It can have any number of arguments.
    * time_limit_seconds: Number of seconds before the task ends.
-->

<!-- TODO: update description -->
<!-- TODO: label detector on UI -->

<script>    
    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js
    export let activation;  // lambda function that represents the causal relationship
    export let time_limit_seconds;  // time limit in seconds
    
    // [0, 1) float that represents the probability of the blicket detector **not** lighting up when activation=true,
    // defaults to 0
    export let noise = 0;
    
    // array of bit strings representing animations to play for the participant (without allowing the participant to interact with the blocks),
    // defaults to null
    export let replay_sequence = null;

    // Imports
    import BlockGrid from './BlockGrid.svelte';
    import CenteredCard from './CenteredCard.svelte';
    import { available_features, block_dict, available_ids } from '../modules/experiment_stores.js';
    import { flip } from 'svelte/animate';
    import { receive } from '../modules/crossfade.js';
    import { fade } from 'svelte/transition';
    import { getBlockCombos } from '../modules/bitstring_to_blocks.js';

    // Constants
    const ACTIVATION_TIMEOUT_MS = 750;  // duration of the background's activation in milliseconds
    const COUNT_DOWN_INTERVAL_MS = 1000;  // milliseconds passed to setInterval, used for counting down until the time limit
    const FLIP_DURATION_MS = 300;  // duration of animation in milliseconds

    // milliseconds passed to setInterval, used for replaying block animations,
    // make sure this is sufficiently larger than the crossfade duration
    const ANIMATION_INTERVAL_MS = 750;

    // Check that the number of arguments to `activation` is supported by the available colors
    if (activation.length > Math.floor($available_features.length)) {
        throw "The task causal function has too many arguments/blocks! We don't have enough distinct colors.";
    }

    // Initialize variables
    let blocks = [];  // initialize an array of block objects
    // get the first n available block ids, where n=activation.length and remove these block ids from available_ids
    let id_arr = $available_ids.splice(0, activation.length);
    for (let i=0; i < activation.length; i++) {
        // randomly assign ids without replacement
        // this id corresponds to the argument position for the `activation` function
        let id_dex = Math.floor(Math.random() * id_arr.length);
        let id = id_arr[id_dex];
        id_arr = id_arr.filter(x => x !== id);  // remove the selected id

        blocks.push({
            id: id,  // random
            state: false,  // init to false
            // get surface features from `experiment_store.js`
            color_num: $available_features[i].color_num,
            letter: $available_features[i].letter
        });
    }
    $available_features.splice(0, activation.length);  // remove the used features

    block_dict.update(dict => {
        dict[collection_id] = blocks;
        return dict;
    });

    let count_down_interval = setInterval(countDownSeconds, COUNT_DOWN_INTERVAL_MS);  // start the count down
    let time_up = false;  // whether the time limit has been reached
    let detector_is_active = false;  // state of the detector
    let disable_all = false;  // when true, participants cannot interact with buttons
    // all block combinations that the participant has tried; use arrays to maintain order
    let all_bit_combos = [];  // list of bit strings
    let all_block_combos = [];  // list of lists of block objects

    // Click handler functions
    async function test() {
        // Test whether the blocks in the detector (i.e. blocks with state=true) will cause an activation

        // copy the array of block objects and sort by the randomly assigned id
        let blocks_copy = [...$block_dict[collection_id]];
        blocks_copy.sort((a, b) => a.id - b.id);

        // the randomly assigned id then becomes the argument position in `activation`
        let block_states = blocks_copy.map(block => block.state)
        if (activation(...block_states)) {
            // TODO: different color backgrounds should be different combos --> both are shown to the participant as past attempts
            // don't change the color of the detector with probability noise
            let rand = Math.random();
            if (rand >= noise) {
                // change the detector's background color and turn off button interactions
                detector_is_active = true;
                disable_all = true;

                // wait before returning everything to their default state
                await new Promise(r => setTimeout(r, ACTIVATION_TIMEOUT_MS));

                if (!replay_sequence) {  // not a non-interactive replay of block animations
                    // enable button interactions
                    disable_all = false;
                }

                // revert to the default detector background color
                detector_is_active = false;
            }
        }

        // create the bit string representation of the current block states
        let bit_combo = "";  // note that index i in this string corresponds to the block with id=i
        for (let i=0; i < block_states.length; i++) {
            if (block_states[i]) {
                bit_combo = bit_combo.concat("1");
            } else {
                bit_combo = bit_combo.concat("0");
            }
        }
        // store all bit string representations
        all_bit_combos = [bit_combo, ...all_bit_combos];  // add to front

        // copy and append the current block objects to `all_block_combos`
        // note that the copied blocks in `block_combo` are ordered by their id because blocks_copy was sorted by id
        let block_combo = [];
        for (let i=0; i < blocks_copy.length; i++) {
            let obj_copy = Object.assign({}, blocks_copy[i]);
            block_combo.push(obj_copy);
        }
        all_block_combos = [block_combo, ...all_block_combos];  // add to front

        // return all block states back to false
        for (let i=0; i < $block_dict[collection_id].length; i++) {
            $block_dict[collection_id][i].state = false;
        }
    }

    // TODO: remove for prod
    function skip() {
        clearInterval(count_down_interval);
        clearInterval(animation_interval);
        time_up = true;
    }

    // Count down timer
    function countDownSeconds() {
        // Count down in seconds until 0, at which time the task ends
        if (time_limit_seconds == 0) {
            // the time limit has been reached --> end the task (see the markup)
            clearInterval(count_down_interval);
            time_up = true;
        }
        
        time_limit_seconds = Math.max(time_limit_seconds - 1, 0);
    }

    // If given a replay_sequence array, let the participant watch a non-interactive replay of block animations
    if (replay_sequence) {
        clearInterval(count_down_interval);
        disable_all = true;

        // derive block combinations from the bit strings in replay_sequence
        var replay_block_combos = getBlockCombos(replay_sequence, blocks);
        // this is an array of arrays of (copied) block objects, where each nested array of block objects is sorted by block id

        // filter each nested array to only contain blocks with state=true
        for (let i=0; i < replay_block_combos.length; i++) {
            replay_block_combos[i] = replay_block_combos[i].filter(block => block.state);
        }
        
        // initializing variables for indexing replay_block_combos
        var outer_dex = 0;
        var inner_dex = 0;

        var animation_interval = setInterval(animateReplay, ANIMATION_INTERVAL_MS);
    }

    async function animateReplay() {
        // Animate the blocks and the detector by changing their states and calling the test() function at regular intervals

        if (outer_dex >= replay_block_combos.length) {  // outer_dex out of bound
            clearInterval(animation_interval);
        } else if (inner_dex >= replay_block_combos[outer_dex].length) {  // inner_dex out of bound
            clearInterval(animation_interval);  // clear interval to wait for the async timeout within test()
            test();
            // wait another animation interval before resuming the interval
            await new Promise(r => setTimeout(r, ANIMATION_INTERVAL_MS));
            animation_interval = setInterval(animateReplay, ANIMATION_INTERVAL_MS);

            inner_dex = 0;
            outer_dex += 1;
        } else {
            // change the block state to true for the current inner and outer indices
            let replay_block = replay_block_combos[outer_dex][inner_dex];
            block_dict.update(dict => {
                for (let i=0; i < dict[collection_id].length; i++) {
                    if (dict[collection_id][i].id == replay_block.id) {
                        dict[collection_id][i].state = replay_block.state;
                    }
                }
                return dict;
            })

            inner_dex += 1;
        }
    }

</script>

{#if !time_up}
    <body in:fade="{{duration: 300, delay: 700}}" out:fade="{{duration: 300}}">
        <div class="centering-container">
            <div class="col-container">
                <h2 class:hide="{replay_sequence}">Remaining time: {time_limit_seconds}s</h2>

                <div class="row-container">
                    <!-- In this non-detector grid, display a block only if its state is false -->
                    <BlockGrid collection_id={collection_id} is_mini={false} is_disabled={disable_all} block_filter_func={block => !block.state}
                        key_prefix="interactive" is_detector={false} is_active={false}/>
                    
                    <!-- 
                        The detector changes color when activation=true.
                        Hide the detector (i.e. end the task) when the time limit has been reached or 
                        the participant has found all block combinations that produce the activation.
                    -->
                    <!-- Within the detector, display a block only if its state is true -->
                    <BlockGrid collection_id={collection_id} is_mini={false} is_disabled={disable_all} block_filter_func={block => block.state}
                        key_prefix="interactive" is_detector={true} is_active={detector_is_active}/>
                </div>

                <!-- Button for testing the detector -->
                <button id="test-button" class:hide="{replay_sequence}" disabled="{disable_all}" on:click={test}>Test the blicket machine</button>

                <!-- Show all previously attempted block combinations -->
                <h2>{replay_sequence ? "Their" : "Your"} previous results from the blicket machine:</h2>
                <div class="row-container">
                    <div id="all-combos">
                        <!-- Use `all_block_combos.length - i` in the key because we are adding new block combos to the front of the array -->
                        {#each all_block_combos as block_arr, i (String(all_block_combos.length - i).concat("combo"))}  
                            <div style="margin-right: 0.5rem; border-radius: var(--container-border-radius);"
                            in:receive="{{key: String(all_block_combos.length - i).concat("combo")}}" animate:flip="{{duration: FLIP_DURATION_MS}}">
                                <BlockGrid collection_id={collection_id} is_mini={true} is_disabled={true} block_filter_func={block => block.state} 
                                    copied_blocks_arr={block_arr} key_prefix="prev_combos" is_detector={true} is_active={activation(...block_arr.map(block => block.state))}/>
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- TODO: remove this button for prod -->
                <button on:click={skip}>dev: skip to the next part</button>
            </div>
        </div>
    </body>
{:else}
    <!-- Show when the time limit is reached and forward the continue event upward. -->
    <CenteredCard on:continue>
        {#if replay_sequence}
            <h3 style="text-align: center;">Based on the replay you just watched, the next part is a quiz about blickets and the blicket machine.</h3>
        {:else}
            <h3 style="text-align: center;">Time's up! The next part is a quiz about the blickets and blicket machine you just encountered.</h3>
        {/if}
    </CenteredCard>
{/if}


<style>
    .col-container {
        min-width: 75%;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .row-container {
        width: 100%;
        
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
    }

    #all-combos {
        height: calc(3*(var(--mini-block-length) + 2*var(--mini-block-margin)) + 1rem);
        max-width: calc(2*var(--block-outer-length) + 2*var(--block-outer-margin));
        margin: var(--block-outer-margin);

        flex-basis: calc(2*var(--block-outer-length) + 2*var(--block-outer-margin));

        border-radius: var(--container-border-radius);
        box-shadow: var(--container-box-shadow);

        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;

        overflow: auto;
    }

    h2 {
	    margin: 0;
    }
</style>