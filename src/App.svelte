<script>
	import Router from 'svelte-spa-router';
	import {wrap} from 'svelte-spa-router/wrap';

	import ExperimentController from './routes/ExperimentController.svelte';
	import TestComponent from './components/pages/Task.svelte';
	import { bonus_currency_str, dev_mode } from './modules/experiment_stores.js';

	import {
    // disj conditions 0, 1
    d1_c2, nd1_c2,
    // conj conditions 2, 3
    c1_c2, nc1_c2,
    // conj3 conditions 4, 5
    cc1_c2, ncc1_c2
	} from './condition_configs/all_conditions.js';

	// configure the experiment conditions and bonuses
	const ALL_SEQ = [d1_c2, nd1_c2, c1_c2, nc1_c2, cc1_c2, ncc1_c2]
	const ALL_SEQ_NAMES = ["c1_c2_d3", "d1_d2_c3", "c1_d3", "d1_c3", "c1_c2_c3", "d1_d2_d3", "c1_c3", "d1_d3"];
	const bonus_val_arr = [0.05, 0.05, 0.075, 0.075, 0.05, 0.05, 0.075, 0.075];  // bonus per activation quiz question for each condition
	bonus_currency_str.set("$");

	// TODO: route that doesn't write data (can be turned on/off separately from dev mode)
	// create routes
	let routes = {};
	for (let i=0; i < ALL_SEQ.length; i++) {
		routes[`/conditions/${i}`] = wrap({
			component: ExperimentController,
			props: {
				component_sequence: ALL_SEQ[i],
				experiment_id: "active_blicket_comp_200-mturk",
				condition_name: ALL_SEQ_NAMES[i],
				bonus_val_per_q: bonus_val_arr[i],
				set_dev_mode: false
			}
		});

		routes[`/dev/conditions/${i}`] = wrap({
			component: ExperimentController,
			props: {
				component_sequence: ALL_SEQ[i],
				experiment_id: "active_blicket_comp_20x-dev",
				condition_name: ALL_SEQ_NAMES[i],
				bonus_val_per_q: bonus_val_arr[i],
				set_dev_mode: true
			}
		});
	}

	routes["/test"] = wrap({
		component: TestComponent,
		conditions: [
            // hack: use pre-condition to activate dev_mode
            (detail) => {
				dev_mode.set(true);
				return dev_mode;
            },
        ]
	});

	// TODO: implement different wrapper component for different platforms: reddit sample size, mturk and prolific
</script>

<Router {routes}/>

