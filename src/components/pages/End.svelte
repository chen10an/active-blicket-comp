<script>
    export let is_trouble = false;
    export let chunk_error = null;
    export let code_suffix = "";

    import { current_score, bonus_val, bonus_currency_str, current_total_bonus, quiz_data_dict, block_dict, dev_mode, task_getter } from '../../modules/experiment_stores.js';
    
    // set some default values for convenience during testing, but do this only in dev mode
    if ($dev_mode) {
        // Get some blocks for level 1 and 2
        block_dict.update(dict => {
            dict["level_1"] = $task_getter.get(3);
            return dict;
        });
        
        block_dict.update(dict => {
            dict["level_2"] = $task_getter.get(6);
            return dict;
        });

        // make artificial quiz data
        quiz_data_dict.update(dict => {
            dict["level_1"] = {
                blicket_rating_groups: [10, 5, 0],
                correct_blicket_ratings: [10, 0, 0],
                blicket_rating_scores: [1, 0.5, 1]
            };
            
            dict["level_2"] = {
                blicket_rating_groups: [0, 5, 10, 10, 5, 0],
                correct_blicket_ratings: [10, 10, 0, 0, 0, 0],
                blicket_rating_scores: [0, 0.5, 0, 0, 0.5, 1]
            };
            return dict;
        });

        // set artificial bonus amount
        bonus_val.set(0.1);
    }
    
    import CenteredCard from '../partials/CenteredCard.svelte';
    import Block from '../partials/Block.svelte';
    import { short_bonus_time, long_bonus_time } from '../../condition_configs/all_conditions.js';
    
    const CODE_PREFIX = "K3SHW";  // generated with www.random.org
    const CODE_MID = ["CS", +(($current_score.toString().replace(".", "D")).toFixed(3)), "-", "BV", $bonus_val.toString().replace(".", "D")].join("");

    // get blocks for revealing blicket rating answers and bonuses
    // (shallow) copy in alphabetical order
    let l1_blocks = [...$block_dict["level_1"]];
    let l2_blocks = [...$block_dict["level_2"]];

    // get relative ids for level 2 (for indexing quiz data)
    let l2_block_ids = l2_blocks.map(block => block.id);
    let l2_min_id = Math.min(...l2_block_ids);
    function l2_get_rel_id(id) {
        return id - l2_min_id;
    }
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
        <p><span style="color: green;">Your blicket ratings received a bonus of {$bonus_currency_str}{$current_total_bonus}</span> (scroll down for a breakdown of how bonuses were awarded). This will be sent to you <b>within {short_bonus_time}</b>.</p>
        <!-- TODO: change to plural for full exp -->
        <p>Your teaching examples will be shown to another person and calculated based on how well they understand the blicket machine. This process may take some time: we will send you your bonus <b>within {long_bonus_time}</b>.</p>
        
        <p style="margin-top: 0;">Your MTurk completion code is: {[CODE_PREFIX, CODE_MID, code_suffix].join("-")}</p>
        <img src="/images/thankyou.jpg" alt="dog biting a thank you card">
        <span class="attribution"><br/>Photo by <a href="https://unsplash.com/@howier?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText" target="_blank">Howie R</a> on <a href="https://unsplash.com/s/photos/thank-you?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText" target="_blank">Unsplash</a></span>

    </CenteredCard>
    <CenteredCard has_button={false}>
        <h3>Blicket Rating Bonus Breakdown</h3>
        <!-- reveal blicket rating answers and bonuses for level 1 and 2-->

        <h4><u>Level 1</u></h4>
        {#each l1_blocks as block}
            <Block block="{block}" is_mini="{false}" is_disabled="{true}" use_transitions="{false}" />
            <span>True rating: {$quiz_data_dict["level_1"].correct_blicket_ratings[block.id]} </span>
            <span>Your rating: {$quiz_data_dict["level_1"].blicket_rating_groups[block.id]}</span>
            <span style="margin-bottom: 1rem;">Bonus: {$bonus_currency_str}{+(($quiz_data_dict["level_1"].blicket_rating_scores[block.id]*$bonus_val).toFixed(3))}</span>
        {/each}

        <h4><u>Level 2</u></h4>
        {#each l2_blocks as block}
            <Block block="{block}" is_mini="{false}" is_disabled="{true}" use_transitions="{false}" />
            <!-- use relative ids to index level 2 quiz data -->
            <span>True rating: {$quiz_data_dict["level_2"].correct_blicket_ratings[l2_get_rel_id(block.id)]} </span>
            <span>Your rating: {$quiz_data_dict["level_2"].blicket_rating_groups[l2_get_rel_id(block.id)]}</span>
            <span style="margin-bottom: 1rem;">Bonus: {$bonus_currency_str}{+(($quiz_data_dict["level_2"].blicket_rating_scores[l2_get_rel_id(block.id)]*$bonus_val).toFixed(3))}</span>
        {/each}
    </CenteredCard>
{/if}

<style>
    img {
        width: 17rem;
    }
</style>
