import { Event, Loc, Tag, Type } from 'main.core';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { Tooltip } from 'ui.dialogs.tooltip';
import 'ui.system.typography';

import './style.css';

export class HelperNotification
{
	#bindElement = null;
	#tooltip = null;
	#isShown = false;
	#bindElementClickHandler = this.handleBindElementClick.bind(this);

	constructor(options = {})
	{
		if (Type.isPlainObject(options) && Type.isDomNode(options.bindElement))
		{
			this.#bindElement = options.bindElement;
		}
	}

	show(): void
	{
		if (!this.#bindElement || this.#isShown)
		{
			return;
		}

		BannerDispatcher.normal.toQueue((onDone) => {
			if (!Type.isDomNode(this.#bindElement) || this.#isShown)
			{
				onDone();

				return;
			}

			this.#tooltip = this.#createTooltip(onDone);

			this.#isShown = true;
			Event.bind(this.#bindElement, 'click', this.#bindElementClickHandler);
			this.#tooltip.show();
		});
	}

	#createTooltip(onClose: func): Tooltip
	{
		return new Tooltip({
			bindElement: this.#bindElement,
			content: this.#getContent(),
			popupOptions: {
				autoHide: true,
				closeByEsc: true,
				closeIcon: false,
				angle: true,
				offsetTop: 14,
				offsetLeft: 24,
				maxHeight: 140,
				minWidth: 360,
				className: 'ui-dialog-tooltip intranet-helper-notification-popup',
				events: {
					onAfterPopupShow: () => {
						this.#markAsShown();
					},
					onClose: () => {
						this.#cleanup();
						onClose();
					},
				},
			},
		});
	}

	#getContent(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-helper-notification --ui-context-edge-dark">
				<div class="ui-text --xl --accent intranet-helper-notification__title">
					${Loc.getMessage('INTRANET_HELPER_NOTIFICATION_TITLE')}
				</div>
				<div class="ui-text --md intranet-helper-notification__description">
					${Loc.getMessage('INTRANET_HELPER_NOTIFICATION_DESCRIPTION')}
				</div>
				${this.#renderCloseIcon()}
			</div>
		`;
	}

	#renderCloseIcon(): HTMLElement
	{
		const onClick = () => {
			this.#tooltip?.close();
		};

		return Tag.render`
			<div class="intranet-helper-notification__close-icon ui-icon-set --cross-m" onclick="${onClick}"></div>
		`;
	}

	#markAsShown(): void
	{
		BX.userOptions.save(
			'intranet',
			'new_helper_notification_shown',
			null,
			'Y',
		);
	}

	#cleanup(): void
	{
		if (this.#bindElement)
		{
			Event.unbind(this.#bindElement, 'click', this.#bindElementClickHandler);
		}

		this.#tooltip = null;
	}

	handleBindElementClick(): void
	{
		if (this.#tooltip)
		{
			this.#tooltip.close();
		}
	}
}
