<script>
    // bind
    export let answered_all = false;  // check whether the participant has given an answer to all problems on the current page

    // props
    export let collection_id;
    export let blicket_activation;
    export let machine_name;  // shows up on UI to help participant distinguish between the different machines
    export let num_blickets;  // int: the lower limit num blickets needed to activate the machine, e.g., "one", "two", ...
    export let has_noise;  //  whether to describe that the form is noisy
    
    // Imports
    import TwoPilesAndDetector from '../partials/TwoPilesAndDetector.svelte';
    import Block from '../partials/Block.svelte';
    import { make_dummy_blicket, make_dummy_nonblicket, bonus_currency_str, quiz_data_dict, MAX_NUM_BLOCKS } from '../../modules/experiment_stores.js';
    
    // Store participant answers
    quiz_data_dict.update(dict => {
        dict[collection_id] = {
            teaching_ex: []
        };
        return dict;
    });
    
    // initialize 5 teaching examples
    for (let i=0; i < 5; i++) {
        quiz_data_dict.update(dict => {
            dict[collection_id].teaching_ex.push({detector_state: null, blicket_nonblicket_combo: ""});
            return dict;
        });
    }

    // dynamically update whether participant has answered all teaching examples
    $: {
        // start with true then flip to false depending on the checks below
        answered_all = true;
        
        let teaching_ex = $quiz_data_dict[collection_id].teaching_ex
        for (let i=0; i < teaching_ex.length; i++) {
            if (teaching_ex[i].blicket_nonblicket_combo === "" || teaching_ex[i].detector_state === null) {
                // one of teaching ex is empty (no blickets/nonblickets placed onto the detector) or one of the detector states have not been chosen to be true/false
                answered_all = false;
            }
        }
    }

    // map ints to their string descriptions
    let int_to_str = {
        1: "one",
        2: "two",
        3: "three",
        4: "four"
    }
</script>

<h2>Blicket Machine {machine_name}</h2>

<p>Here is blicket machine {machine_name}.
    {#if has_noise}
        It <b>usually</b> activates when
        <b>{int_to_str[num_blickets]} blicket{num_blickets === 1 ? "" : "s"}</b>
        <span style="display: inline-block;"><Block block={make_dummy_blicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></span>
        {num_blickets === 1 ? "is" : "are"}
        on the machine, but it <b>always</b> activates for
        <b>at least {int_to_str[num_blickets+1]} blicket{num_blickets+1 === 1 ? "" : "s"}</b>
        <span style="display: inline-block;"><Block block={make_dummy_blicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></span>.
    {:else}
        It <b>always</b> activates when
        <b>at least {int_to_str[num_blickets]} blicket{num_blickets === 1 ? "" : "s"}</b>
        <span style="display: inline-block;"><Block block={make_dummy_blicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></span>
        {num_blickets === 1 ? "is" : "are"} on the machine.
    {/if}
    It doesn't matter whether there are plain (non-blicket) blocks <span style="display: inline-block;"><Block block={make_dummy_nonblicket(-1, -1)} is_mini={true} use_transitions="{false}" is_disabled="{true}" /></span> on the machine. You can test blicket machine {machine_name} to confirm how it works:
</p>
<!-- TODO: record combos here -->
<TwoPilesAndDetector collection_id="{collection_id}_piles_testable" num_on_blocks_limit="{MAX_NUM_BLOCKS}" is_disabled="{false}" blicket_activation="{blicket_activation}" />

<h3>Please give 5 examples to teach other people about how Blicket Machine {machine_name} works:</h3>
<p>Now <b>you can choose</b> whether the blicket machine should <span style="background: var(--active-color); padding: 0 0.3rem;">Activate</span> or "Do Nothing" in response to the blickets and/or plain blocks on the machine.</p>

<div class="qa-container">
    {#each $quiz_data_dict[collection_id].teaching_ex as ex, i}
        <div class="qa">
            <p style="margin-top: 0;"><b>Example {i+1}</b></p>
            <TwoPilesAndDetector collection_id="{collection_id}_piles_{i}" num_on_blocks_limit="{MAX_NUM_BLOCKS}" is_disabled="{false}" bind:show_positive_detector="{ex.detector_state}" bind:blicket_nonblicket_combo="{ex.blicket_nonblicket_combo}" />
        </div>
    {/each}
</div>

<style>
    .qa-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
    }
</style>
