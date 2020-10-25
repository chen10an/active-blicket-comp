<script>
	import Task from "./Task.svelte";
	import Quiz from "./Quiz.svelte";
	import TaskVid from "./TaskVid.svelte"
  
	let task_quiz_sequence = {
		// "Video_0": {},
		// "Task_dev": {activation: (arg0, arg1, arg2) => arg0 && arg2, time_limit_seconds: 60, randomize_arg_order: false},  // conjunctive
		// "Quiz_dev": {quiz_id: "training_quiz", quiz_bit_combos: ["001", "100", "011"], activation: (arg0, arg1, arg2) => arg0},
		"Task_0": {activation: (arg0, arg1, arg2) => arg0 && arg2, time_limit_seconds: 60, noise:0},  // conjunctive
		"Quiz_0": {quiz_id: "training_quiz", quiz_bit_combos: ["101", "100", "011"], activation: (arg0, arg1, arg2) => arg0},
		"Task_1": {activation: (arg0, arg1, arg2) => arg0, time_limit_seconds: 60, noise:0},  // deterministic disjunctive
		"Task_1_noisy": {activation: (arg0, arg1, arg2) => arg0, time_limit_seconds: 60, noise:0.5},  // noisy disjunctive
		// showing that we can get complex:
		"Task_2": {activation: (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) => arg0, time_limit_seconds: 60, noise:0}
	}
	// TODO: sequence should be task --> quiz --> demo/video of task --> quiz
	// TODO: pass a readable ID to components that can be used to distinguish their data in experiment_stores.js

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
	{:else}
		<TaskVid/>
	{/if}
{/key}

<!-- TODO: consider using grid (https://svelte.dev/repl/18c5847e8f104fa1b161c54598ec3996?version=3.25.1) for smoother transitions -->
<!-- OR use delays -->