;if (!BX.getClass('BX.Bizproc.UserSelector')) (function(BX)
{
	'use strict';
	BX.namespace('BX.Bizproc');

	const selectors = new WeakMap();

	const UserSelector = function(container, config)
	{
		if (!BX.type.isPlainObject(config))
		{
			config = {};
		}

		const inlineConfig = container.getAttribute('data-config')
			? BX.parseJSON(container.getAttribute('data-config')) : null
		;
		container.removeAttribute('data-config');

		if (BX.type.isPlainObject(inlineConfig))
		{
			Object.assign(config, inlineConfig);
		}

		this.config = config;
		this.container = container || BX.create('div');
		this.isOnlyDialogMode = config.isOnlyDialogMode || false;
		this.multiple = config.multiple || false;
		this.required = config.required || false;
		this.additionalFields = BX.type.isArray(config.additionalFields) ? config.additionalFields : [];
		this.preloadedItems = BX.Type.isArray(config.items) ? config.items : [];

		this.prepareRoles();

		if (!this.isOnlyDialogMode)
		{
			this.prepareNodes();
		}
		else
		{
			this.prepareDialogOnly();
		}
	};

	UserSelector.decorateNode = function(container, config)
	{
		let selector = selectors.get(container);
		if (!selector)
		{
			selector = new UserSelector(container, config);
			selectors.set(container, selector);
		}

		return selector;
	};

	/**
	 * @param container
	 * @returns {UserSelector|null}
	 */
	UserSelector.getByNode = function(container)
	{
		return selectors.get(container);
	};

	UserSelector.prototype = {
		prepareNodes: function()
		{
			const selected = this.config.value ? this.parseValue(this.config.value) : [];

			this.tagSelector = new BX.UI.EntitySelector.TagSelector({
				multiple: this.multiple,
				addButtonCaption: BX.Loc.getMessage('BIZPROC_JS_USER_SELECTOR_CHOOSE'),
				addButtonCaptionMore: BX.Loc.getMessage('BIZPROC_JS_USER_SELECTOR_EDIT'),
				items: selected,
				tagMaxWidth: 184,
				events: {
					onTagAdd: (event) => this.addItem(event.getData().tag),
					onTagRemove: (event) => this.removeItem(event.getData().tag),
				},
				dialogOptions: this.getDialogOptions()
			});

			this.container.classList.remove(...this.container.classList);
			this.container.className = 'bizproc-type-control-user--width';

			this.tagSelector.renderTo(this.container);

			this.createValueNode(this.config.valueInputName || '');
			this.tagSelector.getTags().forEach((tag) => this.addItem(tag));
		},
		getDialogOptions()
		{
			return {
				context: 'BIZPROC',
				showCreateButton: false,
				width: 400,
				tabs: [
					{
						id: 'bpuserroles',
						title: BX.Loc.getMessage('BIZPROC_JS_USER_SELECTOR_ROLE_TAB'),
					},
				],
				entities: [
					{
						id: 'user',
						options: {
							inviteEmployeeLink: false,
							inviteGuestLink: false, // this.config.allowEmailUsers === true, // maybe later :-)
							emailUsers: this.config.allowEmailUsers === true,
							myEmailUsers: this.config.allowEmailUsers === true,
						},
					},
					{
						id: this.config.canUseHumanResources ? 'structure-node' : 'department',
						options: {
							selectMode: 'usersAndDepartments',
						},
					},
					{
						id: 'bpuserroles',
						name: BX.Loc.getMessage('BIZPROC_JS_USER_SELECTOR_ROLE_TAB'),
						tagOptions: {
							default: {
								textColor: '#207976',
								bgColor: '#ade7e4',
							},
							inactive: {
								textColor: 'grey',
							},
						},
					},
				],
				items: Object.values(this.roles),
			};
		},
		prepareDialogOnly: function()
		{
			const events = {
				events: {
					'Item:onBeforeSelect': (event) => {
						event.preventDefault();
						event.getTarget().hide();
						const item = event.getData().item
						const value = this.convertItemToValue(item, item.getEntityId());

						if (this.config.callbacks && BX.type.isFunction(this.config.callbacks.select))
						{
							this.config.callbacks.select(value, this);
						}
					}
				}
			};

			this.dialog = new BX.UI.EntitySelector.Dialog(
				Object.assign(this.getDialogOptions(), events)
			);

			BX.bind(this.container, 'click', (event) => {
				event.preventDefault();
				this.dialog.show();
			});
		},
		createValueNode: function(valueInputName)
		{
			this.valueNode = BX.create('input', {
				props: {
					type: 'hidden',
					name: valueInputName
				}
			});

			this.container.appendChild(this.valueNode);
		},
		/** @param {BX.UI.EntitySelector.Item} item */
		addItem: function(item)
		{
			this.setValue(item);
		},
		toggleItem: function(item)
		{
			if (!this.tagSelector)
			{
				return;
			}

			const tag = this.tagSelector.getTag(item);

			if (tag)
			{
				this.tagSelector.removeTag(tag);
			}
			else
			{
				this.tagSelector.addTag(item);
			}
		},
		/** @param {BX.UI.EntitySelector.Item} item */
		removeItem: function(item)
		{
			this.unsetValue(item);
		},
		destroy: function()
		{
			this.tagSelector = null;
			this.dialog = null;
			this.container = null;
			this.valueNode = null;
		},
		/** @param {BX.UI.EntitySelector.Item} item */
		setValue: function(item)
		{
			const id = this.getValueId(item, item.getEntityId());
			const value = this.convertItemToValue(item, item.getEntityId());

			if (!this.multiple)
			{
				this.valueNode.value = value;
			}
			else
			{
				var i, newVal = [], pairs = this.valueNode.value.split(',');
				for (i = 0; i < pairs.length; ++i)
				{
					if (!pairs[i] || pairs[i].indexOf(id) >= 0)
					{
						continue;
					}
					newVal.push(pairs[i]);
				}
				newVal.push(value);
				this.valueNode.value = newVal.join(',');
			}
		},
		convertItemToValue(item, type)
		{
			const id = this.getValueId(item, type);
			const value = id;
			const name = this.getItemName(item);

			if (
				['user', 'department', 'structure-node'].includes(type)
				|| (type === 'bpuserroles' && value.indexOf('G') === 1)
			)
			{
				return [name, id].join(' ');
			}

			if (type === 'bpuserroles' && !value.includes('{'))
			{
				return name;
			}

			return value;
		},
		unsetValue: function(item)
		{
			const id = this.getValueId(item, item.getEntityId());

			if (!this.multiple)
			{
				this.valueNode.value = '';
			}
			else
			{
				const newVal = [];
				const pairs = this.valueNode.value.split(',');

				for (let i = 0; i < pairs.length; ++i)
				{
					if (!pairs[i] || pairs[i].indexOf(id) >= 0)
					{
						continue;
					}
					newVal.push(pairs[i]);
				}
				this.valueNode.value = newVal.join(',');
			}
		},
		getValueId(item, type)
		{
			const id = item.getId().toString();

			if (type === 'user')
			{
				return `[${id}]`;
			}

			if (type === 'department')
			{
				return `[DR${id}]`;
			}

			if (type === 'structure-node')
			{
				return `[HRR${id}]`;
			}

			if (type === 'bpuserroles' && id.indexOf('G') === 0)
			{
				return `[${id}]`;
			}

			if (type === 'bpuserroles' && !id.includes('{'))
			{
				return this.getItemName(item);
			}

			return id;
		},
		getItemName(item)
		{
			return item.getTitle().replace(/[,\.\_\>\<\"]/g, '');
		},
		getValue: function()
		{
			return this.valueNode.value;
		},
		parseValue(value)
		{
			const pairs = this.prepareValueString(value).split(',');
			const items = [];
			pairs.forEach((pair) => {
				const trimmedPair = pair.trim();

				let matches = trimmedPair.match(/(.*)\[([A-Z]{0,2})(\d+)]/);
				if (matches)
				{
					const entityId = matches[3];
					const prefix = matches[2];

					const needConvertToInt = prefix !== 'G';
					let id = prefix + entityId;
					let entityType = prefix === '' ? 'user' : 'bpuserroles';

					if (entityType === 'user' && id[0] === 'U')
					{
						id = id.replace('U', '');
					}

					if (prefix === 'DR')
					{
						entityType = 'department';
						id = id.replace('DR', '');
					}

					if (needConvertToInt)
					{
						id = BX.Text.toInteger(id);
					}

					const preloadedItem = this.preloadedItems.find(
						(item) => item.id === id && item.entityId === entityType,
					);

					items.push(preloadedItem || { id, entityId: entityType, title: matches[1].trim() });

					return;
				}

				matches = trimmedPair.match(/(.*)\[HRR(\d+)]/);
				if (matches)
				{
					const id = BX.Text.toInteger(matches[2]);
					const preloadedItem = this.preloadedItems.find(
						(item) => item.id === id && item.entityId === 'structure-node',
					);

					items.push(preloadedItem || { id, entityId: 'bpuserroles', title: matches[1].trim() });

					return;
				}

				if (this.roles[trimmedPair])
				{
					items.push(this.roles[trimmedPair]);

					return;
				}

				if (this.getGroups().length > 0)
				{
					const groupData = this.getGroups().find((group) => group.name === trimmedPair);
					if (groupData)
					{
						items.push({
							id: groupData.id,
							entityId: 'bpuserroles',
							title: groupData.name,
						});

						return;
					}
				}

				items.push({
					id: trimmedPair,
					entityId: 'bpuserroles',
					title: trimmedPair,
				});
			});

			return items;
		},
		prepareValueString(value)
		{
			let preparedValue = value.toString();

			if (preparedValue.includes('{{')) // if contains simple expressions
			{
				const fields = BX.Bizproc.FieldType.getDocumentFields();
				fields.forEach((field) => {
					if (field.Type === 'user')
					{
						preparedValue = preparedValue.replace(field.Expression, field.SystemExpression);
					}
				});
			}

			return preparedValue;
		},
		prepareRoles: function()
		{
			var fields = BX.Bizproc.FieldType.getDocumentFields();
			var roles = {};

			if (this.getGroups().length)
			{
				this.getGroups().forEach(function(group)
				{
					roles[group['id']] = {
						id: group['id'],
						entityId: 'bpuserroles',
						title: group['name'],
						tabs: 'bpuserroles',
						//compatible
						name: group.name,
					};
				});
			}

			fields.forEach(function(field)
			{
				if (field['Type'] === 'user')
				{
					roles[field['SystemExpression']] = {
						id: field['SystemExpression'],
						entityId: 'bpuserroles',
						title: field['Name'],
						tabs: 'bpuserroles',
					};
				}
			});

			this.additionalFields.forEach(function(field)
			{
				roles[field['id']] = {
					id: field['id'],
					entityId: field.entityId ? String(field.entityId).toLowerCase() : 'bpuserroles',
					title: field.title || field.name,
					tabs: field.tabs || 'bpuserroles',
					sort: field.sort,
				};
			});

			this.roles = roles;
		},
		/**
		 * @returns {[]}
		 */
		getGroups: function()
		{
			return this.config.groups || BX.Bizproc.FieldType.getDocumentUserGroups();
		}
	};

	BX.Bizproc.UserSelector = UserSelector;
})(window.BX || window.top.BX);
