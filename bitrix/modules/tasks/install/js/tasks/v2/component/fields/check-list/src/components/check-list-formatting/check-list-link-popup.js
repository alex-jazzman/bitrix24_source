import { Popup } from 'ui.vue3.components.popup';
import 'ui.forms';
import 'ui.icon-set.outline';

import { CheckListBbCode } from '../../lib/bb-code/check-list-bb-code';

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
	},
	emits: ['apply', 'close'],
	data(): Object
	{
		return {
			url: '',
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
			:options="popupOptions"
			@close="$emit('close')"
		>
			<div
				class="tasks-check-list-link-popup ui-text-editor-link-editor"
				data-testid="tasks-check-list-link-popup"
			>
				<div class="ui-text-editor-link-form">
					<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-link-textbox">
						<div class="ui-ctl-tag">
							{{ loc('TASKS_V2_CHECK_LIST_ITEM_FORMAT_LINK_URL_LABEL') }}
						</div>
						<input
							ref="input"
							v-model="url"
							type="text"
							class="ui-ctl-element"
							placeholder="https://"
							data-testid="link-textbox-input"
							@keydown.enter.prevent="handleApply"
						>
					</div>
					<button
						type="button"
						class="ui-text-editor-link-form-button"
						data-testid="save-link-btn"
						:disabled="!canApply"
						@click="handleApply"
					>
						<span class="ui-icon-set --check-l"></span>
					</button>
					<button
						type="button"
						class="ui-text-editor-link-form-button"
						data-testid="cancel-link-btn"
						@click="$emit('close')"
					>
						<span class="ui-icon-set --cross-l"></span>
					</button>
				</div>
			</div>
		</Popup>
	`,
};
