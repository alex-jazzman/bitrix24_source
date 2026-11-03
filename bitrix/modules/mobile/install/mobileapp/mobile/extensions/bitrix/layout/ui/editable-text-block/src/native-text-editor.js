/**
 * @module layout/ui/editable-text-block/src/native-text-editor
 */
/* global TextEditor */
jn.define('layout/ui/editable-text-block/src/native-text-editor', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { confirmClosing } = require('alert');
	const { Icon } = require('assets/icons');
	const { BottomSheet } = require('bottom-sheet');
	const { FileField } = require('layout/ui/fields/file/theme/air');
	const { Indent } = require('tokens');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');

	const TOOLBAR_BUTTONS = Object.freeze([
		'bold',
		'italic',
		'underline',
		'strikethrough',
		'bulleted-list',
		'numbered-list',
		'mention',
	]);
	const FILE_REVISION_FIELDS = Object.freeze([
		'id',
		'token',
		'fileId',
		'serverFileId',
		'objectId',
		'isDiskFile',
		'uuid',
		'isUploading',
		'hasError',
		'name',
		'url',
		'previewUrl',
		'uri',
		'previewUri',
		'path',
		'type',
		'fileType',
		'size',
		'width',
		'height',
	]);

	class NativeTextEditor extends LayoutComponent
	{
		static async edit(options = {})
		{
			const editor = new NativeTextEditor(options);
			const bottomSheet = new BottomSheet({
				titleParams: {
					text: typeof options.title === 'string' ? options.title : '',
					type: 'dialog',
				},
				component: (layout) => {
					editor.setLayout(layout);

					return editor;
				},
			});

			editor.bottomSheet = bottomSheet;

			return bottomSheet
				.setParentWidget(options.parentWidget || PageManager)
				.setBackgroundColor(AppTheme.colors.bgSecondary)
				.setNavigationBarColor(AppTheme.colors.bgSecondary)
				.disableContentSwipe()
				.alwaysOnTop()
				.preventBottomSheetDismiss()
				.open()
			;
		}

		constructor(props = {})
		{
			super(props);

			this.bottomSheet = null;
			this.controller = null;
			this.fileField = null;
			this.layout = null;
			this.mentionRequest = null;
			this.ready = false;
			this.dirty = false;
			this.saving = false;
			this.textRevision = 0;
			this.textDirty = false;
			this.filesDirty = false;
			this.layoutOpen = false;
			this.closed = false;
			this.savedTextValue = typeof props.value === 'string' ? props.value : '';
			this.currentTextValue = this.savedTextValue;

			const fileField = props.fileField || {};
			this.files = Array.isArray(fileField.value) ? fileField.value : [];
			this.savedFilesRevision = this.createFilesRevision(this.files);
			this.state = {
				isSaveButtonDisabled: true,
				isSaveButtonLoading: false,
				fileField: {
					...fileField,
					value: this.files,
				},
			};

			this.onCloseRequest = this.onCloseRequest.bind(this);
			this.onViewHidden = this.onViewHidden.bind(this);
			this.onFilesChange = this.onFilesChange.bind(this);
			this.onFileFieldRef = this.onFileFieldRef.bind(this);
			this.onAttachClick = this.onAttachClick.bind(this);
			this.onSaveClick = this.onSaveClick.bind(this);
			this.restoreEditorFocus = this.restoreEditorFocus.bind(this);
		}

		setLayout(layout)
		{
			this.layout = layout;
			this.layoutOpen = true;

			layout.on('preventDismiss', this.onCloseRequest);
			layout.on('onViewHidden', this.onViewHidden);
		}

		isSessionActive()
		{
			return (
				this.layoutOpen
				&& !this.closed
				&& this.props.sessionGuard.isCurrent(this.props.session)
			);
		}

		isSaveAllowed()
		{
			return (
				this.isSessionActive()
				&& this.ready
				&& !this.saving
				&& this.props.readOnly !== true
				&& this.controller !== null
				&& !this.hasPendingFiles()
			);
		}

		getLiveFiles()
		{
			const value = this.fileField?.getValue?.();

			return Array.isArray(value) ? value : this.files;
		}

		hasPendingFiles(files = this.getLiveFiles())
		{
			return files.some((file) => file?.isUploading === true);
		}

		createFilesRevision(files)
		{
			return files.map((file) => {
				if (!file || typeof file !== 'object')
				{
					return { value: file };
				}

				return {
					values: FILE_REVISION_FIELDS.map((field) => file[field]),
				};
			});
		}

		areFilesRevisionsEqual(leftRevision, rightRevision)
		{
			if (leftRevision.length !== rightRevision.length)
			{
				return false;
			}

			return leftRevision.every((leftItem, index) => {
				const rightItem = rightRevision[index];
				const leftHasValue = 'value' in leftItem;
				const rightHasValue = 'value' in rightItem;
				if (leftHasValue !== rightHasValue)
				{
					return false;
				}

				if (leftHasValue)
				{
					return leftItem.value === rightItem.value;
				}

				return leftItem.values.every((value, valueIndex) => value === rightItem.values[valueIndex]);
			});
		}

		isFilesRevisionCurrent(revision)
		{
			return this.areFilesRevisionsEqual(
				revision,
				this.createFilesRevision(this.getLiveFiles()),
			);
		}

		refreshDirtyState()
		{
			this.dirty = this.textDirty || this.filesDirty;
		}

		refreshFilesDirtyState()
		{
			this.filesDirty = !this.areFilesRevisionsEqual(
				this.savedFilesRevision,
				this.createFilesRevision(this.getLiveFiles()),
			);
			this.refreshDirtyState();
		}

		refreshSaveButton()
		{
			this.setState({
				isSaveButtonDisabled: !this.isSaveAllowed(),
				isSaveButtonLoading: this.saving,
			});
		}

		restoreEditorFocus()
		{
			if (this.isSessionActive() && this.ready && this.props.readOnly !== true)
			{
				this.controller?.focus();
			}
		}

		onEditorRef(controller)
		{
			this.controller = controller;
			this.props.ref?.(controller);
			this.refreshSaveButton();
		}

		getTextEditorInteractionProps()
		{
			const editingEnabled = this.props.readOnly !== true;

			return {
				editable: editingEnabled,
				enable: editingEnabled,
			};
		}

		onMentionQuery(payload)
		{
			if (this.mentionRequest !== null)
			{
				return this.mentionRequest;
			}

			this.mentionRequest = this.requestMentions(payload)
				.finally(() => {
					this.mentionRequest = null;
				})
			;

			return this.mentionRequest;
		}

		async requestMentions(payload)
		{
			if (!this.isSessionActive() || this.props.readOnly === true || this.controller === null)
			{
				return;
			}

			try
			{
				const mentions = await this.props.onMentionQuery?.(payload);
				if (!this.isSessionActive() || !Array.isArray(mentions))
				{
					return;
				}

				mentions.forEach(({ entityId, id, text }) => {
					this.controller.insertMention(entityId, id, text);
				});
			}
			catch (error)
			{
				console.error(error);
			}
			finally
			{
				if (this.isSessionActive())
				{
					this.controller?.closeMention();
				}
			}
		}

		// The task description passed in props is the baseline: what the editor parses it into is its own
		// value, and any difference from it is a real unsaved change of the description.
		onReady()
		{
			if (!this.isSessionActive() || this.ready)
			{
				return;
			}

			this.ready = true;
			this.refreshDirtyState();
			this.refreshSaveButton();
			this.props.onReady?.();
		}

		onTextChange(bbcode)
		{
			if (!this.isSessionActive() || this.props.readOnly === true)
			{
				return;
			}

			if (bbcode === this.currentTextValue)
			{
				return;
			}

			this.currentTextValue = bbcode;
			this.textDirty = this.currentTextValue !== this.savedTextValue;
			this.textRevision += 1;
			this.refreshDirtyState();
			this.props.onChangeText?.(bbcode);
		}

		onFilesChange(value)
		{
			if (!this.isSessionActive() || this.props.readOnly === true)
			{
				return;
			}

			const files = Array.isArray(value) ? value : [];

			this.files = files;
			this.setState({
				fileField: {
					...this.state.fileField,
					value: files,
				},
			});
			this.refreshFilesDirtyState();
			this.refreshSaveButton();
			this.props.fileField?.onChange?.(files);
		}

		onCloseRequest()
		{
			if (this.saving)
			{
				return;
			}

			this.refreshFilesDirtyState();

			if (this.props.readOnly === true || !this.dirty)
			{
				void this.close();

				return;
			}

			confirmClosing({
				hasSaveAndClose: false,
				onClose: () => this.close(),
			});
		}

		onViewHidden()
		{
			this.finishSession();
		}

		finishSession()
		{
			if (this.closed)
			{
				return;
			}

			this.closed = true;
			this.layoutOpen = false;
			this.props.sessionGuard.close(this.props.session);
			this.props.onClose?.(this.layout);
		}

		close()
		{
			this.finishSession();

			return this.bottomSheet?.close() ?? Promise.resolve();
		}

		async onSaveClick()
		{
			if (!this.isSaveAllowed())
			{
				if (this.hasPendingFiles())
				{
					this.filesDirty = true;
					this.refreshDirtyState();
				}

				return;
			}

			this.saving = true;
			const readTextRevision = this.textRevision;
			const readFilesRevision = this.createFilesRevision(this.getLiveFiles());
			this.refreshSaveButton();

			try
			{
				await this.props.sessionGuard.run(
					this.props.session,
					() => this.controller.getTextValueAsync(),
					async (bbcode) => {
						if (!this.isSessionActive())
						{
							return;
						}

						const liveFiles = this.getLiveFiles();
						const liveFilesRevision = this.createFilesRevision(liveFiles);
						const textChangedDuringRead = this.textRevision !== readTextRevision;
						const filesChangedDuringRead = !this.areFilesRevisionsEqual(
							readFilesRevision,
							liveFilesRevision,
						);
						if (textChangedDuringRead || filesChangedDuringRead)
						{
							this.textDirty = this.textDirty || textChangedDuringRead;
							this.filesDirty = this.filesDirty || filesChangedDuringRead;
							this.refreshDirtyState();
							this.saving = false;
							this.refreshSaveButton();

							return;
						}

						if (this.hasPendingFiles(liveFiles))
						{
							this.filesDirty = true;
							this.refreshDirtyState();
							this.saving = false;
							this.refreshSaveButton();

							return;
						}

						const files = [...liveFiles];
						const filesRevision = liveFilesRevision;
						const textRevision = this.textRevision;

						await this.props.sessionGuard.run(
							this.props.session,
							async () => {
								if (!this.isSessionActive())
								{
									return false;
								}

								await this.props.onSave?.({ bbcode, files });

								return { textRevision, filesRevision, textValue: bbcode };
							},
							async (savedRevision) => {
								if (!savedRevision || !this.isSessionActive())
								{
									return;
								}

								this.saving = false;
								const textChangedDuringSave = this.textRevision !== savedRevision.textRevision;
								const filesChangedDuringSave = !this.isFilesRevisionCurrent(
									savedRevision.filesRevision,
								);
								this.savedTextValue = savedRevision.textValue;
								if (!textChangedDuringSave)
								{
									this.currentTextValue = savedRevision.textValue;
								}
								this.savedFilesRevision = savedRevision.filesRevision;
								this.textDirty = this.currentTextValue !== this.savedTextValue;
								this.filesDirty = filesChangedDuringSave;
								this.refreshDirtyState();
								this.refreshSaveButton();

								if (!this.dirty && this.props.closeOnSave === true)
								{
									await this.close();
								}
							},
						);
					},
				);
			}
			catch (error)
			{
				if (this.isSessionActive())
				{
					this.saving = false;
					this.refreshSaveButton();
				}

				console.error(error);
			}
		}

		onFileFieldRef(ref)
		{
			this.fileField = ref;
			if (ref)
			{
				this.refreshSaveButton();
			}
		}

		onAttachClick()
		{
			this.fileField?.openFilePicker();
		}

		renderFileField()
		{
			if (this.props.allowFiles === false)
			{
				return null;
			}

			const testId = this.props.testId || 'native-text-editor';

			return View(
				{
					style: {
						paddingTop: Indent.S.toNumber(),
						paddingHorizontal: Indent.XL3.toNumber(),
					},
					testId: `${testId}-file-field-container`,
				},
				FileField({
					...this.state.fileField,
					config: {
						...this.state.fileField.config,
						parentWidget: this.layout || this.props.parentWidget || PageManager,
					},
					disabled: this.props.readOnly === true,
					multiple: true,
					onChange: this.onFilesChange,
					onFocusOut: this.restoreEditorFocus,
					onFileAttachmentViewHidden: this.restoreEditorFocus,
					ref: this.onFileFieldRef,
					showAddButton: false,
					showTitle: false,
					testId: `${testId}-file-field`,
				}),
			);
		}

		renderBottomBar()
		{
			if (this.props.readOnly === true)
			{
				return null;
			}

			const testId = this.props.testId || 'native-text-editor';

			return View(
				{
					style: {
						alignItems: 'center',
						flexDirection: 'row',
						height: 52,
						justifyContent: 'space-between',
						marginHorizontal: Indent.XL3.toNumber(),
					},
					testId: `${testId}-bottom-bar`,
				},
				this.props.allowFiles !== false && Button({
					design: ButtonDesign.PLAIN,
					disabled: this.fileField === null || this.saving,
					leftIcon: Icon.ATTACH,
					onClick: this.onAttachClick,
					size: ButtonSize.S,
					testId: `${testId}-attach-button`,
				}),
				Button({
					design: ButtonDesign.FILLED,
					disabled: this.state.isSaveButtonDisabled,
					leftIcon: Icon.ARROW_TOP,
					loading: this.state.isSaveButtonLoading,
					onClick: this.onSaveClick,
					size: ButtonSize.S,
					style: {
						marginLeft: 'auto',
					},
					testId: `${testId}-save-button`,
				}),
			);
		}

		render()
		{
			const {
				allowFiles,
				closeOnSave,
				fileField,
				onClose,
				onSave,
				parentWidget,
				readOnly,
				session,
				sessionGuard,
				title,
				...elementProps
			} = this.props;
			const testId = this.props.testId || 'native-text-editor';
			const value = typeof this.props.value === 'string' ? this.props.value : '';
			const interactionProps = this.getTextEditorInteractionProps();
			const toolbarButtons = typeof this.props.onMentionQuery === 'function'
				? [...TOOLBAR_BUTTONS]
				: TOOLBAR_BUTTONS.filter((button) => button !== 'mention');

			return View(
				{
					resizableByKeyboard: true,
					style: {
						backgroundColor: AppTheme.colors.bgContentPrimary,
						flex: 1,
					},
					safeArea: {
						bottom: true,
					},
					testId: `${testId}-root`,
				},
				TextEditor({
					...elementProps,
					value,
					...interactionProps,
					showToolbar: true,
					toolbarButtons,
					style: {
						flex: 1,
						...elementProps.style,
					},
					testId: `${testId}-editor`,
					ref: (controller) => this.onEditorRef(controller),
					onReady: () => this.onReady(),
					onChangeText: (bbcode) => this.onTextChange(bbcode),
					onMentionQuery: (payload) => this.onMentionQuery(payload),
					onMentionClose: () => {
						this.props.onMentionClose?.();
						this.restoreEditorFocus();
					},
				}),
				this.renderFileField(),
				this.renderBottomBar(),
			);
		}
	}

	module.exports = { NativeTextEditor };
});
