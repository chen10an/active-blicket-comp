<script>
    import { dev_mode } from '../../modules/experiment_stores.js';
    // dev_mode.set(true);

    export let collection_id = "intro";
    
    import { fixed_num_interventions_l1, fixed_num_interventions_l2, min_time_seconds_l1, min_time_seconds_l2, qa_dict, short_bonus_time, long_bonus_time, teaching_bonus_val } from '../../condition_configs/all_conditions.js';

    import CenteredCard from '../partials/CenteredCard.svelte';
    import GridDetectorPair from '../partials/GridDetectorPair.svelte';
    import CoolWarmCaptcha from '../partials/CoolWarmCaptcha.svelte';
    import WinnieThePooh from '../partials/WinnieThePooh.svelte';
    import Block from '../partials/Block.svelte';
    import { FADE_DURATION_MS, FADE_IN_DELAY_MS, block_dict, bonus_currency_str, max_total_bonus, BLICKET_ANSWER_OPTIONS, make_dummy_blicket, make_dummy_nonblicket, intro_incorrect_clicks } from '../../modules/experiment_stores.js';
    import { BlockGetter } from '../../modules/block_classes.js';
    import { CROSSFADE_DURATION_MS } from '../../modules/crossfade.js';
    import { roundMoney } from '../../modules/utilities.js';
    import { fade } from 'svelte/transition';
    import { createEventDispatcher, tick } from 'svelte';

    // Constants
    const dispatch = createEventDispatcher();  // for communicating with parent components
    const INTRO_COLORS = ["color0", "color1", "color5"];
    const MAX_CLICKS = 10;  // total number of _unsuccessful_ continue clicks allowed on the comprehension checks / captchas before forcing the end of the experiment

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

    // Comprehension checks and captchas
    let checking_page_num = 1;  // multipage checks
    let all_correct = false;  // whether all understanding/captcha questions are correct on the current page
    let show_feedback = false;  // whether to show feedback on the current page
    let passed_captcha = false;  // bind to CoolWarmCaptcha
    let checking_container;  // bind to div that contains the checking pages
    let practice_ratings = {"blicket": null, "nonblicket": null};  // bind to participant's practice blicket ratings
    
    for (const key in qa_dict) {
        // create an answer field that the inputs below can bind to
        qa_dict[key].answer = null;
    }

    intro_incorrect_clicks.update(dict => {
        // initialize all possible keys
        dict["checking_page_1"] = 0;
        dict["checking_page_2"] = 0;
        dict["checking_page_3"] = 0;
        return dict;
    });

    $: {
        all_correct = true;  // start with true then flip to false depending on the checks below

        if (checking_page_num === 1) {
            for (const key in qa_dict) {
                if (qa_dict[key].answer !== qa_dict[key].correct_answer) {
                    all_correct = false;
                }
            }
        } else if (checking_page_num === 2 ) {
            if (practice_ratings["blicket"] != 10 || practice_ratings["nonblicket"] != 0) {
                all_correct = false;
            }
        } else if (checking_page_num === 3) {
            all_correct = passed_captcha; 
        } else {
            all_correct = false;
        }
    }

    // Click handler    
    async function cont() {
        if (all_correct) {
            if (checking_page_num <= 2) {
                checking_page_num += 1;
            } else if (checking_page_num === 3) {
                dispatch("continue");  // to the next component
                
                if ($dev_mode) {
                    console.log("dispatched normal continue");
                }
            }
            
            show_feedback = false;
            checking_container.scrollTop = 0;  // scroll back to top of container
            
        } else {
            // only count clicks when !all_correct
            intro_incorrect_clicks.update(dict => {
                dict[`checking_page_${checking_page_num}`] += 1;
                return dict;
            });
            
            if (Object.values($intro_incorrect_clicks).reduce((a,b) => a+b, 0) >= MAX_CLICKS) {
                // if total incorrect clicks exceeds the max allowed, then force the end of the experiment
                dispatch("continue", {trouble: true});
                
                if ($dev_mode) {
                    console.log("dispatched trouble");
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
        
        <p>Welcome to our research study! We're interested in understanding how you make judgments in our "blicket game" and we hope that you have fun in the process.
        
        <h3>Overview</h3>
        <p>Our study has 2 levels and lasts around 10min in total. Each level includes an interactive "blicket game" followed by a quiz about the game. The game and quiz get harder from level 1 to 2.</p>

        <p>There are two types of quiz questions:</p>
        <ol>
            <li>9 questions that award up to <b>{$bonus_currency_str}{roundMoney($max_total_bonus)}</b> bonus and are scored automatically. Your bonus will be sent <b>within {short_bonus_time}</b>.</li>
            <li>2 questions that award up to <b>{$bonus_currency_str}{roundMoney(teaching_bonus_val*2)}</b> bonus. These questions will take longer to score because they are evaluated in detail by another person. Your bonus will be sent <b>within {long_bonus_time}</b>.</li>
            <!-- TODO: change to plural for full exp -->
        </ol>
        <p><b>In total, you can earn a bonus of {$bonus_currency_str}{roundMoney($max_total_bonus + teaching_bonus_val*2)}</b>. </p>
        
        <h3>The Blicket Game</h3>
        <p>The blicket game involves blocks with different letters and colors. Some blocks have special properties that make them <b>blickets</b> and your goal is to identify these blickets with the help of a <b>blicket machine</b>. <i>Only</i> the blicket machine can help us identify blickets. A block’s color and letter don’t tell us anything about whether it is a blicket.</p>

        <p>Here's an example of some blocks (A, B, C) and a dummy blicket machine (square with cogs):</p>
        <div class="col-centering-container" style="padding: 0;">
            <GridDetectorPair collection_id={collection_id} is_mini={true} is_disabled={disable_blocks} key_prefix="intro" show_negative_detector={show_dummy_negative}/>
 
            <!-- Dummy blicket machine test button -->
            <button on:click={dummy_test} disabled="{disable_blocks}">
                Test the dummy blicket machine<br/>
                <span style="font-size: 0.8rem">Note: this dummy machine does not do anything</span>
            </button>
        </div>
        
        <p>Try clicking on the blocks (A, B and C) above! This allows us to move any number of blocks on or off the blicket machine. Press the test button to see a dummy response from the blicket machine. </p>
        
        <p>In the <b>real blicket game</b>, the test button will show how the blicket machine responds to different combinations of blocks: the machine can either <span style="background: var(--active-color); padding: 0 0.3rem;">"activate" with a green color</span>, or do nothing. It doesn’t matter where blocks are placed on the machine.</p>
        <p>You can test the blicket machine {fixed_num_interventions_l1} times in level 1 and {fixed_num_interventions_l2} times in level 2. You must also play the blicket game for <i>at least</i> {min_time_seconds_l1}s in level 1 and {min_time_seconds_l2}s in level 2.</p>

        <div bind:this={checking_container} style="border-radius: var(--container-border-radius); box-shadow: var(--container-box-shadow); width=100%; height: 400px; overflow-y: scroll; padding: 10px; margin-top: 3rem;">
            <h3 style="margin: 0">Checking Your Understanding (Part {checking_page_num}/3)</h3>
            <p style="margin: 0;">(This box is scrollable.)</p>
            <hr>
            {#if checking_page_num === 1}
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


            {:else if checking_page_num === 2}
                <div in:fade="{{delay: FADE_IN_DELAY_MS, duration: FADE_DURATION_MS}}">
                    <p>After the blicket game, you will be asked to rate the blocks: If you are certain that a block is a blicket, you should rate it 10; if you are certain it is <i>not</i> a blicket, you should rate it 0.</p>
                    <p style="margin-top: 0;">Here is a practice question with dummy blocks: If you are certain that
                        <span style="display: inline-block;"><Block block="{make_dummy_blicket(-1, -1)}" is_mini="{true}" use_transitions="{false}" is_disabled="{true}" /></span>
                        is a blicket and
                        <span style="display: inline-block;"><Block block="{make_dummy_nonblicket(-1, -1)}" is_mini="{true}" use_transitions="{false}" is_disabled="{true}" /></span>
                        is not a blicket, how would you rate them?
                    </p>

                    <div class="col-centering-container">
                        <div class="qa">
                            <Block block="{make_dummy_blicket(-1, -1)}" is_mini="{false}" is_disabled="{true}" use_transitions="{false}" />
                            <div class="answer-options">
                                <select bind:value={practice_ratings["blicket"]}>
                                    {#each BLICKET_ANSWER_OPTIONS as option}
                                        <option value={option.val}>
                                            {option.text}
                                        </option>
                                    {/each}
                                </select>
                            </div>
                        </div>

                        <div class="qa">
                            <Block block="{make_dummy_nonblicket(-1, -1)}" is_mini="{false}" is_disabled="{true}" use_transitions="{false}" />
                            <div class="answer-options">
                                <select bind:value={practice_ratings["nonblicket"]}>
                                    {#each BLICKET_ANSWER_OPTIONS as option}
                                        <option value={option.val}>
                                            {option.text}
                                        </option>
                                    {/each}
                                </select>
                            </div>
                        </div>

                        <div class="button-container">
                            <!-- translate to center-->
                            <button class="abs" style="transform: translateX(-50%);" on:click="{cont}">Continue</button>
                        </div>
                        <p class:hide={!show_feedback} class="wrong">Not all ratings are correct. Please try again.</p>
                    </div>

                </div>
            {:else if checking_page_num === 3}
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
