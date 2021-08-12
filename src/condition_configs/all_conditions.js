// this file specifies the experiment conditions as well as any one-off variables that are needed for a specific experiment version but will not necessarily generalize to future versions (e.g., long_bonus_time and teaching_bonus_val in 2.x.x)

export const short_bonus_time = "2 working days";  // max time for receiving auto-calculated bonus

export const long_bonus_time = "10 working days";  // max time for receiving coded bonus
export const teaching_bonus_val = 0.16;

export const fixed_num_interventions_l1 = 12;
export const fixed_num_interventions_l2 = 20;
export const min_time_seconds_l1 = 30;
export const min_time_seconds_l2 = 60;

export const qa_dict = {
    "color": {"question": "A block’s <em>color</em> tells you whether it’s a blicket.", "correct_answer": false},
    "letter": {"question": "A block’s <em>letter</em> tells you whether it’s a blicket.", "correct_answer": false},
    "position": {"question": "When a block is on the machine, its <em>position</em> can influence whether the machine activates.", "correct_answer": false},
    "machine": {"question": "Only the blicket machine can help you figure out which blocks are blickets.", "correct_answer": true},
    "intervention_limit": {"question": `You have a limited number of tries to test the blicket machine and figure out which blocks are blickets.`, "correct_answer": true},
    "min_time": {"question": `There is a minimum amount of time you must spend on the blicket game.`, "correct_answer": true},
    "quiz": {"question": "After each blicket game, you will be quizzed and scored on your understanding of blickets and the blicket machine.", "correct_answer": true}
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
    "noisy_conj3": {blicket_activation: noisy_conj3_blicket_activation, has_noise: true, num_blickets: 3}
}

const ordered_fform_keys = ["disj", "conj", "conj3", "noisy_disj", "noisy_conj", "noisy_conj3"]

// TODO: latin square orders --> 6 between-participant conditions

const within_seq = {
    "PIS": {},
    "IntroInstructions": {collection_id: "intro"},
    "End": {code_suffix: "WITHIN"}
};

export {
    within_seq,
    fform_dict,
    ordered_fform_keys
}
