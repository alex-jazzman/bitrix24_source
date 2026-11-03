/**
 * @module mail/templates/src/template-picker
 */
jn.define('mail/templates/src/template-picker', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { Box } = require('ui-system/layout/box');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Button, ButtonDesign } = require('ui-system/form/buttons/button');
	const { SpinnerLoader } = require('layout/ui/loaders/spinner');

	const QUICK_LIMIT = 5;

	const referenceKey = (reference = {}) => `${reference.source || 'unknown'}-${reference.id || 'unknown'}`;
	const getDisabledReasonMessageKey = (disabledReason) => disabledReason === 'CRM_CONTEXT_REQUIRED'
		? 'MAILMOBILE_MAIL_TEMPLATES_CRM_UNAVAILABLE'
		: 'MAILMOBILE_MAIL_TEMPLATES_UNAVAILABLE'
	;
	const getTemplateAccessibilityLabel = (template, description) => [template.title, description]
		.filter(Boolean)
		.join(', ')
	;

	class TemplatePicker extends PureComponent
	{
		constructor(props)
		{
			super(props);
			this.session = props.session;
			this.unsubscribe = null;
			this.state = { ...this.session.getState() };
		}

		componentDidMount()
		{
			this.unsubscribe = this.session.subscribe((state) => this.setState({ ...state }));
			void this.session.loadQuick();
		}

		componentWillUnmount()
		{
			this.unsubscribe?.();
			this.unsubscribe = null;
		}

		handleTemplatePress = (template) => {
			if (!template?.canApply)
			{
				return;
			}

			this.props.onSelect(template.reference);
		};

		render()
		{
			return Box(
				{
					testId: 'mail-template-quick-picker',
					backgroundColor: Color.bgPrimary,
					withScroll: true,
					safeArea: { bottom: true },
				},
				this.renderContent(),
				this.props.managePath ? this.renderCatalogActions() : null,
			);
		}

		renderCatalogActions()
		{
			return View(
				{
					testId: 'mail-template-catalog-actions',
					style: {
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingVertical: Indent.XL3.toNumber(),
					},
				},
				Button({
					testId: 'mail-template-create',
					text: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_CREATE'),
					design: ButtonDesign.OUTLINE_ACCENT_2,
					stretched: true,
					onClick: this.props.onCreate,
				}),
				Button({
					testId: 'mail-template-open-all',
					text: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_ALL_TITLE'),
					design: ButtonDesign.PLAIN,
					stretched: true,
					onClick: this.props.onOpenAll,
					style: { marginTop: Indent.M.toNumber() },
				}),
			);
		}

		renderContent()
		{
			if (this.state.isQuickLoading)
			{
				return View(
					{
						testId: 'mail-template-quick-loading',
						style: { minHeight: 240, alignItems: 'center', justifyContent: 'center' },
					},
					SpinnerLoader({ testId: 'mail-template-quick-spinner' }),
				);
			}

			if (this.state.quickError)
			{
				return StatusBlock({
					testId: 'mail-template-quick-error',
					title: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_LOAD_ERROR_TITLE'),
					description: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_LOAD_ERROR_DESCRIPTION'),
					buttons: [Button({
						testId: 'mail-template-quick-retry',
						text: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_RETRY'),
						design: ButtonDesign.OUTLINE_ACCENT_2,
						onClick: () => this.session.loadQuick(true),
					})],
				});
			}

			const items = (this.state.quickItems || []).slice(0, QUICK_LIMIT);
			if (items.length === 0)
			{
				return StatusBlock({
					testId: 'mail-template-quick-empty',
					title: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_EMPTY_TITLE'),
					description: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_EMPTY_DESCRIPTION'),
					style: { minHeight: 240 },
				});
			}

			return View(
				{
					testId: 'mail-template-quick-items',
					style: { paddingHorizontal: Indent.XL3.toNumber() },
				},
				...items.map((template, index) => this.renderTemplate(template, index, items.length)),
			);
		}

		renderTemplate(template, index, total)
		{
			const testId = `mail-template-quick-row-${referenceKey(template.reference)}`;
			const description = template.canApply
				? template.subject
				: Loc.getMessage(getDisabledReasonMessageKey(template.disabledReason))
			;

			return View(
				{
					testId,
					onClick: template.canApply ? () => this.handleTemplatePress(template) : undefined,
					accessibilityLabel: getTemplateAccessibilityLabel(template, description),
					accessibilityRole: 'button',
					accessibilityState: { disabled: !template.canApply },
					style: { marginBottom: index === total - 1 ? 0 : Indent.M.toNumber() },
				},
				Card(
					{
						testId: `${testId}-card`,
						design: CardDesign.PRIMARY,
						border: true,
						selected: false,
					},
					Text3({ testId: `${testId}-title`, text: template.title, color: template.canApply ? Color.base1 : Color.base4 }),
					description && Text5({
						testId: `${testId}-description`,
						text: description,
						color: Color.base4,
						style: { marginTop: Indent.XS.toNumber() },
					}),
					Button({
						testId: `mail-template-quick-preview-${referenceKey(template.reference)}`,
						text: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_PREVIEW'),
						design: ButtonDesign.PLAIN,
						onClick: () => this.props.onPreview?.(template.reference),
						style: { marginTop: Indent.M.toNumber() },
					}),
				),
			);
		}
	}

	module.exports = {
		TemplatePicker,
		QUICK_LIMIT,
		referenceKey,
		getDisabledReasonMessageKey,
		getTemplateAccessibilityLabel,
	};
});
