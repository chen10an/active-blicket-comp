const est_time_str = "5-10 minutes";
const first_person_name = "someone";
const second_person_name = "a second person";

const passive_outline = [
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