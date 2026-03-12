import { Dom } from 'main.core';
import { TagSelector } from 'ui.entity-selector';

import './css/field.css';

import type { BaseEvent } from 'main.core.events';
import type { JsonObject } from 'main.core';

// @vue/component
export const NotificationFilterTypeField = {
	name: 'TypeFilterField',
	props: {
		modelValue: {
			type: Array,
			default: () => [],
		},
		schema: {
			type: Object,
			required: false,
			default: null,
		},
	},
	emits: ['update:modelValue', 'popupStateChange'],
	computed: {
		labelText(): string
		{
			return this.loc('IM_NOTIFICATIONS_FILTER_TYPE_FIELD_TITLE');
		},
	},
	mounted(): void
	{
		this.selector = this.getSelector();
		this.selector.renderTo(this.$refs['type-selector']);
	},
	methods:
	{
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		getSelector(): TagSelector
		{
			const entityId = 'im-notification-filter-type';
			const targetNode = this.getTargetNode();
			const items = this.filterTypes().map((group) => ({
				id: String(group.MODULE_ID),
				entityId,
				tabs: 'recents',
				title: group.NAME,
				selected: this.modelValue.some((item) => item.id === String(group.MODULE_ID)),
			}));

			const selector = new TagSelector({
				events: {
					onTagAdd: (event: BaseEvent) => {
						const { tag } = event.getData();
						if (!this.modelValue.some((type) => type.id === tag.id))
						{
							const searchTypes = [
								...this.modelValue,
								{
									id: tag.id,
									name: tag.title?.text ?? String(tag.id),
								},
							];
							this.$emit('update:modelValue', searchTypes);
						}
					},
					onTagRemove: (event: BaseEvent) => {
						const { tag } = event.getData();
						const searchTypes = this.modelValue.filter((type) => type.id !== tag.id);
						this.$emit('update:modelValue', searchTypes);
					},
				},
				multiple: true,
				dialogOptions: {
					height: 250,
					width: 300,
					multiple: true,
					dropdownMode: true,
					compactView: true,
					showAvatars: false,
					hideOnDeselect: false,
					enableSearch: false,
					targetNode,
					items,
					events: {
						'Item:onSelect': (event: BaseEvent) => {
							const { item } = event.getData();
							if (!this.modelValue.some((type) => type.id === item.id))
							{
								const searchTypes = [
									...this.modelValue,
									{
										id: item.id,
										name: item.title?.text ?? String(item.id),
									},
								];
								this.$emit('update:modelValue', searchTypes);
							}
						},
						onShow: () => {
							this.$emit('popupStateChange', { popup: 'type', active: true });
						},
						onHide: () => {
							this.$emit('popupStateChange', { popup: 'type', active: false });
						},
					},
				},
			});

			const container = selector.getDialog()?.getContainer();
			if (container)
			{
				Dom.attr(container, 'data-test-id', 'im_notifications-filter__types-field-selector');
			}

			return selector;
		},
		getTargetNode(): HTMLElement
		{
			return this.$refs['type-selector']?.$refs?.inputContainer ?? this.$el;
		},
		filterTypes(): JsonObject[]
		{
			const originalSchema = { ...this.schema };

			// rename some groups
			if (originalSchema.calendar)
			{
				originalSchema.calendar.NAME = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_CALENDAR');
			}

			if (originalSchema.sender)
			{
				originalSchema.sender.NAME = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_SENDER');
			}

			if (originalSchema.blog)
			{
				originalSchema.blog.NAME = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_BLOG');
			}

			if (originalSchema.socialnetwork)
			{
				originalSchema.socialnetwork.NAME = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_SOCIALNETWORK');
			}

			if (originalSchema.intranet)
			{
				originalSchema.intranet.NAME = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_SEARCH_FILTER_TYPE_INTRANET');
			}

			// we need only these modules in this order!
			const modulesToShowInFilter = [
				'tasks', 'calendar', 'crm', 'timeman', 'mail', 'disk', 'bizproc', 'voximplant', 'sender',
				'blog', 'vote', 'socialnetwork', 'imopenlines', 'photogallery', 'intranet', 'forum',
			];

			const notificationFilterTypes = [];
			modulesToShowInFilter.forEach((moduleId) => {
				if (originalSchema[moduleId])
				{
					notificationFilterTypes.push(originalSchema[moduleId]);
				}
			});

			return notificationFilterTypes;
		},
	},
	template: `
		<div class="bx-im-notifications-filter_field__container">
			<div class="bx-im-notifications-filter_field__label">{{ labelText }}</div>
			<div
				ref="type-selector"
				class="bx-im-notifications-filter_field__selector-container"
				data-test-id="im_notifications-filter__type-field-container"
			/>
		</div>
	`,
};
