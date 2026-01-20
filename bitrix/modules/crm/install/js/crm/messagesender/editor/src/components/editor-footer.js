import { type AjaxResponse } from 'main.core';
import { Dialog, type ItemOptions } from 'ui.entity-selector';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Text } from 'ui.system.typography.vue';
import { AirButtonStyle, Button } from 'ui.vue3.components.button';
import { mapGetters, mapState } from 'ui.vue3.vuex';
// eslint-disable-next-line no-unused-vars
import { type Channel, type From } from '../editor';

const ENTITY_ID = 'crm-from';

// @vue/component
export const EditorFooter = {
	name: 'EditorFooter',
	components: {
		BButton: Button,
		BIcon,
		BText: Text,
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			Outline,
		};
	},
	dialog: null,
	computed: {
		...mapGetters({
			/** @type Channel */
			channel: 'channels/current',
			/** @type From */
			from: 'channels/from',
			receiver: 'channels/receiver',
			/** @type boolean */
			isReadyToSend: 'message/isReadyToSend',
			isProgress: 'application/isProgress',
		}),
		...mapState({
			/** @type boolean */
			isSending: (state) => state.application.progress.isSending,
			/** @type Layout */
			layout: (state) => state.application.layout,
		}),
		fromText(): string
		{
			return this.$Bitrix.Loc.getMessage(
				'CRM_MESSAGESENDER_EDITOR_FROM',
				{
					'#FROM#': this.from.name || '',
				},
			);
		},
		isSelectable(): boolean
		{
			return this.fromList.length > 1;
		},
		fromList(): From[]
		{
			return this.channel?.fromList ?? [];
		},
		dialogItems(): ItemOptions[]
		{
			return this.fromList.map((from: From) => {
				return {
					id: from.id,
					entityId: ENTITY_ID,
					title: from.name,
					subtitle: from.description,
					selected: from.id === this.from.id,
					tabs: ['recents'],
				};
			});
		},
	},
	methods: {
		toggleDialog(): void
		{
			if (!this.isSelectable)
			{
				return;
			}

			if (this.dialog)
			{
				this.dialog.hide();
				this.dialog = null;

				return;
			}

			this.dialog = new Dialog({
				targetNode: this.$refs.from,
				entities: [
					{
						id: ENTITY_ID,
						searchable: true,
					},
				],
				items: this.dialogItems,
				width: 400,
				height: 300,
				enableSearch: true,
				hideOnSelect: true,
				autoHide: true,
				dropdownMode: true,
				showAvatars: false,
				multiple: false,
				cacheable: false,
				events: {
					'Item:onSelect': (event) => {
						this.$store.dispatch('channels/setFrom', { fromId: event.getData().item.id });
					},
					onDestroy: () => {
						this.dialog = null;
					},
				},
			});

			this.dialog.show();
		},
		send(): void
		{
			if (this.isProgress)
			{
				return;
			}

			this.$Bitrix.Data.get('locator').getSendService().sendMessage()
				.catch((response: AjaxResponse | any) => {
					this.$Bitrix.Data.get('locator').getAlertService().showError(response?.errors?.[0]?.message);
				})
			;
		},
		cancel(): void
		{
			if (this.isProgress)
			{
				return;
			}

			this.$Bitrix.Data.get('locator').getAnalyticsService().onCancel();
			this.$Bitrix.Data.get('locator').getMessageModel().clearState();
			this.$store.dispatch('application/resetAlert');
			this.$Bitrix.eventEmitter.emit('crm:messagesender:editor:onCancel');
		},
	},
	template: `
		<div class="crm-messagesender-editor__footer">
			<div class="crm-messagesender-editor__footer__buttons">
				<BButton
					v-if="layout.isSendButtonShown"
					:text="$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_BUTTON_SEND')"
					@click="send"
					:disabled="!isReadyToSend || (isProgress && !isSending)" 
					:loading="isSending"
				/>
				<BButton
					v-if="layout.isCancelButtonShown"
					:text="$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_BUTTON_CANCEL')"
					@click="cancel"
					:style="AirButtonStyle.PLAIN"
					:disabled="isProgress"
				/>
			</div>
			<div v-if="from" ref="from" class="crm-messagesender-editor__footer__from" data-test-role="from-selector" @click="toggleDialog" :style="{
				cursor: isSelectable ? 'pointer' : 'default',
			}">
				<BText 
					tag="div"
					size="xs"
					align="right"
					className="crm-messagesender-editor__footer__from__text"
				>{{ fromText }}</BText>
				<BIcon v-if="isSelectable" :name="Outline.CHEVRON_DOWN_S"/>
			</div>
		</div>
	`,
};
