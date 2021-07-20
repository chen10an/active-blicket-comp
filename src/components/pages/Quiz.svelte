<script>
    import { dev_mode } from '../../modules/experiment_stores.js';
    // dev_mode.set(true);

    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js
    
    export let correct_blicket_ratings;  // array of correct blicket ratings
    export let is_last = false;  // whether this is the last quiz before the end of the experiment

    let page_num = 1;  // keep track of a multipage quiz    
    // set some default values for convenience during testing, but do this only in dev mode
    if ($dev_mode) {
        if (correct_blicket_ratings === undefined) {
            correct_blicket_ratings = [10, 0, 0];
        }
        if (collection_id === undefined) {
            collection_id = ["TEST_level_1"];
            block_dict.update(dict => {
                dict[collection_id] = $task_getter.get(3);
                return dict;
            });
        }

        // page_num = 2;

        // is_last = true;
    }
    let max_page_num = is_last ? 3 : 2;

    // Imports
    import CenteredCard from '../partials/CenteredCard.svelte';
    import TwoPilesAndDetector from '../partials/TwoPilesAndDetector.svelte';
    import Block from '../partials/Block.svelte';
    import { block_dict, task_getter, quiz_data_dict, feedback, FADE_DURATION_MS, FADE_IN_DELAY_MS, raw_current_score, bonus_val, bonus_currency_str, BLICKET_ANSWER_OPTIONS, make_dummy_blicket, make_dummy_nonblicket } from '../../modules/experiment_stores.js';
    import { tooltip } from '../../modules/tooltip.js';
    import { long_bonus_time, short_bonus_time, teaching_bonus_val } from '../../condition_configs/all_conditions.js';
    import { roundMoney } from '../../modules/utilities.js';
    import { fade } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';

    // Return all block states back to false (after Task)
    for (let i=0; i < $block_dict[collection_id].length; i++) {
        block_dict.update(dict => {
            dict[collection_id][i].off();
            return dict;
        });
    }
 
    // Initialize and store variables
    let scrollY = 0;

    // Store participant answers
    quiz_data_dict.update(dict => {
        dict[collection_id] = {
            blicket_rating_groups: [],
            correct_blicket_ratings: correct_blicket_ratings,
            blicket_rating_scores: [],
            teaching_ex: [],
            free_response_0: "",
            free_response_1: ""
        };

        return dict;
    });

    // initialize the stored answers
    for (let i=0; i < $block_dict[collection_id].length; i++) {
        quiz_data_dict.update(dict => {
            dict[collection_id].blicket_rating_groups.push(null);
            dict[collection_id].blicket_rating_scores.push(0);
            return dict;
        });
    }
    // 5 teaching examples
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
        
        if (page_num === 1) {
            let blicket_rating_groups = $quiz_data_dict[collection_id].blicket_rating_groups;
            for (let i=0; i < blicket_rating_groups.length; i++) {
                if (blicket_rating_groups[i] === null) {
                    // one of blicket rating questions has not been answered
                    answered_all = false;
                }
            }
        } else if (page_num === 2) {
            if ($quiz_data_dict[collection_id].free_response_0.length === 0 || $quiz_data_dict[collection_id].free_response_1.length === 0) {
                // one of the free responses is empty
                answered_all = false;
            }

            let teaching_ex = $quiz_data_dict[collection_id].teaching_ex
            for (let i=0; i < teaching_ex.length; i++) {
                if (teaching_ex[i].blicket_nonblicket_combo === "" || teaching_ex[i].detector_state === null) {
                    // one of teaching ex is empty (no blickets/nonblickets placed onto the detector) or one of the detector states have not been chosen to be true/false
                    answered_all = false;
                }
            }

        } else if (page_num === max_page_num && is_last) {
            answered_all = true;
        } else {
            answered_all = false;
        }
    }
    
    // Click handlers

    // event dispatcher for communicating with parent components
    const dispatch = createEventDispatcher();
    function submit_answers() {
        if (page_num === 1) {
            // calculate participant's score for the ith block (ordered by _relative_ block id)
            for (let i=0; i < $quiz_data_dict[collection_id].blicket_rating_groups.length; i++) {

                // participant's rating for the ith block
                let participant_rating = $quiz_data_dict[collection_id].blicket_rating_groups[i];

                // true rating for the same block
                let true_rating = $quiz_data_dict[collection_id].correct_blicket_ratings[i];
                
                quiz_data_dict.update(dict => {
                    if (participant_rating === null) {
                        // did not answer
                        dict[collection_id].blicket_rating_scores[i] = 0;
                    } else {
                        dict[collection_id].blicket_rating_scores[i] = 1 - Math.abs(participant_rating - true_rating)/10;
                    }
                    return dict;
                });
            }
            
            // add sum of blicket rating scores to raw (with precision errors) current running score
            raw_current_score.update(score => score += $quiz_data_dict[collection_id].blicket_rating_scores.reduce((x,y) => x+y, 0));
        } else if (page_num === 2) {
            // escape quotes in free response questions
            quiz_data_dict.update(dict => {
                dict[collection_id].free_response_0 = escape_quotes($quiz_data_dict[collection_id].free_response_0);
                dict[collection_id].free_response_1 = escape_quotes($quiz_data_dict[collection_id].free_response_1);
                return dict;
            });
        } else if (page_num === 3 && is_last) {
            feedback.set(escape_quotes($feedback));
        }

        if (page_num === max_page_num) {
            // tell parent components to move on to the next component
            dispatch("continue");
        } else {
            page_num += 1;  // show next page
            scrollY = 0;  // scroll to the top
        }
    }

    // Helper functions

    // map block ids to their relative (starting from 0) positions
    // e.g., if the current level has ids 3,4,5 then these get mapped to 0,1,2
    // this is so that each id gets a corresponding index in blicket_ratings_groups, correct_blicket_ratings, and blicket_rating_scores, all of which are indexed by _relative_ block id
    let block_ids = $block_dict[collection_id].map(block => block.id);
    let min_id = Math.min(...block_ids);
    function get_rel_id(id) {
        return id - min_id;
    }

    function escape_quotes(str) {
        let ret = str.replaceAll('"', '\\"');
        ret = ret.replaceAll("'", "\\'");
        return ret;
    }

    function skip_validation() {
        answered_all = true;
    }
</script>

<svelte:window bind:scrollY={scrollY}/>

<CenteredCard is_large={true} has_button={false}>
    <h2>Quiz about the Level
        {#if collection_id.toString().includes("level_1")}
            1
        {:else if collection_id.toString().includes("level_2")}
            2
        {/if}
        Game
        (Part {page_num}/{max_page_num})</h2>

    {#if page_num === 1}
        <div in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}" class="col-centering-container">
            <h3>Do you think these blocks are blickets?</h3>
            <p style="margin-bottom: 3rem;">The closer you are to the correct rating (10 for blickets, 0 for non-blickets), the bigger your bonus will be (up to {$bonus_currency_str}{roundMoney($bonus_val)} per rating). The correct ratings will be revealed at the end of the study and your corresponding bonus will be sent <b>within {short_bonus_time}</b>.</p>
            
            <!-- Iterate over $block_dict, which orders blocks alphabetically -->
            {#each $block_dict[collection_id] as block, i}
                <div class="qa">
                    <Block block="{block}" is_mini="{false}" is_disabled="{true}" use_transitions="{false}" /> 
                    <div class="answer-options">
                        <select bind:value={$quiz_data_dict[collection_id].blicket_rating_groups[get_rel_id(block.id)]}>  <!-- store the value in the group/index corresponding to the _relative id_ of the block -->
                            {#each BLICKET_ANSWER_OPTIONS as option}
                                <option value={option.val}>
                                    {option.text}
                                </option>
                            {/each}
                        </select>
                    </div>
                </div>
            {/each}
        </div>
        {:else if page_num === 2}
        <div in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}" class="col-centering-container">
            <p>Only the question "How would you teach others about how the blicket machine works?" can award a bonus, but we hope you'll sincerely answer all questions.</p>
            
            <h3>How do you think the blicket machine (from the level
                {#if collection_id.toString().includes("level_1")}
                    1
                {:else if collection_id.toString().includes("level_2")}
                    2
                {/if}
                game) works?
            </h3>
            <p style="margin-top: 0;">How does the machine respond to blickets? How does it respond to non-blickets?</p>
            <textarea bind:value={$quiz_data_dict[collection_id].free_response_0}></textarea>

            <h3>What was your strategy for figuring out how the blicket machine works?</h3>
            <textarea bind:value={$quiz_data_dict[collection_id].free_response_1}></textarea>

            <h3 style="margin-top: 5rem;">How would you teach others about how the blicket machine works?</h3>
            <p>Based on how you think the level
                {#if collection_id.toString().includes("level_1")}
                    1
                {:else if collection_id.toString().includes("level_2")}
                    2
                {/if} blicket machine works, please give 5 examples to teach other people about this machine.
            </p>
            
            <div class="qa">
                <p style="margin-top: 0;"><b>Setup of an Example</b></p>
                <TwoPilesAndDetector collection_id="{collection_id}_piles_dummy" num_on_blocks_limit="{$block_dict[collection_id].length}" is_disabled="{false}" />
            </div>

            <div>
                <p>In this setup, we are given the knowledge that starred blocks (<span style="display: inline-block;"><Block block={make_dummy_blicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></span>) are blickets and plain blocks (<span style="display: inline-block;"><Block block={make_dummy_nonblicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></span>) are not blickets. With this knowledge, please make examples about the level
                    {#if collection_id.toString().includes("level_1")}
                        1
                    {:else if collection_id.toString().includes("level_2")}
                        2
                    {/if} blicket machine using these buttons:</p>
                <ul style="list-style-type:none;">
                    <li><button class="block-button"><Block block={make_dummy_blicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></button> adds blickets to the machine.</li>
                    <li><button class="block-button"><Block block={make_dummy_nonblicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></button> adds plain blocks (not blickets) to the machine.</li>
                    <li>You can add as many blickets and plain blocks as you like, for a total of <b>at least 1 and at most {$block_dict[collection_id].length}</b>.</li>
                    <li><button style="min-width: var(--mini-block-length);">
                        Reset
                    </button> removes everything from the machine.</li>
                    <li>You can then show whether the level
                        {#if collection_id.toString().includes("level_1")}
                            1
                        {:else if collection_id.toString().includes("level_2")}
                            2
                        {/if} blicket machine should <span style="background: var(--active-color); padding: 0 0.3rem;">Activate</span> or "Do Nothing" in response to the blickets and/or plain blocks on the machine.</li>
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
                    <TwoPilesAndDetector collection_id="{collection_id}_piles_{i}" num_on_blocks_limit="{$block_dict[collection_id].length}" is_disabled="{false}" bind:show_positive_detector="{ex.detector_state}" bind:blicket_nonblicket_combo="{ex.blicket_nonblicket_combo}" />
                </div>
            {/each}
        </div>

        {:else if is_last}
        <div in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}" class="col-centering-container">
            <h3 style="margin-bottom: 0;">Do you have any feedback for us? (Optional)</h3>
            <p>We're at the end of the study and we're interested in hearing your thoughts on how fun/boring the study was, how this website can be improved, or anything else! Thank you in advance :)</p>
            <textarea class:hide="{!is_last}" bind:value={$feedback}></textarea>
        </div>
    {/if}
    <button on:click="{submit_answers}" disabled="{!answered_all}">
        Submit ({page_num}/{max_page_num})
    </button>
    <p class:hide="{answered_all}" style="color: red;">You will be able to submit after answering all questions.</p>
    
    <button class:hide="{!$dev_mode}" on:click="{skip_validation}">dev: skip form validation</button>
</CenteredCard>

<style>
    .info-box {
        border: solid;
        border-color: var(--medium-gray);
	      border-width: 1px;
        box-shadow: var(--container-box-shadow);
        padding: 0 0.5em;

        font-size: 0.8em;
    }

    textarea {
        width: 70%;
        height: 3rem;
    }
</style>
