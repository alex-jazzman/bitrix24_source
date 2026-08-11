import { Loc } from 'main.core';
import { useCallStore } from 'call.store';

const BUTTON_ORDER = [
	'microphone',
	'camera',
];

// @vue/component
export const Toolbar = {
	name: 'call-toolbar',
	inject: {
		callActionBridge: {
			default: () => ({ emit: () => {} }),
		},
	},
	setup()
	{
		const callStore = useCallStore();

		return { callStore };
	},
	computed: {
		visibleButtons()
		{
			return BUTTON_ORDER
				.filter((name) =>
				{
					const btn = this.callStore.buttons[name];

					return btn && btn.visible !== false;
				})
				.map((name) => ({
					name,
					...this.callStore.buttons[name],
				}));
		},
		hangupButton()
		{
			return this.callStore.buttons?.hangup ?? null;
		},
		hangupText()
		{
			return 'hangup';
		},
	},
	methods: {
		onButtonClick(buttonName)
		{
			this.callActionBridge.emit('onButtonClick', { buttonName });
		},
	},
	template: /* HTML */`
		<div class="call-toolbar">
			<button
				v-for="btn in visibleButtons"
				:key="btn.name"
				class="call-toolbar_button"
				:class="{ '--active': btn.active, '--blocked': btn.blocked }"
				:data-button-id="btn.name"
				data-element-type="root"
				:disabled="btn.blocked"
				@click="onButtonClick(btn.name)"
			>
				<span :data-button-id="btn.name" data-element-type="icon">{{ btn.name }}</span>
			</button>
			<button
				class="call-toolbar_button --danger"
				:class="{ '--blocked': hangupButton?.blocked }"
				data-button-id="hangup"
				data-element-type="root"
				:disabled="hangupButton?.blocked"
				@click="onButtonClick('hangup')"
			>{{ hangupText }}</button>
		</div>
	`,
};
