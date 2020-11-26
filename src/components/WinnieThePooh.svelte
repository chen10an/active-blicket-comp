<script>
    import { dev_mode, honeypot_responses } from '../modules/experiment_stores.js';
    // dev_mode.set(true);  // set dev_mode to true to see the hidden form elements

    // Event dispatcher for communicating with parent components
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();

    let form_responses = {
        "christopher_robin": null,
        "piglet": null,
        "tigger_0": null,
        "tigger_1": null,
        "eeyore": null
    }

    $: {
        let num_filled = 0;
        for (const key in form_responses) {
            if (form_responses[key] !== null) {
                num_filled += 1;
            }
        }

        honeypot_responses.set({num_filled: num_filled, ...form_responses});

        if (num_filled >= 2) {
            // force the end of the experiment when 2 hidden elements are filled
            dispatch("continue", {trouble: true});
        }
    }

    function submit() {
        // force the end of the experiment when the hidden form is successfully submitted
        dispatch("continue", {trouble: true});
    }

    function click() {
        form_responses.eeyore = true;
    }
</script>

<!-- Hidden form with very generic/conventional syntax that a bot should be able to parse. -->
<form on:submit|preventDefault={submit}>
    <h2 class:christopher-robin="{!$dev_mode}">If you are not a robot, please ignore everything below here. If you fill out any of the questions below, you will not be able to complete the study.</h2>

    <label class:christopher-robin="{!$dev_mode}">Who is Christopher Robin?
    <input type="text" name="christopher-robin" bind:value={form_responses.christopher_robin} required>
    </label>

    <fieldset class:piglet="{!$dev_mode}">
        <legend>What color is Piglet?</legend>
        <label><input type="radio" name="piglet" bind:group={form_responses.piglet} value="pink" required>Pink</label><br/>
        <label><input type="radio" name="piglet" bind:group={form_responses.piglet} value="neon" required>Neon</label>
    </fieldset>

    <fieldset class:tigger="{!$dev_mode}">
        <legend>Tigger has...</legend>
        <label><input type="checkbox" name="tigger" bind:checked={form_responses.tigger_0} required>Stripes</label><br/>
        <label><input type="checkbox" name="tigger" bind:checked={form_responses.tigger_1} required>A bouncy tail</label>
    </fieldset>

    <input type="submit" class:eeyore="{!$dev_mode}" value="Submit!" on:click={click}>
</form>

<style>
    /* Many different ways of hiding form elements from humans */
    form {
        height: 0;
    }

    .christopher-robin {
        display: none;
    }

    .piglet {
        height: 0;
        opacity: 0;
    }
    
    .tigger {
        height: 0;
        visibility: hidden;
    }

    .eeyore {
        height: 0;
        position: absolute;
        left: -999px;
    }
</style>