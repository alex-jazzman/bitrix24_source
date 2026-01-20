<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Automation\Engine\ConditionGroup;
use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\Public\Provider\StorageItemProvider;
use Bitrix\Bizproc\Public\Command\StorageItem\DeleteStorageItemCommand;
use Bitrix\Bizproc\Public\Provider\StorageTypeProvider;
use Bitrix\Main\ErrorCollection;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Error;
use Bitrix\Main\Result;
use Bitrix\Bizproc\Activity\BaseActivity;
use Bitrix\Bizproc\Internal\Service\StorageField\FieldService;

/**
 * @property-write int StorageId
 * @property-write array DynamicFilterFields
 * @property-write int ItemId
 * @property-write string DeleteMode
 * @property-write string StorageCode
 */
class CBPDeleteDataStorageActivity extends BaseActivity
{
	use \Bitrix\Bizproc\Activity\Mixins\EntityFilter;

	private const DELETE_MODE_MULTIPLE = 'multiple';
	private const DELETE_MODE_ALL = 'all';
	private const DELETE_LIMIT = 500;

	private ?array $filterCache = null;

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			'Title' => '',
			'StorageId' => 0,
			'DynamicFilterFields' => ['items' => []],
			'ItemId' => 0,
			'DeleteMode' => static::DELETE_MODE_MULTIPLE,
			'StorageCode' => '',
		];

		$this->setPropertiesTypes([
			'StorageId' => ['Type' => FieldType::INT],
			'DeleteMode' => ['Type' => FieldType::STRING],
		]);
	}

	protected function prepareProperties(): void
	{
		parent::prepareProperties();

		if ($this->DeleteMode === self::DELETE_MODE_MULTIPLE)
		{
			try
			{
				$this->preparedProperties['ItemId'] = $this->findStorageItemId();
			}
			catch (\Bitrix\Main\ArgumentException $exception)
			{
				$this->preparedProperties['ItemId'] = 0;
			}
		}
	}

	protected function findStorageItemId(): int
	{
		$storageId = $this->findStorageId();
		if (!$storageId)
		{
			return 0;
		}

		$provider = new StorageItemProvider($storageId);
		$filter = $this->getPreparedFilter($storageId);
		$item = $provider->getItems([
			'filter' => $filter,
			'select' => ['ID'],
			'order' => ['CREATED_TIME' => 'DESC']
		])?->getFirstCollectionItem();

		return $item ? $item->getId() : 0;
	}

	protected function deleteStorageItemIds(int $storageId): void
	{
		$filter = $this->getPreparedFilter($storageId);
 		\Bitrix\Bizproc\Infrastructure\Stepper\StorageItemDeleteStepper::bindStorage($storageId, $filter);
	}

	protected function deleteAllStorageItemIds(int $storageId): void
	{
		\Bitrix\Bizproc\Infrastructure\Stepper\StorageItemDeleteStepper::bindStorage($storageId);
	}

	private function findStorageId(): int
	{
		$storageId = (int)$this->StorageId;
		if ($storageId > 0)
		{
			return $storageId;
		}

		$rawStorageCode = $this->StorageCode;
		$storageCode = CBPHelper::hasStringRepresentation($rawStorageCode) ? (string)$rawStorageCode : '';
		if (!$storageCode)
		{
			return 0;
		}

		$provider = new StorageTypeProvider();
		$type = $provider->getType(['CODE' => $storageCode], ['ID']);

		return (int)$type?->getId();
	}

	protected function checkProperties(): \Bitrix\Main\ErrorCollection
	{
		$errors = parent::checkProperties();

		$storageId = (int)$this->StorageId;
		if (!$storageId && empty($this->StorageCode))
		{
			$errors->setError(new Error(Loc::getMessage('BIZPROC_SDA_STORAGE_NOT_SELECTED')));
		}

		if ($this->DeleteMode === self::DELETE_MODE_MULTIPLE && $this->ItemId <= 0)
		{
			$errors->setError(new Error(Loc::getMessage('BIZPROC_SDA_ITEM_NOT_FOUND')));
		}

		if (!in_array($this->DeleteMode, [self::DELETE_MODE_MULTIPLE, self::DELETE_MODE_ALL]))
		{
			$errors->setError(new Error(Loc::getMessage('BIZPROC_SDA_INVALID_DELETE_MODE')));
		}

		return $errors;
	}

	protected function internalExecute(): \Bitrix\Main\ErrorCollection
	{
		$errors = parent::internalExecute();

		$storageId = $this->findStorageId();
		if ($storageId <= 0)
		{
			$errors->setError(new Error(Loc::getMessage('BIZPROC_SDA_STORAGE_NOT_FOUND')));
		}

		$this->arProperties['StorageId'] = $storageId;
		$this->preparedProperties['StorageId'] = $storageId;

		try
		{
			match ($this->DeleteMode)
			{
				self::DELETE_MODE_MULTIPLE => $this->deleteStorageItemIds($storageId),
				self::DELETE_MODE_ALL => $this->deleteAllStorageItemIds($storageId),
			};
		}
		catch (\Throwable $exception)
		{
			$errors->setError(new Error($exception->getMessage()));
		}

		return $errors;
	}

	protected function reInitialize()
	{
		parent::reInitialize();

		$this->arProperties['ItemId'] = 0;
		$this->preparedProperties['ItemId'] = 0;
	}

	protected static function getFileName(): string
	{
		return __FILE__;
	}

	public static function GetPropertiesDialog(
		$documentType,
		$activityName,
		$workflowTemplate,
		$workflowParameters,
		$workflowVariables,
		$currentValues = null,
		$formName = '',
		$popupWindow = null,
		$siteId = ''
	)
	{
		$dialog = parent::GetPropertiesDialog(...func_get_args());
		$dialog->setRuntimeData([
			'DocumentName' => static::getDocumentService()->getEntityName($documentType[0], $documentType[1]),
			'DocumentFields' => array_values(\Bitrix\Bizproc\Automation\Helper::getDocumentFields($documentType)),
		]);

		return $dialog;
	}

	protected static function extractPropertiesValues(PropertiesDialog $dialog, array $fieldsMap): Result
	{
		$simpleMap = $fieldsMap;
		unset($simpleMap['DynamicFilterFields']);
		$result = parent::extractPropertiesValues($dialog, $simpleMap);

		if ($result->isSuccess())
		{
			$currentValues = $result->getData();
			$currentValues['StorageId'] = (int)$currentValues['StorageId'];
			$currentValues['DynamicFilterFields'] = static::extractFilterFromProperties($dialog, $fieldsMap)->getData();
			$currentValues['DeleteMode'] = (string)($currentValues['DeleteMode'] ?: self::DELETE_MODE_MULTIPLE);

			$result->setData($currentValues);
		}

		return $result;
	}

	public static function getPropertiesDialogMap(?\Bitrix\Bizproc\Activity\PropertiesDialog $dialog = null): array
	{
		$filteringFieldsMap = [
			0 => array_values(static::getFilteringFieldsMap(0))
		];
		$storages = static::getStorageTypes();

		foreach ($storages as $id => $title)
		{
			$filteringFieldsMap[$id] = array_values(static::getFilteringFieldsMap((int)$id));
		}

		return [
			'StorageId' => [
				'Name' => Loc::getMessage('BIZPROC_SDA_STORAGE_ID_PROPERTY'),
				'FieldName' => 'storage_id',
				'Type' => FieldType::SELECT,
				'Options' => $storages,
				'Required' => false,
				'AllowSelection' => false,
			],
			'StorageCode' => [
				'Name' => '',
				'FieldName' => 'storage_code',
				'Description' => Loc::getMessage('BIZPROC_SDA_STORAGE_CODE_DESCRIPTION'),
				'Type' => FieldType::STRING,
				'Required' => false,
				'AllowSelection' => true,
			],
			'DynamicFilterFields' => [
				'Name' => Loc::getMessage('BIZPROC_SDA_FILTER_FIELDS_PROPERTY'),
				'FieldName' => 'filter_fields',
				'Map' => $filteringFieldsMap,
				'Getter' => function($dialog, $property, $currentActivity, $compatible) {
					return $currentActivity['Properties']['DynamicFilterFields'];
				},
			],
			'DeleteMode' => [
				'Name' => Loc::getMessage('BIZPROC_SDA_DELETE_MODE'),
				'FieldName' => 'delete_mode',
				'Type' => FieldType::SELECT,
				'Options' => [
					static::DELETE_MODE_MULTIPLE => Loc::getMessage('BIZPROC_SDA_DELETE_MODE_MULTIPLE'),
					static::DELETE_MODE_ALL => Loc::getMessage('BIZPROC_SDA_DELETE_MODE_ALL'),
				],
				'Required' => true,
				'AllowSelection' => false,
			],
		];
	}

	protected static function getFilteringFieldsMap(int $storageId): array
	{
		$supportedFields = [
			'ID',
			'CODE',
			'WORKFLOW_ID',
			'DOCUMENT_ID',
			'TEMPLATE_ID',
			'CREATED_BY',
			'CREATED_TIME'
		];

		$map = [];
		$fieldService = new FieldService($storageId);
		$fields = $fieldService->getEntityFields();

		foreach ($fields as $key => $field)
		{
			if (in_array($field['ID'], $supportedFields, true))
			{
				$map[$field['ID']] = [
					'Id' => $field['ID'],
					'Name' => $field['NAME'],
					'Type' => $field['TYPE'],
					'Expression' => "{{{$field['NAME']}}}",
					'SystemExpression' => "{=Storage:{$field['ID']}}",
					'Options' => null,
					'Settings' => null,
					'Multiple' => false,
				];
			}
		}

		return $map;
	}

	private static function getStorageTypes(): array
	{
		$options = [];

		$provider = new \Bitrix\Bizproc\Public\Provider\StorageTypeProvider();
		$storages = $provider->getAllForActivity();

		foreach ($storages as $storage)
		{
			$options[$storage->getId()] = $storage->getTitle();
		}

		return $options;
	}

	private function prepareFilterContext(int $storageId): array
	{
		$conditionGroup = new ConditionGroup($this->DynamicFilterFields);
		$documentType = \Bitrix\Bizproc\Public\Entity\Document\Workflow::getComplexType();
		$fieldsMap = static::getFilteringFieldsMap($storageId);

		return $this->getOrmFilter($conditionGroup, $documentType, $fieldsMap);
	}

	private function getPreparedFilter(int $storageId): array
	{
		if (!isset($this->filterCache[$storageId]))
		{
			$this->filterCache[$storageId] = $this->prepareFilterContext($storageId);
		}

		return $this->filterCache[$storageId];
	}
}