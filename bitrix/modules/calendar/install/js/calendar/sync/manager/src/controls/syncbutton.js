import { Dom, Loc, Tag } from 'main.core';
import { Popup } from 'main.popup';
import { Button, ButtonSize, ButtonIcon, ButtonColor } from 'ui.buttons';
import SyncStatusPopupV2 from './syncstatuspopup-v2';

export default class SyncButton
{
	constructor(options)
	{
		this.connectionsProviders = options.connectionsProviders;
		this.wrapper = options.wrapper;
		this.userId = options.userId;
		this.status = options.status;
		this.isGoogleApplicationRefused = options.isGoogleApplicationRefused;
		this.counters = options.counters;
		this.payAttentionToNewSharingFeature = options.payAttentionToNewSharingFeature;

		this.buttonEnterTimeout = null;
	}

	static createInstance(options): SyncButton
	{
		return new this(options);
	}

	show()
	{
		const buttonData = this.getButtonData();

		this.button = new Button({
			round: true,
			text: buttonData.text,
			size: ButtonSize.EXTRA_SMALL,
			color: buttonData.color,
			counter: buttonData.counter ?? 0,
			leftCounter: buttonData.counter ? { value: buttonData.counter ?? 0 } : '',
			icon: buttonData.icon || '',
			className: `ui-btn-themes ${buttonData.iconClass || ''}`,
			onclick: this.handleClick,
			dataset: {
				id: 'calendar_sync_button',
			},
		});

		this.button.renderTo(this.wrapper);

		if (!this.payAttentionToNewSharingFeature)
		{
			this.showAhaMoment(this.button);
		}
	}

	showAhaMoment(button)
	{
		setTimeout(() => {
			SyncStatusPopupV2.createInstance({
				status: this.status,
				syncErrors: this.counters.sync_errors ?? 0,
				connectionsProviders: this.connectionsProviders,
				node: button.getContainer(),
				id: 'calendar-sync-v2__dialog',
				onSyncPanelOpen: this.handleClick,
			});
		}, 1000);
	}

	showGoogleApplicationRefusedPopup()
	{
		const popup = new Popup({
			bindElement: this.button.getContainer(),
			borderRadius: '3px',
			className: 'calendar-popup-ui-tour-animate',
			content: Tag.render`
				<div class="calendar-sync-popup-status-refused">
					<div class="calendar-sync-popup-status-refused-title">
						${Loc.getMessage('CAL_SYNC_INFO_STATUS_REFUSED_POPUP_TITLE')}
					</div>
					<div class="calendar-sync-popup-status-refused-text">
						${Loc.getMessage('CAL_SYNC_INFO_STATUS_REFUSED_POPUP_TEXT')}
					</div>
				</div>
			`,
			width: 400,
			angle: {
				offset: this.button.getContainer().offsetWidth / 2,
				position: 'top',
			},
			closeIcon: true,
			autoHide: true,
		});

		setTimeout(() => {
			popup.show();
			BX.ajax.runAction('calendar.api.syncajax.disableShowGoogleApplicationRefused');
		}, 1000);
	}

	refresh(status, counters = null)
	{
		this.status = status;
		this.counters = counters ?? this.counters;

		const buttonData = this.getButtonData();
		this.button.setColor(buttonData.color);
		this.button.setText(buttonData.text);
		this.button.removeClass('ui-btn-icon-fail ui-btn-icon-success ui-btn-clock calendar-sync-btn-icon-refused calendar-sync-btn-counter');
		this.button.addClass(buttonData.iconClass);
		this.button.setCounter(buttonData.counter ?? 0);
	}

	handleClick = () => {
		clearTimeout(this.buttonEnterTimeout);
		// eslint-disable-next-line promise/catch-or-return
		(window.top.BX || window.BX).Runtime.loadExtension('calendar.sync.interface').then((exports) => {
			if (!Dom.hasClass(this.button.button, 'ui-btn-clock'))
			{
				this.syncPanel = new exports.SyncPanel({
					connectionsProviders: this.connectionsProviders,
					userId: this.userId,
					status: this.status,
				});
				this.syncPanel.openSlider();
			}
		});
	};

	getButtonData(): Object
	{
		if (this.status === 'refused')
		{
			return {
				text: Loc.getMessage('CAL_BUTTON_STATUS_FAILED_RECONNECT'),
				color: ButtonColor.LIGHT_BORDER,
				icon: ButtonIcon.REFRESH,
				iconClass: 'calendar-sync-btn-icon-refused',
			};
		}

		switch (this.status)
		{
			case 'success': {
				return {
					text: Loc.getMessage('STATUS_BUTTON_SYNCHRONIZATION'),
					color: ButtonColor.LIGHT_BORDER,
					icon: ButtonIcon.CHECK,
					iconClass: 'ui-btn-icon-success',
				};
			}

			case 'failed': {
				return {
					text: Loc.getMessage('STATUS_BUTTON_FAILED'),
					color: ButtonColor.LIGHT_BORDER,
					counter: this.counters.sync_errors || 1,
					iconClass: 'calendar-sync-btn-counter',
				};
			}

			case 'synchronizing': {
				return {
					text: Loc.getMessage('STATUS_BUTTON_SYNCHRONIZATION'),
					color: ButtonColor.LIGHT_BORDER,
					iconClass: 'ui-btn-clock',
				};
			}

			default: {
				return {
					text: Loc.getMessage('STATUS_BUTTON_SYNC_CALENDAR_NEW'),
					color: ButtonColor.PRIMARY,
				};
			}
		}
	}

	getSyncPanel()
	{
		return this.syncPanel;
	}

	setConnectionProviders(connectionsProviders): void
	{
		this.connectionsProviders = connectionsProviders;
	}
}
