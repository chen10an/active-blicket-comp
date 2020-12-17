<script>
    import { dev_mode } from '../modules/experiment_stores.js';
    // dev_mode.set(true);

    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js
    // quiz examples are specified using bit strings, where the ith index in the string corresponds to the block with id=i
    export let quiz_bit_combos;
    export let score_ith_combo;
    export let activation; // lambda function that represents the causal relationship
    export let is_last = false;  // whether this is the last quiz before the end of the experiment

    // Imports
    import BlockGrid from './BlockGrid.svelte';
    import CenteredCard from './CenteredCard.svelte';
    import { block_dict, quiz_data_dict, FADE_DURATION_MS, FADE_IN_DELAY_MS, current_score, max_score, feedback } from '../modules/experiment_stores.js';
    import { fade } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    import { getBlockCombos } from '../modules/bitstring_to_blocks.js';

    // Constants
    const ACTIVATION_ANSWER_OPTIONS = ["Yes", "No"];
    const BLICKET_ANSWER_OPTIONS = [
        {id: -1, text: "Unselected"},
        {id: 10, text: "10 — Definitely a blicket."}, 
        {id: 9, text: "9"}, 
        {id: 8, text: "8 — Almost sure this is a blicket."}, 
        {id: 7, text: "7"}, 
        {id: 6, text: "6"}, 
        {id: 5, text: "5 — Equally likely to be a blicket or not."}, 
        {id: 4, text: "4"},
        {id: 3, text: "3"},
        {id: 2, text: "2 — Almost sure this is NOT a blicket."},
        {id: 1, text: "1"},
        {id: 0, text: "0 — Definitely NOT a blicket."}
    ]

    // Initialize and store variables
    let hide_correct_answers = true;
    let scrollY = 0;

    // copy the blocks that were used by the preceding task
    let blocks = [...$block_dict[collection_id]];

    // Store participant answers
    quiz_data_dict.update(dict => {
        dict[collection_id] = {
            activation_answer_groups: [],
            correct_activation_answers: [],
            score_ith_activation_answer: score_ith_combo,
            activation_score: 0,
            blicket_answer_groups: [],
            free_response_0: "",
            free_response_1: ""
        }

        return dict
    });

    // initialize the stored answers
    for (let i=0; i < quiz_bit_combos.length; i++) {
        // one "does this activate" question for each bit-string
        $quiz_data_dict[collection_id].activation_answer_groups.push(null);
    }
    for (let i=0; i < quiz_bit_combos[0].length; i++) {
        // one "is this a blicket" questions for each bit within a bit-string
        $quiz_data_dict[collection_id].blicket_answer_groups.push(-1);  // corresponds to the "unselected" option
    }

    // derive block combinations and correct activation answers from quiz_bit_combos
    let quiz_block_combos = getBlockCombos(quiz_bit_combos, blocks);
    // this is an array of arrays of (copied) block objects, where each nested array of block objects is sorted by block id

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

        let blicket_answer_groups = $quiz_data_dict[collection_id].blicket_answer_groups;
        for (let i=0; i < blicket_answer_groups.length; i++) {
            if (blicket_answer_groups[i] === -1) {  // one of the blicket dropdowns have not been answered
                answered_all_questions = false;
            }
        }
    }

    // Click handlers
    function show_correct_answers() {
        hide_correct_answers = false;
        scrollY = 0;  // scroll to the top

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
    }

    // event dispatcher for communicating with parent components
    const dispatch = createEventDispatcher();
    function cont() {
        // Tell parent components to move on to the next task/quiz
        dispatch("continue");
    }

    function skip_validation() {
        answered_all_questions = true;
    }
</script>

<svelte:window bind:scrollY={scrollY}/>

<div in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}">
    <CenteredCard is_large={true} has_button={false}>
        <h2>Quiz about Blickets and the Blicket Machine</h2>
        <p><b>Your score</b> will be calculated after you answer and submit all questions. Some of these questions will be scored, some will not. After submitting, the scored questions will be labeled with checkmarks or crosses.</p>
        <h3>Will the blicket machine activate (light up with a green color)?</h3>
        <div class:hide="{hide_correct_answers}" style="color: green; text-align: center;">
            <span style="font-size: xx-large;">
                Your score here: {$quiz_data_dict[collection_id].activation_score}/{score_ith_combo.filter(Boolean).length}
            </span>
            <p>Your total running quiz score: {$current_score}/{$max_score}</p>
        </div>
        {#each quiz_block_combos as arr, i}
            <div class="qa">
                <BlockGrid collection_id={collection_id} is_mini={true} is_disabled={true} block_filter_func={block => block.state} 
                    copied_blocks_arr={arr} key_prefix="quiz" is_detector={true}/>
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
                            <span id="checkmark">&nbsp;&#10004</span>
                        {:else}
                            <span id="cross">&nbsp;&#10008</span>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
        <h3>Do you think that these blocks are blickets?</h3>
        <!-- Iterate over $block_dict, which orders blocks alphabetically -->
        {#each $block_dict[collection_id] as block, i}
            <div class="qa">
                <div class="block" style="background-color: var(--{block.color})">
                    <span class="block-letter"><b>{block.letter}</b></span>
                </div>
                <div class="answer-options">
                    <select bind:value={$quiz_data_dict[collection_id].blicket_answer_groups[i]} disabled="{!hide_correct_answers}">
                        {#each BLICKET_ANSWER_OPTIONS as option}
                            <option value={option.id}>
                                {option.text}
                            </option>
                        {/each}
                    </select>
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

        <button on:click="{show_correct_answers}" class:hide="{!hide_correct_answers}" disabled="{!answered_all_questions}">
            Submit and see your score
        </button>
        <p class:hide="{answered_all_questions}" style="color: red;">You will be able to submit after answering all questions.</p>
        <button on:click="{cont}" class:hide="{hide_correct_answers}">Continue</button>

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

    .block {
        font-size: 1rem;

        width: var(--block-length);
        height: var(--block-length);
        margin: var(--block-margin);
        border-radius: var(--block-margin);

        color: var(--background-color);
        /* center text */
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .block-letter {
        font-size: 2em;
    }

    textarea {
        width: 70%;
        height: 3rem;
    }
</style>