<script>
    export let is_trouble = false;

    import CenteredCard from './CenteredCard.svelte';
    import { current_score, total_score } from '../modules/experiment_stores.js';
    // TODO: trigger stores to send participant id and responses (including bot responses) to server
</script>

{#if is_trouble}
    <CenteredCard has_button={false} is_large={true}>
        <h3 style="color: red;">It looks like there was some trouble with the study.</h3>

        <p>We're sorry that the study cannot be completed at this time. Feel free to <a href="mailto:cocosci_support@mlist.is.ed.ac.uk">email us</a> and we will do our best to help you with this issue.</p>
    </CenteredCard>
{:else}
    <CenteredCard has_button={false}>
        <h3 style="margin-bottom: 0">Thank you for participating!</h3>
        <p style="color: green;">Your final score is: {$current_score}/{$total_score}</p>
        <img src="/active-blicket-comp/images/thankyou.jpg" alt="dog biting a thank you card">
        <span class="attribution"><br/>Photo by <a href="https://unsplash.com/@howier?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText" target="_blank">Howie R</a> on <a href="https://unsplash.com/s/photos/thank-you?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText" target="_blank">Unsplash</a></span>
    </CenteredCard>
{/if}

<style>
    img {
        width: 17rem;
    }
</style>