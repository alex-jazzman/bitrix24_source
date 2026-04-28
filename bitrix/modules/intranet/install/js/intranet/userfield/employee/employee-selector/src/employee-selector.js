import { Dom, Tag, Text, defer, fireEvent } from 'main.core';
import { TagSelector } from 'ui.entity-selector';

export type EmployeeSelectorOptions = {
	container: HTMLElement,
	fieldName: string,
	isMultiple: boolean,
	preselectedUserIds: number[],
	useIteratorInMultipleFieldHiddenInput: boolean,
}

export class EmployeeSelector
{
	#container: HTMLElement;

	#fieldName: string;
	#isMultiple: boolean;
	#useIteratorInMultipleFieldHiddenInput: boolean;
	#preselectedUserIds: Set<number>;

	#userSelector: TagSelector = null;

	#valueContainer: HTMLElement = null;
	#selectorContainer: HTMLElement = null;

	constructor(options: EmployeeSelectorOptions)
	{
		this.#container = options.container;
		this.#fieldName = Text.encode(options.fieldName);
		this.#isMultiple = options.isMultiple;
		this.#useIteratorInMultipleFieldHiddenInput = options.useIteratorInMultipleFieldHiddenInput ?? false;
		this.#preselectedUserIds = new Set(options.preselectedUserIds || []);

		this.#initialize();
	}

	#initialize(): void
	{
		this.#selectorContainer = Tag.render`<div class="intranet-selector-container"></div>`;
		this.#getUserSelector().renderTo(this.#selectorContainer);
		Dom.append(this.#selectorContainer, this.#container);

		this.#valueContainer = Tag.render`<div class="intranet-values-container"></div>`;
		Dom.append(this.#valueContainer, this.#container);
	}

	#getUserSelector(): TagSelector
	{
		if (this.#userSelector === null)
		{
			const preselectedItems = [];
			this.#preselectedUserIds.forEach((userId: number) => {
				preselectedItems.push(['user', userId]);
			});

			this.#userSelector = new TagSelector({
				multiple: this.#isMultiple,
				dialogOptions: {
					context: `entity_selector_${this.#fieldName}`,
					width: 450,
					height: 300,
					preselectedItems,
					entities: [
						{
							id: 'user',
							options: {
								emailUsers: false,
								intranetUsersOnly: true,
								inviteEmployeeLink: false,
								inviteGuestLink: false,
							},
						}, {
							id: 'structure-node',
							options: {
								selectMode: 'usersOnly',
							},
						},
					],
				},
				events: {
					onAfterTagAdd: (event) => this.#onAfterTagUpdate(event),
					onAfterTagRemove: (event) => this.#onAfterTagUpdate(event),
				},
			});
		}

		return this.#userSelector;
	}

	#onAfterTagUpdate(event): void
	{
		const tags = event.getTarget().tags;
		const ids = tags.map((tag) => tag.id);

		this.#setData(ids);
	}

	#setData(values): void
	{
		this.#valueContainer.innerHTML = '';
		if (values.length > 0)
		{
			if (this.#isMultiple)
			{
				let i = 0;
				for (const value of values)
				{
					const fieldName = this.#useIteratorInMultipleFieldHiddenInput ? `${this.#fieldName}[${i++}]` : `${this.#fieldName}[]`;
					this.#valueContainer.innerHTML += `<input type="hidden" name="${fieldName}" value="${BX.util.htmlspecialchars(value)}">`;
				}
			}
			else
			{
				this.#valueContainer.innerHTML += `<input type="hidden" name="${this.#fieldName}" value="${BX.util.htmlspecialchars(values[0])}">`;
			}
		}

		if (this.#valueContainer.innerHTML.length <= 0)
		{
			this.#valueContainer.innerHTML = `<input type="hidden" name="${this.#fieldName}" value="">`;
		}

		defer(() => {
			fireEvent(this.#valueContainer.firstChild, 'change');
		})();
	}

	destroy(): void
	{
		this.#userSelector.getDialog().destroy();
		this.#userSelector = null;

		this.#container.innerHTML = null;
	}
}
