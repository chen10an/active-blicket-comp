<script>
	import Task from "./Task.svelte";
	import Quiz from "./Quiz.svelte";
	import { block_dict, available_features, quiz_data_dict} from "./modules/experiment_stores"

	// Stores that need to have at least one subscriber until the end of the experiment (to control when start() and stop() are called)
	const block_dict_unsub = block_dict.subscribe(value => {});
	const available_features_unsub = available_features.subscribe(value => {});
	const quiz_data_dict_unsub = quiz_data_dict.subscribe(value => {});
	// TODO: unsubscribe at the end of the experiment
  
	// deterministic disjunctive task and quiz sequence
	let task_quiz_sequence = {
		// interactive
		"Task_train": {collection_id: "train", activation: (arg0, arg1, arg2) => arg0, time_limit_seconds: 60},
		"Quiz_train": {collection_id: "train", quiz_bit_combos: ["001", "100", "011"], activation: (arg0, arg1, arg2) => arg0},
		// non-interactive replay
		"Task_test": {collection_id: "test", activation: (arg0, arg1, arg2) => arg2, time_limit_seconds: 60, replay_sequence: ["100", "100", "100", "010", "101", "101"]},
		"Quiz_test": {collection_id: "test", quiz_bit_combos: ["001", "100", "011"], activation: (arg0, arg1, arg2) => arg2},
	}
	// TODO: implement noisy conditions

	let task_quiz_keys = Object.keys(task_quiz_sequence);
	let task_quiz_dex = 0;
	$: current_key = task_quiz_keys[task_quiz_dex];

	// TODO: remove
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

{#key current_key}
	<!-- Determine whether a task or quiz should be the next component shown to the participant -->
	{#if current_key.startsWith("Task")}
		<Task {...task_quiz_sequence[current_key]} on:continue={handleContinue}/>
	{:else if current_key.startsWith("Quiz")}
		<Quiz {...task_quiz_sequence[current_key]} on:continue={handleContinue}/>
	{/if}
{/key}

<!-- TODO: consider using grid (https://svelte.dev/repl/18c5847e8f104fa1b161c54598ec3996?version=3.25.1) for smoother transitions -->
<!-- OR use delays -->