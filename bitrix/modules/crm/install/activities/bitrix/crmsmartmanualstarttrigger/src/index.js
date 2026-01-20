import { Tag, Dom, Event, Type } from 'main.core';

export class CrmSmartManualStartTriggerRenderer
{
	getControlRenderers(): Promise
	{
		return {
			// eslint-disable-next-line sonarjs/cognitive-complexity
			'crm-smart-category-select': (field) => {
				const categoriesBySmart = Type.isPlainObject(field?.property?.Settings?.categoriesBySmartType)
					? field.property.Settings.categoriesBySmartType
					: {};

				const select = Tag.render`
					<select class="ui-ctl-element" id="id_${field.controlId}" name="${field.fieldName}"></select>
				`;

				const wrapper = Tag.render`
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
							${select}
					</div>
				`;

				const smartField = 'id_smartTypeId';
				let isBound = false;

				const fillOptions = () => {
					const smartValue = document.getElementById(smartField)?.value || '';
					const optionsMap = Type.isPlainObject(categoriesBySmart[smartValue]) ? categoriesBySmart[smartValue] : {};

					const prev = select.value;
					Dom.clean(select);

					const keys = Object.keys(optionsMap);
					keys.forEach((id) => {
						const opt = Tag.render`<option value="${id}">${optionsMap[id]}</option>`;
						// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
						select.appendChild(opt);
					});

					let chosen = '';
					if (prev && optionsMap[prev])
					{
						chosen = prev;
					}
					else if (field?.value && optionsMap[field.value])
					{
						chosen = field.value;
					}
					else if (keys.length > 0)
					{
						chosen = keys[0];
					}

					select.value = chosen;

					if (keys.length > 0)
					{
						select.removeAttribute('disabled');
					}
					else
					{
						select.setAttribute('disabled', 'disabled');
					}

					if (chosen && chosen !== prev)
					{
						Event.fire(select, 'change');
					}
				};

				const tryBind = () => {
					const smartSelect = document.getElementById(smartField);
					if (!smartSelect || isBound)
					{
						return isBound;
					}
					Event.bind(smartSelect, 'change', fillOptions);
					fillOptions();
					isBound = true;
					return true;
				};

				if (!tryBind())
				{
					const onReady = () => {
						if (tryBind())
						{
							Event.unbind(document, 'DOMContentLoaded', onReady);
						}
					};

					if (document.readyState === 'loading')
					{
						Event.bind(document, 'DOMContentLoaded', onReady);
					}

					const observer = new MutationObserver(() => {
						if (tryBind())
						{
							observer.disconnect();
						}
					});
					observer.observe(document.documentElement, { childList: true, subtree: true });
				}

				return wrapper;
			},
		};
	}
}
