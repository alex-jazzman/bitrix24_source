/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, landing_loc, landing_ui_form_baseform) {
	'use strict';

	const NBSP = '\u00A0';
	const NBSP_ENTITY_PATTERN = /&(?:amp;)*(?:nbsp|#160|#x0*a0);/gi;

	/**
	 * @memberOf BX.Landing.UI.Form
	 */
	class CardForm extends landing_ui_form_baseform.BaseForm {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Form.CardForm');
			main_core.Dom.addClass(this.layout, 'landing-ui-form-card');
			this.onItemClick = main_core.Runtime.throttle(this.onItemClick, 200, this);
			this.onRemoveItemClick = this.onRemoveItemClick.bind(this);
			this.onDragButtonClick = this.onDragButtonClick.bind(this);
			this.bodyId = `landing-card-body-${this.id}`;
			this.wrapper = this.getWrapper();
			this.labelBindings = options.labelBindings;
			this.preset = options.preset;
			[, this.oldIndex] = this.selector.split('@');
		}
		getWrapper() {
			const wrapper = main_core.Tag.render`
			<div class="landing-ui-form-cards-item" data-testid="landing-card-form">
				<div class="landing-ui-form-cards-item-inner">
					<div class="landing-ui-form-card-item-header">
						<div class="landing-ui-form-card-item-header-left">
							<div class="landing-ui-form-card-item-header-left-inner">
								<button
									type="button"
									class="landing-ui-form-card-item-header-drag landing-ui-drag"
									aria-label="${landing_loc.Loc.getMessage('LANDING_CARDS_FORM_DRAG_HANDLE_LABEL')}"
									aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
									data-testid="landing-card-form-drag-btn"
								></button>
								<button
									type="button"
									class="landing-ui-form-card-item-header-title"
									aria-expanded="false"
									aria-controls="${this.bodyId}"
									data-testid="landing-card-form-title-btn"
								></button>
							</div>
							<div class="landing-ui-form-card-item-header-edit" aria-hidden="true">
								<span class="fa fa-pencil"></span>
							</div>
						</div>
						<div class="landing-ui-form-card-item-header-right">
							<button
								type="button"
								class="landing-ui-form-card-item-header-remove"
								aria-label="${landing_loc.Loc.getMessage('LANDING_CARDS_FORM_REMOVE_LABEL')}"
								data-testid="landing-card-form-remove-btn"
							>
								<span class="fa fa-remove" aria-hidden="true"></span>
							</button>
						</div>
					</div>
					${this.getNode()}
				</div>
			</div>
		`;
			this.header = wrapper.querySelector('.landing-ui-form-card-item-header');
			this.titleButton = wrapper.querySelector('.landing-ui-form-card-item-header-title');
			this.dragButton = wrapper.querySelector('.landing-ui-form-card-item-header-drag');
			this.removeButton = wrapper.querySelector('.landing-ui-form-card-item-header-remove');

			// The label is either the ready title node of a block card or a plain string, and a string
			// one is read off the page with `innerHTML` - a card of the site can hold anything and this
			// panel runs in the origin of the portal. So it goes in as a node in both cases and markup
			// of the page stays text here. The string still arrives with its entities intact, and only
			// the parser used to expand them; decoding gives back the characters it would have shown,
			// while encoding on top of them would print `Q&amp;A` literally.
			main_core.Dom.append(main_core.Type.isDomNode(this.label) ? this.label : document.createTextNode(CardForm.decodeLabel(this.label)), this.titleButton);

			// The title button is the disclosure control, but the whole header row stays clickable
			// with the mouse. A native activation of the button - Enter, Space or a click - bubbles
			// into this very handler, so the toggle is bound once, on the row, and never twice.
			main_core.Event.bind(this.header, 'click', this.onItemClick);
			main_core.Event.bind(this.dragButton, 'click', this.onDragButtonClick);
			main_core.Event.bind(this.removeButton, 'click', this.onRemoveItemClick);

			// The body is what the title button expands and what `inert` leaves out of the Tab order,
			// so a test needs it by itself and not only through `aria-controls` of the button.
			main_core.Dom.attr(this.getNode(), {
				id: this.bodyId,
				'data-testid': 'landing-card-form-body'
			});
			this.setExpanded(false);
			return wrapper;
		}
		setExpanded(expanded) {
			const body = this.getNode();
			main_core.Dom.attr(this.titleButton, 'aria-expanded', expanded ? 'true' : 'false');

			// `inert` keeps the collapsed body measurable (height/transition unchanged)
			// while removing its fields from Tab order and the accessibility tree —
			// unlike `display:none`, which would break the expand animation.
			if (expanded) {
				body.removeAttribute('inert');
			} else {
				main_core.Dom.attr(body, 'inert', '');
			}
		}
		getTitleText() {
			const titleNode = this.wrapper ? this.wrapper.querySelector('.landing-ui-form-card-item-header-title') : null;
			if (titleNode === null) {
				return '';
			}
			const words = titleNode.textContent.trim();
			if (words !== '') {
				return words;
			}

			// A title built of pictures alone says nothing in words, and the name of such a card lives
			// on the label instead (`block.js`: createCardLabel marks it `role="img"`). The consumer
			// reads this to announce a card move out loud, so without the fallback a screen reader is
			// told a card moved and never told which one.
			const picture = titleNode.querySelector('[role="img"][aria-label]');
			return picture ? picture.getAttribute('aria-label').trim() : '';
		}
		onDragButtonClick(event) {
			event.preventDefault();
			event.stopPropagation();
		}
		onItemClick(event) {
			event.preventDefault();
			if (main_core.Type.isDomNode(event.currentTarget)) {
				const target = event.currentTarget.closest('.landing-ui-form-cards-item');
				if (main_core.Dom.hasClass(target, 'landing-ui-form-cards-item-expand')) {
					main_core.Dom.removeClass(target, 'landing-ui-form-cards-item-expand');
					main_core.Dom.style(target, null);
					this.setExpanded(false);
				} else {
					main_core.Dom.addClass(target, 'landing-ui-form-cards-item-expand');
					BX.Landing.Utils.onTransitionEnd(target).then(() => {
						main_core.Dom.style(target, {
							overflow: 'visible'
						});
					}).catch(() => {});
					main_core.Dom.style(target, {
						height: 'auto'
					});
					this.setExpanded(true);
				}
			}
		}
		onRemoveItemClick(event) {
			event.preventDefault();
			event.stopPropagation();
			if (!this.getLayout().closest('.landing-ui-disallow-remove')) {
				main_core.Dom.remove(this.wrapper);
				this.emit('onRemove');
			}
		}
		serialize() {
			return this.fields.reduce((res, field) => {
				const [index] = field.selector.split('@');
				res[index] = field.getValue();
				return res;
			}, {});
		}
		getPreset() {
			return this.preset || null;
		}
		static decodeLabel(label) {
			return main_core.Text.decode(String(label)).replaceAll(NBSP_ENTITY_PATTERN, NBSP);
		}
	}

	exports.CardForm = CardForm;

})(this.BX.Landing.UI.Form = this.BX.Landing.UI.Form || {}, BX, BX.Landing, BX.Landing.UI.Form);
//# sourceMappingURL=cardform.bundle.js.map
