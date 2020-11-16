<script>
	export let component_sequence;

	import IntroInstructions from '../components/IntroInstructions.svelte';
	import Task from '../components/Task.svelte';
	import Quiz from '../components/Quiz.svelte';
	import End from '../components/End.svelte';
	import { onDestroy } from 'svelte';
	import { block_dict, available_features, quiz_data_dict, available_ids} from '../modules/experiment_stores.js';
	import { init_block_dict, init_available_features, init_available_ids } from '../modules/init_functions.js';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

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

	function handleContinue(event) {

		// force the end of the experiment
		if (event.detail && event.detail.end) {
			task_quiz_dex = task_quiz_keys.length - 1;
			return;
		}

		// increment task_quiz_dex to select the next task or quiz
		task_quiz_dex += 1;
		// incremement the progress bar
		progress.update(x => x + progress_inc);
	}
</script>

<progress value={$progress}></progress>
<!-- Dynamically show different components to the participant depending on the first part of current_key -->
<svelte:component this={str_to_component[current_key.split("_")[0]]} {...component_sequence[current_key]} on:continue={handleContinue}/>

<style>
	progress {
		display: block;
		position: fixed;
		bottom: 0;
		width: 100%;
		z-index: 20;
	}
</style>