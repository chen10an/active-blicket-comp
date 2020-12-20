<script>
    export let show = false;
</script>

<div class="overlay" class:show>
    <slot></slot>
</div>

<style>
    /* overlay style is adapted from https://www.w3schools.com/howto/howto_css_overlay.asp */
    .overlay {
        position: fixed;
        display: none;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgb(0,0,0,0.8);
        z-index: 2;
        color: white;
    }

    .overlay.show {
        display: block;
    }
</style>