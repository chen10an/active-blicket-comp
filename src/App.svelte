<script>
	import Task from "./Task.svelte";
	import Quiz from "./Quiz.svelte";
	import TaskVid from "./TaskVid.svelte"

	// track the specific initialization of blocks in the most recent Task
	// and the pass this as a prop to the following Quiz
	let quiz_block_arr;
	// TODO: use a store to keep track of the current blocks

	let task_quiz_sequence = {
		// "Video_0": {},
		// "Task_dev": {activation: (arg0, arg1, arg2) => arg0 && arg2, time_limit_seconds: 60, randomize_arg_order: false},  // conjunctive
		"Task_0": {activation: (arg0, arg1, arg2) => arg0 && arg2, time_limit_seconds: 60, randomize_arg_order: true, noise:0},  // conjunctive
		"Quiz_0": {quiz_bit_combos: ["101", "100", "111"]},
		"Task_1": {activation: (arg0, arg1, arg2) => arg0, time_limit_seconds: 60, randomize_arg_order: true, noise:0},  // deterministic disjunctive
		"Task_1_noisy": {activation: (arg0, arg1, arg2) => arg0, time_limit_seconds: 60, randomize_arg_order: true, noise:0.5},  // noisy disjunctive
		// showing that we can get complex:
		"Task_2": {activation: (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) => arg0, time_limit_seconds: 60, randomize_arg_order: true}
	}

	let task_quiz_keys = Object.keys(task_quiz_sequence);
	let task_quiz_dex = 0;
	$: current_task_quiz = task_quiz_sequence[task_quiz_keys[task_quiz_dex]];

	function handleContinue(event) {
		// update `block_arr` from the task that just finished
		quiz_block_arr = event.detail.block_arr;

		// increment task_quiz_dex to select the next task or quiz
		if (task_quiz_dex >= task_quiz_keys.length - 1) {
			// end of the entire experiment
			return;
		}
		task_quiz_dex += 1;
	}
</script>

{#key current_task_quiz}
	<!-- Determine whether a task or quiz should be the next component shown to the participant -->
	{#if JSON.stringify(Object.keys(current_task_quiz)) == JSON.stringify(["activation", "time_limit_seconds", "randomize_arg_order", "noise"])}
		<Task {...current_task_quiz} on:continue={handleContinue}/>
	{:else if JSON.stringify(Object.keys(current_task_quiz)) == JSON.stringify(["quiz_bit_combos"])}
		<Quiz block_arr={quiz_block_arr} {...current_task_quiz} on:continue={handleContinue}/>
	{:else}
		<TaskVid/>
	{/if}
{/key}