<script>
	import Router from 'svelte-spa-router';
	import Conjunctive from './routes/Conjunctive.svelte';
	import Disjunctive from './routes/Disjunctive.svelte';

	const routes = {
		"/condition0": Conjunctive,
		"/condition2": Disjunctive
	}

	// TODO: implement noisy conditions
	// TODO: <div>Icons made by <a href="https://www.flaticon.com/authors/pause08" title="Pause08">Pause08</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
	// TODO: terminate the experiment on page reload
	// TODO: maybe stop store values from bleeding between routes
</script>

<Router {routes}/>

