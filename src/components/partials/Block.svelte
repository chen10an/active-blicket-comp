<script>
    export let block;  // object of the Block class
    export let is_mini;  // boolean, whether to show a mini-size blocks
    export let is_disabled;  // boolean, whether to disable clicking on the blocks

    export let use_transitions = true;  // whether to use transitions for individual blocks
    export let key_prefix = "";  // send/receive transitions will apply between blocks with the same key_prefix and id

    // customizable function for what happens when the current block is clicked
    export let click = (block) => {
        // When a block is clicked by the participant, reverse its state (true to false; false to true)
        block.flip();
        block_dict.set($block_dict);  // explicit update to trigger svelte's reactivity
    }

    import { send, receive } from '../../modules/crossfade.js';
    import { block_dict } from '../../modules/experiment_stores.js';
</script>

{#if use_transitions}
    <div class="block" style="background-color: var(--{block.color}); grid-area: {"pos".concat(block.position)};"
    class:mini="{is_mini}" class:disabled="{is_disabled}"
    in:receive="{{key: key_prefix.concat(String(block.id))}}" out:send="{{key: key_prefix.concat(String(block.id))}}"
    on:click={() => click(block)}>
        <span class="block-letter" class:mini="{is_mini}"><b>{@html block.letter}</b></span>
    </div>
{:else}
    <div class="block" style="background-color: var(--{block.color}); grid-area: {"pos".concat(block.position)};"
    class:mini="{is_mini}" class:disabled="{is_disabled}">
        <span class="block-letter" class:mini="{is_mini}"><b>{@html block.letter}</b></span>
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
        /* the mini block matches the size of a regular block when the regular block dimensions become smaller than the default mini dimensions */
        width: min(var(--mini-block-length), var(--block-length));
        height: min(var(--mini-block-length), var(--block-length));
        margin: min(var(--mini-block-margin), var(--block-margin));
        border-radius: 5px;
    }

    .disabled {
        pointer-events: none;
    }

    .block-letter {
        font-size: 2.5em;
    }

    .block-letter.mini {
        font-size: min(16px, 2.5em);
    }
</style>
