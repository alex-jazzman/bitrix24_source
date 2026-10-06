import { Tag, Dom, Type, Text } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';

export class SetStateNodeRenderer
{
	#selector: ?HTMLSelectElement = null;
	#value: ?string = null;

	getControlRenderers()
	{
		return {
			stateSelector: (field: {}) => {
				this.#selector = Tag.render`
					<select
						class="custom-input"
						id="${field.controlId}"
						name="${field.fieldName}"
					>
						<option>-</option>
					</select>
				`;

				this.#value = field.value;

				return this.#selector;
			},
		};
	}

	async afterFormRender(form: HTMLFormElement): void
	{
		EventEmitter.subscribeOnce('BX.Bizproc.CommonNodeSettings:onBlocksReady', (event: BaseEvent) => {
			if (!Type.isDomNode(this.#selector))
			{
				return;
			}

			const { blocks } = event.getData();
			const states = (blocks || []).filter(
				(block) => block.activity?.Type === 'StateNode',
			);

			states.forEach((state) => {
				const value = state.activity.Name;
				const title = state.activity.Properties.Title;
				const selected = value === this.#value ? 'selected' : '';
				const optNode = Tag.render`<option value="${Text.encode(value)}" ${selected}>${Text.encode(title)}</option>`;
				Dom.append(optNode, this.#selector);
			});
		});
	}
}
