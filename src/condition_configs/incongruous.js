// this config file specifies the following incongruous experiment conditions
// (where the last task has a different causal relationship from the preceding tasks):
// c_1 c_2 d_3
// d_1 d_2 c_3
// c_1 d_3
// d_1 c_3

const time_limit_seconds = 45;
const quiz_bit_combos = ["100", "010", "001", "110", "101", "011", "111"];
const score_ith_combo = Array(quiz_bit_combos.length).fill(true);

const overview_2l = "Our study has 2 parts that last around 5-10min in total. Each part includes an interactive blicket game followed by a quiz about the game.";
const overview_3l = "Our study has 3 parts that last around 7-12min in total. Each part includes an interactive blicket game followed by a quiz about the game.";

const qa_dict = {
    "color": {"question": "A block’s <em>color</em> tells you whether it’s a blicket.", "correct_answer": false},
    "letter": {"question": "A block’s <em>letter</em> does <em>not</em> tell you whether it’s a blicket.", "correct_answer": true},
    "position": {"question": "A block’s <em>position</em> on the machine can influence whether the machine activates.", "correct_answer": false},
    "machine": {"question": "Only the blicket machine can help you figure out which blocks are blickets.", "correct_answer": true},
    "time_limit": {"question": `You have a time limit of ${time_limit_seconds} seconds to figure out which blocks are blickets.`, "correct_answer": true},
    "quiz": {"question": "You will be quizzed on your understanding of blickets and the blicket machine.", "correct_answer": true}
};

// level 1: 3 blocks, 2 blickets
const conj_activation_l1 = (arg0, arg1, arg2) => arg0 + arg1 >= 2;
const disj_activation_l1 = (arg0, arg1, arg2) => arg0 + arg1 >= 1;
const conj_l1 = {
    "Task": {collection_id: "level_1", activation: conj_activation_l1, time_limit_seconds: time_limit_seconds},
    "Quiz": {collection_id: "level_1", activation: conj_activation_l1, quiz_bit_combos: quiz_bit_combos, score_ith_combo: score_ith_combo}
};
const disj_l1 = {
    "Task": {collection_id: "level_1", activation: disj_activation_l1, time_limit_seconds: time_limit_seconds},
    "Quiz": {collection_id: "level_1", activation: disj_activation_l1, quiz_bit_combos: quiz_bit_combos, score_ith_combo: score_ith_combo}
};

// level 2: 6 blocks, 3 blickets
const conj_activation_l2 = (arg0, arg1, arg2, arg3, arg4, arg5) => arg0 + arg1 + arg2 >= 2;
const disj_activation_l2 = (arg0, arg1, arg2, arg3, arg4, arg5) => arg0 + arg1 + arg2 >= 1;
const conj_l2 = {
    "Task": {collection_id: "level_2", activation: conj_activation_l2, time_limit_seconds: time_limit_seconds},
    "Quiz": {collection_id: "level_2", activation: conj_activation_l2, quiz_bit_combos: quiz_bit_combos, score_ith_combo: score_ith_combo}
};
const disj_l2 = {
    "Task": {collection_id: "level_2", activation: disj_activation_l2, time_limit_seconds: time_limit_seconds},
    "Quiz": {collection_id: "level_2", activation: disj_activation_l2, quiz_bit_combos: quiz_bit_combos, score_ith_combo: score_ith_combo}
};

// level 3: 9 blocks, 4 blickets
const conj_activation_l3 = (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) => arg0 + arg1 + arg2 + arg3 >= 2;
const disj_activation_l3 = (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) => arg0 + arg1 + arg2 + arg3 >= 1;
const conj_l3 = {
    "Task": {collection_id: "level_3", activation: conj_activation_l3, time_limit_seconds: time_limit_seconds},
    "Quiz": {collection_id: "level_3", activation: conj_activation_l3, quiz_bit_combos: quiz_bit_combos, score_ith_combo: score_ith_combo}
};
const disj_l3 = {
    "Task": {collection_id: "level_3", activation: disj_activation_l3, time_limit_seconds: time_limit_seconds},
    "Quiz": {collection_id: "level_3", activation: disj_activation_l3, quiz_bit_combos: quiz_bit_combos, score_ith_combo: score_ith_combo}
};

const c1_c2_d3 = {
    "PIS": {},
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
    "PIS": {},
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
    "PIS": {},
    "IntroInstructions": {collection_id: "intro", overview: overview_2l, qa_dict: qa_dict},
    "Task_1": conj_l1.Task,
    "Quiz_1": conj_l1.Quiz,
    "Task_3": disj_l3.Task,
    "Quiz_3": {...disj_l3.Quiz, is_last: true},
    "End": {}
};

const d1_c3 = {
    "PIS": {},
    "IntroInstructions": {collection_id: "intro", overview: overview_2l, qa_dict: qa_dict},
    "Task_1": disj_l1.Task,
    "Quiz_1": disj_l1.Quiz,
    "Task_3": conj_l3.Task,
    "Quiz_3": {...conj_l3.Quiz, is_last: true},
    "End": {}
};

export {c1_c2_d3, d1_d2_c3, c1_d3, d1_c3}