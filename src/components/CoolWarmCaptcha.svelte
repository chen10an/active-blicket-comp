<script>
    // the parent component needs to bind the following props:
    export let passed = false;

    import BlockGrid from './BlockGrid.svelte';
    import { block_dict } from '../modules/experiment_stores.js';

    $: {
        passed = true;  // start with true then flip to false depending on the checks below

        let captcha_blocks = $block_dict["captcha"];
        for (let i=0; i < captcha_blocks.length; i++) {
            if (captcha_blocks[i].color.startsWith("warm") && !captcha_blocks[i].state) {
                // not all warm blocks are on the blicket machine
                passed = false;
            } else if (captcha_blocks[i].color.startsWith("cool") && captcha_blocks[i].state) {
                // some cool blocks are on the blicket machine
                passed = false;
            }
        }
    }
</script>

<div class="row-container">
    <BlockGrid collection_id={"captcha"} is_mini={true} is_disabled={false} block_filter_func={block => !block.state}
        key_prefix="captcha" is_detector={false}/>
    
    <BlockGrid collection_id={"captcha"} is_mini={true} is_disabled={false} block_filter_func={block => block.state}
        key_prefix="captcha" is_detector={true}/>
</div>

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
</style>

