<script>
	import IntroInstructions from '../components/IntroInstructions.svelte';
	import Task from '../components/Task.svelte';
    import Quiz from '../components/Quiz.svelte';
    import { block_dict, available_features, quiz_data_dict} from '../modules/experiment_stores.js';
    import { onDestroy } from 'svelte';

    // Stores that need to have at least one subscriber until the end of the experiment (to control when start() and stop() are called)
	const block_dict_unsub = block_dict.subscribe(value => {});
	const available_features_unsub = available_features.subscribe(value => {});
	const quiz_data_dict_unsub = quiz_data_dict.subscribe(value => {});
    // Unsubscribe at the end of the experiment
    onDestroy(() => {
        block_dict_unsub();
        available_features_unsub();
        quiz_data_dict_unsub();
    });
  
	// Deterministic conjunctive task and quiz sequence
	let task_quiz_sequence = {
		"IntroInstructions": {collection_id: "intro"},
		// interactive
		"Task_train": {collection_id: "conj_train", activation: (arg0, arg1, arg2) => arg0 && arg2, time_limit_seconds: 60},
		"Quiz_train": {collection_id: "conj_train", quiz_bit_combos: ["100", "010", "001", "110", "101", "011", "111"], activation: (arg0, arg1, arg2) => arg0 && arg2},
		// non-interactive replay
		"Task_test": {collection_id: "conj_test", activation: (arg0, arg1, arg2) => arg0 && arg2, time_limit_seconds: 60, replay_sequence: ["100", "100", "100", "010", "101", "101"]},
		"Quiz_test": {collection_id: "conj_test", quiz_bit_combos: ["100", "010", "101"], activation: (arg0, arg1, arg2) => arg0 && arg2},  // only quiz the combos from the replay
	}

	let task_quiz_keys = Object.keys(task_quiz_sequence);
	let task_quiz_dex = 0;
	$: current_key = task_quiz_keys[task_quiz_dex];

	// convert from the string of a component name to the component itself
	let str_to_component = {
		"Task": Task,
		"Quiz": Quiz,
		"IntroInstructions": IntroInstructions
	}

	// TODO: remove
	$: console.log(current_key.split("_")[0]);
	$: console.log(current_key);

	function handleContinue(event) {

		// increment task_quiz_dex to select the next task or quiz
		if (task_quiz_dex >= task_quiz_keys.length - 1) {
			// end of the entire experiment
			return;
		}
		task_quiz_dex += 1;
	}
</script>

<!-- Dynamically show different components to the participant depending on the first part of current_key -->
<svelte:component this={str_to_component[current_key.split("_")[0]]} {...task_quiz_sequence[current_key]} on:continue={handleContinue}/>