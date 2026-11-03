/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
this.BX.UI.System.Popover = this.BX.UI.System.Popover || {};
(function (exports, ui_vue3, main_core, ui_system_popover) {
	'use strict';

	const hyphenate = name => name.replaceAll(/\B([A-Z])/g, '-$1').toLowerCase();
	const matchesPattern = (name, patterns) => {
		return patterns.some(pattern => pattern instanceof RegExp ? name.search(pattern) !== -1 : pattern === name);
	};
	const isStyleKey = name => name.toLowerCase() === 'style';
	const isClassKey = name => name.toLowerCase() === 'class';
	const isInlineHandlerName = (name, node) => {
		return name.startsWith('on') && name in (node ?? HTMLElement.prototype);
	};
	const isListenerKey = (name, node) => {
		return /^on[:A-Z]/.test(name) || isInlineHandlerName(name.toLowerCase(), node);
	};
	const LISTENER_MODIFIER = /(Once|Passive|Capture)$/;
	const readListenerKey = key => {
		const options = {};
		let name = key;
		for (let modifier = LISTENER_MODIFIER.exec(name); modifier !== null; modifier = LISTENER_MODIFIER.exec(name)) {
			if (modifier[1] === 'Once') {
				options.once = true;
			} else if (modifier[1] === 'Passive') {
				options.passive = true;
			} else {
				options.capture = true;
			}
			name = name.slice(0, -modifier[1].length);
		}
		return {
			event: name[2] === ':' ? name.slice(3) : hyphenate(name.slice(2)),
			options
		};
	};
	const readHandlers = value => {
		const items = main_core.Type.isArray(value) ? value : [value];
		return items.filter(item => main_core.Type.isFunction(item));
	};
	const sameHandlers = (left, right) => {
		return left !== undefined && left.length === right.length && left.every((handler, index) => handler === right[index]);
	};
	const buildListener = handlers => {
		if (handlers.length === 1) {
			return handlers[0];
		}
		const listener = event => {
			handlers.forEach(handler => handler.call(event.currentTarget, event));
		};
		return listener;
	};
	const isBindableEvent = event => !(event in Object.prototype);
	const stylePropertyName = name => name.startsWith('--') ? name : hyphenate(name);
	const isStyleProperty = name => CSS.supports(name, 'initial');
	const BOOLEAN_ATTRIBUTES = new Set(['allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls', 'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nomodule', 'novalidate', 'open', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected']);
	const isAttributePresent = value => Boolean(value) || value === '';
	const classTokens = value => {
		if (main_core.Type.isString(value)) {
			return value.split(/\s+/).filter(token => token.length > 0);
		}
		if (main_core.Type.isArray(value)) {
			return value.flatMap(item => classTokens(item));
		}
		if (main_core.Type.isPlainObject(value)) {
			return Object.entries(value).filter(([, enabled]) => Boolean(enabled)).flatMap(([name]) => classTokens(name));
		}
		return [];
	};
	const styleDeclarations = value => {
		if (main_core.Type.isPlainObject(value)) {
			return value;
		}
		if (!main_core.Type.isString(value)) {
			return {};
		}
		const {
			style
		} = document.createElement('div');
		style.cssText = value;
		return Object.fromEntries([...style].map(name => [name, style.getPropertyValue(name)]));
	};
	const applyAttributes = (node, attrs, applied, protectedNames) => {
		const values = new Map();
		Object.keys(attrs).filter(key => !isStyleKey(key) && !isClassKey(key) && !isListenerKey(key, node)).forEach(key => {
			const name = key.toLowerCase();
			if (!matchesPattern(name, protectedNames)) {
				values.set(name, attrs[key]);
			}
		});
		let changed = false;
		applied.filter(name => !values.has(name)).forEach(name => {
			changed = changed || node.hasAttribute(name);
			node.removeAttribute(name);
		});
		values.forEach((value, name) => {
			const boolean = BOOLEAN_ATTRIBUTES.has(name);
			if (main_core.Type.isNil(value) || boolean && !isAttributePresent(value)) {
				changed = changed || node.hasAttribute(name);
				node.removeAttribute(name);
				return;
			}
			const written = boolean ? '' : String(value);
			changed = changed || main_core.Type.isObjectLike(value) || node.getAttribute(name) !== written;
			main_core.Dom.attr(node, name, boolean ? '' : value);
		});
		return {
			state: [...values.keys()],
			changed
		};
	};
	const applyClasses = (node, attrs, applied, protectedNames) => {
		const key = Object.keys(attrs).find(name => isClassKey(name));
		const tokens = key === undefined ? [] : [...new Set(classTokens(attrs[key]))].filter(token => !matchesPattern(token, protectedNames));
		let changed = false;
		applied.filter(token => !tokens.includes(token)).forEach(token => {
			changed = changed || main_core.Dom.hasClass(node, token);
			main_core.Dom.removeClass(node, token);
		});
		const state = tokens.filter(token => {
			if (main_core.Dom.hasClass(node, token)) {
				return applied.includes(token);
			}
			changed = true;
			main_core.Dom.addClass(node, token);
			return true;
		});
		return {
			state,
			changed
		};
	};
	const applyStyle = (node, attrs, applied, protectedNames) => {
		const key = Object.keys(attrs).find(name => isStyleKey(name));
		const declarations = styleDeclarations(key === undefined ? null : attrs[key]);
		const next = {};
		Object.entries(declarations).forEach(([name, declaration]) => {
			const property = stylePropertyName(name);
			if (isStyleProperty(property) && !matchesPattern(property, protectedNames)) {
				next[property] = declaration;
			}
		});
		let changed = false;
		Object.keys(applied).filter(property => !Object.hasOwn(next, property)).forEach(property => {
			changed = true;
			main_core.Dom.style(node, property, null);
		});
		Object.entries(next).forEach(([property, declaration]) => {
			if (applied[property] === declaration) {
				return;
			}
			changed = true;
			main_core.Dom.style(node, property, declaration);
		});
		return {
			state: next,
			changed
		};
	};
	const applyListeners = (node, attrs, applied) => {
		const listeners = {};
		Object.keys(attrs).filter(name => isListenerKey(name, node)).forEach(name => {
			const handlers = readHandlers(attrs[name]);
			if (handlers.length === 0) {
				return;
			}
			const {
				event,
				options
			} = readListenerKey(name);
			if (!isBindableEvent(event)) {
				return;
			}
			const previous = applied[name];
			const listener = sameHandlers(previous?.handlers, handlers) ? previous.listener : buildListener(handlers);
			listeners[name] = {
				event,
				handlers,
				listener,
				options
			};
		});
		Object.entries(applied).filter(([key, listener]) => listeners[key]?.listener !== listener.listener).forEach(([, listener]) => main_core.Event.unbind(node, listener.event, listener.listener, listener.options));
		Object.entries(listeners).filter(([key, listener]) => applied[key]?.listener !== listener.listener).forEach(([, listener]) => main_core.Event.bind(node, listener.event, listener.listener, listener.options));
		return listeners;
	};
	const useAttrsSync = options => {
		const protectedAttributes = options.protectedAttributes ?? [];
		const protectedClasses = options.protectedClasses ?? [];
		const protectedStyleProps = options.protectedStyleProps ?? [];
		let appliedAttributes = [];
		let appliedClasses = [];
		let appliedStyle = {};
		let appliedListeners = {};
		const sync = attrs => {
			const node = options.getNode();
			if (!node) {
				return false;
			}
			const attributes = applyAttributes(node, attrs, appliedAttributes, protectedAttributes);
			const classes = applyClasses(node, attrs, appliedClasses, protectedClasses);
			const style = applyStyle(node, attrs, appliedStyle, protectedStyleProps);
			appliedListeners = applyListeners(node, attrs, appliedListeners);
			appliedAttributes = attributes.state;
			appliedClasses = classes.state;
			appliedStyle = style.state;
			return attributes.changed || classes.changed || style.changed;
		};
		return {
			sync,
			clear: () => {
				sync({});
			}
		};
	};

	const OPTION_SETTERS = [{
		name: 'closeByClickOutside',
		apply: (popover, value) => popover.setCloseByClickOutside(value !== false)
	}, {
		name: 'closeByEsc',
		apply: (popover, value) => popover.setCloseByEsc(value !== false)
	}, {
		name: 'className',
		apply: (popover, value) => popover.setClassName(value)
	}, {
		name: 'designContext',
		apply: (popover, value) => popover.setDesignContext(value)
	}, {
		name: 'target',
		apply: (popover, value) => popover.setTarget(value)
	}, {
		name: 'positioning',
		apply: (popover, value) => popover.setPositioning(value)
	}];
	const snapshotValue = value => {
		if (main_core.Type.isArray(value)) {
			return value.map(item => snapshotValue(item));
		}
		if (main_core.Type.isPlainObject(value)) {
			return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshotValue(item)]));
		}
		return value;
	};
	const isSameValue = (left, right) => {
		if (Object.is(left, right)) {
			return true;
		}
		if (main_core.Type.isArray(left) && main_core.Type.isArray(right)) {
			const leftItems = left;
			const rightItems = right;
			return leftItems.length === rightItems.length && leftItems.every((item, index) => isSameValue(item, rightItems[index]));
		}
		if (main_core.Type.isPlainObject(left) && main_core.Type.isPlainObject(right)) {
			const leftEntries = Object.entries(left);
			const rightFields = right;
			return leftEntries.length === Object.keys(rightFields).length && leftEntries.every(([key, item]) => {
				return Object.hasOwn(rightFields, key) && isSameValue(item, rightFields[key]);
			});
		}
		return false;
	};
	const readOptions = options => {
		return Object.fromEntries(OPTION_SETTERS.map(({
			name
		}) => [name, snapshotValue(options[name])]));
	};
	const BPopover = ui_vue3.defineComponent({
		name: 'BPopover',
		inheritAttrs: false,
		props: {
			options: {
				type: Object,
				default: () => ({})
			}
		},
		emits: ['show', 'hide', 'stateChange', 'destroy'],
		data() {
			return {
				contentNode: null,
				popover: null,
				appliedOptions: ui_vue3.markRaw({}),
				attrsSync: null
			};
		},
		watch: {
			options: {
				deep: true,
				handler() {
					this.syncOptions();
				}
			}
		},
		created() {
			const contentNode = document.createElement('div');
			const popover = ui_vue3.markRaw(new ui_system_popover.Popover({
				...this.options,
				content: contentNode
			}));
			popover.subscribe('onShow', event => {
				this.$emit('show', event);
			});
			popover.subscribe('onHide', event => {
				this.$emit('hide', event);
			});
			popover.subscribe('onStateChange', event => {
				this.$emit('stateChange', event);
			});
			popover.subscribe('onDestroy', event => {
				this.$emit('destroy', event);
			});
			const attrsSync = useAttrsSync({
				getNode: () => this.contentNode,
				protectedAttributes: [ui_system_popover.BUBBLE_ATTRIBUTE],
				protectedStyleProps: [/^margin(-|$)/],
				protectedClasses: []
			});
			this.contentNode = ui_vue3.markRaw(contentNode);
			this.popover = popover;
			this.attrsSync = ui_vue3.markRaw(attrsSync);
			this.appliedOptions = ui_vue3.markRaw(readOptions(this.options));
			attrsSync.sync(this.$attrs);
		},
		mounted() {
			this.popover?.show();
		},
		updated() {
			const changed = this.attrsSync?.sync(this.$attrs) ?? false;
			if (changed) {
				this.popover?.adjustPosition();
			}
		},
		unmounted() {
			this.attrsSync?.clear();
			this.popover?.destroy();
		},
		methods: {
			syncOptions() {
				const popover = this.popover;
				if (popover === null) {
					return;
				}
				const options = this.options;
				const applied = {
					...this.appliedOptions
				};
				OPTION_SETTERS.forEach(({
					name,
					apply
				}) => {
					const value = snapshotValue(options[name]);
					if (isSameValue(value, applied[name])) {
						return;
					}
					applied[name] = value;
					apply(popover, value);
				});
				this.appliedOptions = ui_vue3.markRaw(applied);
			}
		},
		template: `
		<Teleport v-if="contentNode" :to="contentNode">
			<slot/>
		</Teleport>
	`
	});

	exports.BPopover = BPopover;
	exports.useAttrsSync = useAttrsSync;

})(this.BX.UI.System.Popover.Vue = this.BX.UI.System.Popover.Vue || {}, BX.Vue3, BX, BX.UI.System.Popover);
//# sourceMappingURL=vue.bundle.js.map
