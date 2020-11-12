<script>
	import Router from 'svelte-spa-router';
	import {wrap} from 'svelte-spa-router/wrap'

	import ExperimentController from './routes/ExperimentController.svelte';
	import Task from './components/Task.svelte'  // TODO: remove

	// Deterministic conjunctive task and quiz sequence
	let conj_sequence = {
		"IntroInstructions": {collection_id: "intro"},
		// interactive
		"Task_train": {collection_id: "conj_train", activation: (arg0, arg1, arg2) => arg0 && arg2},
		"Quiz_train": {collection_id: "conj_train", quiz_bit_combos: ["100", "010", "001", "110", "101", "011", "111"], activation: (arg0, arg1, arg2) => arg0 && arg2},
		// non-interactive replay
		"Task_test": {collection_id: "conj_test", activation: (arg0, arg1, arg2) => arg0 && arg2, replay_sequence: ["100", "100", "100", "010", "101", "101"]},
		"Quiz_test": {collection_id: "conj_test", quiz_bit_combos: ["100", "010", "101"], activation: (arg0, arg1, arg2) => arg0 && arg2},  // only quiz the combos from the replay
		"End": {}
	}

	// Deterministic disjunctive task and quiz sequence
	let disj_sequence = {
		"IntroInstructions": {collection_id: "intro"},
		// interactive
		"Task_train": {collection_id: "disj_train", activation: (arg0, arg1, arg2) => arg0},
		"Quiz_train": {collection_id: "disj_train", quiz_bit_combos: ["100", "010", "001", "110", "101", "011", "111"], activation: (arg0, arg1, arg2) => arg0},
		// non-interactive replay
		"Task_test": {collection_id: "disj_test", activation: (arg0, arg1, arg2) => arg2, replay_sequence: ["100", "100", "100", "010", "101", "101"]},
		"Quiz_test": {collection_id: "disj_test", quiz_bit_combos: ["100", "010", "101"], activation: (arg0, arg1, arg2) => arg2},  // only quiz the combos from the replay
		"End": {}
	}

	const routes = {
		'/condition0': wrap({
			component: ExperimentController,
			props: {
				component_sequence: conj_sequence
			},
		}),
		'/condition2': wrap({
			component: ExperimentController,
			props: {
				component_sequence: disj_sequence
			},
		}),
		"/testing": Task  // TODO: remove
	}

	// TODO: implement noisy conditions
	// TODO: terminate the experiment on page reload: destroy the app component

	// TODO: implement dev mode variable in stores
	// TODO: implement different wrapper component for different platforms: reddit sample size, mturk and prolific
</script>

<Router {routes}/>

