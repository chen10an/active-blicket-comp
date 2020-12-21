<script>
    export let block;  // object of the Block class
    export let is_mini;  // boolean, whether to show a mini-size blocks
    export let is_disabled;  // boolean, whether to disable clicking on the blocks

    export let use_transitions = true;  // whether to use transitions for individual blocks
    export let key_prefix = "";  // send/receive transitions will apply between blocks with the same key_prefix and id

    import { send, receive } from '../../modules/crossfade.js';
    import { block_dict } from '../../modules/experiment_stores.js';

    function click() {
        // When a block is clicked by the participant, reverse its state (true to false; false to true)
        block.flip();
        block_dict.set($block_dict);  // explicit update to trigger svelte's reactivity
    }
</script>

{#if use_transitions}
    <div class="block" style="background-color: var(--{block.color}); grid-area: {"pos".concat(block.position)};"
    class:mini="{is_mini}" class:disabled="{is_disabled}"
    in:receive="{{key: key_prefix.concat(String(block.id))}}" out:send="{{key: key_prefix.concat(String(block.id))}}"
    on:click={() => click()}>
        <span class="block-letter" class:mini="{is_mini}"><b>{block.letter}</b></span>
    </div>
{:else}
    <div class="block" style="background-color: var(--{block.color}); grid-area: {"pos".concat(block.position)};"
    class:mini="{is_mini}">
        <span class="block-letter" class:mini="{is_mini}"><b>{block.letter}</b></span>
    </div>
{/if}


<style>
    .block {
        font-size: inherit;

        width: var(--block-length);
        height: var(--block-length);
        margin: var(--block-margin);
        border-radius: var(--block-margin);

        cursor: pointer;

        color: var(--background-color);
        /* center text */
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .block.mini {
        width: var(--mini-block-length);
        height: var(--mini-block-length);
        margin: var(--mini-block-margin);
        border-radius: 5px;
    }

    .disabled {
        pointer-events: none;
    }

    .block-letter {
        font-size: 2em;
    }

    .block-letter.mini {
        font-size: 16px;
    }
</style>