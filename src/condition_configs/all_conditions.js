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

const disj_activation_l1 = (arg0, arg1, arg2) => arg0 >= 1;
const noisy_disj_activation_l1 = function(arg0, arg1, arg2) {
    // equivalent (with rounding up/down at the asymptotes) to sigmoid with gain=11, bias=0.9 (when noise at 1 blicket is ~0.75)
    
    let num_blickets = arg0;  // non-neg integer
    if (num_blickets == 1) {
        return Math.random() < 0.75;  // noise
    } else if (num_blickets > 1) {
        return true;
    } else {
        return false;
    }
}
const correct_disj_ratings_l1 = [10, 0, 0];  // ith rating corresponds to block with _id_ i

const conj_activation_l1 = (arg0, arg1, arg2) => arg0 + arg1 >= 2;
const noisy_conj_activation_l1 = function(arg0, arg1, arg2) {
    // equivalent (with rounding up/down at the asymptotes) to sigmoid with gain=11, bias=1.9 (when noise at 2 blickets is ~0.75)
    
    let num_blickets = arg0 + arg1;  // non-neg integer
    if (num_blickets == 2) {
        return Math.random() < 0.75;  // noise
    } else if (num_blickets > 2) {
        return true;
    } else {
        return false;
    }
}
const correct_conj_ratings_l1 = [10, 10, 0];  // ith rating corresponds to block with _id_ i

const conj3_activation_l1 = (arg0, arg1, arg2) => arg0 + arg1 + arg2 >= 3;
const noisy_conj3_activation_l1 = function(arg0, arg1, arg2) {
    // equivalent (with rounding up/down at the asymptotes) to sigmoid with gain=11, bias=2.9 (when noise at 3 blickets is ~0.75)
    
    let num_blickets = arg0 + arg1 + arg2;  // non-neg integer
    if (num_blickets == 3) {
        return Math.random() < 0.75;  // noise
    } else if (num_blickets > 3) {
        return true;
    } else {
        return false;
    }
}
const correct_conj3_ratings_l1 = [10, 10, 10];  // ith rating corresponds to block with _id_ i

const disj_l1 = {
    "Task": {collection_id: "level_1", activation: disj_activation_l1, fixed_num_interventions: fixed_num_interventions_l1, min_time_seconds: min_time_seconds_l1},
    "Quiz": {collection_id: "level_1", correct_blicket_ratings: correct_disj_ratings_l1}
};
const noisy_disj_l1 = {
    "Task": {collection_id: "level_1", activation: noisy_disj_activation_l1, fixed_num_interventions: fixed_num_interventions_l1, min_time_seconds: min_time_seconds_l1},
    "Quiz": {collection_id: "level_1", correct_blicket_ratings: correct_disj_ratings_l1}
};

const conj_l1 = {
    "Task": {collection_id: "level_1", activation: conj_activation_l1, fixed_num_interventions: fixed_num_interventions_l1, min_time_seconds: min_time_seconds_l1},
    "Quiz": {collection_id: "level_1", correct_blicket_ratings: correct_conj_ratings_l1}
};
const noisy_conj_l1 = {
    "Task": {collection_id: "level_1", activation: noisy_conj_activation_l1, fixed_num_interventions: fixed_num_interventions_l1, min_time_seconds: min_time_seconds_l1},
    "Quiz": {collection_id: "level_1", correct_blicket_ratings: correct_conj_ratings_l1}
};

const conj3_l1 = {
    "Task": {collection_id: "level_1", activation: conj3_activation_l1, fixed_num_interventions: fixed_num_interventions_l1, min_time_seconds: min_time_seconds_l1},
    "Quiz": {collection_id: "level_1", correct_blicket_ratings: correct_conj3_ratings_l1}
};
const noisy_conj3_l1 = {
    "Task": {collection_id: "level_1", activation: noisy_conj3_activation_l1, fixed_num_interventions: fixed_num_interventions_l1, min_time_seconds: min_time_seconds_l1},
    "Quiz": {collection_id: "level_1", correct_blicket_ratings: correct_conj3_ratings_l1}
};

// level 2: 6 blocks, 3 blickets
const conj_activation_l2 = (arg0, arg1, arg2, arg3, arg4, arg5) => arg0 + arg1 + arg2 >= 2;
const correct_conj_ratings_l2 = [10, 10, 10, 0, 0, 0];  // ith rating corresponds to block with _id_ i
const conj_l2 = {
    "Task": {collection_id: "level_2", activation: conj_activation_l2, fixed_num_interventions: fixed_num_interventions_l2, min_time_seconds: min_time_seconds_l2},
    "Quiz": {collection_id: "level_2", correct_blicket_ratings: correct_conj_ratings_l2}
};

// Define all 6 conditions:
const d1_c2 = {
    "PIS": {},
    "IntroInstructions": {collection_id: "intro"},
    "Task_1": disj_l1.Task,
    "Quiz_1": disj_l1.Quiz,
    "Task_3": conj_l2.Task,
    "Quiz_3": {...conj_l2.Quiz, is_last: true},
    "End": {code_suffix: "D1C2"}
};

const nd1_c2 = {
    "PIS": {},
    "IntroInstructions": {collection_id: "intro"},
    "Task_1": noisy_disj_l1.Task,
    "Quiz_1": noisy_disj_l1.Quiz,
    "Task_3": conj_l2.Task,
    "Quiz_3": {...conj_l2.Quiz, is_last: true},
    "End": {code_suffix: "ND1C2"}
};

const c1_c2 = {
    "PIS": {},
    "IntroInstructions": {collection_id: "intro"},
    "Task_1": conj_l1.Task,
    "Quiz_1": conj_l1.Quiz,
    "Task_3": conj_l2.Task,
    "Quiz_3": {...conj_l2.Quiz, is_last: true},
    "End": {code_suffix: "C1C2"}
};

const nc1_c2 = {
    "PIS": {},
    "IntroInstructions": {collection_id: "intro"},
    "Task_1": noisy_conj_l1.Task,
    "Quiz_1": noisy_conj_l1.Quiz,
    "Task_3": conj_l2.Task,
    "Quiz_3": {...conj_l2.Quiz, is_last: true},
    "End": {code_suffix: "NC1C2"}
};

const cc1_c2 = {
    "PIS": {},
    "IntroInstructions": {collection_id: "intro"},
    "Task_1": conj3_l1.Task,
    "Quiz_1": conj3_l1.Quiz,
    "Task_3": conj_l2.Task,
    "Quiz_3": {...conj_l2.Quiz, is_last: true},
    "End": {code_suffix: "CC1C2"}
};

const ncc1_c2 = {
    "PIS": {},
    "IntroInstructions": {collection_id: "intro"},
    "Task_1": noisy_conj3_l1.Task,
    "Quiz_1": noisy_conj3_l1.Quiz,
    "Task_3": conj_l2.Task,
    "Quiz_3": {...conj_l2.Quiz, is_last: true},
    "End": {code_suffix: "NCC1C2"}
};

export {
    // disj conditions 0, 1
    d1_c2, nd1_c2,
    // conj conditions 2, 3
    c1_c2, nc1_c2,
    // conj3 conditions 4, 5
    cc1_c2, ncc1_c2
}
