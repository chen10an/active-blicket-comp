<script>
	import Router from 'svelte-spa-router';
	import {wrap} from 'svelte-spa-router/wrap'

	import ExperimentController from './routes/ExperimentController.svelte';
	import TestComponent from './components/Task.svelte';

	import { active_conj_seq, active_disj_seq } from './condition_configs/active.js';
	import { passive_conj_seq, passive_disj_seq } from './condition_configs/passive.js';

	const ALL_SEQ = [active_conj_seq, passive_conj_seq, active_disj_seq, passive_disj_seq];

	// create routes
	let routes = {};
	for (let i=0; i < ALL_SEQ.length; i++) {
		routes[`/conditions/${i}`] = wrap({
			component: ExperimentController,
			props: {
				component_sequence: ALL_SEQ[i],
				set_dev_mode: false
			}
		});

		routes[`/dev/conditions/${i}`] = wrap({
			component: ExperimentController,
			props: {
				component_sequence: ALL_SEQ[i],
				set_dev_mode: true
			}
		});
	}

	routes["/test"] = wrap({
		component: TestComponent,
		props: {
			instructions_seconds: 5,
			activation: (arg0, arg1, arg2) => arg2,
			replay_sequence: ["100", "100", "100", "010", "101", "101"]
		}
	});

	// TODO: implement different wrapper component for different platforms: reddit sample size, mturk and prolific
</script>

<Router {routes}/>

