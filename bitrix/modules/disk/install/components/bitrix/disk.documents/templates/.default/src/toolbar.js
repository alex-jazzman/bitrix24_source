import { Options as GridOptions } from './options';
import { DocumentHandler } from './types';
import { Type } from 'main.core';

export default class Toolbar
{
	static documentHandlers: DocumentHandler[] = [];

	static reloadGridAndFocus(rowId: ?number)
	{
		const commonGrid = GridOptions.getCommonGrid();
		commonGrid.reload();
	}

	static runCreating(documentType, service, nodeToBind: ?HTMLElement, nodeName, analytics = ''): void
	{
		analytics = JSON.parse(analytics);

		if (BX.message('disk_restriction'))
		{
			// this.blockFeatures();
			return;
		}

		if (service === 'l' && BX.Disk.Document.Local.Instance.isEnabled())
		{
			BX.Disk.Document.Local.Instance.createFile({
				type: documentType,
			}).then((response) => {
				this.reloadGridAndFocus(response.object.id);
			});

			return;
		}

		let targetNode = null;
		if (service === 'onlyoffice' && nodeToBind !== null)
		{
			targetNode = [...nodeToBind.children]
				.find((el) => el.textContent.trim() === nodeName);
		}

		const byUnifiedLink = this.documentHandlers.some((handler) => handler.supportsUnifiedLink
			&& handler.code === service);

		const localAnalytics = {
			...(analytics || {}),
			c_sub_section: 'new_element',
		};

		const createProcess = new BX.Disk.Document.CreateProcess({
			typeFile: documentType,
			serviceCode: service,
			byUnifiedLink,
			triggerNode: targetNode ?? nodeToBind,
			onAfterSave: (response) => {
				if (response.status === 'success')
				{
					this.reloadGridAndFocus(response.object.id);
				}
			},
			onAfterCreateFile: (response) => {
				if (response.status === 'success')
				{
					this.reloadGridAndFocus(response.data.id);
				}
			},
			analytics: localAnalytics,
		});

		createProcess.start();
	}

	static resolveServiceCode(service)
	{
		if (!service)
		{
			service = BX.Disk.getDocumentService();
		}

		if (service)
		{
			return service;
		}

		if (BX.Disk.isAvailableOnlyOffice())
		{
			return 'onlyoffice';
		}

		BX.Disk.InformationPopups.openWindowForSelectDocumentService({});

		return null;
	}

	static createBoard(analyticsElement = null)
	{
		const newTab = window.open('', '_blank');
		const config = {};
		if (analyticsElement)
		{
			config.analytics = {
				event: 'create',
				tool: 'boards',
				category: 'boards',
				c_element: analyticsElement,
			};
		}
		BX.ajax.runAction('disk.integration.flipchart.createDocument', config)
			.then((response) => {
				if (response.status === 'success' && response.data.file)
				{
					const manager = BX.Main.gridManager || BX.Main.tileGridManager;
					const grid = manager.getById('diskDocumentsGrid')?.instance;
					if (grid)
					{
						grid.reload();
					}

					if (response.data.viewUrl)
					{
						newTab.location.href = response.data.viewUrl;
					}
				}
			});
	}

	static createDocx(service, element, nodeName, analytics)
	{
		const code = this.resolveServiceCode(service);
		if (code)
		{
			const nodeToBind = this.resolveNodeToBind(element);
			this.runCreating('docx', code, nodeToBind, nodeName, analytics);
		}
	}

	static createXlsx(service, element, nodeName, analytics)
	{
		const code = this.resolveServiceCode(service);
		if (code)
		{
			const nodeToBind = this.resolveNodeToBind(element);
			this.runCreating('xlsx', code, nodeToBind, nodeName, analytics);
		}
	}

	static createPptx(service, element, nodeName, analytics)
	{
		const code = this.resolveServiceCode(service);
		if (code)
		{
			const nodeToBind = this.resolveNodeToBind(element);
			this.runCreating('pptx', code, nodeToBind, nodeName, analytics);
		}
	}

	static createByDefault(service)
	{
		console.log('createByDefault:', service);
		console.log('try to upload just for the test');
	}

	/**
	 * Returns a DOM element to bind boost widget
	 * @param element
	 * @returns {*|null}
	 */
	static resolveNodeToBind(element): ?HTMLElement
	{
		if (Type.isElementNode(element)) // clicked on card button
		{
			return element.querySelector('.disk-documents-control-panel-card-btn') ?? null;
		}

		if (Type.isElementNode(element?.itemsContainer)) // clicked on menu item
		{
			return element.itemsContainer;
		}

		return null;
	}
}
