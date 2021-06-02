<script>
    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in experiment_stores.js; one collection can contain several piles of blocks, each delimited by start_dex and end_dex

    // indices representing the range of blocks from the collection to include in the current pile
    export let start_dex;  // inclusive
    export let end_dex;  // exclusive

    export let is_disabled;  // boolean, whether to disable clicking on the blocks
    export let key_prefix;  // send/receive transitions will apply between blocks with the same key_prefix and id
    export let block_click_func;  // lambda function (of the form (block) => {...}) to customize block response to clicking
    
    // Imports
    import { block_dict } from '../../modules/experiment_stores.js';
    import Block from './Block.svelte';

    // get reactive references to relevant blocks in `experiment_stores.js`
    let pile_blocks = $block_dict[collection_id].slice(start_dex, end_dex);
    // (slice creates a shallow copy, so changing the Block objects in pile_blocks will change the same objects in block_dict)
</script>

<div class="overlapping-grid">
    <!-- only show blocks that have the off/false state -->
    
    {#each pile_blocks.filter(block => !block.state) as block (block.id)}
        <Block block={block} is_mini={false} is_disabled={is_disabled} key_prefix={key_prefix} click={block_click_func}/>
    {/each}
</div>

<style>
    .overlapping-grid {
        /* Multiple blocks will share the same grid position and thus overlap with each other in one "pile" */
        
        font-size: inherit;

        /* enough space for 1 block */
        width: calc(var(--block-length) + 2*var(--block-margin));
        height: calc(var(--block-length) + 2*var(--block-margin));

        /* 1x1 grid that blocks can be placed into according to their position attribute */
        display: grid;
        border: solid;
        /* grid-template-columns: 1fr; */
        /* grid-template-rows: 1fr; */
        grid-template-areas: "pos-1";  /* all blocks in the pile should have position attribute = -1 */
    }

</style>
