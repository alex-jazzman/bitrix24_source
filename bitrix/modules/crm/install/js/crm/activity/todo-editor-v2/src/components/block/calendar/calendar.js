import { SectionSelector as CalendarSectionSelector } from 'calendar.controls';
import { Planner } from 'calendar.planner';
import { Util } from 'calendar.util';
import { ajax as Ajax, Loc, Text, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { DateTimeFormat, Timezone } from 'main.date';
import 'ui.design-tokens';
import { Dialog } from 'ui.entity-selector';
import { UI } from 'ui.notification';
import { AlertDesign } from 'ui.system.alert';
import { Alert } from 'ui.system.alert.vue';

import { type BlockSettings } from '../../../todo-editor';
import { Events } from '../../events';
import { LocationSelector } from './location-selector';
import { SectionSelector } from './section-selector';

export function invalidatePlannerRequests(context: Object): void
{
	context.destroyed = true;
	context.plannerRequestId += 1;
}

function normalizeUserId(userId): number
{
	const normalizedUserId = Number(userId);

	return Number.isInteger(normalizedUserId) && normalizedUserId > 0 ? normalizedUserId : 0;
}

export function createSelectedUserIds(userIds, hostId): Set<number>
{
	const selectedUserIds = new Set();
	const normalizedHostId = normalizeUserId(hostId);
	if (normalizedHostId > 0)
	{
		selectedUserIds.add(normalizedHostId);
	}

	if (userIds?.[Symbol.iterator])
	{
		for (const userId of userIds)
		{
			const normalizedUserId = normalizeUserId(userId);
			if (normalizedUserId > 0)
			{
				selectedUserIds.add(normalizedUserId);
			}
		}
	}

	return selectedUserIds;
}

export function prepareCalendarBlockForCopy(calendarBlock: Object, hostId: number, from: number): void
{
	calendarBlock.data.calendarEventId = 0;
	calendarBlock.data.hostId = normalizeUserId(hostId);
	calendarBlock.data.from = from;
}

export function requestPlannerUpdate(context: Object, data: Object): Promise
{
	if (context.destroyed)
	{
		return Promise.resolve();
	}

	const requestId = ++context.plannerRequestId;
	context.getPlanner().showLoader();

	// wrap BX.Promise in native js promise
	return new Promise((resolve, reject) => {
		Ajax.runAction('calendar.api.calendarajax.updatePlanner', { data }).then(resolve).catch(reject);
	})
		.then(
			(response) => {
				if (requestId !== context.plannerRequestId)
				{
					return response;
				}

				context.plannerLoadError = false;
				context.plannerLimitState = {
					exceeded: response.data.plannerLimitExceeded === true,
					maxPlannerUsers: parseInt(response.data.maxPlannerUsers, 10) || 0,
					peopleCount: parseInt(
						response.data.plannerLimitPeopleCount ?? response.data.plannerPeopleCount,
						10,
					) || 0,
				};

				context.getPlanner().update(
					Type.isArray(response.data.entries) ? response.data.entries : [],
					Type.isObject(response.data.accessibility) ? response.data.accessibility : {},
				);

				context.onDataUpdate();

				return response;
			},
			(response) => {
				if (requestId === context.plannerRequestId)
				{
					context.plannerLoadError = true;
				}

				return response;
			},
		)
		.catch((errors) => {
			if (requestId === context.plannerRequestId)
			{
				context.plannerLoadError = true;
			}

			return errors;
		})
		.finally(() => {
			if (requestId === context.plannerRequestId)
			{
				context.plannerInstance?.hideLoader();
			}
		})
	;
}

export function teardownCalendar(context: Object): void
{
	invalidatePlannerRequests(context);
	context.$Bitrix.eventEmitter.unsubscribe(Events.EVENT_RESPONSIBLE_USER_CHANGE, context.onResponsibleUserChange);
	context.$Bitrix.eventEmitter.unsubscribe(Events.EVENT_DEADLINE_CHANGE, context.onDeadlineChange);
	context.plannerInstance?.selector?.unsubscribe('onChange', context.plannerSelectorChangeHandler);
}

export const calendarMethods = {
	normalizeCalendarConfig(config: ?Object): Object
	{
		const normalizedConfig = Type.isObject(config) ? config : {};

		return {
			...normalizedConfig,
			sections: Type.isArray(normalizedConfig.sections) ? normalizedConfig.sections : [],
		};
	},
	loadConfig(data: Object): Promise
	{
		// wrap BX.Promise in native js promise
		return new Promise((resolve, reject) => {
			this.fetchConfig().then(resolve).catch(reject);
		})
			.then((response) => {
				if (this.destroyed)
				{
					return;
				}

				this.config = this.normalizeCalendarConfig(response.data);
				this.sectionSelectorReadOnly = this.config.readOnly ?? false;
				this.applyCalendarUserSettings(this.config);

				if (Type.isNil(data.sectionId))
				{
					const defaultSection = this.config.sections.find((section) => section.DEFAULT === true);
					if (Type.isObject(defaultSection))
					{
						this.sectionId = defaultSection.ID;
					}
					else
					{
						const firstUserSection = this.config.sections.find((section) => section.OWNER_ID === data.ownerId);
						this.sectionId = firstUserSection?.ID ?? 0;
					}
				}
			})
			.catch((error) => {
				return error;
			})
			.finally(() => {
				if (!this.destroyed)
				{
					void this.$nextTick(() => this.initPlanner());
				}
			})
		;
	},
	updatePlannerForSelectedUsers(): Promise
	{
		const data = this.prepareUpdatePlannerData([...this.selectedUserIds]);

		return this.updatePlanner(data);
	},
	onResponsibleUserChange(event: Object): void
	{
		const { responsibleUserId } = event.getData();

		this.ownerId = responsibleUserId;
		this.selectedUserIds.add(responsibleUserId);
		void this.updatePlannerForSelectedUsers();
	},
	onDeadlineChange(event: Object): void
	{
		const data = event.getData();
		if (data)
		{
			const deadline = data.deadline.getTime();
			this.from = deadline;
			this.to = this.from + this.duration;
		}
	},
};

export const TodoEditorBlocksCalendar = {
	components: {
		Alert,
		LocationSelector,
		SectionSelector,
	},

	props: {
		id: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		icon: {
			type: String,
			required: true,
		},
		settings: {
			type: Object,
			required: true,
		},
		context: {
			type: Object,
			required: true,
		},
		filledValues: {
			type: Object,
		},
		isFocused: {
			type: Boolean,
		},
	},

	emits: [
		'close',
		'updateFilledValues',
	],

	data(): Object
	{
		const ownerId = this.settings.ownerId || this.context.userId;
		const hostId = normalizeUserId(this.settings.hostId) || normalizeUserId(this.settings.userId);
		const selectedUserIds = createSelectedUserIds([ownerId], hostId);

		const timestamp = (this.settings.from || Timezone.UserTime.getTimestamp()) * 1000;
		const millisecondsInFiveMinutes = 5 * 60 * 1000;

		// round timestamp to 5 minutes
		const from = Math.ceil(timestamp / millisecondsInFiveMinutes) * millisecondsInFiveMinutes;

		const duration = Number(this.settings.duration ?? 60 * 60) * 1000;
		const to = from + duration;

		const data = {
			selectedUserIds,
			from,
			to,
			duration,
			showLocation: this.settings.showLocation ?? false,
			locationId: null,
			timezoneName: this.settings.timezoneName,
			ownerId,
			hostId,
			calendarEventId: normalizeUserId(this.settings.calendarEventId),
			sectionId: this.settings.sectionId || null,
			config: {},
			canUseCalendarSectionSelector: (
				Type.isFunction(CalendarSectionSelector.getModes)
				&& CalendarSectionSelector.getModes().includes('inline')
			),
			sectionSelectorReadOnly: this.settings.sectionSelectorReadOnly ?? false,
			plannerLimitState: {
				exceeded: false,
				maxPlannerUsers: 0,
				peopleCount: 0,
			},
			plannerLoadError: false,
		};

		return this.getPreparedData(data);
	},

	mounted(): void
	{
		this.$Bitrix.eventEmitter.subscribe(Events.EVENT_RESPONSIBLE_USER_CHANGE, this.onResponsibleUserChange);
		this.$Bitrix.eventEmitter.subscribe(Events.EVENT_DEADLINE_CHANGE, this.onDeadlineChange);

		if (this.settings.showUserSelector && this.isFocused)
		{
			this.showUserSelectorDialog();
		}
	},

	beforeUnmount()
	{
		teardownCalendar(this);
	},

	methods: {
		...calendarMethods,
		getPreparedData(data: Object): Object
		{
			const { filledValues } = this;
			let preparedData = {
				...this.applyFilledValues(data, filledValues),
				config: {},
				sectionSelectorReadOnly: false,
			};

			if (Type.isObject(filledValues?.config))
			{
				const config = this.normalizeCalendarConfig(filledValues.config);
				preparedData = {
					...preparedData,
					config,
					sectionSelectorReadOnly: config.readOnly ?? false,
				};
				this.applyCalendarUserSettings(config);

				void this.$nextTick(() => this.initPlanner());
			}
			else if (preparedData.canUseCalendarSectionSelector)
			{
				void this.loadConfig(preparedData);
			}
			else
			{
				void this.$nextTick(() => this.initPlanner());
			}

			return preparedData;
		},
		applyFilledValues(data: Object, filledValues: ?Object): Object
		{
			if (!Type.isObject(filledValues))
			{
				return data;
			}

			let selectedUsers = data.selectedUserIds;
			if (Type.isObject(filledValues.selectedUserIds))
			{
				selectedUsers = filledValues.selectedUserIds;
			}
			else if (Type.isObject(filledValues.attendeesEntityList))
			{
				selectedUsers = Object
					.values(filledValues.attendeesEntityList)
					.filter(({ entityId }) => entityId === 'user')
					.map(({ id }) => id)
				;
			}

			const isExistingEvent = normalizeUserId(
				filledValues.calendarEventId ?? data.calendarEventId,
			) > 0;
			const hostId = normalizeUserId(filledValues.hostId)
				|| (isExistingEvent ? 0 : data.hostId)
			;
			const selectedUserIds = createSelectedUserIds(selectedUsers, hostId);

			return {
				...data,
				selectedUserIds,
				hostId,
				from: Number(filledValues.from),
				to: Number(filledValues.to),
				duration: Number(filledValues.duration),
				timezoneName: filledValues.timezoneFrom,
				sectionId: Type.isNil(filledValues.sectionId) ? filledValues.sectionId : Number(filledValues.sectionId),
				calendarEventId: filledValues.calendarEventId ?? 0,
				...(Type.isStringFilled(filledValues.location) ? {
					showLocation: true,
					locationId: Number(filledValues.location.split('_')[1]), // calendar_7_123, need 7 as id
				} : {}),
				...(!Type.isNil(filledValues.ownerId) ? { ownerId: filledValues.ownerId } : {}),
			};
		},
		applyCalendarUserSettings(config: Object): void
		{
			if (Type.isObject(config.userSettings))
			{
				Util.setUserSettings(config.userSettings);
			}
		},
		initPlanner(): void
		{
			if (this.destroyed || this.plannerInstance)
			{
				return;
			}

			this.showPlanner();

			this.getPlanner().selector.subscribe('onChange', this.plannerSelectorChangeHandler);

			const userIds = [...this.selectedUserIds];
			const data = this.prepareUpdatePlannerData(userIds);
			void this.updatePlanner(data);
		},
		getId(): string
		{
			return 'calendar';
		},
		showPlanner(): void
		{
			this.getPlanner().show();
		},
		getPlanner(): Planner
		{
			if (!this.plannerInstance)
			{
				this.plannerInstance = new Planner({
					wrap: this.$refs.plannerContainer,
					compactMode: false,
					showEntryName: false,
					minWidth: 770,
					minHeight: 104,
					height: 104,
					width: 770,
					entryTimezone: this.config.userSettings?.timezoneName ?? this.timezoneName,
					readonly: this.isPlannerReadOnly(),
				});
			}

			return this.plannerInstance;
		},
		isPlannerReadOnly(): boolean
		{
			if (!this.sectionSelectorReadOnly)
			{
				return false;
			}

			const hasSelectedSection = Type.isArray(this.config.sections)
				&& this.config.sections.some((section) => section.ID === this.sectionId)
			;

			return !hasSelectedSection || !this.selectedUserIds.has(this.context.userId);
		},
		prepareUpdatePlannerData(newUserIds: number[]): Object
		{
			const location = (this.locationId ? this.location : '');

			const data = {
				entryId: this.calendarEventId ?? 0,
				ownerId: this.ownerId,
				hostId: this.hostId,
				type: 'user',
				entityList: [],
				dateFrom: this.getFormattedDate('beforeOneWeek'),
				dateTo: this.getFormattedDate('afterTwoWeeks'),
				timezone: this.timezoneName,
				location,
				entries: false,
				prevUserList: [],
				skipFeatureCheck: 'Y',
			};

			newUserIds.forEach((userId) => {
				data.entityList.push({
					entityId: 'user',
					id: userId,
					entityType: 'employee',
				});
			});

			return data;
		},
		updatePlanner(data: Object): Promise
		{
			return requestPlannerUpdate(this, data);
		},
		onDataUpdate(): void
		{
			this.updatePlannerSelector();

			this.$Bitrix.eventEmitter.emit(Events.EVENT_CALENDAR_CHANGE, {
				from: this.from,
				to: this.from + this.duration,
			});

			this.emitUpdateFilledValues();
		},
		emitUpdateFilledValues(): void
		{
			let { filledValues } = this;
			const { to, from, duration, location, selectedUserIds, ownerId, hostId, sectionId, config } = this;

			const newFilledValues = {
				to,
				from,
				duration,
				location,
				selectedUserIds,
				ownerId,
				hostId,
				sectionId,
				config,
			};
			filledValues = { ...filledValues, ...newFilledValues };
			this.$emit('updateFilledValues', this.getId(), filledValues);
		},
		updatePlannerSelector(): void
		{
			const dateFrom = this.createDateInstance(this.from);
			const dateTo = this.createDateInstance(this.from + this.duration);

			this.getPlanner().updateSelector(dateFrom, dateTo);
		},
		createDateInstance(timestamp: number | null = null, startOfDay: boolean = false): Date
		{
			if (!timestamp)
			{
				// eslint-disable-next-line no-param-reassign
				timestamp = Date.now();
			}

			const date = new Date(timestamp);
			if (startOfDay)
			{
				date.setHours(0, 0, 0, 0);
			}

			return date;
		},
		getFormattedDate(id: string): string
		{
			return this.getFormattedValue(id, DateTimeFormat.getFormat('FORMAT_DATE'));
		},
		getFormattedValue(id: string, format: string): string
		{
			let timestamp = 0;

			switch (id)
			{
				case 'beforeOneWeek':
				{
					timestamp = this.from - 8 * 24 * 60 * 60 * 1000;
					break;
				}

				case 'from':
				{
					timestamp = this.from;
					break;
				}

				case 'to':
				{
					timestamp = this.from + this.duration;
					break;
				}

				case 'afterTwoWeeks':
				{
					timestamp = this.from + 14 * 24 * 60 * 60 * 1000;
					break;
				}

				default:
					timestamp = 0;
			}

			return DateTimeFormat.format(format, timestamp / 1000);
		},
		toggleCalendarSelectorDialog(): void
		{
			const sectionSelector = this.$refs.sectionSelector;
			if (sectionSelector.isShown())
			{
				sectionSelector.hide();
			}
			else
			{
				sectionSelector.show();
			}
		},
		showUserSelectorDialog(): void
		{
			setTimeout(() => {
				const dialog = Dialog.getById('todo-editor-calendar-user-selector-dialog');

				if (dialog?.isOpen())
				{
					dialog.hide();
				}
				else
				{
					this.getUserSelectorDialog().show();
				}
			}, 5);
		},
		getUserSelectorDialog(): Dialog
		{
			const preselectedItems = [];

			this.selectedUsersIdsArray.forEach((id) => {
				preselectedItems.push(['user', id]);
			});

			const undeselectedItems = this.hostId > 0 ? [['user', this.hostId]] : [];

			return new Dialog({
				id: 'todo-editor-calendar-user-selector-dialog',
				targetNode: this.$refs.userSelector,
				context: 'CRM_ACTIVITY_TODO_CALENDAR_RESPONSIBLE_USER',
				multiple: true,
				dropdownMode: true,
				showAvatars: true,
				enableSearch: !this.sectionSelectorReadOnly,
				width: 450,
				zIndex: 2500,
				entities: [{ id: 'user' }],
				preselectedItems,
				undeselectedItems,
				events: {
					'Item:onBeforeSelect': this.onBeforeSelectUser,
					'Item:onBeforeDeselect': this.onBeforeSelectUser,
					'Item:onSelect': this.onSelectUser,
					'Item:onDeselect': this.onDeselectUser,
				},
			});
		},
		onBeforeSelectUser(event: BaseEvent): void
		{
			if (this.sectionSelectorReadOnly)
			{
				event.preventDefault();

				UI.Notification.Center.notify({
					content: Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_PARTICIPANTS_AUTHOR_ONLY'),
					autoHideDelay: 5000,
				});
			}
		},
		onSelectUser({ data: { item } }): void
		{
			if (this.selectedUserIds.has(item.id))
			{
				return;
			}

			this.selectedUserIds.add(item.id);
			void this.updatePlannerForSelectedUsers();
		},
		onDeselectUser({ data: { item } }): void
		{
			if (item.id === this.hostId || !this.selectedUserIds.has(item.id))
			{
				return;
			}

			this.selectedUserIds.delete(item.id);
			void this.updatePlannerForSelectedUsers();
		},
		getSelectedUserIds(): Number[]
		{
			return this.selectedUserIds ?? [];
		},
		handlePlannerSelectorChanges({ data: { dateFrom, dateTo } }): void
		{
			this.from = dateFrom.getTime();
			this.duration = dateTo.getTime() - this.from;

			this.emitCalendarChange();
		},
		updateSettings(data: Object | null): void
		{
			if (!data || !data.deadline)
			{
				return;
			}

			this.from = data.deadline.getTime();
		},
		onSelectLocation({ action, id }): void
		{
			this.locationId = (action === 'select' ? id : null);
		},
		onCloseLocationBlock(): void
		{
			this.locationId = null;
			this.showLocation = false;
		},
		getExecutedData(): Object
		{
			const { duration, from, location, sectionId } = this;
			const microsecondsInSecond = 1000;

			// `from`/`to` are absolute UTC timestamps and the server consumes them as such
			// (DateTime::createFromTimestamp). Passing them through UserTime.toBrowser shifted the
			// moment whenever the browser timezone differed from the user's Bitrix profile timezone,
			// which silently moved the linked calendar event and tripped the deadline edit guard.
			return {
				from: from / microsecondsInSecond,
				to: (from + duration) / microsecondsInSecond,
				duration: duration / microsecondsInSecond,
				selectedUserIds: [...this.getSelectedUserIds()],
				sectionId,
				location,
			};
		},
		prepareDataOnBlockConstruct(data: BlockSettings, params: Object): Object
		{
			// eslint-disable-next-line no-param-reassign
			data.settings.from = params.currentDeadline.getTime() / 1000;

			// eslint-disable-next-line no-param-reassign
			data.settings.ownerId = params.responsibleUserId;

			// eslint-disable-next-line no-param-reassign
			data.settings.userId = params.userId;

			// eslint-disable-next-line no-param-reassign
			data.settings.hostId = params.userId;
		},
		fetchConfig(): Promise
		{
			const data = {
				activityId: this.context.activityId,
				entityTypeId: this.context.itemIdentifier?.entityTypeId,
				entityId: this.context.itemIdentifier?.entityId,
			};

			return Ajax.runAction('crm.activity.todo.getCalendarConfig', { data });
		},
		onChangeSection(sectionId: number): void
		{
			if (this.sectionId === sectionId)
			{
				return;
			}

			this.sectionId = sectionId;
			this.emitUpdateFilledValues();
			this.emitCalendarChange({ sectionId });
		},
		emitCalendarChange(additional: Object = {}): void
		{
			const data = {
				...additional,
				from: this.from,
				to: this.from + this.duration,
			};

			this.$Bitrix.eventEmitter.emit(Events.EVENT_CALENDAR_CHANGE, data);
		},
		hasSections(): boolean
		{
			return Type.isArrayFilled(this.config?.sections);
		},
	},

	computed: {
		encodedTitle(): string
		{
			return Text.encode(this.title);
		},
		iconStyles(): Object
		{
			if (!this.icon)
			{
				return {};
			}

			const path = `/bitrix/js/crm/activity/todo-editor-v2/images/${this.icon}`;

			return {
				background: `url('${encodeURI(Text.encode(path))}') center center`,
			};
		},
		usersList(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_BLOCK_USERS_LIST');
		},
		location(): string
		{
			return this.locationId ? `calendar_${this.locationId}` : '';
		},
		selectedUsersIdsArray(): number[]
		{
			return [...this.selectedUserIds];
		},
		changeTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_BLOCK_CHANGE_ACTION');
		},
		plannerWarningText(): string
		{
			if (this.plannerLoadError)
			{
				return Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_PLANNER_LOAD_ERROR');
			}

			return Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_PLANNER_LIMIT_WARNING', {
				'#COUNT#': this.plannerLimitState.peopleCount,
				'#MAX#': this.plannerLimitState.maxPlannerUsers,
			});
		},
		plannerWarningDesign(): string
		{
			return this.plannerLoadError ? AlertDesign.tintedAlert : AlertDesign.tintedWarning;
		},
	},

	created()
	{
		this.plannerInstance = null;
		this.plannerRequestId = 0;
		this.destroyed = false;
		this.plannerSelectorChangeHandler = this.handlePlannerSelectorChanges.bind(this);

		this.$watch(
			'settings',
			(newSettings, oldSettings) => {
				const showLocation = Boolean(newSettings.showLocation ?? false);
				this.showLocation = Type.isStringFilled(this.filledValues?.location) || showLocation;

				if (oldSettings.showUserSelector !== newSettings.showUserSelector && newSettings.showUserSelector)
				{
					this.showUserSelectorDialog();
				}
			},
			{
				deep: true,
			},
		);
	},

	watch: {
		duration(): void
		{
			this.onDataUpdate();
		},
		from(): void
		{
			this.onDataUpdate();
		},
		to(): void
		{
			this.onDataUpdate();
		},
		locationId(newLocationId, oldLocationId): void
		{
			const newUserIds = this.selectedUsersIdsArray;

			const data = this.prepareUpdatePlannerData(newUserIds);

			void this.updatePlanner(data);
		},
	},

	template: `
		<div class="crm-activity__todo-editor-v2_block-header">
			<span
				class="crm-activity__todo-editor-v2_block-header-icon"
				:style="iconStyles"
			></span>
			<span>{{ encodedTitle }}</span>
			<span
				v-if="canUseCalendarSectionSelector"
				class="crm-activity__todo-editor-v2_block-header-data"
			>
				<SectionSelector 
					ref="sectionSelector"
					:userId="context.userId"
					:sections="config?.sections ?? []"
					:trackingUsersList="config?.trackingUsersList ?? []"
					:selectedSectionId="sectionId"
					:readOnly="sectionSelectorReadOnly"
					@change="onChangeSection"
				/>
			</span>
			<span v-if="canUseCalendarSectionSelector && hasSections && !sectionSelectorReadOnly">
				<span
					@click="toggleCalendarSelectorDialog"
					class="crm-activity__todo-editor-v2_block-header-action"
				>
					{{ changeTitle }}
				</span>
			</span>
			<div
				@click="$emit('close', id)"
				class="crm-activity__todo-editor-v2_block-header-close"
			></div>
		</div>
		<div class="crm-activity__todo-editor-v2_block-subheader">
			<span
				ref="userSelector"
				@click="showUserSelectorDialog"
				class="crm-activity__todo-editor-v2_block-subheader-action"
			>
				{{ usersList }} ({{ selectedUsersIdsArray.length }})
			</span>
		</div>
		<div class="crm-activity__todo-editor-v2_block-body">
			<div class="crm-activity__settings_popup__calendar-container">
				<div
					v-if="plannerLimitState.exceeded || plannerLoadError"
					class="crm-activity__todo-editor-v2_calendar-warning"
					role="status"
					aria-live="polite"
					aria-atomic="true"
				>
					<Alert :design="plannerWarningDesign">
						{{ plannerWarningText }}
					</Alert>
				</div>
				<div ref="plannerContainer" class="crm-activity__settings_popup__calendar__planner-container"></div>
			</div>
		</div>
		<div v-if="showLocation">
			<LocationSelector
				@change="onSelectLocation"
				@close="onCloseLocationBlock"
				:locationId="locationId"
				:forceShowLocationSelectorDialog="isFocused && !this.settings.showUserSelector"
			/>
		</div>
	`,
};
