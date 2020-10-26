<script>
    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js
    // quiz examples are specified using bit strings, where the ith index in the string corresponds to the block with id=i
    export let quiz_bit_combos = ["101", "100"];
    export let activation; // lambda function that represents the causal relationship

    // Imports
    import BlockGrid from "./BlockGrid.svelte"
    import { block_dict } from "./modules/experiment_stores.js";
    import { quiz_data_dict } from "./modules/experiment_stores.js"
    import { fade } from 'svelte/transition';
    import { createEventDispatcher } from "svelte";
    import { getBlockCombos } from "./modules/bitstring_to_blocks.js"

    // Constants
    const ACTIVATION_ANSWER_OPTIONS = ["Yes", "No"];
    const BLICKET_ANSWER_OPTIONS = [
        {id: -1, text: "Unselected"},
        {id: 10, text: "10 — Definitely a blicket"}, 
        {id: 9, text: "9"}, 
        {id: 8, text: "8 — Almost sure that this is a blicket."}, 
        {id: 7, text: "7"}, 
        {id: 6, text: "6"}, 
        {id: 5, text: "5 — Unsure"}, 
        {id: 4, text: "4"},
        {id: 3, text: "3"},
        {id: 2, text: "2 — Almost sure that this is NOT a blicket."},
        {id: 1, text: "1"},
        {id: 0, text: "0 — Definitely NOT a blicket"}
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
            blicket_answer_groups: [],
            free_response_answer: ""
        }

        return dict
    });

    // initialize the stored answers
    for (let i=0; i < quiz_bit_combos.length; i++) {
        $quiz_data_dict[collection_id].activation_answer_groups.push(null);
        $quiz_data_dict[collection_id].blicket_answer_groups.push(-1);  // corresponds to the "unselected" option
    }

    // check whether the participant has given an answer to all problems
    let answered_all_questions = false;
    $: {
        answered_all_questions = true;  // start with true then flip to false depending on the checks below

        if ($quiz_data_dict[collection_id].free_response_answer.length === 0) {  // free response is empty
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

    // derive block combinations and correct activation answers from quiz_bit_combos
    let quiz_block_combos = getBlockCombos(quiz_bit_combos, blocks);
    // this is an array of arrays of (copied) block objects, where each nested array of block objects is sorted by block id

    let correct_activation_answers = [];  // array of correct answers (true or false) for the activation questions
    for (let i=0; i < quiz_block_combos.length; i++) {
        let block_states = quiz_block_combos[i].map(block => block.state);
        let correct_ans = activation(...block_states);
        correct_activation_answers.push(correct_ans);
    }

    // Click handlers
    function show_correct_answers() {
        hide_correct_answers = false;
        scrollY = 0;  // scroll to the top
    }

    // event dispatcher for communicating with parent components
    const dispatch = createEventDispatcher();
    function cont() {
        // Tell parent components to move on to the next task/quiz
        dispatch("continue");
    }

    // TODO: remove for prod
    function skip() {
        answered_all_questions = true;
    }
</script>

<svelte:window bind:scrollY={scrollY}/>

<body in:fade="{{duration: 300}}" out:fade="{{duration: 0}}">
    <div class="centering-container">
        <div class="col-container">
            <h3>Will the following blicket machines activate?</h3>
            {#each quiz_block_combos as arr, i}
                <BlockGrid collection_id={collection_id} is_mini={true} is_disabled={true} block_filter_func={block => block.state} 
                    copied_blocks_arr={arr} key_prefix="quiz" is_detector={true} is_active={!hide_correct_answers && correct_activation_answers[i]}/>
                <div class="answer-options">
                    {#each ACTIVATION_ANSWER_OPTIONS as option}
                        <label>
                            <input type=radio bind:group={$quiz_data_dict[collection_id].activation_answer_groups[i]}
                            value={option == "Yes" ? true : false}
                            disabled="{!hide_correct_answers}"> {option}
                        </label>
                    {/each}

                    <!-- After the participants submit their answers, show a checkmark or cross to indicate whether the participant was correct. -->
                    <div class:hide="{hide_correct_answers}">
                        {#if $quiz_data_dict[collection_id].activation_answer_groups[i] === correct_activation_answers[i]}
                            <span id="checkmark">&nbsp;&#10004</span>
                        {:else}
                            <span id="cross">&nbsp;&#10008</span>
                        {/if}
                    </div>
                </div>
            {/each}
            <h3>Do you think that each of the following blocks is a blicket?</h3>
            <!-- Iterate over $block_dict, which orders blocks alphabetically -->
            {#each $block_dict[collection_id] as block, i}
                <div class="block" style="background-color: var(--color{block.color_num})">
                    <b>{block.letter}</b>
                </div>
                <div class="answer-options">
                    <select bind:value={$quiz_data_dict[collection_id].blicket_answer_groups[i]}>
                        {#each BLICKET_ANSWER_OPTIONS as option}
                            <option value={option.id}>
                                {option.text}
                            </option>
                        {/each}
                    </select>
                </div>
            {/each}

            <h3>Please describe how you think the blicket machine works.</h3>
            <textarea bind:value={$quiz_data_dict[collection_id].free_response_answer}></textarea>
            <div class:hide="{hide_correct_answers}" style="text-align: center;">
                <p style="color: blue;">Thank you for your answers!<br>We will review your blicket machine description and award you a bonus for a correct explanation.</p>
            </div>

            <button on:click="{show_correct_answers}" class:hide="{!hide_correct_answers}" disabled="{!answered_all_questions}">Click to submit your answers and receive feedback</button>
            <button on:click="{cont}" class:hide="{hide_correct_answers}">Click to continue</button>

            <!-- TODO: remove this button for prod -->
            <button on:click={skip}>dev: skip form validation</button>
        </div>
    </div>
</body>

<style>
    .col-container {
        max-width: 50rem;
        margin: 1rem;
        padding: 1rem;

        border-radius: var(--container-border-radius);
        box-shadow: var(--container-box-shadow);

        /* note that the parent element of this component should be a flexbox */
        flex-grow: 1;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .answer-options {
        margin: 0.5rem;

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
        width: var(--block-length);
        height: var(--block-length);
        margin: var(--block-margin);
        border-radius: var(--block-margin);

        color: var(--background-color);
        font-size: 2rem;
        /* center text */
        display: flex;
        justify-content: center;
        align-items: center;
    }

    textarea {
        width: 75%;
        height: 10rem;

        flex-grow: 1;
    }
</style>