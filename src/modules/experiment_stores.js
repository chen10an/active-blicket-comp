// This file contains variables that need to be consistent between all variables within a single experiment

// TODO: create a class for blocks: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes

import { writable } from 'svelte/store';
import { init_block_dict, init_available_features, init_available_ids } from './init_functions.js';

// Read-only default fade duration and delay
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
// TODO: send on stop

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

// Write-able dictionary/object of experiment data collected from the Quiz component, keyed by quiz IDs
export const quiz_data_dict = writable({});

// Write-able feedback from the participant
export const feedback = writable("");
// TODO: send to server using stop()

// TODO: store and send participant's combo list
// TODO: store time between combos

