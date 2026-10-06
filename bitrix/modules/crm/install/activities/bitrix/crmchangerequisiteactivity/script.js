;(function()
{
	"use strict";

	BX.namespace('BX.Crm.Activity');
	var testIdPrefix = 'crm-change-requisite-activity';

	if(typeof BX.Crm.Activity.CrmChangeRequisiteActivity !== "undefined")
	{
		return;
	}

	BX.Crm.Activity.CrmChangeRequisiteActivity = {
		init: function(params)
		{
			return new ChangeRequisiteForm(params);
		}
	};

	function ChangeRequisiteForm(params)
	{
		this.requisiteFieldsNode = BX(params.requisiteFieldsNodeId);

		this.bankDetailFieldsMap = params.bankDetailFieldsMap || {};
		this.addressFieldsMap = params.addressFieldsMap || {};
		this.fieldsMap = Object.assign(
			{},
			params.requisiteFieldsMap,
			this.bankDetailFieldsMap,
			this.addressFieldsMap
		);

		this.currentValues = params.currentValues || {};
		this.messages = params.messages;
		this.documentType = params.documentType;
		this.isRobot = params.isRobot === true;
		this.popupMenuCounter = 0;

		this.selectPresetNode = this.findNodeInOwnDialog(params.selectPresetNodeId);
		this.selectPresetNode.setAttribute('data-testid', testIdPrefix + '-preset-select');
		this.presetFieldNames = Object.assign({}, params.presetFieldNames);
		this.presetFieldNames['0'] = this.getObjectKeys(this.fieldsMap);

		this.addCurrentValueConditions();

		if(this.isRobot)
		{
			this.initRBPEvents();
		}
		else
		{
			this.initBPEvents(params);
			this.onSelectPresetNodeChange(true);
		}
	}

	// Several settings forms may share element ids, so the nearest match up the tree is ours.
	ChangeRequisiteForm.prototype.findNodeInOwnDialog = function(nodeId)
	{
		var selector = '[id="' + nodeId + '"]';
		for(var scope = this.requisiteFieldsNode; scope; scope = scope.parentNode)
		{
			var node = scope.querySelector ? scope.querySelector(selector) : null;
			if(node)
			{
				return node;
			}
		}

		return null;
	}

	ChangeRequisiteForm.prototype.addCurrentValueConditions = function()
	{
		var fieldIds = this.getObjectKeys(this.currentValues);
		if(fieldIds.length <= 0)
		{
			this.addCondition();
			return;
		}

		for(var i = 0; i < fieldIds.length; i++)
		{
			if(!this.fieldsMap.hasOwnProperty(fieldIds[i]))
			{
				continue;
			}

			this.addCondition(fieldIds[i], true);
		}
	}

	ChangeRequisiteForm.prototype.addCondition = function(fieldId, preserveSelectedField)
	{
		if(this.isRobot)
		{
			this.addRBPCondition(fieldId);
		}
		else
		{
			this.addBPCondition(fieldId, preserveSelectedField);
		}
	}

	ChangeRequisiteForm.prototype.initRBPEvents = function()
	{
		this.fieldsListSelectNode = this.requisiteFieldsNode.querySelector('[data-role="bca-ccra-fields-list"]');

		BX.bind(this.fieldsListSelectNode, 'click', BX.proxy(this.onFieldsListSelectClick, this));
	}

	ChangeRequisiteForm.prototype.onFieldsListSelectClick = function(event)
	{
		var menuId = this.requisiteFieldsNode.id + '-menu-' + this.popupMenuCounter;
		this.popupMenuCounter++;

		BX.PopupMenu.show(
			menuId,
			this.fieldsListSelectNode,
			this.getFieldsItems(),
			{
				autoHide: true,
				offsetLeft: (BX.pos(this.fieldsListSelectNode)['width'] / 2),
				angle: { position: 'top', offset: 0 },
				zIndex: 200,
				className: 'bizproc-automation-inline-selector-menu',
				events: {
					onPopupClose: function () {
						this.destroy();
					}
				}
			}
		);

		return event.preventDefault();
	}

	ChangeRequisiteForm.prototype.getFieldsItems = function()
	{
		var preset = this.getPresetFieldIds();
		var form = this;

		var fieldsItems = [];
		for(var fieldId in this.fieldsMap)
		{
			if(this.fieldsMap.hasOwnProperty(fieldId) && this.isFieldAllowedByPreset(preset, fieldId))
			{
				fieldsItems.push({
					text: this.fieldsMap[fieldId]['Name'],
					fieldId: fieldId,
					onclick: function (e, item) {
						this.popupWindow.close();
						form.addRBPCondition(item.fieldId);
					}
				});
			}
		}
		return fieldsItems;
	}

	ChangeRequisiteForm.prototype.addRBPCondition = function(fieldId)
	{
		if(fieldId === undefined)
		{
			fieldId = this.getObjectKeys(this.fieldsMap)[0];
		}

		var titleNode = BX.create('span', {
			attrs: {className: "bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-autocomplete"},
			text: this.fieldsMap[fieldId]['Name']
		});

		var deleteButtonNode = BX.create('a', {
			attrs: {
				className: 'bizproc-automation-popup-settings-delete bizproc-automation-popup-settings-link bizproc-automation-popup-settings-link-light',
				'data-testid': testIdPrefix + '-delete-condition',
			},
			props: {href: '#'},
			text: this.messages['CRM_CRA_DELETE_CONDITION']
		});

		var conditionNode = BX.create('div', {
			attrs: {
				className: "bizproc-automation-popup-settings",
				'data-testid': testIdPrefix + '-condition',
			},
			children: [
				titleNode,
				this.renderField(fieldId),
				deleteButtonNode
			]
		});

		BX.bind(deleteButtonNode, 'click', (function (event) {
			this.deleteCondition(conditionNode);
			return event.preventDefault();
		}).bind(this));

		this.requisiteFieldsNode.appendChild(conditionNode);
	}

	ChangeRequisiteForm.prototype.initBPEvents = function(params)
	{
		BX.bind(this.selectPresetNode, 'change', this.onSelectPresetNodeChange.bind(this));
		BX.bind(
			this.findNodeInOwnDialog(params.addConditionLinkId),
			'click',
			this.onAddConditionLinkClick.bind(this)
		);
	}

	ChangeRequisiteForm.prototype.onSelectPresetNodeChange = function (preserveSelectedField)
	{
		var rows = this.requisiteFieldsNode.rows;
		for(var i = 0; i < rows.length; i++)
		{
			this.hideFieldNamesOfUnselectedPresets(rows[i], preserveSelectedField === true);
		}
	}

	ChangeRequisiteForm.prototype.onAddConditionLinkClick = function(event)
	{
		this.addBPCondition();
		return event.preventDefault();
	}

	ChangeRequisiteForm.prototype.addBPCondition = function(fieldId, preserveSelectedField)
	{
		if(fieldId === undefined)
		{
			fieldId = this.getObjectKeys(this.fieldsMap)[0];
		}

		var newRow = this.requisiteFieldsNode.insertRow(-1);
		newRow.setAttribute('data-testid', testIdPrefix + '-condition');

		newRow.insertCell(-1).appendChild(this.getFieldSelectNode(newRow, fieldId));
		newRow.insertCell(-1).appendChild(this.getEqualSignNode());
		newRow.insertCell(-1).appendChild(this.renderField(fieldId));
		newRow.insertCell(-1).appendChild(this.getDeleteButtonNode(newRow));
		this.hideFieldNamesOfUnselectedPresets(newRow, preserveSelectedField === true);
	}

	ChangeRequisiteForm.prototype.hideFieldNamesOfUnselectedPresets = function (row, preserveSelectedField)
	{
		var preset = this.getPresetFieldIds();

		var selectFieldNode = row.firstChild.firstChild;
		var inputFieldNode = row.children[2];

		for(var i = 0; i < selectFieldNode.length; i++)
		{
			var option = selectFieldNode[i];
			if(
				this.isFieldAllowedByPreset(preset, option.value)
				|| (preserveSelectedField && option.value === selectFieldNode.value)
			)
			{
				option.removeAttribute('hidden');
			}
			else
			{
				option.setAttribute('hidden', 'hidden');
			}
		}

		if(
			preserveSelectedField
			|| this.isFieldAllowedByPreset(preset, selectFieldNode.value)
		)
		{
			return;
		}

		for(i = 0; i < selectFieldNode.length; i++)
		{
			option = selectFieldNode[i];
			if(option.hasAttribute('hidden') === false)
			{
				selectFieldNode.value = option.value;
				row.replaceChild(this.renderField(selectFieldNode.value), inputFieldNode);
				break;
			}
		}
	}

	ChangeRequisiteForm.prototype.isFieldAllowedByPreset = function (preset, fieldId)
	{
		return preset.indexOf(fieldId) !== -1
			|| this.bankDetailFieldsMap.hasOwnProperty(fieldId)
			|| this.addressFieldsMap.hasOwnProperty(fieldId);
	}

	ChangeRequisiteForm.prototype.getObjectKeys = function(obj)
	{
		var objectKeys = [];
		for(var key in obj)
		{
			if(obj.hasOwnProperty(key))
			{
				objectKeys.push(key);
			}
		}
		return objectKeys;
	}

	ChangeRequisiteForm.prototype.getFieldSelectNode = function(row, selectedFieldName)
	{
		var select = BX.create('select', {
			attrs: {
				'data-testid': testIdPrefix + '-field-select',
			},
			children: this.getOptionsFromFieldsMap(selectedFieldName),
		});

		select.onchange = BX.proxy(
			function()
			{
				var inputNode = row.children[2];
				row.replaceChild(this.renderField(select.value), inputNode);
			},
			this
		);
		return select;
	}

	ChangeRequisiteForm.prototype.getPresetFieldIds = function ()
	{
		var presetId = this.selectPresetNode.value;
		if(this.presetFieldNames.hasOwnProperty(presetId) === false)
		{
			presetId = '0';
		}
		return this.presetFieldNames[presetId];
	}

	ChangeRequisiteForm.prototype.getOptionsFromFieldsMap = function(fieldId)
	{
		var options = [];
		var objectKeys = this.getObjectKeys(this.fieldsMap);
		for(var i = 0; i < objectKeys.length; i++)
		{
			var name = objectKeys[i];
			var attrs = fieldId === name ? {selected: 'selected'} : undefined;
			options.push(BX.create('option', {
				props: {value: name},
				attrs: attrs,
				text: this.fieldsMap[name]['Name']
			}));
		}

		return options;
	}

	ChangeRequisiteForm.prototype.getEqualSignNode = function()
	{
		return BX.create('span', {
			text: '='
		});
	}

	ChangeRequisiteForm.prototype.renderField = function(fieldId)
	{
		var fieldNode = BX.Bizproc.FieldType.renderControl(
			this.documentType,
			this.fieldsMap[fieldId],
			fieldId,
			this.currentValues[fieldId],
			this.isRobot ? 'public' : 'designer'
		);
		fieldNode.setAttribute('data-testid', testIdPrefix + '-field-input');

		return fieldNode;
	}

	ChangeRequisiteForm.prototype.getDeleteButtonNode = function(row)
	{
		var deleteButtonNode = BX.create('a', {
			attrs: {
				'data-testid': testIdPrefix + '-delete-condition',
			},
			props: {href: '#'},
			text: this.messages['CRM_CRA_DELETE_CONDITION']
		});

		BX.bind(deleteButtonNode, 'click', (function (event) {
			this.deleteCondition(row);
			event.preventDefault();
		}).bind(this))


		return deleteButtonNode;
	}

	ChangeRequisiteForm.prototype.deleteCondition = function(conditionNode)
	{
		conditionNode.parentNode.removeChild(conditionNode);
	}
})();
