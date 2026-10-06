/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_bannerDispatcher, main_popup, ui_a11y) {
	'use strict';

	const USER_OPTION_CATEGORY = 'mail.guide';
	class LabelsGuide {
		#popup = null;
		#id;
		#bindElement;
		#userOptionName;
		#onCreate;
		constructor(options) {
			this.#id = options.id;
			this.#bindElement = options.bindElement;
			this.#userOptionName = options.userOptionName;
			this.#onCreate = options.onCreate;
		}
		show() {
			if (!main_core.Type.isDomNode(this.#bindElement)) {
				return;
			}
			ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
				const popup = this.#createPopup(onDone);
				this.#popup = popup;
				popup.show();
				popup.getZIndexComponent().setZIndex(400);
				this.#announceGuide();
				if (this.#userOptionName) {
					BX.userOptions.save(USER_OPTION_CATEGORY, this.#userOptionName, null, 'Y');
				}
				main_core.Event.bind(this.#bindElement, 'click', () => this.#popup?.close());
				return {};
			});
		}
		#announceGuide() {
			const message = [main_core.Loc.getMessage('MAIL_LABELS_GUIDE_TITLE'), main_core.Loc.getMessage('MAIL_LABELS_GUIDE_TEXT')].filter(part => main_core.Type.isStringFilled(part)).join('. ');
			ui_a11y.LiveAnnouncer.announce(message);
		}
		#createPopup(onDone) {
			const titleId = `${this.#id}-title`;
			return main_popup.PopupManager.create({
				id: this.#id,
				bindElement: this.#bindElement,
				closeIcon: true,
				autoHide: false,
				closeByEsc: true,
				angle: true,
				width: 320,
				ariaLabelledBy: titleId,
				content: this.#getContent(titleId),
				events: {
					onClose: () => onDone()
				}
			});
		}
		#getContent(titleId) {
			const createButton = main_core.Tag.render`
			<button type="button" class="mail-labels-guide__create" data-testid="mail-labels-guide-create-btn">
				${main_core.Loc.getMessage('MAIL_LABELS_GUIDE_CREATE') ?? ''}
			</button>
		`;
			main_core.Event.bind(createButton, 'click', () => {
				this.#popup?.close();
				this.#onCreate();
			});
			return main_core.Tag.render`
			<div class="mail-labels-guide" data-testid="mail-labels-guide">
				<div id="${titleId}" class="mail-labels-guide__title">${main_core.Loc.getMessage('MAIL_LABELS_GUIDE_TITLE') ?? ''}</div>
				<div class="mail-labels-guide__description">${main_core.Loc.getMessage('MAIL_LABELS_GUIDE_TEXT') ?? ''}</div>
				${createButton}
			</div>
		`;
		}
	}

	exports.LabelsGuide = LabelsGuide;

})(this.BX.Mail = this.BX.Mail || {}, BX, BX.UI, BX.Main, BX.UI.Accessibility);
//# sourceMappingURL=labels-guide.bundle.js.map
