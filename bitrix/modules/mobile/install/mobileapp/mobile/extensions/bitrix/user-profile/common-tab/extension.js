/**
 * @module user-profile/common-tab
 */
jn.define('user-profile/common-tab', (require, exports, module) => {
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { AreaList } = require('ui-system/layout/area-list');
	const { ButtonDesign, ButtonSize, Button } = require('ui-system/form/buttons/button');
	const { Link4, LinkDesign, LinkMode } = require('ui-system/blocks/link');
	const { Indent, Color, Corner, Component } = require('tokens');
	const { getTabsDataRunActionExecutor } = require('user-profile/api');
	const { TabsCacheManager } = require('user-profile/common-tab/src/cache-manager');
	const { ProfileBlockFactory } = require('user-profile/common-tab/src/block/factory');
	const { createTestIdGenerator } = require('utils/test');
	const { Animated } = require('animation/animated');
	const { Haptics } = require('haptics');
	const { Loc } = require('loc');
	const { NotifyManager } = require('notify-manager');
	const { usersUpserted } = require('statemanager/redux/slices/users');
	const { dispatch } = require('statemanager/redux/store');
	const { Type } = require('type');
	const { ajaxPublicErrorHandler } = require('error');
	const { TabType, closeIcon } = require('user-profile/const');
	const { confirmClosing } = require('alert');
	const { FieldChangeManager } = require('user-profile/common-tab/src/field-change-manager');
	const { OnboardingBase, CaseName } = require('onboarding');
	const { isCloudAccount, openDeleteDialog } = require('user/account');
	const { UserProfileAnalytics } = require('user-profile/analytics');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Circle, Line } = require('utils/skeleton');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { Area } = require('ui-system/layout/area');
	const { Random } = require('utils/random');

	const CloseEditActions = {
		SAVE_AND_EXIT: 'save_and_exit',
		CONTINUE_EDIT: 'continue_edit',
		EXIT_WITHOUT_SAVE: 'exit_without_save',
	};

	/**
	 * @typedef {Object} CommonTabProps
	 * @property {number} ownerId
	 * @property {PageManager} parentWidget
	 *
	 * @class CommonTab
	 */
	class CommonTab extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'common-tab',
				context: this,
			});

			const {
				ownerId,
				data,
				isEditMode,
				canView,
				canUpdate,
				isPending,
				selectedTabId,
			} = props;

			this.cacheManager = new TabsCacheManager();
			this.cacheManager.setRunActionExecutor(getTabsDataRunActionExecutor({ ownerId, selectedTabId }));

			this.onFieldChange = this.onFieldChange.bind(this);

			/** @type {Button|null} */
			this.saveButtonRef = null;
			this.contentOpacity = Animated.newCalculatedValue(1);

			this.scrollViewRef = null;
			this.fieldsManager = new FieldChangeManager();
			this.closeButtonUpdated = false;
			this.pendingScrollRef = null;
			this.isKeyboardVisible = false;

			this.state = {
				data: data ?? null,
				isEditMode: isEditMode ?? false,
				canView: canView ?? false,
				canUpdate: canUpdate ?? false,
				isPending: isPending ?? true,
			};
		}

		async componentDidMount()
		{
			const { parentWidget, canUpdate, ownerId, data } = this.props;

			if (canUpdate)
			{
				parentWidget.setRightButtons([
					{
						type: 'edit',
						badgeCode: 'profile_edit',
						testId: this.getTestId('edit-button'),
						callback: () => this.#activateEditMode(),
					},
				]);

				void OnboardingBase.tryToShow(CaseName.ON_PROFILE_SHOULD_BE_FILLED, {
					targetRef: 'profile_edit',
					ownerId,
					commonFields: data.commonFields,
				});
			}

			Keyboard.on(Keyboard.Event.Hidden, this.#onKeyboardHidden);
			Keyboard.on(Keyboard.Event.Shown, this.#onKeyboardShown);
		}

		componentDidUpdate()
		{
			const { isEditMode } = this.state;
			const { parentWidget } = this.props;

			if (isEditMode && !this.closeButtonUpdated)
			{
				this.closeButtonUpdated = true;
				parentWidget.setLeftButtons([]);
				parentWidget.setLeftButtons([
					{
						svg: {
							content: closeIcon,
						},
						callback: this.onEditScreenClose,
					},
				]);
			}
		}

		componentWillUnmount()
		{
			Keyboard.off(Keyboard.Event.Hidden, this.#onKeyboardHidden);
			Keyboard.off(Keyboard.Event.Shown, this.#onKeyboardShown);
		}

		#onKeyboardHidden = () => {
			this.isKeyboardVisible = false;
			this.#updateSaveButtonState();
		};

		#onKeyboardShown = () => {
			this.isKeyboardVisible = true;
			if (this.pendingScrollRef)
			{
				this.#scrollToField(this.pendingScrollRef);
				this.pendingScrollRef = null;
			}
		};

		update(newProps)
		{
			const { canView, isPending, data = null, canUpdate = null } = newProps;
			this.setState({
				data,
				canUpdate,
				canView,
				isPending,
			}, () => {
				this.#addEditProfileButton();
			});
		}

		#addEditProfileButton()
		{
			const { parentWidget, ownerId } = this.props;
			const { canUpdate, data } = this.state;
			const { commonFields } = data ?? {};

			if (canUpdate)
			{
				parentWidget.setRightButtons([
					{
						type: 'edit',
						badgeCode: 'profile_edit',
						testId: this.getTestId('edit-button'),
						callback: () => this.#activateEditMode(),
					},
				]);

				void OnboardingBase.tryToShow(CaseName.ON_PROFILE_SHOULD_BE_FILLED, {
					targetRef: 'profile_edit',
					ownerId,
					commonFields,
				});
			}
		}

		#updateSaveButtonState()
		{
			if (!this.saveButtonRef)
			{
				return;
			}

			this.saveButtonRef.setLoading(this.isSaving);
			this.saveButtonRef.setDisabled(!this.fieldsManager.canSave());
		}

		render()
		{
			const { isEditMode, canView, isPending } = this.state;

			if (isPending)
			{
				return this.#renderShimmer();
			}

			if (!canView)
			{
				return this.#renderPermissionDenied();
			}

			return Box(
				{
					safeArea: {
						bottom: false,
					},
					scrollProps: {
						ref: this.bindScrollViewRef,
						style: {
							backgroundColor: Color.bgContentSecondary.toHex(),
						},
					},
					footer: isEditMode && BoxFooter(
						{
							style: {
								opacity: this.contentOpacity,
							},
						},
						() => ([
							Button({
								testId: this.getTestId('button-save'),
								stretched: true,
								disabled: !this.fieldsManager.canSave(),
								size: ButtonSize.L,
								text: Loc.getMessage('M_PROFILE_EDIT_BUTTON_SAVE'),
								withStateDecorator: true,
								ref: (ref) => {
									this.saveButtonRef = ref;
								},
								onClick: this.#onSaveButtonClick,
							}),
							Button({
								testId: this.getTestId('button-cancel'),
								design: ButtonDesign.PLAIN_NO_ACCENT,
								stretched: true,
								size: ButtonSize.L,
								text: Loc.getMessage('M_PROFILE_EDIT_BUTTON_CANCEL'),
								onClick: () => {
									Haptics.impactLight();
									void this.#deactivateEditMode();
								},
								style: {
									paddingTop: Indent.L.toNumber(),
									paddingBottom: Indent.XL3.toNumber(),
								},
							}),
						]),
					),
					withScroll: true,
					testId: this.getTestId('box'),
					onPan: () => Keyboard.dismiss(),
					resizableByKeyboard: true,
				},
				AreaList(
					{
						testId: this.getTestId('area-list'),
						style: {
							backgroundColor: Color.bgContentSecondary.toHex(),
							opacity: this.contentOpacity,
						},
						withScroll: false,
					},
					...this.blocks,
					this.#renderDeleteProfileButton(),
				),
			);
		}

		#renderPermissionDenied()
		{
			return StatusBlock({
				title: Loc.getMessage('M_PROFILE_PERMISSION_DENIED_TEXT'),
				titleColor: Color.base3,
				emptyScreen: true,
				preventRefresh: true,
				image: Image({
					resizeMode: 'contain',
					style: {
						width: 108,
						height: 108,
					},
					uri: makeLibraryImagePath('lock.png', 'profile/permission-denied'),
				}),
				style: {
					backgroundColor: Color.bgContentSecondary.toHex(),
				},
			});
		}

		#renderShimmer()
		{
			const buttonWidth = (device.screen.width - Indent.XL2 - Component.areaPaddingLr.toNumber() * 2) / 2;

			return View(
				{},
				Area(
					{
						isFirst: true,
						excludePaddingSide: {
							bottom: true,
						},
					},
					Card(
						{
							design: CardDesign.SECONDARY,
							style: {
								flexDirection: 'row',
								justifyContent: 'flex-start',
								alignItems: 'center',
							},
						},
						View(
							{},
							Circle(72),
						),
						View(
							{
								style: {
									paddingLeft: Indent.XL2.toNumber(),
								},
							},
							Line(160, 18, 0, Indent.S.toNumber(), Corner.L.toNumber()),
							Line(220, 13, 0, Indent.L.toNumber(), Corner.L.toNumber()),
							Line(130, 12, 0, 0, Corner.L.toNumber()),
						),
					),
					View(
						{
							style: {
								flexDirection: 'row',
								marginTop: Indent.XL.toNumber(),
								marginBottom: Indent.XL.toNumber(),
							},
						},
						View(
							{
								style: {
									marginRight: Indent.XL2.toNumber(),
								},
							},
							Line(buttonWidth, 42, 0, 0, Corner.L.toNumber()),
						),
						Line(buttonWidth, 42, 0, 0, Corner.L.toNumber()),
					),
				),
				Area(
					{
						style: {
							flex: 1,
							backgroundColor: Color.bgContentSecondary.toHex(),
							marginTop: Component.cardListPaddingTb.toNumber(),
						},
					},
					Card(
						{},
						this.#renderShimmerField(),
						this.#renderShimmerField(),
						this.#renderShimmerField(),
						this.#renderShimmerField(),
						this.#renderShimmerField(),
						this.#renderShimmerField(),
						this.#renderShimmerField(),
					),
				),
			);
		}

		#renderShimmerField()
		{
			const titleWidth = Random.getInt(130, 190);
			const fieldValueWidth = Random.getInt(190, 250);

			return View(
				{
					style: {
						paddingVertical: Indent.S.toNumber(),
						marginBottom: Indent.M.toNumber(),
					},
				},
				Line(titleWidth, 13, 0, Indent.S.toNumber(), Corner.L.toNumber()),
				Line(fieldValueWidth, 15, 0, 0, Corner.L.toNumber()),
			);
		}

		get blocks()
		{
			const { ownerId, parentWidget } = this.props;
			const { data, isEditMode } = this.state;

			const { users } = data;
			if (Type.isArrayFilled(users))
			{
				dispatch(usersUpserted(users));
			}

			return ProfileBlockFactory.getAll({
				...data,
				isEditMode,
				ownerId,
				parentWidget,
				cacheManager: this.cacheManager,
				onChange: this.onFieldChange,
				onFocus: this.onFieldFocus,
			});
		}

		#renderDeleteProfileButton()
		{
			const { ownerId, parentWidget } = this.props;
			const { isEditMode } = this.state;

			if (
				Number(ownerId) !== Number(env.userId)
				|| !isEditMode
				|| !isCloudAccount()
			)
			{
				return null;
			}

			return Link4({
				style: {
					marginTop: Indent.XL2.toNumber(),
					marginBottom: (Application.getPlatform() === 'ios' ? 0 : Indent.XL4.toNumber()),
					alignSelf: 'center',
				},
				design: LinkDesign.ALERT,
				mode: LinkMode.DASH,
				text: Loc.getMessage('M_PROFILE_DELETE'),
				onClick: () => openDeleteDialog(parentWidget),
			});
		}

		onFieldFocus = (ref) => {
			this.pendingScrollRef = ref;

			if (this.isKeyboardVisible)
			{
				this.#scrollToField(ref);
				this.pendingScrollRef = null;
			}
		};

		#scrollToField(ref)
		{
			const position = this.scrollViewRef?.getPosition(ref);
			if (position)
			{
				this.scrollViewRef?.scrollTo({ y: position.y - 20, animated: true });
			}
		}

		bindScrollViewRef = (ref) => {
			this.scrollViewRef = ref;
		};

		scrollToTop()
		{
			this.scrollViewRef?.scrollToBegin(false);
		}

		onFieldChange(key, value, isValid)
		{
			this.fieldsManager.setField(key, value, isValid);
			this.#updateSaveButtonState();
		}

		async #activateEditMode()
		{
			const { parentWidget } = this.props;
			this.isSaving = false;
			this.fieldsManager.clear();

			Haptics.impactLight();

			parentWidget.setRightButtons([]);

			await this.#fadeIn();
			this.setState({ isEditMode: true }, () => {
				this.#updateSaveButtonState();
				this.#fadeOut();
				this.updateTabsEditMode(true);
				this.updateWidgetTitle(true);
			});
		}

		async #deactivateEditMode()
		{
			const { parentWidget } = this.props;
			await this.#fadeIn();
			this.setState({ isEditMode: false }, () => {
				parentWidget.setRightButtons([
					{
						type: 'edit',
						badgeCode: 'profile_edit',
						testId: this.getTestId('edit-button'),
						callback: () => this.#activateEditMode(),
					},
				]);
				this.#fadeOut();
				this.scrollToTop();
				this.updateTabsEditMode(false);
				this.updateWidgetTitle(false);
			});
		}

		updateWidgetTitle(isEditMode)
		{
			const { tabsWidget } = this.props;
			const text = isEditMode
				? Loc.getMessage('M_PROFILE_EDIT_TITLE')
				: Loc.getMessage('M_PROFILE_TITLE');
			tabsWidget.setTitle({
				text,
			}, true);
		}

		updateTabsEditMode(isEditMode)
		{
			const { tabsWidget } = this.props;
			Object.values(TabType)
				.filter((tabId) => tabId !== TabType.COMMON)
				.forEach((tabId) => {
					tabsWidget.updateItem(tabId, {
						selectable: !isEditMode,
					});
				});
		}

		onEditScreenClose = async () => {
			const { tabsWidget } = this.props;
			if (this.fieldsManager.hasChanges())
			{
				const action = await this.showSaveEditChangesAlert(this.fieldsManager.canSave());
				switch (action)
				{
					case CloseEditActions.EXIT_WITHOUT_SAVE:
						tabsWidget.close();
						break;
					case CloseEditActions.SAVE_AND_EXIT:
						{
							const success = await this.#saveChanges();
							if (success)
							{
								tabsWidget.close();
							}
						}
						break;
					case CloseEditActions.CONTINUE_EDIT:
						break;
					default:
				}
			}
			else
			{
				tabsWidget.close();
			}
		};

		showSaveEditChangesAlert = async (hasSaveAndClose) => {
			return new Promise((resolve) => {
				confirmClosing({
					onSave: () => resolve(CloseEditActions.SAVE_AND_EXIT),
					onClose: () => resolve(CloseEditActions.EXIT_WITHOUT_SAVE),
					onCancel: () => resolve(CloseEditActions.CONTINUE_EDIT),
					hasSaveAndClose,
				});
			});
		};

		#fadeIn()
		{
			return new Promise((resolve) => {
				const config = {
					toValue: 0,
					duration: 0.2,
					type: 'easeInQuad',
				};
				Animated.timing(this.contentOpacity, config).start(() => resolve());
			});
		}

		#fadeOut()
		{
			const config = {
				toValue: 1,
				duration: 0.2,
				type: 'easeOutQuad',
			};

			Animated.timing(this.contentOpacity, config).start(null);
		}

		#onSaveButtonClick = () => {
			void this.#saveChanges();
		};

		#saveChanges = async () => {
			if (!this.fieldsManager.canSave() || this.isSaving)
			{
				return false;
			}

			this.isSaving = true;
			this.#updateSaveButtonState();
			void NotifyManager.showLoadingIndicator();
			Haptics.impactLight();

			let response = {};
			try
			{
				response = await this.fieldsManager.saveChanges(this.props.ownerId);
			}
			catch (result)
			{
				await ajaxPublicErrorHandler(result);
				NotifyManager.hideLoadingIndicator(false);
				this.isSaving = false;
				this.#updateSaveButtonState();
			}

			const { status, data } = response;
			const isSuccess = status === 'success';
			NotifyManager.hideLoadingIndicator(isSuccess);
			if (isSuccess)
			{
				UserProfileAnalytics.sendEditContactInfo(this.fieldsManager.getChangedCommonFieldsIds());
				this.fieldsManager.clear();
				this.#updateFields(data);
				await this.#deactivateEditMode();
			}
			else
			{
				await ajaxPublicErrorHandler(response);
			}

			return isSuccess;
		};

		#updateFields(data)
		{
			const { users } = data;

			if (Type.isArrayFilled(users))
			{
				dispatch(usersUpserted(users));
			}

			this.setState({
				data,
			}, () => {
				this.cacheManager?.modifyCommonTabDataInCache(data);
				this.scrollToTop();
			});
		}
	}

	module.exports = {
		/**
		 * @param {CommonTabProps} props
		 * @returns {CommonTab}
		 */
		CommonTab: (props) => new CommonTab(props),
	};
});
