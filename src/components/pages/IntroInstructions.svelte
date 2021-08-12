<script>
    import { dev_mode } from '../../modules/experiment_stores.js';
    // dev_mode.set(true);

    export let collection_id = "intro";
    
    import { qa_dict, long_bonus_time, teaching_bonus_val, fform_dict, ordered_fform_keys } from '../../condition_configs/all_conditions.js';

    import CenteredCard from '../partials/CenteredCard.svelte';
    import GridDetectorPair from '../partials/GridDetectorPair.svelte';
    import CoolWarmCaptcha from '../partials/CoolWarmCaptcha.svelte';
    import WinnieThePooh from '../partials/WinnieThePooh.svelte';
    import Block from '../partials/Block.svelte';
    import { FADE_DURATION_MS, FADE_IN_DELAY_MS, block_dict, bonus_currency_str, max_total_bonus, BLICKET_ANSWER_OPTIONS, make_dummy_blicket, make_dummy_nonblicket, intro_incorrect_clicks, MAX_NUM_BLOCKS, duration_str } from '../../modules/experiment_stores.js';
    import TwoPilesAndDetector from '../partials/TwoPilesAndDetector.svelte';
    import TeachingValidation from '../partials/TeachingValidation.svelte';

    import { CROSSFADE_DURATION_MS } from '../../modules/crossfade.js';
    import { roundMoney } from '../../modules/utilities.js';
    import { tooltip } from '../../modules/tooltip.js';

    import { fade } from 'svelte/transition';
    import { createEventDispatcher, tick } from 'svelte';

    // Constants
    const dispatch = createEventDispatcher();  // for communicating with parent components
    const MAX_CLICKS = 10;  // total number of _unsuccessful_ continue clicks allowed on the comprehension checks / captchas before forcing the end of the experiment
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVXYZ";  // for naming blicket machines (the names always aappear in alphabetical order while the order of the underlying forms are suffled between conditions)

    // Comprehension checks and captchas
    let page_dex = 0;  // multipage checks
    let all_correct = false;  // whether all understanding/captcha questions are correct on the current page
    let answered_all = false;  // whether all teaching examples have been filled out
    
    let show_feedback = false;  // whether to show feedback on the current page
    let passed_captcha = false;  // bind to CoolWarmCaptcha
    let checking_container;  // bind to div that contains the checking pages

    intro_incorrect_clicks.update(dict => {
        // initialize all possible keys for comprehension/captcha checks
        dict["checking_page_-2"] = 0;
        dict["checking_page_-1"] = 0;
        return dict;
    });

    // dynamically update all_correct for the comprehension/captcha checks
    $: {
        all_correct = true;  // start with true then flip to false depending on the checks below

        if (page_dex === 1) {
            for (const key in qa_dict) {
                if (qa_dict[key].answer !== qa_dict[key].correct_answer) {
                    all_correct = false;
                }
            }
        } else if (page_dex === 2 ) {
            all_correct = passed_captcha; 
        } else {
            all_correct = false;
        }
    }

    // Click handler    
    async function cont() {
        // negative page numbers need all correct answers (for comprehension/captcha checks) while positive page numbers just need all questions to be answered (for teaching questions)
        let can_cont = page_dex < 0 ? all_correct : answered_all
        
        if (can_cont) {
            if (page_dex < 7) {
                page_dex += 1;
            } else if (page_dex === 7) {
                dispatch("continue");  // to the next component
                
                if ($dev_mode) {
                    console.log("dispatched normal continue");
                }
            }
            
            show_feedback = false;
            checking_container.scrollTop = 0;  // scroll back to top of container
            
        } else {
            if (page_dex < 0 && !all_correct) {
                // only count clicks when !all_correct on the comprehension/captch pages (negative page numbers)
                intro_incorrect_clicks.update(dict => {
                    dict[`checking_page_${page_dex}`] += 1;
                    return dict;
                });
                
                if (Object.values($intro_incorrect_clicks).reduce((a,b) => a+b, 0) >= MAX_CLICKS) {
                    // if total incorrect clicks exceeds the max allowed, then force the end of the experiment
                    dispatch("continue", {trouble: true});
                    
                    if ($dev_mode) {
                        console.log("dispatched trouble");
                    }
                }
            }
            
            show_feedback = true;
            await tick();
            checking_container.scrollTop = checking_container.scrollHeight;  // scroll to bottom of container so that the participant can see the feedback
        }
    }
</script>

<CenteredCard is_large={true} has_button={false}>
    <h2 style="margin: 0;">Welcome to a Research Study by the University of Edinburgh</h2>
    <div>
        <p style="color: red;"><b>Please do NOT reload the page. You will be unable to complete the study.</b></p>
        
        <p>Welcome to our research study! We're interested in understanding how you would teach others about our "blicket machine" and we hope that you have fun in the process.</p>

        <h3>Overview</h3>
        <ul>
            <li>Our study lasts around {$duration_str} in total. You will be introduced to 7 different "blicket machines" and asked to teach others about how each machine works.</li>
            <!-- Notice bonus is only for 6 questions because 7th one is just "make your own rule" -->
            <li><b>You can earn a total bonus of up to {$bonus_currency_str}{roundMoney(teaching_bonus_val*6)}.</b> The questions in this study may take some time to score because they are evaluated in detail by other people. Your bonus will be sent within <b>{long_bonus_time}</b>.</li>
        </ul>
        
        <h3>How to use Blicket Machines</h3>
        <p><b>Blicket machines</b> work by activating or doing nothing in response to blocks. Some blocks have special properties that make them <b>blickets</b> <span style="display: inline-block;"><Block block={make_dummy_blicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></span>; others are just plain blocks (not blickets) <span style="display: inline-block;"><Block block={make_dummy_nonblicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></span>.
        </p>

        <p>Here's an example of a dummy blicket machine (square with cogs) that you can play with:</p>
        <div class="col-centering-container" style="padding: 0;">
            <TwoPilesAndDetector collection_id="{collection_id}_piles_testable" num_on_blocks_limit="{MAX_NUM_BLOCKS}" is_disabled="{false}" blicket_activation="{(...blickets) => false}" test_button_html="Test the dummy blicket machine<br/><span style='font-size: 0.8rem;'>Note: this dummy machine does not do anything</span>"/>
        </div>
        
        <div>
            <p>How to use:</p>
            <ul style="list-style-type:none;">
                <li><button class="block-button"><Block block={make_dummy_blicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></button> adds blickets to the machine.</li>
                <li><button class="block-button"><Block block={make_dummy_nonblicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></button> adds plain blocks (not blickets) to the machine.</li>
                <li>You can add as many blickets and plain blocks as you like, for a total of <b>at least 1 and at most {MAX_NUM_BLOCKS}</b>.</li>
                <li><button style="min-width: var(--mini-block-length);">
                    Reset
                </button> removes everything from the machine.</li>
                <li><button>Test the dummy blicket machine</button> shows a dummy response from the blicket machine.</li>
            </ul>
        </div>

        <p>When you encounter <b>real blicket machines</b>, they respond to the blickets and/or plain blocks on the machine by either <span style="background: var(--active-color); padding: 0 0.3rem;">activating with a green color</span> or doing nothing. It doesn’t matter where blickets and/or plain blocks are placed on the machine.</p>

        <p>This study will show you 7 <b>different blicket machines, each with its own rule for activating</b>. The rule will be revealed to you so that you can teach it to other people.</p>

    <h3>Teaching Other People about How the Blicket Machine Works</h3>
    <p>For each blicket machine you see, you be given its rule for activating. We then ask you to give <b>5 examples</b> to teach other people about this machine. You can make each example with this setup:</p>

    <div class="col-centering-container" style="padding: 0;">
        <div class="qa">
            <p style="margin-top: 0;"><b>Setup of an Example</b></p>
            <TwoPilesAndDetector collection_id="piles_dummy" num_on_blocks_limit="{MAX_NUM_BLOCKS}" is_disabled="{false}" />
        </div>
    </div>

    <p>The buttons work in the same way before, except now <b>you can choose</b> whether the blicket machine should <span style="background: var(--active-color); padding: 0 0.3rem;">Activate</span> or "Do Nothing" in response to the blickets and/or plain blocks on the machine.</p>
    
    <p>We will show your examples to other people after the study. They will also know which blocks are blickets (star) or not (plain) and that it doesn't matter where blocks are placed on the machine.</p>

    <p>Your bonus will be calculated based on how well they understand the blicket machine (up to {$bonus_currency_str}{roundMoney(teaching_bonus_val)} per blicket machine
        <span class="info-box" title="Given your examples, two other people will choose from 8 options about how the blicket machine works. If one person chooses the correct option, your bonus is {$bonus_currency_str}{roundMoney(teaching_bonus_val/2)}; if both choose the correct option, your bonus is {$bonus_currency_str}{roundMoney(teaching_bonus_val)}." use:tooltip>hover/tap me for details</span>).

        This process may take some time: we will send you your bonus <b>within {long_bonus_time}</b>.</p>
       
        <div bind:this={checking_container} style="border-radius: var(--container-border-radius); box-shadow: var(--container-box-shadow); width=100%; height: 500px; overflow-y: scroll; padding: 10px; margin-top: 3rem;">
            <h3 style="margin: 0">Checking Your Understanding (Part {page_dex}/3)</h3>
            <p style="margin: 0;">(This box is scrollable.)</p>
            <hr>
            {#if page_dex === -2}
                {#each Object.keys(qa_dict) as key}
                    <div class="qa-min">
                        <p>{@html qa_dict[key].question}</p>
                        <label><input type="radio" bind:group={qa_dict[key].answer} value={true}>True</label>
                        <label><input type="radio" bind:group={qa_dict[key].answer} value={false}>False</label>
                    </div>
                {/each}
                <div>
                    <div class="button-container">
                        <button class="abs" on:click="{cont}">Continue</button>
                    </div>
                    <p class:hide={!show_feedback} class="wrong">Not all answers are correct. Please try again.</p>
                </div>

            {:else if page_dex === -1}
                <div in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}">
                    <p style="margin-bottom: 2rem;"><b>To reaffirm that you want to participate in our study, please move only the blocks with warm colors onto the blicket machine.</b> Feel free to google the meaning of warm colors. The button below will then take you to the blicket game.</p>

                    <div class="col-centering-container" style="padding: 0;">
                        <CoolWarmCaptcha on:continue bind:passed={passed_captcha}/>
                        
                        <p style="margin: 2rem 0 0 0;">Remember, in the <b>real blicket game</b>, a block’s color doesn’t tell us anything about whether it is a blicket.</p>
                        <div class="button-container">
                            <!-- translate to center-->
                            <button class="abs" style="transform: translateX(-50%); width: 13rem;" on:click="{cont}">Begin the blicket game</button>
                        </div>
                        <p class:hide={!show_feedback} class="wrong">Please move only the warm-colored blocks onto the blicket machine.</p>
                    </div>
                </div>

            {:else}
                {#key page_dex}
                    <div in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}" out:fade="{{duration: FADE_DURATION_MS}}">
                        <TeachingValidation bind:answered_all="{answered_all}" collection_id="{ordered_fform_keys[page_dex]}" blicket_activation="{fform_dict[ordered_fform_keys[page_dex]].blicket_activation}" machine_name="{ALPHABET[page_dex]}"  has_noise="{fform_dict[ordered_fform_keys[page_dex]].has_noise}" num_blickets="{fform_dict[ordered_fform_keys[page_dex]].num_blickets}" />
                    </div>
                {/key}

                <div class="col-centering-container" style="padding: 0;">
                    <div class="button-container">
                        <!-- translate to center-->
                        <button class="abs" style="transform: translateX(-50%); width: 13rem;" on:click="{cont}">Submit</button>
                    </div>
                </div>
            {/if}
        </div>
        
        <button class:hide="{!$dev_mode}" on:click="{() => all_correct = true}">dev: skip validation</button>
        <button class:hide="{!$dev_mode}" on:click="{() => dispatch("continue")}">dev: skip to next page</button>
    </div>
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

    /* minimal qa classes */
    .qa-min {
        margin-top: 1.5rem;
    }
    .qa-min p {
        margin-bottom: 0;
    }

    p.correct {
        color: green;
        margin: 0;
    }

    p.wrong {
        color: red;
        margin-bottom: 0;
    }

    /* by using a relative button container and absolute button, we avoid weird overflow/scrolling behavior (e.g. disappearing scrollbar) when the button is translated on press (:active) */
    /* learned from: https://stackoverflow.com/questions/21248111/overflow-behavior-after-using-css3-transform */
    .button-container {
        position: relative;
        display: inline-block;
        height: 3.5rem;  /* acts like a top-margin proxy when the absolutely positioned button has bottom 0 */
    }
    button.abs {
        position: absolute;
        bottom: 0;
        
        margin: 0;
        /* left: 0; */
        /*  */
    }
</style>
