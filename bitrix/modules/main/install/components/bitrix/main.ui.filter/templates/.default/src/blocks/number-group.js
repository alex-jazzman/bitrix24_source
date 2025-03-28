;(function() {
	'use strict';

	BX.namespace('BX.Main.ui.block');

	BX.Main.ui.block['number-group'] = function(data)
	{
		var group, select, deleteButton, label, dragButton;

		group = {
			block: 'main-ui-control-field-group',
			name: 'name' in data ? (data.name + '_numsel') : '',
			mix: 'mix' in data ? data.mix : null,
			attrs: {
				'data-type': 'type' in data ? data.type : '',
				'data-name': 'name' in data ? data.name : ''
			},
			content: []
		};

		if ('label' in data && BX.type.isNotEmptyString(data.label))
		{
			let labelContent = data.label;

			if ('icon' in data && BX.Type.isPlainObject(data.icon))
			{
				labelContent = [
					{
						block: 'main-ui-control-field-label-icon',
						tag: 'img',
						attrs: {
							title: data.icon.title ? data.icon.title : '',
							src: data.icon.url
						}
					},
					{
						block: 'main-ui-control-field-label-text',
						tag: 'span',
						content: labelContent
					}
				];
			}

			label = {
				block: 'main-ui-control-field-label',
				tag: 'span',
				attrs: {title: data.label},
				content: labelContent
			};

			group.content.push(label);
		}

		select = {
			block: 'main-ui-control-field',
			dragButton: false,
			content: {
				block: 'main-ui-select',
				tabindex: 'tabindex' in data ? data.tabindex : '',
				value: 'value' in data ? data.value : '',
				items: 'items' in data ? data.items : '',
				name: 'name' in data ? (data.name + '_numsel') : '',
				params: 'params' in data ? data.params : '',
				valueDelete: false
			}
		};

		group.content.push(select);

		if ('content' in data && BX.type.isArray(data.content))
		{
			data.content.forEach(function(current) {
				group.content.push(current);
			});
		}

		if ('content' in data &&
			(BX.type.isPlainObject(data.content) || BX.type.isNotEmptyString(data.content)))
		{
			group.content.push(data.content);
		}

		deleteButton = {
			block: 'main-ui-item-icon-container',
			content: {
				block: 'main-ui-item-icon',
				mix: ['main-ui-delete', 'main-ui-filter-field-delete'],
				tag: 'span',
				attrs: {
					title: 'deleteTitle' in data && data.deleteTitle ? data.deleteTitle : ''
				}
			}
		};

		group.content.push(deleteButton);

		if (!('dragButton' in data) || data.dragButton !== false)
		{
			dragButton = {
				block: 'main-ui-filter-icon-grab',
				mix: ['main-ui-item-icon'],
				tag: 'span',
				attrs: {
					title: 'dragTitle' in data && data.dragTitle ? data.dragTitle : ''
				}
			};

			group.content.push(dragButton);
		}

		return group;
	};
})();