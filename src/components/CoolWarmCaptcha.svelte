<script>
    import BlockGrid from './BlockGrid.svelte';
    import { block_dict } from '../modules/experiment_stores.js';

    // Event dispatcher for communicating with parent components
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();

    // Click handler
    function check() {
        let captcha_blocks = $block_dict["captcha"];
        for (let i=0; i < captcha_blocks.length; i++) {
            if (captcha_blocks[i].color.startsWith("warm") && !captcha_blocks[i].state) {
                // not all warm blocks are on the blicket machine
                // TODO: remove
                console.log("don't continue because not all warm blocks are on the machine");
                return;
            } else if (captcha_blocks[i].color.startsWith("cool") && captcha_blocks[i].state) {
                // some cool blocks are on the blicket machine
                // TODO: remove
                console.log("don't continue because cool blocks are on the machine");
                return;
            }
        }
        // TODO: count how many times the continue button has been clicked, if over 50 send to "bot" page and send data to server

        // after passing the checks above, tell parent components to move on to the next task/quiz
        dispatch("continue");
    }
</script>

<p>To practice what you have learned in the instructions, <b>please move only the blocks with warm colors onto the blicket machine.</b>
    Feel free to google the meaning of warm colors. Once this is done, the “continue” button will take you to the next part of the study.</p>
<div class="row-container">
    <BlockGrid collection_id={"captcha"} is_mini={true} is_disabled={false} block_filter_func={block => !block.state}
        key_prefix="captcha" is_detector={false} is_active={false}/>
    
    <BlockGrid collection_id={"captcha"} is_mini={true} is_disabled={false} block_filter_func={block => block.state}
        key_prefix="captcha" is_detector={true} is_active={false}/>
</div>

<button on:click={check}>Continue</button>

<style>
    /* The following styling assumes that this CoolWarmCaptcha component is nested within a CenteredCard component */
    .row-container {
        /* enough width for 6 blocks and some space between each grid */
        width: calc(6*(var(--mini-block-length) + 2*var(--mini-block-margin)) + 2rem);
        
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
    }

    p {
        align-self: flex-start;
    }
</style>

