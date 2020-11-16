<script>
    import { dev_mode } from '../modules/experiment_stores.js';
    // dev_mode.set(true);

    export let collection_id;

    import CenteredCard from './CenteredCard.svelte';
    import BlockGrid from './BlockGrid.svelte';
    import CoolWarmCaptcha from './CoolWarmCaptcha.svelte';
    import WinnieThePooh from './WinnieThePooh.svelte';
    import { FADE_DURATION_MS, FADE_IN_DELAY_MS } from '../modules/experiment_stores.js';
    import { fade } from 'svelte/transition';

    // Event dispatcher for communicating with parent components
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();

    const MAX_CLICKS = 50;  // number of clicks allowed on the continue button before forcing the end of the experiment

    let qa_dict = {
        "color": {"question": "A block’s <em>color</em> tells you whether it’s a blicket.", "answer": null, "correct_answer": false},
        "letter": {"question": "A block’s <em>letter</em> tells you whether it’s a blicket.", "answer": null, "correct_answer": false},
        "position": {"question": "A block’s <em>position</em> tells you whether it’s a blicket.", "answer": null, "correct_answer": false},
        "machine": {"question": "Only the blicket machine can help you figure out whether a block is a blicket.", "answer": null, "correct_answer": true},
        "time_limit": {"question": "You have a time limit of 30 seconds to figure out which blocks are blickets.", "answer": null, "correct_answer": true},
        "quiz": {"question": "You will be quizzed on your understanding of blickets and the blicket machine.", "answer": null, "correct_answer": true}
    };

    let understanding_correct = false;
    let show_understanding_feedback = false;
    let passed_captcha = false;
    let show_cont_feedback = false;
    let num_clicks = 0;  // track the number of clicks on the continue button

    $: {
        understanding_correct = true;  // start with true then flip to false depending on the checks below
        for (const key in qa_dict) {
            if (qa_dict[key].answer !== qa_dict[key].correct_answer) {
                understanding_correct = false;
            }
        }
    }

    function cont() {
        num_clicks += 1;
        if (num_clicks >= MAX_CLICKS) {
            // force the end of the experiment
            dispatch("continue", {end: true});
        }

        if (understanding_correct && passed_captcha) {
            dispatch("continue");
        }
        show_cont_feedback = true;
    }
</script>

<CenteredCard is_large={true} has_button={false}>
    <div>
        <h2>Welcome to a Research Study by the University of Edinburgh</h2>
        <p style="color: red;"><b>Please do NOT reload the page. A page reload will stop the study.</b></p>
        <p><em>If you are on a phone or tablet, please flip your device into the landscape orientation (where the screen width is longer than the height).
        No need to do anything if you are on a computer.
        </em></p>
        
        <h3>Introduction</h3>
        <p>Welcome to our research study! Our study has 4 parts that last around 5 minutes in total:</p>
        <ol>
            <li>An interactive game called the "blicket game (~30s)</li>
            <li>A quiz about the blicket game (~2min)</li>
            <li>A recording of someone else playing the blicket game (~30s)</li>
            <li>A quiz about the recording (~2min)</li>
        </ol>
        
        <h3>The Blicket Game</h3>
        <p>Our blicket game has a collection of blocks with different letters and colors. Some blocks have special properties that make them "blickets" and only a blicket machine will be able to help you detect these blickets. You have a time limit of 30 seconds to figure out which blocks are blickets.</p>

        <p>Here is an example of the blocks (left) and the blicket machine (right):</p>
        <div class="centering-container">
            <div style="margin: 0.5rem;">
                <BlockGrid collection_id={collection_id} is_mini={true} is_disabled={false} block_filter_func={block => !block.state} 
                    is_detector={false} key_prefix="intro"/>
            </div>
            <div style="margin: 0.5rem;">
                <BlockGrid collection_id={collection_id} is_mini={true} is_disabled={false} block_filter_func={block => block.state}
                    is_detector={true} key_prefix="intro"/>
            </div>
            <!-- TODO: test button -->
        </div>
            
        <p>Try clicking on the blocks (A, B and C) above! This allows you to move blocks on or off the blicket machine. Press the "Test the blicket machine" button to see how the blicket machine reacts to different combinations of blocks. the blicket machine will respond to blickets by "activating" with a green color.</p>

        <h3>Checking Your Understanding</h3>
        {#each Object.keys(qa_dict) as key}
            <div class="qa">
                <p>{@html qa_dict[key].question}</p>
                <label><input type="radio" bind:group={qa_dict[key].answer} value={true} on:click="{() => show_understanding_feedback = false}">True</label>
                <label><input type="radio" bind:group={qa_dict[key].answer} value={false} on:click="{() => show_understanding_feedback = false}">False</label>
            </div>
        {/each}
        <button on:click="{() => show_understanding_feedback = true}">Check your answers</button>
        <div class:hide={!show_understanding_feedback}>
            {#if understanding_correct}
                <p class="correct">All correct! Thanks for reading our instructions.</p>
            {:else}
                <p class="wrong">Not all answers are correct. Try again.</p>
            {/if}
        </div>

        <h3>Do you consent to participate in our study?</h3>
        <!-- TODO: participant information sheet -->
        <p>To confirm that you would like to participate in our study, please move only the blocks with warm colors onto the blicket machine. Feel free to google the meaning of warm colors. The button below will then take you to the blicket game.</p>

        <!-- TODO: compensation and bonus -->
    </div>

    <!-- captcha -->
    <CoolWarmCaptcha on:continue bind:passed={passed_captcha}/>
    <button on:click={cont}>Consent and begin the blicket game</button>
    <div class:hide={!show_cont_feedback}>
        {#if !understanding_correct}
            <p class="wrong">Please make sure you have correct answers on the "Checking Your Understanding" section.</p>
        {:else if !passed_captcha}
            <p class="wrong">Please move only the warm-colored blocks onto the blicket machine.</p>
        {/if}
    </div>

    <button class:hide="{!$dev_mode}" on:click="{() => dispatch("continue")}">dev: skip</button>
</CenteredCard>

<div class="attribution" in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}">
    Cog icon made by <a href="https://www.flaticon.com/authors/pause08" title="Pause08" target="_blank">Pause08</a> from <a href="https://www.flaticon.com/" title="Flaticon" target="_blank">www.flaticon.com</a>
</div>

<!-- honeypot -->
<WinnieThePooh on:continue/>

<style>
    h2 {
        margin: 0.5rem;
    }

    .qa {
        margin-top: 1.5rem;
    }

    .qa p {
        margin-bottom: 0;
    }

    p.correct {
        color: green;
        margin: 0;
    }

    p.wrong {
        color: red;
        margin: 0;
    }
</style>