<script>
    import { dev_mode } from '../modules/experiment_stores.js';
    // $dev_mode = true;  // set dev_mode to true to see the hidden form elements

    let form_responses = {
        "christopher_robin": null,
        "piglet": null,
        "tigger_0": null,
        "tigger_1": null,
        "eeyore": null
    }

    function submit() {
        console.log("here")
        // TODO: show end of experiment and send bot's responses and participant id to server
    }
</script>

<!-- Hidden form with very generic/conventional syntax that a bot should be able to parse. -->
<form on:submit|preventDefault={submit}>
    <h2 class:christopher-robin="{!$dev_mode}">If you are not a robot, please ignore everything below here.</h2>

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

    <input type="submit" class:eeyore="{!$dev_mode}" value="Submit!" on:click={() => form_responses.eeyore = true}>
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