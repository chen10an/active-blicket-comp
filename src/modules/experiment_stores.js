// This file contains variables that need to be consistent between all variables within a single experiment

import { writable, derived } from 'svelte/store';
import { BlockGetter, Block } from './block_classes.js';
import { removePrecError } from './utilities.js';

// Read-only constants
export const BLOCK_COLORS = ["color0", "color1", "color2", "color3", "color4", "color5", "color6", "color7", "color8"];
export const FADE_DURATION_MS = 300;
export const FADE_IN_DELAY_MS = 500;
export const BLICKET_ANSWER_OPTIONS = [
    {val: null, text: "Please select an answer."},
    {val: 10, text: "10 - Definitely a blicket"}, 
    {val: 9, text: "9"}, 
    {val: 8, text: "8 - Almost sure this is a blicket"}, 
    {val: 7, text: "7"}, 
    {val: 6, text: "6"}, 
    {val: 5, text: "5 - Equally likely to be a blicket or not"}, 
    {val: 4, text: "4"},
    {val: 3, text: "3"},
    {val: 2, text: "2 - Almost sure this is NOT a blicket"},
    {val: 1, text: "1"},
    {val: 0, text: "0 - Definitely NOT a blicket"}
]
export const MAX_NUM_BLOCKS = 6;

// Write-able boolean indicating whether to view the app in dev mode
export const dev_mode = writable(false);

// Write-able string for the duration of the whole experiment
export const duration_str = writable("10 minutes");

// Write-able ints for the participant's score and bonus throughout the experiment
// these keep track of the score/bonus that are automatically calculated and sent out shortly after completion, not score/bonus that are coded by experimenters and sent out with a longer delay
export const max_score = writable(0);
export const raw_current_score = writable(0);
export const bonus_val = writable(0);
export const bonus_currency_str = writable("$");

// Derive the current score, current total running bonus, and max possible bonus without precision errors
export const current_score = derived([raw_current_score], ([$current_score]) => removePrecError($current_score));
export const current_total_bonus = derived([current_score, bonus_val], ([$current_score, $bonus_val]) => removePrecError($current_score*$bonus_val));
export const max_total_bonus = derived([max_score, bonus_val], ([$max_score, $bonus_val]) => removePrecError($max_score*$bonus_val));

// Write-able BlockGetter for consistently getting blocks in different components
export const task_getter = writable(new BlockGetter(BLOCK_COLORS));

// Write-able dictionary/object of blocks used throughout the experiment, keyed by collection IDs
export const block_dict = writable({});

// When storing (i.e. sending to server), don't include blocks used for blicket/nonblicket piles
export const to_store_block_dict = derived([block_dict], ([$block_dict]) => {
    let to_store = {};
    for (const key in $block_dict) {
        if (!key.includes("pile")) {
            to_store[key] = $block_dict[key];
        }
    }
    
    return to_store;
});

// Write-able dictionary/object of experiment data collected from the Task component, keyed by collection IDs
export const task_data_dict = writable({});

// Write-able dictionary/object of experiment data collected from the Quiz component, keyed by collection IDs
export const quiz_data_dict = writable({});

// Write-able feedback from the participant
export const feedback = writable("");

// Write-able responses to honeypot captcha
export const honeypot_responses = writable({});

// Write-able dict storing the number of clicks on the intro page's continue buttons
export const intro_incorrect_clicks = writable({});  // dict maps subpage numbers (within the overall intro page) to the number of incorrect clicks on that subpage

// make dummy blickets and nonblickets with consistent appearances; to be used for intro captcha and teaching ex
export function make_dummy_blicket(id, position) {
    return new Block(id, false, "dark-gray", "&#9734;", position);
}
export function make_dummy_nonblicket(id, position) {
    return new Block(id, false, "light-gray", "&nbsp", position);
}

export function reset_experiment_stores() {
    // Reset experiment store values without relying on start() and stop()

    // raw_current_score reset
    raw_current_score.set(0);

    // task_getter reset
    task_getter.set(new BlockGetter(BLOCK_COLORS));

    // block_dict reset
    block_dict.set({});

    // data reset
    intro_incorrect_clicks.set({});
    task_data_dict.set({});
    quiz_data_dict.set({});
    feedback.set("");
}
