/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, ui_vue3_directives_hint, ui_system_typography_vue, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_component_elements_hint, main_core, tasks_v2_const, ui_vue3_components_button, tasks_v2_component_elements_bottomSheet, tasks_v2_provider_service_remindersService, tasks_v2_core, main_date, tasks_v2_lib_timezone, ui_datePicker, ui_system_chip_vue, ui_system_input_vue, ui_system_menu_vue, tasks_v2_component_elements_duration, tasks_v2_lib_entitySelectorDialog, tasks_v2_lib_calendar, ui_system_skeleton_vue, tasks_v2_lib_fieldHighlighter) {
	'use strict';

	const remindersMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Reminders,
		title: main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_TITLE'),
		to: {
			[tasks_v2_const.RemindTo.Responsible]: {
				icon: ui_iconSet_api_vue.Outline.PERSON,
				title: main_core.Loc.getMessage('TASKS_V2_REMINDERS_RECIPIENT_RESPONSIBLE')
			},
			[tasks_v2_const.RemindTo.Creator]: {
				icon: ui_iconSet_api_vue.Outline.CROWN,
				title: main_core.Loc.getMessage('TASKS_V2_REMINDERS_RECIPIENT_CREATOR')
			},
			[tasks_v2_const.RemindTo.Accomplice]: {
				icon: ui_iconSet_api_vue.Outline.GROUP,
				title: main_core.Loc.getMessage('TASKS_V2_REMINDERS_RECIPIENT_ACCOMPLICE')
			},
			[tasks_v2_const.RemindTo.Myself]: {
				icon: ui_iconSet_api_vue.Outline.BOOKMARK,
				title: main_core.Loc.getMessage('TASKS_V2_REMINDERS_RECIPIENT_MYSELF')
			}
		},
		by: {
			[tasks_v2_const.RemindBy.Date]: main_core.Loc.getMessage('TASKS_V2_REMINDERS_REMIND_BY_DATE'),
			[tasks_v2_const.RemindBy.Deadline]: main_core.Loc.getMessage('TASKS_V2_REMINDERS_REMIND_BY_DEADLINE')
		},
		via: {
			[tasks_v2_const.RemindVia.Notification]: {
				icon: ui_iconSet_api_vue.Outline.EMPTY_MESSAGE,
				title: main_core.Loc.getMessage('TASKS_V2_REMINDERS_SEND_VIA_NOTIFICATION')
			},
			[tasks_v2_const.RemindVia.Email]: {
				icon: ui_iconSet_api_vue.Outline.MAIL,
				title: main_core.Loc.getMessage('TASKS_V2_REMINDERS_SEND_VIA_EMAIL')
			}
		}
	});

	// @vue/component
	const ListHeader = {
		name: 'TasksRemindersListHeader',
		components: {
			Text2Xs: ui_system_typography_vue.Text2Xs
		},
		template: `
		<div class="tasks-field-reminders-row --header">
			<div class="tasks-field-reminders-column --header --via">
				<Text2Xs>{{ loc('TASKS_V2_REMINDERS_LIST_COLUMN_VIA') }}</Text2Xs>
			</div>
			<div class="tasks-field-reminders-column --header --date">
				<Text2Xs>{{ loc('TASKS_V2_REMINDERS_LIST_COLUMN_DATE') }}</Text2Xs>
			</div>
			<div class="tasks-field-reminders-column --header --recipients">
				<Text2Xs>{{ loc('TASKS_V2_REMINDERS_LIST_COLUMN_TO') }}</Text2Xs>
			</div>
		</div>
	`
	};

	const OPEN_KEYS = ['Enter', ' ', 'ArrowDown'];
	const VISIBLE_LABEL_SELECTOR = '.ui-system-input-label:not(.--error)';
	// @vue/component
	const ReminderSheetContent = {
		components: {
			UiButton: ui_vue3_components_button.Button,
			BMenu: ui_system_menu_vue.BMenu,
			BIcon: ui_iconSet_api_vue.BIcon,
			BInput: ui_system_input_vue.BInput,
			HeadlineMd: ui_system_typography_vue.HeadlineMd,
			Duration: tasks_v2_component_elements_duration.Duration
		},
		inject: {
			task: {},
			taskId: {}
		},
		props: {
			reminderId: {
				type: [Number, String],
				required: true
			},
			title: {
				type: String,
				required: true
			},
			close: {
				type: Function,
				required: true
			}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline,
				ChipDesign: ui_system_chip_vue.ChipDesign,
				RemindBy: tasks_v2_const.RemindBy,
				remindersMeta,
				typeMenuId: `tasks-reminder-type-menu-${main_core.Text.getRandom()}`,
				viaMenuId: `tasks-reminder-via-menu-${main_core.Text.getRandom()}`,
				pickerPopupId: `tasks-reminder-picker-${main_core.Text.getRandom()}`
			};
		},
		data() {
			return {
				recipients: [tasks_v2_const.RemindTo.Responsible],
				remindBy: tasks_v2_const.RemindBy.Date,
				dateTs: null,
				duration: 0,
				remindVia: tasks_v2_const.RemindVia.Notification,
				dialogPopupId: null,
				isDialogShown: false,
				isPickerShown: false,
				isTypeMenuShown: false,
				isViaMenuShown: false,
				mountedMenuIds: []
			};
		},
		computed: {
			reminder() {
				return this.$store.getters[`${tasks_v2_const.Model.Reminders}/getById`](this.reminderId);
			},
			before() {
				return this.remindBy === tasks_v2_const.RemindBy.Deadline ? this.duration : null;
			},
			nextRemindTs() {
				return this.remindBy === tasks_v2_const.RemindBy.Date ? this.dateTs : this.task.deadlineTs - this.before;
			},
			typeMenuOptions() {
				return () => ({
					bindElement: this.$refs.type.$el,
					closeOnItemClick: false,
					items: Object.entries(remindersMeta.by).map(([remindBy, title]) => {
						const isDisabled = remindBy === tasks_v2_const.RemindBy.Deadline && !(this.task.deadlineTs > 0);
						return {
							title,
							isSelected: remindBy === this.remindBy,
							design: isDisabled ? ui_system_menu_vue.MenuItemDesign.Disabled : ui_system_menu_vue.MenuItemDesign.Default,
							onClick: () => {
								if (!isDisabled) {
									this.remindBy = remindBy;
									this.isTypeMenuShown = false;
								}
							}
						};
					}),
					targetContainer: document.body
				});
			},
			viaMenuOptions() {
				return () => ({
					bindElement: this.$refs.via.$el,
					items: Object.entries(remindersMeta.via).map(([remindVia, {
						title,
						icon
					}]) => {
						return {
							title,
							icon,
							isSelected: remindVia === this.remindVia,
							onClick: () => {
								this.remindVia = remindVia;
							}
						};
					}),
					targetContainer: document.body
				});
			},
			usersChips() {
				return this.recipients.map(id => ({
					id,
					design: ui_system_chip_vue.ChipDesign.Tinted,
					text: remindersMeta.to[id].title,
					withClear: true
				}));
			},
			triggers() {
				return [{
					ref: 'recipient',
					label: this.loc('TASKS_V2_REMINDERS_RECIPIENT'),
					inputValue: '',
					haspopup: 'dialog',
					controls: this.dialogPopupId,
					isOpen: this.isDialogShown,
					isExpanded: this.isDialogShown,
					open: () => this.showDialog({
						currentTarget: this.triggerEl('recipient')
					}),
					close: () => this.dialog?.hide()
				}, {
					ref: 'type',
					label: this.loc('TASKS_V2_REMINDERS_TYPE'),
					inputValue: remindersMeta.by[this.remindBy],
					haspopup: 'menu',
					controls: this.typeMenuId,
					isOpen: this.isTypeMenuShown,
					isExpanded: this.isMenuMounted(this.typeMenuId),
					open: () => {
						this.isTypeMenuShown = true;
					},
					close: () => {
						this.isTypeMenuShown = false;
					}
				}, {
					ref: 'date',
					label: this.loc('TASKS_V2_REMINDERS_REMIND_BY_DATE_TITLE'),
					inputValue: this.formatDate(this.dateTs),
					haspopup: 'dialog',
					controls: this.pickerPopupId,
					isOpen: this.isPickerShown,
					isExpanded: this.isPickerShown,
					open: () => this.showPicker({
						currentTarget: this.triggerEl('date')
					}),
					close: () => this.picker?.hide()
				}, {
					ref: 'via',
					label: this.loc('TASKS_V2_REMINDERS_SEND_VIA'),
					inputValue: remindersMeta.via[this.remindVia].title,
					haspopup: 'menu',
					controls: this.viaMenuId,
					isOpen: this.isViaMenuShown,
					isExpanded: this.isMenuMounted(this.viaMenuId),
					open: () => {
						this.isViaMenuShown = true;
					},
					close: () => {
						this.isViaMenuShown = false;
					}
				}];
			}
		},
		watch: {
			// The sheet body renders through a slot, so the component's own updated() hook
			// is not guaranteed to run; post-flush watchers sync after the DOM settles.
			triggers: {
				handler() {
					this.syncAria();
				},
				flush: 'post'
			}
		},
		created() {
			if (!this.reminder) {
				return;
			}
			this.recipients = [this.reminder.recipient];
			this.remindBy = this.reminder.remindBy;
			this.dateTs = this.reminder.nextRemindTs;
			this.remindVia = this.reminder.remindVia;
			if (this.reminder.remindBy === tasks_v2_const.RemindBy.Deadline) {
				this.duration = this.reminder.before ?? this.task.deadlineTs - this.reminder.nextRemindTs;
			}
		},
		mounted() {
			this.syncAria();
			this.observeTriggerAria();

			// main.popup closes the sheet from a capture-phase keyup listener on the document,
			// so an Escape that only dismisses a dropdown has to be claimed earlier: capture at
			// the window always runs before capture at the document, whatever the bind order.
			main_core.Event.bind(window, 'keyup', this.handleWindowKeyUp, true);
		},
		beforeUnmount() {
			this.triggerAriaObservers?.forEach(observer => observer.disconnect());
			main_core.Event.unbind(window, 'keyup', this.handleWindowKeyUp, true);
		},
		methods: {
			triggerEl(ref) {
				return this.$refs[ref]?.$el;
			},
			/**
			 * BMenu snapshots aria-expanded of its bind element when it mounts and puts that
			 * snapshot back when it is destroyed, so a trigger that already reads "true" while
			 * the menu is mounting gets "true" handed back onto the closed combobox and keeps
			 * it. A menu trigger may therefore report itself expanded only from the moment its
			 * menu is really mounted, never from the flag that mounts it.
			 */
			isMenuMounted(menuId) {
				return this.mountedMenuIds.includes(menuId);
			},
			handleMenuMounted(menuId) {
				this.mountedMenuIds = [...this.mountedMenuIds, menuId];
			},
			handleMenuUnmounted(menuId) {
				this.mountedMenuIds = this.mountedMenuIds.filter(id => id !== menuId);
			},
			/**
			 * A closed menu hands the aria-expanded it snapshotted on open back to the trigger
			 * once its popup is destroyed, past the closing animation. By then the trigger may
			 * already own a newer menu, so what it reports is whatever the gone menu remembered:
			 * the state is written again here, whoever overwrote it and whenever. Only a menu
			 * keeps such a snapshot, so the dialog and the picker triggers need no watching.
			 */
			observeTriggerAria() {
				this.triggerAriaObservers = [];
				const menuRefs = this.triggers.filter(trigger => trigger.haspopup === 'menu').map(trigger => trigger.ref);
				for (const ref of menuRefs) {
					const node = this.triggerEl(ref);
					if (!node) {
						continue;
					}
					const observer = new MutationObserver(() => {
						const {
							isExpanded
						} = this.triggers.find(trigger => trigger.ref === ref);
						if (node.getAttribute('aria-expanded') !== (isExpanded ? 'true' : 'false')) {
							this.syncAria();
						}
					});
					observer.observe(node, {
						attributeFilter: ['aria-expanded']
					});
					this.triggerAriaObservers.push(observer);
				}
			},
			/**
			 * The trigger is the input wrapper, not the inner input: BInput blurs the input
			 * on focus in the clickable mode, so a tab stop on it swallows the focus.
			 *
			 * A combobox reads its value off the text of its own subtree, so whatever is not
			 * the value has to leave the accessibility tree: the visible label would repeat
			 * the name in place of the value, and an input showing nothing adds its name on
			 * top of that. The recipient input is always empty - its value is the chips.
			 */
			syncAria() {
				for (const trigger of this.triggers) {
					const node = this.triggerEl(trigger.ref);
					const input = node?.querySelector('input');
					if (!input) {
						continue;
					}
					main_core.Dom.attr(node, 'role', 'combobox');
					main_core.Dom.attr(node, 'aria-label', trigger.label);
					main_core.Dom.attr(node, 'aria-haspopup', trigger.haspopup);
					main_core.Dom.attr(node, 'aria-expanded', trigger.isExpanded ? 'true' : 'false');
					main_core.Dom.attr(node, 'aria-controls', trigger.isExpanded ? trigger.controls : null);
					main_core.Dom.attr(node, 'tabindex', '0');
					main_core.Dom.attr(node.querySelector(VISIBLE_LABEL_SELECTOR), 'aria-hidden', 'true');
					main_core.Dom.attr(input, 'tabindex', '-1');
					main_core.Dom.attr(input, 'aria-hidden', trigger.inputValue ? null : 'true');
				}
			},
			handleKeydown(event, ref) {
				if (!OPEN_KEYS.includes(event.key)) {
					return;
				}
				const trigger = this.triggers.find(item => item.ref === ref);

				// Neither BMenu nor the open picker takes arrow navigation from here, so ArrowDown
				// has nothing to move: cancelling the page default would leave the key doing nothing.
				if (trigger.isOpen && event.key === 'ArrowDown') {
					return;
				}
				event.preventDefault();
				if (trigger.isOpen) {
					trigger.close();
					return;
				}
				trigger.open();
			},
			handleWindowKeyUp(event) {
				if (event.key !== 'Escape') {
					return;
				}
				const trigger = this.triggers.find(item => item.isOpen);
				if (!trigger) {
					return;
				}
				event.stopImmediatePropagation();
				trigger.close();
			},
			save() {
				const reminder = {
					id: this.reminderId || `tmp${Date.now()}`,
					taskId: this.taskId,
					userId: tasks_v2_core.Core.getParams().currentUser.id,
					nextRemindTs: this.nextRemindTs,
					remindBy: this.remindBy,
					remindVia: this.remindVia,
					recipient: this.recipients[0],
					before: this.before
				};
				if (this.reminderId) {
					void tasks_v2_provider_service_remindersService.remindersService.update(reminder);
				} else {
					void tasks_v2_provider_service_remindersService.remindersService.add(reminder);
				}
				this.close();
			},
			showDialog({
				currentTarget
			}) {
				this.isDialogShown = true;
				this.dialog ??= this.createDialog();
				const ids = this.recipients.map(id => [tasks_v2_const.EntitySelectorEntity.ReminderRecipient, id]);
				this.dialog.selectItemsByIds(ids);
				this.dialog.showTo(currentTarget);
			},
			createDialog() {
				const entityId = tasks_v2_const.EntitySelectorEntity.ReminderRecipient;
				const dialog = new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
					width: 400,
					height: 200,
					dropdownMode: true,
					multiple: false,
					entities: [{
						id: entityId
					}],
					items: Object.entries(remindersMeta.to).map(([id, {
						icon,
						title
					}]) => ({
						id,
						entityId,
						title,
						avatarOptions: {
							icon,
							iconColor: 'var(--ui-color-accent-main-primary)',
							bgColor: 'var(--ui-color-accent-soft-blue-2)'
						},
						tabs: ['recents']
					}))
				});

				// The popupOptions whitelist of ui.entity-selector drops id, so the popup names
				// itself; getPopup() builds it here and its node carries that id from then on.
				const popup = dialog.getPopup();
				this.dialogPopupId = popup.getId();
				popup.subscribeFromOptions({
					onClose: () => {
						this.recipients = dialog.getSelectedItems().map(item => item.getId());
						this.isDialogShown = false;
					}
				});
				return dialog;
			},
			handleUserClear(chip) {
				this.recipients = this.recipients.filter(id => id !== chip.id);
			},
			showPicker({
				currentTarget
			}) {
				this.picker ??= this.createPicker();
				this.picker.setTargetNode(currentTarget);
				this.picker.show();
			},
			createPicker() {
				const picker = new ui_datePicker.DatePicker({
					selectedDates: this.dateTs ? [this.dateTs + tasks_v2_lib_timezone.timezone.getOffset(this.dateTs)] : null,
					enableTime: true,
					defaultTime: tasks_v2_lib_calendar.calendar.dayStartTime,
					events: {
						[ui_datePicker.DatePickerEvent.SELECT]: event => {
							const {
								date
							} = event.getData();
							const dateTs = tasks_v2_lib_calendar.calendar.createDateFromUtc(date).getTime();
							this.dateTs = dateTs - tasks_v2_lib_timezone.timezone.getOffset(dateTs);
						},
						onShow: () => {
							this.isPickerShown = true;
						},
						onHide: () => {
							this.isPickerShown = false;
						}
					},
					popupOptions: {
						id: this.pickerPopupId,
						animation: 'fading',
						targetContainer: document.body
					}
				});
				picker.getPicker('day').subscribe('onSelect', () => picker.hide());
				let selectedHour = null;
				picker.getPicker('time').subscribe('onSelect', event => {
					const {
						hour,
						minute
					} = event.getData();
					if (Number.isInteger(minute) || hour === selectedHour) {
						picker.hide();
					}
					selectedHour = hour;
				});
				return picker;
			},
			handleDateClear() {
				this.picker?.deselectDate(this.dateTs + tasks_v2_lib_timezone.timezone.getOffset(this.dateTs));
				this.dateTs = null;
			},
			formatDate(timestamp) {
				return tasks_v2_lib_calendar.calendar.formatDateTime(timestamp);
			}
		},
		template: `
		<div class="tasks-field-reminder-sheet" data-testid="tasks-reminder-sheet">
			<div class="tasks-field-reminder-sheet-header">
				<HeadlineMd>{{ title }}</HeadlineMd>
				<button
					type="button"
					class="tasks-field-reminder-sheet-close"
					:aria-label="loc('TASKS_V2_REMINDERS_CLOSE_ARIA_LABEL')"
					data-testid="tasks-reminder-sheet-close-btn"
					@click="close"
				>
					<BIcon :name="Outline.CROSS_L" hoverable aria-hidden="true"/>
				</button>
			</div>
			<BInput
				:label="loc('TASKS_V2_REMINDERS_RECIPIENT')"
				:ariaLabel="loc('TASKS_V2_REMINDERS_RECIPIENT')"
				:placeholder="loc('TASKS_V2_REMINDERS_RECIPIENT_PLACEHOLDER')"
				:chips="usersChips"
				clickable
				:active="isDialogShown"
				ref="recipient"
				data-testid="tasks-reminders-recipient-input"
				@click="showDialog"
				@chipClear="handleUserClear"
				@keydown="handleKeydown($event, 'recipient')"
			/>
			<BInput
				:modelValue="remindersMeta.by[remindBy]"
				:label="loc('TASKS_V2_REMINDERS_TYPE')"
				:ariaLabel="loc('TASKS_V2_REMINDERS_TYPE')"
				dropdown
				clickable
				:active="isTypeMenuShown"
				ref="type"
				data-testid="tasks-reminders-type-select"
				@click="isTypeMenuShown = true"
				@keydown="handleKeydown($event, 'type')"
			/>
			<BInput
				v-if="remindBy === RemindBy.Date"
				:modelValue="formatDate(dateTs)"
				:label="loc('TASKS_V2_REMINDERS_REMIND_BY_DATE_TITLE')"
				:ariaLabel="loc('TASKS_V2_REMINDERS_REMIND_BY_DATE_TITLE')"
				:icon="Outline.CALENDAR_WITH_SLOTS"
				:withClear="dateTs > 0"
				clickable
				:active="isPickerShown"
				ref="date"
				data-testid="tasks-reminders-date-input"
				@clear="handleDateClear"
				@click="showPicker"
				@keydown="handleKeydown($event, 'date')"
			/>
			<Duration
				v-else
				v-model="duration"
				:label="loc('TASKS_V2_REMINDERS_REMIND_BY_DEADLINE_TITLE')"
				:unitAriaLabel="loc('TASKS_V2_REMINDERS_DURATION_UNIT_ARIA_LABEL')"
				data-testid="tasks-reminders-duration"
			/>
			<BInput
				:modelValue="remindersMeta.via[remindVia].title"
				:label="loc('TASKS_V2_REMINDERS_SEND_VIA')"
				:ariaLabel="loc('TASKS_V2_REMINDERS_SEND_VIA')"
				dropdown
				clickable
				:active="isViaMenuShown"
				ref="via"
				data-testid="tasks-reminders-via-select"
				@click="isViaMenuShown = true"
				@keydown="handleKeydown($event, 'via')"
			/>
			<div class="tasks-field-reminders-sheet-footer" data-testid="tasks-reminder-sheet-footer">
				<UiButton
					:text="loc('TASKS_V2_REMINDERS_SAVE')"
					:style="AirButtonStyle.PRIMARY"
					:size="ButtonSize.LARGE"
					:disabled="!nextRemindTs || !recipients.length"
					@click="save"
				/>
				<UiButton
					:text="loc('TASKS_V2_REMINDERS_CANCEL')"
					:style="AirButtonStyle.OUTLINE"
					:size="ButtonSize.LARGE"
					@click="close"
				/>
			</div>
		</div>
		<BMenu
			v-if="isTypeMenuShown"
			:id="typeMenuId"
			:options="typeMenuOptions()"
			@vue:mounted="handleMenuMounted(typeMenuId)"
			@vue:unmounted="handleMenuUnmounted(typeMenuId)"
			@close="isTypeMenuShown = false"
		/>
		<BMenu
			v-if="isViaMenuShown"
			:id="viaMenuId"
			:options="viaMenuOptions()"
			@vue:mounted="handleMenuMounted(viaMenuId)"
			@vue:unmounted="handleMenuUnmounted(viaMenuId)"
			@close="isViaMenuShown = false"
		/>
	`
	};

	// @vue/component
	const ReminderSheet = {
		name: 'TaskReminderSheet',
		components: {
			BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
			ReminderSheetContent
		},
		props: {
			reminderId: {
				type: [Number, String],
				default: 0
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			title() {
				return this.reminderId ? this.loc('TASKS_V2_REMINDERS_UPDATE_SHEET') : this.loc('TASKS_V2_REMINDERS_ADD_SHEET');
			}
		},
		template: `
		<BottomSheet :sheetBindProps :ariaLabel="title" @close="$emit('close')">
			<ReminderSheetContent
				:reminderId
				:title
				:close="() => $emit('close')"
			/>
		</BottomSheet>
	`
	};

	// @vue/component
	const ListItem = {
		name: 'TasksRemindersListItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TextXs: ui_system_typography_vue.TextXs,
			TextMd: ui_system_typography_vue.TextMd,
			ReminderSheet
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			task: {}
		},
		props: {
			reminderId: {
				type: [Number, String],
				required: true
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		emits: ['edit'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				remindersMeta
			};
		},
		data() {
			return {
				isSheetShown: false
			};
		},
		computed: {
			reminder() {
				return this.$store.getters[`${tasks_v2_const.Model.Reminders}/getById`](this.reminderId);
			},
			reminderDate() {
				const remindByDeadline = this.reminder.remindBy === tasks_v2_const.RemindBy.Deadline;
				const before = this.reminder.before ?? this.task.deadlineTs - this.reminder.nextRemindTs;
				const dateTs = remindByDeadline ? this.task.deadlineTs - before : this.reminder.nextRemindTs;
				const format = main_core.Loc.getMessage('TASKS_V2_DATE_TIME_FORMAT', {
					'#DATE#': main_date.DateTimeFormat.getFormat('FORMAT_DATE'),
					'#TIME#': main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT')
				});
				return main_date.DateTimeFormat.format(format, (dateTs + tasks_v2_lib_timezone.timezone.getOffset(dateTs)) / 1000);
			},
			recipient() {
				return remindersMeta.to[this.reminder.recipient];
			},
			viaTooltip() {
				return () => tasks_v2_component_elements_hint.tooltip({
					text: remindersMeta.via[this.reminder.remindVia].title,
					popupOptions: {
						offsetLeft: this.$refs.via.$el.offsetWidth / 2
					}
				});
			},
			editTooltip() {
				return () => tasks_v2_component_elements_hint.tooltip({
					text: this.loc('TASKS_V2_REMINDERS_LIST_ACTION_EDIT'),
					popupOptions: {
						offsetLeft: this.$refs.edit.offsetWidth / 2
					}
				});
			},
			removeTooltip() {
				return () => tasks_v2_component_elements_hint.tooltip({
					text: this.loc('TASKS_V2_REMINDERS_LIST_ACTION_REMOVE'),
					popupOptions: {
						offsetLeft: this.$refs.remove.offsetWidth / 2
					}
				});
			}
		},
		methods: {
			removeItem() {
				void tasks_v2_provider_service_remindersService.remindersService.delete(this.reminderId);
			}
		},
		template: `
		<div class="tasks-field-reminders-row" data-testid="tasks-reminders-list-item">
			<div class="tasks-field-reminders-column --via">
				<BIcon v-hint="viaTooltip" :name="remindersMeta.via[reminder.remindVia].icon" ref="via"/>
			</div>
			<div class="tasks-field-reminders-column --date">
				<TextMd>{{ reminderDate }}</TextMd>
			</div>
			<div class="tasks-field-reminders-column --recipients">
				<div class="tasks-field-reminders-to">
					<BIcon :name="recipient.icon"/>
				</div>
				<TextMd>{{ recipient.title }}</TextMd>
			</div>
			<div class="tasks-field-reminders-column --action">
				<button
					type="button"
					class="tasks-field-reminders-action"
					:aria-label="loc('TASKS_V2_REMINDERS_LIST_ACTION_EDIT')"
					data-testid="tasks-reminders-edit-btn"
					ref="edit"
					@click="isSheetShown = true"
				>
					<BIcon v-hint="editTooltip" :name="Outline.EDIT_L" hoverable aria-hidden="true"/>
				</button>
				<button
					type="button"
					class="tasks-field-reminders-action"
					:aria-label="loc('TASKS_V2_REMINDERS_LIST_ACTION_REMOVE')"
					data-testid="tasks-reminders-remove-btn"
					ref="remove"
					@click="removeItem"
				>
					<BIcon v-hint="removeTooltip" :name="Outline.TRASHCAN" hoverable aria-hidden="true"/>
				</button>
			</div>
		</div>
		<ReminderSheet
			v-if="isSheetShown"
			:reminderId
			:sheetBindProps
			@close="isSheetShown = false"
		/>
	`
	};

	// @vue/component
	const ListItemSkeleton = {
		components: {
			BLine: ui_system_skeleton_vue.BLine
		},
		template: `
		<div class="tasks-field-reminders-row">
			<div class="tasks-field-reminders-column --via">
				<BLine :width="20" :height="20"/>
			</div>
			<div class="tasks-field-reminders-column --date">
				<BLine :width="160" :height="20"/>
			</div>
			<div class="tasks-field-reminders-column --recipients">
				<BLine :width="187" :height="20"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const List = {
		name: 'TasksRemindersList',
		components: {
			ListHeader,
			ListItem,
			ListItemSkeleton
		},
		inject: {
			taskId: {}
		},
		props: {
			numbers: {
				type: Number,
				required: true
			},
			loading: {
				type: Boolean,
				required: true
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		computed: {
			remindersIds() {
				return this.$store.getters[`${tasks_v2_const.Model.Reminders}/getIds`](this.taskId, tasks_v2_core.Core.getParams().currentUser.id);
			}
		},
		template: `
		<div class="tasks-field-reminders-list">
			<div class="tasks-field-reminders-list-header">
				<ListHeader/>
			</div>
			<div class="tasks-field-reminders-list-content">
				<template v-if="loading">
					<ListItemSkeleton v-for="key in numbers" :key/>
				</template>
				<template v-else v-for="reminderId in remindersIds" :key="reminderId">
					<ListItem :reminderId :sheetBindProps/>
				</template>
			</div>
		</div>
	`
	};

	// @vue/component
	const RemindersSheet = {
		name: 'TasksRemindersSheet',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
			HeadlineMd: ui_system_typography_vue.HeadlineMd,
			List,
			UiButton: ui_vue3_components_button.Button,
			ReminderSheet
		},
		inject: {
			task: {},
			taskId: {}
		},
		props: {
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				ButtonIcon: ui_vue3_components_button.ButtonIcon,
				ButtonColor: ui_vue3_components_button.ButtonColor,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isLoading: true,
				isSheetShown: false
			};
		},
		async mounted() {
			await tasks_v2_provider_service_remindersService.remindersService.list(this.taskId);
			this.isLoading = false;
		},
		template: `
		<BottomSheet
			:sheetBindProps
			:ariaLabel="loc('TASKS_V2_REMINDERS_TITLE_SHEET')"
			@close="$emit('close')"
		>
			<div class="tasks-field-reminders-sheet" data-testid="tasks-reminders-sheet">
				<div class="tasks-field-reminders-sheet-header">
					<HeadlineMd>{{ loc('TASKS_V2_REMINDERS_TITLE_SHEET') }}</HeadlineMd>
					<button
						type="button"
						class="tasks-field-reminders-sheet-close"
						:aria-label="loc('TASKS_V2_REMINDERS_CLOSE_ARIA_LABEL')"
						data-testid="tasks-reminders-sheet-close-btn"
						@click="$emit('close')"
					>
						<BIcon :name="Outline.CROSS_L" hoverable aria-hidden="true"/>
					</button>
				</div>
				<div class="tasks-field-reminders-sheet-content">
					<List
						:numbers="task.numberOfReminders"
						:loading="isLoading"
						:sheetBindProps
					/>
				</div>
				<div class="tasks-field-reminders-sheet-footer" data-testid="tasks-reminders-sheet-footer">
					<UiButton
						:text="loc('TASKS_V2_REMINDERS_ADD')"
						:size="ButtonSize.SMALL"
						:leftIcon="ButtonIcon.ADD"
						:style="AirButtonStyle.TINTED"
						@click="isSheetShown = true"
					/>
				</div>
			</div>
		</BottomSheet>
		<ReminderSheet
			v-if="isSheetShown"
			:sheetBindProps
			@close="isSheetShown = false"
		/>
	`
	};

	// @vue/component
	const Reminders = {
		name: 'TasksReminders',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TextMd: ui_system_typography_vue.TextMd,
			RemindersSheet,
			ReminderSheet
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			task: {},
			taskId: {}
		},
		props: {
			isSheetShown: {
				type: Boolean,
				required: true
			},
			isListSheetShown: {
				type: Boolean,
				required: true
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		setup() {
			return {
				remindersMeta,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			text() {
				return this.loc('TASKS_V2_REMINDERS_TITLE', {
					'#NUMBER#': this.task.numberOfReminders
				});
			},
			readonly() {
				return !this.task.rights.reminder;
			},
			tooltip() {
				return () => tasks_v2_component_elements_hint.tooltip({
					text: this.loc('TASKS_V2_REMINDERS_ADD'),
					popupOptions: {
						offsetLeft: this.$refs.add.offsetWidth / 2
					}
				});
			}
		},
		methods: {
			setSheetShown(isShown) {
				this.$emit('update:isSheetShown', isShown);
			},
			setListSheetShown(isShown) {
				this.$emit('update:isListSheetShown', isShown);
			}
		},
		template: `
		<div class="tasks-field-reminders" :data-task-id="taskId" :data-task-field-id="remindersMeta.id" data-testid="tasks-reminders">
			<div class="tasks-field-reminders-title">
				<button
					type="button"
					class="tasks-field-reminders-main"
					:class="{ '--readonly': readonly }"
					ref="title"
					aria-haspopup="dialog"
					:aria-expanded="isListSheetShown"
					data-testid="tasks-reminders-open-btn"
					@click="setListSheetShown(true)"
				>
					<BIcon :name="Outline.NOTIFICATION" aria-hidden="true"/>
					<TextMd accent>{{ text }}</TextMd>
				</button>
				<div
					v-if="!readonly"
					v-hint="tooltip"
					class="tasks-field-reminders-edit-container"
				>
					<button
						type="button"
						class="tasks-field-reminders-icon"
						:aria-label="loc('TASKS_V2_REMINDERS_ADD')"
						aria-haspopup="dialog"
						:aria-expanded="isSheetShown"
						data-testid="tasks-reminders-add-btn"
						ref="add"
						@click="setSheetShown(true)"
					>
						<BIcon :name="Outline.PLUS_L" hoverable aria-hidden="true"/>
					</button>
				</div>
			</div>
		</div>
		<ReminderSheet
			v-if="isSheetShown"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
		<RemindersSheet
			v-if="isListSheetShown"
			:sheetBindProps
			@close="setListSheetShown(false)"
		/>
	`
	};

	// @vue/component
	const RemindersChip = {
		name: 'TasksRemindersChip',
		components: {
			Chip: ui_system_chip_vue.Chip,
			ReminderSheet
		},
		inject: {
			task: {},
			taskId: {}
		},
		props: {
			isSheetShown: {
				type: Boolean,
				required: true
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		emits: ['update:isSheetShown'],
		setup() {
			return {
				remindersMeta,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			design() {
				return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
			},
			isSelected() {
				return this.task.filledFields[remindersMeta.id];
			},
			opensSheet() {
				return !this.isSelected;
			}
		},
		watch: {
			isSheetShown() {
				this.syncAria();
			},
			opensSheet() {
				this.syncAria();
			}
		},
		mounted() {
			this.syncAria();
		},
		methods: {
			syncAria() {
				const el = this.$refs.chip?.$el;
				if (!el) {
					return;
				}
				main_core.Dom.attr(el, 'role', 'button');
				main_core.Dom.attr(el, 'aria-haspopup', this.opensSheet ? 'dialog' : null);
				main_core.Dom.attr(el, 'aria-expanded', this.opensSheet ? String(this.isSheetShown) : null);
			},
			handleClick() {
				if (this.isSelected) {
					this.highlightField();
					return;
				}
				this.setSheetShown(true);
			},
			handleKeydown(event) {
				if (event.key !== ' ') {
					return;
				}
				event.preventDefault();
				this.handleClick();
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(remindersMeta.id);
			},
			setSheetShown(isShown) {
				this.$emit('update:isSheetShown', isShown);
			}
		},
		template: `
		<Chip
			v-if="isSelected || task.rights.reminder"
			:design
			:icon="Outline.NOTIFICATION"
			:text="loc('TASKS_V2_REMINDERS_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="remindersMeta.id"
			data-testid="tasks-reminders-chip"
			ref="chip"
			@click="handleClick"
			@keydown="handleKeydown"
		/>
		<ReminderSheet
			v-if="isSheetShown"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
	`
	};

	exports.Reminders = Reminders;
	exports.RemindersChip = RemindersChip;
	exports.RemindersSheet = RemindersSheet;
	exports.remindersMeta = remindersMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX.Vue3.Directives, BX.UI.System.Typography.Vue, BX.UI.IconSet, window, BX.Tasks.V2.Component.Elements, BX, BX.Tasks.V2.Const, BX.Vue3.Components, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Provider.Service, BX.Tasks.V2, BX.Main, BX.Tasks.V2.Lib, BX.UI.DatePicker, BX.UI.System.Chip.Vue, BX.UI.System.Input.Vue, BX.UI.System.Menu, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.UI.System.Skeleton.Vue, BX.Tasks.V2.Lib);
//# sourceMappingURL=reminders.bundle.js.map
