import { Dom, Type } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';

import { Popup } from '../popup/popup';

export type InputPopupValue = {
	ID: string | number;
	NAME: string;
	DESCRIPTION?: string;
	CLASS_NAME?: string;
	URL?: string;
};

export type InputPopupHandler = (data: { ind: number | string | false; value: string }) => void;

export type InputPopupOptions = {
	id?: string;
	handler?: InputPopupHandler;
	values?: InputPopupValue[];
	input: HTMLInputElement;
	defaultValue?: string;
	openTitle?: string;
	className?: string;
	noMRclassName?: string;
};

/**
 * @deprecated
 */
export class InputPopup
{
	id: string;
	handler: InputPopupHandler | false;
	values: InputPopupValue[] | false;
	pInput: HTMLInputElement;
	bValues: boolean;
	defaultValue: string;
	openTitle: string;
	className: string;
	noMRclassName: string;
	emptyClassName: string;
	curInd: number | string | false;
	bShowed: boolean | undefined;
	oPopup: Popup | undefined;
	oEC: { bUseMR: boolean } | undefined;

	constructor(params: InputPopupOptions)
	{
		this.id = params.id || `bx-inp-popup-${Math.round(Math.random() * 1_000_000)}`;
		this.handler = params.handler || false;
		this.values = params.values || false;
		this.pInput = params.input;
		this.bValues = Boolean(this.values);
		this.defaultValue = params.defaultValue || '';
		this.openTitle = params.openTitle || '';
		this.className = params.className || '';
		this.noMRclassName = params.noMRclassName || 'ec-no-rm';
		this.emptyClassName = params.noMRclassName || 'ec-label';

		this.curInd = false;

		if (this.bValues)
		{
			const handleInput = (e: Event) => {
				if (this.pInput.value === this.defaultValue)
				{
					this.pInput.value = '';
					this.pInput.className = this.className;
				}
				this.ShowPopup();

				return e.preventDefault();
			};
			this.pInput.onfocus = handleInput;
			this.pInput.onclick = handleInput;

			this.pInput.onblur = () => {
				if (this.bShowed)
				{
					setTimeout(() => {
						this.ClosePopup(true);
					}, 200);
				}
				this.OnChange();
			};
		}
		else
		{
			this.pInput.className = this.noMRclassName;
			this.pInput.onblur = this.OnChange.bind(this);
		}
	}

	private getValues(): InputPopupValue[]
	{
		return this.values === false ? [] : this.values;
	}

	ShowPopup(): void
	{
		if (this.bShowed)
		{
			return;
		}

		if (!this.oPopup)
		{
			const selectValue = (ind: string): void => {
				this.pInput.value = this.getValues()[ind as unknown as number].NAME;
				this.curInd = ind;
				this.OnChange();
				this.ClosePopup(true);
			};
			const pWnd = Dom.create('DIV', { props: { className: `bxecpl-loc-popup ${this.className}` } });

			const values = this.getValues();
			for (let i = 0, l = values.length; i < l; i++)
			{
				const value = values[i];
				const pRow = Dom.create('DIV', {
					props: { id: `bxecmr_${i}` },
					text: value.NAME,
					events: {
						mouseover(this: HTMLElement)
						{
							Dom.addClass(this, 'bxecplloc-over');
						},
						mouseout(this: HTMLElement)
						{
							Dom.removeClass(this, 'bxecplloc-over');
						},
						click(this: HTMLElement)
						{
							const ind = this.id.slice('bxecmr_'.length);
							selectValue(ind);
						},
					},
				});
				Dom.append(pRow, pWnd);

				if (value.DESCRIPTION)
				{
					pRow.title = value.DESCRIPTION;
				}

				if (value.CLASS_NAME)
				{
					Dom.addClass(pRow, value.CLASS_NAME);
				}

				if (value.URL)
				{
					const viewLink = Dom.create('a', {
						props: {
							href: value.URL,
							className: 'bxecplloc-view',
							target: '_blank',
							title: this.openTitle,
						},
					});
					Dom.append(viewLink, pRow);
				}
			}

			this.oPopup = new Popup(this.id, this.pInput, {
				autoHide: true,
				offsetTop: 1,
				offsetLeft: 0,
				closeByEsc: true,
				content: pWnd,
				events: {
					onClose: this.ClosePopup.bind(this),
				},
			});
		}

		this.oPopup.show();
		this.pInput.select();
		this.bShowed = true;

		EventEmitter.emit(this, 'onInputPopupShow', new BaseEvent({ compatData: [this] }));
	}

	ClosePopup(bClosePopup?: boolean | BaseEvent): void
	{
		this.bShowed = false;

		if (this.pInput.value === '')
		{
			this.OnChange();
		}

		EventEmitter.emit(this, 'onInputPopupClose', new BaseEvent({ compatData: [this] }));

		if (bClosePopup === true)
		{
			this.oPopup!.close();
		}
	}

	OnChange(): void
	{
		let val = this.pInput.value;
		if (this.bValues)
		{
			if (this.pInput.value === '' || this.pInput.value === this.defaultValue)
			{
				this.pInput.value = this.defaultValue;
				this.pInput.className = this.emptyClassName;
				val = '';
			}
			else
			{
				this.pInput.className = '';
			}
		}

		if (
			Number.isNaN(Number.parseInt(this.curInd as string, 10))
			|| (this.curInd !== false && val !== this.getValues()[this.curInd as number].NAME)
		)
		{
			this.curInd = false;
		}
		else
		{
			this.curInd = Number.parseInt(this.curInd as string, 10);
		}

		EventEmitter.emit(this, 'onInputPopupChanged', new BaseEvent({ compatData: [this, this.curInd, val] }));

		if (this.handler && Type.isFunction(this.handler))
		{
			this.handler({ ind: this.curInd, value: val });
		}
	}

	Set(ind: number | string | false, val: string, bOnChange?: boolean): void
	{
		this.curInd = ind;
		if (this.curInd === false)
		{
			this.pInput.value = val;
		}
		else
		{
			this.pInput.value = this.getValues()[this.curInd as number].NAME;
		}

		if (bOnChange !== false)
		{
			this.OnChange();
		}
	}

	Get(ind?: number | string | false): string | number | false
	{
		let id: string | number | false = false;
		const index = Type.isUndefined(ind) ? this.curInd : ind;

		const value = index === false ? undefined : this.getValues()[index as number];
		if (value)
		{
			id = value.ID;
		}

		return id;
	}

	GetIndex(id: string | number): number | false
	{
		const values = this.getValues();
		for (let i = 0, l = values.length; i < l; i++)
		{
			const valueId = values[i].ID;
			const isSameId = Type.isNumber(valueId) || Type.isNumber(id)
				? Number(valueId) === Number(id)
				: valueId === id;
			if (isSameId)
			{
				return i;
			}
		}

		return false;
	}

	Deactivate(bDeactivate: boolean): void
	{
		if (this.pInput.value === '' || this.pInput.value === this.defaultValue)
		{
			if (bDeactivate)
			{
				this.pInput.value = '';
				this.pInput.className = this.noMRclassName;
			}
			else if (this.oEC!.bUseMR)
			{
				this.pInput.value = this.defaultValue;
				this.pInput.className = this.emptyClassName;
			}
		}

		this.pInput.disabled = bDeactivate;
	}
}
