<script>
    // bind
    export let answered_all = false;  // check whether the participant has given an answer to all problems on the current page

    // props
    export let collection_id;
    export let activation;
    export let machine_name;  // shows up on UI to help participant distinguish between the different machines

    import { dev_mode } from '../../modules/experiment_stores.js';
    if ($dev_mode) {
        collection_id = "disj";
        activation = (...blickets) => blickets.reduce((x,y) => x+y, 0) >= 1;
        machine_name = "TEST";
    }
    
    // Imports
    import TwoPilesAndDetector from '../partials/TwoPilesAndDetector.svelte';
    import Block from '../partials/Block.svelte';
    import CenteredCard from '../partials/CenteredCard.svelte';
    import { long_bonus_time, teaching_bonus_val } from '../../condition_configs/all_conditions.js';
    import { make_dummy_blicket, make_dummy_nonblicket, bonus_currency_str, quiz_data_dict } from '../../modules/experiment_stores.js';
    import { roundMoney } from '../../modules/utilities.js';
    import { tooltip } from '../../modules/tooltip.js';
    
    // Store participant answers
    quiz_data_dict.update(dict => {
        dict[collection_id] = {
            teaching_ex: []
        };
        return dict;
    });
    
    // initialize 5 teaching examples
    for (let i=0; i < 5; i++) {
        quiz_data_dict.update(dict => {
            dict[collection_id].teaching_ex.push({detector_state: null, blicket_nonblicket_combo: ""});
            return dict;
        });
    }

    // dynamically update whether participant has answered all teaching examples
    $: {
        // start with true then flip to false depending on the checks below
        answered_all = true;
        
        let teaching_ex = $quiz_data_dict[collection_id].teaching_ex
        for (let i=0; i < teaching_ex.length; i++) {
            if (teaching_ex[i].blicket_nonblicket_combo === "" || teaching_ex[i].detector_state === null) {
                // one of teaching ex is empty (no blickets/nonblickets placed onto the detector) or one of the detector states have not been chosen to be true/false
                answered_all = false;
            }
        }
    }
    
    // Constants
    let MAX_NUM_BLOCKS = 6;

    // Variables
</script>

<h2>Blicket Machine {machine_name}</h2>

<p>Here is Blicket Machine {machine_name}. It activates when <b>at least one blicket <span style="display: inline-block;"><Block block={make_dummy_blicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></span></b> is placed on the machine. It doesn't matter whether there are plain (non-blicket) blocks <span style="display: inline-block;"><Block block={make_dummy_nonblicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></span> on the machine. You can test Blicket Machine {machine_name} to confirm how it works:</p>
<!-- TODO: record combos here -->
<TwoPilesAndDetector collection_id="{collection_id}_piles_testable" num_on_blocks_limit="{MAX_NUM_BLOCKS}" is_disabled="{false}" activation="{activation}" />

<h3>Please give 5 examples to teach other people about how Blicket Machine {machine_name} works:</h3>
<p>Now <b>you can choose</b> whether the blicket machine should <span style="background: var(--active-color); padding: 0 0.3rem;">Activate</span> or "Do Nothing" in response to the blickets and/or plain blocks on the machine.</p>

<div class="qa-container">
    {#each $quiz_data_dict[collection_id].teaching_ex as ex, i}
        <div class="qa">
            <p style="margin-top: 0;"><b>Example {i+1}</b></p>
            <TwoPilesAndDetector collection_id="{collection_id}_piles_{i}" num_on_blocks_limit="{MAX_NUM_BLOCKS}" is_disabled="{false}" bind:show_positive_detector="{ex.detector_state}" bind:blicket_nonblicket_combo="{ex.blicket_nonblicket_combo}" />
        </div>
    {/each}
</div>

<style>
    .qa-container {
        border: solid;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
    }
</style>
