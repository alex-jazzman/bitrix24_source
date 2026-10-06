import {Dom, Runtime, Tag, Type, Event} from 'main.core';
import {Loc} from 'landing.loc';
import {BaseForm} from 'landing.ui.form.baseform';

import './css/card_form.css';

/**
 * @memberOf BX.Landing.UI.Form
 */
export class CardForm extends BaseForm
{
	constructor(options)
	{
		super(options);
		this.setEventNamespace('BX.Landing.UI.Form.CardForm');
		Dom.addClass(this.layout, 'landing-ui-form-card');

		this.onItemClick = Runtime.throttle(this.onItemClick, 200, this);
		this.onRemoveItemClick = this.onRemoveItemClick.bind(this);
		this.onHeaderKeyDown = this.onHeaderKeyDown.bind(this);
		this.onDragButtonClick = this.onDragButtonClick.bind(this);

		this.titleId = `landing-card-title-${this.id}`;
		this.bodyId = `landing-card-body-${this.id}`;
		this.wrapper = this.getWrapper();

		this.labelBindings = options.labelBindings;
		this.preset = options.preset;
		[, this.oldIndex] = this.selector.split('@');
	}

	getWrapper(): HTMLDivElement
	{
		const wrapper = Tag.render`
			<div class="landing-ui-form-cards-item">
				<div class="landing-ui-form-cards-item-inner">
					<div
						class="landing-ui-form-card-item-header"
						role="button"
						tabindex="0"
						aria-expanded="false"
						aria-controls="${this.bodyId}"
						aria-labelledby="${this.titleId}"
					>
						<div class="landing-ui-form-card-item-header-left">
							<div class="landing-ui-form-card-item-header-left-inner">
								<span
									class="landing-ui-form-card-item-header-drag landing-ui-drag"
									role="button"
									tabindex="0"
									aria-label="${Loc.getMessage('LANDING_CARDS_FORM_DRAG_HANDLE_LABEL')}"
									aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
								></span>
								<span class="landing-ui-form-card-item-header-title" id="${this.titleId}">${this.label}</span>
							</div>
							<div class="landing-ui-form-card-item-header-edit" aria-hidden="true">
								<span class="fa fa-pencil"></span>
							</div>
						</div>
						<div class="landing-ui-form-card-item-header-right">
							<button
								type="button"
								class="landing-ui-form-card-item-header-remove"
								aria-label="${Loc.getMessage('LANDING_CARDS_FORM_REMOVE_LABEL')}"
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
		this.dragButton = wrapper.querySelector('.landing-ui-form-card-item-header-drag');
		this.removeButton = wrapper.querySelector('.landing-ui-form-card-item-header-remove');

		Event.bind(this.header, 'click', this.onItemClick);
		Event.bind(this.header, 'keydown', this.onHeaderKeyDown);
		Event.bind(this.dragButton, 'click', this.onDragButtonClick);
		Event.bind(this.removeButton, 'click', this.onRemoveItemClick);

		Dom.attr(this.getNode(), 'id', this.bodyId);
		this.setExpanded(false);

		return wrapper;
	}

	setExpanded(expanded: boolean)
	{
		const body = this.getNode();

		Dom.attr(this.header, 'aria-expanded', expanded ? 'true' : 'false');

		// `inert` keeps the collapsed body measurable (height/transition unchanged)
		// while removing its fields from Tab order and the accessibility tree —
		// unlike `display:none`, which would break the expand animation.
		if (expanded)
		{
			body.removeAttribute('inert');
		}
		else
		{
			Dom.attr(body, 'inert', '');
		}
	}

	getTitleText(): string
	{
		const titleNode = this.wrapper
			? this.wrapper.querySelector('.landing-ui-form-card-item-header-title')
			: null;

		return titleNode ? titleNode.textContent : '';
	}

	onHeaderKeyDown(event: KeyboardEvent)
	{
		if (event.target !== event.currentTarget)
		{
			return;
		}

		if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
		{
			event.preventDefault();
			this.onItemClick(event);
		}
	}

	// eslint-disable-next-line class-methods-use-this
	onDragButtonClick(event: MouseEvent)
	{
		event.preventDefault();
		event.stopPropagation();
	}

	onItemClick(event: MouseEvent)
	{
		event.preventDefault();

		if (Type.isDomNode(event.currentTarget))
		{
			const target = event.currentTarget.closest('.landing-ui-form-cards-item');
			if (!Dom.hasClass(target, 'landing-ui-form-cards-item-expand'))
			{
				Dom.addClass(target, 'landing-ui-form-cards-item-expand');

				BX.Landing.Utils.onTransitionEnd(target).then(() => {
					Dom.style(target, {
						overflow: 'visible',
					});
				});

				Dom.style(target, {
					height: 'auto',
				});

				this.setExpanded(true);
			}
			else
			{
				Dom.removeClass(target, 'landing-ui-form-cards-item-expand');
				Dom.style(target, null);

				this.setExpanded(false);
			}
		}
	}

	onRemoveItemClick(event: MouseEvent)
	{
		event.preventDefault();
		event.stopPropagation();
		if (!this.getLayout().closest('.landing-ui-disallow-remove'))
		{
			Dom.remove(this.wrapper);
			this.emit('onRemove');
		}
	}

	serialize(): {[key: string]: any}
	{
		return this.fields
			.reduce((res, field) => {
				const [index] = field.selector.split('@');
				res[index] = field.getValue();
				return res;
			}, {});
	}

	getPreset()
	{
		return this.preset || null;
	}
}