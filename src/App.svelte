<script>
	import Router from 'svelte-spa-router';
	import Conjunctive from './routes/Conjunctive.svelte';
	import Disjunctive from './routes/Disjunctive.svelte';

	import WinnieThePooh from './components/WinnieThePooh.svelte'  // TODO: remove
	import Quiz from './components/Quiz.svelte'  // TODO: remove

	const routes = {
		"/condition0": Conjunctive,
		"/condition2": Disjunctive,
		"/testing": WinnieThePooh  // TODO: remove
	}

	// TODO: implement noisy conditions
	// TODO: footer of the intro page: <div>Icons made by <a href="https://www.flaticon.com/authors/pause08" title="Pause08">Pause08</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
	// TODO: terminate the experiment on page reload: destroy the app component

	// TODO: maybe stop store values from bleeding between routes: try destroying the app component when switching routes, https://github.com/ItalyPaleAle/svelte-spa-router/issues/14,
	// reload when the route path value changes (https://stackoverflow.com/questions/56891190/how-to-trigger-force-update-a-svelte-component 2nd answer)
	
	// TODO: remove the body tag from all components because the app is rendered to the body!

	// TODO: implement dev mode variable in stores
	// TODO: implement different wrapper component for different platforms: reddit sample size, mturk and prolific
</script>

<Router {routes}/>

