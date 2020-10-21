// This file contains variables that need to be consistent between all variables within a single experiment

import { writable, readable } from 'svelte/store';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";  // letters used for labeling blocks
const NUM_BLOCK_COLORS = 9; // number of distinct block colors in public/global.css

// Write-able array of blocks used in the experiment's Task
export const task_blocks = writable([]);

// Read-only array of objects surface feature properties (letter and color)
export const features = readable([], function start(set) {
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

