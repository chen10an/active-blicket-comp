<script>
	import Router from 'svelte-spa-router';
	import {wrap} from 'svelte-spa-router/wrap';

	import ExperimentController from './routes/ExperimentController.svelte';
	import TestComponent from './components/pages/Quiz.svelte';
	import { bonus_pounds, dev_mode } from './modules/experiment_stores.js';

	import {c1_c2_d3, d1_d2_c3, c1_d3, d1_c3} from './condition_configs/incongruous.js';

	const ALL_SEQ = [c1_c2_d3, d1_d2_c3, c1_d3, d1_c3];
	const bonus_pounds_arr = [0.5, 0.5, 0.75, 0.75];  // bonus per activation quiz question for each condition
	// TODO: add bonus back to PIS

	// TODO: route that doesn't write data (can be turned on/off separately from dev mode)
	// create routes
	let routes = {};
	for (let i=0; i < ALL_SEQ.length; i++) {
		routes[`/conditions/${i}`] = wrap({
			component: ExperimentController,
			props: {
				component_sequence: ALL_SEQ[i],
				experiment_id: "active_blicket_comp_100",
				bonus_pounds_per_q: bonus_pounds_arr[i],
				set_dev_mode: true
			}
		});

		routes[`/dev/conditions/${i}`] = wrap({
			component: ExperimentController,
			props: {
				component_sequence: ALL_SEQ[i],
				experiment_id: "active_blicket_comp_10x_dev",
				bonus_pounds_per_q: bonus_pounds_arr[i],
				set_dev_mode: true
			}
		});
	}

	routes["/test"] = wrap({
		component: TestComponent,
		conditions: [
            // use pre-condition to activate dev_mode
            (detail) => {
				dev_mode.set(true);
				return dev_mode;
            },
        ]
	});

	// TODO: implement different wrapper component for different platforms: reddit sample size, mturk and prolific
</script>

<Router {routes}/>

