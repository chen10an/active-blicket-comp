<script>
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
    
    // check whether the participant has given an answer to all problems on the current page
    let answered_all = false;
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

<CenteredCard is_large={true} has_button={false}>
    <h2>Blicket Machine {machine_name}</h2>
    <p>TODO: instructions</p>

    <!-- TODO: record combos here -->
    <TwoPilesAndDetector collection_id="{collection_id}_piles_testable" num_on_blocks_limit="{MAX_NUM_BLOCKS}" is_disabled="{false}" activation="{activation}" />

    <h3 style="margin-top: 5rem;">How would you teach others about how the blicket machine works?</h3>
    <!-- TODO: give info about form -->
    <!-- TODO: make an example setup (not the colorful blicket game) that can actually be tested given the correct form -->
    <p>Based on your knowledge about how this blicket machine works, please give 5 examples to teach other people about this machine.</p>

    <div class="qa">
        <p style="margin-top: 0;"><b>Setup of an Example</b></p>
        <TwoPilesAndDetector collection_id="piles_dummy" num_on_blocks_limit="{MAX_NUM_BLOCKS}" is_disabled="{false}" />
    </div>

    <div>
        <p>In this setup, we are given the knowledge that starred blocks (<span style="display: inline-block;"><Block block={make_dummy_blicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></span>) are blickets and plain blocks (<span style="display: inline-block;"><Block block={make_dummy_nonblicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></span>) are not blickets. With this knowledge, please make examples about the blicket machine using these buttons:</p>
        <ul style="list-style-type:none;">
            <li><button class="block-button"><Block block={make_dummy_blicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></button> adds blickets to the machine.</li>
            <li><button class="block-button"><Block block={make_dummy_nonblicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></button> adds plain blocks (not blickets) to the machine.</li>
            <li>You can add as many blickets and plain blocks as you like, for a total of <b>at least 1 and at most {MAX_NUM_BLOCKS}</b>.</li>
            <li><button style="min-width: var(--mini-block-length);">
                Reset
            </button> removes everything from the machine.</li>
            <li>You can then show whether the blicket machine should <span style="background: var(--active-color); padding: 0 0.3rem;">Activate</span> or "Do Nothing" in response to the blickets and/or plain blocks on the machine.</li>
        </ul>
    </div>

    <!-- TODO: change from singular to plural for full exp -->
    <p style="margin-bottom: 2rem;">We will show your examples to another person after the study. They will also know which blocks are blickets (star) or not (plain). Your bonus will be calculated based on how well they understand the blicket machine (up to {$bonus_currency_str}{roundMoney(teaching_bonus_val)})
        <span class="info-box" title="Given your examples, one other person will choose from 8 options about how the blicket machine works. If they choose the correct option, you will receive a bonus of {$bonus_currency_str}{roundMoney(teaching_bonus_val)}." use:tooltip>hover/tap me for details</span>.
        <!-- two other people will choose from 8 options about how the blicket machine works. If one person chooses the correct option, your bonus is {$bonus_currency_str}{roundMoney(teaching_bonus_val/2)}; if both choose the correct option, your bonus is {$bonus_currency_str}{roundMoney(teaching_bonus_val)}. -->
        This process may take some time: we will send you your bonus <b>within {long_bonus_time}</b>.</p>

    {#each $quiz_data_dict[collection_id].teaching_ex as ex, i}
        <div class="qa">
            <p style="margin-top: 0;"><b>Example {i+1}</b></p>
            <TwoPilesAndDetector collection_id="{collection_id}_piles_{i}" num_on_blocks_limit="{MAX_NUM_BLOCKS}" is_disabled="{false}" bind:show_positive_detector="{ex.detector_state}" bind:blicket_nonblicket_combo="{ex.blicket_nonblicket_combo}" />
        </div>
    {/each}
</CenteredCard>
