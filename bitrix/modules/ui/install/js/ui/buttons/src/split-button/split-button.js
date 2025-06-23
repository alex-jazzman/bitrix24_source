import type { Switcher } from 'ui.switcher';

import Button from '../button/button';
import SplitSubButton from './split-sub-button';
import SplitButtonState from './split-button-state';
import ButtonState from '../button/button-state';
import ButtonSize from '../button/button-size';
import { Type, Tag } from 'main.core';
import SplitSubButtonType from './split-sub-button-type';
import type { SplitButtonOptions } from './split-button-options';
import ButtonTag from '../button/button-tag';
import type { SetCounterOptions } from '../base-button';
import { ButtonCounterOptions } from 'ui.buttons';
import { getSwitcherSizeByButtonSize } from './helpers/get-switcher-size';

/**
 * @namespace {BX.UI}
 */
export default class SplitButton extends Button
{
	static BASE_CLASS = 'ui-btn-split';

	constructor(options: SplitButtonOptions)
	{
		options = Type.isPlainObject(options) ? options : {};
		// delete options.round;

		if (Type.isStringFilled(options.link))
		{
			options.mainButton = Type.isPlainObject(options.mainButton) ? options.mainButton : {};
			options.mainButton.link = options.link;
			delete options.link;
		}

		options.tag = ButtonTag.DIV;
		options.baseClass = SplitButton.BASE_CLASS;

		super(options);
	}

	init()
	{
		const mainOptions = Type.isPlainObject(this.options.mainButton) ? this.options.mainButton : {};
		const menuOptions = Type.isPlainObject(this.options.menuButton) ? this.options.menuButton : {};
		mainOptions.buttonType = SplitSubButtonType.MAIN;
		mainOptions.splitButton = this;

		menuOptions.buttonType = SplitSubButtonType.MENU;
		menuOptions.splitButton = this;

		this.mainButton = new SplitSubButton({
			...mainOptions,
			useAirDesign: this.options.useAirDesign,
			style: this.options.style,
		});

		this.menuButton = new SplitSubButton(menuOptions);
		this.menuTarget = SplitSubButtonType.MAIN;

		if (this.options.menuTarget === SplitSubButtonType.MENU)
		{
			this.menuTarget = SplitSubButtonType.MENU;
		}

		if (Type.isPlainObject(this.options.switcher) || this.options.switcher === true)
		{
			const addSwitcherOptions = Type.isPlainObject(this.options.switcher) ? this.options.switcher : {};
			const buttonSize = Type.isStringFilled(this.options.size) ? this.options.size : ButtonSize.MEDIUM;

			this.switcherButton = new SplitSubButton({
				buttonType: SplitSubButtonType.SWITCHER,
				splitButton: this,
				switcherOptions: {
					...addSwitcherOptions,
					disabled: this.options.disabled,
					size: getSwitcherSizeByButtonSize(buttonSize),
					useAirDesign: this.options.useAirDesign === true,
				},
			});
		}

		super.init();
	}

	static State = SplitButtonState;

	/**
	 * @public
	 * @return {HTMLElement}
	 */
	getContainer(): HTMLElement
	{
		if (this.button === null)
		{
			const rightButton = this.getSwitcherButton()
				? this.getSwitcherButton()?.getContainer()
				: this.getMenuButton().getContainer()
			;

			this.button = Tag.render`
				<div class="${this.getBaseClass()}">${[
				this.getMainButton().getContainer(),
				rightButton,
			]}</div>
			`;
		}

		return this.button;
	}

	/**
	 * @public
	 * @return {SplitSubButton}
	 */
	getMainButton(): SplitSubButton
	{
		return this.mainButton;
	}

	/**
	 * @public
	 * @return {SplitSubButton}
	 */
	getMenuButton(): SplitSubButton
	{
		return this.menuButton;
	}

	getSwitcherButton(): ?SplitSubButton
	{
		return this.switcherButton;
	}

	getSwitcher(): ?Switcher
	{
		return this.getSwitcherButton()?.getSwitcher();
	}

	setAirDesign(use: boolean) {
		super.setAirDesign(use);

		if (this.getSwitcher())
		{
			this.getSwitcher().setAirDesign(use);
		}
	}

	/**
	 * @public
	 * @param {string} text
	 * @return {this}
	 */
	setText(text: string): this
	{
		if (Type.isString(text))
		{
			this.getMainButton().setText(text);
		}

		return this;
	}

	/**
	 * @public
	 * @return {string}
	 */
	getText(): string
	{
		return this.getMainButton().getText();
	}

	/**
	 *
	 * @param {number | string} counter
	 * @return {this}
	 */
	setCounter(counter: number | string): this
	{
		return this.getMainButton().setCounter(counter);
	}

	// use only with air buttons
	setLeftCounter(options: ButtonCounterOptions | null): this {
		if (options)
		{
			const optionsWithSize = {...options};
			if (this.getSize())
			{
				optionsWithSize.size = this.getSize();
			}

			this.getMainButton().setLeftCounter(optionsWithSize);
		}

		return this;
	}

	// use only with air buttons
	setRightCounter(options: ButtonCounterOptions | null): this {
		if (options)
		{
			const optionsWithSize = {...options};
			if (this.getSize())
			{
				optionsWithSize.size = this.getSize();
			}

			this.getMainButton().setRightCounter(optionsWithSize);
		}

		return this;
	}

	/**
	 *
	 * @return {number | string | null}
	 */
	getCounter(): number | string | null
	{
		return this.getMainButton().getCounter();
	}

	/**
	 *
	 * @param {string} link
	 * @return {this}
	 */
	setLink(link: string): this
	{
		return this.getMainButton().setLink(link);
	}

	/**
	 *
	 * @return {string}
	 */
	getLink(): string
	{
		return this.getMainButton().getLink();
	}

	/**
	 * @public
	 * @param {SplitButtonState|null} state
	 * @return {this}
	 */
	setState(state: SplitButtonState | null): this
	{
		return this.setProperty('state', state, SplitButtonState);
	}

	/**
	 * @public
	 * @param {boolean} [flag=true]
	 * @return {this}
	 */
	setDisabled(flag?: boolean): this
	{
		this.setState(flag === false ? null : ButtonState.DISABLED);
		this.getMainButton().setDisabled(flag);
		this.getMenuButton()?.setDisabled(flag);
		this.getSwitcherButton()?.setDisabled(flag);

		return this;
	}

	/**
	 * @protected
	 * @return {HTMLElement}
	 */
	getMenuBindElement(): HTMLElement
	{
		if (this.getMenuTarget() === SplitSubButtonType.MENU)
		{
			return this.getMenuButton().getContainer();
		}
		else
		{
			return this.getContainer();
		}
	}

	/**
	 * @protected
	 * @param {MouseEvent} event
	 */
	handleMenuClick(event: MouseEvent): void
	{
		this.getMenuWindow().show();

		const isActive = this.getMenuWindow().getPopupWindow().isShown();
		this.getMenuButton().setActive(isActive);
	}

	/**
	 * @protected
	 */
	handleMenuClose(): void
	{
		this.getMenuButton().setActive(false);
	}

	/**
	 * @protected
	 * @return {HTMLElement}
	 */
	getMenuClickElement(): HTMLElement
	{
		return this.getMenuButton().getContainer();
	}

	/**
	 * @public
	 * @return {SplitSubButtonType}
	 */
	getMenuTarget(): SplitSubButtonType
	{
		return this.menuTarget;
	}

	/**
	 *
	 * @param {boolean} [flag=true]
	 * @return {this}
	 */
	setDropdown(flag?: boolean): this
	{
		return this;
	}

	/**
	 * @public
	 * @return {boolean}
	 */
	isDropdown(): boolean
	{
		return true;
	}
}
