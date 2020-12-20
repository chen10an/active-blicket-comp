<script>
	import Router from 'svelte-spa-router';
	import {wrap} from 'svelte-spa-router/wrap';

	import ExperimentController from './routes/ExperimentController.svelte';
	import TestComponent from './components/pages/Task.svelte';

	import { active_conj_seq, active_disj_seq } from './condition_configs/active.js';
	import { passive_conj_seq, passive_disj_seq } from './condition_configs/passive.js';

	const ALL_SEQ = [active_conj_seq, passive_conj_seq, active_disj_seq, passive_disj_seq];

	// TODO: route that doesn't write data (can be turned on/off separately from dev mode)
	// create routes
	let routes = {};
	for (let i=0; i < ALL_SEQ.length; i++) {
		routes[`/conditions/${i}`] = wrap({
			component: ExperimentController,
			props: {
				component_sequence: ALL_SEQ[i],
				set_dev_mode: false,
				experiment_id: "active_blicket_comp_000"
			}
		});

		routes[`/groups/1/conditions/${i}`] = wrap({
			component: ExperimentController,
			props: {
				component_sequence: ALL_SEQ[i],
				set_dev_mode: false,
				experiment_id: "active_blicket_comp_001"
			}
		});

		routes[`/dev/conditions/${i}`] = wrap({
			component: ExperimentController,
			props: {
				component_sequence: ALL_SEQ[i],
				set_dev_mode: true,
				experiment_id: "active_blicket_comp_00x_dev"
			}
		});
	}

	routes["/test"] = wrap({
		component: TestComponent,
	});

	// TODO: implement different wrapper component for different platforms: reddit sample size, mturk and prolific
</script>

<Router {routes}/>

