
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function fix_and_destroy_block(block, lookup) {
        block.f();
        destroy_block(block, lookup);
    }
    function fix_and_outro_and_destroy_block(block, lookup) {
        block.f();
        outro_and_destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function crossfade(_a) {
        var { fallback } = _a, defaults = __rest(_a, ["fallback"]);
        const to_receive = new Map();
        const to_send = new Map();
        function crossfade(from, node, params) {
            const { delay = 0, duration = d => Math.sqrt(d) * 30, easing = cubicOut } = assign(assign({}, defaults), params);
            const to = node.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            const dw = from.width / to.width;
            const dh = from.height / to.height;
            const d = Math.sqrt(dx * dx + dy * dy);
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            const opacity = +style.opacity;
            return {
                delay,
                duration: is_function(duration) ? duration(d) : duration,
                easing,
                css: (t, u) => `
				opacity: ${t * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u * dx}px,${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
			`
            };
        }
        function transition(items, counterparts, intro) {
            return (node, params) => {
                items.set(params.key, {
                    rect: node.getBoundingClientRect()
                });
                return () => {
                    if (counterparts.has(params.key)) {
                        const { rect } = counterparts.get(params.key);
                        counterparts.delete(params.key);
                        return crossfade(rect, node, params);
                    }
                    // if the node is disappearing altogether
                    // (i.e. wasn't claimed by the other list)
                    // then we need to supply an outro
                    items.delete(params.key);
                    return fallback && fallback(node, params, intro);
                };
            };
        }
        return [
            transition(to_send, to_receive, false),
            transition(to_receive, to_send, true)
        ];
    }

    function flip(node, animation, params) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const scaleX = animation.from.width / node.clientWidth;
        const scaleY = animation.from.height / node.clientHeight;
        const dx = (animation.from.left - animation.to.left) / scaleX;
        const dy = (animation.from.top - animation.to.top) / scaleY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
        };
    }

    /* src/TaskEnd.svelte generated by Svelte v3.29.0 */
    const file = "src/TaskEnd.svelte";

    function create_fragment(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = (/*num_combos*/ ctx[0] === 1 ? "attempt" : "attempts") + "";
    	let t3;
    	let t4;
    	let t5;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("Time's up! You have made a total of ");
    			t1 = text(/*num_combos*/ ctx[0]);
    			t2 = text(" unique ");
    			t3 = text(t3_value);
    			t4 = text(".");
    			t5 = space();
    			button = element("button");
    			button.textContent = "Click to continue";
    			add_location(p, file, 16, 4, 599);
    			add_location(button, file, 17, 4, 711);
    			attr_dev(div, "class", "col-container svelte-6msaz5");
    			add_location(div, file, 15, 0, 567);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(div, t5);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*cont*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*num_combos*/ 1) set_data_dev(t1, /*num_combos*/ ctx[0]);
    			if (dirty & /*num_combos*/ 1 && t3_value !== (t3_value = (/*num_combos*/ ctx[0] === 1 ? "attempt" : "attempts") + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TaskEnd", slots, []);
    	let { block_arr } = $$props; // array of block objects that were initialized for the current task
    	let { num_combos } = $$props; // number of unique block combinations (active or not) that the participant has tried
    	const dispatch = createEventDispatcher();

    	// Click handler
    	function cont() {
    		// Tell parent components to move on to the next task/quiz
    		dispatch("continue", { block_arr });
    	}

    	const writable_props = ["block_arr", "num_combos"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TaskEnd> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("block_arr" in $$props) $$invalidate(2, block_arr = $$props.block_arr);
    		if ("num_combos" in $$props) $$invalidate(0, num_combos = $$props.num_combos);
    	};

    	$$self.$capture_state = () => ({
    		block_arr,
    		num_combos,
    		createEventDispatcher,
    		dispatch,
    		cont
    	});

    	$$self.$inject_state = $$props => {
    		if ("block_arr" in $$props) $$invalidate(2, block_arr = $$props.block_arr);
    		if ("num_combos" in $$props) $$invalidate(0, num_combos = $$props.num_combos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [num_combos, cont, block_arr];
    }

    class TaskEnd extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { block_arr: 2, num_combos: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TaskEnd",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*block_arr*/ ctx[2] === undefined && !("block_arr" in props)) {
    			console.warn("<TaskEnd> was created without expected prop 'block_arr'");
    		}

    		if (/*num_combos*/ ctx[0] === undefined && !("num_combos" in props)) {
    			console.warn("<TaskEnd> was created without expected prop 'num_combos'");
    		}
    	}

    	get block_arr() {
    		throw new Error("<TaskEnd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block_arr(value) {
    		throw new Error("<TaskEnd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get num_combos() {
    		throw new Error("<TaskEnd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set num_combos(value) {
    		throw new Error("<TaskEnd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Task.svelte generated by Svelte v3.29.0 */

    const { Object: Object_1, console: console_1 } = globals;

    const file$1 = "src/Task.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	return child_ctx;
    }

    // (201:24) {#each blocks.filter(block => !block.state) as block (block.id)}
    function create_each_block_3(key_1, ctx) {
    	let div;
    	let b;
    	let t0_value = /*block*/ ctx[26].letter + "";
    	let t0;
    	let t1;
    	let div_intro;
    	let div_outro;
    	let rect;
    	let stop_animation = noop;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[15](/*block*/ ctx[26], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(b, "class", "svelte-kjme3n");
    			add_location(b, file$1, 204, 32, 9549);
    			attr_dev(div, "class", "block svelte-kjme3n");
    			set_style(div, "background-color", "var(--color" + /*block*/ ctx[26].color_num + ")");
    			set_style(div, "grid-area", /*block*/ ctx[26].letter);
    			toggle_class(div, "disabled", /*disable_all*/ ctx[5]);
    			add_location(div, file$1, 201, 28, 9181);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, b);
    			append_dev(b, t0);
    			append_dev(div, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*blocks*/ 4) && t0_value !== (t0_value = /*block*/ ctx[26].letter + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*blocks*/ 4) {
    				set_style(div, "background-color", "var(--color" + /*block*/ ctx[26].color_num + ")");
    			}

    			if (!current || dirty[0] & /*blocks*/ 4) {
    				set_style(div, "grid-area", /*block*/ ctx[26].letter);
    			}

    			if (dirty[0] & /*disable_all*/ 32) {
    				toggle_class(div, "disabled", /*disable_all*/ ctx[5]);
    			}
    		},
    		r: function measure() {
    			rect = div.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(div);
    			stop_animation();
    			add_transform(div, rect);
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(div, rect, flip, { duration: FLIP_DURATION_MS });
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, /*receive*/ ctx[9], { key: /*block*/ ctx[26].id });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, /*send*/ ctx[8], { key: /*block*/ ctx[26].id });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(201:24) {#each blocks.filter(block => !block.state) as block (block.id)}",
    		ctx
    	});

    	return block;
    }

    // (219:24) {#each blocks.filter(block => block.state) as block (block.id)}
    function create_each_block_2(key_1, ctx) {
    	let div;
    	let b;
    	let t0_value = /*block*/ ctx[26].letter + "";
    	let t0;
    	let t1;
    	let div_intro;
    	let div_outro;
    	let rect;
    	let stop_animation = noop;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[16](/*block*/ ctx[26], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(b, "class", "svelte-kjme3n");
    			add_location(b, file$1, 222, 32, 10750);
    			attr_dev(div, "class", "block svelte-kjme3n");
    			set_style(div, "background-color", "var(--color" + /*block*/ ctx[26].color_num + ")");
    			set_style(div, "grid-area", /*block*/ ctx[26].letter);
    			toggle_class(div, "disabled", /*disable_all*/ ctx[5]);
    			add_location(div, file$1, 219, 28, 10382);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, b);
    			append_dev(b, t0);
    			append_dev(div, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*blocks*/ 4) && t0_value !== (t0_value = /*block*/ ctx[26].letter + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*blocks*/ 4) {
    				set_style(div, "background-color", "var(--color" + /*block*/ ctx[26].color_num + ")");
    			}

    			if (!current || dirty[0] & /*blocks*/ 4) {
    				set_style(div, "grid-area", /*block*/ ctx[26].letter);
    			}

    			if (dirty[0] & /*disable_all*/ 32) {
    				toggle_class(div, "disabled", /*disable_all*/ ctx[5]);
    			}
    		},
    		r: function measure() {
    			rect = div.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(div);
    			stop_animation();
    			add_transform(div, rect);
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(div, rect, flip, { duration: FLIP_DURATION_MS });
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, /*receive*/ ctx[9], { key: /*block*/ ctx[26].id });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, /*send*/ ctx[8], { key: /*block*/ ctx[26].id });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(219:24) {#each blocks.filter(block => block.state) as block (block.id)}",
    		ctx
    	});

    	return block;
    }

    // (241:32) {#if block.state}
    function create_if_block(ctx) {
    	let div;
    	let b;
    	let t_value = /*block*/ ctx[26].letter + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			b = element("b");
    			t = text(t_value);
    			attr_dev(b, "class", "svelte-kjme3n");
    			add_location(b, file$1, 242, 40, 11891);
    			attr_dev(div, "class", "block mini disabled svelte-kjme3n");
    			set_style(div, "background-color", "var(--color" + /*block*/ ctx[26].color_num + ")");
    			set_style(div, "grid-area", /*block*/ ctx[26].letter);
    			add_location(div, file$1, 241, 36, 11733);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, b);
    			append_dev(b, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*unique_block_combos*/ 128 && t_value !== (t_value = /*block*/ ctx[26].letter + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*unique_block_combos*/ 128) {
    				set_style(div, "background-color", "var(--color" + /*block*/ ctx[26].color_num + ")");
    			}

    			if (dirty[0] & /*unique_block_combos*/ 128) {
    				set_style(div, "grid-area", /*block*/ ctx[26].letter);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(241:32) {#if block.state}",
    		ctx
    	});

    	return block;
    }

    // (240:28) {#each block_arr as block}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let if_block = /*block*/ ctx[26].state && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*block*/ ctx[26].state) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(240:28) {#each block_arr as block}",
    		ctx
    	});

    	return block;
    }

    // (237:20) {#each unique_block_combos as block_arr, i (unique_bit_combos[i])}
    function create_each_block(key_1, ctx) {
    	let div;
    	let t;
    	let div_intro;
    	let rect;
    	let stop_animation = noop;
    	let each_value_1 = /*block_arr*/ ctx[23];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "block-inner-grid mini svelte-kjme3n");
    			toggle_class(div, "active-detector", /*activation*/ ctx[1](.../*block_arr*/ ctx[23].map(func_2)));
    			add_location(div, file$1, 237, 24, 11366);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*unique_block_combos*/ 128) {
    				each_value_1 = /*block_arr*/ ctx[23];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty[0] & /*activation, unique_block_combos*/ 130) {
    				toggle_class(div, "active-detector", /*activation*/ ctx[1](.../*block_arr*/ ctx[23].map(func_2)));
    			}
    		},
    		r: function measure() {
    			rect = div.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(div);
    			stop_animation();
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(div, rect, flip, { duration: FLIP_DURATION_MS });
    		},
    		i: function intro(local) {
    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, /*receive*/ ctx[9], {
    						key: /*unique_bit_combos*/ ctx[6][/*i*/ ctx[25]]
    					});

    					div_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(237:20) {#each unique_block_combos as block_arr, i (unique_bit_combos[i])}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let body;
    	let div9;
    	let div7;
    	let h20;
    	let t0;
    	let t1;
    	let t2;
    	let div4;
    	let div1;
    	let div0;
    	let each_blocks_2 = [];
    	let each0_lookup = new Map();
    	let t3;
    	let div3;
    	let div2;
    	let each_blocks_1 = [];
    	let each1_lookup = new Map();
    	let t4;
    	let button0;
    	let t5;
    	let t6;
    	let h21;
    	let t8;
    	let div6;
    	let div5;
    	let each_blocks = [];
    	let each2_lookup = new Map();
    	let t9;
    	let button1;
    	let t11;
    	let div8;
    	let taskend;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_3 = /*blocks*/ ctx[2].filter(func);
    	validate_each_argument(each_value_3);
    	const get_key = ctx => /*block*/ ctx[26].id;
    	validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3(ctx, each_value_3, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_2[i] = create_each_block_3(key, child_ctx));
    	}

    	let each_value_2 = /*blocks*/ ctx[2].filter(func_1);
    	validate_each_argument(each_value_2);
    	const get_key_1 = ctx => /*block*/ ctx[26].id;
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key_1);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks_1[i] = create_each_block_2(key, child_ctx));
    	}

    	let each_value = /*unique_block_combos*/ ctx[7];
    	validate_each_argument(each_value);
    	const get_key_2 = ctx => /*unique_bit_combos*/ ctx[6][/*i*/ ctx[25]];
    	validate_each_keys(ctx, each_value, get_each_context, get_key_2);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key_2(child_ctx);
    		each2_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	taskend = new TaskEnd({
    			props: {
    				block_arr: /*blocks*/ ctx[2],
    				num_combos: /*unique_bit_combos*/ ctx[6].length
    			},
    			$$inline: true
    		});

    	taskend.$on("continue", /*continue_handler*/ ctx[17]);

    	const block = {
    		c: function create() {
    			body = element("body");
    			div9 = element("div");
    			div7 = element("div");
    			h20 = element("h2");
    			t0 = text("Remaining time: ");
    			t1 = text(/*time_limit_seconds*/ ctx[0]);
    			t2 = space();
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t4 = space();
    			button0 = element("button");
    			t5 = text("Test");
    			t6 = space();
    			h21 = element("h2");
    			h21.textContent = "Your unique attempts:";
    			t8 = space();
    			div6 = element("div");
    			div5 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			button1 = element("button");
    			button1.textContent = "dev: skip to the next part";
    			t11 = space();
    			div8 = element("div");
    			create_component(taskend.$$.fragment);
    			attr_dev(h20, "class", "svelte-kjme3n");
    			add_location(h20, file$1, 194, 12, 8771);
    			attr_dev(div0, "class", "block-inner-grid svelte-kjme3n");
    			add_location(div0, file$1, 198, 20, 8925);
    			attr_dev(div1, "class", "block-outer-flex svelte-kjme3n");
    			add_location(div1, file$1, 197, 16, 8874);
    			attr_dev(div2, "class", "block-inner-grid svelte-kjme3n");
    			add_location(div2, file$1, 216, 20, 10139);
    			attr_dev(div3, "class", "block-outer-flex svelte-kjme3n");
    			attr_dev(div3, "id", "detector");
    			toggle_class(div3, "active-detector", /*detector_is_active*/ ctx[4]);
    			add_location(div3, file$1, 215, 16, 10029);
    			attr_dev(div4, "class", "col-container svelte-kjme3n");
    			add_location(div4, file$1, 196, 12, 8830);
    			attr_dev(button0, "id", "test-button");
    			button0.disabled = /*disable_all*/ ctx[5];
    			attr_dev(button0, "class", "svelte-kjme3n");
    			add_location(button0, file$1, 230, 12, 10980);
    			attr_dev(h21, "class", "svelte-kjme3n");
    			add_location(h21, file$1, 233, 12, 11143);
    			attr_dev(div5, "id", "unique-combos");
    			attr_dev(div5, "class", "svelte-kjme3n");
    			add_location(div5, file$1, 235, 16, 11230);
    			attr_dev(div6, "class", "col-container svelte-kjme3n");
    			add_location(div6, file$1, 234, 12, 11186);
    			attr_dev(button1, "class", "svelte-kjme3n");
    			add_location(button1, file$1, 252, 13, 12201);
    			attr_dev(div7, "class", "row-container svelte-kjme3n");
    			toggle_class(div7, "hidden", /*time_up*/ ctx[3]);
    			add_location(div7, file$1, 193, 8, 8708);
    			attr_dev(div8, "class", "col-container svelte-kjme3n");
    			toggle_class(div8, "hidden", !/*time_up*/ ctx[3]);
    			add_location(div8, file$1, 257, 8, 12417);
    			attr_dev(div9, "class", "centering-container svelte-kjme3n");
    			add_location(div9, file$1, 192, 4, 8666);
    			attr_dev(body, "class", "svelte-kjme3n");
    			add_location(body, file$1, 191, 0, 8655);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div9);
    			append_dev(div9, div7);
    			append_dev(div7, h20);
    			append_dev(h20, t0);
    			append_dev(h20, t1);
    			append_dev(div7, t2);
    			append_dev(div7, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div0, null);
    			}

    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div2, null);
    			}

    			append_dev(div7, t4);
    			append_dev(div7, button0);
    			append_dev(button0, t5);
    			append_dev(div7, t6);
    			append_dev(div7, h21);
    			append_dev(div7, t8);
    			append_dev(div7, div6);
    			append_dev(div6, div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			append_dev(div7, t9);
    			append_dev(div7, button1);
    			append_dev(div9, t11);
    			append_dev(div9, div8);
    			mount_component(taskend, div8, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*test*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*skip*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*time_limit_seconds*/ 1) set_data_dev(t1, /*time_limit_seconds*/ ctx[0]);

    			if (dirty[0] & /*blocks, disable_all, click_block*/ 1060) {
    				const each_value_3 = /*blocks*/ ctx[2].filter(func);
    				validate_each_argument(each_value_3);
    				group_outros();
    				for (let i = 0; i < each_blocks_2.length; i += 1) each_blocks_2[i].r();
    				validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);
    				each_blocks_2 = update_keyed_each(each_blocks_2, dirty, get_key, 1, ctx, each_value_3, each0_lookup, div0, fix_and_outro_and_destroy_block, create_each_block_3, null, get_each_context_3);
    				for (let i = 0; i < each_blocks_2.length; i += 1) each_blocks_2[i].a();
    				check_outros();
    			}

    			if (dirty[0] & /*blocks, disable_all, click_block*/ 1060) {
    				const each_value_2 = /*blocks*/ ctx[2].filter(func_1);
    				validate_each_argument(each_value_2);
    				group_outros();
    				for (let i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].r();
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key_1);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key_1, 1, ctx, each_value_2, each1_lookup, div2, fix_and_outro_and_destroy_block, create_each_block_2, null, get_each_context_2);
    				for (let i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].a();
    				check_outros();
    			}

    			if (dirty[0] & /*detector_is_active*/ 16) {
    				toggle_class(div3, "active-detector", /*detector_is_active*/ ctx[4]);
    			}

    			if (!current || dirty[0] & /*disable_all*/ 32) {
    				prop_dev(button0, "disabled", /*disable_all*/ ctx[5]);
    			}

    			if (dirty[0] & /*activation, unique_block_combos, unique_bit_combos*/ 194) {
    				const each_value = /*unique_block_combos*/ ctx[7];
    				validate_each_argument(each_value);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context, get_key_2);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_2, 1, ctx, each_value, each2_lookup, div5, fix_and_destroy_block, create_each_block, null, get_each_context);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    			}

    			if (dirty[0] & /*time_up*/ 8) {
    				toggle_class(div7, "hidden", /*time_up*/ ctx[3]);
    			}

    			const taskend_changes = {};
    			if (dirty[0] & /*blocks*/ 4) taskend_changes.block_arr = /*blocks*/ ctx[2];
    			if (dirty[0] & /*unique_bit_combos*/ 64) taskend_changes.num_combos = /*unique_bit_combos*/ ctx[6].length;
    			taskend.$set(taskend_changes);

    			if (dirty[0] & /*time_up*/ 8) {
    				toggle_class(div8, "hidden", !/*time_up*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks_2[i]);
    			}

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(taskend.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				transition_out(each_blocks_2[i]);
    			}

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			transition_out(taskend.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].d();
    			}

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			destroy_component(taskend);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const ACTIVATION_TIMEOUT_MS = 750; // duration of the background's activation in milliseconds
    const COUNT_DOWN_INTERVAL_MS = 1000; // milliseconds passed to setInterval, used for counting down until the time limit
    const FLIP_DURATION_MS = 300; // duration of animation in milliseconds
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // letters used for labeling blocks
    const NUM_BLOCK_COLORS = 9; // number of distinct block colors in public/global.css
    const func = block => !block.state;
    const func_1 = block => block.state;
    const func_2 = block => block.state;

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Task", slots, []);
    	let { activation = (A, B) => A && B } = $$props; // default toy causal relationship
    	let { time_limit_seconds = 30 } = $$props; // default time limit of 30s
    	let { randomize_arg_order = true } = $$props;
    	let { noise = 0 } = $$props;

    	// The following function is from: https://svelte.dev/tutorial/deferred-transitions
    	const [send, receive] = crossfade({
    		duration: d => Math.sqrt(d * 500),
    		fallback(node, params) {
    			const style = getComputedStyle(node);
    			const transform = style.transform === "none" ? "" : style.transform;

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

    	// Check that the number of arguments to `activation` is supported by the available colors
    	if (activation.length > NUM_BLOCK_COLORS) {
    		throw "The causal function has too many arguments/blocks! We don't have enough distinct colors to represent each block.";
    	}

    	// Initialize variables
    	let num_blocks = activation.length; // number of blocks that are prospective causes

    	let available_ids = [...Array(num_blocks).keys()]; // available block ids in the range [0, num_blocks]
    	let available_colors = [...Array(NUM_BLOCK_COLORS).keys()]; // available block colors in the range [0, NUM_BLOCK_COLORS]
    	let blocks = []; // list of block objects, which are initialized below

    	for (let i = 0; i < num_blocks; i++) {
    		let id;

    		if (randomize_arg_order) {
    			// randomly assign ids without replacement
    			// this id corresponds to the argument position for `activation`
    			let id_dex = Math.floor(Math.random() * available_ids.length);

    			id = available_ids[id_dex];
    			available_ids = available_ids.filter(x => x !== id); // remove the selected id
    		} else {
    			// the arguments to `activation` are shown in their original order on the UI
    			id = i;
    		}

    		// randomly assign colors without replacement
    		let color_dex = Math.floor(Math.random() * available_colors.length);

    		let color_num = available_colors[color_dex];
    		available_colors = available_colors.filter(c => c !== color_num); // remove the selected color

    		blocks.push({
    			id, // random
    			color_num, // random
    			state: false, // starts as false
    			letter: ALPHABET.charAt(i), // determined by order of initialization
    			
    		});
    	}

    	// TODO: remove
    	console.log(blocks);

    	let count_down_interval = setInterval(count_down_seconds, COUNT_DOWN_INTERVAL_MS); // start the count down
    	let time_up = false; // whether the time limit has been reached
    	let detector_is_active = false; // state of the detector
    	let disable_all = false; // when true, participants cannot interact with buttons

    	// unique combinations of blocks that cause the activation; use arrays to maintain order
    	let unique_bit_combos = []; // list of bit strings

    	let unique_block_combos = []; // list of lists of block objects

    	// Click handler functions
    	function click_block(id) {
    		// When a block is clicked by the participant, reverse its state (true to false; false to true)
    		let current_block = blocks.find(block => block.id === id);

    		current_block.state = !current_block.state;
    		$$invalidate(2, blocks); // explicit assignment to trigger svelte's reactivity
    	} // REMOVED: maintain the original block order so that the participant won't think order matters for activation
    	// Move the ith block to the end of the array so that it will display as the last block in its container

    	// blocks = blocks.filter(block => block !== block_i);
    	// blocks = blocks.concat(block_i);
    	async function test() {
    		// Test whether the blocks in the detector (i.e. blocks with state=true) will cause an activation
    		// copy the array of block objects and sort by the randomly assigned id
    		let blocks_copy = [...blocks];

    		blocks_copy.sort((a, b) => a.id - b.id);

    		// the randomly assigned id then becomes the argument position in `activation`
    		let block_states = blocks_copy.map(block => block.state);

    		if (activation(...block_states)) {
    			// TODO: different color backgrounds should be different combos --> both are shown to the participant as past attempts
    			// don't change the color of the detector with probability noise
    			let rand = Math.random();

    			if (rand >= noise) {
    				// change the detector's background color and turn off button interactions
    				$$invalidate(4, detector_is_active = true);

    				$$invalidate(5, disable_all = true);

    				// wait before returning everything to their default state
    				await new Promise(r => setTimeout(r, ACTIVATION_TIMEOUT_MS));

    				// revert to the default detector background color and enable button interactions
    				$$invalidate(4, detector_is_active = false);

    				$$invalidate(5, disable_all = false);
    			}
    		}

    		// create the bit string representation of the current block states
    		let bit_combo = ""; // note that index i in this string corresponds to the block with id=i

    		for (let i = 0; i < block_states.length; i++) {
    			if (block_states[i]) {
    				bit_combo = bit_combo.concat("1");
    			} else {
    				bit_combo = bit_combo.concat("0");
    			}
    		}

    		// store all unique bit string representations
    		if (!unique_bit_combos.includes(bit_combo)) {
    			$$invalidate(6, unique_bit_combos = [bit_combo, ...unique_bit_combos]); // add to front

    			// copy and append the current block objects to `unique_block_combos`
    			// note that the copied blocks in `block_combo` are ordered by their id because blocks_copy was sorted by id
    			let block_combo = [];

    			for (let i = 0; i < blocks_copy.length; i++) {
    				let obj_copy = Object.assign({}, blocks_copy[i]);
    				block_combo.push(obj_copy);
    			}

    			$$invalidate(7, unique_block_combos = [block_combo, ...unique_block_combos]); // add to front
    		}

    		// return all block states back to false
    		for (let i = 0; i < blocks.length; i++) {
    			$$invalidate(2, blocks[i].state = false, blocks);
    		}
    	}

    	// TODO: remove for prod
    	function skip() {
    		clearInterval(count_down_interval);
    		$$invalidate(3, time_up = true);
    	}

    	// Count down timer
    	function count_down_seconds() {
    		// Count down in seconds until 0, at which time the task ends
    		if (time_limit_seconds == 0) {
    			// the time limit has been reached --> end the task (see the markup)
    			clearInterval(count_down_interval);

    			$$invalidate(3, time_up = true);
    		}

    		$$invalidate(0, time_limit_seconds = Math.max(time_limit_seconds - 1, 0));
    	}

    	const writable_props = ["activation", "time_limit_seconds", "randomize_arg_order", "noise"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Task> was created with unknown prop '${key}'`);
    	});

    	const click_handler = block => click_block(block.id);
    	const click_handler_1 = block => click_block(block.id);

    	function continue_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("activation" in $$props) $$invalidate(1, activation = $$props.activation);
    		if ("time_limit_seconds" in $$props) $$invalidate(0, time_limit_seconds = $$props.time_limit_seconds);
    		if ("randomize_arg_order" in $$props) $$invalidate(13, randomize_arg_order = $$props.randomize_arg_order);
    		if ("noise" in $$props) $$invalidate(14, noise = $$props.noise);
    	};

    	$$self.$capture_state = () => ({
    		activation,
    		time_limit_seconds,
    		randomize_arg_order,
    		noise,
    		quintOut,
    		crossfade,
    		flip,
    		send,
    		receive,
    		TaskEnd,
    		ACTIVATION_TIMEOUT_MS,
    		COUNT_DOWN_INTERVAL_MS,
    		FLIP_DURATION_MS,
    		ALPHABET,
    		NUM_BLOCK_COLORS,
    		num_blocks,
    		available_ids,
    		available_colors,
    		blocks,
    		count_down_interval,
    		time_up,
    		detector_is_active,
    		disable_all,
    		unique_bit_combos,
    		unique_block_combos,
    		click_block,
    		test,
    		skip,
    		count_down_seconds
    	});

    	$$self.$inject_state = $$props => {
    		if ("activation" in $$props) $$invalidate(1, activation = $$props.activation);
    		if ("time_limit_seconds" in $$props) $$invalidate(0, time_limit_seconds = $$props.time_limit_seconds);
    		if ("randomize_arg_order" in $$props) $$invalidate(13, randomize_arg_order = $$props.randomize_arg_order);
    		if ("noise" in $$props) $$invalidate(14, noise = $$props.noise);
    		if ("num_blocks" in $$props) num_blocks = $$props.num_blocks;
    		if ("available_ids" in $$props) available_ids = $$props.available_ids;
    		if ("available_colors" in $$props) available_colors = $$props.available_colors;
    		if ("blocks" in $$props) $$invalidate(2, blocks = $$props.blocks);
    		if ("count_down_interval" in $$props) count_down_interval = $$props.count_down_interval;
    		if ("time_up" in $$props) $$invalidate(3, time_up = $$props.time_up);
    		if ("detector_is_active" in $$props) $$invalidate(4, detector_is_active = $$props.detector_is_active);
    		if ("disable_all" in $$props) $$invalidate(5, disable_all = $$props.disable_all);
    		if ("unique_bit_combos" in $$props) $$invalidate(6, unique_bit_combos = $$props.unique_bit_combos);
    		if ("unique_block_combos" in $$props) $$invalidate(7, unique_block_combos = $$props.unique_block_combos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		time_limit_seconds,
    		activation,
    		blocks,
    		time_up,
    		detector_is_active,
    		disable_all,
    		unique_bit_combos,
    		unique_block_combos,
    		send,
    		receive,
    		click_block,
    		test,
    		skip,
    		randomize_arg_order,
    		noise,
    		click_handler,
    		click_handler_1,
    		continue_handler
    	];
    }

    class Task extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{
    				activation: 1,
    				time_limit_seconds: 0,
    				randomize_arg_order: 13,
    				noise: 14
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Task",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get activation() {
    		throw new Error("<Task>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activation(value) {
    		throw new Error("<Task>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get time_limit_seconds() {
    		throw new Error("<Task>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time_limit_seconds(value) {
    		throw new Error("<Task>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get randomize_arg_order() {
    		throw new Error("<Task>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set randomize_arg_order(value) {
    		throw new Error("<Task>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noise() {
    		throw new Error("<Task>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noise(value) {
    		throw new Error("<Task>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Quiz.svelte generated by Svelte v3.29.0 */

    const { Object: Object_1$1, console: console_1$1 } = globals;
    const file$2 = "src/Quiz.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[10] = list;
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (57:12) {#if block.state}
    function create_if_block$1(ctx) {
    	let div;
    	let b;
    	let t0_value = /*block*/ ctx[15].letter + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = space();
    			add_location(b, file$2, 58, 20, 2012);
    			attr_dev(div, "class", "block mini disabled svelte-1rx2kat");
    			set_style(div, "background-color", "var(--color" + /*block*/ ctx[15].color_num + ")");
    			set_style(div, "grid-area", /*block*/ ctx[15].letter);
    			add_location(div, file$2, 57, 16, 1874);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, b);
    			append_dev(b, t0);
    			append_dev(div, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(57:12) {#if block.state}",
    		ctx
    	});

    	return block;
    }

    // (56:8) {#each arr as block}
    function create_each_block_2$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*block*/ ctx[15].state && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*block*/ ctx[15].state) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(56:8) {#each arr as block}",
    		ctx
    	});

    	return block;
    }

    // (65:4) {#each ANSWER_OPTIONS as option}
    function create_each_block_1$1(ctx) {
    	let label;
    	let input;
    	let input_value_value;
    	let t0;
    	let t1_value = /*option*/ ctx[12] + "";
    	let t1;
    	let mounted;
    	let dispose;
    	/*$$binding_groups*/ ctx[7][0][/*i*/ ctx[11]] = [];

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[6].call(input, /*i*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			attr_dev(input, "type", "radio");
    			input.__value = input_value_value = /*option*/ ctx[12];
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[7][0][/*i*/ ctx[11]].push(input);
    			add_location(input, file$2, 66, 12, 2168);
    			add_location(label, file$2, 65, 8, 2148);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = input.__value === /*answer_option_groups*/ ctx[0][/*i*/ ctx[11]];
    			append_dev(label, t0);
    			append_dev(label, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", input_change_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*answer_option_groups*/ 1) {
    				input.checked = input.__value === /*answer_option_groups*/ ctx[0][/*i*/ ctx[11]];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			/*$$binding_groups*/ ctx[7][0][/*i*/ ctx[11]].splice(/*$$binding_groups*/ ctx[7][0][/*i*/ ctx[11]].indexOf(input), 1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(65:4) {#each ANSWER_OPTIONS as option}",
    		ctx
    	});

    	return block;
    }

    // (54:0) {#each quiz_block_combos as arr, i}
    function create_each_block$1(ctx) {
    	let div;
    	let t;
    	let each1_anchor;
    	let each_value_2 = /*arr*/ ctx[9];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*ANSWER_OPTIONS*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each1_anchor = empty();
    			attr_dev(div, "class", "block-inner-grid mini svelte-1rx2kat");
    			add_location(div, file$2, 54, 4, 1763);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div, null);
    			}

    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*quiz_block_combos*/ 4) {
    				each_value_2 = /*arr*/ ctx[9];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*ANSWER_OPTIONS, answer_option_groups*/ 3) {
    				each_value_1 = /*ANSWER_OPTIONS*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each1_anchor.parentNode, each1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(54:0) {#each quiz_block_combos as arr, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let body;
    	let t0;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value = /*quiz_block_combos*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			body = element("body");
    			t0 = text("Will the following detectors activate given the blocks that are placed on them?\n\n");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			button = element("button");
    			button.textContent = "Click to submit your answers and continue";
    			add_location(button, file$2, 71, 0, 2286);
    			add_location(body, file$2, 50, 0, 1635);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(body, null);
    			}

    			append_dev(body, t1);
    			append_dev(body, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*cont*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*ANSWER_OPTIONS, answer_option_groups, quiz_block_combos*/ 7) {
    				each_value = /*quiz_block_combos*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(body, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Quiz", slots, []);
    	let { block_arr } = $$props; // array of block objects
    	let { quiz_bit_combos = ["101", "100"] } = $$props;

    	// sort by id
    	block_arr.sort((a, b) => a.id - b.id);

    	// Constants
    	const ANSWER_OPTIONS = ["Yes", "No"];

    	let answer_option_groups = [];

    	for (let i = 0; i < quiz_bit_combos.length; i++) {
    		answer_option_groups.push(0);
    	}

    	// Derive block combinations from quiz_bit_combos
    	let quiz_block_combos = []; // array of arrays of block objects

    	for (let i = 0; i < quiz_bit_combos.length; i++) {
    		let bit_combo = quiz_bit_combos[i];
    		let block_combo = [];

    		for (let j = 0; j < bit_combo.length; j++) {
    			let block_obj_copy = Object.assign({}, block_arr[j]);

    			if (bit_combo[j] === "1") {
    				block_obj_copy.state = true;
    			} else {
    				block_obj_copy.state = false;
    			}

    			block_combo.push(block_obj_copy);
    		}

    		quiz_block_combos.push(block_combo);
    	}

    	console.log(block_arr);
    	const dispatch = createEventDispatcher();

    	// Click handler
    	function cont() {
    		// Tell parent components to move on to the next task/quiz
    		dispatch("continue", { block_arr });
    	}

    	const writable_props = ["block_arr", "quiz_bit_combos"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Quiz> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input_change_handler(i) {
    		answer_option_groups[i] = this.__value;
    		$$invalidate(0, answer_option_groups);
    	}

    	$$self.$$set = $$props => {
    		if ("block_arr" in $$props) $$invalidate(4, block_arr = $$props.block_arr);
    		if ("quiz_bit_combos" in $$props) $$invalidate(5, quiz_bit_combos = $$props.quiz_bit_combos);
    	};

    	$$self.$capture_state = () => ({
    		block_arr,
    		quiz_bit_combos,
    		ANSWER_OPTIONS,
    		answer_option_groups,
    		quiz_block_combos,
    		createEventDispatcher,
    		dispatch,
    		cont
    	});

    	$$self.$inject_state = $$props => {
    		if ("block_arr" in $$props) $$invalidate(4, block_arr = $$props.block_arr);
    		if ("quiz_bit_combos" in $$props) $$invalidate(5, quiz_bit_combos = $$props.quiz_bit_combos);
    		if ("answer_option_groups" in $$props) $$invalidate(0, answer_option_groups = $$props.answer_option_groups);
    		if ("quiz_block_combos" in $$props) $$invalidate(2, quiz_block_combos = $$props.quiz_block_combos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*answer_option_groups*/ 1) {
    			 {
    				console.log(answer_option_groups);
    			}
    		}
    	};

    	return [
    		answer_option_groups,
    		ANSWER_OPTIONS,
    		quiz_block_combos,
    		cont,
    		block_arr,
    		quiz_bit_combos,
    		input_change_handler,
    		$$binding_groups
    	];
    }

    class Quiz extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { block_arr: 4, quiz_bit_combos: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Quiz",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*block_arr*/ ctx[4] === undefined && !("block_arr" in props)) {
    			console_1$1.warn("<Quiz> was created without expected prop 'block_arr'");
    		}
    	}

    	get block_arr() {
    		throw new Error("<Quiz>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block_arr(value) {
    		throw new Error("<Quiz>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get quiz_bit_combos() {
    		throw new Error("<Quiz>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set quiz_bit_combos(value) {
    		throw new Error("<Quiz>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TaskVid.svelte generated by Svelte v3.29.0 */

    const file$3 = "src/TaskVid.svelte";

    function create_fragment$3(ctx) {
    	let body;

    	const block = {
    		c: function create() {
    			body = element("body");
    			add_location(body, file$3, 6, 0, 119);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TaskVid", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TaskVid> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class TaskVid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TaskVid",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.0 */

    const { Object: Object_1$2 } = globals;

    // (45:1) {:else}
    function create_else_block(ctx) {
    	let taskvid;
    	let current;
    	taskvid = new TaskVid({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(taskvid.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(taskvid, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(taskvid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(taskvid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(taskvid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(45:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (43:97) 
    function create_if_block_1(ctx) {
    	let quiz;
    	let current;
    	const quiz_spread_levels = [{ block_arr: /*quiz_block_arr*/ ctx[0] }, /*current_task_quiz*/ ctx[1]];
    	let quiz_props = {};

    	for (let i = 0; i < quiz_spread_levels.length; i += 1) {
    		quiz_props = assign(quiz_props, quiz_spread_levels[i]);
    	}

    	quiz = new Quiz({ props: quiz_props, $$inline: true });
    	quiz.$on("continue", /*handleContinue*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(quiz.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(quiz, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const quiz_changes = (dirty & /*quiz_block_arr, current_task_quiz*/ 3)
    			? get_spread_update(quiz_spread_levels, [
    					dirty & /*quiz_block_arr*/ 1 && { block_arr: /*quiz_block_arr*/ ctx[0] },
    					dirty & /*current_task_quiz*/ 2 && get_spread_object(/*current_task_quiz*/ ctx[1])
    				])
    			: {};

    			quiz.$set(quiz_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(quiz.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(quiz.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(quiz, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(43:97) ",
    		ctx
    	});

    	return block;
    }

    // (41:1) {#if JSON.stringify(Object.keys(current_task_quiz)) == JSON.stringify(["activation", "time_limit_seconds", "randomize_arg_order", "noise"])}
    function create_if_block$2(ctx) {
    	let task;
    	let current;
    	const task_spread_levels = [/*current_task_quiz*/ ctx[1]];
    	let task_props = {};

    	for (let i = 0; i < task_spread_levels.length; i += 1) {
    		task_props = assign(task_props, task_spread_levels[i]);
    	}

    	task = new Task({ props: task_props, $$inline: true });
    	task.$on("continue", /*handleContinue*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(task.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(task, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const task_changes = (dirty & /*current_task_quiz*/ 2)
    			? get_spread_update(task_spread_levels, [get_spread_object(/*current_task_quiz*/ ctx[1])])
    			: {};

    			task.$set(task_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(task.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(task.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(task, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(41:1) {#if JSON.stringify(Object.keys(current_task_quiz)) == JSON.stringify([\\\"activation\\\", \\\"time_limit_seconds\\\", \\\"randomize_arg_order\\\", \\\"noise\\\"])}",
    		ctx
    	});

    	return block;
    }

    // (39:0) {#key current_task_quiz}
    function create_key_block(ctx) {
    	let show_if;
    	let show_if_1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*current_task_quiz*/ 2) show_if = !!(JSON.stringify(Object.keys(/*current_task_quiz*/ ctx[1])) == JSON.stringify(["activation", "time_limit_seconds", "randomize_arg_order", "noise"]));
    		if (show_if) return 0;
    		if (dirty & /*current_task_quiz*/ 2) show_if_1 = !!(JSON.stringify(Object.keys(/*current_task_quiz*/ ctx[1])) == JSON.stringify(["quiz_bit_combos"]));
    		if (show_if_1) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx, -1);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(39:0) {#key current_task_quiz}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let previous_key = /*current_task_quiz*/ ctx[1];
    	let key_block_anchor;
    	let current;
    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*current_task_quiz*/ 2 && safe_not_equal(previous_key, previous_key = /*current_task_quiz*/ ctx[1])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let quiz_block_arr;

    	// TODO: use a store to keep track of the current blocks
    	let task_quiz_sequence = {
    		// "Video_0": {},
    		// "Task_dev": {activation: (arg0, arg1, arg2) => arg0 && arg2, time_limit_seconds: 60, randomize_arg_order: false},  // conjunctive
    		"Task_0": {
    			activation: (arg0, arg1, arg2) => arg0 && arg2,
    			time_limit_seconds: 60,
    			randomize_arg_order: true,
    			noise: 0
    		}, // conjunctive
    		"Quiz_0": { quiz_bit_combos: ["101", "100", "111"] },
    		"Task_1": {
    			activation: (arg0, arg1, arg2) => arg0,
    			time_limit_seconds: 60,
    			randomize_arg_order: true,
    			noise: 0
    		}, // deterministic disjunctive
    		"Task_1_noisy": {
    			activation: (arg0, arg1, arg2) => arg0,
    			time_limit_seconds: 60,
    			randomize_arg_order: true,
    			noise: 0.5
    		}, // noisy disjunctive
    		// showing that we can get complex:
    		"Task_2": {
    			activation: (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) => arg0,
    			time_limit_seconds: 60,
    			randomize_arg_order: true,
    			noise: 0
    		}
    	};

    	let task_quiz_keys = Object.keys(task_quiz_sequence);
    	let task_quiz_dex = 0;

    	function handleContinue(event) {
    		// update `block_arr` from the task that just finished
    		$$invalidate(0, quiz_block_arr = event.detail.block_arr);

    		// increment task_quiz_dex to select the next task or quiz
    		if (task_quiz_dex >= task_quiz_keys.length - 1) {
    			// end of the entire experiment
    			return;
    		}

    		$$invalidate(3, task_quiz_dex += 1);
    	}

    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Task,
    		Quiz,
    		TaskVid,
    		quiz_block_arr,
    		task_quiz_sequence,
    		task_quiz_keys,
    		task_quiz_dex,
    		handleContinue,
    		current_task_quiz
    	});

    	$$self.$inject_state = $$props => {
    		if ("quiz_block_arr" in $$props) $$invalidate(0, quiz_block_arr = $$props.quiz_block_arr);
    		if ("task_quiz_sequence" in $$props) $$invalidate(4, task_quiz_sequence = $$props.task_quiz_sequence);
    		if ("task_quiz_keys" in $$props) $$invalidate(5, task_quiz_keys = $$props.task_quiz_keys);
    		if ("task_quiz_dex" in $$props) $$invalidate(3, task_quiz_dex = $$props.task_quiz_dex);
    		if ("current_task_quiz" in $$props) $$invalidate(1, current_task_quiz = $$props.current_task_quiz);
    	};

    	let current_task_quiz;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*task_quiz_dex*/ 8) {
    			 $$invalidate(1, current_task_quiz = task_quiz_sequence[task_quiz_keys[task_quiz_dex]]);
    		}
    	};

    	return [quiz_block_arr, current_task_quiz, handleContinue];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
