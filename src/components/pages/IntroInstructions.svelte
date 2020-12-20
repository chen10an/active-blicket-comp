<script>
    import { dev_mode, num_cont_clicks } from '../../modules/experiment_stores.js';
    // dev_mode.set(true);

    export let collection_id = "intro";
    export let outline;  // a list of strings outlining the different parts of the experiment
    export let est_time_str;  // a string describing the estimated time of the entire experiment
    export let qa_dict;  // a dictionary with "question" (string that can contain html) and "correct_answer" (boolean) pairs

    // set some default values for convenience during testing, but do this only in dev mode
    if ($dev_mode) {
        if (outline === undefined) {
            outline = ["TEST outline"];
        }
        if (est_time_str === undefined) {
            est_time_str = "TEST minutes";
        }
        if (qa_dict === undefined) {
            qa_dict = {"test": {"question": "TEST: A block’s <em>color</em> tells you whether it’s a blicket.", "correct_answer": false}};
        }
    }

    import CenteredCard from '../partials/CenteredCard.svelte';
    import BlockGrid from './BlockGrid.svelte';
    import CoolWarmCaptcha from '../partials/CoolWarmCaptcha.svelte';
    import WinnieThePooh from '../partials/WinnieThePooh.svelte';
    import { FADE_DURATION_MS, FADE_IN_DELAY_MS, block_dict } from '../../modules/experiment_stores.js';
    import { BlockGetter } from '../../modules/block_classes.js';
    import { CROSSFADE_DURATION_MS } from '../../modules/crossfade.js';
    import { fade } from 'svelte/transition';
    import {createEventDispatcher} from 'svelte';

    // Constants
    const dispatch = createEventDispatcher();  // for communicating with parent components
    const INTRO_COLORS = ["color0", "color1", "color5"];
    const MAX_CLICKS = 50;  // number of clicks allowed on the continue button before forcing the end of the experiment

    // Dummy blocks
    let intro_getter = new BlockGetter(INTRO_COLORS);
    let intro_blocks = intro_getter.get(3);
    block_dict.update(dict => {
        dict["intro"] = intro_blocks;
        return dict;
    });

    // Dummy detector
    let disable_blocks = false;
    let show_dummy_negative = false;
    async function dummy_test() {
        disable_blocks = true;
        show_dummy_negative = true;

        // wait before returning everything to their default state
        await new Promise(r => setTimeout(r, 750));

        // return all block states back to false
        for (let i=0; i < $block_dict[collection_id].length; i++) {
            block_dict.update(dict => {
                dict[collection_id][i].off();
                return dict;
            });
        }

        // wait for crossfade transition
        await new Promise(r => setTimeout(r, CROSSFADE_DURATION_MS));

        disable_blocks = false;
        show_dummy_negative = false;
    }

    // Check understanding of the instructions
    let understanding_correct = false;
    let show_understanding_feedback = false;
    let passed_captcha = false;
    let show_cont_feedback = false;

    for (const key in qa_dict) {
        // create an answer field that the inputs below can bind to
        qa_dict[key].answer = null;
    }

    $: {
        understanding_correct = true;  // start with true then flip to false depending on the checks below
        for (const key in qa_dict) {
            if (qa_dict[key].answer !== qa_dict[key].correct_answer) {
                understanding_correct = false;
            }
        }
    }

    // Continue click handler
    function cont() {
        num_cont_clicks.update(n => n+=1);
        if ($num_cont_clicks >= MAX_CLICKS) {
            // force the end of the experiment
            dispatch("continue", {trouble: true});
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
        <p style="color: red;"><b>Please do NOT reload the page. You will be unable to complete the study.</b></p>
        
        <h3>Introduction</h3>
        <p>Welcome to our research study! We're interested in understanding how you make judgments in our "blicket game" and we hope that you have fun in the process. Our study has {outline.length} parts that last around {est_time_str} in total:</p>
        <ol>
            {#each outline as part}
                <li>{part}</li>
            {/each}
        </ol>
        <p>We'll tally your <b>quiz scores</b> on the bottom right corner of your screen.</p>
        
        <h3>The Blicket Game</h3>
        <p>The blicket game involves blocks with different letters and colors. Some blocks have special properties that make them <b>"blickets"</b> and only a <b>blicket machine</b> can help us identify these blickets. A block’s color and letter don’t tell us anything about whether it is a blicket.</p>

        <p>Here is an example of some blocks (A, B, C) and a dummy blicket machine (square with cogs):</p>
        <div class="centering-container" style="padding: 0;">
            <div style="margin: 0.5rem;">
                <BlockGrid collection_id={collection_id} is_mini={true} is_disabled={disable_blocks} block_filter_func={block => !block.state} 
                    is_detector={false} key_prefix="intro"/>
            </div>
            <div style="margin: 0.5rem;">
                <BlockGrid collection_id={collection_id} is_mini={true} is_disabled={disable_blocks} block_filter_func={block => block.state}
                    is_detector={true} key_prefix="intro" use_overlay={true} show_negative={show_dummy_negative}/>
            </div>
        </div>
        <div class="centering-container" style="padding: 0;">
            <!-- Dummy blicket machine test button -->
            <button on:click={dummy_test} disabled="{disable_blocks}">
                Test the dummy blicket machine<br/>
                <span style="font-size: 0.7rem">Note: this dummy machine does not do anything</span>
            </button>
        </div>
            
        <p>Try clicking on the blocks (A, B and C) above! This allows us to move blocks on or off the blicket machine. Press the test button to see how the blicket machine reacts to different combinations of blocks.</p>
            
        <p>In the <b>real blicket game</b>, the blicket machine can either <span style="background: var(--active-color); padding: 0 0.3rem;">"activate"</span> with a green color, or do nothing. It doesn’t matter where blocks are placed on the machine.</p>

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
                <p class="wrong">Not all answers are correct. Please try again.</p>
            {/if}
        </div>

        <p><b>To reaffirm that you want to participate in our study, please move only the blocks with warm colors onto the blicket machine.</b> Feel free to google the meaning of warm colors. The button below will then take you to the blicket game.</p>
    </div>

    <!-- captcha -->
    <CoolWarmCaptcha on:continue bind:passed={passed_captcha}/>
    <button on:click={cont}>Begin the blicket game</button>
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