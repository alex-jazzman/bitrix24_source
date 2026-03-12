import { Event, Type } from 'main.core';

import { NotificationFilterSearchInput } from './elements/search/search-input';
import { NotificationFilterPopup } from './elements/filter-popup';
import { NotificationFilterCacheService } from '../classes/notification-filter-cache-service';

import type { JsonObject } from 'main.core';

type SearchAuthor = {
	id: string,
	name: string,
};

type SearchType = {
	id: string,
	name: string,
};

type SearchDate = {
	date?: string,
	dateFrom?: string,
	dateTo?: string,
}

type NotificationFilterData = {
	searchQuery?: string,
	searchAuthors?: Array<SearchAuthor>,
	searchTypes?: Array<SearchType>,
	searchDate?: SearchDate,
};

export const NotificationFilterFieldTypes = Object.freeze({
	searchAuthors: 'searchAuthors',
	searchTypes: 'searchTypes',
	searchDate: 'searchDate',
});

// @vue/component
export const NotificationFilter = {
	name: 'NotificationFilter',
	components: {
		NotificationFilterSearchInput,
		NotificationFilterPopup,
	},
	props: {
		schema: {
			type: Object,
			required: false,
			default: null,
		},
	},
	emits: ['search'],
	data(): JsonObject
	{
		return {
			isInputFocused: false,
			activePopups: {
				author: false,
				type: false,
				dateOptions: false,
				datePicker: false,
			},
			filterData: {
				searchQuery: '',
				searchAuthors: [],
				searchTypes: [],
				searchDate: {},
			},
			popupElement: null,
		};
	},
	computed: {
		displayData(): JsonObject
		{
			const searchTypeTitles = [];
			this.filterData.searchTypes?.forEach((type) => {
				searchTypeTitles.push(type.name);
			});

			const searchAuthorNames = [];
			this.filterData.searchAuthors?.forEach((type) => {
				searchAuthorNames.push(type.name);
			});

			return {
				searchTypes: searchTypeTitles,
				searchDate: this.filterData.searchDate,
				searchAuthors: searchAuthorNames,
			};
		},
	},
	watch: {
		'filterData.searchQuery': function(value): void
		{
			this.onSearchUpdate(value);
		},
	},
	created()
	{
		this.notificationFilterCacheService = NotificationFilterCacheService.getInstance();
	},
	mounted()
	{
		Event.bind(document, 'click', this.handleClickOutside);
	},
	beforeUnmount()
	{
		Event.unbind(document, 'click', this.handleClickOutside);
		this.notificationFilterCacheService.clearCache();
	},
	methods: {
		onInputFocus(): void
		{
			this.isInputFocused = !this.isInputFocused;
			this.clearActivePopups();
		},
		onPopupClose(): void
		{
			this.isInputFocused = false;
			this.clearActivePopups();
		},
		clearActivePopups(): void
		{
			this.activePopups = {
				author: false,
				type: false,
				dateOptions: false,
				datePicker: false,
			};
		},
		applyData(data: NotificationFilterData = {}, reset = false): void
		{
			this.filterData = {
				searchQuery: reset ? '' : this.filterData.searchQuery,
				searchTypes: data.searchTypes ?? [],
				searchDate: data.searchDate ?? {},
				searchAuthors: data.searchAuthors ?? [],
			};

			const searchTypeIds = [];
			if (Type.isArray(data.searchTypes))
			{
				data.searchTypes.forEach((type) => {
					searchTypeIds.push(type.id);
				});
			}

			const searchAuthorIds = [];
			if (Type.isArray(data.searchAuthors))
			{
				data.searchAuthors.forEach((author) => {
					searchAuthorIds.push(author.id);
				});
			}

			let { dateFrom, dateTo } = data.searchDate ?? {};
			if (dateFrom && dateTo)
			{
				const dateFromTimestamp = new Date(dateFrom).getTime();
				const dateToTimestamp = new Date(dateTo).getTime();

				if (dateToTimestamp < dateFromTimestamp)
				{
					[dateFrom, dateTo] = [dateTo, dateFrom];
				}
			}
			else
			{
				dateFrom = '';
				dateTo = '';
			}

			const valueData = {
				searchQuery: this.filterData.searchQuery,
				searchTypes: searchTypeIds,
				searchDate: this.filterData.searchDate.date ?? '',
				searchDateFrom: dateFrom,
				searchDateTo: dateTo,
				searchAuthors: searchAuthorIds,
			};

			this.$emit('search', valueData);
		},
		onPopupUpdate(data): void
		{
			this.applyData(data);
			this.isInputFocused = false;
		},
		onFilterReset(): void
		{
			this.applyData({}, true);
			this.notificationFilterCacheService.clearCache();
			this.isInputFocused = false;
		},
		onSearchUpdate(): void
		{
			this.isInputFocused = false;
			this.applyData(this.filterData);
		},
		onTagsRemove(keys: Array<string>): void
		{
			keys.forEach((key) => {
				switch (key)
				{
					case NotificationFilterFieldTypes.searchTypes:
					{
						this.filterData.searchTypes = [];
						break;
					}

					case NotificationFilterFieldTypes.searchDate:
					{
						this.filterData.searchDate = {};
						break;
					}

					case NotificationFilterFieldTypes.searchAuthors:
					{
						this.filterData.searchAuthors = [];
						this.notificationFilterCacheService.clearCache();
						break;
					}

					default:
					{
						break;
					}
				}
			});

			this.isInputFocused = false;
			this.applyData(this.filterData);
		},
		onPopupStateChange({ popup, active }): void
		{
			this.activePopups[popup] = active;
		},
		handleClickOutside(event: MouseEvent): void
		{
			if (!this.isInputFocused)
			{
				return;
			}

			const isAnyDialogActive = Object.values(this.activePopups).some(
				(active) => active,
			);
			if (isAnyDialogActive)
			{
				return;
			}

			const inputElement = this.getInputElement();
			const clickedInsideInput = inputElement?.contains(event.target);
			const clickedInsidePopup = this.popupElement?.contains(event.target);

			if (!clickedInsideInput && !clickedInsidePopup)
			{
				this.isInputFocused = false;
			}
		},
		getInputElement(): HTMLElement
		{
			return this.$refs.searchInput;
		},
		onPopupMounted(element): void
		{
			this.popupElement = element;
		},
	},
	template: `
		<div ref="searchInput">
			<NotificationFilterSearchInput
				:displayData="displayData"
				v-model="filterData.searchQuery"
				@clear="onFilterReset"
				@remove="onTagsRemove"
				@click="onInputFocus"
			/>
		</div>
		<NotificationFilterPopup
			v-if="isInputFocused"
			:schema="schema"
			:bindElement="getInputElement()"
			:filterData="filterData"
			@search="onPopupUpdate"
			@reset="onFilterReset"
			@close="onPopupClose"
			@mounted="onPopupMounted"
			@popupStateChange="onPopupStateChange"
			ref="filterPopup"
		/>
	`,
};
