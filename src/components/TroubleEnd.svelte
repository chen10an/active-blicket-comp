<script>
    import CenteredCard from './CenteredCard.svelte';
</script>

<CenteredCard has_button={false} is_large={true}>
    <h3 style="color: red;">It looks like there was some trouble with the study.</h3>

    <p>We're sorry that the study cannot be completed at this time. Feel free to <a href="mailto:cocosci_support@mlist.is.ed.ac.uk">email us</a> and we will do our best to help you with this issue.</p>
</CenteredCard>
