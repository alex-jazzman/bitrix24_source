import { Text } from 'main.core';

import { Popup } from 'ui.vue3.components.popup';
import 'ui.forms';
import 'ui.icon-set.outline';

import { CheckListBbCode } from 'tasks.v2.lib.check-list-bb-code';

function isLinkUrlSafe(url: string): boolean
{
	return CheckListBbCode.buildLinkSource(url.trim(), '') !== '';
}

// @vue/component
export const CheckListLinkPopup = {
	name: 'CheckListLinkPopup',
	components: {
		Popup,
	},
	props: {
		bindElement: {
			type: HTMLElement,
			required: true,
		},
		popupId: {
			type: String,
			default: () => `tasks-check-list-link-popup-${Text.getRandom()}`,
		},
	},
	emits: ['apply', 'close'],
	data(): Object
	{
		return {
			url: '',
			labelId: `tasks-check-list-link-label-${Text.getRandom()}`,
		};
	},
	computed: {
		canApply(): boolean
		{
			return isLinkUrlSafe(this.url);
		},
		popupOptions(): Object
		{
			return {
				bindElement: this.bindElement,
				autoHide: true,
				closeByEsc: true,
				focusTrap: true,
				ariaLabel: this.loc('TASKS_V2_CHECK_LIST_LINK_POPUP_LABEL'),
				cacheable: false,
				animation: 'fading',
				targetContainer: document.body,
				offsetTop: 6,
				padding: 0,
			};
		},
	},
	mounted(): void
	{
		void this.$nextTick(() => {
			this.$refs.input?.focus();
		});
	},
	methods: {
		handleApply(): void
		{
			const url = this.url.trim();

			if (!isLinkUrlSafe(url))
			{
				this.$refs?.input?.focus();

				return;
			}

			this.$emit('apply', url);
		},
	},
	template: `
		<Popup
			:id="popupId"
			:options="popupOptions"
			@close="$emit('close')"
		>
			<div
				class="tasks-check-list-link-popup ui-text-editor-link-editor"
				data-testid="tasks-check-list-link-popup"
			>
				<div class="ui-text-editor-link-form">
					<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-link-textbox">
						<div class="ui-ctl-tag" :id="labelId">
							{{ loc('TASKS_V2_CHECK_LIST_ITEM_FORMAT_LINK_URL_LABEL') }}
						</div>
						<input
							ref="input"
							v-model="url"
							type="text"
							class="ui-ctl-element"
							placeholder="https://"
							:aria-labelledby="labelId"
							data-testid="link-textbox-input"
							@keydown.enter.prevent="handleApply"
						>
					</div>
					<button
						type="button"
						class="ui-text-editor-link-form-button"
						data-testid="save-link-btn"
						:aria-label="loc('TASKS_V2_CHECK_LIST_LINK_SAVE_LABEL')"
						:disabled="!canApply"
						@click="handleApply"
					>
						<span class="ui-icon-set --check-l" aria-hidden="true"></span>
					</button>
					<button
						type="button"
						class="ui-text-editor-link-form-button"
						data-testid="cancel-link-btn"
						:aria-label="loc('TASKS_V2_CHECK_LIST_LINK_CANCEL_LABEL')"
						@click="$emit('close')"
					>
						<span class="ui-icon-set --cross-l" aria-hidden="true"></span>
					</button>
				</div>
			</div>
		</Popup>
	`,
};
