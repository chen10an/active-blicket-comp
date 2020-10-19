<script>
	import Task from "./Task.svelte";
	import Quiz from "./Quiz.svelte";

	let task_quiz_sequence = {
		"Task_0": {activation: (A, B, C) => A && C, time_limit_seconds: 60},  // conjunctive
		"Task_1": {activation: (A, B, C) => A, time_limit_seconds: 60},  // disjunctive
		// showing that we can get as complex as we want:
		"Task_2": {activation: (A, B, C, D, E, F, G, H, I) => A, time_limit_seconds: 60}
	}

	let task_quiz_keys = Object.keys(task_quiz_sequence);
	let task_quiz_dex = 0;
	$: current_task_quiz = task_quiz_sequence[task_quiz_keys[task_quiz_dex]];

	function handleContinue() {
		// Increment task_quiz_dex to select the next task or quiz
		if (task_quiz_dex >= task_quiz_keys.length - 1) {
			// end of the entire experiment
			return;
		}
		task_quiz_dex += 1;
	}
</script>

{#key current_task_quiz}
	<!-- Determine whether a task or quiz should be the next component shown to the participant -->
	{#if JSON.stringify(Object.keys(current_task_quiz)) == JSON.stringify(["activation", "time_limit_seconds"])}
		<Task {...current_task_quiz} on:continue={handleContinue}/>
	{:else}
		<Quiz {...current_task_quiz}/>
	{/if}
{/key}