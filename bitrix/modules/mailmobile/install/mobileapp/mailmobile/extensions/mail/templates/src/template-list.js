/**
 * @module mail/templates/src/template-list
 */
jn.define('mail/templates/src/template-list', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { Box } = require('ui-system/layout/box');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Button, ButtonDesign } = require('ui-system/form/buttons/button');
	const { StringInput, InputDesign, InputMode, InputSize } = require('ui-system/form/inputs/string');
	const { SpinnerLoader } = require('layout/ui/loaders/spinner');
	const {
		referenceKey,
		getDisabledReasonMessageKey,
		getTemplateAccessibilityLabel,
	} = require('mail/templates/src/template-picker');

	const normalizeInputValue = (value) => {
		if (typeof value === 'string')
		{
			return value;
		}

		return value?.text ?? value?.value ?? '';
	};

	class TemplateList extends PureComponent
	{
		constructor(props)
		{
			super(props);
			this.search = props.session.createSearch();
			this.unsubscribe = null;
			this.state = { ...this.search.getState() };
		}

		componentDidMount()
		{
			this.unsubscribe = this.search.subscribe((state) => this.setState({ ...state }));
			this.search.search('');
		}

		componentWillUnmount()
		{
			this.unsubscribe?.();
			this.unsubscribe = null;
			this.search.destroy();
		}

		handleSearchChange = (value) => this.search.search(normalizeInputValue(value));
		handleLoadMore = () => this.search.loadMore();
		reload = () => this.search.retry();

		handleTemplatePress = (template) => {
			if (template?.canApply)
			{
				this.props.onSelect?.(template.reference);
			}
		};

		render()
		{
			return Box(
				{
					testId: 'mail-template-full-list',
					backgroundColor: Color.bgPrimary,
					withScroll: true,
					safeArea: { bottom: true },
				},
				View(
					{ style: { padding: Indent.XL3.toNumber() } },
					this.props.onCreate && Button({
						testId: 'mail-template-full-create',
						text: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_CREATE'),
						design: ButtonDesign.OUTLINE_ACCENT_2,
						stretched: true,
						onClick: this.props.onCreate,
						style: { marginBottom: Indent.XL.toNumber() },
					}),
					StringInput({
						testId: 'mail-template-search',
						value: this.state.query,
						label: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_SEARCH'),
						placeholder: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_SEARCH'),
						showTitle: false,
						size: InputSize.L,
						design: InputDesign.GREY,
						mode: InputMode.STROKE,
						onChange: this.handleSearchChange,
					}),
				),
				this.renderContent(),
			);
		}

		renderContent()
		{
			if (this.state.isLoading && this.state.items.length === 0)
			{
				return View(
					{
						testId: 'mail-template-search-loading',
						style: { minHeight: 300, alignItems: 'center', justifyContent: 'center' },
					},
					SpinnerLoader({ testId: 'mail-template-search-spinner' }),
				);
			}

			if (this.state.error && this.state.items.length === 0)
			{
				return StatusBlock({
					testId: 'mail-template-search-error',
					title: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_LOAD_ERROR_TITLE'),
					description: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_LOAD_ERROR_DESCRIPTION'),
					buttons: [Button({
						testId: 'mail-template-search-retry',
						text: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_RETRY'),
						design: ButtonDesign.OUTLINE_ACCENT_2,
						onClick: () => this.search.retry(),
					})],
				});
			}

			if (this.state.items.length === 0)
			{
				return StatusBlock({
					testId: 'mail-template-search-empty',
					title: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_EMPTY_TITLE'),
					description: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_EMPTY_DESCRIPTION'),
					style: { minHeight: 300 },
				});
			}

			return View(
				{
					testId: 'mail-template-search-items',
					style: { paddingHorizontal: Indent.XL3.toNumber(), paddingBottom: Indent.XL3.toNumber() },
				},
				...this.state.items.map((template, index) => this.renderTemplate(template, index)),
				this.state.isLoading && SpinnerLoader({ testId: 'mail-template-search-more-spinner' }),
				this.state.nextOffset !== null && !this.state.isLoading && Button({
					testId: 'mail-template-search-more',
					text: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_LOAD_MORE'),
					design: ButtonDesign.PLAIN,
					stretched: true,
					onClick: this.handleLoadMore,
					style: { marginTop: Indent.XL.toNumber() },
				}),
			);
		}

		renderTemplate(template, index)
		{
			const testId = `mail-template-search-row-${referenceKey(template.reference)}`;
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
					style: { marginTop: index === 0 ? 0 : Indent.M.toNumber() },
				},
				Card(
					{ testId: `${testId}-card`, design: CardDesign.PRIMARY, border: true, selected: false },
					Text3({ testId: `${testId}-title`, text: template.title, color: template.canApply ? Color.base1 : Color.base4 }),
					description && Text5({
						testId: `${testId}-description`,
						text: description,
						color: Color.base4,
						style: { marginTop: Indent.XS.toNumber() },
					}),
					this.props.onPreview && Button({
						testId: `mail-template-search-preview-${referenceKey(template.reference)}`,
						text: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_PREVIEW'),
						design: ButtonDesign.PLAIN,
						onClick: () => this.props.onPreview(template.reference),
						style: { marginTop: Indent.M.toNumber() },
					}),
				),
			);
		}
	}

	module.exports = { TemplateList, normalizeInputValue };
});
