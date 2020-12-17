// This file contains variables that need to be consistent between all variables within a single experiment

import { writable } from 'svelte/store';
import { Block, BlockGetter } from './block_classes.js';

// Read-only constants
export const BLOCK_COLORS = ["color0", "color1", "color2", "color3", "color4", "color5", "color6", "color7", "color8"];
export const INTRO_COLORS = ["color0", "color1", "color5"];
export const COOL_COLORS = ["cool0", "cool1", "cool2", "cool3", "cool4", "cool5", "cool6", "cool7", "cool8"];
export const WARM_COLORS = ["warm0", "warm1", "warm2", "warm3", "warm4", "warm5", "warm6", "warm7", "warm8"];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const FADE_DURATION_MS = 300;
export const FADE_IN_DELAY_MS = 500;

// Write-able boolean indicating whether to view the app in dev mode
export const dev_mode = writable(false);

// Write-able ints for the participant's score throughout the experiment
export const max_score = writable(0);
export const current_score = writable(0);

// Read-only BlockGetter for all tasks in the experiment
export const TASK_GETTER = new BlockGetter(BLOCK_COLORS);

// Write-able dictionary/object of blocks used throughout the experiment, keyed by collection IDs
export const block_dict = writable({}, function start(set) {
    let intro_getter = new BlockGetter(INTRO_COLORS);
    let intro_blocks = intro_getter.get(3);

    let captcha_getter = new BlockGetter([...WARM_COLORS, ...COOL_COLORS]);
    let captcha_blocks = captcha_getter.get(7);
    // ensure at least one warm block and one cool block
    captcha_blocks = [...captcha_blocks, new Block(7, false, "warm0", ALPHABET.charAt(7), 7), new Block(8, false, "cool0", ALPHABET.charAt(8), 8)];

    set({intro: intro_blocks, captcha: captcha_blocks});
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