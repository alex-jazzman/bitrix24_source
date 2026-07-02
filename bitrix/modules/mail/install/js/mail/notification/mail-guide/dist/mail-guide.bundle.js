/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_bannerDispatcher, main_popup) {
	'use strict';

	const defaultHighlighterBorderRadius = 8;
	const imageClassMap = {
		'connection_request_guide_shown': 'mail-notification-container__image--connection-request',
		'all_mail_mode_guide_shown': 'mail-notification-container__image--all-mail-mode'
	};
	const modifierClassMap = {
		'connection_request_guide_shown': 'mail-notification-container--connection-request',
		'all_mail_mode_guide_shown': 'mail-notification-container--all-mail-mode'
	};
	class MailGuide {
		#popup = null;
		#id;
		#userOptionName;
		#bindElement = null;
		#title = null;
		#description = null;
		#addHighlighter = false;
		#showImage = true;
		#highlighterBorderRadius = null;
		#highlighter;
		#width = null;
		constructor(options) {
			if (main_core.Type.isObject(options)) {
				this.#id = options.id;
				this.#bindElement = options.bindElement;
				this.#userOptionName = options.userOptionName;
				this.#title = options.title;
				this.#description = options.description;
				this.#addHighlighter = options.addHighlighter;
				this.#showImage = options.showImage !== false;
				this.#width = options.width ?? null;
				if (this.#addHighlighter) {
					this.#highlighter = main_core.Tag.render`<span class="ui-highlighter"></span>`;
					this.#highlighterBorderRadius = `${options.highlighterBorderRadius ?? defaultHighlighterBorderRadius}px`;
				}
			}
		}
		createGuidePopup(onDone) {
			const compactMode = !this.#showImage;
			return main_popup.PopupManager.create({
				id: this.#id,
				className: 'popup-window-dark',
				background: '#085DC1',
				closeIcon: true,
				autoHide: false,
				closeByEsc: true,
				padding: 12,
				borderRadius: 20,
				contentPadding: 0,
				offsetTop: 10,
				offsetLeft: compactMode ? 0 : -78,
				angle: {
					offset: compactMode ? 40 : 205,
					position: 'top'
				},
				bindElement: this.#bindElement,
				bindOptions: {
					forceBindPosition: false
				},
				width: this.#width ?? (compactMode ? 300 : 372),
				content: this.getContent(),
				events: {
					onShow: () => {
						if (this.#addHighlighter) {
							this.#prepareHighlighter();
						}
					},
					onClose: () => {
						onDone();
						if (this.#addHighlighter) {
							this.#removeHighlighter();
						}
					}
				}
			});
		}
		getContent() {
			const modifier = modifierClassMap[this.#userOptionName] ?? '';
			const containerClass = `mail-notification-container ${modifier}`.trim();
			const children = [];
			if (this.#showImage) {
				children.push(main_core.Dom.create('div', {
					props: {
						className: 'mail-notification-container__image-wrapper'
					},
					children: [this.#renderImage()]
				}));
			}
			children.push(main_core.Dom.create('div', {
				props: {
					className: 'mail-notification-content'
				},
				children: [this.#getMessageContainer(this.#title, this.#description)]
			}));
			return main_core.Dom.create('div', {
				props: {
					className: containerClass
				},
				children
			});
		}
		#renderImage() {
			const className = imageClassMap[this.#userOptionName] ?? 'mail-notification-container__image';
			return main_core.Dom.create('div', {
				props: {
					className
				}
			});
		}
		#getMessageContainer(title, description) {
			const children = [];
			if (title) {
				children.push(main_core.Dom.create('h4', {
					props: {
						className: 'mail-notification-content__title'
					},
					html: title
				}));
			}
			if (description) {
				children.push(main_core.Dom.create('span', {
					props: {
						className: 'mail-notification-content__description'
					},
					html: description
				}));
			}
			return main_core.Dom.create('div', {
				props: {
					className: 'mail-notification-content-wrapper'
				},
				children
			});
		}
		show() {
			if (!this.#bindElement) {
				return;
			}
			ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
				this.#popup = this.createGuidePopup(onDone);
				this.#popup.show();
				this.#popup.zIndexComponent.setZIndex(400);
				if (this.#userOptionName) {
					BX.userOptions.save('mail.guide', this.#userOptionName, null, 'Y');
				}
				main_core.Event.bind(this.#bindElement, 'click', () => {
					this.#popup?.close();
				});
			});
		}
		#prepareHighlighter() {
			main_core.Dom.append(this.#highlighter, this.#bindElement);
			main_core.Dom.addClass(this.#bindElement, '--border-md');
			main_core.Dom.addClass(this.#bindElement, '--glow-md');
			main_core.Dom.style(this.#highlighter, '--ui-highlighter-radius', this.#highlighterBorderRadius);
		}
		#removeHighlighter() {
			main_core.Dom.remove(this.#highlighter);
		}
	}

	exports.MailGuide = MailGuide;

})(this.BX.Mail = this.BX.Mail || {}, BX, BX.UI, BX.Main);
//# sourceMappingURL=mail-guide.bundle.js.map
