import { defineComponent } from 'ui.vue3';
import { Type } from 'main.core';

export const Search = defineComponent({
	name: 'Search',

	props: {
		searchArea: {
			type: [HTMLElement, null],
			required: true,
		},
	},

	data(): { searchText: string, highlightTimeoutId: null | number }
	{
		return {
			searchText: '',
			highlightTimeoutId: null,
		};
	},

	computed: {
		hasSearchText(): boolean
		{
			return this.searchText.length > 0;
		},
	},

	methods:
	{
		clearSearch(): void
		{
			this.searchText = '';
			this.cancelHighlightUpdate();
			this.removeHighlight();

			const input = this.$refs.searchInput as HTMLInputElement | undefined;
			input?.focus();
		},
		cancelHighlightUpdate(): void
		{
			if (this.highlightTimeoutId === null)
			{
				return;
			}

			window.clearTimeout(this.highlightTimeoutId);
			this.highlightTimeoutId = null;
		},
		scheduleHighlightUpdate(): void
		{
			this.cancelHighlightUpdate();

			this.highlightTimeoutId = window.setTimeout(() => {
				this.removeHighlight();
				this.highlightSearchText();
				this.highlightTimeoutId = null;
			}, 250);
		},
		highlightSearchText(): void
		{
			const searchText = this.searchText.trim();
			const searchArea = this.$props.searchArea;

			if (searchText === '' || Type.isNull(searchArea))
			{
				return;
			}

			const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

			const innerHTML = searchArea.innerHTML;
			const regex = new RegExp(`(${escapedText})`, 'gi');

			searchArea.innerHTML = innerHTML.replace(regex, '<mark>$1</mark>');
		},
		removeHighlight(): void
		{
			const searchArea = this.$props.searchArea;

			if (Type.isNull(searchArea))
			{
				return;
			}

			const innerHTML = searchArea.innerHTML;

			searchArea.innerHTML = innerHTML.replaceAll(/<\/*mark>/gm, '');
		},
	},

	watch: {
		searchText(): void
		{
			if (this.searchText.trim() === '')
			{
				this.cancelHighlightUpdate();
				this.removeHighlight();

				return;
			}

			this.scheduleHighlightUpdate();
		},
	},

	beforeUnmount(): void
	{
		this.cancelHighlightUpdate();
	},

	template: `
		<div
			class="crm-ai-report-drawer__content-block-header-search ui-ctl ui-ctl-w100 ui-ctl-textbox ui-ctl-after-icon"
		>
			<input
				ref="searchInput"
				type="text"
				class="ui-ctl-element"
				:placeholder="loc('CRM_AI_REPORT_DRAWER_SEARCH_PLACEHOLDER')"
				v-model="searchText"
			>
			<button
				v-if="hasSearchText"
				type="button"
				class="ui-ctl-after ui-ctl-icon-clear"
				@click.stop.prevent="clearSearch"
			/>
			<span v-else class="ui-ctl-icon ui-ctl-icon-search ui-ctl-after"></span>
		</div>
	`,
});
