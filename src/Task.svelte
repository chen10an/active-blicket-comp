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

<script>    
    // Props
    export let activation = (A, B) => A && B;  // default toy causal relationship
    export let max_combos = 1;  // default max number of unique ways to cause the activation
    export let time_limit_seconds = 30;  // default time limit of 30s

    // Constants
    const ACTIVATION_TIMEOUT_MS = 750;  // duration of the background's activation in milliseconds
    const COUNT_DOWN_INTERVAL_MS = 1000;  // milliseconds passed to setInterval, used for counting down until the time limit

    // Initialize variables
    let num_blocks = activation.length;  // number of blocks that are prospective causes
    let block_states = [];  // track the boolean state of each object
    for (let i=0; i < num_blocks; i++) {  // init each block's state to false
        block_states.push(false);
    }

    let count_down_interval = setInterval(count_down_seconds, COUNT_DOWN_INTERVAL_MS);  // start the count down
    let time_up = false;  // whether the time limit has been reached
    let found_all_combos = false;  // whether the participant has found all block combinations that produce the activation
    let detector_color = "default-color";  // color of the detector
    let deactivate_all_buttons = false;  // when true, participants cannot interact with buttons
    let unique_combos = new Set();  // unique combinations of blocks that cause the activation

    // Click handler functions
    function click_block(i) {
        // When the ith block is clicked by the participant, reverse its state (true to false; false to true)
        block_states[i] = !block_states[i];
    }

    async function test() {
        // Test whether the current values in block_state will cause an activation

        if (activation(...block_states)) {
            // change the detector's background color and turn off button interactions
            detector_color = "active-color";
            deactivate_all_buttons = true;

            // create the bit string representation of block_states
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
            detector_color = "default-color";
            deactivate_all_buttons = false;

            if (unique_combos.size == max_combos) {
                // the participant has found all ways to produce the activation --> end the task (see the markup)
                found_all_combos = true;
            }
        }

        // return block states back to false
        for (let i=0; i < block_states.length; i++) {
            block_states[i] = false;
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


<!-- 
    The detector changes color when activation=true.
    Hide the detector (i.e. end the task) when the time limit has been reached or 
    the participant has found all block combinations that produce the activation.
-->
<div id="detector" style="background-color: var(--{detector_color})" class:hidden={time_up || found_all_combos}>
    <p>Remaining time: {time_limit_seconds}</p>

    <!-- Create a button for each block (prospective cause) -->
    {#each block_states as _, i}
        <button class="block" class:selected={block_states[i]} class:deactivated={deactivate_all_buttons} on:click={() => click_block(i)}> {"block".concat(i)} </button>
    {/each}

    <!-- Button for testing the detector -->
    <button class:deactivated={deactivate_all_buttons} on:click={test}>Test</button>

    <!-- Let the participant know how many unique activation combinations they have discovered -->
    <p>Your number of unique activations: {unique_combos.size}</p>
</div>

<style>
    #detector {
        --default-color: var(--light-gray);
        --active-color: var(--green);
        height: 100%;
		width: 100%;
    }

    .hidden {
        display: none;
    }

    button.block.selected {
        background-color: var(--yellow);
    }

    button.deactivated {
        pointer-events: none;
    }
</style>