<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm;
use Bitrix\Crm\Conversion\ConversionManager;
use Bitrix\Crm\Integration\BizProc\Document\Item;
use Bitrix\Crm\RelationIdentifier;
use Bitrix\Crm\Service\Container;

class CBPCrmGetConversionDataActivity extends CBPActivity implements IBPConfigurableActivity
{
	private array $fieldsMap = [];

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			'Title' => '',
			'TargetEntityType' => null,
			'TargetEntityFields' => null,
		];
	}

	protected function ReInitialize()
	{
		parent::ReInitialize();
		foreach ($this->fieldsMap as $field)
		{
			$this->__set($field, null);
		}
		$this->fieldsMap = [];
	}

	public function Execute()
	{
		if (!CModule::IncludeModule('crm'))
		{
			return CBPActivityExecutionStatus::Closed;
		}

		$targetEntityType = $this->TargetEntityType;
		if (!$targetEntityType)
		{
			$this->WriteToTrackingService(GetMessage('CRM_GCDA_EMPTY_TARGET'), 0, CBPTrackingType::Error);

			return CBPActivityExecutionStatus::Closed;
		}

		$documentId = $this->GetDocumentId();
		if ($documentId[0] !== 'crm')
		{
			$this->WriteToTrackingService(GetMessage('CRM_GCDA_INCORRECT_DOCUMENT'), 0, CBPTrackingType::Error);

			return CBPActivityExecutionStatus::Closed;
		}

		$this->logDebugInput();

		[$entityTypeName, $entityId] = explode('_', $documentId[2]);
		$entityTypeId = \CCrmOwnerType::ResolveID($entityTypeName);
		$targetEntityTypeId = \CCrmOwnerType::ResolveID($targetEntityType);

		try
		{
			// The conversion wizard serves only legacy targets; dynamic-type targets go through the
			// conversion mapper and must not depend on a legacy conversion config being present.
			if (\CCrmOwnerType::isUseDynamicTypeBasedApproach($targetEntityTypeId))
			{
				$mappedFields = self::mapEntityFieldsByConversionMapper(
					$entityTypeId,
					(int)$entityId,
					$targetEntityTypeId,
				);
			}
			else
			{
				$wizard = $this->createWizard($entityTypeId, (int)$entityId);
				if (!$wizard)
				{
					$this->WriteToTrackingService(GetMessage('CRM_GCDA_CONVERTER_NOT_FOUND'), 0, CBPTrackingType::Error);

					return CBPActivityExecutionStatus::Closed;
				}

				$mappedFields = $wizard->mapEntityFields($targetEntityTypeId, []);
			}

			$dstFields = $this->normalizeFields($mappedFields);
		}
		catch (\Throwable $e)
		{
			$this->WriteToTrackingService($e->getMessage(), 0, CBPTrackingType::Error);

			return CBPActivityExecutionStatus::Closed;
		}

		if (empty($dstFields))
		{
			$this->WriteToTrackingService(GetMessage('CRM_GCDA_EMPTY_RESULT'), 0, CBPTrackingType::Error);

			return CBPActivityExecutionStatus::Closed;
		}

		$this->SetProperties($dstFields);
		$this->fieldsMap = array_keys($dstFields);

		$this->logDebugResult($dstFields);

		return CBPActivityExecutionStatus::Closed;
	}

	private function createWizard(int $entityTypeId, int $entityId): ?Crm\Conversion\EntityConversionWizard
	{
		if ($entityTypeId === \CCrmOwnerType::Lead)
		{
			$config = new Crm\Conversion\LeadConversionConfig();
		}
		elseif ($entityTypeId === \CCrmOwnerType::Deal)
		{
			$config = ConversionManager::getConfig(\CCrmOwnerType::Deal);
			if (!$config)
			{
				return null;
			}
		}
		else
		{
			return null;
		}

		$config->enablePermissionCheck(false);

		$wizard = ConversionManager::getWizard($entityTypeId, $entityId, $config);
		if (!$wizard)
		{
			return null;
		}

		$wizard->enableUserFieldCheck(false);
		$wizard->enableBizProcCheck(false);

		return $wizard;
	}

	private function logDebugInput(): void
	{
		if ($this->workflow->isDebug())
		{
			$this->writeDebugInfo($this->getDebugInfo());
		}
	}

	private function logDebugResult(array $fields): void
	{
		if ($this->workflow->isDebug())
		{
			$debugInfo = $this->getDebugInfo(
				$fields,
				array_combine(array_keys($fields), array_keys($fields))
			);
			$this->writeDebugInfo($debugInfo);
		}
	}

	protected static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [
			'TargetEntityType' => [
				'Name' => GetMessage('CRM_GCDA_TARGET_ENTITY_TYPE'),
				'FieldName' => 'target_entity_type',
				'Type' => 'select',
				'Required' => true,
				'Options' => static::getTargetEntityOptions($documentType),
				'AllowSelection' => false,
				'Setter' => static::getTargetEntityTypePropertySetter($documentType),
			],
		];
	}

	/**
	 * The unified form submits the target entity only, while Execute() and the declared additional
	 * result also need the derived TargetEntityFields map, so this field owns the write of both.
	 */
	private static function getTargetEntityTypePropertySetter(array $documentType): Closure
	{
		return static fn($value): array => self::buildActivityProperties($documentType, $value);
	}

	private static function buildActivityProperties(array $documentType, $targetEntityType): array
	{
		$properties = [
			'TargetEntityType' => $targetEntityType,
		];

		// Build TargetEntityFields from EntityConversionMap
		if ($targetEntityType && CModule::IncludeModule('crm'))
		{
			$srcEntityTypeId = self::resolveSourceEntityTypeId($documentType);
			if ($srcEntityTypeId !== null)
			{
				$dstEntityTypeId = \CCrmOwnerType::ResolveID($targetEntityType);

				$map = self::loadConversionMap($srcEntityTypeId, $dstEntityTypeId);
				if ($map)
				{
					$properties['TargetEntityFields'] = self::buildTargetEntityFields($dstEntityTypeId, $map);
				}
			}
		}

		return $properties;
	}

	private static function loadConversionMap(int $srcEntityTypeId, int $dstEntityTypeId): ?Crm\Conversion\EntityConversionMap
	{
		try
		{
			return Container::getInstance()->getConversionMapper()->getMap(
				new RelationIdentifier($srcEntityTypeId, $dstEntityTypeId),
			);
		}
		catch (Exception $e)
		{
			return null;
		}
	}

	private static function getTargetEntityOptions(array $documentType): array
	{
		$options = [];

		if (!CModule::IncludeModule('crm'))
		{
			return $options;
		}

		$srcEntityTypeId = self::resolveSourceEntityTypeId($documentType);
		if ($srcEntityTypeId === null)
		{
			return $options;
		}

		foreach (ConversionManager::getDestinationEntityTypeIDs($srcEntityTypeId) as $dstEntityTypeId)
		{
			$dstTypeName = \CCrmOwnerType::ResolveName($dstEntityTypeId);
			if ($dstTypeName === '')
			{
				continue;
			}
			$options[$dstTypeName] = \CCrmOwnerType::GetDescription($dstEntityTypeId);
		}

		return $options;
	}

	private static function resolveSourceEntityTypeId(array $documentType): ?int
	{
		if (!isset($documentType[1]))
		{
			return null;
		}

		return match ($documentType[1])
		{
			'CCrmDocumentLead' => \CCrmOwnerType::Lead,
			'CCrmDocumentDeal' => \CCrmOwnerType::Deal,
			default => null,
		};
	}

	public static function ValidateProperties($arTestProperties = [], ?CBPWorkflowTemplateUser $user = null)
	{
		$errors = [];

		if (empty($arTestProperties['TargetEntityType']))
		{
			$errors[] = [
				'code' => 'NotExist',
				'parameter' => 'TargetEntityType',
				'message' => GetMessage('CRM_GCDA_EMPTY_TARGET'),
			];
		}

		return array_merge($errors, parent::ValidateProperties($arTestProperties, $user));
	}

	public static function GetPropertiesDialog(
		$documentType,
		$activityName,
		$arWorkflowTemplate,
		$arWorkflowParameters,
		$arWorkflowVariables,
		$arCurrentValues = null,
		$formName = '',
		$popupWindow = null,
		$siteId = '',
	)
	{
		if (!CModule::IncludeModule('crm'))
		{
			return '';
		}

		$dialog = new \Bitrix\Bizproc\Activity\PropertiesDialog(__FILE__, [
			'documentType' => $documentType,
			'activityName' => $activityName,
			'workflowTemplate' => $arWorkflowTemplate,
			'workflowParameters' => $arWorkflowParameters,
			'workflowVariables' => $arWorkflowVariables,
			'currentValues' => $arCurrentValues,
			'formName' => $formName,
			'siteId' => $siteId,
		]);

		$dialog->setMap(static::getPropertiesMap($documentType));

		return $dialog;
	}

	public static function GetPropertiesDialogValues(
		$documentType,
		$activityName,
		&$arWorkflowTemplate,
		&$arWorkflowParameters,
		&$arWorkflowVariables,
		$arCurrentValues,
		&$errors,
	)
	{
		$errors = [];

		$properties = self::buildActivityProperties($documentType, $arCurrentValues['target_entity_type'] ?? null);

		$errors = self::ValidateProperties(
			$properties,
			new CBPWorkflowTemplateUser(CBPWorkflowTemplateUser::CurrentUser),
		);

		if ($errors)
		{
			return false;
		}

		$currentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
		$currentActivity['Properties'] = $properties;

		return true;
	}

	private static function mapEntityFieldsByConversionMapper(
		int $srcEntityTypeId,
		int $entityId,
		int $targetEntityTypeId,
	): array
	{
		$srcFactory = Container::getInstance()->getFactory($srcEntityTypeId);
		if (!$srcFactory)
		{
			return [];
		}

		$map = self::loadConversionMap($srcEntityTypeId, $targetEntityTypeId);
		if (!$map)
		{
			return [];
		}

		$sourceFields = [];
		foreach ($map->getItems() as $mapItem)
		{
			if ($mapItem->getDestinationField() === '-')
			{
				continue;
			}

			$sourceFields[] = $mapItem->getSourceField();
		}

		if (!$sourceFields)
		{
			return [];
		}

		$sourceItem = $srcFactory->getItem($entityId, array_values(array_unique($sourceFields)));
		if (!$sourceItem)
		{
			return [];
		}

		$fields = [];
		foreach ($map->getItems() as $mapItem)
		{
			$dstFieldId = $mapItem->getDestinationField();
			if ($dstFieldId === '-')
			{
				continue;
			}

			$fields[$dstFieldId] = $sourceItem->get($mapItem->getSourceField());

			if ($mapItem->getSourceField() === Crm\Item::FIELD_NAME_PRODUCTS)
			{
				$fields[$dstFieldId] = $sourceItem->getProductRows()
					? $sourceItem->getProductRows()->toArray()
					: [];
			}
		}

		return $fields;
	}

	private static function buildTargetEntityFields(
		int $dstEntityTypeId,
		Crm\Conversion\EntityConversionMap $map,
	): array
	{
		try
		{
			$documentFields = Item::getEntityFields($dstEntityTypeId);
		}
		catch (\Throwable)
		{
			return [];
		}

		$factory = Container::getInstance()->getFactory($dstEntityTypeId);
		$targetEntityFields = [];

		$multifieldKeys = ['PHONE' => true, 'EMAIL' => true, 'WEB' => true, 'IM' => true, 'LINK' => true];

		foreach ($map->getItems() as $mapItem)
		{
			$fieldId = $mapItem->getDestinationField();
			if ($fieldId === '' || $fieldId === '-')
			{
				continue;
			}

			if ($fieldId === Crm\Item::FIELD_NAME_FM)
			{
				foreach (array_keys($multifieldKeys) as $multifieldKey)
				{
					if (isset($documentFields[$multifieldKey]))
					{
						$targetEntityFields[$multifieldKey] = $documentFields[$multifieldKey];
					}
				}
				continue;
			}

			$documentField = self::findDocumentField($factory, $fieldId, $documentFields);
			if ($documentField !== null)
			{
				$targetEntityFields[$fieldId] = $documentField;
			}
		}

		return $targetEntityFields;
	}

	private static function findDocumentField(
		?Crm\Service\Factory $factory,
		string $fieldId,
		array $documentFields,
	): ?array
	{
		$lookupKeys = [$fieldId];
		if ($factory)
		{
			$entityFieldName = $factory->getEntityFieldNameByMap($fieldId);
			$lookupKeys[] = $entityFieldName;
			$lookupKeys[] = Item::convertFieldId($entityFieldName);
		}

		foreach (array_unique($lookupKeys) as $lookupKey)
		{
			if ($lookupKey !== '' && isset($documentFields[$lookupKey]))
			{
				return $documentFields[$lookupKey];
			}
		}

		return null;
	}

	private function normalizeFields(array $mappedFields): array
	{
		$entityFields = [];
		foreach ($mappedFields as $k => $v)
		{
			if ($k === 'FM')
			{
				$this->internalizeMultifieldData($v, $entityFields);
			}
			else
			{
				$entityFields[$k] = $v;
			}
		}

		return $entityFields;
	}

	private function internalizeMultifieldData(array $data, array &$entityFields): void
	{
		foreach ($data as $typeName => $items)
		{
			if (!isset($entityFields[$typeName]))
			{
				$entityFields[$typeName] = [];
			}

			foreach ($items as $itemID => $item)
			{
				$entityFields[$typeName][] = array_merge(['ID' => $itemID], $item);
			}
		}
	}
}
