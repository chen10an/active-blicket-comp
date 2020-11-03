<script>
    // TODO: if the hidden form is filled, don't allow bot to continue with experiment
</script>

<!-- Hidden form with very generic/conventional syntax that a bot should be able to parse. -->
<form class="christopher-robin">
    <h2>If you see this text and you are <em>not a robot</em>, please do <em>not</em> fill out or click on anything below this point.</h2>

    <label class="christopher-robin">Who is Christopher Robin?
    <input type="hidden" name="christopher-robin" required>
    </label>

    <fieldset class="piglet">
        <legend>What color is Piglet?</legend>
        <label><input type="radio" name="piglet" required>Pink</label><br/>
        <label><input type="radio" name="piglet" required>Neon</label>
    </fieldset>

    <fieldset class="tigger">
        <legend>Tigger has...</legend>
        <label><input type="checkbox" name="tigger" required>Stripes</label><br/>
        <label><input type="checkbox" name="tigger" required>A bouncy tail</label>
    </fieldset>

    <input type="submit" class="eeyore" value="Submit!" on:click={() => alert("Submitted by a bot!")}>
</form>

<style>
    .christopher-robin {
        display: none;
    }

    .piglet {
        opacity: 0;
    }
    
    .tigger {
        visibility: hidden;
    }

    .eeyore {
        position: absolute;
        left: -500px;
    }
</style>