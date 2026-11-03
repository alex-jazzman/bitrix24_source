/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
this.BX.UI.System.Tooltip = this.BX.UI.System.Tooltip || {};
(function (exports, ui_vue3, main_core, ui_system_tooltip) {
	'use strict';

	const WARNING_NAMESPACE = 'BX.UI.System.Tooltip.Vue';
	const DEFAULT_POSITION = ui_system_tooltip.TooltipPosition.Top;
	const DEFAULT_OFFSET = 4;
	const DEFAULT_TRIGGER = [ui_system_tooltip.TooltipTrigger.Hover, ui_system_tooltip.TooltipTrigger.Focus];
	const buildDefaultOptions = () => ({
		content: '',
		html: false,
		maxWidth: ui_system_tooltip.DEFAULT_MAX_WIDTH,
		position: DEFAULT_POSITION,
		offset: DEFAULT_OFFSET,
		crossOffset: 0,
		trigger: [...DEFAULT_TRIGGER],
		showDelay: 0,
		hideDelay: 0
	});
	const snapshotValue = value => main_core.Type.isArray(value) ? [...value] : value;
	const isSameValue = (left, right) => {
		if (Object.is(left, right)) {
			return true;
		}
		if (main_core.Type.isArray(left) && main_core.Type.isArray(right)) {
			const leftItems = left;
			const rightItems = right;
			return leftItems.length === rightItems.length && leftItems.every((item, index) => Object.is(item, rightItems[index]));
		}
		return false;
	};
	const snapshotOptions = options => {
		return Object.fromEntries(Object.entries(options).map(([name, value]) => [name, snapshotValue(value)]));
	};
	const applyOptions = (tooltip, applied, options) => {
		const snapshot = snapshotOptions(options);
		const changed = Object.fromEntries(Object.entries(snapshot).filter(([name, value]) => !isSameValue(value, applied[name])));
		if (Object.keys(changed).length > 0) {
			tooltip.setOptions(changed);
		}
		return snapshot;
	};
	const LOOK_ATTRIBUTES = new Set(['class', 'style']);
	const isLookKey = name => LOOK_ATTRIBUTES.has(name.toLowerCase());
	const isListenerKey = name => {
		const lowercased = name.toLowerCase();
		return /^on[:A-Z]/.test(name) || lowercased.startsWith('on') && lowercased in HTMLElement.prototype;
	};
	const RESERVED_ATTRIBUTES = new Set(['id', 'role', 'tabindex']);
	const isReservedKey = name => RESERVED_ATTRIBUTES.has(name.toLowerCase());
	const WRITABLE_NAME = /^[:A-Z_a-z][\w.:-]*$/;
	const isWritableName = name => WRITABLE_NAME.test(name);
	const quotedNames = names => names.map(name => `"${name}"`).join(', ');
	const BTooltip = ui_vue3.defineComponent({
		name: 'BTooltip',
		inheritAttrs: false,
		props: {
			target: {
				type: Object,
				default: null
			},
			text: {
				type: String,
				default: ''
			},
			maxWidth: {
				type: Number,
				default: ui_system_tooltip.DEFAULT_MAX_WIDTH
			},
			position: {
				type: String,
				default: DEFAULT_POSITION
			},
			offset: {
				type: Number,
				default: DEFAULT_OFFSET
			},
			crossOffset: {
				type: Number,
				default: 0
			},
			trigger: {
				type: [String, Array],
				default: () => [...DEFAULT_TRIGGER]
			},
			showDelay: {
				type: Number,
				default: 0
			},
			hideDelay: {
				type: Number,
				default: 0
			}
		},
		emits: ['show', 'hide', 'destroy'],
		data() {
			return {
				contentNode: null,
				tooltip: null,
				appliedOptions: ui_vue3.markRaw({}),
				appliedAttributes: [],
				warnedAttributes: []
			};
		},
		computed: {
			liveOptions() {
				return {
					maxWidth: this.maxWidth,
					position: this.position,
					offset: this.offset,
					crossOffset: this.crossOffset,
					trigger: this.trigger,
					showDelay: this.showDelay,
					hideDelay: this.hideDelay
				};
			}
		},
		watch: {
			liveOptions: {
				deep: true,
				handler() {
					this.syncOptions();
				}
			},
			target(value) {
				this.syncTarget(value);
			}
		},
		created() {
			this.contentNode = ui_vue3.markRaw(document.createElement('div'));
		},
		mounted() {
			this.ensureTooltip();
		},
		updated() {
			if (this.syncBubble()) {
				this.tooltip?.adjustPosition();
			}
		},
		unmounted() {
			this.destroyTooltip();
		},
		methods: {
			ensureTooltip() {
				const target = this.target;
				const contentNode = this.contentNode;
				if (this.tooltip !== null || target === null || contentNode === null) {
					return;
				}
				this.tooltip = ui_vue3.markRaw(new ui_system_tooltip.Tooltip({
					...this.liveOptions,
					target,
					content: contentNode,
					events: {
						onShow: this.handleShow,
						onHide: this.handleHide,
						onDestroy: this.handleDestroy
					}
				}));
				this.appliedOptions = ui_vue3.markRaw(snapshotOptions(this.liveOptions));
				this.syncBubble();
			},
			destroyTooltip() {
				const tooltip = this.tooltip;
				this.tooltip = null;
				this.appliedOptions = ui_vue3.markRaw({});
				this.appliedAttributes = [];
				this.warnedAttributes = [];
				tooltip?.destroy();
			},
			syncOptions() {
				const tooltip = this.tooltip;
				if (tooltip === null) {
					return;
				}
				this.appliedOptions = ui_vue3.markRaw(applyOptions(tooltip, this.appliedOptions, this.liveOptions));
			},
			syncTarget(value) {
				if (value === null) {
					this.destroyTooltip();
					return;
				}
				if (this.tooltip === null) {
					this.ensureTooltip();
					return;
				}
				this.tooltip.setOptions({
					target: value
				});
			},
			syncBubble() {
				const bubble = this.tooltip?.getBubble() ?? null;
				if (!bubble) {
					return false;
				}
				return this.syncAttributes(bubble, this.$attrs);
			},
			syncAttributes(bubble, attributes) {
				const carried = Object.keys(attributes).filter(name => !isListenerKey(name));
				const names = carried.filter(name => {
					return !isLookKey(name) && !isReservedKey(name) && isWritableName(name);
				});
				let changed = false;
				this.warnLook(carried.filter(name => isLookKey(name)));
				this.warnReserved(carried.filter(name => isReservedKey(name)));
				this.warnUnwritable(carried.filter(name => !isReservedKey(name) && !isWritableName(name)));
				this.appliedAttributes.filter(name => !names.includes(name)).forEach(name => {
					changed = changed || bubble.hasAttribute(name);
					bubble.removeAttribute(name);
				});
				this.appliedAttributes = names;
				names.forEach(name => {
					const value = attributes[name];
					if (main_core.Type.isNil(value)) {
						changed = changed || bubble.hasAttribute(name);
						bubble.removeAttribute(name);
						return;
					}
					const written = String(value);
					changed = changed || bubble.getAttribute(name) !== written;
					main_core.Dom.attr(bubble, name, written);
				});
				return changed;
			},
			warnLook(names) {
				const unseen = this.takeUnwarned(names);
				if (unseen.length === 0) {
					return;
				}
				console.warn(`${WARNING_NAMESPACE}: ${quotedNames(unseen)} of <BTooltip> does not reach the bubble - the look ` + 'of the tooltip belongs to the extension.');
			},
			warnReserved(names) {
				const unseen = this.takeUnwarned(names);
				if (unseen.length === 0) {
					return;
				}
				console.warn(`${WARNING_NAMESPACE}: ${quotedNames(unseen)} of <BTooltip> does not reach the bubble - the ` + 'identifier it is announced by, its role and its place outside the tab order belong to the ' + 'tooltip.');
			},
			warnUnwritable(names) {
				const unseen = this.takeUnwarned(names);
				if (unseen.length === 0) {
					return;
				}
				console.warn(`${WARNING_NAMESPACE}: ${quotedNames(unseen)} of <BTooltip> is no attribute name the DOM takes ` + 'and does not reach the bubble - a name begins with a letter and carries no spaces.');
			},
			takeUnwarned(names) {
				const unseen = names.filter(name => !this.warnedAttributes.includes(name));
				this.warnedAttributes = [...this.warnedAttributes, ...unseen];
				return unseen;
			},
			handleShow() {
				this.syncBubble();
				this.$emit('show');
			},
			handleHide() {
				this.$emit('hide');
			},
			handleDestroy() {
				this.$emit('destroy');
			}
		},
		template: `
		<Teleport v-if="contentNode" :to="contentNode">
			<slot><span class="ui-system-tooltip__text">{{ text }}</span></slot>
		</Teleport>
	`
	});
	const directiveInstances = new WeakMap();
	const readDirectiveValue = value => {
		const options = buildDefaultOptions();
		if (main_core.Type.isString(value)) {
			return {
				...options,
				content: value
			};
		}
		if (!main_core.Type.isPlainObject(value)) {
			return options;
		}
		const given = value;
		Object.keys(options).forEach(name => {
			const field = given[name];
			if (!main_core.Type.isUndefined(field)) {
				options[name] = field;
			}
		});
		return options;
	};
	const destroyDirectiveTooltip = element => {
		const state = directiveInstances.get(element);
		if (state === undefined) {
			return;
		}
		directiveInstances.delete(element);
		state.tooltip.destroy();
	};
	const createDirectiveTooltip = (element, options) => {
		if (options.content === '') {
			return;
		}
		directiveInstances.set(element, {
			tooltip: new ui_system_tooltip.Tooltip({
				...options,
				target: element
			}),
			applied: snapshotOptions(options)
		});
	};
	const vBTooltip = {
		mounted(element, {
			value
		}) {
			createDirectiveTooltip(element, readDirectiveValue(value));
		},
		updated(element, {
			value
		}) {
			const options = readDirectiveValue(value);
			const state = directiveInstances.get(element);
			if (options.content === '') {
				destroyDirectiveTooltip(element);
				return;
			}
			if (state === undefined) {
				createDirectiveTooltip(element, options);
				return;
			}
			state.applied = applyOptions(state.tooltip, state.applied, options);
		},
		unmounted(element) {
			destroyDirectiveTooltip(element);
		}
	};

	exports.BTooltip = BTooltip;
	exports.vBTooltip = vBTooltip;

})(this.BX.UI.System.Tooltip.Vue = this.BX.UI.System.Tooltip.Vue || {}, BX.Vue3, BX, BX.UI.System.Tooltip);
//# sourceMappingURL=vue.bundle.js.map
