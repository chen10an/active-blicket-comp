<script>
    import { dev_mode } from '../../modules/experiment_stores.js';
    // dev_mode.set(true);

    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js
    
    export let correct_blicket_ratings;  // array of correct blicket ratings
    export let is_last = false;  // whether this is the last quiz before the end of the experiment

    // set some default values for convenience during testing, but do this only in dev mode
    if ($dev_mode) {
        if (correct_blicket_ratings === undefined) {
            correct_blicket_ratings = [10, 0, 0];
        }
        if (collection_id === undefined) {
            collection_id = ["TEST_collection"];
            block_dict.update(dict => {
                dict[collection_id] = $task_getter.get(3);
                return dict;
            });
        }
        // is_last = true;
    }

    // Imports
    import CenteredCard from '../partials/CenteredCard.svelte';
    import TwoPilesAndDetector from '../partials/TwoPilesAndDetector.svelte';
    import Block from '../partials/Block.svelte';
    import { block_dict, task_getter, quiz_data_dict, feedback, FADE_DURATION_MS, FADE_IN_DELAY_MS, current_score, bonus_val, bonus_currency_str } from '../../modules/experiment_stores.js';
    import { Combo, Block as BlockClass } from '../../modules/block_classes.js';
    import { tooltip } from '../../modules/tooltip.js';
    import { long_bonus_time, short_bonus_time, teaching_bonus_val } from '../../condition_configs/all_conditions.js';
    import { fade } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';

    // Return all block states back to false (after Task)
    for (let i=0; i < $block_dict[collection_id].length; i++) {
        block_dict.update(dict => {
            dict[collection_id][i].off();
            return dict;
        });
    }

    // Constants
    const ACTIVATION_ANSWER_OPTIONS = ["Yes", "No"];
    const BLICKET_ANSWER_OPTIONS = [
        {val: null, text: "Please select an answer."},
        {val: 10, text: "10 — Definitely a blicket."}, 
        {val: 9, text: "9"}, 
        {val: 8, text: "8 — Almost sure this is a blicket."}, 
        {val: 7, text: "7"}, 
        {val: 6, text: "6"}, 
        {val: 5, text: "5 — Equally likely to be a blicket or not."}, 
        {val: 4, text: "4"},
        {val: 3, text: "3"},
        {val: 2, text: "2 — Almost sure this is NOT a blicket."},
        {val: 1, text: "1"},
        {val: 0, text: "0 — Definitely NOT a blicket."}
    ]
    
    // Initialize and store variables
    let scrollY = 0;
    let page_num = 1;  // keep track of a multipage quiz
    let max_page_num = is_last ? 3 : 2;

    // Store participant answers
    quiz_data_dict.update(dict => {
        dict[collection_id] = {
            blicket_answer_combo: "",
            blicket_rating_groups: [],
            correct_blicket_ratings: correct_blicket_ratings,
            blicket_rating_scores: [],
            teaching_ex: [],
            free_response_0: "",
            free_response_1: ""
        };

        return dict;
    });

    // TODO: remove
    console.log(collection_id)
    console.log($block_dict)
    $: console.log($quiz_data_dict[collection_id])

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
            dict[collection_id].teaching_ex.push({detector_state: false, blocks:[]});
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

            // TODO: check teaching question

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
        scrollY = 0;  // scroll to the top

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
            
            // add sum of blicket rating scores to current running score
            current_score.update(score => score += $quiz_data_dict[collection_id].blicket_rating_scores.reduce((x,y) => x+y, 0));
        } else if (page_num === 2) {
        
            // TODO: edit the below code to store copy of blicket_nonblicket_piles blocks to maintain the participant's chosen block states
            // copy the array of block objects and sort by the randomly assigned id
            let blocks_copy = [...$block_dict[collection_id]];
            blocks_copy.sort((a, b) => a.id - b.id);
            // the randomly assigned id then becomes the argument position in `activation`
            let block_states = blocks_copy.map(block => block.state);
            // record the combo representation of the participant's blicket answers
            quiz_data_dict.update(dict => {
                dict[collection_id].blicket_answer_combo = new Combo(block_states.map(state => state ? "1" : "0").join(""));
                return dict;
            });

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

<div in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}">
    <CenteredCard is_large={true} has_button={false}>
        <h2>Quiz about Blickets and the Blicket Machine (Part {page_num}/{max_page_num})</h2>

        {#if page_num === 1}
            <div in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}" class="middle-transition-div">
                <h3>Do you think these blocks are blickets?</h3>
                <p style="margin-bottom: 3em;">The closer you are to the correct rating (10 for blickets, 0 for non-blickets), the bigger your bonus will be (up to {$bonus_currency_str}{$bonus_val} per rating). The correct ratings will be revealed at the end of the study and your corresponding bonus will be sent to you <b>within {short_bonus_time}</b>.</p>
                
                <!-- Iterate over $block_dict, which orders blocks alphabetically -->
                {#each $block_dict[collection_id] as block, i}
                    <div class="qa">
                        <Block block="{block}" is_mini="{false}" is_disabled="{true}"/> 
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
            <div in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}" class="middle-transition-div">
                <p>Only the question "How would you teach others about the blicket machine?" can award a bonus, but we hope you'll sincerely answer all questions.</p>
                
                <h3>How do you think the blicket machine works?</h3>
                <textarea bind:value={$quiz_data_dict[collection_id].free_response_0}></textarea>

                <h3>What was your strategy for figuring out how the blicket machine works?</h3>
                <textarea bind:value={$quiz_data_dict[collection_id].free_response_1}></textarea>

                <h3>How would you teach others about the blicket machine?</h3>
                <p>We are asking you to help us give 5 examples to help other people understand how the blicket machine works. In each example, you can choose to add</p>
                <div class="block-key"><Block block={new BlockClass(-1, false, "dark-gray", "&#9734;", -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /> blickets</div>
                <p>and</p>
                <div class="block-key"><Block block={new BlockClass(-1, false, "light-gray", "", -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /> plain blocks (not blickets) </div>
                <p>to a blicket machine. You can then choose whether that blicket machine should be <span style="background: var(--active-color); padding: 0 0.3rem;">activated</span> or deactivated.</p>
                
                <p>We will show your examples to other people after the study. They will also know which blocks are blickets (star) or not (plain). Your bonus will be calculated based on how well they understand the blicket machine (up to {$bonus_currency_str}{teaching_bonus_val}) <span class="info-box" title="Given your examples, two other people will choose from 8 options about how the blicket machine works. If one person chooses the correct option, your bonus is {$bonus_currency_str}{+(teaching_bonus_val/2).toFixed(3)}; if both choose the correct option, your bonus is {$bonus_currency_str}{teaching_bonus_val}." use:tooltip>hover/tap me for details</span>. This process may take some time: we will send you your bonus <b>within {long_bonus_time}</b>.</p>
                
                {#each $quiz_data_dict[collection_id].teaching_ex as ex, i}
                    <div class="qa">
                        <TwoPilesAndDetector collection_id="piles_{i}" num_on_blocks_limit={$block_dict[collection_id].length} bind:show_positive_detector={ex.detector_state}/>
                    </div>
                {/each}
            </div>

        {:else if is_last}
            <div in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}" class="middle-transition-div">
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
</div>

<style>
    .middle-transition-div {
        width: 100%;
        height: 100%;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    
    .qa {
        border-radius: var(--container-border-radius);
        box-shadow: var(--container-box-shadow);
        margin: 0.5rem;
        padding: 0.5rem;

        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .answer-options {
        margin-top: 0.1rem;

        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
    }

    .block-key {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
    }

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
