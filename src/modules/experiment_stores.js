// This file contains variables that need to be consistent between all variables within a single experiment

import { writable, derived } from 'svelte/store';
import { BlockGetter } from './block_classes.js';

// Read-only constants
export const BLOCK_COLORS = ["color0", "color1", "color2", "color3", "color4", "color5", "color6", "color7", "color8"];
export const FADE_DURATION_MS = 300;
export const FADE_IN_DELAY_MS = 500;

// Write-able boolean indicating whether to view the app in dev mode
export const dev_mode = writable(false);

// Write-able ints for the participant's score and bonus throughout the experiment
// these keep track of the score/bonus that are automatically calculated and sent out shortly after completion, not score/bonus that are coded by experimenters and sent out with a longer delay
export const max_score = writable(0);
export const current_score = writable(0);
export const bonus_val = writable(0);
export const bonus_currency_str = writable("$");

// Derive the current total running bonus and max possible bonus to 3 decimal points
export const current_total_bonus = derived([current_score, bonus_val], ([$current_score, $bonus_val]) => +($current_score*$bonus_val).toFixed(3));  // unary + to turn string back to number
export const max_total_bonus = derived([max_score, bonus_val], ([$max_score, $bonus_val]) => +($max_score*$bonus_val).toFixed(3));

// Write-able BlockGetter for consistently getting blocks in different components
export const task_getter = writable(new BlockGetter(BLOCK_COLORS));

// Write-able dictionary/object of blocks used throughout the experiment, keyed by collection IDs
export const block_dict = writable({});

// Write-able dictionary/object of experiment data collected from the Task component, keyed by collection IDs
export const task_data_dict = writable({});

// Write-able dictionary/object of experiment data collected from the Quiz component, keyed by collection IDs
export const quiz_data_dict = writable({});

// Write-able feedback from the participant
export const feedback = writable("");

// Write-able responses to honeypot captcha
export const honeypot_responses = writable({});

// Write-able dict storing the number of clicks on the intro page's continue buttons
export const intro_cont_clicks = writable({});  // dict maps subpage numbers (within the overall intro page) to the number of continue clicks on that subpage

export function reset_experiment_stores() {
    // Reset experiment store values without relying on start() and stop()

    // current_score reset
    current_score.set(0);

    // task_getter reset
    task_getter.set(new BlockGetter(BLOCK_COLORS));

    // block_dict reset
    block_dict.set({});

    // data reset
    task_data_dict.set({});
    quiz_data_dict.set({});
    feedback.set("");
}
