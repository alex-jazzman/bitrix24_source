<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Color\PhaseColorScheme;
use Bitrix\Crm\Integration\PullManager;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Main\Context;
use Bitrix\Main\Web\Uri;

if (!CModule::IncludeModule('crm'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED'));
	return;
}

if (!CModule::IncludeModule('currency'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED_CURRENCY'));
	return;
}
if (!CModule::IncludeModule('catalog'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED_CATALOG'));
	return;
}
if (!CModule::IncludeModule('sale'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED_SALE'));
	return;
}


$statusEntityTypes = array_filter(
	CCrmStatus::GetEntityTypes(),
	static fn (array $entityType): bool =>
		($entityType['IS_ENABLED'] ?? true) !== false
		&& CCrmStatus::CheckCreatePermission((string)$entityType['ID']),
);
if ($statusEntityTypes === [])
{
	ShowError(GetMessage('CRM_PERMISSION_DENIED'));
	return;
}

if(!CAllCrmInvoice::installExternalEntities())
	return;
if (!CCrmQuote::LocalComponentCausedUpdater())
	return;

$availableStatusEntityIds = [];
foreach ($statusEntityTypes as $entityId => $entityType)
{
	$availableStatusEntityIds[$entityId] = true;
}

$queryParameters = Context::getCurrent()->getRequest()->getQueryList()->getValues();
if (!array_key_exists('ACTIVE_TAB', $queryParameters))
{
	$arResult['ACTIVE_ENTITY_ID'] = array_key_first($availableStatusEntityIds);
	$arResult['ACTIVE_TAB'] = 'status_tab_' . $arResult['ACTIVE_ENTITY_ID'];
}
else
{
	$activeTab = is_string($queryParameters['ACTIVE_TAB']) ? trim($queryParameters['ACTIVE_TAB']) : '';
	if (preg_match('/^status_tab_([a-z_0-9]+)$/iD', $activeTab, $matches) === 1)
	{
		$activeEntityId = strtoupper($matches[1]);
	}

	if (!isset($activeEntityId, $availableStatusEntityIds[$activeEntityId]))
	{
		$messages = \Bitrix\Crm\Service\Container::getInstance()->getLocalization()->loadMessages();
		ShowError((string)($messages['CRM_TYPE_CATEGORY_NOT_FOUND_ERROR'] ?? 'CRM category was not found.'));

		return;
	}

	$arResult['ACTIVE_ENTITY_ID'] = $activeEntityId;
	$arResult['ACTIVE_TAB'] = 'status_tab_' . $activeEntityId;
}

if($_SERVER['REQUEST_METHOD'] == 'POST' && check_bitrix_sessid() &&
	isset($_POST['ACTION']) && $_POST['ACTION'] == 'save')
{
	if (!is_array($_POST['LIST'] ?? null) || array_diff_key($_POST['LIST'], $availableStatusEntityIds))
	{
		ShowError(GetMessage('CRM_PERMISSION_DENIED'));
		return;
	}

	$activeTab = (string)($_POST['ACTIVE_TAB'] ?? '');
	$getRedirectUrl = static function (?string $error = null) use ($APPLICATION, $activeTab, $queryParameters): string {
		$params = ['ACTIVE_TAB' => $activeTab];
		if (
			($queryParameters['IFRAME'] ?? null) === 'Y'
			&& ($queryParameters['IFRAME_TYPE'] ?? null) === 'SIDE_SLIDER'
		)
		{
			$params['IFRAME'] = 'Y';
			$params['IFRAME_TYPE'] = 'SIDE_SLIDER';
		}
		if ($error !== null)
		{
			$params['ERROR'] = $error;
		}

		return (string)(new Uri($APPLICATION->GetCurPage()))->addParams($params);
	};

	foreach ((array)($_POST['LIST'] ?? []) as $entityId => $arFields)
	{
		$hasSemantics = isset($statusEntityTypes[$entityId]['SEMANTIC_INFO'])
			&& is_array($statusEntityTypes[$entityId]['SEMANTIC_INFO']);
		if (!$hasSemantics || !is_array($arFields))
		{
			continue;
		}

		foreach ($arFields as $arField)
		{
			if (
				is_array($arField)
				&& array_key_exists('DESCRIPTION', $arField)
				&& $arField['DESCRIPTION'] !== null
			)
			{
				if (!is_string($arField['DESCRIPTION']))
				{
					$error = CCrmStatus::DESCRIPTION_INVALID_TYPE_ERROR;
				}
				elseif (strlen($arField['DESCRIPTION']) > CCrmStatus::DESCRIPTION_MAX_LENGTH)
				{
					$error = GetMessage(
						'CRM_STATUS_ERR_DESCRIPTION_MAX_LENGTH_EXCEEDED',
						['#MAX_LENGTH#' => (string)CCrmStatus::DESCRIPTION_MAX_LENGTH],
					);
				}
				else
				{
					continue;
				}

				LocalRedirect($getRedirectUrl($error));
			}
		}
	}

	$arAdd = array();
	$arUpdate = array();
	$arDelete = array();

	foreach($_POST['LIST'] as $entityId => $arFields)
	{
		$arAdd = [];
		$arUpdate = [];
		$iPrevSort = 0;
		$CCrmStatus = false;
		$hasSemantics = isset($statusEntityTypes[$entityId]['SEMANTIC_INFO'])
			&& is_array($statusEntityTypes[$entityId]['SEMANTIC_INFO']);
		$entityTypeName = $hasSemantics
			? CCrmOwnerType::ResolveName((int)($statusEntityTypes[$entityId]['ENTITY_TYPE_ID'] ?? 0))
			: '';
		$kanbanEntity = $entityTypeName !== ''
			? \Bitrix\Crm\Kanban\Entity::getInstance($entityTypeName)
			: null;

		/* Here we can define our own class to process own status type (if we need).
		 * It may be inherited from CCrmStatus.
		 * For example see CCrmStatusInvoice.
		 */
		$events = GetModuleEvents("crm", "OnBeforeCrmStatusCreate");
		while ($arEvent = $events->Fetch())
		{
			$CCrmStatus = ExecuteModuleEventEx($arEvent, array($entityId));
			if ($CCrmStatus)
			{
				break;
			}
		}

		if (!$CCrmStatus)
		{
			$CCrmStatus = new CCrmStatus($entityId);
		}

		$error = '';
		if(array_key_exists('REMOVE', $arFields) && is_array($arFields['REMOVE']))
		{
			if(mb_strpos($fieldId, 'n') === 0)
			{
				continue;
			}
			$listField = array();
			foreach($arFields['REMOVE'] as $fieldId => $field)
			{
				$arCurrentData = $CCrmStatus->GetStatusById((int)$fieldId);
				if ($arCurrentData['SYSTEM'] === 'N')
				{
					$result = $CCrmStatus->Delete($fieldId);
					if(!$result)
					{
						$listField[] = '"'.$arCurrentData['NAME'].'"';
					}
					else
					{
						if ($kanbanEntity)
						{
							PullManager::getInstance()->sendStageDeletedEvent(
								$kanbanEntity->createPullStage($arCurrentData),
								[
									'TYPE' => $entityTypeName,
									'CATEGORY_ID' => (int)($arCurrentData['CATEGORY_ID'] ?? 0),
								],
							);
						}
					}
				}
				else
				{
					$arUpdate['NAME'] = trim($arCurrentData['NAME_INIT']);
					$CCrmStatus->Update($fieldId, $arUpdate);
				}
			}
			if(!empty($listField))
			{
				$langString = '';
				if(count($listField) > 1)
					$langString = '_MANY';

				$stringListField = implode(', ', $listField);
				$error = GetMessage('CRM_MODULE_ERROR_REMOVE_FIELD'.$langString,
					array('#field#' => $stringListField));
			}
		}

		if(!empty($error))
		{
			LocalRedirect($getRedirectUrl($error));
		}

		$existedStatuses = \Bitrix\Crm\StatusTable::getStatusesByEntityId($entityId);
		foreach($arFields as $id => $arField)
		{
			if (mb_strpos($id, 'n') === 0)
			{
				continue;
			}
			$semantics = $arField['SEMANTICS'] ?? '';
			$status = $arField['STATUS_ID'] ?? '';
			$sort = $arField['SORT'] ?? 0;
			// update final statues sort first:
			if (
				($semantics === PhaseSemantics::SUCCESS || $semantics === PhaseSemantics::FAILURE)
				&& ($existedStatuses[$status]['SORT'] ?? 0) < $sort
			)
			{
				$CCrmStatus->Update($id, [
					'SORT' => $sort
				]);
			}
		}

		foreach($arFields as $id => $arField)
		{
			$arField['SORT'] = (int)($arField['SORT'] ?? 0);
			if ($arField['SORT'] <= $iPrevSort)
			{
				$arField['SORT'] = $iPrevSort + 10;
			}

			$iPrevSort = $arField['SORT'];

			if (mb_strpos($id, 'n') === 0)
			{
				if (trim($arField['VALUE']) === "")
				{
					continue;
				}
				$arAdd['NAME'] = trim($arField['VALUE']);
				$arAdd['SORT'] = $arField['SORT'] ?? 0;
				$arAdd['COLOR'] = $arField['COLOR'] ?? '';
				if ($hasSemantics)
				{
					$arAdd['DESCRIPTION'] = $arField['DESCRIPTION'] ?? '';
				}
				else
				{
					unset($arAdd['DESCRIPTION']);
				}
				$arAdd['SEMANTICS'] = $arField['SEMANTICS'] ?? '';
				$arAdd['STATUS_ID'] = $arField['STATUS_ID'] ?? null;
				$arAdd['CATEGORY_ID'] = $arField['CATEGORY_ID'] ?? null;

				$id = $CCrmStatus->Add($arAdd);
				if (!$id)
				{
					LocalRedirect($getRedirectUrl($CCrmStatus->GetLastError()));
				}
				$arCurrentData = $CCrmStatus->GetStatusById($id);
				if(is_array($arCurrentData) && isset($arCurrentData['STATUS_ID']))
				{
					$arField['STATUS_ID'] = $arCurrentData['STATUS_ID'];
					if ($kanbanEntity)
					{
						PullManager::getInstance()->sendStageAddedEvent(
							$kanbanEntity->createPullStage($arCurrentData),
							[
								'TYPE' => $entityTypeName,
								'CATEGORY_ID' => (int)($arCurrentData['CATEGORY_ID'] ?? 0),
							],
						);
					}
				}
				else
				{
					$field["STATUS_ID"] = $id;
				}
			}
			else
			{
				$id = (int) $id;
				$arCurrentData = $CCrmStatus->GetStatusById($id);
				$color = $arField['COLOR'] ?? '';
				$description = $hasSemantics ? ($arField['DESCRIPTION'] ?? '') : '';
				if(!$arCurrentData)
				{
					continue;
				}
				if(
					trim($arField['VALUE']) != $arCurrentData['NAME']
					|| intval($arField['SORT']) != $arCurrentData['SORT']
					|| $color !== $arCurrentData['COLOR']
					|| ($hasSemantics && $description !== (string)($arCurrentData['DESCRIPTION'] ?? ''))
				)
				{
					$arUpdate['NAME'] = trim($arField['VALUE']);
					$arUpdate['SORT'] = $arField['SORT'];
					$arUpdate['COLOR'] = $color;
					if ($hasSemantics)
					{
						$arUpdate['DESCRIPTION'] = $description;
					}
					else
					{
						unset($arUpdate['DESCRIPTION']);
					}

					if (!$CCrmStatus->Update($id, $arUpdate))
					{
						LocalRedirect($getRedirectUrl($CCrmStatus->GetLastError()));
					}

					$arCurrentData = $CCrmStatus->GetStatusById($id);
					if ($kanbanEntity && is_array($arCurrentData) && isset($arCurrentData['STATUS_ID']))
					{
						PullManager::getInstance()->sendStageUpdatedEvent(
							$kanbanEntity->createPullStage($arCurrentData),
							[
								'TYPE' => $entityTypeName,
								'CATEGORY_ID' => (int)($arCurrentData['CATEGORY_ID'] ?? 0),
							],
						);
					}
				}
			}
		}
	}

	LocalRedirect($getRedirectUrl());
}

$arResult['HEADERS'] = array();
$arResult['ROWS'] = array();
$arResult['ENTITY'] = array();
$settings = array();
$colorSchemes = array();

foreach($statusEntityTypes as $entityId => $arEntityType)
{
	if (isset($arEntityType['IS_ENABLED']) && $arEntityType['IS_ENABLED'] === false)
	{
		continue;
	}

	$arResult['HEADERS'][$entityId] = $arEntityType['NAME'];
	$arResult['ROWS'][$entityId] = Array();

	if(isset($arEntityType['SEMANTIC_INFO']) && is_array($arEntityType['SEMANTIC_INFO']))
	{
		$arResult['ENTITY'][$entityId] = $arEntityType['SEMANTIC_INFO'];
		$arResult['ENTITY'][$entityId]['ENTITY_TYPE_ID'] = (int)($arEntityType['ENTITY_TYPE_ID'] ?? 0);
		$arResult['ENTITY'][$entityId]['ENTITY_TYPE_NAME'] = CCrmOwnerType::ResolveName(
			$arResult['ENTITY'][$entityId]['ENTITY_TYPE_ID']
		);
		if (isset($arEntityType['CATEGORY_ID']))
		{
			$arResult['ENTITY'][$entityId]['CATEGORY_ID'] = $arEntityType['CATEGORY_ID'];
		}

		$entityTypeId = (int)($arEntityType['ENTITY_TYPE_ID'] ?? 0);
		$parentEntityID = isset($arEntityType['PARENT_ID']) ? $arEntityType['PARENT_ID'] : '';
		$isStageEntity = \CCrmOwnerType::isUseDynamicTypeBasedApproach($entityTypeId)
			|| in_array($entityTypeId, [
				CCrmOwnerType::Lead,
				CCrmOwnerType::Deal,
				CCrmOwnerType::Quote,
				CCrmOwnerType::SmartInvoice,
			], true);
		$addCaption = GetMessage("CRM_STATUS_ADD_{$entityId}");
		if ($isStageEntity)
		{
			$addCaption = GetMessage("CRM_STATUS_ADD_DEAL_STAGE");
		}
		if($addCaption == '' && $parentEntityID !== '')
		{
			$addCaption = GetMessage("CRM_STATUS_ADD_{$parentEntityID}");
		}
		$arResult['ENTITY'][$entityId]['ADD_CAPTION'] = $addCaption;

		$defaultName = GetMessage("CRM_STATUS_DEFAULT_NAME_{$entityId}");
		if ($isStageEntity)
		{
			$defaultName = GetMessage('CRM_STATUS_DEFAULT_NAME_DEAL_STAGE');
		}
		if($defaultName == '' && $parentEntityID !== '')
		{
			$defaultName = GetMessage("CRM_STATUS_DEFAULT_NAME_{$parentEntityID}");
		}
		$arResult['ENTITY'][$entityId]['DEFAULT_NAME'] = $defaultName;

		$deletionConfirmation = GetMessage("CRM_STATUS_DELETION_CONFIRMATION_{$entityId}");
		if($deletionConfirmation == '' && $parentEntityID !== '')
		{
			$deletionConfirmation = GetMessage("CRM_STATUS_DELETION_CONFIRMATION_{$parentEntityID}");
		}
		$arResult['ENTITY'][$entityId]['DELETION_CONFIRMATION'] = $deletionConfirmation;
	}
}

$list = \Bitrix\Crm\StatusTable::getList([
	'order' => [
		'SORT' => 'ASC',
	],
]);
while($status = $list->fetch())
{
	if (isset($availableStatusEntityIds[$status['ENTITY_ID']]))
	{
		$arResult['ROWS'][$status['ENTITY_ID']][$status['ID']] = $status;
	}
}

$entityNumbers = [];

/* Preparation of data for different settings */
foreach($arResult['ENTITY'] as $entityId => $dataEntity)
{
	$arResult['INITIAL_FIELDS'][$entityId] = array();
	$arResult['EXTRA_FIELDS'][$entityId] = array();
	$arResult['FINAL_FIELDS'][$entityId] = array();
	$arResult['EXTRA_FINAL_FIELDS'][$entityId] = array();
	$arResult['SUCCESS_FIELDS'][$entityId] = array();
	$arResult['UNSUCCESS_FIELDS'][$entityId] = array();
	$number = 1;
	$colorOffset = -1;
	foreach($arResult['ROWS'][$entityId] as $status)
	{
		$status['NUMBER'] = $number;
		if(
			$status['SEMANTICS'] !== \Bitrix\Crm\PhaseSemantics::SUCCESS
			&& $status['SEMANTICS'] !== \Bitrix\Crm\PhaseSemantics::FAILURE
		)
		{
			$colorOffset++;
		}
		if(empty($status['COLOR']))
		{
			$status['COLOR'] = PhaseColorScheme::getDefaultColorBySemantics($status['SEMANTICS'], [
				'offset' => $colorOffset,
			]);
		}
		$arResult['ROWS'][$entityId][$status['ID']]['COLOR'] = $status['COLOR'];
		if (empty($arResult['INITIAL_FIELDS'][$entityId]))
		{
			$arResult['INITIAL_FIELDS'][$entityId] = $status;
			$arResult['SUCCESS_FIELDS'][$entityId][] = $status;
		}
		elseif($status['SEMANTICS'] === \Bitrix\Crm\PhaseSemantics::SUCCESS)
		{
			$arResult['FINAL_FIELDS'][$entityId]['SUCCESSFUL'] = $status;
			$arResult['SUCCESS_FIELDS'][$entityId][] = $status;
		}
		elseif($status['SEMANTICS'] === \Bitrix\Crm\PhaseSemantics::FAILURE)
		{
			if(!isset($arResult['FINAL_FIELDS'][$entityId]['UNSUCCESSFUL']))
			{
				$arResult['FINAL_FIELDS'][$entityId]['UNSUCCESSFUL'] = $status;
			}
			else
			{
				$arResult['EXTRA_FINAL_FIELDS'][$entityId][] = $status;
			}
			$arResult['UNSUCCESS_FIELDS'][$entityId][] = $status;
		}
		else
		{
			$arResult['EXTRA_FIELDS'][$entityId][] = $status;
			$arResult['SUCCESS_FIELDS'][$entityId][] = $status;
		}
		$number++;
	}
	$entityNumbers[$entityId] = $number;
}

foreach($arResult['ENTITY'] as $entityId => $dataEntity)
{
	if(empty($arResult['FINAL_FIELDS'][$entityId]['SUCCESSFUL']))
	{
		$sort = 1000;
		if(!empty($arResult['FINAL_FIELDS'][$entityId]['UNSUCCESSFUL']))
		{
			$sort = $arResult['FINAL_FIELDS'][$entityId]['UNSUCCESSFUL']['SORT'] - 5;
		}
		$finalStatusId = $dataEntity['FINAL_SUCCESS_FIELD'];
		$existingStatusIds = array_column($arResult['ROWS'][$entityId], 'STATUS_ID');
		if(in_array($finalStatusId, $existingStatusIds))
		{
			$finalStatusId = \Bitrix\Main\Security\Random::getString(5);
		}
		$successfulField = [
			'ID' => 'n' . $entityNumbers[$entityId],
			'NUMBER' => $entityNumbers[$entityId],
			'NAME' => '',
			'DESCRIPTION' => '',
			'COLOR' => PhaseColorScheme::getDefaultColorBySemantics(\Bitrix\Crm\PhaseSemantics::SUCCESS),
			'ENTITY_ID' => $entityId,
			'SEMANTICS' => \Bitrix\Crm\PhaseSemantics::SUCCESS,
			'SORT' => $sort,
			'STATUS_ID' => $finalStatusId,
			'CATEGORY_ID' => $dataEntity['CATEGORY_ID'] ?? null,
			'SYSTEM' => 'N',
		];
		$arResult['FINAL_FIELDS'][$entityId]['SUCCESSFUL'] = $successfulField;
		$arResult['ROWS'][$entityId][$successfulField['ID']] = $successfulField;
	}
}

$arResult['NEED_FOR_FIX_STATUSES'] = false;
if(CCrmPerms::IsAdmin() && COption::GetOptionString('crm', '~CRM_FIX_STATUSES', 'N') === 'Y')
{
	$arResult['NEED_FOR_FIX_STATUSES'] = true;
}

$arResult['RAND_STRING'] = $this->randString();

CUtil::InitJSCore();
$arResult['ENABLE_CONTROL_PANEL'] = isset($arParams['ENABLE_CONTROL_PANEL']) ? $arParams['ENABLE_CONTROL_PANEL'] : true;
$this->IncludeComponentTemplate();
$APPLICATION->AddChainItem(GetMessage('CRM_FIELDS_ENTITY_LIST'), $arResult['~ENTITY_LIST_URL'] ?? null);
