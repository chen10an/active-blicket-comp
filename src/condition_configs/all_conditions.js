// this config file specifies the following 8 experiment conditions:

// mismatched (where the last task has a different causal relationship from the preceding tasks):
// c_1 c_2 d_3
// d_1 d_2 c_3
// c_1 d_3
// d_1 c_3

// matched (where the last task has the same causal relationship as the preceding tasks):
// c_1 c_2 c_3
// d_1 d_2 d_3
// c_1 c_3
// d_1 d_3

const fixed_num_interventions_l1 = 10;
const fixed_num_interventions_l2 = 20;
const min_time_seconds_l1 = 30;
const min_time_seconds_l2 = 60;

const overview_2l = `Our study has 2 parts and lasts around 10min in total. Each part includes an interactive "blicket game" (with a TODO: limit) followed by a quiz about the game. The blicket game gets harder throughout the study.`;
const overview_3l = `Our study has 3 parts and lasts around 15min in total. Each part includes an interactive "blicket game" (with a TODO: limit) followed by a quiz about the game. The blicket game gets harder throughout the study.`;

const qa_dict = {
    "color": {"question": "A block’s <em>color</em> tells you whether it’s a blicket.", "correct_answer": false},
    "letter": {"question": "A block’s <em>letter</em> does <em>not</em> tell you whether it’s a blicket.", "correct_answer": true},
    "position": {"question": "A block’s <em>position</em> on the machine can influence whether the machine activates.", "correct_answer": false},
    "machine": {"question": "Only the blicket machine can help you figure out which blocks are blickets.", "correct_answer": true},
    "time_limit": {"question": `You have a TODO:limit to play the blicket game and figure out which blocks are blickets.`, "correct_answer": true},
    "quiz": {"question": "After each blicket game, you will be quizzed and scored on your understanding of blickets and the blicket machine.", "correct_answer": true}
};

// level 1: 3 blocks, 1 blicket for disjunctive and 2 blickets for conjunctive
const noise_level = 0.75;

const disj_activation_l1 = (arg0, arg1, arg2) => arg0 >= 1;
const noisy_disj_activation_l1 = (arg0, arg1, arg2) => (arg0 >= 1) ? Math.random() < noise_level : false;

const conj_activation_l1 = (arg0, arg1, arg2) => arg0 + arg1 >= 2;
const noisy_conj_activation_l1 = (arg0, arg1, arg2) => (arg0 + arg1 >= 2) ? Math.random() < noise_level : false;

const conj3_activation_l1 = (arg0, arg1, arg2) => arg0 + arg1 + arg2 >= 3;
const noisy_conj3_activation_l1 = (arg0, arg1, arg2) => (arg0 + arg1 + arg2 >= 3) ? Math.random() < noise_level : false;

const quiz_bit_combos_l1 = ["100", "010", "001", "110", "101", "011", "111"];
const score_ith_combo_l1 = Array(quiz_bit_combos_l1.length).fill(true);

const disj_l1 = {
    "Task": {collection_id: "level_1", activation: disj_activation_l1, fixed_num_interventions: fixed_num_interventions_l1, min_time_seconds: min_time_seconds_l1},
    "Quiz": {collection_id: "level_1", activation: disj_activation_l1, quiz_bit_combos: quiz_bit_combos_l1, score_ith_combo: score_ith_combo_l1}
};
const noisy_disj_l1 = {
    "Task": {collection_id: "level_1", activation: noisy_disj_activation_l1, fixed_num_interventions: fixed_num_interventions_l1, min_time_seconds: min_time_seconds_l1},
    "Quiz": {collection_id: "level_1", activation: noisy_disj_activation_l1, quiz_bit_combos: quiz_bit_combos_l1, score_ith_combo: score_ith_combo_l1}
};

const conj_l1 = {
    "Task": {collection_id: "level_1", activation: conj_activation_l1, fixed_num_interventions: fixed_num_interventions_l1, min_time_seconds: min_time_seconds_l1},
    "Quiz": {collection_id: "level_1", activation: conj_activation_l1, quiz_bit_combos: quiz_bit_combos_l1, score_ith_combo: score_ith_combo_l1}
};
const noisy_conj_l1 = {
    "Task": {collection_id: "level_1", activation: noisy_conj_activation_l1, fixed_num_interventions: fixed_num_interventions_l1, min_time_seconds: min_time_seconds_l1},
    "Quiz": {collection_id: "level_1", activation: noisy_conj_activation_l1, quiz_bit_combos: quiz_bit_combos_l1, score_ith_combo: score_ith_combo_l1}
};

const conj3_l1 = {
    "Task": {collection_id: "level_1", activation: conj3_activation_l1, fixed_num_interventions: fixed_num_interventions_l1, min_time_seconds: min_time_seconds_l1},
    "Quiz": {collection_id: "level_1", activation: conj3_activation_l1, quiz_bit_combos: quiz_bit_combos_l1, score_ith_combo: score_ith_combo_l1}
};
const noisy_conj3_l1 = {
    "Task": {collection_id: "level_1", activation: noisy_conj3_activation_l1, fixed_num_interventions: fixed_num_interventions_l1, min_time_seconds: min_time_seconds_l1},
    "Quiz": {collection_id: "level_1", activation: noisy_conj3_activation_l1, quiz_bit_combos: quiz_bit_combos_l1, score_ith_combo: score_ith_combo_l1}
};

// level 2: 6 blocks, 3 blickets
const conj_activation_l2 = (arg0, arg1, arg2, arg3, arg4, arg5) => arg0 + arg1 + arg2 >= 2;
// 7 quiz bit combos: 3 blocks 1 blicket x2, 3 blocks 2 blickets x2, 2 blocks 0 blickets, 3 blocks 0 blickets, all blocks; 3rd combo includes a conjunction of the 2nd and 1st
const quiz_bit_combos_l2 = ["100011", "010101", "110010", "011100", "000011", "000111", "111111"];
const score_ith_combo_l2 = Array(quiz_bit_combos_l2.length).fill(true);
const conj_l2 = {
    "Task": {collection_id: "level_2", activation: conj_activation_l2, fixed_num_interventions: fixed_num_interventions_l2, min_time_seconds: min_time_seconds_l2},
    "Quiz": {collection_id: "level_2", activation: conj_activation_l2, quiz_bit_combos: quiz_bit_combos_l2, score_ith_combo: score_ith_combo_l2}
};

// Define all 6 conditions:
const d1_c2 = {
    "PIS": {duration_str: "10 minutes"},
    "IntroInstructions": {collection_id: "intro", overview: overview_2l, qa_dict: qa_dict},
    "Task_1": disj_l1.Task,
    "Quiz_1": disj_l1.Quiz,
    "Task_3": conj_l2.Task,
    "Quiz_3": {...conj_l2.Quiz, is_last: true},
    "End": {code_suffix: "D1C2"}
};

const nd1_c2 = {
    "PIS": {duration_str: "10 minutes"},
    "IntroInstructions": {collection_id: "intro", overview: overview_2l, qa_dict: qa_dict},
    "Task_1": noisy_disj_l1.Task,
    "Quiz_1": noisy_disj_l1.Quiz,
    "Task_3": conj_l2.Task,
    "Quiz_3": {...conj_l2.Quiz, is_last: true},
    "End": {code_suffix: "ND1C2"}
};

const c1_c2 = {
    "PIS": {duration_str: "10 minutes"},
    "IntroInstructions": {collection_id: "intro", overview: overview_2l, qa_dict: qa_dict},
    "Task_1": conj_l1.Task,
    "Quiz_1": conj_l1.Quiz,
    "Task_3": conj_l2.Task,
    "Quiz_3": {...conj_l2.Quiz, is_last: true},
    "End": {code_suffix: "C1C2"}
};

const nc1_c2 = {
    "PIS": {duration_str: "10 minutes"},
    "IntroInstructions": {collection_id: "intro", overview: overview_2l, qa_dict: qa_dict},
    "Task_1": noisy_conj_l1.Task,
    "Quiz_1": noisy_conj_l1.Quiz,
    "Task_3": conj_l2.Task,
    "Quiz_3": {...conj_l2.Quiz, is_last: true},
    "End": {code_suffix: "NC1C2"}
};

const cc1_c2 = {
    "PIS": {duration_str: "10 minutes"},
    "IntroInstructions": {collection_id: "intro", overview: overview_2l, qa_dict: qa_dict},
    "Task_1": conj3_l1.Task,
    "Quiz_1": conj3_l1.Quiz,
    "Task_3": conj_l2.Task,
    "Quiz_3": {...conj_l2.Quiz, is_last: true},
    "End": {code_suffix: "CC1C2"}
};

const ncc1_c2 = {
    "PIS": {duration_str: "10 minutes"},
    "IntroInstructions": {collection_id: "intro", overview: overview_2l, qa_dict: qa_dict},
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
