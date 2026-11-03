/**
 * @module mail/signatures/src/signature-sender-selector
 */
jn.define('mail/signatures/src/signature-sender-selector', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Corner, Indent } = require('tokens');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { StringInput, InputDesign, InputMode } = require('ui-system/form/inputs/string');
	const { Checkbox } = require('ui-system/form/checkbox');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Box, BoxFooter } = require('ui-system/layout/box');

	class SignatureSenderSelection
	{
		constructor(senders = [], selectedKeys = [])
		{
			this.senders = senders;
			this.selectedKeys = new Set(selectedKeys);
			this.query = '';
		}

		toggle(key)
		{
			this.selectedKeys.has(key) ? this.selectedKeys.delete(key) : this.selectedKeys.add(key);
		}

		remove(key)
		{
			this.selectedKeys.delete(key);
		}

		setQuery(query)
		{
			this.query = String(query ?? '').trim().toLocaleLowerCase();
		}

		getSelectedKeys()
		{
			return this.senders.filter(({ key }) => this.selectedKeys.has(key)).map(({ key }) => key);
		}

		getFilteredSenders()
		{
			if (this.query === '')
			{
				return this.senders;
			}

			return this.senders.filter(({ name, email }) => `${name} ${email}`.toLocaleLowerCase().includes(this.query));
		}
	}

	class SignatureSenderSelector extends PureComponent
	{
		constructor(props)
		{
			super(props);
			this.selection = new SignatureSenderSelection(props.senders, props.selectedKeys);
			this.state = { revision: 0 };
		}

		render()
		{
			const selected = this.props.senders.filter(({ key }) => this.selection.selectedKeys.has(key));

			return Box(
				{
					testId: 'mail-signature-sender-selector',
					backgroundColor: Color.bgPrimary,
					withScroll: true,
					safeArea: { bottom: true },
					footer: BoxFooter(
						{ testId: 'mail-signature-sender-selector-footer' },
						Button({
							testId: 'mail-signature-sender-selector-done',
							text: Loc.getMessage('MAILMOBILE_SIGNATURES_SENDER_DONE'),
							design: ButtonDesign.FILLED,
							size: ButtonSize.XL,
							stretched: true,
							onClick: this.done,
						}),
					),
				},
				View(
					{ style: { padding: Indent.XL.toNumber() } },
					StringInput({
						testId: 'mail-signature-sender-search',
						placeholder: Loc.getMessage('MAILMOBILE_SIGNATURES_SENDER_SEARCH'),
						design: InputDesign.GREY,
						mode: InputMode.STROKE,
						onChange: (query) => {
							this.selection.setQuery(query);
							this.setState(({ revision }) => ({ revision: revision + 1 }));
						},
					}),
					selected.length > 0 && View(
						{
							testId: 'mail-signature-sender-selected-list',
							style: {
								marginTop: Indent.XL.toNumber(),
								paddingHorizontal: Indent.XL.toNumber(),
								borderWidth: 1,
								borderColor: Color.base5.toHex(),
								borderRadius: Corner.L.toNumber(),
							},
						},
						...selected.map((sender, index) => this.renderSelectedSender(sender, index)),
					),
					Text5({
						testId: 'mail-signature-sender-list-title',
						text: Loc.getMessage('MAILMOBILE_SIGNATURES_CONNECTED_SENDERS'),
						color: Color.base4,
						style: { marginTop: Indent.XL.toNumber(), marginBottom: Indent.M.toNumber() },
					}),
					...this.selection.getFilteredSenders().map((sender, index) => this.renderSender(sender, index)),
				),
			);
		}

		renderSender(sender, index)
		{
			const checked = this.selection.selectedKeys.has(sender.key);
			return View(
				{
					testId: `mail-signature-sender-row-${index}`,
					style: { flexDirection: 'row', alignItems: 'center', paddingVertical: Indent.L.toNumber() },
					onClick: () => {
						this.selection.toggle(sender.key);
						this.setState(({ revision }) => ({ revision: revision + 1 }));
					},
				},
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					Avatar({
						testId: `mail-signature-sender-avatar-${index}`,
						id: sender.key,
						name: sender.name || sender.email,
						size: 40,
						withRedux: false,
					}),
					View(
						{ style: { flex: 1, marginLeft: Indent.XL.toNumber() } },
						Text3({ testId: `mail-signature-sender-name-${index}`, text: sender.name || sender.email }),
						Text5({ testId: `mail-signature-sender-email-${index}`, text: sender.email, color: Color.base4 }),
					),
				),
				new Checkbox({
					testId: `mail-signature-sender-checkbox-${index}`,
					checked,
					useState: false,
				}),
			);
		}

		renderSelectedSender(sender, index)
		{
			const removeSender = () => {
				this.selection.remove(sender.key);
				this.setState(({ revision }) => ({ revision: revision + 1 }));
			};

			return View(
				{
					testId: `mail-signature-sender-selected-${index}`,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: Indent.XL.toNumber(),
					},
				},
				Avatar({
					testId: `mail-signature-sender-selected-avatar-${index}`,
					id: sender.key,
					name: sender.name || sender.email,
					size: 48,
					withRedux: false,
				}),
				Text3({
					testId: `mail-signature-sender-selected-name-${index}`,
					text: sender.name || sender.email,
					style: { flex: 1, marginLeft: Indent.XL.toNumber() },
					numberOfLines: 1,
					ellipsize: 'end',
				}),
				Button({
					testId: `mail-signature-sender-selected-remove-${index}`,
					leftIcon: Icon.CROSS,
					leftIconColor: Color.base4,
					design: ButtonDesign.PLAIN_NO_ACCENT,
					size: ButtonSize.S,
					onClick: removeSender,
				}),
			);
		}

		done = () => {
			this.props.onDone(this.selection.getSelectedKeys());
			this.props.layoutWidget.close();
		};
	}

	module.exports = { SignatureSenderSelection, SignatureSenderSelector };
});
