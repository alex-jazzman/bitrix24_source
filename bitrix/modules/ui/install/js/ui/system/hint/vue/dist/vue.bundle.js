/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
this.BX.UI.System.Hint = this.BX.UI.System.Hint || {};
(function (exports, main_core, ui_vue3, ui_system_hint) {
	'use strict';

	const BUBBLE_OPTIONS = Object.freeze(['maxWidth', 'position', 'trigger', 'showDelay', 'hideDelay']);
	const isSameOptions = (left, right) => {
		const names = Object.keys(left);
		return names.length === Object.keys(right).length && names.every(name => Object.is(left[name], right[name]));
	};
	const BHint = ui_vue3.defineComponent({
		name: 'BHint',
		props: {
			size: {
				type: String,
				default: ui_system_hint.DEFAULT_SIZE
			},
			filled: {
				type: Boolean,
				default: false
			},
			tooltipOptions: {
				type: Object,
				default: null
			},
			ariaLabel: {
				type: String,
				default: ''
			}
		},
		emits: ['click', 'show', 'hide'],
		data() {
			return {
				contentNode: null,
				hint: null,
				appliedOptions: ui_vue3.markRaw({})
			};
		},
		computed: {
			liveOptions() {
				const bubble = this.tooltipOptions;
				const options = {
					size: this.size,
					filled: this.filled,
					ariaLabel: this.ariaLabel,
					bubble: bubble !== null
				};
				BUBBLE_OPTIONS.forEach(name => {
					options[name] = bubble?.[name];
				});
				return options;
			}
		},
		watch: {
			liveOptions() {
				this.syncHint();
			}
		},
		created() {
			this.contentNode = ui_vue3.markRaw(document.createElement('div'));
		},
		mounted() {
			this.createHint();
		},
		unmounted() {
			this.destroyHint();
		},
		methods: {
			createHint() {
				const host = this.$refs.host;
				const contentNode = this.contentNode;
				if (this.hint !== null || !host || contentNode === null) {
					return;
				}
				const bubble = this.tooltipOptions;
				const options = {
					size: this.size,
					filled: this.filled,
					ariaLabel: this.ariaLabel,
					tooltipOptions: bubble === null ? null : {
						...bubble,
						content: contentNode
					},
					onClick: bubble === null ? this.handleClick : undefined,
					events: {
						onShow: this.handleShow,
						onHide: this.handleHide
					}
				};
				this.hint = ui_vue3.markRaw(new ui_system_hint.Hint(options));
				this.appliedOptions = ui_vue3.markRaw({
					...this.liveOptions
				});
				main_core.Dom.append(this.hint.render(), host);
			},
			destroyHint() {
				const hint = this.hint;
				this.hint = null;
				this.appliedOptions = ui_vue3.markRaw({});
				hint?.destroy();
			},
			syncHint() {
				if (this.hint === null || isSameOptions(this.liveOptions, this.appliedOptions)) {
					return;
				}
				const focused = document.activeElement === this.hint.getContainer();
				this.destroyHint();
				this.createHint();
				if (focused) {
					this.hint?.getContainer().focus();
				}
			},
			handleClick() {
				this.$emit('click');
			},
			handleShow() {
				this.$emit('show');
			},
			handleHide() {
				this.$emit('hide');
			}
		},
		template: `
		<span ref="host">
			<Teleport v-if="contentNode" :to="contentNode">
				<slot/>
			</Teleport>
		</span>
	`
	});

	exports.BHint = BHint;

})(this.BX.UI.System.Hint.Vue = this.BX.UI.System.Hint.Vue || {}, BX, BX.Vue3, BX.UI.System.Hint);
//# sourceMappingURL=vue.bundle.js.map
