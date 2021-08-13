// this file specifies the experiment conditions as well as any one-off variables that are needed for a specific experiment version but will not necessarily generalize to future versions (e.g., long_bonus_time and teaching_bonus_val in 2.x.x)

export const short_bonus_time = "2 working days";  // max time for receiving auto-calculated bonus

export const long_bonus_time = "10 working days";  // max time for receiving coded bonus
export const teaching_bonus_val = 0.16;

export const fixed_num_interventions_l1 = 12;
export const fixed_num_interventions_l2 = 20;
export const min_time_seconds_l1 = 30;
export const min_time_seconds_l2 = 60;

export const qa_dict = {
    "blicket": {"question": `Blickets are marked with a star, while plain blocks are not.`, "correct_answer": true},
    "position": {"question": "When a blicket or plain block is on the blicket machine, its <em>position</em> can influence whether the machine activates.", "correct_answer": false},
    "rule": {"question": "Every blicket machine uses the <i>same</i> rule for activating in response to blickets and/or plain blocks.", "correct_answer": false},
    "know": {"question": "You will know the activation rule for each blicket machine.", "correct_answer": true},
    "teaching": {"question": `When you make examples for teaching others, it is up to you to choose and show others whether the blicket machine should activate or do nothing.`, "correct_answer": true},
};

// level 1: 3 blocks, 1 blicket for disjunctive and 2 blickets for conjunctive

const disj_blicket_activation = (...blickets) => blickets.reduce((x,y) => x+y, 0) >= 1;
const noisy_disj_blicket_activation = function(...blickets) {
    // equivalent (with rounding up/down at the asymptotes) to sigmoid with gain=11, bias=0.9 (when noise at 1 blicket is ~0.75)
    
    let num_blickets = blickets.reduce((x,y) => x+y, 0);  // non-neg integer
    if (num_blickets == 1) {
        return Math.random() < 0.75;  // noise
    } else if (num_blickets > 1) {
        return true;
    } else {
        return false;
    }
}

const conj_blicket_activation = (...blickets) => blickets.reduce((x,y) => x+y, 0) >= 2;
const noisy_conj_blicket_activation = function(...blickets) {
    // equivalent (with rounding up/down at the asymptotes) to sigmoid with gain=11, bias=1.9 (when noise at 2 blickets is ~0.75)
    
    let num_blickets =  blickets.reduce((x,y) => x+y, 0);  // non-neg integer
    if (num_blickets == 2) {
        return Math.random() < 0.75;  // noise
    } else if (num_blickets > 2) {
        return true;
    } else {
        return false;
    }
}

const conj3_blicket_activation = (...blickets) => blickets.reduce((x,y) => x+y, 0) >= 3;
const noisy_conj3_blicket_activation = function(...blickets) {
    // equivalent (with rounding up/down at the asymptotes) to sigmoid with gain=11, bias=2.9 (when noise at 3 blickets is ~0.75)
    
    let num_blickets = blickets.reduce((x,y) => x+y, 0);  // non-neg integer
    if (num_blickets == 3) {
        return Math.random() < 0.75;  // noise
    } else if (num_blickets > 3) {
        return true;
    } else {
        return false;
    }
}

const fform_dict = {
    "disj": {blicket_activation: disj_blicket_activation, has_noise: false, num_blickets: 1},
    "noisy_disj": {blicket_activation: noisy_disj_blicket_activation, has_noise: true, num_blickets: 1},
    "conj": {blicket_activation: conj_blicket_activation, has_noise: false, num_blickets: 2},
    "noisy_conj": {blicket_activation: noisy_conj_blicket_activation, has_noise: true, num_blickets: 2},
    "conj3": {blicket_activation: conj3_blicket_activation, has_noise: false, num_blickets: 3},
    "noisy_conj3": {blicket_activation: noisy_conj3_blicket_activation, has_noise: true, num_blickets: 3},
    "participant": {blicket_activation: null, has_noise: null, num_blickets: null}  // let participant create their own form/rule
}

// simple latin square for 6 between-participant conditions, where each differs by a shift of the order of forms from fform_dict
// except the participant form is always at the end
const row0 = ["disj", "noisy_conj", "conj3", "noisy_disj", "conj", "noisy_conj3", "participant"]
const row1 = ["noisy_conj3", "disj", "noisy_conj", "conj3", "noisy_disj", "conj", "participant"]
const row2 = ["conj", "noisy_conj3", "disj", "noisy_conj", "conj3", "noisy_disj", "participant"]
const row3 = ["noisy_disj", "conj", "noisy_conj3", "disj", "noisy_conj", "conj3", "participant"]
const row4 = ["conj3", "noisy_disj", "conj", "noisy_conj3", "disj", "noisy_conj", "participant"]
const row5 = ["noisy_conj", "conj3", "noisy_disj", "conj", "noisy_conj3", "disj", "participant"]

const row0_seq = {
    "PIS": {},
    "IntroInstructions": {ordered_fform_keys: row0},
    "End": {code_suffix: "ROW0"}
};

const row1_seq = {
    "PIS": {},
    "IntroInstructions": {ordered_fform_keys: row1},
    "End": {code_suffix: "ROW1"}
};

const row2_seq = {
    "PIS": {},
    "IntroInstructions": {ordered_fform_keys: row2},
    "End": {code_suffix: "ROW2"}
};

const row3_seq = {
    "PIS": {},
    "IntroInstructions": {ordered_fform_keys: row3},
    "End": {code_suffix: "ROW3"}
};

const row4_seq = {
    "PIS": {},
    "IntroInstructions": {ordered_fform_keys: row4},
    "End": {code_suffix: "ROW4"}
};

const row5_seq = {
    "PIS": {},
    "IntroInstructions": {ordered_fform_keys: row5},
    "End": {code_suffix: "ROW5"}
};

export {
    row0_seq,
    row1_seq,
    row2_seq,
    row3_seq,
    row4_seq,
    row5_seq,
    fform_dict
}
