<script>
    import { dev_mode } from '../../modules/experiment_stores.js';
    // dev_mode.set(true);

    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js
    // quiz examples are specified using bit strings, where the ith index in the string corresponds to the block with id=i
    export let quiz_bit_combos;
    export let score_ith_combo;
    export let activation; // lambda function that represents the causal relationship
    export let is_last = false;  // whether this is the last quiz before the end of the experiment

    // set some default values for convenience during testing, but do this only in dev mode
    if ($dev_mode) {
        if (quiz_bit_combos === undefined) {
            quiz_bit_combos = ["100", "010", "001"];
        }
        if (score_ith_combo === undefined) {
            score_ith_combo = Array(quiz_bit_combos.length).fill(true);
        }
        if (activation === undefined) {
            activation = (arg0, arg1, arg2) => arg0 + arg1 >= 2;
        }
        if (collection_id === undefined) {
            collection_id = ["TEST_collection"];
            block_dict.update(dict => {
                dict[collection_id] = $task_getter.get(activation.length);
                return dict;
            });
        }
        // is_last = true;
    }

    // Imports
    import GridDetectorPair from '../partials/GridDetectorPair.svelte';
    import BlockGrid from '../partials/BlockGrid.svelte';
    import CenteredCard from '../partials/CenteredCard.svelte';
    import { block_dict, task_getter, quiz_data_dict, feedback, FADE_DURATION_MS, FADE_IN_DELAY_MS, current_score, max_score, bonus_val, bonus_currency_str, current_total_bonus } from '../../modules/experiment_stores.js';
    import { Combo } from '../../modules/block_classes.js';
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

    // Initialize and store variables
    let hide_correct_answers = true;
    let scrollY = 0;

    // Store participant answers
    quiz_data_dict.update(dict => {
        dict[collection_id] = {
            activation_answer_groups: [],
            correct_activation_answers: [],
            score_ith_activation_answer: score_ith_combo,
            activation_score: 0,
            blicket_answer_combo: "",
            free_response_0: "",
            free_response_1: ""
        };

        return dict;
    });

    // initialize the stored answers
    for (let i=0; i < quiz_bit_combos.length; i++) {
        // one "does this activate" question for each bit-string
        $quiz_data_dict[collection_id].activation_answer_groups.push(null);
    }

    // derive block combinations and correct activation answers from quiz_bit_combos
    let quiz_block_combos = [];
    for (const bitstring of quiz_bit_combos) {
        let combo = new Combo(bitstring);
        quiz_block_combos.push(combo.set_block_states($block_dict[collection_id]));
    }

    // generate the array of correct answers (true or false) for the activation questions
    for (let i=0; i < quiz_block_combos.length; i++) {
        let block_states = quiz_block_combos[i].map(block => block.state);
        let correct_ans = activation(...block_states);

        quiz_data_dict.update(dict => {
            dict[collection_id].correct_activation_answers.push(correct_ans);
            return dict;
        });
    }
    
    // check whether the participant has given an answer to all problems
    let answered_all_questions = false;
    $: {
        answered_all_questions = true;  // start with true then flip to false depending on the checks below

        if ($quiz_data_dict[collection_id].free_response_0.length === 0 || $quiz_data_dict[collection_id].free_response_1.length === 0) {  // one of the free responses is empty
            answered_all_questions = false;
        }

        let activation_answer_groups = $quiz_data_dict[collection_id].activation_answer_groups;
        for (let i=0; i < activation_answer_groups.length; i++) {
            if (activation_answer_groups[i] === null) {  // one of the activation radio questions have not been answered
                answered_all_questions = false;
            }
        }
    }

    // Click handlers
    function submit_answers() {
        hide_correct_answers = false;
        scrollY = 0;  // scroll to the top

        // update the participant's running score
        for (let i=0; i < $quiz_data_dict[collection_id].activation_answer_groups.length; i++) {
            // count number of correct answers out of the combos that we are scoring
            if (score_ith_combo[i] && $quiz_data_dict[collection_id].activation_answer_groups[i] === $quiz_data_dict[collection_id].correct_activation_answers[i]) {
                quiz_data_dict.update(dict => {
                    dict[collection_id].activation_score += 1;
                    return dict;
                });
            }
        }
        current_score.update(score => score += $quiz_data_dict[collection_id].activation_score);

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
    }

    // event dispatcher for communicating with parent components
    const dispatch = createEventDispatcher();
    function cont() {
        // escape quotes in free response questions
        quiz_data_dict.update(dict => {
            dict[collection_id].free_response_0 = escape_quotes($quiz_data_dict[collection_id].free_response_0);
            dict[collection_id].free_response_1 = escape_quotes($quiz_data_dict[collection_id].free_response_1);
            return dict;
        });
        feedback.set(escape_quotes($feedback));

        // tell parent components to move on to the next task/quiz
        dispatch("continue");
    }

    // Helper functions
    function escape_quotes(str) {
        let ret = str.replaceAll('"', '\\"');
        ret = ret.replaceAll("'", "\\'");
        return ret;
    }

    function skip_validation() {
        answered_all_questions = true;
    }
</script>

<svelte:window bind:scrollY={scrollY}/>

<div in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}">
    <CenteredCard is_large={true} has_button={false}>
        <h2>Quiz about Blickets and the Blicket Machine</h2>
        <p><b>Your score (and resulting bonus)</b> will be calculated after you answer and submit all questions. Only the "Will the blicket machine activate?" section will be scored, but we hope that you'll sincerely answer all questions. After submitting, the scored questions will be labeled with checkmarks or crosses, and you'll receive a <b>bonus of {$bonus_currency_str}{$bonus_val}</b> for each checkmark.</p>

        <h3>Which blocks do you think are blickets?</h3>
        <p style="margin-top: 0;">Please do your best to move only the blickets onto the blicket machine.</p>
        <GridDetectorPair collection_id={collection_id} is_disabled={!hide_correct_answers} is_mini={true} key_prefix="quiz_blicket"/>

        <h3>Will the blicket machine activate (light up with a green color)?</h3>
        <div class:hide="{hide_correct_answers}" style="color: green; text-align: center;">
            <span style="font-size: xx-large;">
                Your score here: {$quiz_data_dict[collection_id].activation_score}/{score_ith_combo.filter(Boolean).length}
            </span>
            <p>Your total running quiz score: {$current_score}/{$max_score}</p>
            <span style="font-size: xx-large;">
                Your bonus here: {$bonus_currency_str}{+($quiz_data_dict[collection_id].activation_score*$bonus_val).toFixed(3)}
            </span>
            <p>Your total running bonus: {$bonus_currency_str}{$current_total_bonus}</p>
        </div>
        {#each quiz_block_combos as arr, i}
            <div class="qa">
                <BlockGrid collection_id={collection_id} is_mini={true} is_disabled={true} block_filter_func={block => block.state} copied_blocks_arr={arr} is_detector={true} use_transitions={false}/>
                
                <div class="answer-options">
                    {#each ACTIVATION_ANSWER_OPTIONS as option}
                        <label>
                            <input type="radio" bind:group={$quiz_data_dict[collection_id].activation_answer_groups[i]}
                            value={option == "Yes" ? true : false} disabled="{!hide_correct_answers}"> {option}
                        </label>
                    {/each}
    
                    <!-- After the participants submit their answers, show a checkmark or cross to indicate whether the participant was correct. -->
                    <div class:hide="{hide_correct_answers || !score_ith_combo[i]}">
                        {#if $quiz_data_dict[collection_id].activation_answer_groups[i] === $quiz_data_dict[collection_id].correct_activation_answers[i]}
                            <span id="checkmark">&nbsp;&#10004</span><span><br>bonus: {$bonus_currency_str}{$bonus_val}</span>
                        {:else}
                            <span id="cross">&nbsp;&#10008</span>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}

        <h3>How do you think the blicket machine works?</h3>
        <textarea bind:value={$quiz_data_dict[collection_id].free_response_0} disabled="{!hide_correct_answers}"></textarea>

        <h3>What was your strategy for figuring out how the blicket machine works?</h3>
        <textarea bind:value={$quiz_data_dict[collection_id].free_response_1} disabled="{!hide_correct_answers}"></textarea>

        <h3 class:hide="{!is_last}" style="margin-bottom: 0;">Do you have any feedback for us? (Optional)</h3>
        <p class:hide="{!is_last}">We're at the end of the study and we're interested in hearing your thoughts on how fun/boring the study was, how this website can be improved, or anything else! Thank you in advance :)</p>
        <textarea class:hide="{!is_last}" bind:value={$feedback}></textarea>

        <!-- TODO: uncomment for mturk/prolific -->
        <!-- <div class:hide="{hide_correct_answers}" style="text-align: center;">
            <p style="color: blue;">Thank you for your answers!<br>We will review your blicket machine description and award you a bonus for a correct explanation.</p>
        </div> -->

        <button on:click="{submit_answers}" class:hide="{!hide_correct_answers}" disabled="{!answered_all_questions}">
            Submit and see your score
        </button>
        <p class:hide="{answered_all_questions}" style="color: red;">You will be able to submit after answering all questions.</p>
        <button on:click="{cont}" class:hide="{hide_correct_answers}" disabled="{hide_correct_answers}">Continue</button>

        <button class:hide="{!$dev_mode}" on:click="{skip_validation}">dev: skip form validation</button>
    </CenteredCard>
</div>

<style>
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
        justify-content: center;
    }

    #checkmark {
        color: green;
        font-size: xx-large;
    }

    #cross {
        color: red;
        font-size: xx-large;
    }

    textarea {
        width: 70%;
        height: 3rem;
    }
</style>