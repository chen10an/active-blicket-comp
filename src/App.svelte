<script>
	import Task from "./Task.svelte";
	import Quiz from "./Quiz.svelte";

	let task_quiz_sequence = {
		"Task_0": {activation: (A, B, C) => A && C, max_combos: 2, time_limit_seconds: 15},  // conjunctive
		"Quiz_0": {quiz_json_path: "quizzes/A&C_3blocks_quiz.json"},
		"Task_1": {activation: (A, B, C) => A, max_combos: 4, time_limit_seconds: 15},  // disjunctive
		// showing that we can get as complex as we want:
		"Task_2": {activation: (A, B, C, D, E) => A, max_combos: 16, time_limit_seconds: 15}
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

<body>
	<div class="container">
		{#key current_task_quiz}
			<!-- Determine whether a task or quiz should be the next component shown to the participant -->
			{#if JSON.stringify(Object.keys(current_task_quiz)) == JSON.stringify(["activation", "max_combos", "time_limit_seconds"])}
				<Task {...current_task_quiz} on:continue={handleContinue}/>
			{:else}
				<Quiz {...current_task_quiz}/>
			{/if}
		{/key}
	</div>
</body>

<style>
	/* Global colors */
	:global(:root) {
		--red: #ef476f;
		--yellow: #ffd166;
		--green: #06d6a0;
		--blue: #118ab2;
		--dark-gray: #073b4c;
		--light-gray: #e8ebee;
	}

	.container {
		height: 100%;
		width: 100%;
	}

	/* TODO: make app responsive */
	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>