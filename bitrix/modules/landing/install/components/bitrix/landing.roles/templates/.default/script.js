landingAccessExtendedSelected = {};

/**
 * Keeps the keyboard inside the block a row is dropped from: the delete control of the next row,
 * the add control of the block when the last row is gone.
 */
function landingRolesFocusAfterRemove(removed, deleteSelector, block, addSelector)
{
	for (var sibling = removed.nextElementSibling; sibling; sibling = sibling.nextElementSibling)
	{
		var next = sibling.querySelector(deleteSelector);
		if (next)
		{
			next.focus();
			return;
		}
	}

	var add = block ? block.querySelector(addSelector) : null;
	if (add)
	{
		add.focus();
	}
}

function deleteAccessRow(link)
{
	var button = BX(link);
	var row = BX.findParent(button, {tag: 'tr'}, true);

	landingAccessSelected[BX.data(button, 'id')] = false;
	landingRolesFocusAfterRemove(
		row,
		'.table-blue-delete-landing-role',
		BX('landing-rights-table'),
		'#landing-rights-form'
	);
	BX.remove(row);
}

function deleteAccessRowExtended(link)
{
	var button = BX(link);
	var code = BX.data(button, 'code');
	if (typeof landingAccessExtendedSelected[code] !== 'undefined')
	{
		var id = BX.data(button, 'id');
		landingAccessExtendedSelected[code][id] = false;
	}

	var accessCodeBlock = BX.findParent(button, {tag: 'div'}, true);
	landingRolesFocusAfterRemove(
		accessCodeBlock,
		'.table-blue-delete-landing-role',
		BX.findParent(accessCodeBlock, {tag: 'tr'}, true),
		'.landing-additional-rights-form'
	);
	BX.remove(accessCodeBlock);
}

(function() {

	'use strict';

	BX.namespace('BX.Landing');

	var accessSettings = {select: '', messages: {}};
	var accessExtendedSettings = {rights: {}, messages: {}};

	/**
	 * A placeholder is filled through a function to keep `$&` and its kin out of the replacement.
	 */
	function fillPlaceholder(template, placeholder, value)
	{
		return String(template).replace(placeholder, function()
		{
			return value;
		});
	}

	/**
	 * Provider and entity as one string, both escaped: `BX.Access` returns them as they are stored.
	 */
	function formatEntity(providerName, entityName)
	{
		return (providerName !== '')
			? BX.Text.encode(providerName) + ': ' + BX.Text.encode(entityName)
			: BX.Text.encode(entityName);
	}

	/**
	 * Rights in role mode.
	 */
	BX.Landing.Access = function(params)
	{
		// init vars
		var selected = landingAccessSelected;
		var name = 'rights';
		var tbl = BX('landing-' + name + '-table');
		var inc = params.inc;

		accessSettings = {
			select: params.select,
			messages: params.messages
		};

		// access init
		BX.Access.Init({
			other: {
				disabled_cr: true
			}
		});
		BX.Access.SetSelected(
			selected,
			name
		);

		// show form
		function showForm()
		{
			BX.Access.ShowForm(
			{
				callback: function(obSelected)
				{
					for (var provider in obSelected)
					{
						if (obSelected.hasOwnProperty(provider))
						{
							for (var id in obSelected[provider])
							{
								if (obSelected[provider].hasOwnProperty(id))
								{
									// build table row
									var cnt = tbl.rows.length;
									var row = tbl.insertRow(cnt-1);

									selected[id] = true;
									row.innerHTML = BX.Landing.Access.renderRightCells(
										BX.Access.GetProviderName(provider),
										obSelected[provider][id].name,
										id,
										inc++
									);
								}
							}
						}
					}
				},
				bind: name
			});
		}

		// bind for show form
		BX('landing-rights-form').addEventListener(
			'click',
			showForm.bind(this)
		);

		// remove roles
		var fields = BX.findChild(
			BX('landing-roles'),
			{
				class: 'landing-role-delete'
			},
			true,
			true
		);
		fields.forEach(function(element){
			BX(element).addEventListener(
				'click',
				function()
				{
					var row = BX.findParent(
						BX(this),
						{tag: 'tr'},
						true
					);

					landingRolesFocusAfterRemove(
						row,
						'.landing-role-delete',
						BX('landing-roles'),
						'.table-blue-link'
					);
					BX.remove(row);
				}
			);
		});

		// etended mode
		BX.bind(
			BX('landing-mode-form-submit'),
			'click',
			function()
			{
				BX('landing-mode-form').submit();
			}
		);
	};

	/**
	 * Cells of a rights row, the markup the server prints for the same row.
	 */
	BX.Landing.Access.renderRightCells = function(providerName, entityName, accessCode, index)
	{
		var code = BX.Text.encode(accessCode);
		var entity = formatEntity(providerName, entityName);
		var select = fillPlaceholder(
			fillPlaceholder(accessSettings.select, '#inc#', index),
			'#entity#',
			entity
		);

		return '<th scope="row" class="table-blue-td-name">' + BX.Text.encode(providerName) + '</th>'
			+ '<td class="table-blue-td-param">' + BX.Text.encode(entityName) + '</td>'
			+ '<td class="table-blue-td-select">'
				+ '<input type="hidden" name="rights[ACCESS_CODE][]" value="' + code + '">'
				+ select
			+ '</td>'
			+ '<td class="table-blue-td-action">'
				+ '<button type="button" '
					+ 'class="table-blue-delete table-blue-delete-landing-role bitrix24-metrika" '
					+ 'data-metrika24="permission_delete" '
					+ 'data-id="' + code + '" '
					+ 'onclick="deleteAccessRow(this);" '
					+ 'title="' + BX.Text.encode(accessSettings.messages.deleteTitle) + '" '
					+ 'aria-label="'
						+ fillPlaceholder(
							BX.Text.encode(accessSettings.messages.deleteRight),
							'#ENTITY#',
							entity
						)
					+ '" '
					+ 'data-testid="roles-right-delete-btn"></button>'
			+ '</td>';
	};

	/**
	 * Rights in extended mode.
	 */
	BX.Landing.AccessExtended = function(params)
	{
		accessExtendedSettings = {
			rights: params.rights,
			messages: params.messages
		};

		function showForm(rightId, selected)
		{
			var name = 'rights';

			// init access
			BX.Access.bInit = false;
			BX.Access.Init({
				other: {
					disabled_cr: true
				}
			});

			// set selected ids
			if (typeof landingAccessExtendedSelected[rightId] === 'undefined')
			{
				landingAccessExtendedSelected[rightId] = selected;
			}
			else
			{
				for (var index in selected)
				{
					if (typeof landingAccessExtendedSelected[rightId][index] === 'undefined')
					{
						landingAccessExtendedSelected[rightId][index] = selected[index];
					}
				}
			}
			BX.Access.SetSelected(
				landingAccessExtendedSelected[rightId],
				name
			);

			// show form
			BX.Access.ShowForm(
				{
					callback: function(obSelected)
					{
						// appending keeps the blocks drawn before, and the focus inside them, alive
						var codes = BX('landing-additional-rights-fields-' + rightId);

						for (var provider in obSelected)
						{
							if (obSelected.hasOwnProperty(provider))
							{
								for (var id in obSelected[provider])
								{
									if (obSelected[provider].hasOwnProperty(id))
									{
										landingAccessExtendedSelected[rightId][id] = true;
										codes.insertAdjacentHTML(
											'beforeend',
											BX.Landing.AccessExtended.renderAccessCodeBlock(
												BX.Access.GetProviderName(provider),
												obSelected[provider][id].name,
												id,
												rightId
											)
										);
									}
								}
							}
						}
					},
					bind: name
				}
			);
		}

		// set additional rights
		var fields = BX.findChild(
			BX('landing-additional-rights-table'),
			{
				class: 'landing-additional-rights-form'
			},
			true,
			true
		);
		fields.forEach(function(element){
			BX(element).addEventListener(
				'click',
				function()
				{
					var selected = {};
					var codes = BX.data(BX(element), 'codes').split(',');
					for (var i = 0, c = codes.length; i < c; i++)
					{
						selected[codes[i]] = true;
					}
					showForm(
						BX.data(BX(element), 'id'),
						selected
					);
				}.bind(this)
			);
		});
	};

	/**
	 * Block of one access code, the markup the server prints for the same block.
	 */
	BX.Landing.AccessExtended.renderAccessCodeBlock = function(providerName, entityName, accessCode, rightCode)
	{
		var code = BX.Text.encode(accessCode);
		var right = BX.Text.encode(rightCode);
		var entity = formatEntity(providerName, entityName);
		var label = fillPlaceholder(
			fillPlaceholder(
				BX.Text.encode(accessExtendedSettings.messages.deleteAccessCode),
				'#ENTITY#',
				entity
			),
			'#RIGHT#',
			// the fallback of the server: a right the portal ships no title for is named by its code
			BX.Text.encode(accessExtendedSettings.rights[rightCode] || rightCode)
		);

		return '<div class="landing-role-users">'
			+ '<input type="hidden" name="rights[' + right + '][]" value="' + code + '">'
			+ entity
			+ '<button type="button" '
				+ 'class="table-blue-delete table-blue-delete-landing-role bitrix24-metrika" '
				+ 'data-metrika24="permission_delete" '
				+ 'data-code="' + right + '" '
				+ 'data-id="' + code + '" '
				+ 'onclick="deleteAccessRowExtended(this);" '
				+ 'title="' + BX.Text.encode(accessExtendedSettings.messages.deleteTitle) + '" '
				+ 'aria-label="' + label + '" '
				+ 'data-testid="roles-access-code-delete-btn"></button>'
			+ '</div>';
	};

})();