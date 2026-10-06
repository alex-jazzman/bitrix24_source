<?php

declare(strict_types=1);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Provider\Params\Pager;
use Bitrix\Main\UserTable;
use Bitrix\Rest\Public\Provider\Dto\IncomingWebhookDto;
use Bitrix\Rest\Public\Provider\IncomingWebhookProvider;
use Bitrix\Rest\Public\Provider\Params\IncomingWebhookFilter;
use Bitrix\Rest\Public\Provider\Params\IncomingWebhookParams;
use Bitrix\Rest\Public\Provider\Params\IncomingWebhookSort;
use Bitrix\Vibecodeconnector\Internal\Integration\Rest\DeveloperKeyIssuer;

/**
 * @global CMain $APPLICATION
 */

$module_id = 'vibecodeconnector';
Loc::loadMessages(__FILE__);

if (!Loader::includeModule($module_id))
{
	$APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));

	return;
}

$moduleAccess = $APPLICATION->GetGroupRight($module_id);
if ($moduleAccess < 'R')
{
	$APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));

	return;
}

$sTableID = 'tbl_vibecodeconnector_devkeys';
$oSort = new CAdminUiSorting($sTableID, 'ID', 'DESC');
$lAdmin = new CAdminUiList($sTableID, $oSort);

$lAdmin->addHeaders([
	['id' => 'ID', 'content' => Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_COL_ID'), 'sort' => 'ID', 'default' => true, 'align' => 'right'],
	['id' => 'TITLE', 'content' => Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_COL_TITLE'), 'sort' => 'TITLE', 'default' => true],
	['id' => 'ACTIVE', 'content' => Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_COL_ACTIVE'), 'default' => true, 'align' => 'center'],
	['id' => 'USER', 'content' => Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_COL_USER'), 'default' => true],
	['id' => 'URL', 'content' => Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_COL_URL'), 'default' => true],
	['id' => 'SCOPES', 'content' => Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_COL_SCOPES'), 'default' => true],
	['id' => 'CREATED', 'content' => Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_COL_CREATED'), 'sort' => 'DATE_CREATE', 'default' => true],
	['id' => 'LAST_USED', 'content' => Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_COL_LAST_USED'), 'sort' => 'DATE_LOGIN', 'default' => true],
	['id' => 'LAST_IP', 'content' => Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_COL_LAST_IP'), 'default' => true],
]);

$nav = $lAdmin->getPageNavigation('pages-vibecodeconnector-devkeys');

$sortField = strtoupper((string)$oSort->getField());
$sortOrder = strtoupper((string)$oSort->getOrder()) === 'ASC' ? 'ASC' : 'DESC';
$sort = $sortField !== '' ? [$sortField => $sortOrder] : [];

$items = [];
$users = [];
$listError = null;
if (!Loader::includeModule('rest'))
{
	$listError = Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_REST_MISSING');
}
else
{
	try
	{
		$webhookProvider = new IncomingWebhookProvider();
		$filter = new IncomingWebhookFilter(
			scopes: DeveloperKeyIssuer::DEVELOPER_KEY_SCOPES,
		);

		if ($lAdmin->isTotalCountRequest())
		{
			$lAdmin->sendTotalCountResponse($webhookProvider->getCount($filter));
		}

		$params = new IncomingWebhookParams(
			webhookFilter: $filter,
			pager: new Pager(limit: $nav->getLimit() + 1, offset: $nav->getOffset()),
			sort: new IncomingWebhookSort($sort),
		);
		$items = $webhookProvider->getList($params);

		$userIds = array_values(array_unique(array_filter(array_map(
			static fn (IncomingWebhookDto $webhook): int => (int)$webhook->getUserId(),
			$items,
		))));
		if ($userIds !== [])
		{
			$userRows = UserTable::getList([
				'filter' => ['=ID' => $userIds],
				'select' => ['ID', 'NAME', 'LAST_NAME', 'LOGIN'],
			]);
			while ($u = $userRows->fetch())
			{
				$users[(int)$u['ID']] = $u;
			}
		}
	}
	catch (\Throwable $e)
	{
		$listError = Loc::getMessage(
			'VIBECODECONNECTOR_DEVKEYS_LIST_ERROR',
			['#MESSAGE#' => $e->getMessage()]
		);
	}
}

$pageSize = $nav->getPageSize();
$rowsOnPage = 0;
foreach ($items as $webhook)
{
	$rowsOnPage++;
	if ($rowsOnPage > $pageSize)
	{
		break;
	}

	$userId = (int)$webhook->getUserId();
	$user = $users[$userId] ?? null;
	$userName = $user !== null
		? trim((string)($user['NAME'] ?? '') . ' ' . (string)($user['LAST_NAME'] ?? ''))
		: '';
	$userLogin = $user !== null ? (string)($user['LOGIN'] ?? '') : '';

	$userLabel = $userName;
	if ($userLogin !== '')
	{
		$userLabel .= ($userLabel !== '' ? ' ' : '') . '(' . $userLogin . ')';
	}
	if ($userLabel === '')
	{
		$userLabel = '#' . $userId;
	}

	$url = str_replace('/rest/', '/rest/api/', $webhook->getWebhookUrl());
	$createdAt = $webhook->getDateCreate();
	$lastUsedAt = $webhook->getDateLogin();
	$lastIp = $webhook->getLastIp() ?? '';

	$row = $lAdmin->addRow((int)$webhook->getId(), [
		'ID' => (int)$webhook->getId(),
		'TITLE' => $webhook->getTitle() ?? '',
		'ACTIVE' => $webhook->isActive()
			? Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_YES')
			: Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_NO'),
		'USER' => $userLabel,
		'URL' => $url,
		'SCOPES' => implode(', ', $webhook->getScopes()),
		'CREATED' => $createdAt !== null ? $createdAt->toString() : '-',
		'LAST_USED' => $lastUsedAt !== null ? $lastUsedAt->toString() : '-',
		'LAST_IP' => $lastIp !== '' ? $lastIp : '-',
	], '');

	$row->AddViewField(
		'URL',
		'<span style="font-family:monospace;word-break:break-all;">'
			. htmlspecialcharsbx($url)
			. '</span>'
	);

	$row->setConfig([
		'editable' => false,
	]);
}

$nav->setRecordCount($nav->getOffset() + $rowsOnPage);
$lAdmin->setNavigation($nav, Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_PAGES'), false);

$lAdmin->bShowActions = false;
$lAdmin->CheckListMode();

$APPLICATION->SetTitle(Loc::getMessage('VIBECODECONNECTOR_DEVKEYS_TITLE_V2'));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

if ($listError !== null)
{
	ShowError($listError);
}
else
{
	CAdminMessage::ShowNote(Loc::getMessage(
		'VIBECODECONNECTOR_DEVKEYS_HINT_V2',
		['#SCOPES#' => implode(', ', DeveloperKeyIssuer::DEVELOPER_KEY_SCOPES)]
	));
}

$lAdmin->DisplayList([
	'SHOW_COUNT_HTML' => true,
	'ACTION_PANEL' => false,
]);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
