/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
this.BX.UI.System.Popover = this.BX.UI.System.Popover || {};
(function (exports, ui_vue3, main_core, ui_system_popover) {
	'use strict';

	const hyphenate = name => name.replaceAll(/\B([A-Z])/g, '-$1').toLowerCase();
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
	const isStyleKey = name => name.toLowerCase() === 'style';
	const isInlineHandlerName = name => {
		return name.startsWith('on') && name in HTMLElement.prototype;
	};
	const isListenerKey = name => {
		return /^on[:A-Z]/.test(name) || isInlineHandlerName(name.toLowerCase());
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
	const isStyleProperty = name => {
		return CSS.supports(name.startsWith('--') ? name : hyphenate(name), 'initial');
	};
	const BOOLEAN_ATTRIBUTES = new Set(['allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls', 'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nomodule', 'novalidate', 'open', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected']);
	const isBooleanAttribute = name => BOOLEAN_ATTRIBUTES.has(name.toLowerCase());
	const isAttributePresent = value => Boolean(value) || value === '';
	const isServiceStyleProperty = name => /^margin(-|$)/.test(hyphenate(name));
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
				appliedAttributes: [],
				appliedListeners: {},
				appliedStyle: {}
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
			this.contentNode = ui_vue3.markRaw(contentNode);
			this.popover = popover;
			this.appliedOptions = ui_vue3.markRaw(readOptions(this.options));
			this.syncAttributes();
		},
		mounted() {
			this.popover?.show();
		},
		updated() {
			const changed = this.syncAttributes();
			if (changed) {
				this.popover?.adjustPosition();
			}
		},
		unmounted() {
			if (this.contentNode !== null) {
				this.syncListeners(this.contentNode, {});
			}
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
			},
			syncAttributes() {
				const node = this.contentNode;
				if (node === null) {
					return false;
				}
				const attributes = this.$attrs;
				const names = Object.keys(attributes).filter(name => !isStyleKey(name) && !isListenerKey(name));
				let changed = false;
				this.appliedAttributes.filter(name => !names.includes(name)).forEach(name => {
					changed = changed || node.hasAttribute(name);
					node.removeAttribute(name);
				});
				this.appliedAttributes = names;
				names.forEach(name => {
					const value = attributes[name];
					const boolean = isBooleanAttribute(name);
					if (main_core.Type.isNil(value) || boolean && !isAttributePresent(value)) {
						changed = changed || node.hasAttribute(name);
						node.removeAttribute(name);
						return;
					}
					const written = boolean ? '' : String(value);
					changed = changed || main_core.Type.isObjectLike(value) || node.getAttribute(name) !== written;
					main_core.Dom.attr(node, name, boolean ? '' : value);
				});
				const styleKey = Object.keys(attributes).find(name => isStyleKey(name));
				this.syncListeners(node, attributes);
				return this.syncStyle(node, styleKey === undefined ? null : attributes[styleKey]) || changed;
			},
			syncListeners(node, attributes) {
				const listeners = {};
				Object.keys(attributes).filter(name => isListenerKey(name)).forEach(name => {
					const handlers = readHandlers(attributes[name]);
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
					const previous = this.appliedListeners[name];
					const listener = sameHandlers(previous?.handlers, handlers) ? previous.listener : buildListener(handlers);
					listeners[name] = {
						event,
						handlers,
						listener,
						options
					};
				});
				Object.entries(this.appliedListeners).filter(([key, applied]) => listeners[key]?.listener !== applied.listener).forEach(([, applied]) => main_core.Event.unbind(node, applied.event, applied.listener, applied.options));
				Object.entries(listeners).filter(([key, applied]) => this.appliedListeners[key]?.listener !== applied.listener).forEach(([, applied]) => main_core.Event.bind(node, applied.event, applied.listener, applied.options));
				this.appliedListeners = listeners;
			},
			syncStyle(node, value) {
				const declarations = styleDeclarations(value);
				const properties = Object.keys(declarations).filter(name => isStyleProperty(name) && !isServiceStyleProperty(name));
				const applied = this.appliedStyle;
				let changed = false;
				Object.keys(applied).filter(property => !properties.includes(property)).forEach(property => {
					changed = true;
					main_core.Dom.style(node, property, null);
				});
				const next = {};
				properties.forEach(property => {
					const declaration = declarations[property];
					next[property] = declaration;
					if (applied[property] === declaration) {
						return;
					}
					changed = true;
					main_core.Dom.style(node, property, declaration);
				});
				this.appliedStyle = next;
				return changed;
			}
		},
		template: `
		<Teleport v-if="contentNode" :to="contentNode">
			<slot/>
		</Teleport>
	`
	});

	exports.BPopover = BPopover;

})(this.BX.UI.System.Popover.Vue = this.BX.UI.System.Popover.Vue || {}, BX.Vue3, BX, BX.UI.System.Popover);
//# sourceMappingURL=vue.bundle.js.map
