import { Event, Loc } from 'main.core';

import { type PopupOptions } from 'main.popup';
import { FocusNavigator } from 'ui.a11y';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Popup } from 'ui.vue3.components.popup';

import { GroupType, Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { type GroupModel } from 'tasks.v2.model.groups';
import { type TaskModel } from 'tasks.v2.model.tasks';
import { groupService } from 'tasks.v2.provider.service.group-service';
import { userService } from 'tasks.v2.provider.service.user-service';

import './group-popup.css';

export const GroupPopup = {
	components: {
		Popup,
		UiButton,
	},
	inject: {
		task: {},
	},
	props: {
		getBindElement: {
			type: Function,
			required: true,
		},
	},
	emits: ['openGroup', 'close'],
	setup(): { task: TaskModel }
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): Object
	{
		return {
			isPopupShown: false,
			/** @type GroupInfo */
			groupInfo: {},
		};
	},
	computed: {
		group(): ?GroupModel
		{
			return this.$store.getters[`${Model.Groups}/getById`](this.task.groupId);
		},
		bindElement(): HTMLElement
		{
			return this.getBindElement();
		},
		options(): PopupOptions
		{
			return {
				id: 'tasks-field-group-popup',
				bindElement: this.bindElement,
				padding: 24,
				minWidth: 260,
				maxWidth: 400,
				offsetTop: 8,
				closeByEsc: true,
				targetContainer: document.body,
				ariaLabel: this.group?.name || this.loc('TASKS_V2_GROUP_HIDDEN'),
				focusTrap: {
					initialFocus: false,
					restoreFocus: false,
					startBoundary: () => this.keyboardTrigger,
				},
			};
		},
		groupOwnerUrl(): string
		{
			return userService.getUrl(this.groupInfo.ownerId);
		},
		groupMembersCountFormatted(): string
		{
			return Loc.getMessagePlural('TASKS_V2_GROUP_COUNT_MEMBERS', this.groupInfo.numberOfMembers, {
				'#COUNT#': this.groupInfo.numberOfMembers,
			});
		},
		groupAboutFormatted(): string
		{
			const collabTitle = (
				Core.getParams().features.isNewProjectsOn
					? this.loc('TASKS_V2_GROUP_ABOUT')
					: this.loc('TASKS_V2_GROUP_ABOUT_COLLAB')
			);

			return {
				[GroupType.Collab]: collabTitle,
				[GroupType.Scrum]: this.loc('TASKS_V2_GROUP_ABOUT_SCRUM'),
			}[this.group?.type] ?? this.loc('TASKS_V2_GROUP_ABOUT');
		},
		groupRestricted(): boolean
		{
			return !this.group || Boolean(this.group.isRestrictedView);
		},
	},
	mounted(): void
	{
		Event.bind(this.bindElement, 'click', this.handleClick);
		Event.bind(this.bindElement, 'mouseenter', this.handleMouseEnter);
		Event.bind(this.bindElement, 'mouseleave', this.handleMouseLeave);
		Event.bind(this.bindElement, 'focusin', this.handleMouseEnter);
		Event.bind(this.bindElement, 'focusout', this.handleFocusOut);
		Event.bind(this.bindElement, 'keydown', this.handleTriggerKeyDown);
	},
	beforeUnmount(): void
	{
		this.clearTimeouts();

		Event.unbind(this.bindElement, 'click', this.handleClick);
		Event.unbind(this.bindElement, 'mouseenter', this.handleMouseEnter);
		Event.unbind(this.bindElement, 'mouseleave', this.handleMouseLeave);
		Event.unbind(this.bindElement, 'focusin', this.handleMouseEnter);
		Event.unbind(this.bindElement, 'focusout', this.handleFocusOut);
		Event.unbind(this.bindElement, 'keydown', this.handleTriggerKeyDown);
		Event.unbind(document, 'mouseover', this.updateHoverElement);
	},
	methods: {
		openGroup(): void
		{
			if (this.groupRestricted)
			{
				return;
			}

			this.closePopup();

			this.$emit('openGroup');
		},
		handleClick(): void
		{
			this.clearTimeouts();
		},
		handleMouseEnter(): void
		{
			if (this.groupRestricted || this.isRestoringFocus)
			{
				return;
			}

			this.groupInfoPromise = groupService.getGroupInfo(this.group.id);

			this.clearTimeouts();
			this.showTimeout = setTimeout(() => this.showPopup(), 400);
		},
		handleMouseLeave(): void
		{
			Event.unbind(document, 'mouseover', this.updateHoverElement);
			Event.bind(document, 'mouseover', this.updateHoverElement);

			this.clearTimeouts();
			this.closeTimeout = setTimeout(() => {
				if (this.containsFocus())
				{
					return;
				}

				if (!this.$refs.container?.contains(this.hoverElement) && !this.bindElement?.contains(this.hoverElement))
				{
					this.closePopup();
				}
			}, 100);
		},
		handleFocusOut(): void
		{
			this.clearTimeouts();
			this.closeTimeout = setTimeout(() => {
				if (!this.containsFocus())
				{
					this.closePopup();
				}
			}, 100);
		},
		handleTriggerKeyDown(event: KeyboardEvent): void
		{
			if (event.key !== 'Tab' || event.shiftKey || !this.isPopupShown)
			{
				return;
			}

			if (FocusNavigator.getNext(this.bindElement))
			{
				return;
			}

			const trigger = FocusNavigator.getActiveElement();
			if (!this.focusPopupContent())
			{
				return;
			}

			this.keyboardTrigger = trigger;
			event.preventDefault();
		},
		focusPopupContent(): boolean
		{
			const focusTrap = this.$refs.popup?.getPopupInstance?.()?.getFocusTrap?.();

			return Boolean(focusTrap?.focusFirst());
		},
		containsFocus(): boolean
		{
			const activeElement = FocusNavigator.getActiveElement();
			if (activeElement === null)
			{
				return false;
			}

			return this.bindElement?.contains(activeElement) || Boolean(this.$refs.popup?.contains(activeElement));
		},
		popupContainsFocus(): boolean
		{
			const activeElement = FocusNavigator.getActiveElement();

			return activeElement !== null && Boolean(this.$refs.popup?.contains(activeElement));
		},
		updateHoverElement(event: MouseEvent): void
		{
			this.hoverElement = event.target;
		},
		async showPopup(): Promise<void>
		{
			if (this.groupInfoPromise)
			{
				this.groupInfo = await this.groupInfoPromise;
			}

			if (!this.group || Object.keys(this.groupInfo).length === 0)
			{
				return;
			}

			this.clearTimeouts();
			this.isPopupShown = true;
			await this.$nextTick();
			this.$refs.popup.adjustPosition();
		},
		closePopup(): void
		{
			const trigger = this.popupContainsFocus() ? this.keyboardTrigger : null;
			this.keyboardTrigger = null;

			this.clearTimeouts();
			this.isPopupShown = false;
			Event.unbind(this.$refs.container, 'mouseleave', this.handleMouseLeave);
			Event.unbind(document, 'mouseover', this.updateHoverElement);

			void this.restoreTriggerFocus(trigger);
		},
		async restoreTriggerFocus(trigger: ?HTMLElement): Promise<void>
		{
			if (!trigger)
			{
				return;
			}

			await this.$nextTick();

			if (!document.body.contains(trigger))
			{
				return;
			}

			this.isRestoringFocus = true;
			FocusNavigator.restoreFocus(trigger);
			this.isRestoringFocus = false;
		},
		clearTimeouts(): void
		{
			clearTimeout(this.closeTimeout);
			clearTimeout(this.showTimeout);
		},
	},
	template: `
		<Popup v-if="isPopupShown" :options ref="popup" @close="closePopup">
			<div class="tasks-field-group-popup" ref="container">
				<div class="tasks-field-group-popup-header">
					<img class="tasks-field-group-popup-image" :src="encodeURI(group?.image)" :alt="group?.name">
					<div class="tasks-field-group-popup-title-container">
						<div class="tasks-field-group-popup-title" :title="group?.name">{{ group?.name }}</div>
						<div class="tasks-field-group-popup-subtitle">{{ groupMembersCountFormatted }}</div>
					</div>
				</div>
				<div class="tasks-field-group-popup-button">
					<UiButton
						:text="groupAboutFormatted"
						:style="AirButtonStyle.OUTLINE_ACCENT_2"
						:size="ButtonSize.SMALL"
						wide
						@click="openGroup"
					/>
				</div>
				<div class="tasks-field-group-popup-info">
					<div class="tasks-field-group-popup-field">
						<div class="tasks-field-group-popup-field-title">{{ loc('TASKS_V2_GROUP_OWNER') }}</div>
						<div class="tasks-field-group-popup-field-value">
							<a :href="groupOwnerUrl">{{ groupInfo.ownerName }}</a>
						</div>
					</div>
					<div class="tasks-field-group-popup-field">
						<div class="tasks-field-group-popup-field-title">{{ loc('TASKS_V2_GROUP_DATE_CREATE') }}</div>
						<div class="tasks-field-group-popup-field-value">{{ groupInfo.dateCreate }}</div>
					</div>
					<div class="tasks-field-group-popup-field">
						<div class="tasks-field-group-popup-field-title">{{ loc('TASKS_V2_GROUP_SUBJECT') }}</div>
						<div class="tasks-field-group-popup-field-value">{{ groupInfo.subjectTitle }}</div>
					</div>
				</div>
			</div>
		</Popup>
	`,
};
