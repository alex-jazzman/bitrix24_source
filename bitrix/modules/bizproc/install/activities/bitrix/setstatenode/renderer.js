/* eslint-disable */
(function (exports, main_core, main_core_events) {
	'use strict';

	class SetStateNodeRenderer {
		#selector = null;
		#value = null;
		getControlRenderers() {
			return {
				stateSelector: field => {
					this.#selector = main_core.Tag.render`
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
				}
			};
		}
		async afterFormRender(form) {
			main_core_events.EventEmitter.subscribeOnce('BX.Bizproc.CommonNodeSettings:onBlocksReady', event => {
				if (!main_core.Type.isDomNode(this.#selector)) {
					return;
				}
				const {
					blocks
				} = event.getData();
				const states = (blocks || []).filter(block => block.activity?.Type === 'StateNode');
				states.forEach(state => {
					const value = state.activity.Name;
					const title = state.activity.Properties.Title;
					const selected = value === this.#value ? 'selected' : '';
					const optNode = main_core.Tag.render`<option value="${main_core.Text.encode(value)}" ${selected}>${main_core.Text.encode(title)}</option>`;
					main_core.Dom.append(optNode, this.#selector);
				});
			});
		}
	}

	exports.SetStateNodeRenderer = SetStateNodeRenderer;

})(this.window = this.window || {}, BX, BX.Event);
//# sourceMappingURL=renderer.js.map
