// Use one instance of `send` and `receive` for all components so that transitions can apply across components
// Learned from: https://dev.to/buhrmi/svelte-component-transitions-5ie

// Import svelte transitions
import { quintOut } from 'svelte/easing';
import { crossfade } from 'svelte/transition';

// The following function is from: https://svelte.dev/tutorial/deferred-transitions
const [send, receive] = crossfade({
    duration: d => Math.sqrt(d * 500),

    fallback(node, params) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;

        return {
            duration: 600,
            easing: quintOut,
            css: t => `
                transform: ${transform} scale(${t});
                opacity: ${t}
            `
        };
    }
});

export {send, receive};