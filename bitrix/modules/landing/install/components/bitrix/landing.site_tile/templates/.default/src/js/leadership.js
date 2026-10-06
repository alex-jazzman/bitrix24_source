import { Tag, Event, Loc } from 'main.core';
import {EventEmitter} from 'main.core.events';
import { A11y } from './a11y';

export default class LeaderShip {
	constructor(options)
	{
		this.id = options.id;
		this.item = options.item;
		this.articles = options.articles || [];

		this.$container = null;
		this.$containerClose = null;
		this.focusTrap = null;
		this.focusTrapPromise = null;
		this.isShown = false;

		this.adjustCloseEditByClick = this.adjustCloseEditByClick.bind(this);
		this.adjustCloseEditByKeyDown = this.adjustCloseEditByKeyDown.bind(this);
	}

	show()
	{
		this.isShown = true;
		A11y.setHidden(this.getContainer(), false);
		this.getContainer().classList.add('--show');
		this.activateFocusTrap();
		Event.bind(document.body, 'click', this.adjustCloseEditByClick);
		Event.bind(document.body, 'keydown', this.adjustCloseEditByKeyDown);
		EventEmitter.emit('BX.Landing.SiteTile:showLeadership', this.item);
	}

	hide()
	{
		this.isShown = false;
		this.deactivateFocusTrap();
		A11y.setHidden(this.getContainer(), true);
		this.getContainer().classList.remove('--show');
		Event.unbind(document.body, 'click', this.adjustCloseEditByClick);
		Event.unbind(document.body, 'keydown', this.adjustCloseEditByKeyDown);
		EventEmitter.emit('BX.Landing.SiteTile:hideLeadership', this.item);
	}

	activateFocusTrap()
	{
		if (this.focusTrap)
		{
			this.focusTrap.activate({ initialFocus: true });
			return;
		}

		if (!this.focusTrapPromise)
		{
			this.focusTrapPromise = A11y.createFocusTrap(this.getContainer(), {
				initialFocus: 'first-tabbable',
				restoreFocus: true,
				isolateOutside: true,
			});
		}

		this.focusTrapPromise
			.then((focusTrap) => {
				this.focusTrap = focusTrap;
				if (this.isShown && this.focusTrap)
				{
					this.focusTrap.activate({ initialFocus: true });
				}
			})
			.catch(() => {});
	}

	deactivateFocusTrap()
	{
		this.focusTrap?.deactivate();
	}

	adjustCloseEditByClick(ev)
	{
		if(	ev.type !== 'click')
		{
			return;
		}

		if(	!ev.target.closest('.landing-sites__helper-' + this.id)
			&& !ev.target.closest('.landing-sites__preview-leadership-text'))
		{
			this.hide();
		}
	}

	adjustCloseEditByKeyDown(ev)
	{
		if(ev.type !== 'keydown')
		{
			return;
		}

		if(ev.keyCode === 27) // close by Escape
		{
			this.hide();
		}
	}

	getContainerClose()
	{
		if(!this.$containerClose)
		{
			this.$containerClose = Tag.render`
				<button type="button" class="landing-sites__helper-close-toggler">
					${Loc.getMessage('LANDING_SITE_TILE_HIDE')}
				</button>
			`;

			Event.bind(this.$containerClose, 'click', this.hide.bind(this));
		}

		return this.$containerClose;
	}

	getContainer()
	{
		if(!this.$container)
		{
			let articlesNode = Tag.render`<div class="landing-sites__helper-list"></div>`;

			for (let i = 0; i < this.articles.length; i++)
			{
				let item = this.articles[i];
				articlesNode.appendChild(Tag.render`
					<div class="landing-sites__helper-item ${item.read ? '--read' : ''}">
						<div class="landing-sites__helper-item-title">${item.title}</div>
						<div class="landing-sites__helper-item-container">
							<div class="landing-sites__helper-item-text">${item.text}</div>
							<div class="landing-sites__helper-item-button ${item.read ? '--read' : ''}"">
								${item.read 
									? Loc.getMessage('LANDING_SITE_TILE_READ')
									: Loc.getMessage('LANDING_SITE_TILE_TO_READ')}
							</div>
						</div>
					</div>
				`);
			}

			const titleId = `landing-sites__helper-title-${this.id}`;

			this.$container = Tag.render`
				<div
					class="landing-sites__helper landing-sites__helper-${this.id}"
					role="dialog"
					aria-modal="true"
					aria-labelledby="${titleId}"
					aria-hidden="true"
					inert
				>
					<div class="landing-sites__helper-title">
						<div id="${titleId}" class="landing-sites__helper-title-text">
							${Loc.getMessage('LANDING_SITE_TILE_LEADERSHIP_TITLE')}
						</div>
						${this.getContainerClose()}
					</div>
					<div class="landing-sites__helper-container">
						${articlesNode}
					</div>
				</div>
			`;
		}

		return this.$container;
	}
}
