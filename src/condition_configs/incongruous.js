// this config file specifies the following incongruous experiment conditions
// (where the last task has a different causal relationship from the preceding tasks):
// c_1 c_2 d_3
// d_1 d_2 c_3
// c_1 d_3
// d_1 c_3

const time_limit_seconds = 45;

const overview_2l = "Our study has 2 parts and lasts around 10min in total. Each part includes an interactive blicket game followed by a quiz about the game.";
const overview_3l = "Our study has 3 parts and lasts around 15min in total. Each part includes an interactive blicket game followed by a quiz about the game.";

const qa_dict = {
    "color": {"question": "A block’s <em>color</em> tells you whether it’s a blicket.", "correct_answer": false},
    "letter": {"question": "A block’s <em>letter</em> does <em>not</em> tell you whether it’s a blicket.", "correct_answer": true},
    "position": {"question": "A block’s <em>position</em> on the machine can influence whether the machine activates.", "correct_answer": false},
    "machine": {"question": "Only the blicket machine can help you figure out which blocks are blickets.", "correct_answer": true},
    "time_limit": {"question": `You have a time limit of ${time_limit_seconds} seconds to play the blicket game and figure out which blocks are blickets.`, "correct_answer": true},
    "quiz": {"question": "After each blicket game, you will be quizzed and scored on your understanding of blickets and the blicket machine.", "correct_answer": true}
};

// level 1: 3 blocks, 2 blickets
const conj_activation_l1 = (arg0, arg1, arg2) => arg0 + arg1 >= 2;
const disj_activation_l1 = (arg0, arg1, arg2) => arg0 >= 1;
const quiz_bit_combos_l1 = ["100", "010", "001", "110", "101", "011", "111"];
const score_ith_combo_l1 = Array(quiz_bit_combos_l1.length).fill(true);
const conj_l1 = {
    "Task": {collection_id: "level_1", activation: conj_activation_l1, time_limit_seconds: time_limit_seconds},
    "Quiz": {collection_id: "level_1", activation: conj_activation_l1, quiz_bit_combos: quiz_bit_combos_l1, score_ith_combo: score_ith_combo_l1}
};
const disj_l1 = {
    "Task": {collection_id: "level_1", activation: disj_activation_l1, time_limit_seconds: time_limit_seconds},
    "Quiz": {collection_id: "level_1", activation: disj_activation_l1, quiz_bit_combos: quiz_bit_combos_l1, score_ith_combo: score_ith_combo_l1}
};

// level 2: 6 blocks, 3 blickets
const conj_activation_l2 = (arg0, arg1, arg2, arg3, arg4, arg5) => arg0 + arg1 + arg2 >= 2;
const disj_activation_l2 = (arg0, arg1, arg2, arg3, arg4, arg5) => arg0 + arg1 + arg2 >= 1;
// 7 quiz bit combos: 3 blocks 1 blicket x2, 3 blocks 2 blickets x2, 2 blocks 0 blickets, 3 blocks 0 blickets, all blocks; 3rd combo includes a conjunction of the 2nd and 1st
const quiz_bit_combos_l2 = ["100011", "010101", "110010", "011100", "000011", "000111", "111111"];
const score_ith_combo_l2 = Array(quiz_bit_combos_l2.length).fill(true);
const conj_l2 = {
    "Task": {collection_id: "level_2", activation: conj_activation_l2, time_limit_seconds: time_limit_seconds},
    "Quiz": {collection_id: "level_2", activation: conj_activation_l2, quiz_bit_combos: quiz_bit_combos_l2, score_ith_combo: score_ith_combo_l2}
};
const disj_l2 = {
    "Task": {collection_id: "level_2", activation: disj_activation_l2, time_limit_seconds: time_limit_seconds},
    "Quiz": {collection_id: "level_2", activation: disj_activation_l2, quiz_bit_combos: quiz_bit_combos_l2, score_ith_combo: score_ith_combo_l2}
};

// level 3: 9 blocks, 4 blickets
const conj_activation_l3 = (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) => arg0 + arg1 + arg2 + arg3 >= 2;
const disj_activation_l3 = (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) => arg0 + arg1 + arg2 + arg3 >= 1;
// 7 quiz bit combos: 3 blocks 1 blicket x2, 3 blocks 2 blickets x2, 3 blocks 0 blickets, 4 blocks 0 blickets, all blocks; 3rd combo includes a conjunction of the 2nd and 1st
const quiz_bit_combos_l3 = ["100000011", "010001100", "110010000", "001100001", "000000111", "000011011", "111111111"];
const score_ith_combo_l3 = Array(quiz_bit_combos_l3.length).fill(true);
const conj_l3 = {
    "Task": {collection_id: "level_3", activation: conj_activation_l3, time_limit_seconds: time_limit_seconds},
    "Quiz": {collection_id: "level_3", activation: conj_activation_l3, quiz_bit_combos: quiz_bit_combos_l3, score_ith_combo: score_ith_combo_l3}
};
const disj_l3 = {
    "Task": {collection_id: "level_3", activation: disj_activation_l3, time_limit_seconds: time_limit_seconds},
    "Quiz": {collection_id: "level_3", activation: disj_activation_l3, quiz_bit_combos: quiz_bit_combos_l3, score_ith_combo: score_ith_combo_l3}
};

const c1_c2_d3 = {
    "PIS": {duration_str: "15 minutes"},
    "IntroInstructions": {collection_id: "intro", overview: overview_3l, qa_dict: qa_dict},
    "Task_1": conj_l1.Task,
    "Quiz_1": conj_l1.Quiz,
    "Task_2": conj_l2.Task,
    "Quiz_2": conj_l2.Quiz,
    "Task_3": disj_l3.Task,
    "Quiz_3": {...disj_l3.Quiz, is_last: true},
    "End": {}
};

const d1_d2_c3 = {
    "PIS": {duration_str: "15 minutes"},
    "IntroInstructions": {collection_id: "intro", overview: overview_3l, qa_dict: qa_dict},
    "Task_1": disj_l1.Task,
    "Quiz_1": disj_l1.Quiz,
    "Task_2": disj_l2.Task,
    "Quiz_2": disj_l2.Quiz,
    "Task_3": conj_l3.Task,
    "Quiz_3": {...conj_l3.Quiz, is_last: true},
    "End": {}
};

const c1_d3 = {
    "PIS": {duration_str: "10 minutes"},
    "IntroInstructions": {collection_id: "intro", overview: overview_2l, qa_dict: qa_dict},
    "Task_1": conj_l1.Task,
    "Quiz_1": conj_l1.Quiz,
    "Task_3": disj_l3.Task,
    "Quiz_3": {...disj_l3.Quiz, is_last: true},
    "End": {}
};

const d1_c3 = {
    "PIS": {duration_str: "10 minutes"},
    "IntroInstructions": {collection_id: "intro", overview: overview_2l, qa_dict: qa_dict},
    "Task_1": disj_l1.Task,
    "Quiz_1": disj_l1.Quiz,
    "Task_3": conj_l3.Task,
    "Quiz_3": {...conj_l3.Quiz, is_last: true},
    "End": {}
};

export {c1_c2_d3, d1_d2_c3, c1_d3, d1_c3}