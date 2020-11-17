<script>
    import CenteredCard from './CenteredCard.svelte';
    import { current_score, total_score } from '../modules/experiment_stores.js';
    // TODO: trigger stores to send participant id and responses (including bot responses) to server
</script>

<CenteredCard has_button={false}>
    <h3 style="margin-bottom: 0">Thank you for participating!</h3>
    <p style="color: green;">Your final score is: {$current_score}/{$total_score}</p>
    <img src="/images/thankyou.jpg" alt="dog biting a thank you card">
    <span class="attribution"><br/>Photo by <a href="https://unsplash.com/@howier?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText" target="_blank">Howie R</a> on <a href="https://unsplash.com/s/photos/thank-you?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText" target="_blank">Unsplash</a></span>
</CenteredCard>

<style>
    img {
        width: 17rem;
    }
</style>