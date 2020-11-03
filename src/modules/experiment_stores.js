// This file contains variables that need to be consistent between all variables within a single experiment

// TODO: create a class for blocks: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes

import { writable } from 'svelte/store';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";  // letters used for labeling blocks

// color variable names from public/global.css
const BLOCK_COLORS = ["color0", "color1", "color2", "color3", "color4", "color5", "color6", "color7", "color8"];
const COOL_COLORS = ["cool0", "cool1", "cool2", "cool3", "cool4", "cool5", "cool6", "cool7", "cool8"];
const WARM_COLORS = ["warm0", "warm1", "warm2", "warm3", "warm4", "warm5", "warm6", "warm7", "warm8"];

function init_block_features(available_colors, num_blocks) {
    // Randomly initialize n blocks from the input list of available colors, where n=num_blocks
    // Returns an array of block objects with color and letter properties

    let arr = [];  // array of feature objects, which are initialized below
    for (let i=0; i < num_blocks; i++) {
        // randomly assign colors without replacement
        let color_dex = Math.floor(Math.random() * available_colors.length);
        let color = available_colors[color_dex];
        available_colors = available_colors.filter(c => c !== color);  // remove the selected color

        arr.push({
            color: color,  // random
            letter: ALPHABET.charAt(i)  // determined by order of initialization
        });
    }

    return arr;
}

// Write-able dictionary/object of blocks used throughout the experiment, keyed by collection IDs
export const block_dict = writable({}, function start(set) {
    // Initialize with blocks for the introductory instructions page and for the captcha
    let dict = {
        intro:
        [{id: -1, state: false, color: "color0", letter: "A"},
        {id: -2, state: false, color: "color1", letter: "B"},
        {id: -3, state: false, color: "color5", letter: "C"}],
    };

    let captcha_blocks = init_block_features([...WARM_COLORS, ...COOL_COLORS], 9);
    for (let i=0; i < captcha_blocks.length; i++) {
        captcha_blocks[i].state = false;
        captcha_blocks[i].id = -11 - i;
    }

    dict["captcha"] = captcha_blocks;

    set(dict);
})
// TODO: send on stop

// Write-able array of available surface feature properties (letter and color)
export const available_features = writable(null, function start(set) {
    // Initialize blocks for the experiment
    let block_features = init_block_features([...BLOCK_COLORS], 9);
    set(block_features);

	return function stop() {};
});

// Write-able array of sorted, available blocks ids
export const available_ids = writable([], function start(set) {
    set([...Array(BLOCK_COLORS.length).keys()]);
    return function stop() {};
});

// Writeable dictionary/object of experiment data collected from the Quiz component, keyed by quiz IDs
export const quiz_data_dict = writable({}, function start() {return stop()});
// TODO: send to server using stop()

// TODO: store and send participant's combo list
// TODO: store time between combos

