/**
 * @module crm/timeline/scheduler/providers/comment
 */
jn.define('crm/timeline/scheduler/providers/comment', (require, exports, module) => {
	include('InAppNotifier');

	const { Loc } = require('loc');
	const { Haptics } = require('haptics');
	const AppTheme = require('apptheme');
	const { TimelineSchedulerBaseProvider } = require('crm/timeline/scheduler/providers/base');
	const {
		Toolbar,
		ToolbarIcon,
		ToolbarButton,
	} = require('crm/timeline/ui/toolbar');
	const { Icon } = require('assets/icons');
	const { Color } = require('tokens');
	const { Textarea } = require('layout/ui/textarea');
	const { FileField } = require('layout/ui/fields/file');
	const { EntitySelectorFactory } = require('selector/widget/factory');

	const isAndroid = Application.getPlatform() === 'android';

	/**
	 * @class TimelineSchedulerCommentProvider
	 */
	class TimelineSchedulerCommentProvider extends TimelineSchedulerBaseProvider
	{
		constructor(props)
		{
			super(props);

			this.state = {
				text: '',
				files: [],
			};

			this.textInputRef = null;

			/** @type {Fields.FileField|null} */
			this.fileFieldRef = null;

			/** @type {ToolbarButton|null} */
			this.createButtonRef = null;
		}

		static getId()
		{
			return 'comment';
		}

		static getTitle()
		{
			return Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_COMMENT_TITLE');
		}

		static getMenuTitle()
		{
			return Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_COMMENT_MENU_FULL_TITLE');
		}

		static getMenuShortTitle()
		{
			return Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_COMMENT_MENU_TITLE');
		}

		/**
		 * @returns {Icon}
		 */
		static getMenuIcon()
		{
			return Icon.MESSAGE;
		}

		static getDefaultPosition()
		{
			return 2;
		}

		static isSupported(context = {})
		{
			return true;
		}

		componentDidMount()
		{
			super.componentDidMount();

			this.focus();
		}

		hasUploadingFiles()
		{
			if (!this.fileFieldRef)
			{
				return false;
			}

			return this.fileFieldRef.hasUploadingFiles();
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
						flexDirection: 'column',
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
						},
					},
					this.renderTextField(),
					this.renderAttachments(),
					this.renderToolbar(),
				),
			);
		}

		renderTextField()
		{
			return View(
				{
					style: {
						flex: 1,
						paddingLeft: isAndroid ? 0 : 8,
					},
				},
				Textarea({
					ref: (ref) => {
						this.textInputRef = ref;
					},
					testId: 'TimelineProviderCommentTextarea',
					text: this.state.text,
					placeholder: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_COMMENT_PLACEHOLDER_2'),
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
						paddingHorizontal: 20,
						display: this.state.files.length === 0 ? 'none' : 'flex',
						flexShrink: 1,
					},
				},
				FileField({
					ref: (ref) => {
						this.fileFieldRef = ref;
					},
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
							endpoint: 'disk.Uf.Integration.DiskUploaderController',
						},
					},
					readOnly: false,
					onChange: (files) => {
						files = Array.isArray(files) ? files : [];
						this.setState({ files }, () => this.refreshSaveButton());
					},
				}),
			);
		}

		renderToolbar()
		{
			return Toolbar({
				right: () => new ToolbarButton({
					ref: (ref) => {
						this.createButtonRef = ref;
					},
					testId: 'TimelineSchedulerCommentCreate',
					text: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_COMMENT_CREATE'),
					loadingText: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_COMMENT_CREATE_PROGRESS'),
					disabled: !this.isSaveAllowed(),
					onClick: () => this.save(),
				}),
				center: () => View(
					{
						style: { flexDirection: 'row' },
					},
					ToolbarIcon({
						testId: 'TimelineSchedulerCommentAttach',
						icon: Icon.ATTACH,
						solid: true,
						color: Color.base5,
						onClick: () => this.fileFieldRef && this.fileFieldRef.openFilePicker(),
					}),
					ToolbarIcon({
						testId: 'TimelineSchedulerCommentMention',
						icon: Icon.MENTION,
						solid: true,
						color: Color.base5,
						onClick: () => this.openUserSelector(),
					}),
				),
			});
		}

		openUserSelector()
		{
			const selector = EntitySelectorFactory.createByType(EntitySelectorFactory.Type.USER, {
				provider: {},
				createOptions: {
					enableCreation: false,
				},
				allowMultipleSelection: false,
				closeOnSelect: true,
				events: {
					onClose: (selectedUsers) => this.insertMention(selectedUsers),
				},
				widgetParams: {
					title: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_MENTION_USER_TITLE'),
					backgroundColor: AppTheme.colors.bgSecondary,
					backdrop: {
						mediumPositionPercent: 70,
						horizontalSwipeAllowed: false,
						navigationBarColor: AppTheme.colors.bgSecondary,
					},
				},
			});

			return selector.show({}, this.layout);
		}

		insertMention(users)
		{
			if (Array.isArray(users) && users.length > 0)
			{
				const { id, title } = users[0];
				const mention = `[USER=${id}]${title}[/USER]`;

				const text = this.endsWithWhitespace(this.state.text)
					? `${this.state.text}${mention} `.trimStart()
					: `${this.state.text} ${mention} `.trimStart()
				;

				this.setState({ text }, () => {
					this.setCursorPosition(text.length);
					setTimeout(() => {
						this.focus();
					}, 500);
				});
			}
			else
			{
				this.focus();
			}
		}

		endsWithWhitespace(str)
		{
			const trimmed = str.trimEnd();

			return trimmed !== str;
		}

		focus()
		{
			if (this.textInputRef)
			{
				this.textInputRef.focus();
			}
		}

		setCursorPosition(pos)
		{
			if (this.textInputRef)
			{
				this.textInputRef.setSelection(pos, pos);
			}
		}

		isSaveAllowed()
		{
			return this.state.text.length > 0 && !this.hasUploadingFiles();
		}

		refreshSaveButton()
		{
			if (!this.createButtonRef)
			{
				return;
			}

			if (this.isSaveAllowed())
			{
				this.createButtonRef.enable();
			}
			else
			{
				this.createButtonRef.disable();
			}
		}

		save()
		{
			return new Promise((resolve, reject) => {
				const data = {
					fields: {
						ENTITY_TYPE_ID: this.entity.typeId,
						ENTITY_ID: this.entity.id,
						COMMENT: this.comment,
						// AUTHOR_ID:
						ATTACHMENTS: this.state.files?.map(({ serverFileId }) => serverFileId),
					},
				};

				BX.ajax.runAction('crm.timeline.comment.add', { data })
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

		get comment()
		{
			const { text } = this.state;
			const regExp = new RegExp(
				`\\[URL=data:\\/\\/user=([0-9]+)]\\[COLOR=${AppTheme.colors.accentMainLinks}]\\[B](.*)\\[\\/B]\\[\\/COLOR]\\[\\/URL]`,
				'gm',
			);

			return text.replaceAll(
				regExp,
				'[USER=$1]$2[/USER]',
			);
		}

		get files()
		{
			return this.state.files.map((file) => file.token);
		}
	}

	module.exports = { TimelineSchedulerCommentProvider };
});
