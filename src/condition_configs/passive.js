const est_time_str = "5-10 minutes";
const first_person_name = "someone";
const second_person_name = "a second person";

const outline = [
    "A recording of someone playing the blicket game",
    "A quiz about the recording",
    "A recording of a second person playing the blicket game",
    "A quiz about the second recording"
];

const qa_dict = {
    "color": {"question": "A block’s <em>color</em> tells you whether it’s a blicket.", "correct_answer": false},
    "letter": {"question": "A block’s <em>letter</em> does <em>not</em> tell you whether it’s a blicket.", "correct_answer": true},
    "position": {"question": "A block’s <em>position</em> on the machine can influence whether the machine activates.", "correct_answer": false},
    "machine": {"question": "Only the blicket machine can help you figure out which blocks are blickets.", "correct_answer": true},
    "quiz": {"question": "You will be quizzed on your understanding of blickets and the blicket machine.", "correct_answer": true}
};

// Deterministic conjunctive with only passive replays
const passive_conj_seq = {
    "PIS": {},
    "IntroInstructions": {collection_id: "intro", outline: outline, est_time_str: est_time_str, qa_dict: qa_dict},
    "Task_train": {collection_id: "conj_train", activation: (arg0, arg1, arg2) => arg0 && arg2, replay_sequence: ["100", "010", "001", "110", "101", "011"], replay_person_name: first_person_name},
    "Quiz_train": {collection_id: "conj_train", quiz_bit_combos: ["100", "010", "001", "110", "101", "011"], activation: (arg0, arg1, arg2) => arg0 && arg2},
    "Task_test": {collection_id: "conj_test", activation: (arg0, arg1, arg2) => arg0 && arg2, replay_sequence: ["100", "100", "100", "010", "101", "101"], replay_person_name: second_person_name},
    "Quiz_test": {collection_id: "conj_test", quiz_bit_combos: ["100", "010", "101"], activation: (arg0, arg1, arg2) => arg0 && arg2, is_last: true},  // only quiz the combos from the replay
    "End": {}
}

// Deterministic disjunctive with only passive replays
const passive_disj_seq = {
    "PIS": {},
    "IntroInstructions": {collection_id: "intro", outline: outline, est_time_str: est_time_str, qa_dict, qa_dict},
    "Task_train": {collection_id: "disj_train", activation: (arg0, arg1, arg2) => arg0, replay_sequence: ["100", "010", "001", "110", "101", "011"], replay_person_name: first_person_name},
    "Quiz_train": {collection_id: "disj_train", quiz_bit_combos: ["100", "010", "001", "110", "101", "011"], activation: (arg0, arg1, arg2) => arg0},
    "Task_test": {collection_id: "disj_test", activation: (arg0, arg1, arg2) => arg2, replay_sequence: ["100", "100", "100", "010", "101", "101"], replay_person_name: second_person_name},
    "Quiz_test": {collection_id: "disj_test", quiz_bit_combos: ["100", "010", "101"], activation: (arg0, arg1, arg2) => arg2, is_last: true},  // only quiz the combos from the replay
    "End": {}
}

export {passive_conj_seq, passive_disj_seq}