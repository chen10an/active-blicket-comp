<script>
    export let collection_id;

    import CenteredCard from './CenteredCard.svelte';
    import BlockGrid from './BlockGrid.svelte';
    import CoolWarmCaptcha from './CoolWarmCaptcha.svelte';
    import WinnieThePooh from './WinnieThePooh.svelte';

    // TODO: maybe delete the section about "these properties don't matter" because they might be confusing; it might be sufficient to implicitly show this info when the letters, color and positions are completely different in the test conditon
</script>

<CenteredCard is_large={true} has_button={false}>
    <div>
        <h2>Welcome to a Research Study by the University of Edinburgh</h2>
        <p style="color: red;"><b>Please do NOT reload the page. A page reload will terminate this study and you will not be able to complete the HIT.</b></p>
        <p><em>If you are on a phone or tablet, please flip your device into the landscape orientation (where the screen width is longer than the height).
            No need to do anything if you are on a computer.
        </em></p>
        
        <h3>Introduction</h3>
        <p>Welcome to our research study!
            Throughout the study, you will see a blank canvas containing blocks with different letters and colors.
            Here is an example of 3 blocks (A, B and C) on the blank canvas:
        </p>
        <div class="centering-container">
            <BlockGrid collection_id={collection_id} is_mini={true} is_disabled={false} block_filter_func={block => !block.state} 
                is_detector={false} is_active={false} key_prefix="intro"/>
        </div>
        <p>Some blocks have special properties that make them <b>"blickets"</b>.
            <b>Your goal is to figure out which blocks are blickets</b>.
            To help you achieve this goal, we will provide you with a <b>blicket machine</b>:
        </p>
        <div class="centering-container">
            <BlockGrid collection_id={collection_id} is_mini={true} is_disabled={false} block_filter_func={block => block.state}
                is_detector={true} is_active={false} key_prefix="intro"/>
        </div>
        <p><b>Try clicking on the blocks (A, B and C) above!</b> This allows you to move blocks on or off the blicket machine. </p>
        <p>In a interactive task that comes after these instructions, you will be able to move blocks onto the blicket machine 
            and <b>press a button to test the blicket machine</b>. (The button is not shown here.) 
            After you press the testing button, the blicket machine will respond to blickets by <b>"activating" with a green color</b>:
        </p>
        <div class="centering-container">
            <BlockGrid collection_id={collection_id} is_mini={true} is_disabled={true} block_filter_func={block => false}
                is_detector={true} is_active={true}/>
        </div>
        <p>To get you started, here are some <b>properties that do NOT determine whether a block is a blicket</b>:</p>
        <ul>
            <li>Color of the block</li>
            <li>Letter on the block</li>
            <li>Position of the block on the blank canvas or the blicket machine</li>
        </ul>

        <h3>This study has 5 parts, which should take around 5-10min in total:</h3>
        <ol>
            <li>A quiz about the information on this page.</li>
            <li>An interactive task where you can move blocks between the blank canvas and the blicket machine.
                Within a <b>time limit of 60 seconds</b>, your goal is to explore which blocks are blickets by interacting with the blicket machine.
            </li>
            <li>A quiz with two types of questions based on the previous task (part 2): when the blicket machine activates (lights up with a green color), and which blocks are blickets.</li>
            <li>A replay of someone else's interactions with the blocks and the blicket machine.</li>
            <li>A quiz with two types of questions based on the previous replay (part 4): when the blicket machine activates (lights up with a green color), and which blocks are blickets.</li>
        </ol>
        <!-- TODO: compensation and bonus -->
        <!-- TODO: confidentiality and data protection-->
    </div>

    <!-- captcha and honeypot -->
    <CoolWarmCaptcha on:continue/>
</CenteredCard>
<WinnieThePooh/>

<style>
    h2 {
        margin: 0.5rem;
    }
</style>