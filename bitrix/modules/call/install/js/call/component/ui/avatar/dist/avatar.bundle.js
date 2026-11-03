/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3) {
	'use strict';

	const CallAvatarColors = new Set(['#0154C8', '#1BCE7B', '#B15EF5', '#55D0E0', '#F85E9E', '#0075FF', '#00A94E']);

	const CallAvatar = ui_vue3.defineComponent({
		name: 'CallAvatar',
		props: {
			testId: {
				type: String,
				default: null,
				required: true
			},
			testState: {
				type: String,
				default: null
			},
			testMeta: {
				type: String,
				default: null
			},
			label: {
				type: String,
				default: null
			},
			image: {
				type: String,
				default: null
			},
			size: {
				type: [Number, null],
				default: null
			},
			corner: {
				type: Boolean,
				default: false
			},
			caller: {
				type: Boolean,
				default: false
			},
			speaker: {
				type: Boolean,
				default: false
			},
			color: {
				type: String,
				default: null
			}
		},
		data() {
			return {
				imageError: false
			};
		},
		computed: {
			hashColor() {
				if (this.color) {
					return this.color;
				}
				const colors = [...CallAvatarColors];
				if (this.label) {
					let hash = 0;
					for (let i = 0; i < this.label.length; i++) {
						hash = (hash << 5) - hash + (this.label.codePointAt(i) ?? 0);
						hash &= hash;
					}
					const index = Math.abs(hash) % colors.length;
					return colors[index];
				}
				const index = Math.floor(Math.random() * colors.length);
				return colors[index];
			},
			abbreviation() {
				if (!this.label) {
					return '';
				}
				if (this.label.length === 1 || this.label.length === 2) {
					return this.label;
				}
				const words = this.label.trim().split(/\s+/);
				if (words.length >= 2) {
					return (words[0][0] + words[1][0]).toUpperCase();
				}
				return this.label.slice(0, 2).toUpperCase();
			},
			pulseElements() {
				return this.speaker ? 3 : 2;
			},
			encodedImage() {
				if (!this.image || this.imageError) {
					return null;
				}
				return decodeURI(this.image) === this.image ? encodeURI(this.image) : this.image;
			},
			additionalClasses() {
				const classes = [];
				if (this.corner || this.$slots.corner) {
					classes.push('--corner');
				}
				if (this.speaker) {
					classes.push('--speaker');
				}
				if (this.caller) {
					classes.push('--caller');
				}
				return classes;
			},
			cssVariables() {
				const variables = {
					'--call-avatar-color': this.hashColor
				};
				if (this.size) {
					variables['--call-avatar-size'] = `${this.size}px`;
				}
				return variables;
			},
			computedTestState() {
				const tokens = this.testState ? this.testState.split(/\s+/).filter(Boolean) : [];
				if (this.speaker && !tokens.includes('speaker')) {
					tokens.push('speaker');
				}
				if (this.caller && !tokens.includes('caller')) {
					tokens.push('caller');
				}
				return tokens.length > 0 ? tokens.join(' ') : null;
			}
		},
		watch: {
			image() {
				this.imageError = false;
			}
		},
		methods: {
			handleImageError() {
				this.imageError = true;
			}
		},
		template: `
		<div :data-testid="testId" :data-test-state="computedTestState" :data-test-meta="testMeta" class="call-avatar" :class="additionalClasses" :style="cssVariables">
			<div v-if="$slots.corner" class="call-avatar-corner">
				<slot name="corner"></slot>
			</div>
			<div class="call-avatar__body">
				<img v-if="encodedImage" :src="encodedImage" alt="" draggable="false" class="call-avatar__image" @error="handleImageError">
				<span v-else class="call-avatar__label">{{ abbreviation }}</span>
			</div>
			<div v-if="caller || speaker" class="call-avatar-pulse" :style="{ '--call-avatar-pulse-elements': pulseElements }">
				<div v-for="i in pulseElements" :key="i" :style="{ '--call-avatar-pulse-i' : i }"></div>
			</div>
		</div>
	`
	});

	exports.CallAvatar = CallAvatar;

})(this.BX.Call.Component.Ui = this.BX.Call.Component.Ui || {}, BX.Vue3);
//# sourceMappingURL=avatar.bundle.js.map
