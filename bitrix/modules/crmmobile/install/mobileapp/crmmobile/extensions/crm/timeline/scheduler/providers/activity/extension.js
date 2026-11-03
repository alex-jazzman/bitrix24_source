/**
 * @module crm/timeline/scheduler/providers/activity
 */
jn.define('crm/timeline/scheduler/providers/activity', (require, exports, module) => {
	const { Text6 } = require('ui-system/typography/text');
	include('InAppNotifier');

	const { Typography } = require('tokens');
	const { Loc } = require('loc');
	const { Haptics } = require('haptics');
	const { Icon } = require('assets/icons');
	const { Color } = require('tokens');
	const { IconView } = require('ui-system/blocks/icon');
	const AppTheme = require('apptheme');
	const { TimelineSchedulerBaseProvider } = require('crm/timeline/scheduler/providers/base');
	const { ResponsibleSelector } = require('crm/timeline/services/responsible-selector');
	const { Toolbar, ToolbarIcon, ToolbarButton } = require('crm/timeline/ui/toolbar');
	const { WidgetHeaderButton } = require('layout/ui/widget-header-button');
	const { Textarea } = require('layout/ui/textarea');
	const { FileField } = require('layout/ui/fields/file');
	const { Moment } = require('utils/date');
	const { datetime } = require('utils/date/formats');
	const { WorkTimeMoment } = require('crm/work-time');
	const { get } = require('utils/object');
	const { ItemSelector } = require('layout/ui/item-selector');
	const { DatePill } = require('layout/ui/date-pill');
	const { debounce } = require('utils/function');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { clone } = require('utils/object');

	const INITIAL_HEIGHT = 1000;
	const ATTACH_BADGE_ICON_SIZE = 26;
	const ROW_ICON_SIZE = 24;
	const ROW_ICON_GAP = 9;
	const ROW_PADDING_HORIZONTAL = 16;

	const isAndroid = Application.getPlatform() === 'android';

	/**
	 * @class TimelineSchedulerActivityProvider
	 */
	class TimelineSchedulerActivityProvider extends TimelineSchedulerBaseProvider
	{
		constructor(props)
		{
			super(props);

			this.state = {
				text: this.getInitialText(),
				files: [],
				user: props.user,
				maxHeight: INITIAL_HEIGHT,
				selectedReminders: this.entity.reminders?.selectedValues,
			};

			this.initialDeadline = this.initDeadline();
			this.deadline = this.initialDeadline;

			this.mounted = false;

			this.textInputRef = null;

			/** @type {FileField|null} */
			this.fileFieldRef = null;

			this.saveButton = new WidgetHeaderButton({
				widget: this.layout,
				text: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_ACTIVITY_SAVE'),
				loadingText: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_ACTIVITY_SAVE_PROGRESS'),
				disabled: !this.isSaveAllowed(),
				onClick: () => this.save(),
			});

			this.deadlineRef = null;
			/** @type {ToolbarButton|null} */
			this.createButtonRef = null;

			this.openResponsibleUserSelector = this.openResponsibleUserSelector.bind(this);
			this.updateResponsibleUser = this.updateResponsibleUser.bind(this);
			this.updateDeadline = this.updateDeadline.bind(this);
			this.onChangeSelectedReminders = this.onChangeSelectedReminders.bind(this);
			this.refreshSaveButtonDebounced = debounce(this.refreshSaveButton, 500, this);
		}

		componentDidMount()
		{
			super.componentDidMount();

			this.mounted = true;

			this.focus();
		}

		static getId()
		{
			return 'todo';
		}

		static getTitle()
		{
			return Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_ACTIVITY_TITLE');
		}

		static getMenuTitle()
		{
			return Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_ACTIVITY_MENU_FULL_TITLE');
		}

		static getMenuShortTitle()
		{
			return Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_ACTIVITY_MENU_TITLE');
		}

		static getMenuIcon()
		{
			return Icon.TASK;
		}

		static getDefaultPosition()
		{
			return 1;
		}

		/**
		 * @return {object}
		 */
		static getBackdropParams()
		{
			return {
				showOnTop: false,
				onlyMediumPosition: true,
				mediumPositionPercent: 80,
			};
		}

		static isSupported(context = {})
		{
			return true;
		}

		initDeadline()
		{
			const { scheduleTs } = this.context;
			let deadline;
			if (scheduleTs)
			{
				deadline = Moment.createFromTimestamp(scheduleTs);
			}
			else
			{
				const workTimeMoment = new WorkTimeMoment();
				deadline = workTimeMoment.getNextWorkingDay(3).moment;
				deadline = deadline.addHours(1).startOfHour;
			}

			return deadline;
		}

		getInitialText()
		{
			return '';
		}

		hasUploadingFiles()
		{
			if (!this.fileFieldRef)
			{
				return false;
			}

			return this.fileFieldRef.hasUploadingFiles();
		}

		isFilesFieldValid()
		{
			if (!this.fileFieldRef)
			{
				return true;
			}

			return this.fileFieldRef.validate();
		}

		render()
		{
			return View(
				{
					style: {
						flexDirection: 'column',
						flex: 1,
					},
					resizableByKeyboard: true,
				},
				View(
					{
						style: {
							flex: 1,
							backgroundColor: AppTheme.colors.bgContentPrimary,
							borderTopLeftRadius: 12,
							borderTopRightRadius: 12,
							maxHeight: this.state.maxHeight,
						},
						onLayout: ({ height }) => this.setMaxHeight(height),
					},
					this.renderTextField(),
					this.renderAttachments(),
					this.renderReminders(),
					this.renderBottom(),
				),
				// this.renderToolbar(),
			);
		}

		setMaxHeight(height)
		{
			const { maxHeight } = this.state;
			const newMaxHeight = Math.ceil(Math.min(height, maxHeight));

			if (newMaxHeight < maxHeight)
			{
				this.setState({ maxHeight: newMaxHeight });
			}
		}

		renderTextField()
		{
			const isIOS = Application.getPlatform() === 'ios';

			return View(
				{
					style: {
						flex: 1,
						paddingLeft: isIOS ? 8 : 0,
					},
				},
				Textarea({
					testId: 'TimelineProviderActivityTextarea',
					ref: (ref) => {
						this.textInputRef = ref;
					},
					text: this.state.text,
					placeholder: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_ACTIVITY_PLACEHOLDER'),
					onChange: (text) => {
						this.state.text = text;
						this.refreshSaveButton();
					},
				}),
			);
		}

		renderAttachments()
		{
			return View(
				{
					style: {
						paddingHorizontal: isAndroid ? 16 : 12,
						display: 'none',
						paddingBottom: 12,
					},
				},
				FileField({
					testId: 'TimelineProviderActivityFileField',
					ref: (ref) => this.fileFieldRef = ref,
					showTitle: false,
					showAddButton: false,
					hasHiddenEmptyView: true,
					multiple: true,
					value: [],
					config: {
						fileInfo: {},
						mediaType: 'file',
						parentWidget: this.layout,
						controller: {
							endpoint: 'crm.FileUploader.TodoActivityUploaderController',
							options: {
								entityTypeId: this.entity.typeId,
								entityId: this.entity.id,
								activityId: null,
							},
						},
					},
					readOnly: false,
					onChange: (files) => {
						files = Array.isArray(files) ? files : [];
						this.setState({ files }, () => {
							this.refreshSaveButtonDebounced();
						});
					},
				}),
			);
		}

		renderReminders()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: ROW_PADDING_HORIZONTAL,
						paddingBottom: 14,
					},
				},
				View(
					{
						style: { marginRight: ROW_ICON_GAP },
					},
					IconView({
						testId: 'TimelineProviderActivityReminders_icon',
						icon: Icon.ALARM,
						size: ROW_ICON_SIZE,
						color: Color.base4,
					}),
				),
				new ItemSelector({
					fontSize: Typography.text4.getValue().fontSize,
					imageSize: 14,
					value: this.entity.reminders?.selectedValues,
					ref: (ref) => {
						this.selectorRef = ref;
					},
					inline: true,
					valuesList: this.entity.reminders.valuesList,
					emptyState: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_REMINDERS_EMPTY'),
					layout: this.layout,
					selectorTitle: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_REMINDERS_TITLE_MSGVER_1'),
				}),
			);
		}

		onChangeSelectedReminders(selectedValues)
		{
			this.setState({ selectedReminders: selectedValues.map((item) => Number(item)) });
		}

		renderDeadline()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				View(
					{
						style: { marginRight: ROW_ICON_GAP },
					},
					IconView({
						testId: 'TimelineProviderActivityDeadline_icon',
						icon: Icon.CALENDAR_WITH_SLOTS,
						size: ROW_ICON_SIZE,
						color: Color.base4,
					}),
				),
				View(
					{
						testId: 'TimelineProviderActivityDeadline',
						style: {
							flexDirection: 'row',
							justifyContent: 'center',
							alignItems: 'center',
						},
					},
					new DatePill({
						textColor: Color.base3,
						backgroundColor: AppTheme.colors.bgContentTertiary,
						fontSize: Typography.text4.getValue().fontSize,
						imageSize: 14,
						fontWeight: 500,
						isReadonly: false,
						value: this.deadline.timestamp,
						withTime: true,
						onChange: this.updateDeadline,
						ref: (ref) => {
							this.deadlineRef = ref;
						},
					}),
				),
			);
		}

		renderBottom()
		{
			if (!this.deadline)
			{
				return null;
			}

			return View(
				{
					style: {
						alignItems: 'center',
						flexDirection: 'row',
						justifyContent: 'space-between',
						paddingHorizontal: ROW_PADDING_HORIZONTAL,
						paddingBottom: 14,
					},
				},
				this.renderDeadline(),
				View(
					{
						style: {
							flexDirection: 'row',
						},
					},
					this.renderAttachButton(),
					this.renderResponsibleButton(),
				),
			);
		}

		updateDeadline()
		{
			this.deadline = this.deadlineRef.getMoment();
		}

		renderMenuButton()
		{
			return null;
		}

		renderAttachButton()
		{
			const attachedFilesCount = this.state.files.length;

			return View(
				{
					style: {
						alignSelf: 'center',
						justifyContent: 'center',
						alignItems: 'center',
						paddingHorizontal: 8,
						paddingVertical: 4,
						flexDirection: 'row',
					},
					testId: 'TimelineProviderActivityAttachButton',
					onClick: () => {
						if (this.fileFieldRef)
						{
							if (attachedFilesCount === 0)
							{
								this.fileFieldRef.openFilePicker();
							}
							else
							{
								this.fileFieldRef.onOpenAttachmentList();
							}
						}
					},
				},
				View(
					{
						testId: 'TimelineProviderActivityAttachButtonCounter',
						style: {
							borderRadius: 500,
							backgroundColor: AppTheme.colors.accentBrandBlue,
							position: attachedFilesCount === 0 ? 'relative' : 'absolute',
							display: attachedFilesCount === 0 ? 'none' : 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							minWidth: 16,
							height: 16,
							paddingHorizontal: 3,
							paddingVertical: 0,
							top: 0,
							right: -12,
							marginRight: 12,
						},
					},
					Text6(
						{
							style: {
								color: AppTheme.colors.baseWhiteFixed,
								fontWeight: 500,
								textAlign: 'center',
							},
							text: attachedFilesCount.toString(),
						},
					),
				),
				IconView({
					testId: 'TimelineSchedulerActivityAttachedFiles_icon',
					icon: Icon.ATTACH,
					size: ATTACH_BADGE_ICON_SIZE,
					color: Color.base3,
				}),
			);
		}

		renderVerticalSeparator()
		{
			return View(
				{
					style: {
						width: 1,
						paddingVertical: 3,
						marginHorizontal: 4,
					},
				},
				View(
					{
						style: {
							backgroundColor: AppTheme.colors.bgSeparatorPrimary,
							flex: 1,
						},
					},
				),
			);
		}

		renderResponsibleButton()
		{
			const { user } = this.state;
			if (!user)
			{
				return null;
			}

			const { userId, title, imageUrl } = user;
			const testId = 'TimelineSchedulerActivityResponsibleUser';

			return Avatar({
				id: userId,
				testId,
				size: 26,
				name: title,
				uri: imageUrl,
				withRedux: true,
				style: {
					alignSelf: 'center',
					paddingHorizontal: 8,
					paddingVertical: 4,
				},
				onClick: this.openResponsibleUserSelector,
			});
		}

		openResponsibleUserSelector()
		{
			ResponsibleSelector.show({
				onSelectedUsers: this.updateResponsibleUser,
				onSelectorHidden: () => this.focus(),
				responsibleId: this.userId,
				layout: this.layout,
			});
		}

		updateResponsibleUser(selectedUsers)
		{
			const selectedUser = selectedUsers[0];

			/** @type {TimelineUserProps} */
			const user = {
				imageUrl: encodeURI(selectedUser.imageUrl),
				title: selectedUser.title,
				userId: selectedUser.id,
			};

			this.setState({ user });
		}

		get userId()
		{
			return get(this.state, 'user.userId', null);
		}

		renderToolbar()
		{
			return Toolbar({
				right: () => new ToolbarButton({
					ref: (ref) => {
						this.createButtonRef = ref;
					},
					testId: 'TimelineSchedulerActivitySave',
					text: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_ACTIVITY_SAVE'),
					loadingText: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_ACTIVITY_SAVE_PROGRESS'),
					disabled: !this.isSaveAllowed(),
					onClick: () => this.save(),
				}),
				center: () => View(
					{
						style: { flexDirection: 'row' },
					},
					ToolbarIcon({
						testId: 'TimelineSchedulerActivityAttach',
						icon: Icon.ATTACH,
						onClick: () => {
							if (this.fileFieldRef)
							{
								this.fileFieldRef.openFilePicker();
							}
							else
							{
								InAppNotifier.showNotification({
									title: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_ATTACHMENTS_TITLE'),
									message: `${Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_ATTACHMENTS_BODY')} 😉`,
									time: 3,
									backgroundColor: AppTheme.colors.accentSoftElementBlue1,
									blur: true,
									code: 'attach_hint',
								});
							}
						},
					}),
					ToolbarIcon({
						testId: 'TimelineSchedulerActivityVoiceNote',
						icon: Icon.MICROPHONE_ON,
						onClick: () => {
							InAppNotifier.showNotification({
								title: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_VOICE_NOTES_TITLE'),
								message: `${Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_VOICE_NOTES_BODY')} 😉`,
								time: 3,
								backgroundColor: AppTheme.colors.accentSoftElementBlue1,
								blur: true,
								code: 'voice_hint',
							});
						},
					}),
				),
			});
		}

		focus()
		{
			if (this.textInputRef)
			{
				this.textInputRef.focus();
			}
		}

		isSaveAllowed()
		{
			return this.state.text.length > 0 && !this.hasUploadingFiles() && this.isFilesFieldValid();
		}

		refreshSaveButton()
		{
			if (this.isSaveAllowed())
			{
				this.saveButton.enable();
			}
			else
			{
				this.saveButton.disable();
			}
		}

		save()
		{
			return new Promise((resolve, reject) => {
				const { text, files, user } = this.state;
				const { activityId } = this.context;
				const description = text.trim();

				const analyticsEvent = this.prepareAnalyticsEvent(
					{ files, description },
				);

				let responsibleId = null;

				if (user && user.userId)
				{
					responsibleId = user.userId;
				}

				const data = {
					responsibleId,
					ownerTypeId: this.entity.typeId,
					ownerId: this.entity.id,
					description,
					deadline: this.deadlineRef?.getMoment().format(datetime()),
					fileTokens: files.map((file) => file.token).filter(Boolean),
					parentActivityId: activityId || null,
					pingOffsets: this.#getSelectedReminders(),
				};

				BX.ajax.runAction('crm.activity.todo.add', {
					data,
					analyticsLabel: analyticsEvent?.exportToObject(),
				})
					.then((response) => {
						resolve(response);
						Haptics.notifySuccess();
						this.onActivityCreate(response);
						this.close();
					})
					.catch((response) => {
						void ErrorNotifier.showError(response.errors[0].message);
						reject(response);
					});
			});
		}

		#getSelectedReminders()
		{
			return this.selectorRef.getSelectedValues();
		}

		prepareAnalyticsEvent(context = {})
		{
			if (!this.props.analytics)
			{
				return null;
			}

			const analyticsEvent = clone(this.props.analytics);

			analyticsEvent
				.setEvent('activity_create')
				.setElement('create_button')
				.exportToObject()
			;

			if (context.description.length > 0)
			{
				analyticsEvent.setP5('description');
			}

			if (!this.#arePingsEqual(this.#getSelectedReminders(), this.entity.reminders.selectedValues))
			{
				analyticsEvent.setP2('ping_custom');
			}

			const p4Part1 = context.files.length > 0 ? 'addBlock_1' : '';
			const p4Part2 = this.deadline.timestamp === this.initialDeadline.timestamp ? '' : 'calendarCustom';

			if (p4Part1 !== '' || p4Part2 !== '')
			{
				analyticsEvent.setP4(`${p4Part1}${p4Part1 !== '' && p4Part2 !== '' ? ',' : ''}${p4Part2}`);
			}

			return analyticsEvent;
		}

		#arePingsEqual(a, b)
		{
			const setA = new Set(a.map(Number));
			const setB = new Set(b.map(Number));

			if (setA.size !== setB.size)
			{
				return false;
			}

			for (const value of setA)
			{
				if (!setB.has(value))
				{
					return false;
				}
			}

			return true;
		}
	}

	module.exports = { TimelineSchedulerActivityProvider };
});
