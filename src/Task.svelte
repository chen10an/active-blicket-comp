<!-- 
    This Task component runs a behavioral task where participants actively learn the underlying causal relationships by
    interacting with a number of different blocks. They can click on the blocks to turn them on (true) or off (false), and
    they can press the test button to observe whether their combination of block states (on/off) will cause an "activation".
    An activation is indicated by a change in the background color, where the background is called the "detector" in the code.
    The task ends when a time limit is reached or when the participant has found all possible activation combinations.

    This Task component accepts three Svelte props:
    * activation: Lambda function that represents the underlying causal relationship. It can have any number of arguments.
    * max_combos: Maximum number of unique block state (true/false) combinations that can cause activation=true.
    * time_limit_seconds: Number of seconds before the task ends.
-->

<!-- TODO: update description -->

<script>    
    // Props
    export let activation = (A, B) => A && B;  // default toy causal relationship
    export let max_combos = 1;  // default max number of unique ways to cause the activation
    export let time_limit_seconds = 30;  // default time limit of 30s
    
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

    // Import components
    import TaskEnd from "./TaskEnd.svelte";

    // Constants
    const ACTIVATION_TIMEOUT_MS = 750;  // duration of the background's activation in milliseconds
    const COUNT_DOWN_INTERVAL_MS = 1000;  // milliseconds passed to setInterval, used for counting down until the time limit
    const FLIP_DURATION_MS = 300;  // duration of animation in milliseconds
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";  // letters used for labeling blocks
    const NUM_BLOCK_COLORS = 9; // number of distinct block colors in public/global.css

    // Check that the number of arguments to `activation` is supported by the available colors
    if (activation.length > NUM_BLOCK_COLORS) {
        throw "The causal function has too many arguments/blocks! We don't have enough distinct colors to represent each block.";
    }

    // Initialize variables
    let num_blocks = activation.length;  // number of blocks that are prospective causes
    let available_ids = [...Array(num_blocks).keys()];  // available block ids in the range [0, num_blocks]
    let available_colors = [...Array(NUM_BLOCK_COLORS).keys()];  // available block colors in the range [0, NUM_BLOCK_COLORS]
    let blocks = [];  // list of block objects, which are initialized below
    for (let i=0; i < num_blocks; i++) {
        // randomly assign ids without replacement
        // this id corresponds to the argument position for `activation`
        let id_dex = Math.floor(Math.random() * available_ids.length);
        let id = available_ids[id_dex];
        available_ids = available_ids.filter(x => x !== id);  // remove the selected id

        // randomly assign colors without replacement
        let color_dex = Math.floor(Math.random() * available_colors.length);
        let color_num = available_colors[color_dex];
        available_colors = available_colors.filter(c => c !== color_num);  // remove the selected color

        blocks.push({
            id: id,  // random
            color_num: color_num,  // random
            state: false,  // starts as false
            letter: ALPHABET.charAt(i)  // determined by order of initialization
        });
    }

    let count_down_interval = setInterval(count_down_seconds, COUNT_DOWN_INTERVAL_MS);  // start the count down
    let time_up = false;  // whether the time limit has been reached
    let found_all_combos = false;  // whether the participant has found all block combinations that produce the activation
    let detector_color = "background-color";  // color of the detector
    let disable_all = false;  // when true, participants cannot interact with buttons
    let unique_combos = new Set();  // unique combinations of blocks that cause the activation

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
            // change the detector's background color and turn off button interactions
            detector_color = "active-color";
            disable_all = true;

            // create the bit string representation of block states
            let bit_combo = "";
            for (let i=0; i < block_states.length; i++) {
                if (block_states[i]) {
                    bit_combo = bit_combo.concat("1");
                } else {
                    bit_combo = bit_combo.concat("0");
                }
            }
            // store all unique bit string representations that cause an activation
            unique_combos.add(bit_combo);
            unique_combos = unique_combos;  // explicit assignment to trigger svelte's reactivity

            // wait before returning everything to their default state
            await new Promise(r => setTimeout(r, ACTIVATION_TIMEOUT_MS));

            // revert to the default detector background color and enable button interactions
            detector_color = "background-color";
            disable_all = false;

            if (unique_combos.size == max_combos) {
                // the participant has found all ways to produce the activation --> end the task (see the markup)
                clearInterval(count_down_interval);
                found_all_combos = true;
            }
        }

        // return all block states back to false
        for (let i=0; i < blocks.length; i++) {
            blocks[i].state = false;
        }
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
        <div class="row-container" class:hidden={time_up || found_all_combos}>
            <p>Remaining time: {time_limit_seconds}</p>

            <div class="two-col-container">
                <div class="block-outer-flex">
                    <div class="block-inner-grid">
                        <!-- In this non-detector container, display a block only if its state is false -->
                        {#each blocks.filter(block => !block.state) as block (block.id)}
                            <div class="block" style="background-color: var(--color{block.color_num})"
                            in:receive="{{key: block.id}}" out:send="{{key: block.id}}" animate:flip="{{duration: FLIP_DURATION_MS}}"
                            class:disabled="{disable_all}" on:click={() => click_block(block.id)}>
                                <b>{block.letter}</b>
                            </div>
                        {/each}
                    </div>
                </div>
                
                <div class="block-outer-flex" id="detector" style="background-color: var(--{detector_color})">
                    <!-- 
                        The detector changes color when activation=true.
                        Hide the detector (i.e. end the task) when the time limit has been reached or 
                        the participant has found all block combinations that produce the activation.
                    -->
                    <div class="block-inner-grid">
                        <!-- In this detector container, display a block only if its state is true -->
                        {#each blocks.filter(block => block.state) as block (block.id)}
                            <div class="block" style="background-color: var(--color{block.color_num})"
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
        </div>

        <!-- Show the TaskEnd component when the time limit is reached or when the participant finds all combinations. -->
        <!-- And forward the continue event upward. -->
        <div class:hidden={(!time_up) && (!found_all_combos)}>
            <TaskEnd time_up={time_up} found_all_combos={found_all_combos} num_found_combos={unique_combos.size} on:continue/>
        </div>
    </div>

    <!-- TODO: remove unique combo count in favor of showing all unique combos the participant has tried -->
    <!-- Let the participant know how many unique activation combinations they have discovered
    <p>Your number of unique activations: {unique_combos.size}</p> -->
</body>

<style>
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

    .two-col-container {
        width: 100%;
        
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
    }

    .block-outer-flex {
        max-width: 20rem;
        min-height: 20rem;
        margin: 1rem;

        flex-basis: 20rem;
        
        border-radius: 0.5rem;
        box-shadow: 0px 0px 30px 10px rgb(210, 210, 210);

        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    }
    
    .block-inner-grid {
        /* enough space for 3x3 blocks */
        width: 18rem;
        height: 18rem;

        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
    }
    /* TODO: scroll on overflow */

    .block {
        width: 5rem;
        height: 5rem;
        margin: 0.5rem;
        border-radius: 0.5rem;

        cursor: pointer;

        color: var(--background-color);
        font-size: 2rem;
        /* center text */
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .block.disabled {
        pointer-events: none;
    }
    
    .hidden {
        display: none;
    }
</style>