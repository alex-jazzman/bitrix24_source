import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { BInput, InputSize, InputDesign } from 'ui.system.input.vue';
import { type JsonObject } from 'main.core';

import './css/quick-reply-search.css';

// @vue/component
export const QuickReplySearch = {
	name: 'QuickReplySearch',
	components: { BIcon, BInput },
	props: {
		manageUrl: {
			type: String,
			default: '',
		},
		permissions: {
			type: Object,
			default: () => ({
				canView: false,
				canCreate: false,
			}),
		},
	},
	emits: ['queryChange', 'add'],
	data(): JsonObject
	{
		return {
			query: '',
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		InputSize: () => InputSize,
		InputDesign: () => InputDesign,
		hasQuery(): boolean
		{
			return this.query !== '';
		},
	},
	watch: {
		query(value: string): void
		{
			this.$emit('queryChange', value);
		},
	},
	methods: {
		clearQuery(): void
		{
			this.query = '';
		},
		openManagePage(): void
		{
			window.open(this.manageUrl, '_blank', 'noopener');
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-imol-quick-reply-popup__search-row">
			<div class="bx-imol-quick-reply-popup__search">
				<BInput
					v-model="query"
					:design="InputDesign.LightGrey"
					:size="InputSize.Md"
					:placeholder="loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_POPUP_SEARCH_PLACEHOLDER')"
					:withClear="hasQuery"
					@clear="clearQuery"
				/>
			</div>
			<div class="bx-imol-quick-reply-popup__search-actions">
				<div
					v-if="permissions.canCreate"
					class="bx-imol-quick-reply-popup__action-button"
					@click="$emit('add')"
				>
					<BIcon :name="OutlineIcons.PLUS_M" />
				</div>
				<BIcon
					v-if="manageUrl"
					:name="OutlineIcons.SETTINGS"
					class="--hoverable"
					@click="openManagePage"
				/>
			</div>
		</div>
	`,
};
