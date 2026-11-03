/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core) {
	'use strict';

	const SigningMethod = Object.freeze({
		ukep: 'ukep',
		goskey: 'goskey'
	});
	const defaultMethod = SigningMethod.ukep;
	class SigningMethodSelector {
		#available = false;
		#selectedMethod = defaultMethod;
		#container = null;
		#block = null;
		#select = null;
		getLayout() {
			const container = this.#container ?? main_core.Tag.render`<div></div>`;
			this.#container = container;
			return container;
		}
		setAvailable(available) {
			if (available === this.#available) {
				return;
			}
			this.#available = available;
			if (available) {
				this.#renderBlock();
				return;
			}
			this.#removeBlock();
		}
		isAvailable() {
			return this.#available;
		}
		getSelectedMethod() {
			return this.#available ? this.#selectedMethod : null;
		}
		setSelectedMethod(method) {
			if (!Object.values(SigningMethod).includes(method)) {
				return;
			}
			this.#selectedMethod = method;
			if (this.#select) {
				this.#select.value = this.#selectedMethod;
			}
		}
		#renderBlock() {
			if (this.#block) {
				return;
			}
			const select = main_core.Tag.render`
			<select
				class="ui-ctl-element"
				data-test-id="sign-b2e-signing-method-selector-select"
				onchange="${({
			target
		}) => {
			this.setSelectedMethod(target.value);
		}}"
			></select>
		`;
			this.#renderOptions(select);
			select.value = this.#selectedMethod;
			this.#select = select;
			const block = main_core.Tag.render`
			<div
				class="sign-b2e-settings__item --representative-signing-method"
				data-test-id="sign-b2e-signing-method-selector"
			>
				<p class="sign-b2e-settings__item_title">
					${main_core.Loc.getMessage('SIGN_V2_B2E_SIGNING_METHOD_SELECTOR_TITLE')}
				</p>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown sign-b2e-signing-method-selector__dropdown">
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					${select}
				</div>
			</div>
		`;
			this.#block = block;
			main_core.Dom.append(block, this.getLayout());
		}
		#renderOptions(select) {
			const options = [{
				value: SigningMethod.ukep,
				text: main_core.Loc.getMessage('SIGN_V2_B2E_SIGNING_METHOD_SELECTOR_VALUE_UKEP') ?? ''
			}, {
				value: SigningMethod.goskey,
				text: main_core.Loc.getMessage('SIGN_V2_B2E_SIGNING_METHOD_SELECTOR_VALUE_GOSKEY') ?? ''
			}];
			options.forEach(option => {
				main_core.Dom.append(main_core.Tag.render`<option value="${option.value}">${main_core.Text.encode(option.text)}</option>`, select);
			});
		}
		#removeBlock() {
			main_core.Dom.remove(this.#block);
			this.#block = null;
			this.#select = null;
		}
	}

	exports.SigningMethod = SigningMethod;
	exports.SigningMethodSelector = SigningMethodSelector;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX);
//# sourceMappingURL=signing-method-selector.bundle.js.map
