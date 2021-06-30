<script>
	export let component_sequence;
	export let experiment_id;
	export let condition_name;
	export let bonus_val_per_q;

	export let set_dev_mode = false;

	import IntroInstructions from '../components/pages/IntroInstructions.svelte';
	import Task from '../components/pages/Task.svelte';
	import Quiz from '../components/pages/Quiz.svelte';
	import End from '../components/pages/End.svelte';
	import Loading from '../components/conditional_pages/Loading.svelte';
	import PIS from '../components/pages/PIS.svelte';
	import DontRepeat from '../components/conditional_pages/DontRepeat.svelte';

	import {
		task_data_dict,
		quiz_data_dict,
		block_dict,
		current_score,
		max_score,
		bonus_val,
		dev_mode,
		feedback,
		honeypot_responses,
		intro_incorrect_clicks,
		reset_experiment_stores,
		current_total_bonus
	} from '../modules/experiment_stores.js';
	import { ChunksIncremental } from '../modules/ChunksIncremental.js';

	import { onDestroy } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { location, querystring } from 'svelte-spa-router';

	dev_mode.set(set_dev_mode);
	bonus_val.set(bonus_val_per_q);

	// get the route (which contains the experiment condition) and the workerId
	// note that this code only supports a query string with the regex pattern specified in query_re
	let route = $location;
	let query_re = /sessionId\=(.*)/
	let query_match = query_re.exec($querystring);
	let session_id = query_match[1];

	let wait_for_chunks_interval = null;
	let waited_for_chunks_ms = 0;
	let remaining_chunks = null;
	let WAIT_FOR_CHUNKS_LIMIT_MS = 3000;
	let WAIT_FOR_CHUNKS_INTERVAL_MS = 100;

	function wait_for_chunks() {
		// check when we have waited for chunks beyond the time limit
		if (waited_for_chunks_ms > WAIT_FOR_CHUNKS_LIMIT_MS) {
			clearInterval(wait_for_chunks_interval);
			
			// force end with error
			current_component = End;
			current_props = {chunk_error: `After waiting for ${WAIT_FOR_CHUNKS_LIMIT_MS}ms, the remaining ${remaining_chunks} chunks could not be sent.`};
		}

		waited_for_chunks_ms += WAIT_FOR_CHUNKS_INTERVAL_MS;
	}

	// create one instance of ChunksIncremental for the entire experiment
	let wso = new ChunksIncremental(
		"wss://somata.inf.ed.ac.uk/chunks/ws",
		// Callbacks like this could be empty, i.e., "() => {}",
		// but are useful for making sure data are transmitted.
		(chunksLeft,errStatus,m) => {
			remaining_chunks = chunksLeft;
			if (m.status === "ERROR") {
				if (wait_for_chunks_interval !== null) {  // override any waiting
					clearInterval(wait_for_chunks_interval);
				}

				current_component = End;
				current_props = {chunk_error: `message: ${JSON.stringify(m)}<br>chunks left: ${chunksLeft}<br>ws error: ${errStatus}`};
			} else if (chunksLeft !== 0 && wait_for_chunks_interval === null) {
				// there are chunks left and we have not started waiting
				wait_for_chunks_interval = setInterval(wait_for_chunks, WAIT_FOR_CHUNKS_INTERVAL_MS);
				// show loading page
				current_component = Loading;
				current_props = {};
			} else if (chunksLeft === 0) {  // all chunks have been sent
				if (wait_for_chunks_interval !== null) {  // override any waiting
					clearInterval(wait_for_chunks_interval);
				}
				// continue with showing the component that is supposed to come next
				current_component = str_to_component[next_key.split("_")[0]];
				current_props = next_props;
				scrollY = 0; // make sure to start each component at the top of the window

				// reset waiting
				wait_for_chunks_interval = null;
				waited_for_chunks_ms = 0;
			}
		},
		(e) => {}
		// **remove this error handling for now to allow for unstable internet between messages**
		// (but note that the message callback does have its own error handling)
		// TODO: instead of removing, consider counting errors before sending participant to the error page

		// 	if (wait_for_chunks_interval !== null) {  // override any waiting
		// 		clearInterval(wait_for_chunks_interval);
		// 	}

		// 	current_component = End;
		// 	current_props = {chunk_error: JSON.stringify(e)};
		// }
	);

	onDestroy(() => {
		// reset store values and close the websocket whenever an instance of this component gets destroyed
		reset_experiment_stores();
		wso.wso.onclose = function () {console.log("wso closing for good")}; // disable the recursive (see ChunksIncremental.js) onclose handler first
    	wso.wso.close();
	});
	
	// experiment progress bar
	const progress = tweened(0, {duration: 500, easing: cubicOut});
	let progress_inc = 1/(Object.keys(component_sequence).length - 1);  // how much to increment the progress bar for each component

	// update the max possible quiz score based on the props to the Quiz component
	let max_quiz_score = 0;
	for (const key in component_sequence) {
		if (key.split("_")[0] == "Quiz") {
			max_quiz_score += component_sequence[key].correct_blicket_ratings.length;
		}
	}
	max_score.set(max_quiz_score);

	// convert from the string of a component name to the component itself
	let str_to_component = {
		"Task": Task,
		"Quiz": Quiz,
		"IntroInstructions": IntroInstructions,
		"End": End,
		"PIS": PIS
	}

	let scrollY = 0;

	let task_quiz_keys = Object.keys(component_sequence);
	let task_quiz_dex = 0;
	let next_key = task_quiz_keys[task_quiz_dex];
	let current_component = str_to_component[next_key.split("_")[0]];
	let next_props = component_sequence[next_key];
	let current_props = next_props;
	let is_trouble = false;
	let passed_intro = false;

	if (!$dev_mode) {
		// use local storage to prevent repeated visits to the experiment website
		if (localStorage.getItem("visited")) {  // true and not null
			current_component = DontRepeat;
			current_props = {};
		} else {
			localStorage.setItem("visited", true);
		}
	}

	function handleContinue(event) {
		if (event.detail && event.detail.trouble) {  // force the end of the experiment
			// change key and props but not the component itself (so that the svelte:component is not rerendered yet)
			next_key = "End";
			is_trouble = true;
			next_props = {is_trouble: is_trouble};
		} else {
			// increment task_quiz_dex to select the next task or quiz
			task_quiz_dex += 1;
			// incremement the progress bar
			progress.update(x => x + progress_inc);
			
			// change key and props but not the component itself (so that the svelte:component is not rerendered yet)
			next_key = task_quiz_keys[task_quiz_dex];
			next_props = component_sequence[next_key];
		}

		if (!$dev_mode) {  // send data only in prod
			if (next_key.split("_")[0] === "End") {
				// send data in prod at the end of the experiment
				let message = {
					experimentId: experiment_id,
					sessionId: session_id,
					timestamp: Date.now(),
					route: route,
					condition_name: condition_name,
					passed_intro: passed_intro,
					seq_key: next_key,
					is_trouble: is_trouble,
					honeypot_responses: $honeypot_responses,
					intro_incorrect_clicks: $intro_incorrect_clicks,
					task_data: $task_data_dict,
					quiz_data: $quiz_data_dict,
					score: $current_score,
					max_score: $max_score,
					bonus_per_q: $bonus_val,
					total_bonus: $current_total_bonus,
					blocks: $block_dict,
					feedback: $feedback
				};
				wso.sendChunk(message);
				return;  // let message callback handle rendering the next component
			} else if (task_quiz_dex >= 1) {
				let prev_dex = task_quiz_dex - 1;
				let prev_key = task_quiz_keys[prev_dex];

				if (prev_key.split("_")[0] === "IntroInstructions") {
					passed_intro = true;
					// send some data after the participant passes the intro, i.e. after they have committed to starting the experiment
					// if this session_id doesn't have a matching chunk at the end of the experiment,
					// we'll know that this person quit mid-way through even though they were interested enough to
					// pass the checks on the intro page
					wso.sendChunk({
						experimentId: experiment_id,
						sessionId: session_id,
						timestamp: Date.now(),
						route: route,
						condition_name: condition_name,
						passed_intro: passed_intro,
						seq_key: prev_key
					});
					return;  // let message callback handle rendering the next component
				}
			}
		}

		// update the component itself (so that the svelte:component is rerendered)
		current_component = str_to_component[next_key.split("_")[0]];
		current_props = next_props;
		scrollY = 0; // make sure to start each component at the top of the window
	}
</script>

<svelte:window bind:scrollY={scrollY}/>
<!-- Dynamically show different components to the participant -->
<svelte:component this={current_component} {...current_props} on:continue={handleContinue}/>

<!-- <div class="bottom">
	   <progress value={$progress}></progress>
	   <span class="score"><span style="font-size: 0.8rem;">Running Score: </span><b>{$current_score}/{$max_score}</b></span>
     </div>
-->

<style>
	.bottom {
		position: fixed;
		bottom: 0;
		width: 100%;
		z-index: 20;

		display: flex;
		justify-content: space-between;
		pointer-events: none;
	}

	progress {
		flex-grow: 1;
		align-self: flex-end;
	}

	.score {
		margin: 0 0.5rem;
		padding: 0.5rem;
		text-align: center;

		background-color: rgb(255, 255, 255, 0.7);
		border-radius: var(--container-border-radius);
        box-shadow: var(--container-box-shadow);
	}
</style>
