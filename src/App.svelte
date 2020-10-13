<script>
	let task_quiz_sequence = {
		"Task_0": {"func": (A, B) => A || B, "max_combos": 3, "time_limit_seconds": 30}
	}

	import Task from './Task.svelte';
</script>

<body>
	<div class="container">
		<!-- TODO: use #key to control the sequence of tasks and quizzes-->
		<Task activation={task_quiz_sequence["Task_0"]["func"]} max_combos={task_quiz_sequence["Task_0"]["max_combos"]} time_limit_seconds={task_quiz_sequence["Task_0"]["time_limit_seconds"]}/>
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