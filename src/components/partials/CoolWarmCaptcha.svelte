<script>
    // the parent component needs to bind the following props:
    export let passed = false;

    import BlockGrid from './BlockGrid.svelte';
    import { block_dict } from '../../modules/experiment_stores.js';
    import { Block, BlockGetter } from '../../modules/block_classes.js';

    const COOL_COLORS = ["cool0", "cool1", "cool2", "cool3", "cool4", "cool5", "cool6", "cool7", "cool8"];
    const WARM_COLORS = ["warm0", "warm1", "warm2", "warm3", "warm4", "warm5", "warm6", "warm7", "warm8"];

    // get blocks for the captcha
    let captcha_getter = new BlockGetter([...WARM_COLORS, ...COOL_COLORS]);
    let captcha_blocks = captcha_getter.get(7);
    // ensure at least one warm block and one cool block
    captcha_blocks = [...captcha_blocks, new Block(7, false, "warm0", "H", 7), new Block(8, false, "cool0", "I", 8)];

    block_dict.update(dict => {
        dict["captcha"] = captcha_blocks;
        return dict;
    });

    $: {
        passed = true;  // start with true then flip to false depending on the checks below

        for (let i=0; i < $block_dict["captcha"].length; i++) {
            if ($block_dict["captcha"][i].color.startsWith("warm") && !$block_dict["captcha"][i].state) {
                // not all warm blocks are on the blicket machine
                passed = false;
            } else if ($block_dict["captcha"][i].color.startsWith("cool") && $block_dict["captcha"][i].state) {
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
        
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
    }
</style>

