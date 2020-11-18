const time_limit_seconds = 45;
const est_time_str = "5-10 minutes";
const replay_person_name = "someone else";

const outline = [
    `An interactive blicket game with a time limit of ${time_limit_seconds} seconds`,
    "A quiz about the blicket game",
    "A recording of someone playing the blicket game",
    "A quiz about the recording"
];

const qa_dict = {
    "color": {"question": "A block’s <em>color</em> tells you whether it’s a blicket.", "correct_answer": false},
    "letter": {"question": "A block’s <em>letter</em> does <em>not</em> tell you whether it’s a blicket.", "correct_answer": true},
    "position": {"question": "A block’s <em>position</em> on the machine can influence whether the machine activates.", "correct_answer": false},
    "machine": {"question": "Only the blicket machine can help you figure out which blocks are blickets.", "correct_answer": true},
    "time_limit": {"question": `You have a time limit of ${time_limit_seconds} seconds to figure out which blocks are blickets.`, "correct_answer": true},
    "quiz": {"question": "You will be quizzed on your understanding of blickets and the blicket machine.", "correct_answer": true}
};

// Deterministic conjunctive with active training
const active_conj_seq = {
    "IntroInstructions": {collection_id: "intro", outline: outline, est_time_str: est_time_str, qa_dict: qa_dict},
    // interactive
    "Task_train": {collection_id: "conj_train", activation: (arg0, arg1, arg2) => arg0 && arg2, time_limit_seconds: time_limit_seconds},
    "Quiz_train": {collection_id: "conj_train", quiz_bit_combos: ["100", "010", "001", "110", "101", "011", "111"], activation: (arg0, arg1, arg2) => arg0 && arg2},
    // non-interactive replay
    "Task_test": {collection_id: "conj_test", activation: (arg0, arg1, arg2) => arg0 && arg2, replay_sequence: ["100", "100", "100", "010", "101", "101"], replay_person_name: replay_person_name},
    "Quiz_test": {collection_id: "conj_test", quiz_bit_combos: ["100", "010", "101"], activation: (arg0, arg1, arg2) => arg0 && arg2, is_last: true},  // only quiz the combos from the replay
    "End": {}
}

// Deterministic disjunctive with active training
const active_disj_seq = {
    "IntroInstructions": {collection_id: "intro", outline: outline, est_time_str: est_time_str, qa_dict, qa_dict},
    // interactive
    "Task_train": {collection_id: "disj_train", activation: (arg0, arg1, arg2) => arg0, time_limit_seconds: time_limit_seconds},
    "Quiz_train": {collection_id: "disj_train", quiz_bit_combos: ["100", "010", "001", "110", "101", "011", "111"], activation: (arg0, arg1, arg2) => arg0},
    // non-interactive replay
    "Task_test": {collection_id: "disj_test", activation: (arg0, arg1, arg2) => arg2, replay_sequence: ["100", "100", "100", "010", "101", "101"], replay_person_name: replay_person_name},
    "Quiz_test": {collection_id: "disj_test", quiz_bit_combos: ["100", "010", "101"], activation: (arg0, arg1, arg2) => arg2, is_last: true},  // only quiz the combos from the replay
    "End": {}
}

export {active_conj_seq, active_disj_seq};