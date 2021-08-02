<script>
    import { dev_mode } from '../../modules/experiment_stores.js';
    // dev_mode.set(true);
    
    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js
    export let activation;  // lambda function that represents the causal relationship
    export let fixed_num_interventions;  // fixed number of interventions that participant has to perform before moving on
    export let min_time_seconds;  // minimum time before participant can continue

    // set some default values for convenience during testing, but do this only in dev mode
    if ($dev_mode) {
        if (collection_id === undefined) {
            collection_id = ["TEST_level_1"];
        }
        if (activation === undefined) {
            let noise_level = 0.75;
            activation = (arg0, arg1, arg2) => (arg0 >= 1) ? Math.random() < noise_level : false;
        }
        if (fixed_num_interventions === undefined) {
            fixed_num_interventions = 10;
        }
        
        if (min_time_seconds === undefined) {
            min_time_seconds = 10;
        }
    }

    // Imports
    import GridDetectorPair from '../partials/GridDetectorPair.svelte';
    import BlockComboHistory from '../partials/BlockComboHistory.svelte';
    import { task_getter, block_dict, task_data_dict, FADE_DURATION_MS, FADE_IN_DELAY_MS } from '../../modules/experiment_stores.js';
    import { Combo } from '../../modules/block_classes.js';
    import { CROSSFADE_DURATION_MS } from '../../modules/crossfade.js';
    import { tooltip } from '../../modules/tooltip.js';
    import { fade } from 'svelte/transition';
    import { onDestroy } from 'svelte';
    
    // Event dispatcher for communicating with parent components
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();

    onDestroy(() => {
        clearInterval(min_time_interval);
    });

    // Constants
    const ACTIVATION_TIMEOUT_MS = 750;  // duration of the background's activation in milliseconds
    const COUNT_DOWN_INTERVAL_MS = 1000;  // milliseconds passed to setInterval, used for counting down until the time limit

    // Get blocks corresponding to each argument to the `activation` function
    block_dict.update(dict => {
        dict[collection_id] = $task_getter.get(activation.length);
        return dict;
    });

    let min_time_interval = setInterval(countDownSeconds, COUNT_DOWN_INTERVAL_MS)  // count down to when the participant can continue
    let min_time_seconds_copy = min_time_seconds;  // a static copy that won't decrement with min_time_seconds
    let show_positive_detector = false;  // whether to show a positive response from the detector
    let show_negative_detector = false;  // whether to show a negative response from the detector
    let disable_task = false;  // when true, participants cannot interact with the task (blocks + detector)
    
    let is_currently_confident = false;  // whether participant is currently confident they know which blocks are blickets
    let confidence_toggles = [];  // record when the participant toggles is_currently_confident
                               
    // history of all combinations (as Combo objects) that the participant has tried; use arrays to maintain order
    task_data_dict.update(dict => {
        dict[collection_id] = {
            all_combos: [],  // list of Combo objects
            confidence_toggles: confidence_toggles
        };
        return dict;
    });

    $: {
        confidence_toggles = [...confidence_toggles, {is_confident: is_currently_confident, timestamp: Date.now()}];  // record whenever is_currently_confident changes
        
        task_data_dict.update(dict => {
             dict[collection_id].confidence_toggles = confidence_toggles;
            return dict;
        });
    }

    // reactive declaraction of whether the participant can continue to the quiz:
    // wait at least min_time_seconds and make at least fixed_num_interventions interventions
    $: can_cont = (min_time_seconds <= -1) && ($task_data_dict[collection_id].all_combos.length >= fixed_num_interventions)
    
    // Click handler functions
    async function test() {
        // Test whether the blocks in the detector (i.e. blocks with state=true) will cause an activation
        
        // copy the array of block objects and sort by the randomly assigned id
        let blocks_copy = [...$block_dict[collection_id]];
        blocks_copy.sort((a, b) => a.id - b.id);

        // the randomly assigned id then becomes the argument position in `activation`
        let block_states = blocks_copy.map(block => block.state);

        // change the detector's response and turn off button interactions
        let activates_detector = activation(...block_states);
        if (activates_detector) {
            show_positive_detector = true;
        } else {
            show_negative_detector = true;
        }
        
        disable_task = true;

        // wait before returning everything to their default state
        await new Promise(r => setTimeout(r, ACTIVATION_TIMEOUT_MS));

        // create the bitstring representation where character i corresponds to the block with id=i
        let bitstring = block_states.map(state => state ? "1" : "0").join("");
        let combo = new Combo(bitstring, activates_detector);
        // record block combinations (for server) on interactive task
        // create and store a Combo object from the current bitstring
        task_data_dict.update(dict => {
            dict[collection_id].all_combos.push(combo);
            return dict;
        });

        // return all block states back to false
        for (let i=0; i < $block_dict[collection_id].length; i++) {
            block_dict.update(dict => {
                dict[collection_id][i].off();
                return dict;
            });
        }

        // wait for crossfade transition
        await new Promise(r => setTimeout(r, CROSSFADE_DURATION_MS));

        if ($task_data_dict[collection_id].all_combos.length < fixed_num_interventions) {
            // enable button interactions only for interactive task when there are interventions left
            disable_task = false;
        }

        // revert to the default detector background color
        show_positive_detector = false;
        show_negative_detector = false;
    }

    function cont() {
        clearInterval(min_time_interval);

        // Tell parent components to move on to the next quiz
        dispatch("continue");
    }

    // Count down timer
    function countDownSeconds() {
        // Count down in seconds until 0, at which time the participant can continue
        if (min_time_seconds === 0) {
            // the time limit has been reached --> end the task (see the markup)
            clearInterval(min_time_interval);
            min_time_seconds = -1;
        } else {
            min_time_seconds = Math.max(min_time_seconds - 1, 0);
        }
    }
    
</script>

<div class="col-centering-container"
     in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}">
    <h2>Blicket Game Level
        {#if collection_id.toString().includes("level_1")}
            1:
        {:else if collection_id.toString().includes("level_2")}
            2:
        {/if}
        <i>Can you figure out which blocks are blickets?</i>
    </h2>
    <p style="margin: 0;">Please use <b>{fixed_num_interventions} tests</b> on the blicket machine and spend <b>at least {min_time_seconds_copy} seconds</b> in this game.</p>
    <p>Remember, only the blicket machine can help you identify blickets.</p>
    <div class="col-centering-container" style="padding: 0; min-width: 75%; max-width: 100%;">
        <GridDetectorPair collection_id={collection_id} is_disabled={disable_task} is_mini={false} key_prefix="task" show_positive_detector={show_positive_detector} show_negative_detector={show_negative_detector}/>
        
        <!-- Button for testing the detector -->
        <button disabled="{disable_task}" on:click={test}>
            Test the blicket machine <br>
            Remaining tests: <b>{fixed_num_interventions - $task_data_dict[collection_id].all_combos.length}</b>
        </button>


        <h4 style="margin: 0;"> At <u>&nbsp;{fixed_num_interventions - $task_data_dict[collection_id].all_combos.length}&nbsp;</u> remaining tests, are you confident you have identified all blickets?</h4>
        <span class="info-box" title=" You may already be confident before running out of tests, or you may still be unsure after using all tests. Please tell us about this by toggling the Yes/No buttons at any time." use:tooltip>hover/tap me for details</span>
        <div style="margin-top: 0.5rem;">
        <label><input type="radio" bind:group={is_currently_confident} value={true}>Yes</label>
        <label><input type="radio" bind:group={is_currently_confident} value={false}>No</label>
        </div>

        <!-- Show all previously attempted block combinations -->
        <h4 style="margin-bottom: 0;">Your previous (scrollable) results from the blicket machine:</h4>
        
        <BlockComboHistory collection_id="{collection_id}" />
        
        <!-- Continue button -->
        <button disabled="{!can_cont}" on:click="{cont}">
            Continue to the quiz
        </button>
        <p class:hide="{can_cont}" style="color: red;">You will be able to continue after
            {$task_data_dict[collection_id].all_combos.length < fixed_num_interventions ? (fixed_num_interventions - $task_data_dict[collection_id].all_combos.length) + " more tests" : ""}{($task_data_dict[collection_id].all_combos.length < fixed_num_interventions) && (min_time_seconds > -1) ? " and  " : ""}{min_time_seconds > -1 ? Math.max(min_time_seconds, 0) + " more seconds" : ""}.
        </p>

        <button class:hide="{!$dev_mode}" on:click={cont}>dev: skip</button>
    </div>
</div>
