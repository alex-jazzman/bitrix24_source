/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup) {
	'use strict';

	const buttonSelector = '.sign-b2e-configure-activity__dictionary-button';
	const waitClass = '--wait';
	/**
	 * Dictionary values are offered by a menu, the field itself stays a plain bizproc text control:
	 * its value is never overwritten on init, so a value coming from an expression survives reopening.
	 */
	class DictionaryField {
		#fieldName;
		#containerNode;
		#menuId;
		#emptyText;
		#errorText;
		#loadItems;
		#items = null;
		#inputNode = null;
		#buttonNode = null;
		#isBusy = false;
		constructor(options) {
			this.#fieldName = options.fieldName;
			this.#containerNode = options.containerNode;
			this.#menuId = options.menuId;
			this.#emptyText = options.emptyText ?? '';
			this.#errorText = options.errorText ?? '';
			this.#loadItems = options.loadItems;
		}
		init() {
			if (!main_core.Type.isStringFilled(this.#fieldName) || !main_core.Type.isDomNode(this.#containerNode)) {
				return;
			}
			this.#inputNode = this.#containerNode.querySelector(`input[name="${this.#fieldName}"]`);
			this.#buttonNode = this.#containerNode.querySelector(buttonSelector);
			if (!this.#inputNode || !this.#buttonNode) {
				return;
			}
			main_core.Dom.attr(this.#buttonNode, 'aria-haspopup', 'menu');
			main_core.Event.bind(this.#buttonNode, 'click', this.#handleSelectClick);
		}
		#handleSelectClick = async () => {
			if (this.#isBusy) {
				return;
			}
			this.#isBusy = true;
			main_core.Dom.addClass(this.#buttonNode, waitClass);
			try {
				this.#toggleMenu(await this.#getMenuItems());
			} finally {
				this.#isBusy = false;
				main_core.Dom.removeClass(this.#buttonNode, waitClass);
			}
		};
		async #getMenuItems() {
			if (this.#items === null) {
				const items = await this.#loadItems();
				if (items === null) {
					return this.#getMessageItems(this.#errorText);
				}
				this.#items = items;
			}
			if (this.#items.length === 0) {
				return this.#getMessageItems(this.#emptyText);
			}
			return this.#items.map(item => ({
				// MenuItem encodes the text option, dictionary titles are inserted as text
				text: item.name,
				onclick: () => {
					this.#applyValue(item.value);
					main_popup.MenuManager.getMenuById(this.#menuId)?.close();
				}
			}));
		}
		#getMessageItems(text) {
			return main_core.Type.isStringFilled(text) ? [{
				text,
				disabled: true
			}] : [];
		}
		#toggleMenu(items) {
			const currentMenu = main_popup.MenuManager.getMenuById(this.#menuId);
			if (currentMenu) {
				const wasShown = currentMenu.getPopupWindow().isShown();
				currentMenu.destroy();
				this.#setExpanded(false);
				if (wasShown) {
					return;
				}
			}
			if (items.length === 0) {
				return;
			}
			main_popup.MenuManager.create({
				id: this.#menuId,
				bindElement: this.#buttonNode,
				items,
				// the menu is rebuilt on every opening, a closed one must not stay in the manager
				cacheable: false,
				events: {
					onPopupClose: () => this.#setExpanded(false)
				}
			}).show();
			this.#setExpanded(true);
		}
		#setExpanded(isExpanded) {
			main_core.Dom.attr(this.#buttonNode, 'aria-expanded', isExpanded ? 'true' : 'false');
		}
		#applyValue(value) {
			this.#inputNode.value = value;
			// the dialog learns about a programmatic value the same way the platform field controls report it
			this.#inputNode.dispatchEvent(new globalThis.Event('change', {
				bubbles: true
			}));
		}
	}

	const companyListActionName = 'sign.api_v1.document.listB2eCompanies';
	const menuIdPrefix = 'sign-b2e-configure-activity';
	async function loadCompanyItems() {
		try {
			const {
				data
			} = await main_core.ajax.runAction(companyListActionName, {});
			const showTaxId = data?.showTaxId === true;
			const companies = main_core.Type.isArray(data?.companies) ? data.companies : [];
			return companies.map(company => {
				const value = String(company.id);
				const title = String(company.title ?? '').trim() || value;
				const taxId = String(company.taxId ?? '').trim();
				return {
					value,
					name: showTaxId && taxId !== '' ? `${title} (${taxId})` : title
				};
			});
		} catch (response) {
			console.error(response?.errors ?? response);
			return null;
		}
	}
	class SignB2EDocumentConfigureActivity {
		#fields;
		constructor(options) {
			if (!main_core.Type.isStringFilled(options?.formName)) {
				throw new Error('formName must be filled string');
			}
			const messages = options.messages ?? {};
			const providerItems = main_core.Type.isArray(options.provider?.items) ? options.provider.items : [];
			this.#fields = [new DictionaryField({
				fieldName: options.company?.fieldName,
				containerNode: options.company?.containerNode,
				menuId: `${menuIdPrefix}-${options.formName}-company`,
				emptyText: messages.emptyCompanyList,
				errorText: messages.companyListError,
				loadItems: loadCompanyItems
			}), new DictionaryField({
				fieldName: options.provider?.fieldName,
				containerNode: options.provider?.containerNode,
				menuId: `${menuIdPrefix}-${options.formName}-provider`,
				loadItems: () => Promise.resolve(providerItems)
			})];
		}
		init() {
			this.#fields.forEach(field => field.init());
		}
	}

	exports.SignB2EDocumentConfigureActivity = SignB2EDocumentConfigureActivity;

})(this.BX.Sign = this.BX.Sign || {}, BX, BX.Main);
//# sourceMappingURL=script.js.map
