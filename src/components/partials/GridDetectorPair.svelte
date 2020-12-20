<script>
    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in `experiment_stores.js`
    export let is_disabled;  // whether the blocks and test button should be disabled
    export let is_mini;  // whether the grids and blocks are mini

    // parent component should bind to these props:
    export let show_positive_detector = false;
    export let show_negative_detector = false;

    // Imports
    import BlockGrid from './BlockGrid.svelte';
</script>

<!-- dummy default slot to avoid svelte warnings -->
{#if false}<slot></slot>{/if}

<div class="row-container">
    <!-- In this non-detector grid, display a block only if its state is false -->
    <BlockGrid collection_id={collection_id} is_mini={is_mini} is_disabled={is_disabled} block_filter_func={block => !block.state}
    key_prefix="grid_detector_pair" is_detector={false}/>
    
    <!-- Within the detector, display a block only if its state is true -->
    <BlockGrid collection_id={collection_id} is_mini={is_mini} is_disabled={is_disabled} block_filter_func={block => block.state}
    key_prefix="grid_detector_pair" is_detector={true} show_positive={show_positive_detector} show_negative={show_negative_detector}
    use_overlay={true}/>
</div>


<style>
    .row-container {
        width: 100%;
        
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
    }
</style>