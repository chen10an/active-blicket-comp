<script>
    import CenteredCard from './CenteredCard.svelte';
    // TODO: trigger stores to send participant id and responses (including bot responses) to server
</script>

<CenteredCard has_button={false}>
    <h3>Thank you for participating!</h3>
    <img src="../images/thankyou.jpg" alt="dog biting a thank you card">
    <span>Photo by <a href="https://unsplash.com/@howier?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Howie R</a> on <a href="https://unsplash.com/s/photos/thank-you?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a></span>
</CenteredCard>

<style>
    img {
        width: 17rem;
    }

    span {
        font-size: xx-small;
    }
</style>