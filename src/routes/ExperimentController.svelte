<script>
	export let component_sequence;
	export let set_dev_mode = false;

	import IntroInstructions from '../components/IntroInstructions.svelte';
	import Task from '../components/Task.svelte';
	import Quiz from '../components/Quiz.svelte';
	import End from '../components/End.svelte';
	import { block_dict, available_features, quiz_data_dict, available_ids, current_score, total_score, dev_mode } from '../modules/experiment_stores.js';
	import { init_block_dict, init_available_features, init_available_ids } from '../modules/init_functions.js';

	import { onDestroy } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	
	dev_mode.set(set_dev_mode);

	// Stores that need to have at least one subscriber until the end of the experiment (to control when start() and stop() are called)
	const block_dict_unsub = block_dict.subscribe(value => {});
	const available_features_unsub = available_features.subscribe(value => {});
	const quiz_data_dict_unsub = quiz_data_dict.subscribe(value => {});

	function reset_stores() {
		// reset store values
		block_dict.set(init_block_dict());
		available_features.set(init_available_features());
		available_ids.set(init_available_ids());
	}

	onDestroy(() => {
		// reset store values whenever an instance of this component gets destroyed
		reset_stores();
	});
	
	// experiment progress bar
	const progress = tweened(0, {duration: 500, easing: cubicOut});
	let progress_inc = 1/(Object.keys(component_sequence).length - 1);  // how much to increment the progress bar for each component

	// update the total quiz score based on the props to the Quiz component
	let total_quiz_score = 0;
	for (const key in component_sequence) {
		if (key.split("_")[0] == "Quiz") {
			total_quiz_score += component_sequence[key].quiz_bit_combos.length;
		}
	}
	total_score.set(total_quiz_score);

	let task_quiz_keys = Object.keys(component_sequence);
	let task_quiz_dex = 0;
	$: current_key = task_quiz_keys[task_quiz_dex];

	// convert from the string of a component name to the component itself
	let str_to_component = {
		"Task": Task,
		"Quiz": Quiz,
		"IntroInstructions": IntroInstructions,
		"End": End
	}
	$: current_component = str_to_component[current_key.split("_")[0]];
	$: current_props = component_sequence[current_key];

	let scrollY = 0;

	function handleContinue(event) {
		// force the end of the experiment
		if (event.detail && event.detail.trouble) {
			current_component = End;
			current_props = {is_trouble: true};
			return;
		}

		// increment task_quiz_dex to select the next task or quiz
		task_quiz_dex += 1;
		// incremement the progress bar
		progress.update(x => x + progress_inc);
		scrollY = 0; // make sure to start each component at the top of the window
	}
</script>

<svelte:window bind:scrollY={scrollY}/>
<!-- Dynamically show different components to the participant depending on the first part of current_key -->
<svelte:component this={current_component} {...current_props} on:continue={handleContinue}/>

<div class="bottom">
	<progress value={$progress}></progress>
	<span class="score"><span style="font-size: 0.7rem;">Running Quiz Score: </span><b>{$current_score}/{$total_score}</b></span>
</div>


<style>
	.bottom {
		position: fixed;
		bottom: 0;
		width: 100%;
		z-index: 20;

		display: flex;
		justify-content: space-between;
	}

	progress {
		flex-grow: 1;
		align-self: flex-end;
	}

	.score {
		margin: 0 0.5rem;
		padding: 0.5rem;
		text-align: center;

		background-color: rgb(255, 255, 255, 0.7);
		border-radius: var(--container-border-radius);
        box-shadow: var(--container-box-shadow);
	}
</style>