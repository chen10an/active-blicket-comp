<script>
    export let is_trouble = false;
    export let chunk_error = null;
    export let code_suffix = "";

    import CenteredCard from '../partials/CenteredCard.svelte';
    import { current_score, max_score, bonus_val, bonus_currency_str, current_total_bonus } from '../../modules/experiment_stores.js';

    const CODE_PREFIX = "K3SHW";  // generated with www.random.org
    const CODE_MID = ["CS", $current_score, "-", "BV", $bonus_val.toString().replace(".", "D")].join("");
</script>

{#if is_trouble}
    <CenteredCard has_button={false} is_large={true}>
        <h3 style="color: red;">It looks like there was some trouble with the study.</h3>

        <p>We're sorry that the study cannot be completed at this time. Feel free to <a href="mailto:cocosci_support@mlist.is.ed.ac.uk">email us</a> and we will do our best to help you with this issue.</p>
    </CenteredCard>
{:else if chunk_error}
    <CenteredCard has_button={false} is_large={true}>
        <h3 style="color: red;">It looks like we are unable to collect your participation data. Please email us about this issue.</h3>

        <p>Thank you for participating! Unfortunately, we're having some technical issues that are preventing us from collecting your participation data. This is detrimental to our research, so we would be very grateful if you could let us know by <b>sending an email to <a href="mailto:cocosci_support@mlist.is.ed.ac.uk">cocosci_support@mlist.is.ed.ac.uk</a> with the following error message:</b></p>
        <p>{@html chunk_error}</p>
        <p>Thank you in advance!</p>
    </CenteredCard>
{:else}
    <CenteredCard has_button={false}>
        <h3 style="margin-bottom: 0">Thank you for participating!</h3>
        <p style="color: green;">Your final score is {$current_score}/{$max_score}, which results in a total bonus of {$bonus_currency_str}{$current_total_bonus}.</p>
        <p style="margin-top: 0;">Your MTurk completion code is: {[CODE_PREFIX, CODE_MID, code_suffix].join("-")}</p>
        <img src="/images/thankyou.jpg" alt="dog biting a thank you card">
        <span class="attribution"><br/>Photo by <a href="https://unsplash.com/@howier?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText" target="_blank">Howie R</a> on <a href="https://unsplash.com/s/photos/thank-you?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText" target="_blank">Unsplash</a></span>
    </CenteredCard>
{/if}

<style>
    img {
        width: 17rem;
    }
</style>