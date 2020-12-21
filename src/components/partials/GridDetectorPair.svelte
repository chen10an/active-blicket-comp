<script>
    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in `experiment_stores.js`
    export let is_disabled;  // whether the blocks and test button should be disabled
    export let is_mini;  // whether the grids and blocks are mini
    export let key_prefix;  // send/receive transitions will apply between blocks with the same key_prefix and id
    export let show_positive_detector = false;
    export let show_negative_detector = false;

    // Imports
    import BlockGrid from './BlockGrid.svelte';
</script>

<div class="row-container">
    <!-- In this non-detector grid, display a block only if its state is false -->
    <BlockGrid collection_id={collection_id} is_mini={is_mini} is_disabled={is_disabled} block_filter_func={block => !block.state} is_detector={false} use_transitions={true} key_prefix={key_prefix}/>
    
    <!-- Within the detector, display a block only if its state is true -->
    <BlockGrid collection_id={collection_id} is_mini={is_mini} is_disabled={is_disabled} block_filter_func={block => block.state} is_detector={true} show_positive={show_positive_detector} show_negative={show_negative_detector} use_overlay={true} use_transitions={true} key_prefix={key_prefix}/>
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