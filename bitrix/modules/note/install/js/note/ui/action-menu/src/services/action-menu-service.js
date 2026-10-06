import { Tag, Text, Type } from 'main.core';
import { MenuManager } from 'main.popup';
import { NoteThemeContext } from 'note.ui.theme-context';

const POPUP_CLASS = 'note-action-menu';

export class ActionMenuService
{
	#menu: Object | null = null;
	#openKey: string = '';
	#popupClass: string;
	#additionalClassName: string;

	constructor(options: Object = {})
	{
		this.#popupClass = Type.isStringFilled(options?.popupClass) ? options.popupClass : POPUP_CLASS;
		this.#additionalClassName = Type.isStringFilled(options?.additionalClassName)
			? options.additionalClassName
			: ''
		;
	}

	destroy(): void
	{
		this.#openKey = '';

		if (this.#menu)
		{
			this.#menu.destroy();
			this.#menu = null;
		}
	}

	open(items: Array<Object>, bindElement: HTMLElement, options: Object = {}): void
	{
		if (!Array.isArray(items) || items.length === 0 || !bindElement)
		{
			return;
		}

		const key = Type.isStringFilled(options?.key) ? String(options.key) : '';

		if (key !== '' && this.#openKey === key)
		{
			this.destroy();

			return;
		}

		this.destroy();
		this.#openKey = key;

		const popupClass = Type.isStringFilled(options?.popupClass) ? options.popupClass : this.#popupClass;
		const additionalClassName = Type.isStringFilled(options?.additionalClassName)
			? options.additionalClassName
			: this.#additionalClassName
		;
		const menuItems = items.map((item) => this.#prepareItem(item, popupClass));
		const menuId = `${popupClass}-${Text.getRandom()}`;
		const targetContainer = options?.targetContainer ?? document.body;
		const className = additionalClassName === '' ? popupClass : `${popupClass} ${additionalClassName}`;

		this.#menu = MenuManager.create(
			menuId,
			bindElement,
			menuItems,
			{
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				offsetTop: Type.isNumber(options?.offsetTop) ? options.offsetTop : 9,
				className,
				targetContainer,
				designSystemContext: NoteThemeContext.getDesignSystemContext(),
				events: {
					onPopupClose: () => {
						this.#openKey = '';
						this.#menu = null;
					},
				},
			},
		);

		this.#menu?.show();
	}

	#prepareItem(item: Object, popupClass: string): Object
	{
		const text = String(item?.text ?? '');
		const iconModifier = String(item?.iconModifier ?? '');
		const iconColor = Type.isStringFilled(item?.iconColor) ? String(item.iconColor) : '';
		const iconElement = item?.iconElement instanceof HTMLElement ? item.iconElement : null;
		const danger = Boolean(item?.danger);
		const onClick = Type.isFunction(item?.onClick) ? item.onClick : () => {};
		const testId = Type.isStringFilled(item?.testId) ? String(item.testId) : '';

		const baseClass = `${popupClass}-item`;
		const className = danger
			? `${baseClass} ${baseClass}--danger`
			: baseClass
		;

		return {
			html: this.#renderItem(text, iconModifier, iconColor, iconElement, popupClass, testId),
			className,
			onclick: () => {
				this.destroy();
				onClick();
			},
		};
	}

	#renderItem(
		text: string,
		iconModifier: string,
		iconColor: string,
		iconElement: HTMLElement | null,
		popupClass: string,
		testId: string,
	): HTMLElement
	{
		const safeText = String(text || '');
		const iconNode = iconElement ?? this.#renderIconSetIcon(iconModifier, iconColor, popupClass);
		// Identity for tests: an item is otherwise reachable only by its icon modifier
		// or its localised label, both of which drift.
		const row = Tag.render`
			<span class="${popupClass}-row">
				<span class="${popupClass}-text">${safeText}</span>
				${iconNode}
			</span>
		`;

		if (testId !== '')
		{
			row.dataset.testid = testId;
		}

		return row;
	}

	#renderIconSetIcon(iconModifier: string, iconColor: string, popupClass: string): HTMLElement
	{
		const iconClass = iconModifier ? `ui-icon-set --${iconModifier} ${popupClass}-icon` : '';
		const iconStyle = iconColor ? `--ui-icon-set__icon-color: ${iconColor};` : '';

		return Tag.render`<span class="${iconClass}" style="${iconStyle}"></span>`;
	}
}
