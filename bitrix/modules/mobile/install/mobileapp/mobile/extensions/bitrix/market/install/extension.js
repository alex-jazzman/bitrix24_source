/**
 * @module market/install
 */
jn.define('market/install', (require, exports, module) => {
	const { Loc } = require('loc');
	const { inAppUrl } = require('in-app-url');
	const { NotifyManager } = require('notify-manager');
	const { requireLazy } = require('require-lazy');
	const { createTestIdGenerator } = require('utils/test');
	const { showErrorToast } = require('toast/error');
	const {
		hasActionErrors,
		normalizeSelectedUser,
		resolveActionErrorMessage,
	} = require('market/utils');
	const { Color, Component, Indent } = require('tokens');
	const { MarketInstallAccessStep } = require('market/install/src/steps/access-step');
	const { MarketInstallAgreementsStep } = require('market/install/src/steps/agreements-step');
	const { MarketInstallPermissionsStep } = require('market/install/src/steps/permissions-step');
	const { LoadingScreen } = require('layout/ui/loading-screen');
	const { UIScrollView } = require('layout/ui/scroll-view');
	const { EntitySelectorFactory, EntitySelectorFactoryType } = require('selector/widget/factory');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Box } = require('ui-system/layout/box');
	const { DialogFooter } = require('ui-system/layout/dialog-footer');
	const { H4 } = require('ui-system/typography/heading');
	const { Text5 } = require('ui-system/typography/text');

	const CONTENT_SIDE_PADDING = Component.paddingLr.toNumber();
	const CONTENT_BOTTOM_PADDING = Indent.XL4.toNumber();

	const STEP = Object.freeze({
		PERMISSIONS: 1,
		ACCESS: 2,
		AGREEMENTS: 3,
	});

	const ACCESS_MODE = Object.freeze({
		ALL: 'all',
		SELECTED: 'selected',
	});

	const AGREEMENT = Object.freeze({
		TERMS_OF_SERVICE: 'termsOfService',
		EULA: 'eula',
		PRIVACY: 'privacy',
	});

	function extractSelectedItems(payload)
	{
		if (Array.isArray(payload))
		{
			return payload;
		}

		if (Array.isArray(payload?.selectedItems))
		{
			return payload.selectedItems;
		}

		return [];
	}

	class MarketInstall extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			const initialData = this.prepareInitialData(props.initialData);
			this.isDestroyed = false;
			this.getTestId = createTestIdGenerator({
				prefix: props.testId || 'market-install',
			});
			this.getAgreementTextHandler = this.getAgreementText.bind(this);

			this.state = {
				step: STEP.PERMISSIONS,
				isLoading: !initialData,
				loadError: false,
				loadErrorMessage: '',
				initialData,
				isSubmitting: false,
				footerHeight: 0,
				accessMode: ACCESS_MODE.ALL,
				selectedUsers: [],
				agreementsState: this.prepareAgreementsState(initialData?.agreements),
			};
		}

		componentDidMount()
		{
			this.syncHeaderState();
			void this.loadInitialData();
		}

		componentWillUnmount()
		{
			this.isDestroyed = true;
		}

		componentDidUpdate(prevProps, prevState)
		{
			if (
				prevState.step !== this.state.step
				|| prevState.initialData !== this.state.initialData
				|| prevState.isLoading !== this.state.isLoading
				|| prevState.loadError !== this.state.loadError
			)
			{
				this.syncHeaderState();
			}
		}

		getLayoutWidget()
		{
			return this.props.layout ?? PageManager;
		}

		getInitialData()
		{
			return this.state.initialData ?? {};
		}

		getApp()
		{
			return this.getInitialData().app ?? {};
		}

		getInstallInfo()
		{
			return this.getInitialData().installInfo ?? {};
		}

		getScopes()
		{
			const scopes = this.getInitialData().scopes;

			if (Array.isArray(scopes))
			{
				return scopes;
			}

			if (scopes && typeof scopes === 'object')
			{
				return Object.values(scopes);
			}

			return [];
		}

		getAgreements()
		{
			return Array.isArray(this.getInitialData().agreements) ? this.getInitialData().agreements : [];
		}

		getCurrentStep()
		{
			return this.state.step;
		}

		isAllEmployeesSelected()
		{
			return this.state.accessMode === ACCESS_MODE.ALL;
		}

		getFooterButtonText()
		{
			switch (this.getCurrentStep())
			{
				case STEP.ACCESS:
					return Loc.getMessage('MOBILE_MARKET_INSTALL_ACTION_NEXT_ACCESS');
				case STEP.AGREEMENTS:
					return Loc.getMessage('MOBILE_MARKET_INSTALL_ACTION_INSTALL');
				case STEP.PERMISSIONS:
				default:
					return Loc.getMessage('MOBILE_MARKET_INSTALL_ACTION_NEXT_PERMISSIONS');
			}
		}

		isFooterButtonDisabled()
		{
			if (this.state.isSubmitting)
			{
				return true;
			}

			if (this.getCurrentStep() === STEP.ACCESS)
			{
				return !this.isAllEmployeesSelected() && this.state.selectedUsers.length === 0;
			}

			if (this.getCurrentStep() === STEP.AGREEMENTS)
			{
				return this.state.agreementsState.some((agreement) => agreement.checked !== true);
			}

			return false;
		}

		prepareInitialData(data = null)
		{
			if (data && typeof data === 'object' && !Array.isArray(data))
			{
				return data;
			}

			return null;
		}

		prepareAgreementsState(agreements = [])
		{
			if (!Array.isArray(agreements))
			{
				return [];
			}

			return agreements.map((agreement) => ({
				...agreement,
				checked: false,
			}));
		}

		getLoadAppCode()
		{
			return String(this.props.code ?? this.getApp().code ?? '').trim();
		}

		getLoadRequestJson()
		{
			return {
				code: this.getLoadAppCode(),
				version: this.props.version ?? 0,
				checkHash: this.props.checkHash ?? '',
				installHash: this.props.installHash ?? '',
			};
		}

		async loadInitialData()
		{
			if (this.prepareInitialData(this.state.initialData))
			{
				return;
			}

			const code = this.getLoadAppCode();
			if (!code)
			{
				this.setLoadError(Loc.getMessage('MOBILE_MARKET_INSTALL_UNAVAILABLE_DESCRIPTION'));

				return;
			}

			try
			{
				const response = await BX.ajax.runAction('mobile.Market.getInstallFlowData', {
					json: this.getLoadRequestJson(),
				}).catch((errorResponse) => errorResponse);

				if (this.isDestroyed)
				{
					return;
				}

				if (hasActionErrors(response))
				{
					this.setLoadError(resolveActionErrorMessage(
						response,
						Loc.getMessage('MOBILE_MARKET_INSTALL_UNAVAILABLE_DESCRIPTION'),
					));

					return;
				}

				const initialData = this.prepareInitialData(response?.data);
				this.setState({
					isLoading: false,
					loadError: false,
					loadErrorMessage: '',
					initialData,
					agreementsState: this.prepareAgreementsState(initialData?.agreements),
				});
			}
			catch (error)
			{
				console.error(error);
				this.setLoadError(Loc.getMessage('MOBILE_MARKET_INSTALL_UNAVAILABLE_DESCRIPTION'));
			}
		}

		setLoadError(message)
		{
			if (this.isDestroyed)
			{
				return;
			}

			this.setState({
				isLoading: false,
				loadError: true,
				loadErrorMessage: String(message ?? '').trim(),
			});
		}

		getHeaderTitle()
		{
			switch (this.getCurrentStep())
			{
				case STEP.ACCESS:
					return Loc.getMessage('MOBILE_MARKET_INSTALL_ACCESS_HEADER_TITLE');
				case STEP.AGREEMENTS:
					return Loc.getMessage('MOBILE_MARKET_INSTALL_AGREEMENTS_HEADER_TITLE');
				case STEP.PERMISSIONS:
				default:
					return Loc.getMessage('MOBILE_MARKET_INSTALL_PERMISSIONS_HEADER_TITLE');
			}
		}

		syncHeaderState()
		{
			const layoutWidget = this.getLayoutWidget();
			if (typeof layoutWidget?.setTitle === 'function')
			{
				layoutWidget.setTitle({
					text: this.getHeaderTitle(),
					type: 'dialog',
				});
			}

			if (typeof layoutWidget?.setLeftButtons === 'function')
			{
				layoutWidget.setLeftButtons([
					{
						type: 'back',
						callback: this.handleBack,
					},
				]);
			}

			if (typeof layoutWidget?.setRightButtons === 'function')
			{
				layoutWidget.setRightButtons([]);
			}
		}

		handleBack = () => {
			if (this.state.isSubmitting)
			{
				return;
			}

			if (this.getCurrentStep() > STEP.PERMISSIONS)
			{
				this.setState((prevState) => ({
					step: Math.max(STEP.PERMISSIONS, prevState.step - 1),
				}));

				return;
			}

			this.getLayoutWidget().close();
		};

		handleLoadRetry = () => {
			this.setState({
				isLoading: true,
				loadError: false,
				loadErrorMessage: '',
				initialData: null,
				agreementsState: [],
			}, () => {
				void this.loadInitialData();
			});
		};

		handleFooterButtonClick = () => {
			switch (this.getCurrentStep())
			{
				case STEP.PERMISSIONS:
					this.setState({ step: STEP.ACCESS });
					break;
				case STEP.ACCESS:
					this.setState({ step: STEP.AGREEMENTS });
					break;
				case STEP.AGREEMENTS:
					void this.handleInstall();
					break;
				default:
					break;
			}
		};

		handleAccessModeToggle = (isChecked) => {
			this.setState({
				accessMode: isChecked === true ? ACCESS_MODE.ALL : ACCESS_MODE.SELECTED,
			});
		};

		handleAgreementToggle = (agreementId) => {
			this.setState((prevState) => ({
				agreementsState: prevState.agreementsState.map((agreement) => (
					agreement.id === agreementId
						? { ...agreement, checked: !agreement.checked }
						: agreement
				)),
			}));
		};

		handleAgreementLinkClick = (agreement) => {
			const url = String(agreement?.url ?? '').trim();
			if (!url)
			{
				return;
			}

			inAppUrl.open(url, {
				title: this.getAgreementText(agreement?.id),
			});
		};

		handleFooterHeightChange = ({ height }) => {
			if (this.state.footerHeight !== height)
			{
				this.setState({
					footerHeight: height,
				});
			}
		};

		handleAddEmployeesClick = async () => {
			const selector = EntitySelectorFactory.createByType(EntitySelectorFactoryType.USER, {
				provider: {
					options: {
						useLettersForEmptyAvatar: true,
					},
				},
				createOptions: {
					enableCreation: false,
				},
				integrateSelectorToParentLayout: true,
				initSelectedIds: this.state.selectedUsers.map(({ id }) => id),
				allowMultipleSelection: true,
				closeOnSelect: false,
				events: {
					onClose: this.handleEmployeesSelected,
				},
			});

			const selectorWidget = await this.openSelectorWidget(
				Loc.getMessage('MOBILE_MARKET_INSTALL_EMPLOYEE_SELECTOR_TITLE'),
				true,
			);

			if (!selectorWidget)
			{
				return;
			}

			await selector.show({}, selectorWidget);
		};

		openSelectorWidget(title, withSendButton = true)
		{
			const parentWidget = this.props.selectorParentWidget ?? this.getLayoutWidget();

			return parentWidget?.openWidget('selector', {
				titleParams: {
					text: title,
					type: 'dialog',
				},
				backdrop: {
					mediumPositionPercent: 90,
					horizontalSwipeAllowed: false,
				},
				sendButtonName: withSendButton
					? Loc.getMessage('MOBILE_MARKET_INSTALL_EMPLOYEE_SELECTOR_SEND_BUTTON')
					: null,
			});
		}

		handleEmployeesSelected = (payload = []) => {
			const selectedUsers = extractSelectedItems(payload)
				.map(normalizeSelectedUser)
				.filter(Boolean);

			this.setState({
				selectedUsers,
			});
		};

		handleEmployeeRemove = (userId) => {
			this.setState((prevState) => ({
				selectedUsers: prevState.selectedUsers.filter((user) => user.id !== userId),
			}));
		};

		async handleInstall()
		{
			this.setState({ isSubmitting: true });
			await NotifyManager.showLoadingIndicator();

			try
			{
				const installResult = await this.runInstallAction();
				if (installResult?.error)
				{
					showErrorToast({
						message: this.resolveInstallErrorMessage(installResult),
					}, this.getLayoutWidget());

					return;
				}

				const rightsResult = await this.runSetRightsAction();
				if (rightsResult?.error)
				{
					showErrorToast({
						message: this.resolveRightsErrorMessage(rightsResult),
					}, this.getLayoutWidget());
				}

				this.finishInstallFlow(installResult);
			}
			catch (error)
			{
				console.error(error);
				showErrorToast({
					message: Loc.getMessage('MOBILE_MARKET_INSTALL_ERROR'),
				}, this.getLayoutWidget());
			}
			finally
			{
				NotifyManager.hideLoadingIndicatorWithoutFallback();
				this.setState({ isSubmitting: false });
			}
		}

		async runInstallAction()
		{
			const installInfo = this.getInstallInfo();
			const data = {
				code: installInfo.appCode || this.getApp().code,
			};

			if (Number(installInfo.appVersion) > 0)
			{
				data.version = Number(installInfo.appVersion);
			}

			if (installInfo.checkHash)
			{
				data.checkHash = installInfo.checkHash;
				data.installHash = installInfo.installHash;
			}

			const response = await BX.ajax.runAction('market.Application.install', {
				data,
				analyticsLabel: {
					code: data.code,
					version: data.version ?? 0,
				},
			}).catch((errorResponse) => errorResponse);

			return this.extractActionResult(response);
		}

		async runSetRightsAction()
		{
			const response = await BX.ajax.runAction('market.Application.setRights', {
				data: {
					appCode: this.getApp().code,
					rights: this.buildRightsPayload(),
				},
			}).catch((errorResponse) => errorResponse);

			return this.extractActionResult(response);
		}

		extractActionResult(response)
		{
			if (hasActionErrors(response))
			{
				return {
					error: resolveActionErrorMessage(response, 'UNKNOWN_ERROR'),
				};
			}

			return response?.data ?? response ?? {};
		}

		buildRightsPayload()
		{
			if (this.isAllEmployeesSelected())
			{
				return [];
			}

			return this.state.selectedUsers.map((user) => ({
				[`U${user.id}`]: {},
			}));
		}

		resolveInstallErrorMessage(result = {})
		{
			return (
				String(result?.errorDescription ?? '').trim()
				|| String(result?.error ?? '').trim()
				|| Loc.getMessage('MOBILE_MARKET_INSTALL_ERROR')
			);
		}

		resolveRightsErrorMessage(result = {})
		{
			return (
				String(result?.errorDescription ?? '').trim()
				|| String(result?.error ?? '').trim()
				|| Loc.getMessage('MOBILE_MARKET_INSTALL_RIGHTS_ERROR')
			);
		}

		finishInstallFlow(installResult)
		{
			if (typeof this.props.onCompleted === 'function')
			{
				this.props.onCompleted(installResult);
			}

			this.getLayoutWidget().close(() => {
				void this.handlePostInstallNavigation();
			});
		}

		async handlePostInstallNavigation()
		{
			if (String(this.props.source ?? '').trim() === 'detail')
			{
				return;
			}

			const appCode = String(this.getApp().code || this.getInstallInfo().appCode || '').trim();

			if (appCode === '')
			{
				return;
			}

			try
			{
				const extension = await requireLazy('market/detail/opener');
				extension?.MarketDetailOpener?.open({
					code: appCode,
					title: this.getApp().title || Loc.getMessage('MOBILE_MARKET_INSTALL_TITLE'),
					parentWidget: this.props.parentWidget ?? PageManager,
				});
			}
			catch (error)
			{
				console.error(error);
			}
		}

		getAgreementText(agreementId = '')
		{
			if (agreementId === AGREEMENT.TERMS_OF_SERVICE)
			{
				return Loc.getMessage('MOBILE_MARKET_INSTALL_AGREEMENT_TERMS_OF_SERVICE');
			}

			if (agreementId === AGREEMENT.EULA)
			{
				return Loc.getMessage('MOBILE_MARKET_INSTALL_AGREEMENT_EULA');
			}

			return Loc.getMessage('MOBILE_MARKET_INSTALL_AGREEMENT_PRIVACY');
		}

		render()
		{
			if (this.state.isLoading)
			{
				return this.renderLoadingState();
			}

			if (this.state.loadError)
			{
				return Box(
					{
						testId: this.getTestId(),
						safeArea: {
							top: false,
							bottom: true,
						},
						style: {
							flex: 1,
							backgroundColor: Color.bgContentPrimary.toHex(),
						},
					},
					this.renderLoadErrorState(),
				);
			}

			const app = this.getApp();
			if (!this.getInitialData().isAvailable || !app.code)
			{
				return Box(
					{
						testId: this.getTestId(),
						safeArea: {
							top: false,
							bottom: true,
						},
						style: {
							flex: 1,
							backgroundColor: Color.bgContentPrimary.toHex(),
						},
					},
					this.renderUnavailableState(),
				);
			}

			return Box(
				{
					testId: this.getTestId(),
					safeArea: {
						top: false,
						bottom: false,
					},
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				UIScrollView(
					{
						testId: this.getTestId('scroll'),
						style: {
							flex: 1,
							backgroundColor: Color.bgContentPrimary.toHex(),
						},
						showsVerticalScrollIndicator: false,
						viewProps: {
							style: {
								paddingTop: 0,
								paddingBottom: this.state.footerHeight + CONTENT_BOTTOM_PADDING,
							},
						},
					},
					this.renderCurrentStep(),
				),
				this.renderFooter(),
			);
		}

		renderLoadingState()
		{
			return Box(
				{
					testId: this.getTestId(),
					safeArea: {
						top: false,
						bottom: true,
					},
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				LoadingScreen({
					testId: this.getTestId('loading'),
				}),
			);
		}

		renderLoadErrorState()
		{
			return this.renderUnavailableState({
				description: (
					this.state.loadErrorMessage
					|| Loc.getMessage('MOBILE_MARKET_INSTALL_UNAVAILABLE_DESCRIPTION')
				),
				actionText: Loc.getMessage('MOBILE_MARKET_INSTALL_RETRY'),
				onActionClick: this.handleLoadRetry,
				testIdSuffix: 'load-error',
			});
		}

		renderUnavailableState({
			description = Loc.getMessage('MOBILE_MARKET_INSTALL_UNAVAILABLE_DESCRIPTION'),
			actionText = '',
			onActionClick = null,
			testIdSuffix = 'unavailable',
		} = {})
		{
			const hasAction = Boolean(actionText) && typeof onActionClick === 'function';

			return View(
				{
					testId: this.getTestId(testIdSuffix),
					style: {
						flex: 1,
						paddingHorizontal: CONTENT_SIDE_PADDING,
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				H4({
					testId: this.getTestId(`${testIdSuffix}-title`),
					text: Loc.getMessage('MOBILE_MARKET_INSTALL_UNAVAILABLE_TITLE'),
					style: {
						textAlign: 'center',
					},
				}),
				Text5({
					testId: this.getTestId(`${testIdSuffix}-description`),
					text: description,
					color: Color.base3,
					style: {
						marginTop: Indent.M.toNumber(),
						textAlign: 'center',
					},
				}),
				hasAction
					? Button({
						testId: this.getTestId(`${testIdSuffix}-action`),
						text: actionText,
						design: ButtonDesign.OUTLINE_ACCENT_2,
						size: ButtonSize.M,
						style: {
							marginTop: Indent.XL.toNumber(),
						},
						onClick: onActionClick,
					})
					: null,
			);
		}

		renderCurrentStep()
		{
			if (this.getCurrentStep() === STEP.ACCESS)
			{
				return MarketInstallAccessStep({
					getTestId: this.getTestId,
					isAllEmployeesSelected: this.isAllEmployeesSelected(),
					selectedUsers: this.state.selectedUsers,
					onAccessModeToggle: this.handleAccessModeToggle,
					onAddEmployeesClick: this.handleAddEmployeesClick,
					onEmployeeRemove: this.handleEmployeeRemove,
				});
			}

			if (this.getCurrentStep() === STEP.AGREEMENTS)
			{
				return MarketInstallAgreementsStep({
					getTestId: this.getTestId,
					agreements: this.state.agreementsState,
					onAgreementToggle: this.handleAgreementToggle,
					onAgreementLinkClick: this.handleAgreementLinkClick,
					getAgreementText: this.getAgreementTextHandler,
				});
			}

			return MarketInstallPermissionsStep({
				getTestId: this.getTestId,
				scopes: this.getScopes(),
			});
		}

		renderFooter()
		{
			return DialogFooter(
				{
					testId: this.getTestId('footer'),
					safeArea: true,
					onLayoutFooterHeight: this.handleFooterHeightChange,
					style: {
						borderTopWidth: 1,
						borderTopColor: Color.bgSeparatorPrimary.toHex(),
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				Button({
					testId: this.getTestId('footer-button'),
					design: ButtonDesign.FILLED,
					size: ButtonSize.L,
					text: this.getFooterButtonText(),
					stretched: true,
					onClick: this.handleFooterButtonClick,
					disabled: this.isFooterButtonDisabled(),
				}),
			);
		}
	}

	module.exports = {
		MarketInstall: (props) => new MarketInstall(props),
	};
});
