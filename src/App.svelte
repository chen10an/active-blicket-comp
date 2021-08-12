<script>
	import Router from 'svelte-spa-router';
	import {wrap} from 'svelte-spa-router/wrap';

	import ExperimentController from './routes/ExperimentController.svelte';
	import TestComponent from './components/pages/IntroInstructions.svelte';
	import { bonus_currency_str, dev_mode } from './modules/experiment_stores.js';

	import { within_seq } from './condition_configs/all_conditions.js';

	// configure the experiment conditions and bonuses
	const ALL_SEQ = [within_seq]
	const ALL_SEQ_NAMES = ["within"];
	const bonus_val_arr = [0.1];  // max bonus per  question for each condition
	bonus_currency_str.set("$");

	// TODO: route that doesn't write data (can be turned on/off separately from dev mode)
	// create routes
	let routes = {};
	for (let i=0; i < ALL_SEQ.length; i++) {
		routes[`/conditions/${i}`] = wrap({
			component: ExperimentController,
			props: {
				component_sequence: ALL_SEQ[i],
				experiment_id: "active_blicket_comp_20x-mturk-micro",
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

