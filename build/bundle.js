
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
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
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
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

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    // This file contains variables that need to be consistent between all variables within a single experiment

    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";  // letters used for labeling blocks
    const NUM_BLOCK_COLORS = 9; // number of distinct block colors in public/global.css

    // Write-able array of blocks used in the experiment's Task
    const task_blocks = writable([
        {id: 2, state: false, color_num: 1, letter: "A"},
        {id: 0, state: false, color_num: 5, letter: "B"},
        {id: 1, state: false, color_num: 7, letter: "C"}
    ]);  // use a default value for development and testing purposes
    // TODO: maybe generalize task_blocks to a dict after seeing how the demo task will work

    // Read-only array of objects surface feature properties (letter and color)
    const features = readable(null, function start(set) {
        // Initialize blocks for the experiment
        let available_colors = [...Array(NUM_BLOCK_COLORS).keys()];  // available block colors in the range [0, NUM_BLOCK_COLORS]
        let arr = [];  // array of feature objects, which are initialized below
        for (let i=0; i < NUM_BLOCK_COLORS; i++) {
            // randomly assign colors without replacement
            let color_dex = Math.floor(Math.random() * available_colors.length);
            let color_num = available_colors[color_dex];
            available_colors = available_colors.filter(c => c !== color_num);  // remove the selected color

            arr.push({
                color_num: color_num,  // random
                letter: ALPHABET.charAt(i)  // determined by order of initialization
            });
        }

        set(arr);  // set the blocks_features_arr store

    	return function stop() {};
    });

    // Writeable dictionary/object of experiment data
    const data_dict = writable({}, function start() {return stop()});
    // TODO: store experiment data here and send to server using stop()
    // TODO: combo list
    // TODO: quiz answers, distinguish between train vs test

    // TODO: time between combos

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
    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
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

    // Use one instance of `send` and `receive` for all components so that transitions can apply across components

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

    /* src/BlockGrid.svelte generated by Svelte v3.29.0 */
    const file = "src/BlockGrid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (34:4) {#each grid_blocks.filter(block_filter_func) as block (block.id)}
    function create_each_block(key_1, ctx) {
    	let div;
    	let b;
    	let t0_value = /*block*/ ctx[9].letter + "";
    	let t0;
    	let t1;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[7](/*block*/ ctx[9], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = space();
    			add_location(b, file, 38, 12, 1930);
    			attr_dev(div, "class", "block svelte-18r30jo");
    			set_style(div, "background-color", "var(--color" + /*block*/ ctx[9].color_num + ")");
    			set_style(div, "grid-area", /*block*/ ctx[9].letter);
    			toggle_class(div, "mini", /*is_mini*/ ctx[0]);
    			toggle_class(div, "disabled", /*is_disabled*/ ctx[1]);
    			add_location(div, file, 34, 8, 1583);
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
    			if ((!current || dirty & /*grid_blocks, block_filter_func*/ 20) && t0_value !== (t0_value = /*block*/ ctx[9].letter + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*grid_blocks, block_filter_func*/ 20) {
    				set_style(div, "background-color", "var(--color" + /*block*/ ctx[9].color_num + ")");
    			}

    			if (!current || dirty & /*grid_blocks, block_filter_func*/ 20) {
    				set_style(div, "grid-area", /*block*/ ctx[9].letter);
    			}

    			if (dirty & /*is_mini*/ 1) {
    				toggle_class(div, "mini", /*is_mini*/ ctx[0]);
    			}

    			if (dirty & /*is_disabled*/ 2) {
    				toggle_class(div, "disabled", /*is_disabled*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);

    				if (!div_intro) div_intro = create_in_transition(div, receive, {
    					key: /*key_prefix*/ ctx[3].concat(String(/*block*/ ctx[9].id))
    				});

    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();

    			div_outro = create_out_transition(div, send, {
    				key: /*key_prefix*/ ctx[3].concat(String(/*block*/ ctx[9].id))
    			});

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
    		id: create_each_block.name,
    		type: "each",
    		source: "(34:4) {#each grid_blocks.filter(block_filter_func) as block (block.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*grid_blocks*/ ctx[4].filter(/*block_filter_func*/ ctx[2]);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*block*/ ctx[9].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "block-grid svelte-18r30jo");
    			toggle_class(div, "mini", /*is_mini*/ ctx[0]);
    			add_location(div, file, 32, 0, 1457);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*grid_blocks, block_filter_func, key_prefix, String, is_mini, is_disabled, click_block*/ 63) {
    				const each_value = /*grid_blocks*/ ctx[4].filter(/*block_filter_func*/ ctx[2]);
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, null, get_each_context);
    				check_outros();
    			}

    			if (dirty & /*is_mini*/ 1) {
    				toggle_class(div, "mini", /*is_mini*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
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
    	let $task_blocks;
    	validate_store(task_blocks, "task_blocks");
    	component_subscribe($$self, task_blocks, $$value => $$invalidate(8, $task_blocks = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BlockGrid", slots, []);
    	let { is_mini } = $$props; // boolean, whether to show a mini, non-interactive grid
    	let { is_disabled } = $$props; // boolean, whether to disable clicking on the blocks
    	let { block_filter_func } = $$props; // lambda function that determines which blocks to show on the grid, e.g. block => !block.state
    	let { copied_blocks_arr = null } = $$props; // array of copied block objects to use inplace of the shared `task_blocks` from `experiment_stores.js`
    	let { key_prefix = "" } = $$props; // send/receive transitions will apply between blocks with the same key_prefix and id

    	// Initialize variables
    	let grid_blocks; // blocks to display on the grid

    	// Click handler
    	function click_block(id) {
    		// When a block is clicked by the participant, reverse its state (true to false; false to true)
    		let current_block = grid_blocks.find(block => block.id === id);

    		current_block.state = !current_block.state;
    		task_blocks.set(grid_blocks); // explicit assignment to trigger svelte's reactivity
    	}

    	const writable_props = [
    		"is_mini",
    		"is_disabled",
    		"block_filter_func",
    		"copied_blocks_arr",
    		"key_prefix"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BlockGrid> was created with unknown prop '${key}'`);
    	});

    	const click_handler = block => click_block(block.id);

    	$$self.$$set = $$props => {
    		if ("is_mini" in $$props) $$invalidate(0, is_mini = $$props.is_mini);
    		if ("is_disabled" in $$props) $$invalidate(1, is_disabled = $$props.is_disabled);
    		if ("block_filter_func" in $$props) $$invalidate(2, block_filter_func = $$props.block_filter_func);
    		if ("copied_blocks_arr" in $$props) $$invalidate(6, copied_blocks_arr = $$props.copied_blocks_arr);
    		if ("key_prefix" in $$props) $$invalidate(3, key_prefix = $$props.key_prefix);
    	};

    	$$self.$capture_state = () => ({
    		is_mini,
    		is_disabled,
    		block_filter_func,
    		copied_blocks_arr,
    		key_prefix,
    		task_blocks,
    		send,
    		receive,
    		grid_blocks,
    		click_block,
    		$task_blocks
    	});

    	$$self.$inject_state = $$props => {
    		if ("is_mini" in $$props) $$invalidate(0, is_mini = $$props.is_mini);
    		if ("is_disabled" in $$props) $$invalidate(1, is_disabled = $$props.is_disabled);
    		if ("block_filter_func" in $$props) $$invalidate(2, block_filter_func = $$props.block_filter_func);
    		if ("copied_blocks_arr" in $$props) $$invalidate(6, copied_blocks_arr = $$props.copied_blocks_arr);
    		if ("key_prefix" in $$props) $$invalidate(3, key_prefix = $$props.key_prefix);
    		if ("grid_blocks" in $$props) $$invalidate(4, grid_blocks = $$props.grid_blocks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*copied_blocks_arr, $task_blocks*/ 320) {
    			 {
    				if (copied_blocks_arr) {
    					// if not null
    					$$invalidate(4, grid_blocks = copied_blocks_arr);
    				} else {
    					$$invalidate(4, grid_blocks = $task_blocks); // cross-component (using $) reference to the blocks in `experiment_stores.js`
    				}
    			}
    		}
    	};

    	return [
    		is_mini,
    		is_disabled,
    		block_filter_func,
    		key_prefix,
    		grid_blocks,
    		click_block,
    		copied_blocks_arr,
    		click_handler
    	];
    }

    class BlockGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			is_mini: 0,
    			is_disabled: 1,
    			block_filter_func: 2,
    			copied_blocks_arr: 6,
    			key_prefix: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BlockGrid",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*is_mini*/ ctx[0] === undefined && !("is_mini" in props)) {
    			console.warn("<BlockGrid> was created without expected prop 'is_mini'");
    		}

    		if (/*is_disabled*/ ctx[1] === undefined && !("is_disabled" in props)) {
    			console.warn("<BlockGrid> was created without expected prop 'is_disabled'");
    		}

    		if (/*block_filter_func*/ ctx[2] === undefined && !("block_filter_func" in props)) {
    			console.warn("<BlockGrid> was created without expected prop 'block_filter_func'");
    		}
    	}

    	get is_mini() {
    		throw new Error("<BlockGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_mini(value) {
    		throw new Error("<BlockGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_disabled() {
    		throw new Error("<BlockGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_disabled(value) {
    		throw new Error("<BlockGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get block_filter_func() {
    		throw new Error("<BlockGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block_filter_func(value) {
    		throw new Error("<BlockGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get copied_blocks_arr() {
    		throw new Error("<BlockGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set copied_blocks_arr(value) {
    		throw new Error("<BlockGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key_prefix() {
    		throw new Error("<BlockGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key_prefix(value) {
    		throw new Error("<BlockGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TaskEnd.svelte generated by Svelte v3.29.0 */

    const file$1 = "src/TaskEnd.svelte";

    function create_fragment$1(ctx) {
    	let body;
    	let div1;
    	let div0;
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = (/*num_combos*/ ctx[0] === 1 ? "attempt" : "attempts") + "";
    	let t3;
    	let t4;
    	let t5;
    	let button;
    	let body_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			body = element("body");
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text("Time's up! You have made a total of ");
    			t1 = text(/*num_combos*/ ctx[0]);
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = text(".");
    			t5 = space();
    			button = element("button");
    			button.textContent = "Click to continue";
    			add_location(p, file$1, 19, 12, 623);
    			add_location(button, file$1, 20, 12, 736);
    			attr_dev(div0, "class", "col-container svelte-1w8jhy2");
    			add_location(div0, file$1, 18, 8, 583);
    			attr_dev(div1, "class", "centering-container");
    			add_location(div1, file$1, 17, 4, 541);
    			add_location(body, file$1, 16, 0, 494);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(div0, t5);
    			append_dev(div0, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*cont*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*num_combos*/ 1) set_data_dev(t1, /*num_combos*/ ctx[0]);
    			if ((!current || dirty & /*num_combos*/ 1) && t3_value !== (t3_value = (/*num_combos*/ ctx[0] === 1 ? "attempt" : "attempts") + "")) set_data_dev(t3, t3_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!body_transition) body_transition = create_bidirectional_transition(body, fade, { duration: 300 }, true);
    				body_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!body_transition) body_transition = create_bidirectional_transition(body, fade, { duration: 300 }, false);
    			body_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			if (detaching && body_transition) body_transition.end();
    			mounted = false;
    			dispose();
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TaskEnd", slots, []);
    	let { num_combos } = $$props; // number of unique block combinations (active or not) that the participant has tried
    	const dispatch = createEventDispatcher();

    	// Click handler
    	function cont() {
    		// Tell parent components to move on to the next task/quiz
    		dispatch("continue");
    	}

    	const writable_props = ["num_combos"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TaskEnd> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("num_combos" in $$props) $$invalidate(0, num_combos = $$props.num_combos);
    	};

    	$$self.$capture_state = () => ({
    		num_combos,
    		fade,
    		createEventDispatcher,
    		dispatch,
    		cont
    	});

    	$$self.$inject_state = $$props => {
    		if ("num_combos" in $$props) $$invalidate(0, num_combos = $$props.num_combos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [num_combos, cont];
    }

    class TaskEnd extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { num_combos: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TaskEnd",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*num_combos*/ ctx[0] === undefined && !("num_combos" in props)) {
    			console.warn("<TaskEnd> was created without expected prop 'num_combos'");
    		}
    	}

    	get num_combos() {
    		throw new Error("<TaskEnd>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set num_combos(value) {
    		throw new Error("<TaskEnd>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
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

    /* src/Task.svelte generated by Svelte v3.29.0 */

    const { Object: Object_1 } = globals;
    const file$2 = "src/Task.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (189:0) {:else}
    function create_else_block(ctx) {
    	let taskend;
    	let current;

    	taskend = new TaskEnd({
    			props: {
    				num_combos: /*all_bit_combos*/ ctx[5].length
    			},
    			$$inline: true
    		});

    	taskend.$on("continue", /*continue_handler*/ ctx[10]);

    	const block = {
    		c: function create() {
    			create_component(taskend.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(taskend, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const taskend_changes = {};
    			if (dirty & /*all_bit_combos*/ 32) taskend_changes.num_combos = /*all_bit_combos*/ ctx[5].length;
    			taskend.$set(taskend_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(taskend.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(taskend.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(taskend, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(189:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (143:0) {#if !time_up}
    function create_if_block(ctx) {
    	let body;
    	let div6;
    	let div5;
    	let h20;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div2;
    	let div0;
    	let blockgrid0;
    	let t4;
    	let div1;
    	let blockgrid1;
    	let t5;
    	let button0;
    	let t6;
    	let t7;
    	let h21;
    	let t9;
    	let div4;
    	let div3;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t10;
    	let button1;
    	let body_intro;
    	let body_outro;
    	let current;
    	let mounted;
    	let dispose;

    	blockgrid0 = new BlockGrid({
    			props: {
    				is_mini: false,
    				is_disabled: /*disable_all*/ ctx[4],
    				block_filter_func: func,
    				key_prefix: "interactive"
    			},
    			$$inline: true
    		});

    	blockgrid1 = new BlockGrid({
    			props: {
    				is_mini: false,
    				is_disabled: /*disable_all*/ ctx[4],
    				block_filter_func: func_1,
    				key_prefix: "interactive"
    			},
    			$$inline: true
    		});

    	let each_value = /*all_block_combos*/ ctx[6];
    	validate_each_argument(each_value);
    	const get_key = ctx => String(/*all_block_combos*/ ctx[6].length - /*i*/ ctx[19]).concat("combo");
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			body = element("body");
    			div6 = element("div");
    			div5 = element("div");
    			h20 = element("h2");
    			t0 = text("Remaining time: ");
    			t1 = text(/*time_limit_seconds*/ ctx[0]);
    			t2 = text("s");
    			t3 = space();
    			div2 = element("div");
    			div0 = element("div");
    			create_component(blockgrid0.$$.fragment);
    			t4 = space();
    			div1 = element("div");
    			create_component(blockgrid1.$$.fragment);
    			t5 = space();
    			button0 = element("button");
    			t6 = text("Test");
    			t7 = space();
    			h21 = element("h2");
    			h21.textContent = "Your past attempts:";
    			t9 = space();
    			div4 = element("div");
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			button1 = element("button");
    			button1.textContent = "dev: skip to the next part";
    			add_location(h20, file$2, 146, 16, 6890);
    			attr_dev(div0, "class", "block-outer-flex svelte-1lrax0q");
    			add_location(div0, file$2, 149, 20, 7002);
    			attr_dev(div1, "class", "block-outer-flex svelte-1lrax0q");
    			toggle_class(div1, "active-detector", /*detector_is_active*/ ctx[3]);
    			add_location(div1, file$2, 159, 20, 7678);
    			attr_dev(div2, "class", "row-container svelte-1lrax0q");
    			add_location(div2, file$2, 148, 16, 6954);
    			attr_dev(button0, "id", "test-button");
    			button0.disabled = /*disable_all*/ ctx[4];
    			add_location(button0, file$2, 166, 16, 8124);
    			add_location(h21, file$2, 169, 16, 8295);
    			attr_dev(div3, "id", "all-combos");
    			attr_dev(div3, "class", "svelte-1lrax0q");
    			add_location(div3, file$2, 171, 20, 8388);
    			attr_dev(div4, "class", "row-container svelte-1lrax0q");
    			add_location(div4, file$2, 170, 16, 8340);
    			add_location(button1, file$2, 184, 16, 9406);
    			attr_dev(div5, "class", "col-container svelte-1lrax0q");
    			add_location(div5, file$2, 145, 12, 6846);
    			attr_dev(div6, "class", "centering-container");
    			add_location(div6, file$2, 144, 8, 6800);
    			add_location(body, file$2, 143, 4, 6690);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div6);
    			append_dev(div6, div5);
    			append_dev(div5, h20);
    			append_dev(h20, t0);
    			append_dev(h20, t1);
    			append_dev(h20, t2);
    			append_dev(div5, t3);
    			append_dev(div5, div2);
    			append_dev(div2, div0);
    			mount_component(blockgrid0, div0, null);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			mount_component(blockgrid1, div1, null);
    			append_dev(div5, t5);
    			append_dev(div5, button0);
    			append_dev(button0, t6);
    			append_dev(div5, t7);
    			append_dev(div5, h21);
    			append_dev(div5, t9);
    			append_dev(div5, div4);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append_dev(div5, t10);
    			append_dev(div5, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*test*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*skip*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (!current || dirty & /*time_limit_seconds*/ 1) set_data_dev(t1, /*time_limit_seconds*/ ctx[0]);
    			const blockgrid0_changes = {};
    			if (dirty & /*disable_all*/ 16) blockgrid0_changes.is_disabled = /*disable_all*/ ctx[4];
    			blockgrid0.$set(blockgrid0_changes);
    			const blockgrid1_changes = {};
    			if (dirty & /*disable_all*/ 16) blockgrid1_changes.is_disabled = /*disable_all*/ ctx[4];
    			blockgrid1.$set(blockgrid1_changes);

    			if (dirty & /*detector_is_active*/ 8) {
    				toggle_class(div1, "active-detector", /*detector_is_active*/ ctx[3]);
    			}

    			if (!current || dirty & /*disable_all*/ 16) {
    				prop_dev(button0, "disabled", /*disable_all*/ ctx[4]);
    			}

    			if (dirty & /*activation, all_block_combos*/ 66) {
    				const each_value = /*all_block_combos*/ ctx[6];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div3, fix_and_outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(blockgrid0.$$.fragment, local);
    			transition_in(blockgrid1.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (body_outro) body_outro.end(1);
    				if (!body_intro) body_intro = create_in_transition(body, fade, { duration: FLIP_DURATION_MS, delay: 700 });
    				body_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(blockgrid0.$$.fragment, local);
    			transition_out(blockgrid1.$$.fragment, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (body_intro) body_intro.invalidate();
    			body_outro = create_out_transition(body, fade, { duration: FLIP_DURATION_MS });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			destroy_component(blockgrid0);
    			destroy_component(blockgrid1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && body_outro) body_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(143:0) {#if !time_up}",
    		ctx
    	});

    	return block;
    }

    // (174:24) {#each all_block_combos as block_arr, i (String(all_block_combos.length - i).concat("combo"))}
    function create_each_block$1(key_1, ctx) {
    	let div;
    	let blockgrid;
    	let t;
    	let div_intro;
    	let rect;
    	let stop_animation = noop;
    	let current;

    	blockgrid = new BlockGrid({
    			props: {
    				is_mini: true,
    				is_disabled: true,
    				block_filter_func: func_2,
    				copied_blocks_arr: /*block_arr*/ ctx[17],
    				key_prefix: "prev_combos"
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			create_component(blockgrid.$$.fragment);
    			t = space();
    			set_style(div, "margin-right", "0.5rem");
    			set_style(div, "border-radius", "var(--container-border-radius)");
    			attr_dev(div, "class", "svelte-1lrax0q");
    			toggle_class(div, "active-detector", /*activation*/ ctx[1](.../*block_arr*/ ctx[17].map(func_3)));
    			add_location(div, file$2, 174, 28, 8702);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(blockgrid, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const blockgrid_changes = {};
    			if (dirty & /*all_block_combos*/ 64) blockgrid_changes.copied_blocks_arr = /*block_arr*/ ctx[17];
    			blockgrid.$set(blockgrid_changes);

    			if (dirty & /*activation, all_block_combos*/ 66) {
    				toggle_class(div, "active-detector", /*activation*/ ctx[1](.../*block_arr*/ ctx[17].map(func_3)));
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
    			if (current) return;
    			transition_in(blockgrid.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, receive, {
    						key: String(/*all_block_combos*/ ctx[6].length - /*i*/ ctx[19]).concat("combo")
    					});

    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(blockgrid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(blockgrid);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(174:24) {#each all_block_combos as block_arr, i (String(all_block_combos.length - i).concat(\\\"combo\\\"))}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*time_up*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const ACTIVATION_TIMEOUT_MS = 750; // duration of the background's activation in milliseconds
    const COUNT_DOWN_INTERVAL_MS = 1000; // milliseconds passed to setInterval, used for counting down until the time limit
    const FLIP_DURATION_MS = 300; // duration of animation in milliseconds
    const func = block => !block.state;
    const func_1 = block => block.state;
    const func_2 = block => block.state;
    const func_3 = block => block.state;

    function instance$2($$self, $$props, $$invalidate) {
    	let $features;
    	let $task_blocks;
    	validate_store(features, "features");
    	component_subscribe($$self, features, $$value => $$invalidate(12, $features = $$value));
    	validate_store(task_blocks, "task_blocks");
    	component_subscribe($$self, task_blocks, $$value => $$invalidate(13, $task_blocks = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Task", slots, []);
    	let { activation } = $$props; // lambda function that represents the causal relationship
    	let { time_limit_seconds } = $$props; // time limit in seconds
    	let { noise = 0 } = $$props; // [0, 1) float that represents the probability of the blicket detector **not** lighting up when activation=true

    	// Check that the number of arguments to `activation` is supported by the available colors
    	if (activation.length > Math.floor($features.length / 2)) {
    		throw "The task causal function has too many arguments/blocks! We don't have enough distinct colors.";
    	}

    	// Initialize variables
    	let blocks = [];

    	// initialize an array of block objects
    	let available_ids = [...Array(activation.length).keys()]; // available block ids in the range [0, activation.length]

    	for (let i = 0; i < activation.length; i++) {
    		// randomly assign ids without replacement
    		// this id corresponds to the argument position for the `activation` function
    		let id_dex = Math.floor(Math.random() * available_ids.length);

    		let id = available_ids[id_dex];
    		available_ids = available_ids.filter(x => x !== id); // remove the selected id

    		blocks.push({
    			id, // random
    			state: false, // init to false
    			// get surface features from `experiment_store.js`
    			color_num: $features[i].color_num,
    			letter: $features[i].letter
    		});
    	}

    	task_blocks.set(blocks);
    	let count_down_interval = setInterval(count_down_seconds, COUNT_DOWN_INTERVAL_MS); // start the count down
    	let time_up = false; // whether the time limit has been reached
    	let detector_is_active = false; // state of the detector
    	let disable_all = false; // when true, participants cannot interact with buttons

    	// all block combinations that the participant has tried; use arrays to maintain order
    	let all_bit_combos = []; // list of bit strings

    	let all_block_combos = []; // list of lists of block objects

    	// Click handler functions
    	async function test() {
    		// Test whether the blocks in the detector (i.e. blocks with state=true) will cause an activation
    		// copy the array of block objects and sort by the randomly assigned id
    		let blocks_copy = [...$task_blocks];

    		blocks_copy.sort((a, b) => a.id - b.id);

    		// the randomly assigned id then becomes the argument position in `activation`
    		let block_states = blocks_copy.map(block => block.state);

    		if (activation(...block_states)) {
    			// TODO: different color backgrounds should be different combos --> both are shown to the participant as past attempts
    			// don't change the color of the detector with probability noise
    			let rand = Math.random();

    			if (rand >= noise) {
    				// change the detector's background color and turn off button interactions
    				$$invalidate(3, detector_is_active = true);

    				$$invalidate(4, disable_all = true);

    				// wait before returning everything to their default state
    				await new Promise(r => setTimeout(r, ACTIVATION_TIMEOUT_MS));

    				// revert to the default detector background color and enable button interactions
    				$$invalidate(3, detector_is_active = false);

    				$$invalidate(4, disable_all = false);
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

    		// store all bit string representations
    		$$invalidate(5, all_bit_combos = [bit_combo, ...all_bit_combos]); // add to front

    		// copy and append the current block objects to `all_block_combos`
    		// note that the copied blocks in `block_combo` are ordered by their id because blocks_copy was sorted by id
    		let block_combo = [];

    		for (let i = 0; i < blocks_copy.length; i++) {
    			let obj_copy = Object.assign({}, blocks_copy[i]);
    			block_combo.push(obj_copy);
    		}

    		$$invalidate(6, all_block_combos = [block_combo, ...all_block_combos]); // add to front

    		// return all block states back to false
    		for (let i = 0; i < $task_blocks.length; i++) {
    			set_store_value(task_blocks, $task_blocks[i].state = false, $task_blocks);
    		}
    	}

    	// TODO: remove for prod
    	function skip() {
    		clearInterval(count_down_interval);
    		$$invalidate(2, time_up = true);
    	}

    	// Count down timer
    	function count_down_seconds() {
    		// Count down in seconds until 0, at which time the task ends
    		if (time_limit_seconds == 0) {
    			// the time limit has been reached --> end the task (see the markup)
    			clearInterval(count_down_interval);

    			$$invalidate(2, time_up = true);
    		}

    		$$invalidate(0, time_limit_seconds = Math.max(time_limit_seconds - 1, 0));
    	}

    	const writable_props = ["activation", "time_limit_seconds", "noise"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Task> was created with unknown prop '${key}'`);
    	});

    	function continue_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("activation" in $$props) $$invalidate(1, activation = $$props.activation);
    		if ("time_limit_seconds" in $$props) $$invalidate(0, time_limit_seconds = $$props.time_limit_seconds);
    		if ("noise" in $$props) $$invalidate(9, noise = $$props.noise);
    	};

    	$$self.$capture_state = () => ({
    		activation,
    		time_limit_seconds,
    		noise,
    		BlockGrid,
    		TaskEnd,
    		features,
    		task_blocks,
    		flip,
    		receive,
    		fade,
    		ACTIVATION_TIMEOUT_MS,
    		COUNT_DOWN_INTERVAL_MS,
    		FLIP_DURATION_MS,
    		blocks,
    		available_ids,
    		count_down_interval,
    		time_up,
    		detector_is_active,
    		disable_all,
    		all_bit_combos,
    		all_block_combos,
    		test,
    		skip,
    		count_down_seconds,
    		$features,
    		$task_blocks
    	});

    	$$self.$inject_state = $$props => {
    		if ("activation" in $$props) $$invalidate(1, activation = $$props.activation);
    		if ("time_limit_seconds" in $$props) $$invalidate(0, time_limit_seconds = $$props.time_limit_seconds);
    		if ("noise" in $$props) $$invalidate(9, noise = $$props.noise);
    		if ("blocks" in $$props) blocks = $$props.blocks;
    		if ("available_ids" in $$props) available_ids = $$props.available_ids;
    		if ("count_down_interval" in $$props) count_down_interval = $$props.count_down_interval;
    		if ("time_up" in $$props) $$invalidate(2, time_up = $$props.time_up);
    		if ("detector_is_active" in $$props) $$invalidate(3, detector_is_active = $$props.detector_is_active);
    		if ("disable_all" in $$props) $$invalidate(4, disable_all = $$props.disable_all);
    		if ("all_bit_combos" in $$props) $$invalidate(5, all_bit_combos = $$props.all_bit_combos);
    		if ("all_block_combos" in $$props) $$invalidate(6, all_block_combos = $$props.all_block_combos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		time_limit_seconds,
    		activation,
    		time_up,
    		detector_is_active,
    		disable_all,
    		all_bit_combos,
    		all_block_combos,
    		test,
    		skip,
    		noise,
    		continue_handler
    	];
    }

    class Task extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			activation: 1,
    			time_limit_seconds: 0,
    			noise: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Task",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*activation*/ ctx[1] === undefined && !("activation" in props)) {
    			console.warn("<Task> was created without expected prop 'activation'");
    		}

    		if (/*time_limit_seconds*/ ctx[0] === undefined && !("time_limit_seconds" in props)) {
    			console.warn("<Task> was created without expected prop 'time_limit_seconds'");
    		}
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

    	get noise() {
    		throw new Error("<Task>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noise(value) {
    		throw new Error("<Task>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Quiz.svelte generated by Svelte v3.29.0 */

    const { Object: Object_1$1 } = globals;
    const file$3 = "src/Quiz.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[23] = list;
    	child_ctx[24] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	child_ctx[29] = list;
    	child_ctx[24] = i;
    	return child_ctx;
    }

    // (130:20) {#each ACTIVATION_ANSWER_OPTIONS as option}
    function create_each_block_3(ctx) {
    	let label;
    	let input;
    	let input_value_value;
    	let input_disabled_value;
    	let t0;
    	let t1_value = /*option*/ ctx[25] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;
    	/*$$binding_groups*/ ctx[17][0][/*i*/ ctx[24]] = [];

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[16].call(input, /*i*/ ctx[24]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "radio");
    			input.__value = input_value_value = /*option*/ ctx[25] == "Yes" ? true : false;
    			input.value = input.__value;
    			input.disabled = input_disabled_value = !/*hide_correct_answers*/ ctx[1];
    			/*$$binding_groups*/ ctx[17][0][/*i*/ ctx[24]].push(input);
    			add_location(input, file$3, 131, 28, 5175);
    			add_location(label, file$3, 130, 24, 5139);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = input.__value === /*$data_dict*/ ctx[5][/*quiz_id*/ ctx[0]].activation_answer_groups[/*i*/ ctx[24]];
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", input_change_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*hide_correct_answers*/ 2 && input_disabled_value !== (input_disabled_value = !/*hide_correct_answers*/ ctx[1])) {
    				prop_dev(input, "disabled", input_disabled_value);
    			}

    			if (dirty[0] & /*$data_dict, quiz_id, BLICKET_ANSWER_OPTIONS*/ 161) {
    				input.checked = input.__value === /*$data_dict*/ ctx[5][/*quiz_id*/ ctx[0]].activation_answer_groups[/*i*/ ctx[24]];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			/*$$binding_groups*/ ctx[17][0][/*i*/ ctx[24]].splice(/*$$binding_groups*/ ctx[17][0][/*i*/ ctx[24]].indexOf(input), 1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(130:20) {#each ACTIVATION_ANSWER_OPTIONS as option}",
    		ctx
    	});

    	return block;
    }

    // (142:24) {:else}
    function create_else_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = " ✘";
    			attr_dev(span, "id", "cross");
    			attr_dev(span, "class", "svelte-1hcx2hx");
    			add_location(span, file$3, 142, 28, 5909);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(142:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (140:24) {#if $data_dict[quiz_id].activation_answer_groups[i] === correct_activation_answers[i]}
    function create_if_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = " ✔";
    			attr_dev(span, "id", "checkmark");
    			attr_dev(span, "class", "svelte-1hcx2hx");
    			add_location(span, file$3, 140, 28, 5807);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(140:24) {#if $data_dict[quiz_id].activation_answer_groups[i] === correct_activation_answers[i]}",
    		ctx
    	});

    	return block;
    }

    // (127:12) {#each quiz_block_combos as arr, i}
    function create_each_block_2(ctx) {
    	let blockgrid;
    	let t0;
    	let div1;
    	let t1;
    	let div0;
    	let current;

    	blockgrid = new BlockGrid({
    			props: {
    				is_mini: true,
    				is_disabled: true,
    				block_filter_func: func$1,
    				copied_blocks_arr: /*arr*/ ctx[28],
    				key_prefix: "quiz"
    			},
    			$$inline: true
    		});

    	let each_value_3 = /*ACTIVATION_ANSWER_OPTIONS*/ ctx[6];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*$data_dict*/ ctx[5][/*quiz_id*/ ctx[0]].activation_answer_groups[/*i*/ ctx[24]] === /*correct_activation_answers*/ ctx[9][/*i*/ ctx[24]]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			create_component(blockgrid.$$.fragment);
    			t0 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div0 = element("div");
    			if_block.c();
    			attr_dev(div0, "class", "svelte-1hcx2hx");
    			toggle_class(div0, "hide", /*hide_correct_answers*/ ctx[1]);
    			add_location(div0, file$3, 138, 20, 5625);
    			attr_dev(div1, "class", "answer-options svelte-1hcx2hx");
    			add_location(div1, file$3, 128, 16, 5022);
    		},
    		m: function mount(target, anchor) {
    			mount_component(blockgrid, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			if_block.m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*ACTIVATION_ANSWER_OPTIONS, hide_correct_answers, $data_dict, quiz_id*/ 99) {
    				each_value_3 = /*ACTIVATION_ANSWER_OPTIONS*/ ctx[6];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if (dirty[0] & /*hide_correct_answers*/ 2) {
    				toggle_class(div0, "hide", /*hide_correct_answers*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(blockgrid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(blockgrid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(blockgrid, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(127:12) {#each quiz_block_combos as arr, i}",
    		ctx
    	});

    	return block;
    }

    // (156:24) {#each BLICKET_ANSWER_OPTIONS as option}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[25].text + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*option*/ ctx[25].id;
    			option.value = option.__value;
    			add_location(option, file$3, 156, 28, 6639);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(156:24) {#each BLICKET_ANSWER_OPTIONS as option}",
    		ctx
    	});

    	return block;
    }

    // (150:12) {#each $task_blocks as block, i}
    function create_each_block$2(ctx) {
    	let div0;
    	let b;
    	let t0_value = /*block*/ ctx[22].letter + "";
    	let t0;
    	let t1;
    	let div1;
    	let select;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*BLICKET_ANSWER_OPTIONS*/ ctx[7];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	function select_change_handler() {
    		/*select_change_handler*/ ctx[18].call(select, /*i*/ ctx[24]);
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(b, file$3, 151, 20, 6369);
    			attr_dev(div0, "class", "block svelte-1hcx2hx");
    			set_style(div0, "background-color", "var(--color" + /*block*/ ctx[22].color_num + ")");
    			add_location(div0, file$3, 150, 16, 6273);
    			if (/*$data_dict*/ ctx[5][/*quiz_id*/ ctx[0]].blicket_answer_groups[/*i*/ ctx[24]] === void 0) add_render_callback(select_change_handler);
    			add_location(select, file$3, 154, 20, 6479);
    			attr_dev(div1, "class", "answer-options svelte-1hcx2hx");
    			add_location(div1, file$3, 153, 16, 6430);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, b);
    			append_dev(b, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*$data_dict*/ ctx[5][/*quiz_id*/ ctx[0]].blicket_answer_groups[/*i*/ ctx[24]]);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", select_change_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*$task_blocks*/ 16 && t0_value !== (t0_value = /*block*/ ctx[22].letter + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*$task_blocks*/ 16) {
    				set_style(div0, "background-color", "var(--color" + /*block*/ ctx[22].color_num + ")");
    			}

    			if (dirty[0] & /*BLICKET_ANSWER_OPTIONS*/ 128) {
    				each_value_1 = /*BLICKET_ANSWER_OPTIONS*/ ctx[7];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty[0] & /*$data_dict, quiz_id, BLICKET_ANSWER_OPTIONS*/ 161) {
    				select_option(select, /*$data_dict*/ ctx[5][/*quiz_id*/ ctx[0]].blicket_answer_groups[/*i*/ ctx[24]]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(150:12) {#each $task_blocks as block, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let scrolling = false;

    	let clear_scrolling = () => {
    		scrolling = false;
    	};

    	let scrolling_timeout;
    	let body;
    	let div2;
    	let div1;
    	let h30;
    	let t1;
    	let t2;
    	let h31;
    	let t4;
    	let t5;
    	let h32;
    	let t7;
    	let textarea;
    	let t8;
    	let div0;
    	let p;
    	let t9;
    	let br;
    	let t10;
    	let t11;
    	let button0;
    	let t12;
    	let button0_disabled_value;
    	let t13;
    	let button1;
    	let t15;
    	let button2;
    	let body_intro;
    	let body_outro;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowscroll*/ ctx[15]);
    	let each_value_2 = /*quiz_block_combos*/ ctx[8];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = /*$task_blocks*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			body = element("body");
    			div2 = element("div");
    			div1 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Will the following blicket machines activate?";
    			t1 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			h31 = element("h3");
    			h31.textContent = "Do you think that each of the following blocks is a blicket?";
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			h32 = element("h3");
    			h32.textContent = "Please describe how you think the blicket machine works.";
    			t7 = space();
    			textarea = element("textarea");
    			t8 = space();
    			div0 = element("div");
    			p = element("p");
    			t9 = text("Thank you for your answers!");
    			br = element("br");
    			t10 = text("We will review your blicket machine description and award you a bonus for a correct explanation.");
    			t11 = space();
    			button0 = element("button");
    			t12 = text("Click to submit your answers and receive feedback");
    			t13 = space();
    			button1 = element("button");
    			button1.textContent = "Click to continue";
    			t15 = space();
    			button2 = element("button");
    			button2.textContent = "dev: skip form validation";
    			add_location(h30, file$3, 125, 12, 4757);
    			add_location(h31, file$3, 147, 12, 6059);
    			add_location(h32, file$3, 164, 12, 6868);
    			attr_dev(textarea, "class", "svelte-1hcx2hx");
    			add_location(textarea, file$3, 165, 12, 6946);
    			add_location(br, file$3, 167, 67, 7171);
    			set_style(p, "color", "blue");
    			add_location(p, file$3, 167, 16, 7120);
    			set_style(div0, "text-align", "center");
    			attr_dev(div0, "class", "svelte-1hcx2hx");
    			toggle_class(div0, "hide", /*hide_correct_answers*/ ctx[1]);
    			add_location(div0, file$3, 166, 12, 7034);
    			button0.disabled = button0_disabled_value = !/*answered_all_questions*/ ctx[3];
    			attr_dev(button0, "class", "svelte-1hcx2hx");
    			toggle_class(button0, "hide", !/*hide_correct_answers*/ ctx[1]);
    			add_location(button0, file$3, 170, 12, 7308);
    			attr_dev(button1, "class", "svelte-1hcx2hx");
    			toggle_class(button1, "hide", /*hide_correct_answers*/ ctx[1]);
    			add_location(button1, file$3, 171, 12, 7495);
    			add_location(button2, file$3, 174, 12, 7652);
    			attr_dev(div1, "class", "col-container svelte-1hcx2hx");
    			add_location(div1, file$3, 124, 8, 4717);
    			attr_dev(div2, "class", "centering-container");
    			add_location(div2, file$3, 123, 4, 4675);
    			add_location(body, file$3, 122, 0, 4609);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h30);
    			append_dev(div1, t1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(div1, t2);
    			append_dev(div1, h31);
    			append_dev(div1, t4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t5);
    			append_dev(div1, h32);
    			append_dev(div1, t7);
    			append_dev(div1, textarea);
    			set_input_value(textarea, /*$data_dict*/ ctx[5][/*quiz_id*/ ctx[0]].free_response_answer);
    			append_dev(div1, t8);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t9);
    			append_dev(p, br);
    			append_dev(p, t10);
    			append_dev(div1, t11);
    			append_dev(div1, button0);
    			append_dev(button0, t12);
    			append_dev(div1, t13);
    			append_dev(div1, button1);
    			append_dev(div1, t15);
    			append_dev(div1, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "scroll", () => {
    						scrolling = true;
    						clearTimeout(scrolling_timeout);
    						scrolling_timeout = setTimeout(clear_scrolling, 100);
    						/*onwindowscroll*/ ctx[15]();
    					}),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[19]),
    					listen_dev(button0, "click", /*show_correct_answers*/ ctx[10], false, false, false),
    					listen_dev(button1, "click", /*cont*/ ctx[11], false, false, false),
    					listen_dev(button2, "click", /*skip*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*scrollY*/ 4 && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrollTo(window.pageXOffset, /*scrollY*/ ctx[2]);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    			}

    			if (dirty[0] & /*hide_correct_answers, $data_dict, quiz_id, correct_activation_answers, ACTIVATION_ANSWER_OPTIONS, quiz_block_combos*/ 867) {
    				each_value_2 = /*quiz_block_combos*/ ctx[8];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div1, t2);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty[0] & /*$data_dict, quiz_id, BLICKET_ANSWER_OPTIONS, $task_blocks*/ 177) {
    				each_value = /*$task_blocks*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, t5);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*$data_dict, quiz_id, BLICKET_ANSWER_OPTIONS*/ 161) {
    				set_input_value(textarea, /*$data_dict*/ ctx[5][/*quiz_id*/ ctx[0]].free_response_answer);
    			}

    			if (dirty[0] & /*hide_correct_answers*/ 2) {
    				toggle_class(div0, "hide", /*hide_correct_answers*/ ctx[1]);
    			}

    			if (!current || dirty[0] & /*answered_all_questions*/ 8 && button0_disabled_value !== (button0_disabled_value = !/*answered_all_questions*/ ctx[3])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty[0] & /*hide_correct_answers*/ 2) {
    				toggle_class(button0, "hide", !/*hide_correct_answers*/ ctx[1]);
    			}

    			if (dirty[0] & /*hide_correct_answers*/ 2) {
    				toggle_class(button1, "hide", /*hide_correct_answers*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			add_render_callback(() => {
    				if (body_outro) body_outro.end(1);
    				if (!body_intro) body_intro = create_in_transition(body, fade, { duration: 300 });
    				body_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			if (body_intro) body_intro.invalidate();
    			body_outro = create_out_transition(body, fade, { duration: 0 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching && body_outro) body_outro.end();
    			mounted = false;
    			run_all(dispose);
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

    const func$1 = block => block.state;

    function instance$3($$self, $$props, $$invalidate) {
    	let $task_blocks;
    	let $data_dict;
    	validate_store(task_blocks, "task_blocks");
    	component_subscribe($$self, task_blocks, $$value => $$invalidate(4, $task_blocks = $$value));
    	validate_store(data_dict, "data_dict");
    	component_subscribe($$self, data_dict, $$value => $$invalidate(5, $data_dict = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Quiz", slots, []);
    	let { quiz_id } = $$props; // string used for identifying the quiz data when writing to experiment_stores.js
    	let { quiz_bit_combos = ["101", "100"] } = $$props;
    	let { activation } = $$props; // lambda function that represents the causal relationship

    	// Constants
    	const ACTIVATION_ANSWER_OPTIONS = ["Yes", "No"];

    	const BLICKET_ANSWER_OPTIONS = [
    		{ id: -1, text: "Unselected" },
    		{
    			id: 10,
    			text: "10 — Definitely a blicket"
    		},
    		{ id: 9, text: "9" },
    		{
    			id: 8,
    			text: "8 — Almost sure that this is a blicket."
    		},
    		{ id: 7, text: "7" },
    		{ id: 6, text: "6" },
    		{ id: 5, text: "5 — Unsure" },
    		{ id: 4, text: "4" },
    		{ id: 3, text: "3" },
    		{
    			id: 2,
    			text: "2 — Almost sure that this is NOT a blicket."
    		},
    		{ id: 1, text: "1" },
    		{
    			id: 0,
    			text: "0 — Definitely NOT a blicket"
    		}
    	];

    	// Initialize and store variables
    	let hide_correct_answers = true;

    	let scrollY = 0;

    	// copy the blocks that were used by the preceding task
    	let blocks = [...$task_blocks];

    	blocks.sort((a, b) => a.id - b.id); // IMPORTANT: sort by id

    	// Store participant answers
    	data_dict.update(dict => {
    		dict[quiz_id] = {
    			activation_answer_groups: [],
    			blicket_answer_groups: [],
    			free_response_answer: ""
    		};

    		return dict;
    	});

    	// initialize the stored answers
    	for (let i = 0; i < quiz_bit_combos.length; i++) {
    		$data_dict[quiz_id].activation_answer_groups.push(null);
    		$data_dict[quiz_id].blicket_answer_groups.push(-1); // corresponds to the "unselected" option
    	}

    	// check whether the participant has given an answer to all problems
    	let answered_all_questions = false;

    	// derive block combinations and correct activation answers from quiz_bit_combos
    	let quiz_block_combos = []; // array of arrays of (copied) block objects

    	let correct_activation_answers = []; // array of correct answers (true or false) for the activation questions

    	for (let i = 0; i < quiz_bit_combos.length; i++) {
    		let bit_combo = quiz_bit_combos[i];
    		let block_combo = [];

    		for (let j = 0; j < bit_combo.length; j++) {
    			let block_obj_copy = Object.assign({}, blocks[j]);

    			if (bit_combo[j] === "1") {
    				block_obj_copy.state = true;
    			} else {
    				block_obj_copy.state = false;
    			}

    			block_combo.push(block_obj_copy);
    		}

    		quiz_block_combos.push(block_combo);
    		let block_states = block_combo.map(block => block.state);
    		let correct_ans = activation(...block_states);
    		correct_activation_answers.push(correct_ans);
    	}

    	// Click handlers
    	function show_correct_answers() {
    		$$invalidate(1, hide_correct_answers = false);
    		$$invalidate(2, scrollY = 0); // scroll to the top
    	}

    	// event dispatcher for communicating with parent components
    	const dispatch = createEventDispatcher();

    	function cont() {
    		// Tell parent components to move on to the next task/quiz
    		dispatch("continue");
    	}

    	// TODO: remove for prod
    	function skip() {
    		$$invalidate(3, answered_all_questions = true);
    	}

    	const writable_props = ["quiz_id", "quiz_bit_combos", "activation"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Quiz> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function onwindowscroll() {
    		$$invalidate(2, scrollY = window.pageYOffset);
    	}

    	function input_change_handler(i) {
    		$data_dict[quiz_id].activation_answer_groups[i] = this.__value;
    		data_dict.set($data_dict);
    		$$invalidate(0, quiz_id);
    		$$invalidate(7, BLICKET_ANSWER_OPTIONS);
    	}

    	function select_change_handler(i) {
    		$data_dict[quiz_id].blicket_answer_groups[i] = select_value(this);
    		data_dict.set($data_dict);
    		$$invalidate(0, quiz_id);
    		$$invalidate(7, BLICKET_ANSWER_OPTIONS);
    	}

    	function textarea_input_handler() {
    		$data_dict[quiz_id].free_response_answer = this.value;
    		data_dict.set($data_dict);
    		$$invalidate(0, quiz_id);
    		$$invalidate(7, BLICKET_ANSWER_OPTIONS);
    	}

    	$$self.$$set = $$props => {
    		if ("quiz_id" in $$props) $$invalidate(0, quiz_id = $$props.quiz_id);
    		if ("quiz_bit_combos" in $$props) $$invalidate(13, quiz_bit_combos = $$props.quiz_bit_combos);
    		if ("activation" in $$props) $$invalidate(14, activation = $$props.activation);
    	};

    	$$self.$capture_state = () => ({
    		quiz_id,
    		quiz_bit_combos,
    		activation,
    		BlockGrid,
    		task_blocks,
    		data_dict,
    		fade,
    		createEventDispatcher,
    		ACTIVATION_ANSWER_OPTIONS,
    		BLICKET_ANSWER_OPTIONS,
    		hide_correct_answers,
    		scrollY,
    		blocks,
    		answered_all_questions,
    		quiz_block_combos,
    		correct_activation_answers,
    		show_correct_answers,
    		dispatch,
    		cont,
    		skip,
    		$task_blocks,
    		$data_dict
    	});

    	$$self.$inject_state = $$props => {
    		if ("quiz_id" in $$props) $$invalidate(0, quiz_id = $$props.quiz_id);
    		if ("quiz_bit_combos" in $$props) $$invalidate(13, quiz_bit_combos = $$props.quiz_bit_combos);
    		if ("activation" in $$props) $$invalidate(14, activation = $$props.activation);
    		if ("hide_correct_answers" in $$props) $$invalidate(1, hide_correct_answers = $$props.hide_correct_answers);
    		if ("scrollY" in $$props) $$invalidate(2, scrollY = $$props.scrollY);
    		if ("blocks" in $$props) blocks = $$props.blocks;
    		if ("answered_all_questions" in $$props) $$invalidate(3, answered_all_questions = $$props.answered_all_questions);
    		if ("quiz_block_combos" in $$props) $$invalidate(8, quiz_block_combos = $$props.quiz_block_combos);
    		if ("correct_activation_answers" in $$props) $$invalidate(9, correct_activation_answers = $$props.correct_activation_answers);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$data_dict, quiz_id*/ 33) {
    			 {
    				$$invalidate(3, answered_all_questions = true); // start with true then flip to false depending on the checks below

    				if ($data_dict[quiz_id].free_response_answer.length === 0) {
    					// free response is empty
    					$$invalidate(3, answered_all_questions = false);
    				}

    				let activation_answer_groups = $data_dict[quiz_id].activation_answer_groups;

    				for (let i = 0; i < activation_answer_groups.length; i++) {
    					if (activation_answer_groups[i] === null) {
    						// one of the activation radio questions have not been answered
    						$$invalidate(3, answered_all_questions = false);
    					}
    				}

    				let blicket_answer_groups = $data_dict[quiz_id].blicket_answer_groups;

    				for (let i = 0; i < blicket_answer_groups.length; i++) {
    					if (blicket_answer_groups[i] === -1) {
    						// one of the blicket dropdowns have not been answered
    						$$invalidate(3, answered_all_questions = false);
    					}
    				}
    			}
    		}
    	};

    	return [
    		quiz_id,
    		hide_correct_answers,
    		scrollY,
    		answered_all_questions,
    		$task_blocks,
    		$data_dict,
    		ACTIVATION_ANSWER_OPTIONS,
    		BLICKET_ANSWER_OPTIONS,
    		quiz_block_combos,
    		correct_activation_answers,
    		show_correct_answers,
    		cont,
    		skip,
    		quiz_bit_combos,
    		activation,
    		onwindowscroll,
    		input_change_handler,
    		$$binding_groups,
    		select_change_handler,
    		textarea_input_handler
    	];
    }

    class Quiz extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				quiz_id: 0,
    				quiz_bit_combos: 13,
    				activation: 14
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Quiz",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*quiz_id*/ ctx[0] === undefined && !("quiz_id" in props)) {
    			console.warn("<Quiz> was created without expected prop 'quiz_id'");
    		}

    		if (/*activation*/ ctx[14] === undefined && !("activation" in props)) {
    			console.warn("<Quiz> was created without expected prop 'activation'");
    		}
    	}

    	get quiz_id() {
    		throw new Error("<Quiz>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set quiz_id(value) {
    		throw new Error("<Quiz>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get quiz_bit_combos() {
    		throw new Error("<Quiz>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set quiz_bit_combos(value) {
    		throw new Error("<Quiz>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activation() {
    		throw new Error("<Quiz>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activation(value) {
    		throw new Error("<Quiz>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TaskVid.svelte generated by Svelte v3.29.0 */

    const file$4 = "src/TaskVid.svelte";

    function create_fragment$4(ctx) {
    	let body;

    	const block = {
    		c: function create() {
    			body = element("body");
    			add_location(body, file$4, 6, 0, 119);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TaskVid",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.0 */

    const { Object: Object_1$2, console: console_1 } = globals;

    // (44:1) {:else}
    function create_else_block$2(ctx) {
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(44:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (42:42) 
    function create_if_block_1(ctx) {
    	let quiz;
    	let current;
    	const quiz_spread_levels = [/*task_quiz_sequence*/ ctx[1][/*current_key*/ ctx[0]]];
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
    			const quiz_changes = (dirty & /*task_quiz_sequence, current_key*/ 3)
    			? get_spread_update(quiz_spread_levels, [get_spread_object(/*task_quiz_sequence*/ ctx[1][/*current_key*/ ctx[0]])])
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
    		source: "(42:42) ",
    		ctx
    	});

    	return block;
    }

    // (40:1) {#if current_key.startsWith("Task")}
    function create_if_block$2(ctx) {
    	let task;
    	let current;
    	const task_spread_levels = [/*task_quiz_sequence*/ ctx[1][/*current_key*/ ctx[0]]];
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
    			const task_changes = (dirty & /*task_quiz_sequence, current_key*/ 3)
    			? get_spread_update(task_spread_levels, [get_spread_object(/*task_quiz_sequence*/ ctx[1][/*current_key*/ ctx[0]])])
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
    		source: "(40:1) {#if current_key.startsWith(\\\"Task\\\")}",
    		ctx
    	});

    	return block;
    }

    // (38:0) {#key current_key}
    function create_key_block(ctx) {
    	let show_if;
    	let show_if_1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_if_block_1, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*current_key*/ 1) show_if = !!/*current_key*/ ctx[0].startsWith("Task");
    		if (show_if) return 0;
    		if (dirty & /*current_key*/ 1) show_if_1 = !!/*current_key*/ ctx[0].startsWith("Quiz");
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
    		source: "(38:0) {#key current_key}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let previous_key = /*current_key*/ ctx[0];
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
    			if (dirty & /*current_key*/ 1 && safe_not_equal(previous_key, previous_key = /*current_key*/ ctx[0])) {
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	let task_quiz_sequence = {
    		// "Video_0": {},
    		// "Task_dev": {activation: (arg0, arg1, arg2) => arg0 && arg2, time_limit_seconds: 60, randomize_arg_order: false},  // conjunctive
    		// "Quiz_dev": {quiz_id: "training_quiz", quiz_bit_combos: ["001", "100", "011"], activation: (arg0, arg1, arg2) => arg0},
    		"Task_0": {
    			activation: (arg0, arg1, arg2) => arg0 && arg2,
    			time_limit_seconds: 60,
    			noise: 0
    		}, // conjunctive
    		"Quiz_0": {
    			quiz_id: "training_quiz",
    			quiz_bit_combos: ["101", "100", "011"],
    			activation: (arg0, arg1, arg2) => arg0
    		},
    		"Task_1": {
    			activation: (arg0, arg1, arg2) => arg0,
    			time_limit_seconds: 60,
    			noise: 0
    		}, // deterministic disjunctive
    		"Task_1_noisy": {
    			activation: (arg0, arg1, arg2) => arg0,
    			time_limit_seconds: 60,
    			noise: 0.5
    		}, // noisy disjunctive
    		// showing that we can get complex:
    		"Task_2": {
    			activation: (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) => arg0,
    			time_limit_seconds: 60,
    			noise: 0
    		}
    	};

    	// TODO: sequence should be task --> quiz --> demo/video of task --> quiz
    	// TODO: pass a readable ID to components that can be used to distinguish their data in experiment_stores.js
    	let task_quiz_keys = Object.keys(task_quiz_sequence);

    	let task_quiz_dex = 0;

    	function handleContinue(event) {
    		// increment task_quiz_dex to select the next task or quiz
    		if (task_quiz_dex >= task_quiz_keys.length - 1) {
    			// end of the entire experiment
    			return;
    		}

    		$$invalidate(3, task_quiz_dex += 1);
    	}

    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Task,
    		Quiz,
    		TaskVid,
    		task_quiz_sequence,
    		task_quiz_keys,
    		task_quiz_dex,
    		handleContinue,
    		current_key
    	});

    	$$self.$inject_state = $$props => {
    		if ("task_quiz_sequence" in $$props) $$invalidate(1, task_quiz_sequence = $$props.task_quiz_sequence);
    		if ("task_quiz_keys" in $$props) $$invalidate(4, task_quiz_keys = $$props.task_quiz_keys);
    		if ("task_quiz_dex" in $$props) $$invalidate(3, task_quiz_dex = $$props.task_quiz_dex);
    		if ("current_key" in $$props) $$invalidate(0, current_key = $$props.current_key);
    	};

    	let current_key;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*task_quiz_dex*/ 8) {
    			 $$invalidate(0, current_key = task_quiz_keys[task_quiz_dex]);
    		}

    		if ($$self.$$.dirty & /*current_key*/ 1) {
    			// TODO: remove
    			 console.log(current_key);
    		}
    	};

    	return [current_key, task_quiz_sequence, handleContinue];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
