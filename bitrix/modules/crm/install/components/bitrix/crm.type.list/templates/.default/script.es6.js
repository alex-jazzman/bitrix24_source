import { Router } from 'crm.router';
import { ajax as Ajax, Dom, Loc, Reflection, Text, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

const namespace = Reflection.namespace('BX.Crm');

class TypeListComponent
{
	gridId: string;
	grid: BX.Main.grid;
	errorTextContainer: Element;
	welcomeMessageContainer: Element;

	constructor(params): void
	{
		if (Type.isPlainObject(params))
		{
			if (Type.isString(params.gridId))
			{
				this.gridId = params.gridId;
			}

			if (this.gridId && BX.Main.grid && BX.Main.gridManager)
			{
				this.grid = BX.Main.gridManager.getInstanceById(this.gridId);
			}

			if (Type.isElementNode(params.errorTextContainer))
			{
				this.errorTextContainer = params.errorTextContainer;
			}

			if (Type.isElementNode(params.welcomeMessageContainer))
			{
				this.welcomeMessageContainer = params.welcomeMessageContainer;
			}
		}
	}

	init(): void
	{
		this.bindEvents();
	}

	bindEvents(): void
	{
		EventEmitter.subscribe('BX.Crm.TypeListComponent:onClickCreate', this.handleTypeCreate.bind(this));
		EventEmitter.subscribe('BX.Crm.TypeListComponent:onClickDelete', this.handleTypeDelete.bind(this));
		EventEmitter.subscribe('BX.Crm.TypeListComponent:onFilterByAutomatedSolution', this.handleFilterByAutomatedSolution.bind(this));
		EventEmitter.subscribe('BX.Crm.TypeListComponent:onResetFilterByAutomatedSolution', this.handleFilterByAutomatedSolution.bind(this));

		const toolbarComponent = this.getToolbarComponent();

		if (toolbarComponent)
		{
			/** @see BX.Crm.ToolbarComponent.subscribeTypeUpdatedEvent */
			toolbarComponent.subscribeTypeUpdatedEvent((event: BaseEvent) => {
				const isUrlChanged = Type.isObject(event.getData()) && (event.getData().isUrlChanged === true);
				if (isUrlChanged)
				{
					window.location.reload();

					return;
				}

				if (this.gridId && Reflection.getClass('BX.Main.gridManager.reload'))
				{
					Dom.removeClass(document.getElementById('crm-type-list-container'), 'crm-type-list-grid-empty');
					BX.Main.gridManager.reload(this.gridId);
				}
			});
		}
	}

	showErrors(errors: []): void
	{
		let text = '';
		errors.forEach((message) => {
			text = `${text + message} `;
		});

		if (Type.isElementNode(this.errorTextContainer))
		{
			this.errorTextContainer.innerText = text;
			Dom.style(this.errorTextContainer.parentElement, { display: 'block' });
		}
		else
		{
			console.error(text);
		}
	}

	hideErrors(): void
	{
		if (Type.isElementNode(this.errorTextContainer))
		{
			this.errorTextContainer.innerText = '';
			Dom.style(this.errorTextContainer.parentElement, { display: 'none' });
		}
	}

	showErrorsFromResponse({ errors }): void
	{
		const messages = [];
		errors.forEach(({ message }) => messages.push(message));
		this.showErrors(messages);
	}

	// region EventHandlers
	handleTypeCreate(event: BaseEvent<Object>): void
	{
		let { queryParams } = event.getData();

		if (!Type.isPlainObject(queryParams))
		{
			queryParams = {};
		}

		const automatedSolutionId = this.#getAutomatedSolutionIdFromFilter();
		if (automatedSolutionId > 0)
		{
			queryParams.automatedSolutionId = automatedSolutionId;
		}

		void Router.Instance.openTypeDetail(0, null, queryParams);
	}

	#getAutomatedSolutionIdFromFilter(): ?number
	{
		const { AUTOMATED_SOLUTION: automatedSolutionId } = this.#getCurrentFilter();

		if (Text.toInteger(automatedSolutionId) > 0)
		{
			return Text.toInteger(automatedSolutionId);
		}

		return null;
	}

	handleTypeDelete(event: BaseEvent): void
	{
		const id = Text.toInteger(event.data.id);

		if (!id)
		{
			this.showErrors([Loc.getMessage('CRM_TYPE_TYPE_NOT_FOUND')]);

			return;
		}

		MessageBox.show({
			title: Loc.getMessage('CRM_TYPE_TYPE_DELETE_CONFIRMATION_TITLE'),
			message: Loc.getMessage('CRM_TYPE_TYPE_DELETE_CONFIRMATION_MESSAGE'),
			modal: true,
			buttons: MessageBoxButtons.YES_CANCEL,
			onYes: (messageBox) => {
				Ajax.runAction('crm.controller.type.delete', {
					analyticsLabel: 'crmTypeListDeleteType',
					data:
							{
								id,
							},
				}).then((response: {data: {}}) => {
					const isUrlChanged = Type.isObject(response.data) && (response.data.isUrlChanged === true);
					if (isUrlChanged)
					{
						window.location.reload();

						return;
					}

					this.grid.reloadTable();
				}).catch(this.showErrorsFromResponse.bind(this));

				messageBox.close();
			},
		});
	}
	// endregion

	getToolbarComponent(): ?BX.Crm.ToolbarComponent
	{
		if (Reflection.getClass('BX.Crm.ToolbarComponent'))
		{
			return BX.Crm.ToolbarComponent.Instance;
		}

		return null;
	}

	handleFilterByAutomatedSolution(event: BaseEvent): void
	{
		const data = {
			...this.#getCurrentFilter(),
			AUTOMATED_SOLUTION: event.data || null,
		};

		const api = BX.Main.filterManager?.getList()[0]?.getApi();
		if (!api)
		{
			return;
		}
		api.setFields(data);
		api.apply();
	}

	#getCurrentFilter(): Object
	{
		return BX.Main.filterManager?.getList()[0]?.getFilterFieldsValues() || {};
	}
}

namespace.TypeListComponent = TypeListComponent;
