// This file contains variables that need to be consistent between all variables within a single experiment

import { writable } from 'svelte/store';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";  // letters used for labeling blocks
const NUM_BLOCK_COLORS = 9; // number of distinct block colors in public/global.css

// Write-able number of blocks used for the experiment's Task
export const num_task_blocks = writable(0);

// Write-able array of block objects with surface feature properties (letter and color)
export const blocks_features_arr = writable([], function start(set) {
    // Initialize blocks for the experiment
    let available_colors = [...Array(NUM_BLOCK_COLORS).keys()];  // available block colors in the range [0, NUM_BLOCK_COLORS]
    let blocks = [];  // array of block objects, which are initialized below
    for (let i=0; i < NUM_BLOCK_COLORS; i++) {
        // randomly assign colors without replacement
        let color_dex = Math.floor(Math.random() * available_colors.length);
        let color_num = available_colors[color_dex];
        available_colors = available_colors.filter(c => c !== color_num);  // remove the selected color

        blocks.push({
            color_num: color_num,  // random
            letter: ALPHABET.charAt(i)  // determined by order of initialization
        });
    }

    set(blocks);  // set the blocks_features_arr store

    console.log(blocks)

	return function stop() {};
});

