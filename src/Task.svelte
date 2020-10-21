<!-- 
    This Task component runs a behavioral task where participants actively learn the underlying causal relationships by
    interacting with a number of different blocks. They can click on the blocks to turn them on (true) or off (false), and
    they can press the test button to observe whether their combination of block states (on/off) will cause an "activation".
    An activation is indicated by a change in the background color, where the background is called the "detector" in the code.
    The task ends when a time limit is reached or when the participant has found all possible activation combinations.

    This Task component accepts three Svelte props:
    * activation: Lambda function that represents the underlying causal relationship. It can have any number of arguments.
    * time_limit_seconds: Number of seconds before the task ends.
-->

<!-- TODO: update description -->
<!-- TODO: label detector on UI -->

<script>    
    // Props
    export let activation = (A, B) => A && B;  // default toy causal relationship
    export let time_limit_seconds = 30;  // default time limit of 30s
    export let randomize_arg_order = true;
    export let noise = 0;
    
    // Import svelte transitions and animations
    import { quintOut } from 'svelte/easing';
    import { crossfade } from 'svelte/transition';
    import { flip } from 'svelte/animate';

    // The following function is from: https://svelte.dev/tutorial/deferred-transitions
    const [send, receive] = crossfade({
		duration: d => Math.sqrt(d * 500),

		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;

			return {
				duration: 600,
				easing: quintOut,
				css: t => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
			};
		}
	});

    // Import components and stores
    import TaskEnd from "./TaskEnd.svelte";
    import { blocks_features_arr, num_task_blocks } from './experiment_stores.js';

    // Constants
    const ACTIVATION_TIMEOUT_MS = 750;  // duration of the background's activation in milliseconds
    const COUNT_DOWN_INTERVAL_MS = 1000;  // milliseconds passed to setInterval, used for counting down until the time limit
    const FLIP_DURATION_MS = 300;  // duration of animation in milliseconds

    // Check that the number of arguments to `activation` is supported by the available colors
    if (activation.length > Math.floor($blocks_features_arr.length/2)) {
        throw "The task causal function has too many arguments/blocks! We don't have enough distinct colors.";
    }

    // Initialize variables
    // get a slice (shallow copy) of `blocks_features_arr`
    // note that a shallow copy means that the block objects **within** the store array can be changed by this component
    let blocks = $blocks_features_arr.slice(0, activation.length);
    num_task_blocks.set(blocks.length);  // tell experiment_stores how many blocks are being used by this task

    // initialize id and state properties for the block objects
    let available_ids = [...Array(blocks.length).keys()];  // available block ids in the range [0, activation.length]
    for (let i=0; i < blocks.length; i++) {
        // randomly assign ids without replacement
        // this id corresponds to the argument position for the `activation` function
        let id_dex = Math.floor(Math.random() * available_ids.length);
        let id = available_ids[id_dex];
        available_ids = available_ids.filter(x => x !== id);  // remove the selected id

        blocks[i].id = id;  // random
        blocks[i].state = false;  // init to false
    }

    // TODO: remove
    console.log(blocks);

    let count_down_interval = setInterval(count_down_seconds, COUNT_DOWN_INTERVAL_MS);  // start the count down
    let time_up = false;  // whether the time limit has been reached
    let detector_is_active = false;  // state of the detector
    let disable_all = false;  // when true, participants cannot interact with buttons
    // unique combinations of blocks that cause the activation; use arrays to maintain order
    let unique_bit_combos = [];  // list of bit strings
    let unique_block_combos = [];  // list of lists of block objects

    // Click handler functions
    function click_block(id) {
        // When a block is clicked by the participant, reverse its state (true to false; false to true)
        let current_block = blocks.find(block => block.id === id);
        current_block.state = !current_block.state;
        blocks = blocks;  // explicit assignment to trigger svelte's reactivity
        
        // REMOVED: maintain the original block order so that the participant won't think order matters for activation
        // Move the ith block to the end of the array so that it will display as the last block in its container
        // blocks = blocks.filter(block => block !== block_i);
		// blocks = blocks.concat(block_i);
    }

    async function test() {
        // Test whether the blocks in the detector (i.e. blocks with state=true) will cause an activation

        // copy the array of block objects and sort by the randomly assigned id
        let blocks_copy = [...blocks];
        blocks_copy.sort((a, b) => a.id - b.id);

        // the randomly assigned id then becomes the argument position in `activation`
        let block_states = blocks_copy.map(block => block.state)
        if (activation(...block_states)) {
            // TODO: different color backgrounds should be different combos --> both are shown to the participant as past attempts
            // don't change the color of the detector with probability noise
            let rand = Math.random();
            if (rand >= noise) {
                // change the detector's background color and turn off button interactions
                detector_is_active = true;
                disable_all = true;

                // wait before returning everything to their default state
                await new Promise(r => setTimeout(r, ACTIVATION_TIMEOUT_MS));

                // revert to the default detector background color and enable button interactions
                detector_is_active = false;
                disable_all = false;
            }
        }

        // create the bit string representation of the current block states
        let bit_combo = "";  // note that index i in this string corresponds to the block with id=i
        for (let i=0; i < block_states.length; i++) {
            if (block_states[i]) {
                bit_combo = bit_combo.concat("1");
            } else {
                bit_combo = bit_combo.concat("0");
            }
        }
        // store all unique bit string representations
        if (!unique_bit_combos.includes(bit_combo)) {
            unique_bit_combos = [bit_combo, ...unique_bit_combos];  // add to front

            // copy and append the current block objects to `unique_block_combos`
            // note that the copied blocks in `block_combo` are ordered by their id because blocks_copy was sorted by id
            let block_combo = [];
            for (let i=0; i < blocks_copy.length; i++) {
                let obj_copy = Object.assign({}, blocks_copy[i]);
                block_combo.push(obj_copy);
            }
            unique_block_combos = [block_combo, ...unique_block_combos];  // add to front
        }

        // return all block states back to false
        for (let i=0; i < blocks.length; i++) {
            blocks[i].state = false;
        }
    }

    // TODO: remove for prod
    function skip() {
        clearInterval(count_down_interval);
        time_up = true;
    }

    // Count down timer
    function count_down_seconds() {
        // Count down in seconds until 0, at which time the task ends
        if (time_limit_seconds == 0) {
            // the time limit has been reached --> end the task (see the markup)
            clearInterval(count_down_interval);
            time_up = true;
        }
        
        time_limit_seconds = Math.max(time_limit_seconds - 1, 0);
    }
</script>

<body>
    <div class="centering-container">
        <div class="row-container" class:hidden={time_up}>
            <h2>Remaining time: {time_limit_seconds}</h2>

            <div class="col-container">
                <div class="block-outer-flex">
                    <div class="block-inner-grid">
                        <!-- In this non-detector container, display a block only if its state is false -->
                        {#each blocks.filter(block => !block.state) as block (block.id)}
                            <div class="block" style="background-color: var(--color{block.color_num}); grid-area: {block.letter};"
                            in:receive="{{key: block.id}}" out:send="{{key: block.id}}" animate:flip="{{duration: FLIP_DURATION_MS}}"
                            class:disabled="{disable_all}" on:click={() => click_block(block.id)}>
                                <b>{block.letter}</b>
                            </div>
                        {/each}
                    </div>
                </div>
                
                <!-- 
                    The detector changes color when activation=true.
                    Hide the detector (i.e. end the task) when the time limit has been reached or 
                    the participant has found all block combinations that produce the activation.
                -->
                <div class="block-outer-flex" id="detector" class:active-detector="{detector_is_active}">
                    <div class="block-inner-grid">
                        <!-- Within the detector, display a block only if its state is true -->
                        {#each blocks.filter(block => block.state) as block (block.id)}
                            <div class="block" style="background-color: var(--color{block.color_num}); grid-area: {block.letter};"
                            in:receive="{{key: block.id}}" out:send="{{key: block.id}}" animate:flip="{{duration: FLIP_DURATION_MS}}"
                            class:disabled="{disable_all}" on:click={() => click_block(block.id)}>
                                <b>{block.letter}</b>
                            </div>
                        {/each}
                    </div>
                </div>     
            </div>

             <!-- Button for testing the detector -->
            <button id="test-button" disabled="{disable_all}" on:click={test}>Test</button>

            <!-- Show all previously attempted block combinations -->
            <h2>Your unique attempts:</h2>
            <div class="col-container">
                <div id="unique-combos">
                    {#each unique_block_combos as block_arr, i (unique_bit_combos[i])}
                        <div class="block-inner-grid mini" class:active-detector="{activation(...block_arr.map(block => block.state))}"
                        in:receive="{{key: unique_bit_combos[i]}}" animate:flip="{{duration: FLIP_DURATION_MS}}">
                            {#each block_arr as block}
                                {#if block.state}
                                    <div class="block mini disabled" style="background-color: var(--color{block.color_num}); grid-area: {block.letter};">
                                        <b>{block.letter}</b>
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    {/each}
                </div>
            </div>

             <!-- TODO: remove this button for prod -->
             <button on:click={skip}>dev: skip to the next part</button>
        </div>

        <!-- Show the TaskEnd component when the time limit is reached. -->
        <!-- And forward the continue event upward. -->
        <div class="col-container" class:hidden="{!time_up}">
            <TaskEnd num_combos={unique_bit_combos.length} on:continue/>
        </div>

        <!-- TODO: use if else time_up rather than hidden -->
    </div>
</body>

<style>
    :root {
        /* blocks are squares specified by one length variable */
        --block-length: 5rem;
        --block-margin: 0.5rem;
        --mini-block-length: 2rem;
        --mini-block-margin: 0.2rem;

        /* block containers are also squares specified by one length variable */
        --block-outer-length: 20rem;
        --block-outer-margin: 1rem;
    }

    .centering-container {
        width: 100%;
        min-height: 100%;

        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .row-container {
        min-width: 75%;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .col-container {
        width: 100%;
        
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
    }

    .block-outer-flex {
        min-height: var(--block-outer-length);
        margin: var(--block-outer-margin);

        flex-basis: var(--block-outer-length);
        
        border-radius: var(--container-border-radius);
        box-shadow: var(--container-box-shadow);

        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    }

    #unique-combos {
        height: calc(3*(var(--mini-block-length) + 2*var(--mini-block-margin)) + 1rem);
        max-width: calc(2*var(--block-outer-length) + 2*var(--block-outer-margin));
        margin: var(--block-outer-margin);

        flex-basis: calc(2*var(--block-outer-length) + 2*var(--block-outer-margin));

        border-radius: var(--container-border-radius);
        box-shadow: var(--container-box-shadow);

        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;

        overflow: auto;
    }
    
    .block-inner-grid {
        /* enough space for 3x3 blocks */
        max-width: calc(3*(var(--block-length) + 2*var(--block-margin)));
        height: calc(3*(var(--block-length) + 2*var(--block-margin)));

        /* 3x3 grid that blocks can be placed into according to their letter label */
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        grid-template-areas: 
        "A B C"
        "D E F"
        "G H I";
    }

    .block-inner-grid.mini {
        /* enough space for 3x3 mini blocks */
        width: calc(3*(var(--mini-block-length) + 2*var(--mini-block-margin)));
        height: calc(3*(var(--mini-block-length) + 2*var(--mini-block-margin)));
        margin-right: 0.5rem;

        border: solid;
        border-color: var(--light-gray);
        border-radius: var(--container-border-radius);
        
        flex-shrink: 0;
    }

    .block {
        width: var(--block-length);
        height: var(--block-length);
        margin: var(--block-margin);
        border-radius: var(--block-margin);

        cursor: pointer;

        color: var(--background-color);
        font-size: 2rem;
        /* center text */
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .block.mini {
        width: var(--mini-block-length);
        height: var(--mini-block-length);
        margin: var(--mini-block-margin);
        border-radius: var(--block-margin);
        font-size: 1rem;
    }

    .block.disabled {
        pointer-events: none;
    }

    .active-detector {
        background-color: var(--active-color);
    }
    
    .hidden {
        display: none;
    }
</style>