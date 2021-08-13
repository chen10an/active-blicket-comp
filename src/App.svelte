<script>
    import Router from 'svelte-spa-router';
	  import {wrap} from 'svelte-spa-router/wrap';

	  import ExperimentController from './routes/ExperimentController.svelte';
	  import TestComponent from './components/pages/IntroInstructions.svelte';
    import IntroInstructions from './components/pages/IntroInstructions.svelte';
	  import { bonus_currency_str, dev_mode } from './modules/experiment_stores.js';

	  import { row0_seq,
           row1_seq,
           row2_seq,
           row3_seq,
           row4_seq,
           row5_seq
           } from './condition_configs/all_conditions.js';


	  // configure the experiment conditions and bonuses
	  const ALL_SEQ = [row0_seq,
                     row1_seq,
                     row2_seq,
                     row3_seq,
                     row4_seq,
                     row5_seq
    ]
	  const ALL_SEQ_NAMES = ["row0_seq",
                           "row1_seq",
                           "row2_seq",
                           "row3_seq",
                           "row4_seq",
                           "row5_seq",
    ];
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
				        bonus_val_per_q: 0,  // value for questions that can be scored automatically; there are only manual scoring questions in this experiment
				        set_dev_mode: false
			      }
		    });

		    routes[`/dev/conditions/${i}`] = wrap({
			      component: ExperimentController,
			      props: {
				        component_sequence: ALL_SEQ[i],
				        experiment_id: "active_blicket_comp_20x-dev",
				        condition_name: ALL_SEQ_NAMES[i],
				        bonus_val_per_q: 0,
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

    routes["/demo"] = wrap({
		    component: IntroInstructions,
        props: {
            ordered_fform_keys: ["disj", "conj", "conj3", "noisy_disj", "noisy_conj", "noisy_conj3"]
			  }
	  });

	  // TODO: implement different wrapper component for different platforms: reddit sample size, mturk and prolific
</script>

<Router {routes}/>

