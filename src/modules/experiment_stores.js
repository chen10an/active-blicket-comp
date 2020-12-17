// This file contains variables that need to be consistent between all variables within a single experiment

import { writable } from 'svelte/store';
import { init_block_dict, init_available_features, init_available_ids } from './init_functions.js';

// Read-only constants
export const TOTAL_CSS_GRID_AREAS = 9;
export const BLOCK_COLORS = ["color0", "color1", "color2", "color3", "color4", "color5", "color6", "color7", "color8"];
export const COOL_COLORS = ["cool0", "cool1", "cool2", "cool3", "cool4", "cool5", "cool6", "cool7", "cool8"];
export const WARM_COLORS = ["warm0", "warm1", "warm2", "warm3", "warm4", "warm5", "warm6", "warm7", "warm8"];
export const FADE_DURATION_MS = 300;
export const FADE_IN_DELAY_MS = 500;

// Write-able boolean indicating whether to view the app in dev mode
export const dev_mode = writable(false);

// Write-able ints for the participant's score throughout the experiment
export const total_score = writable(0);
export const current_score = writable(0);

// Write-able dictionary/object of blocks used throughout the experiment, keyed by collection IDs
export const block_dict = writable({}, function start(set) {
    set(init_block_dict());
    return function stop() {};
})

// Write-able array of available surface feature properties (letter and color)
export const available_features = writable(null, function start(set) {
    // Initialize blocks for the experiment
    set(init_available_features());
	return function stop() {};
});

// Write-able array of sorted, available blocks ids
export const available_ids = writable([], function start(set) {
    set(init_available_ids());
    return function stop() {};
});

// Write-able dictionary/object of experiment data collected from the Task component, keyed by collection IDs
export const task_data_dict = writable({});

// Write-able dictionary/object of experiment data collected from the Quiz component, keyed by collection IDs
export const quiz_data_dict = writable({});

// Write-able feedback from the participant
export const feedback = writable("");

// Write-able responses to honeypot captcha
export const honeypot_responses = writable({});

// Write-able number of clicks on the intro page's continue button
export const num_cont_clicks = writable(0);