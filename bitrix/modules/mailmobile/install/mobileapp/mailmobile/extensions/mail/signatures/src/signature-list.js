/**
 * @module mail/signatures/src/signature-list
 */
jn.define('mail/signatures/src/signature-list', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Icon } = require('assets/icons');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { IconView } = require('ui-system/blocks/icon');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { Box, BoxFooter } = require('ui-system/layout/box');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { SpinnerLoader } = require('layout/ui/loaders/spinner');
	const { confirmDestructiveAction } = require('alert');
	const { showErrorToast } = require('toast');
	const { SignatureApi, SignatureModel } = require('mail/signatures/compose');
	const { SignatureCreate } = require('mail/signatures/src/signature-create');

	/**
	 * @extends {PureComponent<SignatureListProps, SignatureListState>}
	 */
	class SignatureList extends PureComponent
	{
		/**
		 * @param {SignatureListProps} props
		 */
		constructor(props)
		{
			super(props);
			this.api = props.api;
			this.perfPoint = props.perfPoint;
			this.model = new SignatureModel();
			this.openedReported = false;
			this.menuRefs = new Map();
			this.state = {
				loading: true,
				loadError: false,
				removingId: null,
				revision: 0,
			};
		}

		componentDidMount()
		{
			void this.load();
		}

		async load()
		{
			this.setState({ loading: true, loadError: false });

			try
			{
				this.model.updateContext(await this.api.loadContext());
				this.setState(
					(state) => ({
						loading: false,
						loadError: false,
						revision: state.revision + 1,
					}),
					this.finishInitialLoadPerfPoint,
				);

				if (!this.openedReported)
				{
					this.openedReported = true;
					this.props.onOpened?.();
				}
			}
			catch (failure)
			{
				if (SignatureApi.isUnavailableFailure(failure))
				{
					this.finishInitialLoadPerfPoint();
					this.props.onUnavailable?.();

					return;
				}

				this.setState(
					{ loading: false, loadError: true },
					this.finishInitialLoadPerfPoint,
				);
			}
		}

		finishInitialLoadPerfPoint = () => {
			if (!this.perfPoint)
			{
				return;
			}

			this.perfPoint.endPoint('Load Signature Context');
			this.perfPoint.end();
			this.perfPoint = null;
		};

		render()
		{
			if (this.state.loading)
			{
				return this.renderLoading();
			}

			if (this.state.loadError)
			{
				return this.renderError();
			}

			const signatures = this.model.getOwnerSignatures();

			return Box(
				{
					testId: 'mail-signatures-list',
					backgroundColor: Color.bgPrimary,
					withScroll: true,
					safeArea: { bottom: true },
					footer: BoxFooter(
						{ testId: 'mail-signatures-list-footer' },
						Button({
							testId: 'mail-signatures-add-button',
							text: Loc.getMessage('MAILMOBILE_SIGNATURES_ADD'),
							leftIcon: Icon.PLUS,
							size: ButtonSize.XL,
							design: ButtonDesign.FILLED,
							stretched: true,
							onClick: this.openCreate,
						}),
					),
				},
				signatures.length === 0 ? this.renderEmpty() : this.renderCards(signatures),
			);
		}

		renderLoading()
		{
			return Box(
				{
					testId: 'mail-signatures-loading',
					backgroundColor: Color.bgPrimary,
					style: {
						flex: 1,
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				SpinnerLoader({ testId: 'mail-signatures-loading-spinner' }),
			);
		}

		renderError()
		{
			return Box(
				{
					testId: 'mail-signatures-load-error',
					backgroundColor: Color.bgPrimary,
					style: { flex: 1 },
				},
				StatusBlock({
					testId: 'mail-signatures-load-error-state',
					title: Loc.getMessage('MAILMOBILE_SIGNATURES_LOAD_ERROR_TITLE'),
					description: Loc.getMessage('MAILMOBILE_SIGNATURES_LOAD_ERROR_DESCRIPTION'),
					buttons: [
						Button({
							testId: 'mail-signatures-retry-button',
							text: Loc.getMessage('MAILMOBILE_SIGNATURES_RETRY'),
							design: ButtonDesign.OUTLINE_ACCENT_2,
							onClick: () => this.load(),
						}),
					],
				}),
			);
		}

		renderEmpty()
		{
			return StatusBlock({
				testId: 'mail-signatures-empty-state',
				title: Loc.getMessage('MAILMOBILE_SIGNATURES_EMPTY_TITLE'),
				description: Loc.getMessage('MAILMOBILE_SIGNATURES_EMPTY_DESCRIPTION'),
				style: { minHeight: 360 },
			});
		}

		renderCards(signatures)
		{
			return View(
				{
					testId: 'mail-signatures-cards',
					style: {
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingVertical: Indent.M.toNumber(),
					},
				},
				...signatures.map((signature, index) => this.renderCard(signature, index, signatures.length)),
			);
		}

		renderCard(signature, index, total)
		{
			const senderKeys = Array.isArray(signature.senderKeys)
				? signature.senderKeys
				: (signature.senderKey ? [signature.senderKey] : [])
			;
			const senderLabels = senderKeys
				.map((senderKey) => this.model.findSender(senderKey))
				.filter(Boolean)
				.map((sender) => [sender.name, sender.email]
					.filter(Boolean)
					.filter((value, valueIndex, values) => valueIndex === 0 || value !== values[0])
					.join(' - '))
			;
			const senderText = senderLabels.length > 0
				? senderLabels.join(', ')
				: Loc.getMessage('MAILMOBILE_SIGNATURES_ALL_SENDERS')
			;
			const testId = `mail-signature-card-${signature.id}`;

			return Card(
				{
					testId,
					design: CardDesign.PRIMARY,
					selected: false,
					border: true,
					style: {
						marginBottom: index === total - 1
							? 0
							: Indent.M.toNumber(),
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'flex-start',
						},
					},
					View(
						{ style: { flex: 1, marginRight: Indent.M.toNumber() } },
						Text3({
							testId: `${testId}-text`,
							text: signature.text,
							color: Color.base2,
							numberOfLines: 4,
							ellipsize: 'end',
						}),
						Text5({
							testId: `${testId}-sender`,
							text: senderText,
							color: Color.base4,
							style: { marginTop: Indent.L.toNumber() },
						}),
					),
					IconView({
						testId: `${testId}-menu`,
						icon: Icon.MORE,
						color: Color.base4,
						size: 24,
						forwardRef: (ref) => this.menuRefs.set(Number(signature.id), ref),
						onClick: () => this.openActions(signature),
					}),
				),
			);
		}

		openActions(signature)
		{
			const menu = new PopupMenu([
				{
					id: `delete-${signature.id}`,
					testId: `mail-signature-delete-${signature.id}`,
					title: Loc.getMessage('MAILMOBILE_SIGNATURES_DELETE'),
					icon: Icon.TRASHCAN,
					isDestructive: true,
					onItemSelected: () => this.confirmDelete(signature),
				},
			]);

			menu.show({ target: this.menuRefs.get(Number(signature.id)) });
		}

		confirmDelete(signature)
		{
			confirmDestructiveAction({
				title: Loc.getMessage('MAILMOBILE_SIGNATURES_DELETE_CONFIRM_TITLE'),
				description: Loc.getMessage('MAILMOBILE_SIGNATURES_DELETE_CONFIRM_DESCRIPTION'),
				destructionText: Loc.getMessage('MAILMOBILE_SIGNATURES_DELETE'),
				cancelText: Loc.getMessage('MAILMOBILE_SIGNATURES_CANCEL'),
				onDestruct: () => this.deleteSignature(signature),
			});
		}

		async deleteSignature(signature)
		{
			if (this.state.removingId !== null)
			{
				return;
			}

			this.setState({ removingId: Number(signature.id) });
			try
			{
				await this.api.deleteOwner(Number(signature.id));
				this.model.removeOwner(Number(signature.id));
				this.setState((state) => ({
					removingId: null,
					revision: state.revision + 1,
				}));
			}
			catch (failure)
			{
				this.setState({ removingId: null });
				showErrorToast(
					{ message: Loc.getMessage('MAILMOBILE_SIGNATURES_DELETE_ERROR') },
					this.props.layoutWidget,
				);
			}
		}

		openCreate = () => {
			PageManager.openWidget('layout', {
				modal: true,
				titleParams: {
					text: Loc.getMessage('MAILMOBILE_SIGNATURES_CREATE_TITLE'),
					type: 'section',
				},
				onReady: (layoutWidget) => {
					layoutWidget.showComponent(new SignatureCreate({
						layoutWidget,
						api: this.api,
						senders: this.model.senders,
						onCreated: (item) => {
							this.model.addOwner(item);
							this.setState((state) => ({ revision: state.revision + 1 }));
						},
					}));
				},
			});
		};
	}

	module.exports = { SignatureList };
});
