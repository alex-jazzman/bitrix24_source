/* eslint-disable */
this.BX = this.BX || {};
this.BX.AI = this.BX.AI || {};
this.BX.AI.SharePrompt = this.BX.AI.SharePrompt || {};
(function (exports, main_core_events, main_core, ui_label, main_popup, main_loader, ui_analytics) {
	'use strict';

	class PopupCategoriesRenderer {
		render(list) {
			const listElements = list.map(item => {
				const label = new ui_label.Label({
					text: item.name,
					fill: true,
					color: ui_label.Label.Color.LIGHT
				});
				return main_core.Tag.render`<li>${label.render()}</li>`;
			});
			return main_core.Tag.render`<ul class="ai__categories-popup_list">${listElements}</ul>`;
		}
	}

	class ListRenderer {
		render() {}
	}

	async function showNotification(content) {
		main_core.Runtime.loadExtension('ui.notification').then(() => {
			const NotificationCenter = main_core.Reflection.getClass('BX.UI.Notification.Center');
			NotificationCenter.notify({
				content
			});
		}).catch(() => {
			if (main_core.Type.isElementNode(content)) {
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs,no-alert
				alert(content.innerText);
			} else {
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs,no-alert
				alert(content);
			}
		});
	}
	function highlightText(text, searchTerm) {
		if (!searchTerm || !text) {
			return text;
		}
		const lowerSearchTerm = searchTerm.toLowerCase();
		const regex = new RegExp(lowerSearchTerm, 'gi');
		return text.replace(regex, match => `<mark>${match}</mark>`);
	}
	function wrapTextToHtmlWithWordBreak(text) {
		return main_core.Tag.render`<span style="word-break: break-word;">${text}</span>`;
	}

	class SharesListRenderer extends ListRenderer {
		render(sharesList, searchValue) {
			const search = searchValue || null;
			const itemsElements = sharesList.map(item => {
				const encodedName = main_core.Text.encode(item.name);
				const highlightedName = highlightText(encodedName, search);
				return main_core.Tag.render`
				<li class="ai__prompt-library-grid-shares-popup_shares-list-item">
					<div class="ai__prompt-library-grid-shares-popup_shares-list-item-avatar">
						${this.#renderShareItemImg(item)}
					</div>
					<div class="ai__prompt-library-grid-shares-popup_shares-list-item-title">
						${highlightedName}
					</div>
				</li>
			`;
			});
			return main_core.Tag.render`<ul class="ai__prompt-library-grid-shares-popup_shares-list">${itemsElements}</ul>`;
		}
		#renderShareItemImg(shareItem) {
			if (main_core.Type.isStringFilled(shareItem.img)) {
				return main_core.Tag.render`<img src="${shareItem.img}" alt="${shareItem.name}" />`;
			}
			return this.#renderShareItemInitials(shareItem.name);
		}
		#renderShareItemInitials(title) {
			if (!title) {
				return '';
			}
			const initials = title.split(' ').slice(0, 2).map(titleWord => {
				return titleWord[0].toUpperCase();
			}).join('');
			return main_core.Tag.render`<span class="ai__prompt-library-grid-shares-popup_shares-list-item-initials">${initials}</span>`;
		}
	}

	class PopupWithLoader {
		#bindElement = null;
		#popupContent;
		#isLoading = false;
		#popup = null;
		#list = [];
		#listRenderer;
		#events;
		#useSearch;
		#searchValue = '';
		#filter;
		constructor(options) {
			this.#bindElement = options.bindElement;
			this.#listRenderer = options.listRenderer;
			this.#events = options.events || {};
			this.#filter = options.filter || null;
			this.#useSearch = options.useSearch === true;
		}
		show() {
			if (!this.#popup) {
				this.#initPopup();
			}
			this.#popup.show();
			if (this.#isLoading) {
				const copilotColor = getComputedStyle(document.body).getPropertyValue('--ui-color-copilot-primary');
				const loader = new main_loader.Loader({
					target: this.#popupContent,
					size: 30,
					color: copilotColor
				});
				loader.show(this.#popupContent.root);
			}
		}
		hide() {
			this.#popup?.destroy();
			this.#popup = null;
			this.#popupContent = null;
		}
		isShown() {
			return Boolean(this.#popup?.isShown());
		}
		setLoading(isLoading) {
			this.#isLoading = isLoading;
		}
		setList(list) {
			this.#list = list;
			if (this.#popup) {
				this.#popup.setContent(this.#renderPopupContent());
			}
		}
		#initPopup() {
			this.#popup = new main_popup.Popup({
				bindElement: this.#bindElement,
				cacheable: false,
				className: 'ai__share-prompt-library-grid_popup-with-more-info',
				angle: {
					position: 'top'
				},
				autoHide: true,
				closeByEsc: true,
				content: this.#renderPopupContent(),
				width: 285,
				minHeight: 190,
				maxHeight: 300,
				padding: 16,
				contentPadding: 0,
				events: {
					...this.#events
				}
			});
		}
		#renderPopupContent() {
			const listWithSearchClassnameModifier = this.#useSearch ? '--with-search' : '';
			this.#popupContent = main_core.Tag.render`
			<div class="ai__prompt-library_info-popup">
				${this.#renderSearch()}
				<div class="ai__prompt-library_info-popup_list ${listWithSearchClassnameModifier}" ref="listContainer">
					${this.#renderList()}
				</div>
			<div>
		`;
			return this.#popupContent.root;
		}
		#renderList() {
			const list = this.#list.filter(item => {
				if (this.#filter) {
					return this.#filter(item, this.#searchValue);
				}
				return true;
			});
			return this.#listRenderer.render(list, this.#searchValue);
		}
		#updateList() {
			if (this.#popupContent.listContainer) {
				this.#popupContent.listContainer.innerHTML = '';
				main_core.Dom.append(this.#renderList(), this.#popupContent.listContainer);
			}
		}
		#renderSearch() {
			if (this.#useSearch === false) {
				return null;
			}
			const container = main_core.Tag.render`
			<div class="ai__prompt-library_info-popup_search">
				<div class="ui-ctl ui-ctl-textbox ui-ctl-before-icon ui-ctl-after-icon">
					<div class="ui-ctl-before ui-ctl-icon-search"></div>
					<button ref="clear" class="ui-ctl-after ui-ctl-icon-clear"></button>
					<input ref="input" type="text" class="ui-ctl-element">
				</div>
			</div>
		`;
			main_core.bind(container.clear, 'click', () => {
				container.input.value = '';
				this.#searchValue = '';
				this.#updateList();
			});
			main_core.bind(container.input, 'input', e => {
				this.#searchValue = e.target.value;
				this.#updateList();
			});
			return container.root;
		}
	}

	class Controller {
		/**
		 * @var BX.Main.Grid
		 */
		static #grid;
		static #categoriesListPopup = null;
		static #allSharesListPopup = null;
		static #categoriesWithTranslate = [];
		static #promptSuccessSavingEventHandler = null;
		static async fetchPromptCategories(promptCode) {
			const data = new FormData();
			data.append('promptCode', promptCode);
			const res = await main_core.ajax.runAction('ai.prompt.getCategoriesForPrompt', {
				data
			});
			return res.data.list;
		}
		static handleClickOnDeletePromptSwitcher(event, promptCode, promptTitle) {
			event.preventDefault();
			event.stopPropagation();
			this.#sendRowAction('toggle-deleted', {
				promptCode,
				needDeleted: 1,
				page: this.#getCurrentPage()
			}, () => {
				showNotification(main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_HIDE_MSGVER_1', {
					'#NAME#': `<b>${main_core.Text.encode(promptTitle)}</b>`,
					'#COPILOT_NAME#': this.#getCopilotName()
				}));
			});
		}
		static handleClickOnUndoDeletePromptSwitcher(event, promptCode, promptTitle) {
			event.preventDefault();
			event.stopPropagation();
			this.#sendRowAction('toggle-deleted', {
				promptCode,
				needDeleted: 0,
				page: this.#getCurrentPage()
			}, () => {
				showNotification(main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_SHOW_MSGVER_1', {
					'#NAME#': `<b>${main_core.Text.encode(promptTitle)}</b>`,
					'#COPILOT_NAME#': this.#getCopilotName()
				}));
			});
		}
		static handleClickOnActivatePromptMenuItem(event, promptCode, promptName) {
			event.preventDefault();
			event.stopImmediatePropagation();
			this.#sendRowAction('toggle-active', {
				promptCode,
				needActivate: 1,
				page: this.#getCurrentPage()
			}, () => {
				showNotification(wrapTextToHtmlWithWordBreak(main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_ACTIVATE', {
					'#NAME#': `<b>${main_core.Text.encode(promptName)}</b>`
				})));
			});
		}
		static handleClickOnDeactivatePromptMenuItem(event, promptCode, promptName) {
			event.preventDefault();
			event.stopImmediatePropagation();
			this.#sendRowAction('toggle-active', {
				promptCode,
				needActivate: 0,
				page: this.#getCurrentPage()
			}, () => {
				showNotification(wrapTextToHtmlWithWordBreak(main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_DEACTIVATE', {
					'#NAME#': `<b>${main_core.Text.encode(promptName)}</b>`
				})));
			});
		}
		static async handleClickOnSharesCell(sharePromptCode, event) {
			event.preventDefault();
			event.stopImmediatePropagation();
			if (this.#allSharesListPopup) {
				this.#allSharesListPopup.hide();
				return;
			}
			this.#allSharesListPopup = new PopupWithLoader({
				bindElement: event.target,
				listRenderer: new SharesListRenderer(),
				events: {
					onPopupDestroy: () => {
						this.#allSharesListPopup = null;
					}
				},
				filter: (item, searchValue) => {
					return item.name.toLowerCase().includes(searchValue?.toLowerCase());
				},
				useSearch: true
			});
			try {
				this.#allSharesListPopup.setLoading(true);
				this.#allSharesListPopup.show();
				const formData = new FormData();
				formData.append('promptCode', sharePromptCode);
				const res = await main_core.ajax.runAction('ai.prompt.getShareForPrompt', {
					data: formData
				});
				const list = res.data.list;
				this.#allSharesListPopup.setList(list.slice(5));
			} catch (e) {
				console.error(e);
				await showNotification(main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_SHOW_PROMPT_USERS_ERROR'));
				this.#allSharesListPopup.hide();
			} finally {
				this.#allSharesListPopup.setLoading(false);
			}
		}
		static handleClickOnCategoriesCell(e, promptCode, excludedCategoryCode) {
			e.preventDefault();
			e.stopImmediatePropagation();
			const target = e.target;
			if (Controller.#categoriesListPopup) {
				Controller.#categoriesListPopup.hide();
				return;
			}
			Controller.#categoriesListPopup = new PopupWithLoader({
				bindElement: target,
				listRenderer: new PopupCategoriesRenderer(),
				events: {
					onPopupDestroy: () => {
						Controller.#categoriesListPopup = null;
					}
				}
			});
			Controller.#categoriesListPopup.setLoading(true);
			Controller.#categoriesListPopup.show();
			Controller.fetchPromptCategories(promptCode).then(list => {
				const excludedCategoryListItemIndex = list.findIndex(item => item.code === excludedCategoryCode);
				list.splice(excludedCategoryListItemIndex, 1);
				Controller.#categoriesWithTranslate = list;
				Controller.#categoriesListPopup.setLoading(false);
				Controller.#categoriesListPopup.setList(Controller.#categoriesWithTranslate);
			}).catch(err => {
				console.error(err);
				Controller.#categoriesListPopup.setLoading(false);
				Controller.#categoriesListPopup.setList([]);
			});
			Controller.#categoriesListPopup.show();
		}
		static async handleClickOnPromptName(event, promptCode) {
			event.preventDefault();
			event.stopImmediatePropagation();
			this.editPrompt(promptCode);
		}
		static async editPrompt(promptCode) {
			this.#grid.getLoader().show();
			this.#grid.tableFade();
			const formData = new FormData();
			formData.append('promptCode', promptCode);
			const fetchPromptByCodePromise = main_core.ajax.runAction('ai.prompt.getPromptByCodeForUpdate', {
				method: 'POST',
				data: formData
			});
			const loadPromptMasterExtensionPromise = main_core.Runtime.loadExtension('ai.prompt-master');
			try {
				const results = await Promise.all([fetchPromptByCodePromise, loadPromptMasterExtensionPromise]);
				const res = results[0];
				const PromptMasterPopup = results[1].PromptMasterPopup;
				const PromptMasterPopupEvents = results[1].PromptMasterPopupEvents;
				const prompt = res.data.prompt;
				const options = {
					masterOptions: {
						code: prompt.code,
						prompt: prompt.prompt,
						type: prompt.type,
						name: prompt.translate,
						icon: prompt.icon,
						categories: Object.values(prompt.categories),
						accessCodes: prompt.accessCodes,
						authorId: prompt.authorId
					}
				};
				const popup = new PromptMasterPopup({
					...options,
					popupEvents: {
						onPopupDestroy: () => {
							popup.unsubscribe(PromptMasterPopupEvents.SAVE_SUCCESS, Controller.#promptSuccessSavingEventHandler);
						}
					},
					analyticFields: {
						c_section: 'list'
					}
				});
				Controller.#promptSuccessSavingEventHandler = Controller.#handlePromptSuccessSaving.bind(Controller);
				popup.subscribe(PromptMasterPopupEvents.SAVE_SUCCESS, Controller.#promptSuccessSavingEventHandler);
				popup.show();
			} catch (e) {
				console.error(e);
				showNotification(main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_ACTION_OPEN_EDIT_MASTER_ERROR'));
			} finally {
				this.#grid.getLoader().hide();
				this.#grid.tableUnfade();
			}
		}
		static async handleClickOnCreatePromptButton(button) {
			try {
				button.setClocking(true);
				const {
					PromptMasterPopup,
					PromptMasterPopupEvents
				} = await main_core.Runtime.loadExtension('ai.prompt-master');
				const popup = new PromptMasterPopup({
					popupEvents: {
						onPopupDestroy: () => {
							popup.unsubscribe(PromptMasterPopupEvents.SAVE_SUCCESS, Controller.#promptSuccessSavingEventHandler);
						}
					},
					analyticFields: {
						c_section: 'list'
					}
				});
				Controller.#promptSuccessSavingEventHandler = Controller.#handlePromptSuccessSaving.bind(Controller);
				popup.subscribe(PromptMasterPopupEvents.SAVE_SUCCESS, Controller.#promptSuccessSavingEventHandler);
				popup.show();
			} catch (e) {
				console.error(e);
				showNotification(main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_PROMPT_MASTER_OPEN_ERROR'));
			} finally {
				button.setClocking(false);
			}
		}
		static handleClickOnPromptIsFavouriteLabel(event, promptCode, favourite, promptName) {
			event.preventDefault();
			event.stopImmediatePropagation();
			this.#sendRowAction('toggle-favourite', {
				promptCode,
				favourite,
				page: this.#getCurrentPage()
			}, () => {
				const message = favourite === 'true' ? wrapTextToHtmlWithWordBreak(main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_FAVOURITE_ADD', {
					'#NAME#': `<b>${main_core.Text.encode(promptName)}</b>`
				})) : wrapTextToHtmlWithWordBreak(main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_FAVOURITE_REMOVE', {
					'#NAME#': `<b>${main_core.Text.encode(promptName)}</b>`
				}));
				showNotification(message);
			});
		}
		static togglePromptFavourite(promptCode, favourite, promptName) {
			this.#sendRowAction('toggle-favourite', {
				promptCode,
				favourite,
				page: this.#getCurrentPage()
			}, () => {
				const message = favourite === 'true' ? wrapTextToHtmlWithWordBreak(main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_FAVOURITE_ADD', {
					'#NAME#': `<b>${main_core.Text.encode(promptName)}</b>`
				})) : wrapTextToHtmlWithWordBreak(main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_FAVOURITE_REMOVE', {
					'#NAME#': `<b>${main_core.Text.encode(promptName)}</b>`
				}));
				showNotification(message);
			});
		}
		static applyMultipleAction() {
			const action = this.#grid.getActionsPanel().getPanel().querySelector('#action-menu span').dataset.value;
			const actionWithoutQuotes = action.replaceAll('"', '');
			const message = this.#getNotificationMessageForMassAction(actionWithoutQuotes);
			this.#sendRowAction(actionWithoutQuotes, {
				selectedSharePromptsCodes: this.#grid.getRows().getSelectedIds(),
				page: this.#getCurrentPage()
			}, () => {
				showNotification(message);
			});
		}
		static #getNotificationMessageForMassAction(actionName) {
			switch (actionName) {
				case 'multiple-activate':
					{
						return main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_ACTIVATE');
					}
				case 'multiple-deactivate':
					{
						return main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_DEACTIVATE');
					}
				case 'multiple-show-for-me':
					{
						return main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_SHOW_MSGVER_1', {
							'#COPILOT_NAME#': this.#getCopilotName()
						});
					}
				case 'multiple-hide-from-me':
					{
						return main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_HIDE_MSGVER_1', {
							'#COPILOT_NAME#': this.#getCopilotName()
						});
					}
				default:
					{
						return main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_ACTION_DEFAULT');
					}
			}
		}
		static init(gridId, isShowTour = false) {
			if (isShowTour) {
				this.#showSimpleTour();
			}
			this.#grid = BX.Main.gridManager.getById(gridId)?.instance;
			main_core.bind(this.#grid.getScrollContainer(), 'scroll', () => {
				this.#categoriesListPopup?.hide();
				this.#allSharesListPopup?.hide();
			});
			Controller.#updateApplyButtonClassname();
			Controller.#observeSelectActionButtonValue();
			main_core.Event.EventEmitter.subscribe('Grid::updated', () => {
				Controller.#updateApplyButtonClassname();
				Controller.#observeSelectActionButtonValue();
				BX.UI.Hint.init(BX('main-grid-table'));
			});
			main_core.Event.EventEmitter.subscribe('BX.Main.Filter:apply', () => {
				ui_analytics.sendData({
					tool: 'ai',
					category: 'prompt_saving',
					event: 'use_filter',
					c_section: 'list',
					status: 'success'
				});
			});
			BX.UI.Hint.init(BX('main-grid-table'));
		}
		static #observeSelectActionButtonValue() {
			const panel = this.#grid.getActionsPanel();
			if (!panel) {
				return;
			}
			const attributesObserver = new MutationObserver(() => {
				Controller.#updateApplyButtonClassname();
			});
			const selectActionButton = panel.getControls()[0];
			attributesObserver.observe(selectActionButton, {
				childList: false,
				subtree: true,
				characterDataOldValue: false,
				attributes: true,
				attributeOldValue: true,
				attributeFilter: ['data-value'],
				characterData: false
			});
		}
		static #updateApplyButtonClassname() {
			const panel = this.#grid.getActionsPanel();
			if (!panel) {
				return;
			}
			const values = panel.getValues();
			const btn = panel.getPanel().querySelector('#apply_button_control.ui-btn');
			const action = values['action-menu'];
			if (action === '"select-action"' || action === 'select-action') {
				main_core.Dom.addClass(btn, 'ui-btn-disabled');
				main_core.Dom.addClass(btn, 'ai__prompt-library-grid_share-initials');
			} else {
				main_core.Dom.removeClass(btn, 'ui-btn-disabled');
				main_core.Dom.removeClass(btn, 'ai__prompt-library-grid_share-initials');
			}
		}
		static #handlePromptSuccessSaving(event) {
			this.#sendRowAction('edit-prompt', {
				page: this.#getCurrentPage()
			}, () => {
				showNotification(main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_PROMPT_SAVE_SUCCESS', {
					'#NAME#': `<b>${main_core.Text.encode(event.getData().promptTitle)}</b>`
				}));
			});
		}
		static async #showSimpleTour() {
			const loadGuideExtensionPromise = main_core.Runtime.loadExtension('ui.tour');
			const loadBannerDispatcherExtensionPromise = main_core.Runtime.loadExtension('ui.banner-dispatcher');
			const result = await Promise.all([loadGuideExtensionPromise, loadBannerDispatcherExtensionPromise]);
			const Guide = result[0].Guide;
			const BannerDispatcher = result[1].BannerDispatcher;
			BannerDispatcher.normal.toQueue(onDone => {
				const guide = new Guide({
					id: 'share-prompt-grid-create-prompt-hint',
					simpleMode: true,
					overlay: false,
					onEvents: true,
					autoSave: true,
					steps: [{
						target: '.ui-btn.ui-btn-success',
						title: main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_TOUR_TITLE'),
						text: main_core.Loc.getMessage('PROMPT_LIBRARY_GRID_TOUR_DESCRIPTION')
					}]
				});
				main_core.Event.EventEmitter.subscribe('UI.Tour.Guide:onFinish', () => {
					guide.save();
					onDone();
				});
				guide.start();
			});
		}
		static #getCurrentPage() {
			const currentPageElement = document.body.querySelector('.main-ui-pagination-page.main-ui-pagination-active');
			return Number.parseInt(currentPageElement?.innerText, 10) || 1;
		}
		static #sendRowAction(action, data, callback) {
			const dataWithAction = {
				[this.#grid.getActionKey()]: action,
				...data
			};
			this.#grid.reloadTable('POST', dataWithAction, callback);
		}
		static #getCopilotName() {
			return BX.message('COPILOT_NAME');
		}
	}

	exports.Controller = Controller;

})(this.BX.AI.SharePrompt.Library = this.BX.AI.SharePrompt.Library || {}, BX.Event, BX, BX.UI, BX.Main, BX, BX.UI.Analytics);
//# sourceMappingURL=script.js.map
