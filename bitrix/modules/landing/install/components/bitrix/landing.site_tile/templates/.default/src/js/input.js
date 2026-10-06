import { Dom, Event, Loc } from 'main.core';

import { A11y } from './a11y';

export class LandingSitesAiInput
{
	static instance = null;

	static init(options)
	{
		this.instance = new this(options);

		return this.instance;
	}

	static setActive(active, options)
	{
		this.instance?.setActive(active, options);
	}

	static activate()
	{
		this.setActive(true);
	}

	static deactivate()
	{
		this.setActive(false);
	}

	static toggle()
	{
		this.instance?.toggle();
	}

	static getValue()
	{
		return this.instance?.getValue() || '';
	}

	static setValue(value)
	{
		this.instance?.setValue(value);
	}

	static getState()
	{
		return this.instance?.getState() || {
			isActive: false,
			isInactive: true,
			isAnimating: false,
			isMultiline: false,
			isNoticeVisible: true,
			isControlVisible: false,
			value: '',
		};
	}

	static get isActive()
	{
		return this.getState().isActive;
	}

	static get isInactive()
	{
		return this.getState().isInactive;
	}

	static get isAnimating()
	{
		return this.getState().isAnimating;
	}

	static get isMultiline()
	{
		return this.getState().isMultiline;
	}

	static get isNoticeVisible()
	{
		return this.getState().isNoticeVisible;
	}

	static get isControlVisible()
	{
		return this.getState().isControlVisible;
	}

	constructor(options)
	{
		this.box = options.box || null;
		this.frame = options.frame || null;
		this.notice = options.notice || null;
		this.control = options.control || null;
		this.input = options.input || null;
		this.inputDescriptionId = this.input?.getAttribute('aria-describedby') || '';
		this.valueInput = options.valueInput || null;
		this.icon = options.icon || null;
		this.isActive = false;
		this.isInactive = true;
		this.isAnimating = false;
		this.isMultiline = false;
		this.isLoading = false;
		this.resizeObserver = null;

		this.handleInput = this.handleInput.bind(this);
		this.handlePaste = this.handlePaste.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handlePointerInteraction = this.handlePointerInteraction.bind(this);
		this.handleIconClick = this.handleIconClick.bind(this);
		this.handleTransitionEnd = this.handleTransitionEnd.bind(this);
		this.updateRowsState = this.updateRowsState.bind(this);
		this.updateIconOffset = this.updateIconOffset.bind(this);
		this.updateHeight = this.updateHeight.bind(this);

		this.initEvents();
		this.renderState();
		requestAnimationFrame(() => {
			this.updateRowsState();
			this.updateIconOffset();
			this.updateHeight();
		});
	}

	initEvents()
	{
		if (!this.box || !this.input)
		{
			return;
		}

		this.input.addEventListener('input', this.handleInput);
		this.input.addEventListener('paste', this.handlePaste);
		this.input.addEventListener('keydown', this.handleKeyDown);
		Event.bind(this.input, 'focus', this.handleFocus);
		Event.bind(this.input, 'blur', this.handleBlur);
		if (this.control)
		{
			Event.bind(this.control, 'pointerdown', this.handlePointerInteraction);
			Event.bind(this.control, 'mousedown', this.handlePointerInteraction);
			Event.bind(this.control, 'touchstart', this.handlePointerInteraction);
		}
		this.box.addEventListener('transitionend', this.handleTransitionEnd);
		this.icon?.addEventListener('click', this.handleIconClick);
		window.addEventListener('resize', this.updateHeight);

		if (window.ResizeObserver)
		{
			this.resizeObserver = new ResizeObserver(() => {
				this.updateRowsState();
				this.updateIconOffset();
				this.updateHeight();
			});
			this.resizeObserver.observe(this.input);
		}
	}

	handleInput()
	{
		if (this.input.innerText.trim() === '')
		{
			this.input.innerHTML = '';
		}

		this.syncValue();
		this.updateRowsState();
		this.updateIconOffset();
		this.updateHeight();
	}

	handlePaste(event)
	{
		event.preventDefault();

		const text = event.clipboardData.getData('text/plain');
		document.execCommand('insertText', false, text);
	}

	handleKeyDown(event)
	{
		if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey)
		{
			return;
		}

		if (event.isComposing || event.keyCode === 229)
		{
			return;
		}

		event.preventDefault();

		if (event.repeat || this.isInactive || this.isLoading)
		{
			return;
		}

		this.submitInitialPrompt();
	}

	handleFocus()
	{
		if (!this.input)
		{
			return;
		}

		const isKeyboardFocus = document.documentElement.dataset.inputModality === 'keyboard';
		if (isKeyboardFocus)
		{
			Dom.addClass(this.input, '--keyboard-focused');
		}
		else
		{
			Dom.removeClass(this.input, '--keyboard-focused');
		}
	}

	handleBlur()
	{
		this.removeKeyboardFocus();
	}

	handlePointerInteraction()
	{
		this.removeKeyboardFocus();
	}

	removeKeyboardFocus()
	{
		if (this.input)
		{
			Dom.removeClass(this.input, '--keyboard-focused');
		}
	}

	handleIconClick(event)
	{
		if (this.isInactive || this.isLoading)
		{
			event.preventDefault();
			return;
		}

		event.preventDefault();
		this.submitInitialPrompt();
	}

	submitInitialPrompt()
	{
		const initialPrompt = this.getValue();
		if (!initialPrompt)
		{
			A11y.announce(Loc.getMessage('LANDING_SITE_TILE_AI_INPUT_EMPTY_ANNOUNCE'));

			return;
		}

		if (!this.icon)
		{
			return;
		}

		const action = this.icon.dataset.action || this.icon.getAttribute('href');
		if (!action)
		{
			return;
		}

		this.setLoading(true);

		const form = document.createElement('form');
		form.method = 'post';
		form.action = action;
		form.acceptCharset = 'UTF-8';
		form.style.display = 'none';

		form.appendChild(this.createHiddenInput('initial_prompt', initialPrompt));

		const sessid = this.getSessid();
		if (sessid)
		{
			form.appendChild(this.createHiddenInput('sessid', sessid));
		}

		document.body.appendChild(form);
		form.submit();
	}

	setLoading(loading)
	{
		this.isLoading = loading === true;
		this.icon?.classList.toggle('--loading', this.isLoading);
		this.icon?.setAttribute('aria-busy', this.isLoading ? 'true' : 'false');
		this.box?.classList.toggle('--loading', this.isLoading);

		if (this.input)
		{
			this.input.contentEditable = this.isLoading ? 'false' : 'true';
		}
	}

	createHiddenInput(name, value)
	{
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = name;
		input.value = value || '';

		return input;
	}

	getSessid()
	{
		if (typeof BX !== 'undefined' && typeof BX.bitrix_sessid === 'function')
		{
			return BX.bitrix_sessid();
		}

		if (typeof BX !== 'undefined' && typeof BX.message === 'function')
		{
			return BX.message('bitrix_sessid') || '';
		}

		return '';
	}

	handleTransitionEnd(event)
	{
		if (event.target !== this.box || event.propertyName !== 'height')
		{
			return;
		}

		this.isAnimating = false;
		this.frame?.classList.remove('--animating');
		this.box.classList.remove('--animating');
		this.box.style.height = 'auto';
	}

	setActive(active, options = {})
	{
		const nextState = active === true;

		if (this.isActive === nextState)
		{
			return;
		}

		this.isActive = nextState;
		this.isInactive = !nextState;
		this.isAnimating = true;
		const previousHeight = this.box?.offsetHeight || 0;
		this.renderState();
		this.updateRowsState();
		this.updateIconOffset();
		this.updateHeight(previousHeight);

		if (this.isActive && options.focus === true)
		{
			this.input?.focus();
		}
	}

	toggle()
	{
		this.setActive(!this.isActive);
	}

	getValue()
	{
		return this.input ? this.input.innerText.trim() : '';
	}

	setValue(value)
	{
		if (!this.input)
		{
			return;
		}

		this.input.innerText = value || '';
		this.syncValue();
		this.updateRowsState();
		this.updateIconOffset();
		this.updateHeight();
	}

	getState()
	{
		return {
			isActive: this.isActive,
			isInactive: this.isInactive,
			isAnimating: this.isAnimating,
			isMultiline: this.isMultiline,
			isNoticeVisible: this.isInactive,
			isControlVisible: this.isActive,
			value: this.getValue(),
		};
	}

	syncValue()
	{
		if (this.valueInput)
		{
			this.valueInput.value = this.getValue();
		}
	}

	renderState()
	{
		if (!this.box)
		{
			return;
		}

		this.frame?.classList.toggle('--active', this.isActive);
		this.frame?.classList.toggle('--inactive', this.isInactive);
		this.frame?.classList.toggle('--animating', this.isAnimating);
		this.box.classList.toggle('--active', this.isActive);
		this.box.classList.toggle('--inactive', this.isInactive);
		this.box.classList.toggle('--animating', this.isAnimating);
		this.notice?.classList.toggle('--active', this.isInactive);
		this.control?.classList.toggle('--active', this.isActive);

		// Only one half of the pair is on the screen: the other one is faded out to opacity 0, which
		// leaves it readable and reachable, so it is taken out of the accessibility tree as well.
		A11y.setHidden(this.notice, this.isActive);
		A11y.setHidden(this.control, this.isInactive);

		if (this.frame)
		{
			this.frame.tabIndex = -1;
		}

		if (this.input)
		{
			this.input.contentEditable = this.isActive ? 'true' : 'false';
			this.input.setAttribute('aria-disabled', this.isActive ? 'false' : 'true');
			this.input.tabIndex = this.isActive ? 0 : -1;

			// The notice describes the inactive state only; in the active one it is hidden above.
			if (this.isActive || !this.inputDescriptionId)
			{
				this.input.removeAttribute('aria-describedby');
			}
			else
			{
				this.input.setAttribute('aria-describedby', this.inputDescriptionId);
			}
		}

		if (this.icon)
		{
			this.icon.setAttribute('aria-disabled', this.isActive ? 'false' : 'true');
			this.icon.tabIndex = this.isActive ? 0 : -1;
		}
	}

	updateRowsState()
	{
		if (!this.box || !this.input)
		{
			return;
		}

		const lineHeight = parseFloat(getComputedStyle(this.input).lineHeight);
		this.isMultiline = Number.isFinite(lineHeight) && this.input.scrollHeight > lineHeight * 1.5;
		this.box.classList.toggle('--multiline', this.isMultiline);
	}

	updateIconOffset()
	{
		if (!this.input || !this.icon)
		{
			return;
		}

		const iconOffset = Math.max(0, this.input.offsetHeight - this.icon.offsetHeight);
		this.icon.style.setProperty('--landing-sites-ai-input-icon-offset', `${iconOffset}px`);
	}

	updateHeight(previousHeight = null)
	{
		if (!this.box)
		{
			return;
		}

		if (this.isAnimating && previousHeight === null)
		{
			return;
		}

		const fromHeight = Number.isFinite(previousHeight) ? previousHeight : this.box.offsetHeight;
		this.box.style.height = 'auto';
		const nextHeight = this.box.offsetHeight;

		if (fromHeight === nextHeight)
		{
			this.box.style.height = `${nextHeight}px`;
			this.isAnimating = false;
			this.frame?.classList.remove('--animating');
			this.box.classList.remove('--animating');
			return;
		}

		this.box.style.height = `${fromHeight}px`;
		// Commit the starting height. Without a layout read the browser goes straight to the target
		// height, the transition never starts and its transitionend never releases the box.
		void this.box.offsetHeight;

		requestAnimationFrame(() => {
			this.box.style.height = `${nextHeight}px`;
		});
	}
}
