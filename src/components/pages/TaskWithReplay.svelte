<script>
    import { dev_mode } from '../../modules/experiment_stores.js';
    // dev_mode.set(true);
    
    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js
    export let activation;  // lambda function that represents the causal relationship
    export let fixed_num_interventions;  // fixed num. interventions
    export let min_time_seconds;  // minimum time before participant can continue
    export let instructions_seconds = $dev_mode ? 3 : 15;  // time in seconds to show the overlay instructions before the task starts

    // array of bit strings representing animations to play for the participant (without allowing the participant to interact with the blocks),
    // defaults to null
    export let replay_sequence = null;  // ["100", "100", "100", "010", "101", "101"];
    export let replay_person_name = "someone";

    // set some default values for convenience during testing, but do this only in dev mode
    if ($dev_mode) {
        if (collection_id === undefined) {
            collection_id = ["TEST_collection"];
        }
        if (activation === undefined) {
            let noise_level = 0.75;
            activation = (arg0) => (arg0 >= 1) ? Math.random() < noise_level : false;
        }
        if (fixed_num_interventions === undefined) {
            fixed_num_interventions = 3;
        }
        
        if (min_time_seconds === undefined) {
            min_time_seconds = 10;
        }
    }

    // Imports
    import GridDetectorPair from '../partials/GridDetectorPair.svelte';
    import BlockGrid from '../partials/BlockGrid.svelte';
    import CenteredCard from '../partials/CenteredCard.svelte';
    import OverlayInstructions from '../partials/OverlayInstructions.svelte';
    import { task_getter, block_dict, task_data_dict, FADE_DURATION_MS, FADE_IN_DELAY_MS } from '../../modules/experiment_stores.js';
    import { Combo } from '../../modules/block_classes.js';
    import { flip } from 'svelte/animate';
    import { receive, CROSSFADE_DURATION_MS } from '../../modules/crossfade.js';
    import { fade } from 'svelte/transition';
    import { onDestroy, tick } from 'svelte';

    onDestroy(() => {
        clearInterval(instructions_interval);
        clearInterval(min_time_interval);
        clearInterval(animation_interval);
    });

    // Constants
    const ACTIVATION_TIMEOUT_MS = 750;  // duration of the background's activation in milliseconds
    const COUNT_DOWN_INTERVAL_MS = 1000;  // milliseconds passed to setInterval, used for counting down until the time limit
    const FLIP_DURATION_MS = 300;  // duration of animation in milliseconds

    // milliseconds passed to setInterval, used for replaying block animations,
    // make sure this is sufficiently larger than the crossfade duration
    const ANIMATION_INTERVAL_MS = 750;

    // Get blocks corresponding to each argument to the `activation` function
    block_dict.update(dict => {
        dict[collection_id] = $task_getter.get(activation.length);
        return dict;
    });

    let instructions_interval = setInterval(countDownSeconds, COUNT_DOWN_INTERVAL_MS);  // start the instructions count down
    let show_instructions = true;
    let min_time_interval;  // count down to when the participant can continue
    let has_ended = false;  // whether this task has ended
    let show_positive_detector = false;  // whether to show a positive response from the detector
    let show_negative_detector = false;  // whether to show a negative response from the detector
    let disable_task = false;  // when true, participants cannot interact with the task (blocks + detector)
    
    // history of all block combinations that the participant has tried; use arrays to maintain order
    let all_block_combos = [];  // list of lists of block objects
    task_data_dict.update(dict => {
        dict[collection_id] = {
            all_combos: [],  // list of Combo objects
            replay_sequence: replay_sequence
        };
        return dict;
    });

    // replay-specific variables:
    let unpress_their_test_button = true;  // use for changing the appearance of the test button during replay
    let disable_replay_cont = true;  // whether the continue button can be clicked on
    let disable_replay_again = true;  // whether the replay again button can be clicked on
    let remaining_replays = 3;  // number of times the replay button can be clicked
    let hide_all_combos = false;  // whether to hide all previous combos

    // Click handler functions
    async function test() {
        // Test whether the blocks in the detector (i.e. blocks with state=true) will cause an activation

        // copy the array of block objects and sort by the randomly assigned id
        let blocks_copy = [...$block_dict[collection_id]];
        blocks_copy.sort((a, b) => a.id - b.id);

        // the randomly assigned id then becomes the argument position in `activation`
        let block_states = blocks_copy.map(block => block.state);

        // change the detector's response and turn off button interactions
        if (activation(...block_states)) {
            show_positive_detector = true;
        } else {
            show_negative_detector = true;
        }
        if (replay_sequence === null) {
            disable_task = true;
        } else {
            unpress_their_test_button = false;
        }

        // wait before returning everything to their default state
        await new Promise(r => setTimeout(r, ACTIVATION_TIMEOUT_MS));

        // create the bitstring representation where character i corresponds to the block with id=i
        let bitstring = block_states.map(state => state ? "1" : "0").join("");
        let combo = new Combo(bitstring);
        if (replay_sequence === null) {  // only record block combinations (for server) on interactive task
            // create and store a Combo object from the current bitstring
            task_data_dict.update(dict => {
                dict[collection_id].all_combos.push(combo);
                return dict;
            });
        }

        // append a deep copy of blocks_copy where states are set according to the bitstring combo
        all_block_combos = [combo.set_block_states(blocks_copy), ...all_block_combos];  // add to front

        // return all block states back to false
        for (let i=0; i < $block_dict[collection_id].length; i++) {
            block_dict.update(dict => {
                dict[collection_id][i].off();
                return dict;
            });
        }

        // wait for crossfade transition
        await new Promise(r => setTimeout(r, CROSSFADE_DURATION_MS));

        if (replay_sequence === null) {
            if (all_block_combos.length < fixed_num_interventions) {
                // enable button interactions only for interactive task when there are interventions left
                disable_task = false;
            }
        } else {
            unpress_their_test_button = true;
        }

        // revert to the default detector background color
        show_positive_detector = false;
        show_negative_detector = false;
    }

    function cont() {
        clearInterval(instructions_interval);
        clearInterval(min_time_interval);
        clearInterval(animation_interval);

        has_ended = true;
    }

    // Count down timer
    function countDownSeconds() {
        if (instructions_seconds > 0) {
            instructions_seconds = Math.max(instructions_seconds - 1, 0);
        } else if (instructions_seconds === 0) {
            clearInterval(instructions_interval);
            show_instructions = false;
            if (replay_sequence) {  // if not null
                animation_interval = setInterval(animateReplay, ANIMATION_INTERVAL_MS);  // start the animation
            } else {
                min_time_interval = setInterval(countDownSeconds, COUNT_DOWN_INTERVAL_MS)  // start the count down
            }
            instructions_seconds = -1;
        } else {
            // Count down in seconds until 0, at which time the participant can continue
            if (min_time_seconds === 0) {
                // the time limit has been reached --> end the task (see the markup)
                clearInterval(min_time_interval);
                min_time_seconds = -1;
            } else {
                min_time_seconds = Math.max(min_time_seconds - 1, 0);
            }
        }
    }
    
    // If given a replay_sequence array, let the participant watch a non-interactive replay of block animations
    if (replay_sequence) {
        disable_task = true;

        // derive block combinations from the bit strings in replay_sequence
        var replay_block_combos = [];
        for (const bitstring of replay_sequence) {
            let combo = new Combo(bitstring);
            let block_combo = combo.set_block_states($block_dict[collection_id]);
            replay_block_combos.push(block_combo);
        }

        // filter each nested array to only contain blocks with state=true
        for (let i=0; i < replay_block_combos.length; i++) {
            replay_block_combos[i] = replay_block_combos[i].filter(block => block.state);
        }
        
        // initializing variables for indexing replay_block_combos
        var outer_dex = 0;
        var animation_interval;
    }

    async function animateReplay() {
        // Animate the blocks and the detector by changing their states and calling the test() function at regular intervals

        if (outer_dex >= replay_block_combos.length) {  // outer_dex out of bound
            clearInterval(animation_interval);
            if (remaining_replays > 0) {
                // allow the participant to replay the animations again
                disable_replay_again = false;
            }

            // allow the participant to continue after the first replay
            disable_replay_cont = false;
        } else {
            // simulataneously change all block states for one combo
            let replay_combo = replay_block_combos[outer_dex];
            block_dict.update(dict => {
                for (let i=0; i < replay_combo.length; i++) {
                    let replay_block = replay_combo[i];

                    for (let j=0; j < dict[collection_id].length; j++) {
                        if (dict[collection_id][j].id == replay_block.id) {
                            dict[collection_id][j].state = replay_block.state;
                        }
                    }
                }
                return dict;
            })

            clearInterval(animation_interval);  // clear interval to wait for the following:
            // wait another animation interval before testing the blicket machine
            await new Promise(r => setTimeout(r, ANIMATION_INTERVAL_MS));
            test();
            // wait another animation interval before resuming the animation interval
            await new Promise(r => setTimeout(r, ANIMATION_INTERVAL_MS));
            animation_interval = setInterval(animateReplay, ANIMATION_INTERVAL_MS);

            outer_dex += 1;
        }
    }

    async function replay_again() {
        // replay the animations again
        outer_dex = 0;
        disable_replay_again = true;
        remaining_replays -= 1;

        // hide the combo grid first to avoid a clunky disappearance from using `all_block_combos = []` only
        hide_all_combos = true;
        await tick();
        
        all_block_combos = [];

        hide_all_combos = false;
        animation_interval = setInterval(animateReplay, ANIMATION_INTERVAL_MS);
    }

   // copy show_positive_detector so that the history of block combos don't change dynamically
   function copy_show_positive_detector() {
       let copy = show_positive_detector
       return copy;
   }

</script>

{#if !has_ended}
    <OverlayInstructions show={show_instructions}>
        <CenteredCard has_button={false}>
            {#if replay_sequence}
                <!-- Capitalize the first letter of replay_person_name for the start of the sentence -->
                <p>{replay_person_name.charAt(0).toUpperCase() + replay_person_name.slice(1)} has been playing the blicket game.</p> 
                <p><b>Can you figure out which blocks are blickets in their game?</b> Remember, only the blicket machine's responses can help you identify blickets.</p>
                <p>A recording of their blicket game starts in <span style="font-size: 1.5rem;">{instructions_seconds}s</span></p>
            {:else}
                <p><b>Can you figure out which blocks are blickets?</b> You will have <b>{fixed_num_interventions} tries</b> to play the blicket game. Remember, only the blicket machine can help you identify blickets.</p>
                <p>The blicket game starts in <span style="font-size: 1.5rem;">{instructions_seconds}s</span></p>
            {/if}
        </CenteredCard>
    </OverlayInstructions>

    {#if !show_instructions}
        <div class="top">
            <span class="info">
                {#if replay_sequence}
                    Recording of {replay_person_name}'s blicket game:                
                {:else}
                    Remaining tries: <b>{fixed_num_interventions - all_block_combos.length}</b>
                    Minimum time: <b>{Math.max(min_time_seconds, 0)}</b>
                {/if}
            </span>
        </div>
    {/if}

    <div class="centering-container" style="margin-top: 3rem;"
    in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}">
        <div class="col-container">
            <GridDetectorPair collection_id={collection_id} is_disabled={disable_task} is_mini={false} key_prefix="task" show_positive_detector={show_positive_detector} show_negative_detector={show_negative_detector}/>

            <!-- Button for testing the detector -->
            <button disabled="{disable_task}" class:unpress="{replay_sequence && unpress_their_test_button}" on:click={test}>
                {#if replay_sequence}
                    Their blicket machine test button
                {:else}
                    Test the blicket machine
                {/if}
            </button>

            <!-- Show all previously attempted block combinations -->
            <h4 style="margin: 0;">{replay_sequence ? "Their" : "Your"} previous (scrollable) results from the blicket machine:</h4>
            <span>Be ready to be quizzed about blickets and the blicket machine.</span>
            <div class="row-container">
                <div id="all-combos">
                    <!-- Use `all_block_combos.length - i` in the key because we are adding new block combos to the front of the array -->
                    {#each all_block_combos as block_arr, i (("combo_").concat(all_block_combos.length - i))}  
                        <div class:invisible={hide_all_combos}
                        in:receive="{{key: ("combo_").concat(all_block_combos.length - i)}}"
                        animate:flip="{{duration: FLIP_DURATION_MS}}">
                            <BlockGrid copied_blocks_arr={block_arr} collection_id={null} is_mini={true} is_disabled={true} use_transitions={false} block_filter_func={block => block.state} is_detector={true}
                                                         show_positive={copy_show_positive_detector()}/>  <!-- copy the primitive value so that it doesn't change dynamically when show_positive_detector changes -->
                        </div>
                    {/each}
                </div>
            </div>

            <div class:hide="{replay_sequence === null}">
                <!-- Replay button -->
                <button disabled="{disable_replay_again}" on:click="{replay_again}">
                    Replay recording ({remaining_replays} {remaining_replays == 1 ? "time" : "times"} remaining)
                </button>
            </div>

            <!-- Continue button -->
            <button disabled="{(min_time_seconds > -1) && (all_block_combos.length < fixed_num_interventions) && disable_replay_cont}" on:click="{cont}">
                Continue to the quiz
            </button>
            <button class:hide="{!$dev_mode}" on:click={cont}>dev: skip</button>
        </div>
    </div>
{:else}
    <!-- Show when the time limit is reached and forward the continue event upward. -->
    <CenteredCard on:continue>
        {#if replay_sequence}
            <h3 style="text-align: center;">Based on the recording you just saw, the next part is a quiz about blickets and the blicket machine.</h3>
        {:else}
            <h3 style="text-align: center;">Time's up! The next part is a quiz about the blickets and blicket machine you just saw.</h3>
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

    .invisible {
        visibility: hidden;
    }

    .top {
		position: fixed;
		top: 0;
		width: 100%;
		z-index: 30;

		display: flex;
		justify-content: center;
    }
    
    .info {
		padding: 0.2rem;
		text-align: center;
        
        background-color: white;
        border-color: var(--medium-gray);
        border-style: none solid solid solid;
        border-radius: 0 0 var(--container-border-radius) var(--container-border-radius);
	}
</style>
