import { Dom, Event, Loc, Tag, Text, Type } from 'main.core';
import { Popup, PopupManager } from 'main.popup';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import 'ui.design-tokens.air';
import './style.css';

const ARTICLE_CODE = '23240636'; // @todo set correct
const POPUP_ID = 'crm-unavailable-fields-checker-popup';

export class UnavailableFieldsChecker
{
	#fields: Object;
	#popup: ?Popup = null;

	constructor(fields: Object)
	{
		this.#fields = fields;
	}

	hasUnavailableFields(): boolean
	{
		return Object.keys(this.#fields).some((stageId) => {
			return this.hasUnavailableFieldsByStage(stageId);
		});
	}

	hasUnavailableFieldsByStage(stageId: ?string): boolean
	{
		const allStagesFields = this.#fields.ALL ?? null;
		const hasAllStagesFields = Type.isPlainObject(allStagesFields)
			&& Type.isArrayFilled(Object.keys(allStagesFields))
		;

		if (stageId === null)
		{
			return hasAllStagesFields;
		}

		const currentStageFields = this.#fields[stageId] ?? null;
		const hasStageFields = Type.isPlainObject(currentStageFields)
			&& Type.isArrayFilled(Object.keys(currentStageFields))
		;

		return hasAllStagesFields || hasStageFields;
	}

	hidePopup(): void
	{
		this.#popup?.close();
		this.#popup = null;
	}

	async showPopup(targetNode: HTMLElement, stageId: ?string): void
	{
		if (this.#popup?.isShown())
		{
			return;
		}

		this.#popup?.destroy();

		// The popup id is shared across kanban columns. When switching between
		// columns, a popup left over from another column may still be finishing
		// its close animation and would make PopupManager.create return that
		// stale instance instead of a fresh popup. Destroy it first.
		PopupManager.getPopupById(POPUP_ID)?.destroy();

		const popup = this.#getPopup(targetNode, stageId);
		this.#popup = popup;

		await this.#afterTransition(targetNode);

		if (this.#popup !== popup)
		{
			return;
		}

		popup.show();
	}

	#getPopup(targetNode: HTMLElement, stageId: ?string): Popup
	{
		return PopupManager.create({
			id: POPUP_ID,
			bindElement: targetNode,
			borderRadius: '12px',
			cacheable: false,
			content: this.#getContent(stageId),
			contentPadding: 0,
			closeByEsc: false,
			closeIcon: {
				top: '11px',
				right: '5px',
			},
			fixed: true,
			offsetLeft: Dom.getPosition(targetNode).width / 2 - 190,
			width: 456,
			angle: {
				position: 'bottom',
				offset: 212,
			},
			animation: {
				closeAnimationType: 'animation',
				showClassName: 'crm-dups-popup-open',
				closeClassName: 'crm-dups-popup-close',
			},
		});
	}

	#getContent(stageId: ?string): HTMLElement
	{
		const fields = this.#getFields(stageId);
		const fieldNamesString = Text.encode(Object.values(fields).join(', '));
		const description = Object.keys(fields).length > 1
			? Loc.getMessage('CRM_ENTITY_ED_UFC_POPUP_DESCRIPTION_MANY_FIELDS', {
				'#FIELD_NAMES#': fieldNamesString,
			})
			: Loc.getMessage('CRM_ENTITY_ED_UFC_POPUP_DESCRIPTION_ONE_FIELD', {
				'#FIELD_NAME#': fieldNamesString,
			})
		;

		const button = this.#getButton();

		return Tag.render`
			<div class="crm-unavailable-fields-checker-popup">
				<div class="crm-unavailable-fields-checker-popup__title">
					${Loc.getMessage('CRM_ENTITY_ED_UFC_POPUP_TITLE')}
				</div>
				<div class="crm-unavailable-fields-checker-popup__description">
					${description}
				</div>
				${button.render()}
			</div>
		`;
	}

	#getFields(stageId: ?string): Object
	{
		return {
			...(this.#fields.ALL ?? []),
			...(this.#fields[stageId] ?? []),
		};
	}

	#getButton(): Button
	{
		return new Button({
			size: ButtonSize.SMALL,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			useAirDesign: true,
			text: Loc.getMessage('CRM_ENTITY_ED_UFC_POPUP_BUTTON'),
			wide: true,
			onclick: () => {
				top.BX.Helper?.show(`redirect=detail&code=${ARTICLE_CODE}`);
			},
		});
	}

	#afterTransition(element: HTMLElement): Promise<void> {
		return new Promise((resolve) => {
			const done = () => {
				Event.unbind(element, 'transitionend', handler);
				clearTimeout(timer);
				resolve();
			};

			const handler = (e) => {
				if (e.target !== element)
				{
					return;
				}

				done();
			};

			const duration = parseFloat(getComputedStyle(element).transitionDuration) * 1000;
			const timer = setTimeout(done, duration || 0);

			Event.bind(element, 'transitionend', handler);
		});
	}
}
