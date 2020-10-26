// This file contains variables that need to be consistent between all variables within a single experiment

import { writable, readable } from 'svelte/store';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";  // letters used for labeling blocks
const NUM_BLOCK_COLORS = 9;  // number of distinct block colors in public/global.css

// Read-only (but not a store) duration of the crossfade transition defined in crossfade.js
export const CROSSFADE_DURATION_MS = 500;

// Write-able array of blocks used in the experiment's Task
export const task_blocks = writable([
    {id: 2, state: false, color_num: 1, letter: "A"},
    {id: 0, state: false, color_num: 5, letter: "B"},
    {id: 1, state: false, color_num: 7, letter: "C"}
]);  // use a default value for development and testing purposes
// TODO: maybe generalize task_blocks to a dict after seeing how the demo task will work

// Read-only array of objects surface feature properties (letter and color)
export const features = readable(null, function start(set) {
    // Initialize blocks for the experiment
    let available_colors = [...Array(NUM_BLOCK_COLORS).keys()];  // available block colors in the range [0, NUM_BLOCK_COLORS]
    let arr = [];  // array of feature objects, which are initialized below
    for (let i=0; i < NUM_BLOCK_COLORS; i++) {
        // randomly assign colors without replacement
        let color_dex = Math.floor(Math.random() * available_colors.length);
        let color_num = available_colors[color_dex];
        available_colors = available_colors.filter(c => c !== color_num);  // remove the selected color

        arr.push({
            color_num: color_num,  // random
            letter: ALPHABET.charAt(i)  // determined by order of initialization
        });
    }

    set(arr);  // set the blocks_features_arr store

	return function stop() {};
});

// Writeable dictionary/object of experiment data
export const data_dict = writable({}, function start() {return stop()});
// TODO: store experiment data here and send to server using stop()
// TODO: combo list
// TODO: quiz answers, distinguish between train vs test

// TODO: time between combos

