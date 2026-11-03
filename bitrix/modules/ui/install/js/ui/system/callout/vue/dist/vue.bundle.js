/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
this.BX.UI.System.Callout = this.BX.UI.System.Callout || {};
(function (exports, main_core, ui_vue3, ui_system_callout, ui_system_popover, ui_system_popover_vue) {
	'use strict';

	const REGION_SELECTOR = {
		description: '.ui-system-callout__description',
		leftSlot: '.ui-system-callout__left',
		footer: '.ui-system-callout__footer',
		footerLeft: '.ui-system-callout__footer-left'
	};
	const REGIONS = Object.keys(REGION_SELECTOR);
	const OWNED_CLASS = 'ui-system-callout__owned';
	const REGION_MUTATIONS = {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['href', 'tabindex', 'contenteditable', 'controls', 'disabled', 'hidden', 'inert', 'type', 'style']
	};
	const PROTECTED_ATTRIBUTES = ['id', 'role', 'tabindex', 'contenteditable', /^aria-/, ui_system_popover.BUBBLE_ATTRIBUTE];
	const PROTECTED_STYLE_PROPS = [/^margin(-|$)/, 'width', 'max-width'];
	const PROTECTED_CLASSES = [/^ui-system-callout/, /^--/];
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
	const changedOptions = (next, applied) => {
		const partial = {};
		Object.keys(next).forEach(key => {
			if (!isSameValue(next[key], applied[key])) {
				partial[key] = next[key];
			}
		});
		return partial;
	};
	const sameRegions = (left, right) => {
		return left.length === right.length && left.every((region, index) => region === right[index]);
	};
	const readRegions = card => {
		const regions = {};
		REGIONS.forEach(region => {
			regions[region] = card === null ? null : card.querySelector(REGION_SELECTOR[region]);
		});
		return regions;
	};
	const BCallout = ui_vue3.defineComponent({
		name: 'BCallout',
		inheritAttrs: false,
		expose: ['refreshAccessibilityMode'],
		props: {
			title: {
				type: String,
				default: undefined
			},
			description: {
				type: [String, Object, Function],
				default: undefined
			},
			leftSlot: {
				type: [Object, Function],
				default: undefined
			},
			footer: {
				type: [Object, Function],
				default: undefined
			},
			footerLeft: {
				type: [Object, Function],
				default: undefined
			},
			buttons: {
				type: Array,
				default: undefined
			},
			showClose: {
				type: Boolean,
				default: undefined
			},
			width: {
				type: Number,
				default: undefined
			},
			target: {
				type: [Object, String],
				default: null
			},
			positioning: {
				type: Object,
				default: undefined
			},
			designContext: {
				type: String,
				default: undefined
			},
			closeByClickOutside: {
				type: Boolean,
				default: undefined
			},
			closeByEsc: {
				type: Boolean,
				default: undefined
			},
			ariaLabel: {
				type: String,
				default: undefined
			},
			mode: {
				type: String,
				default: undefined
			},
			container: {
				type: Object,
				default: null
			},
			autoFocus: {
				type: Boolean,
				default: false
			}
		},
		emits: ['show', 'hide', 'close', 'destroy'],
		data() {
			return {
				callout: null,
				card: null,
				regions: ui_vue3.markRaw({
					description: null,
					leftSlot: null,
					footer: null,
					footerLeft: null
				}),
				attrsSync: null,
				observer: null,
				applied: null,
				appliedRegions: [],
				regionsMutated: false,
				commitScheduled: false,
				commitGeneration: 0,
				live: false
			};
		},
		computed: {
			propsSnapshot() {
				return this.readProps();
			}
		},
		watch: {
			propsSnapshot: {
				flush: 'post',
				handler() {
					this.scheduleCommit();
				}
			}
		},
		created() {
			const initial = this.readProps();
			const callout = ui_vue3.markRaw(new ui_system_callout.Callout({
				...initial,
				target: undefined,
				container: this.container ?? undefined,
				autoFocus: this.autoFocus,
				events: {
					onShow: event => {
						this.$emit('show', event);
					},
					onHide: event => {
						this.$emit('hide', event);
					},
					onClose: event => {
						this.$emit('close', event);
					},
					onDestroy: event => {
						this.$emit('destroy', event);
					}
				}
			}));
			const card = callout.getCard();
			this.callout = callout;
			this.card = card === null ? null : ui_vue3.markRaw(card);
			this.regions = ui_vue3.markRaw(readRegions(card));
			this.applied = ui_vue3.markRaw({
				...initial,
				target: null
			});
			this.attrsSync = ui_vue3.markRaw(ui_system_popover_vue.useAttrsSync({
				getNode: () => this.card,
				protectedAttributes: PROTECTED_ATTRIBUTES,
				protectedStyleProps: PROTECTED_STYLE_PROPS,
				protectedClasses: PROTECTED_CLASSES
			}));
			this.observer = ui_vue3.markRaw(new MutationObserver(() => {
				this.regionsMutated = true;
				this.scheduleCommit();
			}));
		},
		mounted() {
			this.live = true;
			this.attrsSync?.sync(this.$attrs);
			this.runCommit();
		},
		updated() {
			const changed = this.attrsSync?.sync(this.$attrs) ?? false;
			if (changed) {
				this.callout?.adjustPosition();
			}
			this.scheduleCommit();
		},
		beforeUnmount() {
			this.live = false;
			this.commitGeneration += 1;
			this.observer?.disconnect();
			this.observer = null;
			this.callout?.hide();
		},
		unmounted() {
			this.attrsSync?.clear();
			this.callout?.destroy();
		},
		methods: {
			refreshAccessibilityMode() {
				if (!this.live) {
					return;
				}
				this.regionsMutated = true;
				this.runCommit();
			},
			readProps() {
				return snapshotValue({
					title: this.title,
					description: this.description,
					leftSlot: this.leftSlot,
					footer: this.footer,
					footerLeft: this.footerLeft,
					buttons: this.buttons,
					showClose: this.showClose,
					width: this.width,
					positioning: this.positioning,
					designContext: this.designContext,
					closeByClickOutside: this.closeByClickOutside,
					closeByEsc: this.closeByEsc,
					ariaLabel: this.ariaLabel,
					mode: this.mode,
					target: this.target ?? null
				});
			},
			slotRegions() {
				return REGIONS.filter(region => this.hasSlotContent(region));
			},
			readOptions(slotted) {
				const options = {
					...this.propsSnapshot
				};
				slotted.forEach(region => {
					options[region] = undefined;
				});
				return options;
			},
			hasSlotContent(region) {
				const node = this.regions[region];
				if (node === null) {
					return false;
				}
				return [...node.childNodes].some(child => {
					if (main_core.Type.isElementNode(child)) {
						return !main_core.Dom.hasClass(child, OWNED_CLASS);
					}
					return main_core.Type.isTextNode(child) && (child.textContent ?? '').trim() !== '';
				});
			},
			scheduleCommit() {
				if (this.commitScheduled) {
					return;
				}
				this.commitScheduled = true;
				const generation = this.commitGeneration;
				void this.$nextTick(() => {
					this.commitScheduled = false;
					if (generation === this.commitGeneration) {
						this.runCommit();
					}
				});
			},
			runCommit() {
				const callout = this.callout;
				const applied = this.applied;
				if (callout === null || applied === null) {
					return;
				}
				const mutated = this.regionsMutated;
				this.regionsMutated = false;
				const slotted = this.slotRegions();
				const options = this.readOptions(slotted);
				const partial = changedOptions(options, applied);
				const shows = Object.hasOwn(partial, 'target') && options.target !== null;
				this.applied = ui_vue3.markRaw(options);
				if (!mutated && Object.keys(partial).length === 0 && sameRegions(slotted, this.appliedRegions)) {
					return;
				}
				this.appliedRegions = slotted;
				if (Object.hasOwn(partial, 'target')) {
					partial.target = this.target ?? null;
				}
				this.observer?.disconnect();
				try {
					callout.applyOptions(partial);
					if (shows) {
						callout.show();
					}
				} finally {
					this.observeRegions();
				}
			},
			observeRegions() {
				const observer = this.observer;
				if (observer === null) {
					return;
				}
				REGIONS.forEach(region => {
					const node = this.regions[region];
					if (node !== null) {
						observer.observe(node, REGION_MUTATIONS);
					}
				});
			}
		},
		template: `
		<Teleport v-if="regions.description" :to="regions.description">
			<slot name="description"/>
		</Teleport>
		<Teleport v-if="regions.leftSlot" :to="regions.leftSlot">
			<slot name="leftSlot"/>
		</Teleport>
		<Teleport v-if="regions.footer" :to="regions.footer">
			<slot name="footer"/>
		</Teleport>
		<Teleport v-if="regions.footerLeft" :to="regions.footerLeft">
			<slot name="footerLeft"/>
		</Teleport>
	`
	});

	exports.BCallout = BCallout;

})(this.BX.UI.System.Callout.Vue = this.BX.UI.System.Callout.Vue || {}, BX, BX.Vue3, BX.UI.System.Callout, BX.UI.System.Popover, BX.UI.System.Popover.Vue);
//# sourceMappingURL=vue.bundle.js.map
