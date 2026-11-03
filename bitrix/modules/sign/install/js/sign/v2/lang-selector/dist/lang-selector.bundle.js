/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
(function (exports, main_core, ui_buttons, sign_v2_api) {
	'use strict';

	class LangSelector {
		#api;
		#langs;
		#langButton;
		#region;
		#documentUids;
		#isLangChosenByUser = false;
		constructor(region, langs) {
			this.#region = region;
			this.#langs = langs;
			this.#documentUids = [];
			this.#langButton = this.#getLanguageButton();
			this.#api = new sign_v2_api.Api();
		}
		getLayout() {
			return main_core.Tag.render`
			<div class="sign-lang-selector">
				<span class="sign-lang-selector__label">
					${main_core.Loc.getMessage('SIGN_BLANK_LANGUAGE_SELECTOR_LABEL_MSGVER_1')}
				</span>
				${this.#langButton.getContainer()}
			</div>
		`;
		}
		#getLanguageItems() {
			const onItemClick = function (event) {
				const id = event.currentTarget.getAttribute('data-lang-id');
				this.#langButton.menuWindow.close();
				this.#isLangChosenByUser = true;
				this.#changeLang(id);
				this.#langButton.setText(this.#langs[id].NAME);
			}.bind(this);
			return Object.entries(this.#langs).map(lang => {
				return {
					text: lang[1].NAME,
					onclick: onItemClick,
					dataset: {
						langId: lang[0]
					}
				};
			});
		}
		#getLanguageButton() {
			return new ui_buttons.Button({
				text: this.#langs[this.#region]?.NAME || main_core.Loc.getMessage('SIGN_BLANK_LANGUAGE_SELECTOR_BUTTON_TITLE'),
				dropdown: true,
				closeByEsc: true,
				autoHide: true,
				autoClose: true,
				color: BX.UI.Button.Color.LIGHT,
				size: BX.UI.Button.Size.SMALL,
				menu: {
					items: this.#getLanguageItems()
				},
				className: 'sign-lang-selector__language-button'
			});
		}

		// The document keeps the language it was saved with, so a wizard opened on it must show that
		// language instead of the portal region default. Only the displayed language is restored: the
		// document already carries it, and a write would be a change the user did not make. A language
		// the user has already picked here is never restored over: that choice is the newer one.
		setLangId(langId) {
			if (this.#isLangChosenByUser) {
				return;
			}
			const langName = this.#langs?.[langId]?.NAME;
			if (!langName) {
				return;
			}
			this.#langButton.setText(langName);
		}
		async #changeLang(langId) {
			const promises = this.#documentUids.map(uid => this.#api.modifyLanguageId(uid, langId));
			await Promise.all(promises);
		}
		setDocumentUids(uids) {
			this.#documentUids = uids;
		}
	}

	exports.LangSelector = LangSelector;

})(this.BX.Sign.V2 = this.BX.Sign.V2 || {}, BX, BX.UI, BX.Sign.V2);
//# sourceMappingURL=lang-selector.bundle.js.map
