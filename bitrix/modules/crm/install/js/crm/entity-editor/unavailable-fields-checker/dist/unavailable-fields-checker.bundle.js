/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_buttons) {
	'use strict';

	const ARTICLE_CODE = '23240636'; // @todo set correct
	const POPUP_ID = 'crm-unavailable-fields-checker-popup';
	class UnavailableFieldsChecker {
		#fields;
		#popup = null;
		constructor(fields) {
			this.#fields = fields;
		}
		hasUnavailableFields() {
			return Object.keys(this.#fields).some(stageId => {
				return this.hasUnavailableFieldsByStage(stageId);
			});
		}
		hasUnavailableFieldsByStage(stageId) {
			const allStagesFields = this.#fields.ALL ?? null;
			const hasAllStagesFields = main_core.Type.isPlainObject(allStagesFields) && main_core.Type.isArrayFilled(Object.keys(allStagesFields));
			if (stageId === null) {
				return hasAllStagesFields;
			}
			const currentStageFields = this.#fields[stageId] ?? null;
			const hasStageFields = main_core.Type.isPlainObject(currentStageFields) && main_core.Type.isArrayFilled(Object.keys(currentStageFields));
			return hasAllStagesFields || hasStageFields;
		}
		hidePopup() {
			this.#popup?.close();
			this.#popup = null;
		}
		async showPopup(targetNode, stageId) {
			if (this.#popup?.isShown()) {
				return;
			}
			this.#popup?.destroy();

			// The popup id is shared across kanban columns. When switching between
			// columns, a popup left over from another column may still be finishing
			// its close animation and would make PopupManager.create return that
			// stale instance instead of a fresh popup. Destroy it first.
			main_popup.PopupManager.getPopupById(POPUP_ID)?.destroy();
			const popup = this.#getPopup(targetNode, stageId);
			this.#popup = popup;
			await this.#afterTransition(targetNode);
			if (this.#popup !== popup) {
				return;
			}
			popup.show();
		}
		#getPopup(targetNode, stageId) {
			return main_popup.PopupManager.create({
				id: POPUP_ID,
				bindElement: targetNode,
				borderRadius: '12px',
				cacheable: false,
				content: this.#getContent(stageId),
				contentPadding: 0,
				closeByEsc: false,
				closeIcon: {
					top: '11px',
					right: '5px'
				},
				fixed: true,
				offsetLeft: main_core.Dom.getPosition(targetNode).width / 2 - 190,
				width: 456,
				angle: {
					position: 'bottom',
					offset: 212
				},
				animation: {
					closeAnimationType: 'animation',
					showClassName: 'crm-dups-popup-open',
					closeClassName: 'crm-dups-popup-close'
				}
			});
		}
		#getContent(stageId) {
			const fields = this.#getFields(stageId);
			const fieldNamesString = main_core.Text.encode(Object.values(fields).join(', '));
			const description = Object.keys(fields).length > 1 ? main_core.Loc.getMessage('CRM_ENTITY_ED_UFC_POPUP_DESCRIPTION_MANY_FIELDS', {
				'#FIELD_NAMES#': fieldNamesString
			}) : main_core.Loc.getMessage('CRM_ENTITY_ED_UFC_POPUP_DESCRIPTION_ONE_FIELD', {
				'#FIELD_NAME#': fieldNamesString
			});
			const button = this.#getButton();
			return main_core.Tag.render`
			<div class="crm-unavailable-fields-checker-popup">
				<div class="crm-unavailable-fields-checker-popup__title">
					${main_core.Loc.getMessage('CRM_ENTITY_ED_UFC_POPUP_TITLE')}
				</div>
				<div class="crm-unavailable-fields-checker-popup__description">
					${description}
				</div>
				${button.render()}
			</div>
		`;
		}
		#getFields(stageId) {
			return {
				...(this.#fields.ALL ?? []),
				...(this.#fields[stageId] ?? [])
			};
		}
		#getButton() {
			return new ui_buttons.Button({
				size: ui_buttons.ButtonSize.SMALL,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				useAirDesign: true,
				text: main_core.Loc.getMessage('CRM_ENTITY_ED_UFC_POPUP_BUTTON'),
				wide: true,
				onclick: () => {
					top.BX.Helper?.show(`redirect=detail&code=${ARTICLE_CODE}`);
				}
			});
		}
		#afterTransition(element) {
			return new Promise(resolve => {
				const done = () => {
					main_core.Event.unbind(element, 'transitionend', handler);
					clearTimeout(timer);
					resolve();
				};
				const handler = e => {
					if (e.target !== element) {
						return;
					}
					done();
				};
				const duration = parseFloat(getComputedStyle(element).transitionDuration) * 1000;
				const timer = setTimeout(done, duration || 0);
				main_core.Event.bind(element, 'transitionend', handler);
			});
		}
	}

	exports.UnavailableFieldsChecker = UnavailableFieldsChecker;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.Main, BX.UI);
//# sourceMappingURL=unavailable-fields-checker.bundle.js.map
