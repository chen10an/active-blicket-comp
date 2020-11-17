<script>
	import Router from 'svelte-spa-router';
	import {wrap} from 'svelte-spa-router/wrap'

	import ExperimentController from './routes/ExperimentController.svelte';
	import TestComponent from './components/Task.svelte';

	import { active_conj_seq, active_disj_seq } from './condition_configs/active';

	const routes = {
		"/condition0": wrap({
			component: ExperimentController,
			props: {
				component_sequence: active_conj_seq,
				set_dev_mode: false
			}
		}),
		"/condition1": wrap({
			component: ExperimentController,
			props: {
				component_sequence: active_disj_seq,
				set_dev_mode: false
			},
		}),
		"/dev": wrap({
			component: ExperimentController,
			props: {
				component_sequence: active_disj_seq,
				set_dev_mode: true
			}
		}),
		"/test": wrap({
			component: TestComponent,
			props: {
				instructions_seconds: 0,
				activation: (arg0, arg1, arg2) => arg2,
				replay_sequence: ["100", "100", "100", "010", "101", "101"]
			}
		})
	}

	// TODO: implement different wrapper component for different platforms: reddit sample size, mturk and prolific
</script>

<Router {routes}/>

