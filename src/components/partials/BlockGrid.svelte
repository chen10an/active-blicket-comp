<script>
    // Props
    export let collection_id;  // components with the same collection id will use the same block objects from block_dict in module/experiment_stores.js
    export let is_mini;  // boolean, whether to show a mini, non-interactive grid
    export let is_disabled;  // boolean, whether to disable clicking on the blocks
    export let block_filter_func;  // lambda function that determines which blocks to show on the grid, e.g. block => !block.state
    export let is_detector;  // boolean, whether the grid is a detector
    export let key_prefix;  // send/receive transitions will apply between blocks with the same key_prefix and id
    
    export let copied_blocks_arr = null;  // array of copied block objects to use inplace of the shared `block_dict[collection_id]` from `experiment_stores.js`
    export let show_positive = false;  // boolean, whether to show a positive response from the detector
    export let show_negative = false;  // boolean, whether to show a negative response from the detector
    export let use_overlay = false;  // boolean, whether to use an overlay that describes the detector's response

    // Imports
    import { block_dict } from '../../modules/experiment_stores.js';
    import Block from './Block.svelte';

    // Reactively update blocks to display on the grid
    let grid_blocks;
    $: {
        if (copied_blocks_arr === null) {
            // reactive reference to the blocks in `experiment_stores.js`
            grid_blocks = $block_dict[collection_id];
        } else {
            grid_blocks = copied_blocks_arr;
        }
    }
</script>

<div class="container">
    <!-- The regular grid has an outer grid while the mini version does not. -->
    <div class:outer-flex="{!is_mini}" class:not-allowed="{is_disabled}" class:detector="{is_detector && !is_mini}" class:active="{show_positive && !is_mini}">
        <div class="inner-grid" class:mini="{is_mini}" class:detector="{is_detector && is_mini}" class:active="{show_positive && is_mini}">
            {#each grid_blocks.filter(block_filter_func) as block (block.id)}
                <Block block={block} is_mini={is_mini} is_disabled={is_disabled} key_prefix={key_prefix}/>
            {/each}
        </div>
    </div>

    <!-- Overlay for showing the detector response -->
    {#if is_detector && use_overlay} 
        {#if show_positive}
            <div class="overlay not-allowed" class:mini="{is_mini}">    
                <span class="overlay-text">Activated!</span>
            </div>
        {:else if show_negative}
            <div class="overlay not-allowed" class:mini="{is_mini}">   
                <span class="overlay-text">Nothing happened.</span>
            </div>
        {/if}
    {/if}
</div>
    

<style>
    /* achieve responsiveness by changing the parent font size */
    @media (orientation: landscape) {
        @media (min-height: 0px) {
            .container {
                font-size: 7px;
            }
        }
        @media (min-height: 300px) {
            .container {
                font-size: 8px;
            }
        }
        @media (min-height: 400px) {
            .container {
                font-size: 10px;
            }
        }
        @media (min-height: 500px) {
            .container {
                font-size: 12px;
            }
        }
        @media (min-height: 600px) {
            .container {
                font-size: 14px;
            }
        }
        @media (min-height: 700px) {
            .container {
                font-size: 16px;
            }
        }
    }

    @media (orientation: portrait) {
        @media (min-width: 0px) {
            .container {
                font-size: 5px;
            }
        }
        @media (min-width: 350px) {
            .container {
                font-size: 7px;
            }
        }
        @media (min-width: 400px) {
            .container {
                font-size: 8px;
            }
        }
        @media (min-width: 500px) {
            .container {
                font-size: 10px;
            }
        }
        @media (min-width: 600px) {
            .container {
                font-size: 12px;
            }
        }
        @media (min-width: 700px) {
            .container {
                font-size: 14px;
            }
        }
        @media (min-width: 750px) {
            .container {
                font-size: 16px;
            }
        }
    }
    
    .outer-flex {
        font-size: inherit;

        min-height: var(--block-outer-length);
        width: var(--block-outer-length);
        margin: var(--block-outer-margin);
        
        border-radius: var(--container-border-radius);
        box-shadow: var(--container-box-shadow);

        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    }

    .inner-grid {
        font-size: inherit;

        /* enough space for 3x3 blocks */
        width: calc(3*(var(--block-length) + 2*var(--block-margin)));
        height: calc(3*(var(--block-length) + 2*var(--block-margin)));

        /* 3x3 grid that blocks can be placed into according to their letter label */
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        grid-template-areas: 
        "pos0 pos1 pos2"
        "pos3 pos4 pos5"
        "pos6 pos7 pos8";
    }

    .inner-grid.mini {
        /* enough space for 3x3 mini blocks */
        width: calc(3*(var(--mini-block-length) + 2*var(--mini-block-margin)));
        height: calc(3*(var(--mini-block-length) + 2*var(--mini-block-margin)));

        border: solid;
        border-color: var(--light-gray);
        border-radius: var(--container-border-radius);
        
        flex-shrink: 0;
    }

    .detector {
        background-image: url("../images/cogwheel.svg");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 80%;
    }

    .detector.active {
        background-color: var(--active-color);
    }

    /* Overlay styling is adapted from https://www.w3schools.com/howto/howto_css_image_overlay_title.asp */
    .container {
        position: relative;
    }

    .overlay {
        font-size: inherit;

        position: absolute;
        top: var(--block-outer-margin);
        right: var(--block-outer-margin);
        bottom: var(--block-outer-margin);
        left: var(--block-outer-margin);
        
        border-radius: var(--container-border-radius);

        background: rgba(255, 255, 255, 0.1);  /* almost see through, provides contrast for the black overlay text */
        transition: .5s ease;
        z-index: 10;  /* on top */

        display: flex;
        justify-content: center;
        align-items: center;

        text-align: center;
        font-weight: bold;
    }

    .overlay.mini {
        font-size: 8px;

        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
    }

    .overlay-text {
        font-size: 1.7em;
    }

    .outer-flex.not-allowed, .overlay.not-allowed {
        cursor: not-allowed;
    }
</style>