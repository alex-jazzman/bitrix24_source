// @flow

import { mapGetters, mapMutations } from 'ui.vue3.vuex';
import { Event } from 'main.core';
import { FocusNavigator } from 'ui.a11y';

export const SmsProviderSelect = {

	data(): Object
	{
		return {
			isListShowed: false,
		};
	},

	mounted() {
		Event.bind(document, 'click', this.onDocumentClick);
	},

	beforeUnmount() {
		Event.unbind(document, 'click', this.onDocumentClick);
	},

	methods: {
		onDocumentClick() {
			this.isListShowed = false;
		},

		handleFocusOut(event)
		{
			if (!this.isListShowed)
			{
				return;
			}

			const next = event.relatedTarget;
			if (next && this.$refs.root.contains(next))
			{
				return;
			}

			// Focus left the component (e.g. via Tab) — close without pulling focus back to
			// the trigger, otherwise Tab would loop into the selector instead of moving on.
			this.isListShowed = false;
		},

		...mapGetters([
			'getServiceLink',
			'getActiveSmsServices',
		]),

		...mapMutations([
			'selectSMSService',
		]),

		switchService(serviceId)
		{
			this.selectSMSService(serviceId);
			this.closeList();
		},

		switchVisibility() {
			this.isListShowed = !this.isListShowed;
		},

		closeList()
		{
			this.isListShowed = false;
			const trigger = this.$refs.trigger;
			this.$nextTick(() => {
				FocusNavigator.focusTarget(trigger);
			});
		},

		handleTriggerKeydown(event)
		{
			if (event.key === 'Escape')
			{
				if (this.isListShowed)
				{
					event.preventDefault();
					this.closeList();
				}

				return;
			}

			const isOpenKey = event.key === 'ArrowDown'
				|| event.key === 'ArrowUp'
				|| event.key === 'Enter'
				|| event.key === ' ';

			if (!isOpenKey)
			{
				return;
			}

			event.preventDefault();
			this.isListShowed = true;
			this.$nextTick(() => {
				FocusNavigator.focusFirst(this.$refs.list);
			});
		},

		handleListKeydown(event)
		{
			if (event.key === 'Escape')
			{
				event.preventDefault();
				this.closeList();

				return;
			}

			if (event.key === 'ArrowDown')
			{
				event.preventDefault();
				FocusNavigator.focusNext(this.$refs.list, { from: event.target, wrap: true });

				return;
			}

			if (event.key === 'ArrowUp')
			{
				event.preventDefault();
				FocusNavigator.focusPrevious(this.$refs.list, { from: event.target, wrap: true });
			}
		},

		openSmsServicesSlider() {
			this.isListShowed = false;

			const options = {
				cacheable: false,
				allowChangeHistory: false,
				requestMethod: 'get',
				width: 700,
				events: {
					onClose: () => {
						this.$emit('onConnectSliderClosed');
					},
				},
			};

			BX.SidePanel.Instance.open(this.getServiceLink(), options);
		},
	},

	computed: {
		...mapGetters([
			'getSelectedService',
		]),

		getListClassname(): string
		{
			if (!this.isListShowed)
			{
				return 'sms-provider-selector-hided-list';
			}

			return 'sms-provider-selector-list';
		},
	},

	// language=Vue
	template: `
		<div ref="root" style="display: inline-block; vertical-align: top; position: relative;" @focusout="handleFocusOut">
			<button
				type="button"
				ref="trigger"
				data-testid="terminal-sms-provider-trigger"
				class="sms-provider-selector"
				aria-haspopup="true"
				v-bind:aria-expanded="isListShowed ? 'true' : 'false'"
				@click.stop="switchVisibility"
				@keydown="handleTriggerKeydown"
			>{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_CHANGE_MSGVER_1') }}</button>
			<ul ref="list" :class="getListClassname" @click.stop @keydown="handleListKeydown">
				<li v-for="provider in getActiveSmsServices()" :key="provider['ID']" v-show="provider['ID'] !== getSelectedService['ID']">
					<button type="button" :data-testid="'terminal-sms-provider-item-' + provider['ID']" class="sms-provider-selector-item" @click="switchService(provider['ID'])">{{ provider['NAME'] }}</button>
				</li>
				<li>
					<button type="button" data-testid="terminal-sms-provider-connect-more" class="sms-provider-selector-item" @click="openSmsServicesSlider">{{ $Bitrix.Loc.getMessage('CRM_CFG_TERMINAL_SETTINGS_SECTION_SMS_SERVICE_PROVIDER_CONNECT_MORE') }}</button>
				</li>
			</ul>
		</div>
	`,
};
