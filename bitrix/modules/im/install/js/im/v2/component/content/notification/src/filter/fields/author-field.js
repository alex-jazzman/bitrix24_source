import { Dom } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { TagSelector } from 'ui.entity-selector';

import { EventType } from 'im.v2.const';

import { NotificationFilterCacheService } from '../../classes/notification-filter-cache-service';

import './css/field.css';

// @vue/component
export const NotificationFilterAuthorField = {
	name: 'AuthorFilterField',
	props: {
		modelValue: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['update:modelValue', 'popupStateChange'],
	computed: {
		labelText(): string
		{
			return this.loc('IM_NOTIFICATIONS_FILTER_AUTHOR_FIELD_TITLE');
		},
	},
	created()
	{
		EventEmitter.subscribe(EventType.notification.onFilterAuthorTagAdd, this.onAuthorTagAdd);
		EventEmitter.subscribe(EventType.notification.onFilterAuthorTagRemove, this.onAuthorTagRemove);
		EventEmitter.subscribe(EventType.notification.onFilterAuthorPopupStateChange, this.onAuthorPopupState);
		this.notificationFilterCacheService = NotificationFilterCacheService.getInstance();
	},
	mounted(): void
	{
		this.selector = this.getSelector();
		this.selector.renderTo(this.$refs['author-selector']);
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(EventType.notification.onFilterAuthorTagAdd, this.onAuthorTagAdd);
		EventEmitter.unsubscribe(EventType.notification.onFilterAuthorTagRemove, this.onAuthorTagRemove);
		EventEmitter.unsubscribe(EventType.notification.onFilterAuthorPopupStateChange, this.onAuthorPopupState);
	},
	methods:
	{
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		getSelector(): TagSelector
		{
			let selector = this.notificationFilterCacheService.getAuthorSelector();
			if (!selector)
			{
				const preselectedItems = this.modelValue.map((author) => ['user', author.id]);

				selector = new TagSelector({
					events: {
						onTagAdd: (event: BaseEvent) => {
							const { tag } = event.getData();
							EventEmitter.emit(EventType.notification.onFilterAuthorTagAdd, { tag });
						},
						onTagRemove: (event: BaseEvent) => {
							const { tag } = event.getData();
							EventEmitter.emit(EventType.notification.onFilterAuthorTagRemove, { tag });
						},
					},
					multiple: true,
					dialogOptions: {
						items: [
							{ id: 0, entityId: 'user', title: this.loc('IM_NOTIFICATIONS_FILTER_AUTHOR_FIELD_SYSTEM_USER'), tabs: 'recents', link: '' },
						],
						height: 250,
						width: 380,
						preselectedItems,
						entities: [
							{
								id: 'user',
								options: {
									intranetUsersOnly: true,
									inviteEmployeeLink: false,
								},
							},
						],
						dropdownMode: true,
						hideOnDeselect: false,
						events: {
							onShow: () => {
								EventEmitter.emit(EventType.notification.onFilterAuthorPopupStateChange, { active: true });
							},
							onHide: () => {
								EventEmitter.emit(EventType.notification.onFilterAuthorPopupStateChange, { active: false });
							},
						},
					},
				});

				const container = selector.getDialog()?.getContainer();
				if (container)
				{
					Dom.attr(container, 'data-test-id', 'im_notifications-filter__author-field-selector');
				}

				this.notificationFilterCacheService.setAuthorSelector(selector);
			}

			return selector;
		},
		onAuthorTagAdd(event: BaseEvent): void
		{
			const { tag } = event.getData();
			const isNewAuthor = !this.modelValue.some((author) => author.id === tag.id);

			if (!isNewAuthor)
			{
				return;
			}

			const searchAuthors = [
				...this.modelValue,
				{
					id: tag.id,
					name: tag.title.text,
				},
			];
			this.$emit('update:modelValue', searchAuthors);
		},
		onAuthorTagRemove(event: BaseEvent): void
		{
			const { tag } = event.getData();
			const searchAuthors = this.modelValue.filter((author) => author.id !== tag.id);
			this.$emit('update:modelValue', searchAuthors);
		},
		onAuthorPopupState(event: BaseEvent): void
		{
			const { active } = event.getData();
			this.$emit('popupStateChange', { popup: 'author', active });
		},
	},
	template: `
		<div class="bx-im-notifications-filter_field__container">
			<div class="bx-im-notifications-filter_field__label">{{ labelText }}</div>
			<div
				ref="author-selector"
				class="bx-im-notifications-filter_field__selector-container"
				data-test-id="im_notifications-filter__author-field-container"
			/>
		</div>
	`,
};
