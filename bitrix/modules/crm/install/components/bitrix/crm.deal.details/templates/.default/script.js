/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_core_events, ui_tour, spotlight, main_popup) {
	'use strict';

	class DealOnboardingManager {
		#onboardingData;
		#contentContainer;
		#serviceUrl;
		#dealDetailManager;
		#activeDocumentGuide = null;
		static get productsTabId() {
			return 'tab_products';
		}
		constructor(params) {
			this.#onboardingData = params.onboardingData;
			this.#contentContainer = params.contentContainer;
			this.#serviceUrl = params.serviceUrl;
			this.#dealDetailManager = params.dealDetailManager;
		}
		#getContentContainer() {
			return this.#contentContainer;
		}
		#getButtonsContainer() {
			return this.#getContentContainer().querySelector('.main-buttons');
		}
		#isHintCanBeShown() {
			if (main_popup.PopupWindowManager && main_popup.PopupWindowManager.isAnyPopupShown()) {
				return false;
			}
			return true;
		}
		processOnboarding() {
			if (!this.#isHintCanBeShown()) {
				return;
			}
			const chain = this.#onboardingData.chain;
			const step = this.#onboardingData.chainStep;
			const successDealGuideIsOver = this.#onboardingData.successDealGuideIsOver;
			if (chain === 0) {
				if (step < 1) {
					this.#processProductTabHint();
				}
				if (step < 2) {
					this.#hintProductListField();
				}
			} else if (chain === 1 && step === 0) {
				this.#hintAddDocumentLink();
			}
			if (!successDealGuideIsOver) {
				this.#hintSuccessDealDocumentInTimeline();
			}
		}
		#processProductTabHint() {
			({
				title: main_core.Loc.getMessage('CRM_DEAL_DETAIL_WAREHOUSE_AUTOMATIC_RESERVATION_GUIDE_TITLE'),
				text: main_core.Loc.getMessage('CRM_DEAL_DETAIL_WAREHOUSE_AUTOMATIC_RESERVATION_GUIDE_TEXT')
			});
			if (this.#dealDetailManager.isTabButtonVisible(DealOnboardingManager.productsTabId)) {
				this.#hintToVisibleProductTab();
			} else {
				this.#hintToHiddenProductTab();
			}
		}
		#createHintToProductTab(target, guideEvents = {}) {
			const guideText = {
				title: main_core.Loc.getMessage('CRM_DEAL_DETAIL_WAREHOUSE_AUTOMATIC_RESERVATION_GUIDE_TITLE'),
				text: main_core.Loc.getMessage('CRM_DEAL_DETAIL_WAREHOUSE_AUTOMATIC_RESERVATION_GUIDE_TEXT')
			};
			return new ui_tour.Guide({
				steps: [{
					target: target,
					title: guideText.title,
					text: guideText.text,
					position: 'bottom',
					events: guideEvents
				}],
				onEvents: true
			});
		}
		#hintToVisibleProductTab() {
			const productsTabButton = this.#dealDetailManager.getTabMenuItemContainer(DealOnboardingManager.productsTabId);
			const productsTabGuide = this.#createHintToProductTab(productsTabButton, {
				onClose: () => {
					main_core.userOptions.save('crm', 'warehouse-onboarding', 'firstChainStage', 1);
				}
			});
			productsTabGuide.showNextStep();
			const tabsContainer = this.#dealDetailManager.getTabManager().getTabMenuContainer();
			const windowResizeHandler = () => {
				if (!this.#dealDetailManager.isTabButtonVisible(DealOnboardingManager.productsTabId)) {
					productsTabGuide.close();
					main_core.Event.unbind(window, 'resize', windowResizeHandler);
				}
			};
			main_core.Event.bind(window, 'resize', windowResizeHandler);
			main_core.Event.bindOnce(tabsContainer, 'mousedown', () => {
				productsTabGuide.close();
				main_core.Event.unbind(window, 'resize', windowResizeHandler);
			});
		}
		#hintToHiddenProductTab() {
			const moreButton = this.#dealDetailManager.getTabManager().getMoreButton();
			const spotlight = new BX.SpotLight({
				id: `${DealOnboardingManager.productsTabId}_spotlight`,
				targetElement: moreButton,
				autoSave: true,
				targetVertex: "middle-center",
				zIndex: 200
			});
			spotlight.show();
			spotlight.container.style.pointerEvents = "none";
			const onOpenMoreMenuHandler = event => {
				const eventMoreMenu = event.target.getMoreMenu();
				const dealMoreMenu = this.#dealDetailManager.getTabManager().getMoreMenu();
				if (eventMoreMenu === dealMoreMenu) {
					spotlight.close();
					const productsTabGuide = this.#createHintToProductTab(this.#dealDetailManager.getTabFromMoreMenu(DealOnboardingManager.productsTabId));
					const moreMenuContainer = eventMoreMenu.getMenuContainer();
					const tabHintTimeout = setTimeout(() => {
						productsTabGuide.showNextStep();
						BX.bindOnce(moreMenuContainer, 'click', moreMenuClickHandler);
						const productsTabPopup = productsTabGuide.getPopup();
						main_core_events.EventEmitter.subscribeOnce(productsTabPopup, 'onClose', onPopupCloseHandler);
						const popupContainer = productsTabGuide.getPopup().getContentContainer().parentNode;
						BX.bind(popupContainer, 'mouseenter', () => {
							event.target.showMoreMenu();
						});
						BX.bind(popupContainer, 'mouseleave', () => {
							const outOfPopupTimeout = setTimeout(() => {
								event.target.closeMoreMenu();
							}, 300);
							main_core.Event.bindOnce(dealMoreMenu.getMenuContainer(), 'mouseenter', () => {
								clearTimeout(outOfPopupTimeout);
							});
						});
					}, 50);
					const onPopupCloseHandler = event => {
						main_core.userOptions.save('crm', 'warehouse-onboarding', 'firstChainStage', 1);
						main_core.Event.unbind(window, 'resize', windowResizeHandler);
						main_core.Event.unbind(moreMenuContainer, 'click', moreMenuClickHandler);
						main_core_events.EventEmitter.unsubscribe('BX.Main.InterfaceButtons:onMoreMenuShow', onOpenMoreMenuHandler);
					};
					const moreMenuClickHandler = () => {
						main_core.userOptions.save('crm', 'warehouse-onboarding', 'firstChainStage', 1);
						productsTabGuide.close();
					};
					main_core.Event.bind(dealMoreMenu.getMenuContainer(), 'click', onPopupCloseHandler);
					main_core_events.EventEmitter.subscribeOnce('BX.Main.InterfaceButtons:onMoreMenuClose', event => {
						const eventMoreMenu = event.target.getMoreMenu();
						const dealMoreMenu = this.#dealDetailManager.getTabManager().getMoreMenu();
						if (eventMoreMenu === dealMoreMenu) {
							clearTimeout(tabHintTimeout);
							main_core.Event.unbind(moreMenuContainer, 'click', moreMenuClickHandler);
							productsTabGuide.close();
						}
					});
				}
			};
			main_core_events.EventEmitter.subscribe('BX.Main.InterfaceButtons:onMoreMenuShow', onOpenMoreMenuHandler);
			const windowResizeHandler = () => {
				if (this.#dealDetailManager.isTabButtonVisible(DealOnboardingManager.productsTabId)) {
					spotlight.close();
					this.#hintToVisibleProductTab();
					main_core.Event.unbind(window, 'resize', windowResizeHandler);
					main_core_events.EventEmitter.unsubscribe('BX.Main.InterfaceButtons:onMoreMenuShow', onOpenMoreMenuHandler);
				}
			};
			main_core.Event.bind(window, 'resize', windowResizeHandler);
		}
		#hintProductListField() {
			const buttonsContainer = this.#getContentContainer().querySelector('.main-buttons');
			const productListTabListener = event => {
				const [productListEditor] = event.data;
				const buttonsPanelListener = () => {
					const activeHint = productListEditor.getActiveHint();
					if (activeHint !== null) {
						activeHint.close();
						main_core.Event.unbind(buttonsContainer, 'click', buttonsPanelListener);
					}
				};
				main_core.Event.bind(buttonsContainer, 'click', buttonsPanelListener);
				const productList = productListEditor.products;
				let rowId = '';
				if (productList instanceof Array) {
					const firstProductRow = productList.find(row => !row.getModel().isService());
					if (firstProductRow) {
						rowId = firstProductRow.getId();
					}
				}
				if (!rowId) {
					return;
				}
				productListEditor.showFieldTourHint('STORE_INFO', {
					title: main_core.Loc.getMessage('CRM_DEAL_DETAIL_WAREHOUSE_PRODUCT_STORE_GUIDE_TITLE'),
					text: main_core.Loc.getMessage('CRM_DEAL_DETAIL_WAREHOUSE_PRODUCT_STORE_GUIDE_TEXT')
				}, () => {
					main_core.userOptions.save('crm', 'warehouse-onboarding', 'firstChainStage', 2);
					BX.ajax.post(this.#serviceUrl, {
						ACTION: 'FIX_FIRST_ONBOARD_CHAIN_VIEW'
					});
					main_core.Event.unbind(buttonsContainer, 'click', buttonsPanelListener);
					main_core_events.EventEmitter.unsubscribe('onDemandRecalculateWrapper', productListTabListener);
				}, ['RESERVE_INFO'], rowId);
			};
			main_core_events.EventEmitter.subscribe('onDemandRecalculateWrapper', productListTabListener);
		}
		#hintAddDocumentLink() {
			const documentsListTourListener = event => {
				if (this.#activeDocumentGuide !== null) {
					this.#activeDocumentGuide.close();
				}
				const buttonsContainer = this.#getButtonsContainer();
				const sumControlContainer = document.querySelector('[data-cid="OPPORTUNITY_WITH_CURRENCY"]');
				const addDocumentButton = sumControlContainer && sumControlContainer.querySelector('.crm-entity-widget-payment-add-box');
				if (addDocumentButton !== null) {
					const settingsButton = sumControlContainer.querySelector('.ui-entity-editor-block-context-menu');
					const dragButton = sumControlContainer.querySelector('.ui-entity-editor-draggable-btn');
					const guideText = {
						title: main_core.Loc.getMessage('CRM_DEAL_DETAIL_WAREHOUSE_ADD_DOCUMENT_GUIDE_TITLE'),
						text: main_core.Loc.getMessage('CRM_DEAL_DETAIL_WAREHOUSE_ADD_DOCUMENT_GUIDE_TEXT')
					};
					const addDocumentGuide = new ui_tour.Guide({
						steps: [{
							target: addDocumentButton,
							title: guideText.title,
							text: guideText.text,
							events: {
								onClose: () => {
									main_core.Event.unbind(buttonsContainer, 'click', userCloseHintHandler);
									main_core.Event.unbind(settingsButton, 'click', userCloseHintHandler);
									main_core.Event.unbind(dragButton, 'mousedown', userCloseHintHandler);
								}
							}
						}],
						onEvents: true
					});
					this.#activeDocumentGuide = addDocumentGuide;
					const userCloseHintHandler = () => {
						main_core.Event.unbind(buttonsContainer, 'click', userCloseHintHandler);
						main_core_events.EventEmitter.unsubscribe('PaymentDocuments.EntityEditor:changeDocuments', documentsListTourListener);
						addDocumentGuide.close();
						main_core.userOptions.save('crm', 'warehouse-onboarding', 'secondChainStage', 1);
					};
					addDocumentGuide.showNextStep();
					main_core.Event.bind(addDocumentGuide.getPopup().closeIcon, 'click', userCloseHintHandler);
					main_core.Event.bind(buttonsContainer, 'click', userCloseHintHandler);
					main_core.Event.bind(addDocumentButton, 'click', userCloseHintHandler);
					main_core.Event.bind(settingsButton, 'click', userCloseHintHandler);
					main_core.Event.bind(dragButton, 'mousedown', userCloseHintHandler);
				}
			};
			main_core_events.EventEmitter.subscribe('PaymentDocuments.EntityEditor:changeDocuments', documentsListTourListener);
		}
		#hintSuccessDealDocumentInTimeline() {
			const timelineGuideListener = event => {
				if (event.data[1].currentStepId === 'WON' && event.data[1].currentSemantics === 'success') {
					main_core_events.EventEmitter.unsubscribe('Crm.EntityProgress.Saved', timelineGuideListener);
					const onHistoryNodeAddedHandler = event => {
						main_core_events.EventEmitter.unsubscribe('BX.Crm.Timeline.Items.FinalSummaryDocuments:onHistoryNodeAdded', onHistoryNodeAddedHandler);
						BX.onCustomEvent(window, 'OpenEntityDetailTab', ['main']);
						const [timelineDocsNode] = event.data;
						const previousNodePos = {
							x: 0,
							y: 0
						};
						const documentLinkNodeWatcherId = setInterval(() => {
							const documentLinkNode = timelineDocsNode.querySelector('.crm-entity-stream-content-document-description');
							if (documentLinkNode === null) {
								return;
							}
							const nodePos = main_core.Dom.getPosition(documentLinkNode);
							if (nodePos.x === 0 && nodePos.y === 0) {
								return;
							}
							if (nodePos.x !== previousNodePos.x || nodePos.y !== previousNodePos.y) {
								previousNodePos.x = nodePos.x;
								previousNodePos.y = nodePos.y;
								return;
							}
							clearInterval(documentLinkNodeWatcherId);
							const successDealGuide = this.#createHintToSuccessDocument(documentLinkNode, {
								onClose: () => {
									main_core.userOptions.save('crm', 'warehouse-onboarding', 'successDealGuideIsOver', true);
									unsubscribeFromHintClicks();
								}
							});
							const dealContainer = this.#getContentContainer();
							const buttonsContainer = this.#getButtonsContainer();
							const unsubscribeFromHintClicks = () => {
								main_core.Event.unbind(dealContainer, 'click', successDealGuide.close.bind(successDealGuide));
								main_core.Event.unbind(buttonsContainer, 'click', successDealGuide.close.bind(successDealGuide));
							};
							window.scrollTo(0, nodePos.y - 250);
							successDealGuide.showNextStep();
							main_core.Event.bind(buttonsContainer, 'click', successDealGuide.close.bind(successDealGuide));
							setTimeout(() => {
								main_core.Event.bind(dealContainer, 'click', successDealGuide.close.bind(successDealGuide));
							}, 3000);
						}, 100);
					};
					main_core_events.EventEmitter.subscribe('BX.Crm.Timeline.Items.FinalSummaryDocuments:onHistoryNodeAdded', onHistoryNodeAddedHandler);
				}
			};
			main_core_events.EventEmitter.subscribe('Crm.EntityProgress.Saved', timelineGuideListener);
		}
		#createHintToSuccessDocument(target, guideEvents = {}) {
			const guideText = {
				title: main_core.Loc.getMessage('CRM_DEAL_DETAIL_WAREHOUSE_SUCCESS_DEAL_GUIDE_TITLE'),
				text: main_core.Loc.getMessage('CRM_DEAL_DETAIL_WAREHOUSE_SUCCESS_DEAL_GUIDE_TEXT')
			};
			return new ui_tour.Guide({
				steps: [{
					target: target,
					title: guideText.title,
					text: guideText.text,
					position: 'bottom',
					events: guideEvents
				}],
				onEvents: true
			});
		}
	}

	class DealManager {
		#dealGuid;
		#dealDetailManager;
		#dealOnboardingManager = null;
		#cache = new main_core.Cache.MemoryCache();
		constructor(params) {
			this.#dealGuid = params.guid;
			this.#dealDetailManager = BX.Crm.EntityDetailManager.get(this.#dealGuid);
		}
		getContainer() {
			return this.#cache.remember('container', () => {
				return document.getElementById(this.#dealGuid + '_container');
			});
		}
		getDealDetailManager() {
			return this.#dealDetailManager;
		}
		enableOnboardingChain(onboardingData, serviceUrl) {
			if (this.#dealOnboardingManager === null && this.getDealDetailManager() !== null) {
				this.#dealOnboardingManager = new DealOnboardingManager({
					onboardingData: onboardingData,
					contentContainer: this.getContainer(),
					serviceUrl: serviceUrl,
					dealDetailManager: this.getDealDetailManager()
				});
				this.#dealOnboardingManager.processOnboarding();
			}
		}
	}

	exports.DealManager = DealManager;

})(this.BX.Crm.Deal = this.BX.Crm.Deal || {}, BX, BX.Event, BX.UI.Tour, BX, BX.Main);
//# sourceMappingURL=script.js.map
