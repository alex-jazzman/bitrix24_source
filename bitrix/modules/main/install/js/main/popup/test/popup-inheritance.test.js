import { describe, it } from 'mocha';
import { assert } from 'chai';

import BX from '../../core/test/old/core/internal/bootstrap';

/**
 * main.popup classes are native ES classes by default. A native class cannot be
 * called without `new`. Legacy code in the modules codebase inherits from these
 * classes and invokes the parent constructor as a function
 * (`.apply(this)` / `.call(this)` / transpiled `super()`), which throws
 * `TypeError: Class constructor cannot be invoked without 'new'`.
 *
 * The fix lives in the bundle build: `transformClasses` in bundle.config.js
 * forces the listed classes (Popup, Menu, Button) to be transpiled to ES5
 * functions so they stay callable. That transpilation is only present in the
 * BUILT bundle, not in raw src — so these tests read the classes from the BX.*
 * globals (the built main.popup bundle is already loaded on the test page),
 * then reproduce each legacy inheritance form and assert no TypeError.
 */
describe('main.popup — legacy inheritance compatibility', () => {
	it('exposes parent classes as globals', () => {
		assert.isFunction(BX.PopupWindowButton, 'BX.PopupWindowButton must be defined');
		assert.isFunction(BX.PopupWindow, 'BX.PopupWindow must be defined');
		assert.isFunction(BX.PopupMenuWindow, 'BX.PopupMenuWindow must be defined');
	});

	// Group 1: BX.extend(Child, Parent) + Child.superclass.constructor.apply(this).
	// Form used by sale/catalog/iblock components (BasketButton etc).
	it('Group 1: BX.extend + superclass.constructor.apply(this) — BX.PopupWindowButton', () => {
		const BasketButton = function(params) {
			// eslint-disable-next-line prefer-rest-params -- reproduces the exact legacy form
			BasketButton.superclass.constructor.apply(this, arguments);
			this.params = params || {};
		};
		BX.extend(BasketButton, BX.PopupWindowButton);

		assert.doesNotThrow(() => {
			new BasketButton({ id: 'basket' });
		});
	});

	// Group 3a: direct parent constructor call via .call(this) + __proto__.
	// Form used by intranet/theme_picker/theme_picker.js (ThemePickerCheckboxButton).
	it('Group 3: Parent.call(this) + __proto__ — BX.PopupWindowButton', () => {
		const CheckboxButton = function() {
			BX.PopupWindowButton.call(this, { id: 'checkbox' });
		};
		CheckboxButton.prototype = {
			__proto__: BX.PopupWindowButton.prototype,
		};

		assert.doesNotThrow(() => {
			new CheckboxButton();
		});
	});

	// Group 3b: inheritance from BX.PopupWindow via .apply(this) + __proto__.
	// Form used by landing/ui/tool/popup.js.
	it('Group 3: Parent.apply(this) + __proto__ — BX.PopupWindow', () => {
		const ToolPopup = function() {
			BX.PopupWindow.apply(this, ['tool-popup', null, {}]);
		};
		ToolPopup.prototype = {
			__proto__: BX.PopupWindow.prototype,
		};

		assert.doesNotThrow(() => {
			new ToolPopup();
		});
	});

	// Group 3c: inheritance from BX.PopupMenuWindow via .apply(this).
	// Form used by landing/ui/tool/menu.js.
	it('Group 3: Parent.apply(this) — BX.PopupMenuWindow', () => {
		const ToolMenu = function() {
			BX.PopupMenuWindow.apply(this, ['tool-menu', { x: 0, y: 0 }, []]);
		};
		ToolMenu.prototype = {
			__proto__: BX.PopupMenuWindow.prototype,
		};

		assert.doesNotThrow(() => {
			new ToolMenu();
		});
	});

	// Group 4: transpiled ES6 `extends` lowered to an ES5 super() call.
	// Reproduces what Babel generates for `class Child extends Popup` built on
	// the old baseline: super() calls the parent as a function.
	it('Group 4: transpiled ES5 super() — BX.PopupWindow', () => {
		const Popup = BX.PopupWindow;
		const MovedDeadlinePopup = function() {
			return Popup.apply(this, ['moved', null, {}]) || this;
		};
		MovedDeadlinePopup.prototype = Object.create(Popup.prototype);
		MovedDeadlinePopup.prototype.constructor = MovedDeadlinePopup;

		assert.doesNotThrow(() => {
			new MovedDeadlinePopup();
		});
	});

	// Group 2 (control): BX.extend WITHOUT calling the parent constructor — must
	// not throw now or after the fix. Regression guard.
	it('Group 2: BX.extend without parent constructor call — does not throw', () => {
		const SafeButton = function(params) {
			this.params = params || {};
			this.id = (params && params.id) || '';
		};
		BX.extend(SafeButton, BX.PopupWindowButton);

		assert.doesNotThrow(() => {
			new SafeButton({ id: 'safe' });
		});
	});
});
