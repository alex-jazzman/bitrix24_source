import { ajax, Loc, Dom, UI } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Loader } from 'main.loader';
import { Popup } from 'main.popup';
import { ApacheSupersetAnalytics } from 'biconnector.apache-superset-analytics';
import { DashboardManager } from 'biconnector.apache-superset-dashboard-manager';
import { Button } from 'ui.buttons';
import { Switcher, SwitcherColor, SwitcherSize } from 'ui.switcher';
import { TextCrop } from 'ui.textcrop';

import './css/main.css';

type DashboardMasterProps = {
	dashboardId: number,
	openedFrom: string,
}

/**
 * @namespace BX.BIConnector
 */
export class DashboardExportMaster
{
	#dashboardId: number;
	#openedFrom: string;
	#popup: Popup;
	#dashboardData: Object;
	#settingSwitcherState: boolean = true;
	#exportButton: Button;

	constructor(props: DashboardMasterProps)
	{
		this.#dashboardId = props.dashboardId;
		this.#openedFrom = props.openedFrom;
	}

	#loadInfo(dashboardId: number): Promise
	{
		return new Promise((resolve, reject) => {
			ajax.runAction('biconnector.dashboard.getExportData', {
				data: { id: dashboardId },
			})
				.then((response) => {
					EventEmitter.emit('BIConnector.ExportMaster:onDashboardDataLoaded');
					resolve(response);
				})
				.catch((response) => {
					reject(response);
				})
			;
		});
	}

	#createPopup(dashboardData)
	{
		this.#popup = new Popup({
			content: this.#getPopupContent(dashboardData),
			closeIcon: true,
			closeByEsc: true,
			cacheable: false,
			overlay: true,
			width: 360,
			height: 500,
			padding: 0,
		});
		this.#popup.show();

		const dashboardTitle = new TextCrop({
			rows: 1,
			resize: true,
			target: document.querySelector('.bic-export-dashboard-title'),
		});
		dashboardTitle.init();

		this.#exportButton = new Button({
			text: Loc.getMessage('BIC_EXPORT_BUTTON'),
			size: Button.Size.SMALL,
			round: true,
			color: Button.Color.PRIMARY,
			className: 'bic-export-button',
			onclick: () => this.#exportDashboard(this.#dashboardId, this.#settingSwitcherState),
		});
		this.#exportButton.renderTo(this.#popup.getContentContainer().querySelector('.bic-export-footer'));

		new Switcher({
			node: this.#popup.getContentContainer().querySelector('#bic-setting-switcher'),
			checked: true,
			color: SwitcherColor.primary,
			size: SwitcherSize.small,
			handlers: {
				toggled: this.#handleSwitcherToggled.bind(this),
			},
		});

		const settingsLink = this.#popup.getContentContainer().querySelector('.bic-settings-link');
		settingsLink.onclick = this.#openSettingsSlider.bind(this, this.#dashboardId);
	}

	#getPopupContent(dashboardData): string
	{
		const scope = dashboardData.scope === '' ? Loc.getMessage('BIC_EXPORT_SCOPE_NONE') : dashboardData.scope;

		return `
			<div class="bic-export-container">
				<div class="bic-export-header">
					<div class="bic-export-subtitle">${Loc.getMessage('BIC_EXPORT_SUBTITLE')}</div>
					<div class="bic-export-dashboard-title">${dashboardData.title}</div>
				</div>
				<div class="bic-export-separator"></div>
				<div class="bic-export-body">
					<div class="bic-setting-item bic-setting-item-export-with-settings">
						<div class="bic-setting-title">${Loc.getMessage('BIC_EXPORT_EXPORT_WITH_SETTINGS')}</div>
						<div class="bic-setting-value" id="bic-setting-switcher"></div>
					</div>

					<div class="bic-export-hint">${Loc.getMessage('BIC_EXPORT_HINT')}</div>
					<div class="bic-export-hint disabled">${Loc.getMessage('BIC_EXPORT_HINT_WITH_NO_SETTINGS')}</div>

					<div class="bic-setting-item bic-setting-item-period">
						<div class="bic-setting-title">${Loc.getMessage('BIC_EXPORT_PERIOD')}</div>
						<div class="bic-setting-value">${dashboardData.period}</div>
					</div>

					<div class="bic-setting-item bic-setting-item-scope">
						<div class="bic-setting-title">${Loc.getMessage('BIC_EXPORT_SCOPE')}</div>
						<div class="bic-setting-value">${scope}</div>
					</div>

					<div class="bic-setting-item">
						<span class="bic-settings-link">${Loc.getMessage('BIC_EXPORT_OPEN_SETTINGS')}</span>
					</div>
				</div>
				<div class="bic-export-separator"></div>
				<div class="bic-export-footer"></div>
			</div>
		`;
	}

	showPopup(): Promise
	{
		return new Promise((resolve, reject) => {
			this.#loadInfo(this.#dashboardId)
				.then((response) => {
					this.#dashboardData = response.data;
					this.#createPopup(response.data);
					resolve(response);
				})
				.catch((response) => {
					UI.Notification.Center.notify({
						content: Loc.getMessage('BIC_EXPORT_ERROR'),
					});
					reject(response);
				})
			;
		});
	}

	#handleSwitcherToggled()
	{
		const nodes = this.#popup.getContentContainer().querySelectorAll('.bic-setting-item-period,.bic-setting-item-scope,.bic-export-hint,.bic-settings-link');
		for (const node of nodes)
		{
			Dom.toggleClass(node, 'disabled');
		}
		this.#settingSwitcherState = !this.#settingSwitcherState;
	}

	#exportDashboard(dashboardId: number, withSettings: boolean): Promise
	{
		this.#exportButton.setState(Button.State.WAITING);

		return ajax.runAction('biconnector.dashboard.export', {
			data: {
				id: dashboardId,
				withSettings: withSettings ? 1 : 0,
			},
		})
			.then((response) => {
				const filePath = response.data.filePath;
				if (filePath)
				{
					window.open(filePath, '_self');
				}
				this.#popup.close();

				ApacheSupersetAnalytics.sendAnalytics('edit', 'report_export', {
					type: this.#dashboardData.type.toLowerCase(),
					p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#dashboardData.appId),
					p2: dashboardId,
					status: 'success',
					c_element: this.#openedFrom,
				});
			})
			.catch(() => {
				UI.Notification.Center.notify({
					content: Loc.getMessage('BIC_EXPORT_ERROR'),
				});
				this.#exportButton.setState(Button.State.ACTIVE);

				ApacheSupersetAnalytics.sendAnalytics('edit', 'report_export', {
					type: this.#dashboardData.type.toLowerCase(),
					p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#dashboardData.appId),
					p2: dashboardId,
					status: 'error',
					c_element: this.#openedFrom,
				});
			})
		;
	}

	#openSettingsSlider(dashboardId: number): void
	{
		EventEmitter.subscribe('BX.BIConnector.Settings:onAfterSave', this.#onSettingsChanged.bind(this));
		DashboardManager.openSettingsSlider(dashboardId);
	}

	#onSettingsChanged(): void
	{
		EventEmitter.unsubscribe('BX.BIConnector.Settings:onAfterSave', this.#onSettingsChanged.bind(this));

		const loader = new Loader({
			target: this.#popup.getContentContainer(),
		});
		loader.show();
		this.#loadInfo(this.#dashboardId)
			.then((response) => {
				this.#dashboardData = response.data;
				this.#popup.close();
				this.#createPopup(response.data);
			})
			.catch(() => {
				UI.Notification.Center.notify({
					content: Loc.getMessage('BIC_EXPORT_ERROR'),
				});
			})
		;
	}
}
