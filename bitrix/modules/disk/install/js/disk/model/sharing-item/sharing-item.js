(function() {

	"use strict";

	/**
	 * @namespace BX.Disk.Model
	 */
	BX.namespace("BX.Disk.Model");

	// entity of the recipient dialog, the access code prefix of the sharing actions and the member
	// type of showSharingEntities. A chat has no entity in the dialog and therefore no row here.
	// The member types are the ones BaseObject::getMembersOfSharing() gives back
	// (disk/lib/baseobject.php); disk.sharing-members-popup keeps the same table in
	// src/const/selector.ts
	var SELECTOR_ENTITIES = [
		{entityId: 'user', accessCodePrefix: 'U', memberType: 'users'},
		{entityId: 'project', accessCodePrefix: 'SG', memberType: 'groups'},
		{entityId: 'department', accessCodePrefix: 'DR', memberType: 'department'}
	];

	function findSelectorEntityByAccessCode(accessCode)
	{
		if (!BX.type.isNotEmptyString(accessCode))
		{
			return null;
		}

		return SELECTOR_ENTITIES.find(function(entity) {
			return accessCode.indexOf(entity.accessCodePrefix) === 0;
		}) || null;
	}

	function findSelectorEntityById(entityId)
	{
		return SELECTOR_ENTITIES.find(function(entity) {
			return entity.entityId === entityId;
		}) || null;
	}

	/**
	 * Converts a sharing access code to a dialog item and back. An access code with no entity in
	 * SELECTOR_ENTITIES gives null, and the caller skips such a recipient.
	 */
	BX.Disk.SharingAccessCodes = {
		/**
		 * @param {string} accessCode
		 * @return {?Array} the item of the dialog as [entityId, id]
		 */
		getSelectorItemIdByAccessCode: function(accessCode)
		{
			var entity = findSelectorEntityByAccessCode(accessCode);

			return entity ? [entity.entityId, accessCode.slice(entity.accessCodePrefix.length)] : null;
		},

		/**
		 * @param {string} entityId
		 * @param {string|number} id
		 * @return {?string}
		 */
		getAccessCodeBySelectorItem: function(entityId, id)
		{
			var entity = findSelectorEntityById(entityId);

			return entity ? entity.accessCodePrefix + id : null;
		},

		/**
		 * @param {string} entityId
		 * @return {?string}
		 */
		getMemberTypeBySelectorEntity: function(entityId)
		{
			var entity = findSelectorEntityById(entityId);

			return entity ? entity.memberType : null;
		}
	};

	// The surfaces of one file share one list of recipients, so the one whose action the
	// server has agreed to tells the others what changed. This is a report, not a request: nobody
	// answers it with a call of its own and nobody answers it with a message of its own.
	function emitSharingMembersChanged(data)
	{
		var eventEmitter = BX.Event && BX.Event.EventEmitter ? BX.Event.EventEmitter : null;
		if (eventEmitter)
		{
			eventEmitter.emit('Disk.FileView:onSharingMembersChanged', data);
		}
	}

	// the dialog of the own surface holds the mark of a recipient: a model reaches it by the access
	// code of its own recipient and never touches the dialog of another surface
	function getDialogItem(model)
	{
		var dialog = model.getDialog();
		if (!dialog)
		{
			return null;
		}

		var itemId = BX.Disk.SharingAccessCodes.getSelectorItemIdByAccessCode(model.state.entity.id);

		return itemId ? dialog.getItem(itemId) : null;
	}

	// the change is already agreed with the server: answering the dialog with an event of its own
	// would give a second request
	function markDialogItem(model, isSelected)
	{
		var item = getDialogItem(model);
		if (!item)
		{
			return;
		}

		if (isSelected)
		{
			item.select({emitEvents: false});
		}
		else
		{
			item.deselect({emitEvents: false});
		}
	}

	/**
	 *
	 * @param {object} parameters
	 * @extends {BX.Disk.Model.Item}
	 * @constructor
	 */
	BX.Disk.Model.SharingItem = function(parameters)
	{
		BX.Disk.Model.Item.apply(this, arguments);

		this.templateId = this.templateId || 'sharing-item';
		this.surfaceId = parameters.surfaceId || '';
		// the dialog of the own surface: the model neither looks it up in a registry nor holds it
		this.getDialog = parameters.getDialog || function() {
			return null;
		};
		// the surface keeps the recipients of its own list by their access code: the model tells it
		// when the server has taken this one out of the list
		this.onForgetSharingItem = parameters.onForgetSharingItem || function() {};
		this.isDeleting = false;
		this.rightsMenu = null;
	};

	BX.Disk.Model.SharingItem.prototype =
	{
		__proto__: BX.Disk.Model.Item.prototype,
		constructor: BX.Disk.Model.SharingItem,

		bindEvents: function ()
		{
			var container = this.getContainer();

			var deleteButton = this.getEntity(container, 'sharing-item-delete');
			if (deleteButton)
			{
				BX.bind(deleteButton, 'click', this.handleDeleteSharing.bind(this));
			}

			var changeRightButton = this.getEntity(container, 'sharing-item-change-right');
			if (changeRightButton)
			{
				var openRightsMenu = this.handleChangeRight.bind(this);

				BX.bind(changeRightButton, 'click', openRightsMenu);
				// role="button" carries no native activation, so the keys are served here
				BX.bind(changeRightButton, 'keydown', function(event) {
					if (event.key === 'Enter' || event.key === ' ')
					{
						event.preventDefault();
						openRightsMenu(event);
					}
				});
			}
		},

		// the row of the list, the record of the surface and the mark of the dialog follow the answer
		// of the server: an access the server still holds is never shown as revoked
		deleteSharing: function()
		{
			if (!this.state.sharing.id || this.isDeleting)
			{
				return;
			}

			var sharingId = this.state.sharing.id;
			this.isDeleting = true;

			BX.ajax.runAction('disk.api.sharing.delete', {
				data: {
					sharingId: sharingId
				}
			}).then(function () {
				this.isDeleting = false;

				this.remove();
				this.onForgetSharingItem(this.state.entity.id);
				this.deselectInDialog();

				emitSharingMembersChanged({
					sourceSurfaceId: this.surfaceId,
					objectId: this.state.object.id,
					action: 'removed',
					accessCode: this.state.entity.id,
					sharingId: sharingId,
					member: null
				});
			}.bind(this), function (response) {
				this.isDeleting = false;

				// the recipient keeps the access: the mark goes back where the dialog took it off
				this.selectInDialog();

				BX.Disk.showModalWithStatusAction(response);
			}.bind(this));
		},

		// the mark is taken off after the server agreed, and only in the dialog of the own surface
		deselectInDialog: function()
		{
			markDialogItem(this, false);
		},

		selectInDialog: function()
		{
			markDialogItem(this, true);
		},

		handleDeleteSharing: function(event)
		{
			this.deleteSharing();
		},

		changeRight: function(taskName)
		{
			// render() replaces the container the menu is bound to, so it closes first
			this.rightsMenu.close();

			// close() has just put the focus back on the trigger render() is about to drop
			var hadFocusInside = this.hasFocusInside();

			var previousTaskName = this.state.sharing.taskName;

			this.state.sharing.taskName = taskName;
			this.state.sharing.name = BX.Disk.getRightLabelByTaskName(taskName);

			this.render();

			if (hadFocusInside)
			{
				this.focusChangeRightTrigger();
			}

			this.save(previousTaskName);
		},

		hasFocusInside: function()
		{
			var container = this.getContainer();
			var active = document.activeElement;

			return !!container && !!active && container.contains(active);
		},

		focusChangeRightTrigger: function()
		{
			var trigger = this.getEntity(this.getContainer(), 'sharing-item-change-right');
			if (trigger)
			{
				trigger.focus({preventScroll: true});
			}
		},

		buildRightItems: function()
		{
			var sharing = this.state.sharing;
			var self = this;

			return RIGHTS
				.filter(function(right) {
					return pseudoCompareTaskName(sharing.maxTaskName, right.taskName) >= 0;
				})
				.map(function(right) {
					return {
						title: BX.message(right.message),
						isSelected: sharing.taskName === right.taskName,
						onClick: function() {
							self.changeRight(right.taskName);
						}
					};
				});
		},

		handleChangeRight: function(event)
		{
			if (this.rightsMenu)
			{
				// the instance still closing keeps the items of the first show, the mark included
				this.rightsMenu.updateItems(this.buildRightItems());
			}
			else
			{
				this.rightsMenu = new BX.UI.System.Menu({
					// the sharing id keeps the layer of a second recipient apart, the id of the
					// surface root - the one of a second surface in the same document
					id: 'disk-file-view-rights-' + this.surfaceId + '-' + this.state.sharing.id,
					items: this.buildRightItems(),
					angle: true,
					offsetLeft: 20,
					// the panel is injected anew on every open and the layer lives in the body,
					// outside the slider: it is not kept past its closing
					cacheable: false,
					overlay: {
						opacity: 0.01
					},
					// closing belongs to changeRight, before render() drops the trigger node
					closeOnItemClick: false,
					events: {
						onDestroy: function() {
							this.rightsMenu = null;
						}.bind(this)
					}
				});
			}

			this.rightsMenu.show(BX.getEventTarget(event));
		},

		remove: function()
		{
			if (this.rightsMenu)
			{
				this.rightsMenu.destroy();
				this.rightsMenu = null;
			}

			BX.Disk.Model.Item.prototype.remove.apply(this, arguments);
		},

		save: function (previousTaskName)
		{
			BX.ajax.runAction('disk.api.sharing.changeTaskName', {
				data: {
					sharingId: this.state.sharing.id,
					newTaskName: this.state.sharing.taskName
				}
			}).then(function (response) {}, function (response) {
				// the server left the right as it was: the list shows it that way again
				if (previousTaskName)
				{
					this.state.sharing.taskName = previousTaskName;
					this.state.sharing.name = BX.Disk.getRightLabelByTaskName(previousTaskName);

					this.render();
				}

				BX.Disk.showModalWithStatusAction(response);
			}.bind(this));
		}
	};

	/**
	 *
	 * @param {object} parameters
	 * @extends {BX.Disk.Model.SharingItem}
	 * @constructor
	 */
	BX.Disk.Model.DraftSharingItem = function(parameters)
	{
		BX.Disk.Model.SharingItem.apply(this, arguments);

		// the surface keeps the recipients of its own list: the item taking the place of the draft
		// is a new model and reaches the list only through here
		this.onReplaceByRealItem = parameters.onReplaceByRealItem || function() {};
		this.isRevokeRequested = false;

		if (!this.state.sharing)
		{
			this.state.sharing = {
				canDelete: true,
				canChange: true,
				name: BX.Disk.getRightLabelByTaskName('disk_access_read'),
				taskName: 'disk_access_read',
				maxTaskName: 'disk_access_full'
			};
		}
	};

	BX.Disk.Model.DraftSharingItem.prototype =
	{
		__proto__: BX.Disk.Model.Item.prototype,
		constructor: BX.Disk.Model.DraftSharingItem,

		getAdditionalContainerClasses: function()
		{
			return [
				'disk-item-container-disabled'
			];
		},

		// the mark can be taken off while the request of the draft is still in flight: there is no
		// access to revoke yet, so the gesture waits for the one the server is about to grant
		requestRevokeAfterSave: function()
		{
			this.isRevokeRequested = true;
		},

		save: function ()
		{
			BX.ajax.runAction('disk.api.file.addSharing', {
				data: {
					fileId: this.state.object.id,
					entity: this.state.entity.id,
					taskName: this.state.sharing.taskName
				}
			}).then(function (response) {
				// runAction lets an answer with no granted sharing through: nothing holds the access
				// behind the row, so it goes the way of a refusal instead of staying in the list
				if (!response.data || !response.data.sharing || !response.data.sharing.id)
				{
					this.handleRefusedSave({
						status: 'error',
						message: BX.message('DISK_JS_STATUS_ACTION_ERROR')
					});

					return;
				}

				this.state.sharing.id = response.data.sharing.id;

				var savedSharingItem = this.replaceByRealItem();

				emitSharingMembersChanged({
					sourceSurfaceId: this.surfaceId,
					objectId: this.state.object.id,
					action: 'added',
					accessCode: this.state.entity.id,
					sharingId: this.state.sharing.id,
					// a copy: the recipient of the message builds a model of its own on it
					member: {
						entity: BX.clone(this.state.entity),
						sharing: BX.clone(this.state.sharing)
					}
				});

				var sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
				if (sliderByWindow)
				{
					BX.SidePanel.Instance.postMessageAll(window, 'Disk.File:onAddSharing', {
						objectId: this.state.object.id
					});
				}

				if (this.isRevokeRequested)
				{
					savedSharingItem.deleteSharing();
				}
			}.bind(this), this.handleRefusedSave.bind(this));
		},

		// the server granted nothing: the row of the draft leaves the list and the mark of the
		// dialog goes off after it
		handleRefusedSave: function (response)
		{
			this.remove();
			this.onForgetSharingItem(this.state.entity.id);
			markDialogItem(this, false);

			BX.Disk.showModalWithStatusAction(response);
		},

		replaceByRealItem: function()
		{
			var savedSharingItem = new BX.Disk.Model.SharingItem({
				templateId: this.templateId,
				surfaceId: this.surfaceId,
				getDialog: this.getDialog,
				onForgetSharingItem: this.onForgetSharingItem,
				state: this.state
			});

			savedSharingItem.render();
			this.getContainer().parentNode.replaceChild(savedSharingItem.getContainer(), this.getContainer());
			this.remove();

			this.onReplaceByRealItem(savedSharingItem);

			return savedSharingItem;
		}
	};

	var RIGHTS = [
		{taskName: 'disk_access_read', message: 'DISK_JS_SHARING_LABEL_RIGHT_READ'},
		{taskName: 'disk_access_add', message: 'DISK_JS_SHARING_LABEL_RIGHT_ADD'},
		{taskName: 'disk_access_edit', message: 'DISK_JS_SHARING_LABEL_RIGHT_EDIT'},
		{taskName: 'disk_access_full', message: 'DISK_JS_SHARING_LABEL_RIGHT_FULL'}
	];

	function pseudoCompareTaskName(taskName1, taskName2)
	{
		var taskName1Pos;
		var taskName2Pos;
		switch (taskName1)
		{
			case 'disk_access_read':
				taskName1Pos = 2;
				break;
			case 'disk_access_add':
				taskName1Pos = 3;
				break;
			case 'disk_access_edit':
				taskName1Pos = 4;
				break;
			case 'disk_access_full':
				taskName1Pos = 5;
				break;
			default:
				//unknown task names
				return 0;
		}
		switch (taskName2)
		{
			case 'disk_access_read':
				taskName2Pos = 2;
				break;
			case 'disk_access_add':
				taskName2Pos = 3;
				break;
			case 'disk_access_edit':
				taskName2Pos = 4;
				break;
			case 'disk_access_full':
				taskName2Pos = 5;
				break;
			default:
				//unknown task names
				return 0;
		}
		if (taskName1Pos == taskName2Pos)
		{
			return 0;
		}

		return taskName1Pos > taskName2Pos ? 1 : -1;
	}
})();