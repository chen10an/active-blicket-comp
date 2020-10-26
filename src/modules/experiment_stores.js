// This file contains variables that need to be consistent between all variables within a single experiment

import { writable } from 'svelte/store';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";  // letters used for labeling blocks
const NUM_BLOCK_COLORS = 9;  // number of distinct block colors in public/global.css

// Write-able dictionary/object of blocks used throughout the experiment, keyed by task IDs
export const block_dict = writable({dev:
    [{id: 2, state: false, color_num: 1, letter: "A"},
    {id: 0, state: false, color_num: 5, letter: "B"},
    {id: 1, state: false, color_num: 7, letter: "C"}]
});  // use a default value for development and testing purposes
// TODO: send on stop

// Write-able array of availale surface feature properties (letter and color)
export const available_features = writable(null, function start(set) {
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

// Write-able array of sorted, available blocks ids
export const available_ids = writable([...Array(NUM_BLOCK_COLORS).keys()]);

// Writeable dictionary/object of experiment data collected from the Quiz component, keyed by quiz IDs
export const quiz_data_dict = writable({}, function start() {return stop()});
// TODO: send to server using stop()

// TODO: store and send participant's combo list
// TODO: store time between combos

