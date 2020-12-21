<script>
	import Router from 'svelte-spa-router';
	import {wrap} from 'svelte-spa-router/wrap';

	import ExperimentController from './routes/ExperimentController.svelte';
	import TestComponent from './components/pages/End.svelte';
	import { bonus_currency_str, dev_mode } from './modules/experiment_stores.js';

	import {c1_c2_d3, d1_d2_c3, c1_d3, d1_c3} from './condition_configs/incongruous.js';

	// configure the experiment conditions and bonuses
	const ALL_SEQ = [c1_c2_d3, d1_d2_c3, c1_d3, d1_c3];
	const bonus_val_arr = [0.05, 0.05, 0.075, 0.075];  // bonus per activation quiz question for each condition
	bonus_currency_str.set("$");

	// TODO: route that doesn't write data (can be turned on/off separately from dev mode)
	// create routes
	let routes = {};
	for (let i=0; i < ALL_SEQ.length; i++) {
		routes[`/conditions/${i}`] = wrap({
			component: ExperimentController,
			props: {
				component_sequence: ALL_SEQ[i],
				experiment_id: "active_blicket_comp_100-prolific",
				bonus_val_per_q: bonus_val_arr[i],
				set_dev_mode: true
			}
		});

		routes[`/dev/conditions/${i}`] = wrap({
			component: ExperimentController,
			props: {
				component_sequence: ALL_SEQ[i],
				experiment_id: "active_blicket_comp_10x-dev",
				bonus_val_per_q: bonus_val_arr[i],
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

