import { Loc, Type, Uri } from 'main.core';

export class BatchMergeManager
{
	constructor()
	{
		this._id = "";
		this._settings = {};

		this._grid = null;
		this._kanban = null;
		this._entityTypeId = BX.CrmEntityType.enumeration.undefined;
		this._entityIds = null;

		this._errors = null;
		this._isRunning = false;

		this._documentUnloadHandler = BX.delegate(this.onDocumentUnload, this);
		this._requestCompleteHandler = BX.delegate(this.onRequestComplete, this);
		this._externalEventHandler = null;
	}

	initialize(id, settings)
	{
		this._id = Type.isStringFilled(id) ? id : "crm_batch_merge_mgr_" + Math.random().toString().substring(2);
		this._settings = settings ? settings : {};

		const gridId = BX.prop.getString(this._settings, "gridId", null);
		if (gridId && BX.Main.gridManager)
		{
			this._grid = BX.Main.gridManager.getInstanceById(gridId);
		}
		this._kanban = BX.prop.get(this._settings, "kanban", null);

		this._entityTypeId = BX.prop.getInteger(
			this._settings,
			"entityTypeId",
			BX.CrmEntityType.enumeration.undefined
		);
		this._errors = [];
	}
	getId()
	{
		return this._id;
	}
	getMessage (name)
	{
		const entityTypeName = BX.CrmEntityType.resolveName(this._entityTypeId).toUpperCase();
		return BX.prop.getString(
			BX.prop.getObject(this._settings, "messages", BX.Crm.BatchMergeManager.messages),
			name,
			Loc.getMessage('CRM_BATCH_MERGER_MANAGER_' + entityTypeName + '_' + name.toUpperCase())
			// CRM_BATCH_MERGER_MANAGER_LEAD_TITLE
			// CRM_BATCH_MERGER_MANAGER_LEAD_CONFIRMATION
			// CRM_BATCH_MERGER_MANAGER_LEAD_SUMMARYCAPTION
			// CRM_BATCH_MERGER_MANAGER_LEAD_SUMMARYSUCCEEDED
			// CRM_BATCH_MERGER_MANAGER_LEAD_SUMMARYFAILED
			// CRM_BATCH_MERGER_MANAGER_DEAL_TITLE
			// CRM_BATCH_MERGER_MANAGER_DEAL_CONFIRMATION
			// CRM_BATCH_MERGER_MANAGER_DEAL_SUMMARYCAPTION
			// CRM_BATCH_MERGER_MANAGER_DEAL_SUMMARYSUCCEEDED
			// CRM_BATCH_MERGER_MANAGER_DEAL_SUMMARYFAILED
			// CRM_BATCH_MERGER_MANAGER_CONTACT_TITLE
			// CRM_BATCH_MERGER_MANAGER_CONTACT_CONFIRMATION
			// CRM_BATCH_MERGER_MANAGER_CONTACT_SUMMARYCAPTION
			// CRM_BATCH_MERGER_MANAGER_CONTACT_SUMMARYSUCCEEDED
			// CRM_BATCH_MERGER_MANAGER_CONTACT_SUMMARYFAILED
			// CRM_BATCH_MERGER_MANAGER_COMPANY_TITLE
			// CRM_BATCH_MERGER_MANAGER_COMPANY_CONFIRMATION
			// CRM_BATCH_MERGER_MANAGER_COMPANY_SUMMARYCAPTION
			// CRM_BATCH_MERGER_MANAGER_COMPANY_SUMMARYSUCCEEDED
			// CRM_BATCH_MERGER_MANAGER_COMPANY_SUMMARYFAILED
		);
	}
	getEntityIds()
	{
		return this._entityIds;
	}
	setEntityIds(entityIds)
	{
		this._entityIds = Type.isArray(entityIds) ? entityIds : [];
	}
	resetEntityIds()
	{
		this._entityIds = [];
	}
	getErrors()
	{
		return this._errors ? this._errors : [];
	}
	execute()
	{
		let dialogId = this._id.toLowerCase();
		let dialog = BX.Crm.ConfirmationDialog.get(dialogId);
		if(!dialog)
		{
			dialog = BX.Crm.ConfirmationDialog.create(
				dialogId,
				{
					title: this.getMessage("title"),
					content: this.getMessage("confirmation")
				}
			);
		}

		if(!dialog.isOpened())
		{
			dialog.open().then(
				function(result)
				{
					if(!BX.prop.getBoolean(result, "cancel", true))
					{
						this.startRequest();
					}
				}.bind(this)
			);
		}
	}
	isRunning()
	{
		return this._isRunning;
	}
	startRequest()
	{
		if(this._isRunning)
		{
			return;
		}
		this._isRunning = true;

		this.disableItemsList();
		BX.bind(window, "beforeunload", this._documentUnloadHandler);

		let params =
			{
				entityTypeId: this._entityTypeId,
				extras: BX.prop.getObject(this._settings, "extras", {})
			};

		if(Type.isArray(this._entityIds) && this._entityIds.length > 0)
		{
			params["entityIds"] = this._entityIds;
		}

		BX.ajax.runAction(
			"crm.api.entity.mergeBatch",
			{ data: { params:  params } }
		).then(
			this._requestCompleteHandler
		).catch(
			this._requestCompleteHandler
		);
	}
	disableItemsList()
	{
		if (this._grid)
		{
			this._grid.tableFade();
		}
		if (this._kanban)
		{
			this._kanban.fadeOut();
		}
	}
	enableItemsList()
	{
		if (this._grid)
		{
			this._grid.tableUnfade();
		}
		if (this._kanban)
		{
			this._kanban.fadeIn();
		}
	}
	reloadItemsList()
	{
		if (this._grid)
		{
			this._grid.reload();
		}
		if (this._kanban)
		{
			this._kanban.reload();
		}
	}
	onRequestComplete(response)
	{
		this.enableItemsList();
		BX.unbind(window, "beforeunload", this._documentUnloadHandler);
		this._isRunning = false;
		this._errors = [];

		let status = BX.prop.getString(response, "status", "");
		let data = BX.prop.getObject(response, "data", {});

		if(status === "error")
		{
			if(BX.prop.getString(data, "STATUS", "") === "CONFLICT")
			{
				this.openMerger();
				return;
			}

			let errorInfos = BX.prop.getArray(response, "errors", []);
			for(let i = 0, length = errorInfos.length; i < length; i++)
			{
				this._errors.push(BX.prop.getString(errorInfos[i], "message"));
			}
		}

		this.displaySummary();
		if(this._errors.length === 0)
		{
			window.setTimeout(
				this.complete.bind(this),
				0
			);
		}
	}
	displaySummary()
	{
		let messages = [this.getMessage("summaryCaption")];
		if(this._errors.length > 0)
		{
			messages.push(
				this.getMessage("summaryFailed").replace(/#number#/gi, this._entityIds.length)
			);
			messages = messages.concat(this._errors);
		}
		else
		{
			messages.push(
				this.getMessage("summarySucceeded").replace(/#number#/gi, this._entityIds.length)
			);
		}

		BX.UI.Notification.Center.notify(
			{
				content: messages.join("<br/>"),
				position: "top-center",
				autoHideDelay: 5000
			}
		);
	}
	openMerger()
	{
		this._contextId = this._id + "_" + BX.util.getRandomString(6).toUpperCase();

		BX.Crm.Page.open(this.#getMergerUrl());

		if(!this._externalEventHandler)
		{
			this._externalEventHandler = BX.delegate(this.onExternalEvent, this);
			BX.addCustomEvent(window, "onLocalStorageSet", this._externalEventHandler);
		}
	}

	#getMergerUrl(): string
	{
		const mergerBaseUrl = BX.prop.getString(this._settings, 'mergerUrl', this.#getDefaultMergerUrl());

		const uri = new Uri(mergerBaseUrl);
		uri.setQueryParams({
			externalContextId: this._contextId,
			id: this._entityIds,
		});

		return uri.toString();
	}

	#getDefaultMergerUrl(): string
	{
		const lowerEntityTypeName = BX.CrmEntityType.resolveName(this._entityTypeId).toLowerCase();

		return `/crm/${lowerEntityTypeName}/merge/`;
	}

	complete()
	{
		BX.onCustomEvent(
			window,
			"BX.Crm.BatchMergeManager:onComplete",
			[ this ]
		);

		this.reloadItemsList();
	}
	onDocumentUnload(e)
	{
		return(e.returnValue = this.getMessage("windowCloseConfirm"));
	}
	onExternalEvent(params)
	{
		let eventName = BX.prop.getString(params, "key", "");

		if(eventName !== "onCrmEntityMergeComplete")
		{
			return;
		}

		let value = BX.prop.getObject(params, "value", {});

		if(this._contextId !== BX.prop.getString(value, "context", ""))
		{
			return;
		}

		BX.removeCustomEvent(window, "onLocalStorageSet", this._externalEventHandler);
		this._externalEventHandler = null;

		this.displaySummary();
		window.setTimeout(
			this.complete.bind(this),
			0
		);
	}

	static getItem(id)
	{
		return BX.prop.get(this.items, id, null);
	}

	static create(id, settings)
	{
		let self = new BatchMergeManager();
		self.initialize(id, settings);
		this.items[self.getId()] = self;
		return self;
	}
}

BatchMergeManager.messages = {};
BatchMergeManager.items = {};
