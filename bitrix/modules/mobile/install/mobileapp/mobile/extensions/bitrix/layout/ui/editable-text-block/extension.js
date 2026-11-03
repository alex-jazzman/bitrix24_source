/**
 * @module layout/ui/editable-text-block
 */
/* global TextEditor */
jn.define('layout/ui/editable-text-block', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Feature } = require('feature');
	const { TextEditor: SimpleTextEditor } = require('layout/ui/text-editor');
	const { TextEditor: LegacyBBCodeTextEditor } = require('text-editor');
	const { NativeTextEditor } = require('layout/ui/editable-text-block/src/native-text-editor');
	const {
		EditorType,
		createEditorSessionGuard,
		resolveEditorStrategy,
	} = require('layout/ui/editable-text-block/src/editor-strategy');
	const { CollapsibleText } = require('layout/ui/collapsible-text');
	const { PlainTextFormatter } = require('bbcode/formatter/plain-text-formatter');
	const { Color } = require('tokens');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { inAppUrl } = require('in-app-url');
	const { isOffline } = require('device/connection');
	const { Loc } = require('loc');

	const EDIT_ICON_SIZE = 24;
	// the registry icon is 24 px tall against the previous 15: lift it by half the difference
	// so it keeps the optical center it had on the first line of text
	const EDIT_ICON_TOP_CORRECTION = 4;

	/**
	 * @class EditableTextBlock
	 */
	class EditableTextBlock extends LayoutComponent
	{
		/**
		 * @param {Object} props
		 * @param {string} props.value
		 * @param {string} [props.placeholder=Loc.getMessage('MOBILE_EDITABLE_TEXT_BLOCK_PLACEHOLDER')]
		 * @param {Function} [props.onSave] - callback with newValue onSave(value, files=[])
		 * @param {Function} [props.onBeforeSave]
		 * @param {Object} [props.externalStyles]
		 * @param {string} [props.testId]
		 * @param {boolean} [props.showEditIcon=true]
		 * @param {string} [props.editIconTestId='TextEditorEditIcon']
		 * @param {Object} [props.textProps={}] - props for CollapsibleText
		 * @param {Object} [props.editorProps={}]
		 * @param {string} [props.editorProps.title]
		 * @param {string} [props.editorProps.placeholder]
		 * @param {string} [props.editorProps.required]
		 * @param {string} [props.editorProps.readOnly]
		 * @param {object} [props.editorProps.textAreaStyle]
		 * @param {boolean} [props.editorProps.useBBCodeEditor]
		 * @param {boolean} [props.editorProps.useNativeTextEditor]
		 * @param {Object} [props.editorProps.bbCodeEditorParams]
		 * @param {Object} [props.editorProps.nativeTextEditorParams]
		 * @param {Function} [props.editorProps.onLinkClick]
		 * @param {PageManager} [props.editorProps.parentWidget]
		 */
		constructor(props)
		{
			super(props);

			this.setTextEditorLayout(null);
			this.editorSessionGuard = createEditorSessionGuard();
			this.editorSession = null;
		}

		render()
		{
			const { value, externalStyles = {}, testId } = this.props;

			return View(
				{
					testId,
					style: {
						paddingBottom: 15,
						paddingTop: value.length > 0 ? 14 : 30,
						paddingLeft: 16,
						paddingRight: 47,
						borderWidth: 1,
						borderColor: AppTheme.colors.bgSeparatorPrimary,
						borderRadius: 12,
						...externalStyles,
					},
				},
				this.renderEditIcon(),
				this.renderText(),
			);
		}

		renderText()
		{
			const { textProps, editorProps, value, placeholder } = this.props;
			const { bbCodeMode = false } = textProps;
			const { useBBCodeEditor = false, bbCodeEditorParams = {} } = editorProps;

			const params = {
				value: value || placeholder,
				...textProps,
				useBBCodeEditor,
				onClick: () => this.openEditor(),
				onLongClick: () => this.openEditor(),
			};

			if (useBBCodeEditor)
			{
				if (!bbCodeMode)
				{
					const plainTextFormatter = new PlainTextFormatter();
					const plainAst = plainTextFormatter.format({
						source: params.value,
						data: {
							files: bbCodeEditorParams.fileField?.value ?? [],
						},
					});

					params.value = plainAst.toString();
				}

				params.onLinkClick = () => this.openEditor();
			}

			return new CollapsibleText(params);
		}

		renderEditIcon()
		{
			const { showEditIcon, value, externalStyles = {}, editIconTestId } = this.props;

			if (!showEditIcon || value.trim() === '')
			{
				return null;
			}

			return View(
				{
					style: {
						position: 'absolute',
						right: 0,
						top: 0,
						paddingHorizontal: 11,
						paddingTop: Math.max(0, (externalStyles.paddingTop ?? 14) - EDIT_ICON_TOP_CORRECTION),
					},
					testId: editIconTestId,
					onClick: () => this.openEditor(),
				},
				IconView({
					testId: `${editIconTestId}_icon`,
					icon: Icon.EDIT,
					size: EDIT_ICON_SIZE,
					color: Color.base3,
				}),
			);
		}

		openEditor()
		{
			if (this.editorSession)
			{
				this.editorSessionGuard.close(this.editorSession);
				this.editorSession = null;
			}

			const { value, editorProps } = this.props;
			const {
				title,
				placeholder,
				required,
				readOnly,
				textAreaStyle,
				useBBCodeEditor,
				bbCodeEditorParams = {},
				useNativeTextEditor = false,
				nativeTextEditorParams = {},
				parentWidget,
			} = editorProps;

			if (useBBCodeEditor)
			{
				const bbCodeReadOnly = readOnly ?? bbCodeEditorParams.readOnly;
				const strategy = resolveEditorStrategy({
					editorProps: {
						...editorProps,
						readOnly: bbCodeReadOnly,
						useNativeTextEditor,
					},
					Feature,
					TextEditor: typeof TextEditor === 'undefined' ? null : TextEditor,
					isOffline,
				});
				const session = this.editorSessionGuard.start(strategy);
				this.editorSession = session;

				if (strategy.editorType === EditorType.NATIVE)
				{
					NativeTextEditor.edit({
						...nativeTextEditorParams,
						title,
						value,
						readOnly: strategy.readOnly,
						parentWidget,
						allowFiles: nativeTextEditorParams.allowFiles ?? bbCodeEditorParams.allowFiles,
						closeOnSave: nativeTextEditorParams.closeOnSave ?? bbCodeEditorParams.closeOnSave,
						fileField: nativeTextEditorParams.fileField ?? bbCodeEditorParams.fileField,
						session,
						sessionGuard: this.editorSessionGuard,
						onSave: ({ bbcode, files }) => this.onNativeEditorSave(bbcode, files),
						onClose: (layout) => {
							if (this.textEditorLayout === layout)
							{
								this.setTextEditorLayout(null);
							}
						},
					})
						.then((layout) => {
							if (this.editorSessionGuard.isCurrent(session))
							{
								this.setTextEditorLayout(layout);
							}
						})
						.catch((error) => {
							this.editorSessionGuard.close(session);
							console.error(error);
						})
					;

					return;
				}

				const editorParams = {
					...bbCodeEditorParams,
					title,
					value,
					textInput: {
						...bbCodeEditorParams.textInput,
						placeholder,
					},
					readOnly: strategy.readOnly,
					onSave: ({ bbcode, files }) => this.onSave(bbcode, files),
				};

				LegacyBBCodeTextEditor.edit(editorParams)
					.then((layout) => {
						if (this.editorSessionGuard.isCurrent(session))
						{
							this.setTextEditorLayout(layout);
						}
					})
					.catch((error) => {
						this.editorSessionGuard.close(session);
						console.error(error);
					})
				;

				return;
			}

			if (readOnly)
			{
				return;
			}

			SimpleTextEditor.open({
				title,
				placeholder,
				required,
				textAreaStyle,
				parentWidget,
				text: value,
				onSave: (text) => this.onSave(text),
				onBeforeSave: (editor) => this.onBeforeSave(editor),
				onLinkClick: ({ url }) => this.onEditorLinkClick(url),
			})
				.then(({ layout }) => this.setTextEditorLayout(layout))
				.catch((error) => console.error(error))
			;
		}

		onSave(value, files = [])
		{
			this.setTextEditorLayout(null);

			return this.props.onSave?.(value.trim(), files);
		}

		onNativeEditorSave(value, files = [])
		{
			return this.props.onSave?.(value, files);
		}

		async onBeforeSave(editor)
		{
			return this.props.onBeforeSave?.(editor) ?? null;
		}

		onEditorLinkClick(url)
		{
			if (this.props.editorProps.onLinkClick)
			{
				this.props.editorProps.onLinkClick(url);

				return;
			}

			inAppUrl.open(url, {
				backdrop: true,
				parentWidget: this.textEditorLayout,
			});
		}

		setTextEditorLayout(layout)
		{
			this.textEditorLayout = layout;
		}
	}

	EditableTextBlock.defaultProps = {
		value: '',
		placeholder: Loc.getMessage('MOBILE_EDITABLE_TEXT_BLOCK_PLACEHOLDER'),
		showEditIcon: true,
		editIconTestId: 'TextEditorEditIcon',
		textProps: {},
		editorProps: {},
	};

	EditableTextBlock.propTypes = {
		value: PropTypes.string,
		placeholder: PropTypes.string,
		onSave: PropTypes.func,
		onBeforeSave: PropTypes.func,
		externalStyles: PropTypes.object,
		testId: PropTypes.string,
		showEditIcon: PropTypes.bool,
		editIconTestId: PropTypes.string,
		textProps: PropTypes.object,
		editorProps: PropTypes.shape({
			title: PropTypes.string,
			placeholder: PropTypes.string,
			required: PropTypes.bool,
			readOnly: PropTypes.bool,
			textAreaStyle: PropTypes.object,
			useBBCodeEditor: PropTypes.bool,
			useNativeTextEditor: PropTypes.bool,
			bbCodeEditorParams: PropTypes.object,
			nativeTextEditorParams: PropTypes.object,
			onLinkClick: PropTypes.func,
			parentWidget: PropTypes.object,
		}),
	};

	module.exports = { EditableTextBlock };
});
