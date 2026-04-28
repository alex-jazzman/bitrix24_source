import {Loc} from 'main.core';

export function init(isAvailableForEdit)
{
	const customServerConnectButtons = document.querySelectorAll('[data-custom-server-connect]');
	const customServerUpdateButtons = document.querySelectorAll('[data-custom-server-update]');
	const customServerDisconnectButtons = document.querySelectorAll('[data-custom-server-disconnect]');

	if (!isAvailableForEdit)
	{
		disableControls(
			customServerConnectButtons,
			customServerUpdateButtons,
			customServerDisconnectButtons,
		);

		return;
	}

	for (const customServerConnectButton of customServerConnectButtons)
	{
		customServerConnectButton.addEventListener('click', connectCustomServer);
	}

	for (const customServerUpdateButton of customServerUpdateButtons)
	{
		customServerUpdateButton.addEventListener('click', updateCustomServer);
	}

	for (const customServerDisconnectButton of customServerDisconnectButtons)
	{
		customServerDisconnectButton.addEventListener('click', disconnectCustomServer);
	}
}

function disableControls(
	customServerConnectButtons,
	customServerUpdateButtons,
	customServerDisconnectButtons,
)
{
	const dataGroupNodes = document.querySelectorAll('[data-data-group]');

	disableNodes(customServerConnectButtons);
	disableNodes(customServerUpdateButtons);
	disableNodes(customServerDisconnectButtons);
	disableNodes(dataGroupNodes);
}

function disableNodes(nodes)
{
	for (const node of nodes)
	{
		node.setAttribute('disabled', 'disabled');
	}
}

async function connectCustomServer(event)
{
	const groupKey = event.target.dataset.customServerConnect;

	const config = {
		data: getDataForCustomServer(groupKey),
	};

	try
	{
		/** @see \Bitrix\Disk\Controller\Admin\CustomServer::connectAction */
		await BX.ajax.runAction('disk.admin.customserver.connect', config);
		window.location.reload();
	}
	catch (response)
	{
		const error = response.errors[0]?.message ?? 'Internal Server Error';

		alert(error);
	}
}

async function updateCustomServer(event)
{
	const groupKey = event.target.dataset.customServerUpdate;

	const config = {
		data: getDataForCustomServer(groupKey),
	};

	try
	{
		/** @see \Bitrix\Disk\Controller\Admin\CustomServer::updateAction */
		await BX.ajax.runAction('disk.admin.customserver.update', config);
		window.location.reload();
	}
	catch (response)
	{
		const error = response.errors[0]?.message ?? 'Internal Server Error';

		alert(error);
	}
}

async function disconnectCustomServer(event)
{
	const isConfirmed = confirm(Loc.getMessage('JS_DISK_CUSTOM_SERVERS_ADMIN_CONFIRM_DISCONNECT'));

	if (!isConfirmed)
	{
		return;
	}

	const groupKey = event.target.dataset.customServerDisconnect;
	const customServerId = getCustomServerId(groupKey);

	if (customServerId === null)
	{
		alert(Loc.getMessage('JS_DISK_CUSTOM_SERVERS_ADMIN_CANNOT_DETECT_VIEWER_ID'));

		return;
	}

	const config = {
		data: {
			customServerId,
		},
	};

	try
	{
		/** @see \Bitrix\Disk\Controller\Admin\CustomServer::disconnectAction */
		await BX.ajax.runAction('disk.admin.customserver.disconnect', config);
		window.location.reload();
	}
	catch (response)
	{
		const error = response.errors[0]?.message ?? 'Internal Server Error';

		alert(error);
	}
}

function getDataForCustomServer(groupKey)
{
	const dataNodes = document.querySelectorAll(`[data-data-group="${groupKey}"]`);
	const data = {};

	for (const dataNode of dataNodes)
	{
		data[dataNode.getAttribute('name')] = dataNode.value;
	}

	return data;
}

function getCustomServerId(groupKey)
{
	const idNode = document.querySelector(`[data-data-group="${groupKey}"][name="customServerId"]`);

	if (idNode === null)
	{
		return null;
	}

	return idNode.value;
}
