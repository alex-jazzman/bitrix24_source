<?php

namespace Bitrix\Crm\Controller;

use Bitrix\Crm\Component\EntityDetails\FactoryBased;
use Bitrix\Crm\Entity\EntityEditorConfigScope;
use Bitrix\Crm\Field;
use Bitrix\Crm\Kanban\Entity\Deadlines;
use Bitrix\Crm\Kanban\ViewMode;
use Bitrix\Crm\Multifield\Assembler;
use Bitrix\Crm\Service;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\EditorAdapter;
use Bitrix\Crm\Settings\RestSettings;
use Bitrix\Main\Component\ParameterSigner;
use Bitrix\Main\Engine\ActionFilter\Csrf;
use Bitrix\Main\Engine\Response\BFile;
use Bitrix\Main\Engine\Response\Component;
use Bitrix\Main\Engine\Response\Converter;
use Bitrix\Main\Engine\Response\DataType\Page;
use Bitrix\Main\Error;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\NotSupportedException;
use Bitrix\Main\ORM\Fields\Relations\Relation;
use Bitrix\Main\Type\Collection;
use Bitrix\Main\UI\PageNavigation;

class Item extends Base
{
	public const MAX_IMPORT_BATCH_SIZE = 20;

	public function configureActions(): array
	{
		$configureActions = parent::configureActions();
		$configureActions['getFile'] = [
			'-prefilters' => [
				Csrf::class,
			],
		];

		return $configureActions;
	}

	protected function getFactory(int $entityTypeId): ?Service\Factory
	{
		if (!\CCrmOwnerType::isUseFactoryBasedApproach($entityTypeId))
		{
			$this->addError(ErrorCode::getEntityTypeNotSupportedError($entityTypeId));

			return null;
		}

		$factory = Container::getInstance()->getFactory($entityTypeId);
		if (!$factory)
		{
			$this->addError(new Error(
					Loc::getMessage('CRM_TYPE_TYPE_NOT_FOUND'),
					ErrorCode::NOT_FOUND)
			);

			return null;
		}

		Container::getInstance()->getItemConverter()->preprocessUpperFieldNames(array_keys($factory->getFieldsInfo()));

		return $factory;
	}

	/**
	 * Return data about item by $id.
	 */
	public function getAction(int $id, int $entityTypeId, string $useOriginalUfNames = 'N'): ?array
	{
		$factory = $this->getFactory($entityTypeId);
		if (!$factory)
		{
			return null;
		}

		$select = ['*'];
		if ($factory->isMultiFieldsEnabled())
		{
			$select = array_merge(
				$select,
				$this->getMultiFields(),
			);
		}

		$item = $factory->getItems([
			'select' => $select,
			'filter' => ['=ID' => $id],
		])[0] ?? null;

		if (!$item)
		{
			$this->addError(new Error(
				Loc::getMessage('CRM_TYPE_ITEM_NOT_FOUND'),
				ErrorCode::NOT_FOUND
			));

			return null;
		}
		if (!Container::getInstance()->getUserPermissions()->item()->canReadItem($item))
		{
			$this->addError(new Error(
				Loc::getMessage('CRM_COMMON_READ_ACCESS_DENIED'),
				ErrorCode::ACCESS_DENIED
			));

			return null;
		}

		$items = $this->getJsonForItems($factory, [$item], null, $useOriginalUfNames === 'Y');

		return [
			'item' => $items[$item->getId()],
		];
	}

	public function listAction(
		int $entityTypeId,
		array $select = ['*'],
		array $order = null,
		array $filter = null,
		PageNavigation $pageNavigation = null,
		string $useOriginalUfNames = 'N',
	): ?Page
	{
		$factory = $this->getFactory($entityTypeId);
		if (!$factory)
		{
			return null;
		}
		$parameters = [];

		$isUseOriginalFieldNames = $useOriginalUfNames === 'Y';
		$select = array_combine($select, $select);
		$select = $this->convertFieldNamesToUpper($select, $isUseOriginalFieldNames);
		$select = array_keys($select);

		$select = $this->prepareSelect($factory, $select);
		$parameters['select'] = $select;

		$parameters['filter'] = $this->convertFieldNamesToUpper((array)$filter, $isUseOriginalFieldNames, true);
		$parameters['filter'] = $this->prepareFilter($factory, $parameters['filter']);

		$allowedFields = $factory->getFieldsCollection()->getFieldNameList();

		$dataClassFields = $factory->getDataClass()::getEntity()->getFields();
		$hasContactIdsField = false;
		foreach ($dataClassFields as $field)
		{
			if ($field->getName() === \Bitrix\Crm\Item::FIELD_NAME_CONTACT_BINDINGS)
			{
				$hasContactIdsField = true;
			}

			if (!($field instanceof Relation) && !in_array($field->getName(), $allowedFields))
			{
				$allowedFields[] = $field->getName();
			}
		}

		if (!$this->validateFilter($parameters['filter'], $allowedFields))
		{
			return null;
		}

		if ($factory->isObserversEnabled() && array_key_exists('OBSERVERS', $parameters['filter']))
		{
			$parameters['filter']['OBSERVERS.USER_ID'] = is_null($parameters['filter']['OBSERVERS']) ? null : (array)$parameters['filter']['OBSERVERS'];
			unset($parameters['filter']['OBSERVERS']);
		}
		if ($hasContactIdsField && !empty($parameters['filter']['CONTACT_IDS']))
		{
			$parameters['filter']['CONTACT_BINDINGS.CONTACT_ID'] = (array)$parameters['filter']['CONTACT_IDS'];
			unset($parameters['filter']['CONTACT_IDS']);
		}

		if (is_array($order))
		{
			$parameters['order'] = $this->convertFieldNamesToUpper($order, $isUseOriginalFieldNames);
			$parameters['order'] = $this->convertValuesToUpper(
				$parameters['order'],
				Converter::TO_UPPER | Converter::VALUES
			);

			if (!$this->validateOrder($parameters['order'], $allowedFields))
			{
				return null;
			}
		}

		if ($pageNavigation)
		{
			$parameters['offset'] = $pageNavigation->getOffset();
			$parameters['limit'] = $pageNavigation->getLimit();
		}

		$items = $factory->getItemsFilteredByPermissions($parameters);
		$items = array_values($this->getJsonForItems($factory, $items, $select, $isUseOriginalFieldNames));

		return new Page(
			'items',
			$items,
			function() use($parameters, $factory) {
				return $factory->getItemsCountFilteredByPermissions($parameters['filter']);
			}
		);
	}

	/**
	 * Delete item by $id.
	 *
	 * @param int $id
	 * @return array|null
	 */
	public function deleteAction(int $entityTypeId, int $id): ?array
	{
		$factory = $this->getFactory($entityTypeId);
		if (!$factory)
		{
			return null;
		}

		$item = $factory->getItem($id);

		if (!$item)
		{
			$this->addError(new Error(
				Loc::getMessage('CRM_TYPE_ITEM_NOT_FOUND'),
				ErrorCode::NOT_FOUND
			));
			return null;
		}
		if (!Container::getInstance()->getUserPermissions()->item()->canDeleteItem($item))
		{
			$this->addError(\Bitrix\Crm\Controller\ErrorCode::getAccessDeniedError());

			return null;
		}

		$categoryId = $item->getCategoryId();

		$operation = $factory->getDeleteOperation($item);
		$result = $operation->launch();
		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());
			return null;
		}

		if ($this->getScope() === static::SCOPE_AJAX)
		{
			return [
				'redirectUrl' => Container::getInstance()->getRouter()
					->getItemListUrlInCurrentView($entityTypeId, $categoryId),
			];
		}

		return [];
	}

	/**
	 * Process $fields for $item by fields $collection. This method do not perform saving, only set values in $item.
	 *
	 * @param \Bitrix\Crm\Item $item
	 * @param array $fields
	 * @param Field\Collection $collection
	 */
	public function processFields(
		\Bitrix\Crm\Item $item,
		array $fields,
		Field\Collection $collection
	): void
	{
		$fields = $collection->removeHiddenValues($fields);

		foreach($collection as $field)
		{
			$fieldName = $field->getName();
			if (!array_key_exists($fieldName, $fields))
			{
				continue;
			}

			if ($field->isValueEmpty($fields[$fieldName]))
			{
				$item->set($fieldName, null);
				continue;
			}

			if ($field->isFileUserField())
			{
				$this->processFileField($field, $item, $fields[$fieldName]);
			}
			elseif (
				$this->getScope() === self::SCOPE_REST
				&& (
					$field->getType() === Field::TYPE_DATE
					|| $field->getType() === Field::TYPE_DATETIME
				)
			)
			{
				if ($field->getType() === Field::TYPE_DATETIME)
				{
					$convertDateMethod = 'unConvertDateTime';
				}
				else
				{
					$convertDateMethod = 'unConvertDate';
				}
				if($field->isMultiple())
				{
					$result = [];
					$value = (array)$fields[$fieldName];
					foreach($value as $date)
					{
						// can return false and wrong value should not be set in this case:
						$convertedValue = \CRestUtil::$convertDateMethod($date);
						if ($convertedValue)
						{
							$result[] = $convertedValue;
						}
					}
					$item->set($fieldName, $result);
				}
				else
				{
					$convertedValue = \CRestUtil::$convertDateMethod($fields[$fieldName]);
					if ($convertedValue)
					{
						$item->set($fieldName, $convertedValue);
					}
				}
			}
			else
			{
				$value = $fields[$fieldName];
				if ($field->getType() === Field::TYPE_BOOLEAN)
				{
					$value = $this->prepareBooleanFieldValue($value);
				}
				$item->set($fieldName, $value);
			}
		}
	}

	public function processFileField(Field $field, \Bitrix\Crm\Item $item, $fileData): void
	{
		$fieldName = $field->getName();
		if ($field->isMultiple())
		{
			$fileData = (array)$fileData;

			$result = [];
			$currentFiles = array_flip($item->get($fieldName) ?? []);
			foreach ($fileData as $file)
			{
				if (isset($file['ID']))
				{
					$fileId = (int)$file['ID'];
					if ($fileId > 0)
					{
						if (isset($currentFiles[$fileId]))
						{
							Container::getInstance()->getFileUploader()->registerFileId($field, $fileId);
							$result[] = $fileId;
						}

						continue;
					}
				}

				$fileId = $this->uploadFile($field, $file);
				if ($fileId > 0)
				{
					$result[] = $fileId;
				}
			}

			$item->set($fieldName, $result);
		}
		else
		{
			if (isset($fileData['ID']))
			{
				if ((int)$fileData['ID'] === $item->get($fieldName))
				{
					Container::getInstance()->getFileUploader()->registerFileId($field, $fileData['ID']);
					return;
				}

				$fileId = 0;
			}
			else
			{
				$fileId = $this->uploadFile($field, $fileData);
			}
			$item->set($fieldName, $fileId);
		}
	}

	protected function prepareBooleanFieldValue($value): bool
	{
		if (is_bool($value))
		{
			return $value;
		}
		if ($value === 'true' || $value === 'y' || $value === 'Y')
		{
			return true;
		}

		return false;
	}

	/**
	 * Add new item with $fields.
	 */
	public function addAction(int $entityTypeId, array $fields, string $useOriginalUfNames = 'N'): ?array
	{
		$factory = $this->getFactory($entityTypeId);
		if (!$factory)
		{
			return null;
		}

		$item = $factory->createItem();
		if (isset($fields['categoryId']))
		{
			$item->setCategoryId((int)$fields['categoryId']);
		}

		if (!Container::getInstance()->getUserPermissions()->item()->canAddItem($item))
		{
			$this->addError(\Bitrix\Crm\Controller\ErrorCode::getAccessDeniedError());

			return null;
		}

		if (isset($fields['fm']) && $factory->isMultiFieldsEnabled())
		{
			$fmValues = $this->getFmValues($fields);
			$this->setFm($item, $fmValues);

			unset($fields['fm']);
		}

		$isUseOriginalUfNames = ($useOriginalUfNames === 'Y');
		$fields = $this->convertFieldNamesToUpper($fields, $isUseOriginalUfNames);
		$this->processFields($item, $fields, $factory->getFieldsCollection());

		$operation = $factory->getAddOperation($item);
		if (
			$this->getScope() === static::SCOPE_REST
			&& !RestSettings::getCurrent()?->isRequiredUserFieldCheckEnabled()
		)
		{
			$operation->disableCheckRequiredUserFields();
		}

		$result = $operation->launch();
		if ($result->isSuccess())
		{
			$items = $this->getJsonForItems($factory, [$operation->getItem()], null, $isUseOriginalUfNames);

			return [
				'item' => $items[$item->getId()],
			];
		}

		$this->addErrors($result->getErrors());

		return null;
	}

	/**
	 * Update item by $id with $fields.
	 */
	public function updateAction(int $entityTypeId, int $id, array $fields, string $useOriginalUfNames = 'N'): ?array
	{
		$factory = $this->getFactory($entityTypeId);
		if (!$factory)
		{
			return null;
		}

		$item = $factory->getItem($id);

		if (!$item)
		{
			$this->addError(new Error(
				Loc::getMessage('CRM_TYPE_ITEM_NOT_FOUND'),
				ErrorCode::NOT_FOUND
			));

			return null;
		}
		if (!Container::getInstance()->getUserPermissions()->item()->canUpdateItem($item))
		{
			$this->addError(\Bitrix\Crm\Controller\ErrorCode::getAccessDeniedError());

			return null;
		}

		if (isset($fields['fm']) && $factory->isMultiFieldsEnabled())
		{
			$fmValues = $this->getFmValues($fields);
			$this->setFm($item, $fmValues);

			unset($fields['fm']);
		}

		$isUseOriginalUfNames = ($useOriginalUfNames === 'Y');
		$fields = $this->convertFieldNamesToUpper($fields, $isUseOriginalUfNames);
		$this->processFields($item, $fields, $factory->getFieldsCollection());

		$operation = $factory->getUpdateOperation($item);
		if (
			$this->getScope() === static::SCOPE_REST
			&& !RestSettings::getCurrent()?->isRequiredUserFieldCheckEnabled()
		)
		{
			$operation->disableCheckRequiredUserFields();
		}

		$result = $operation->launch();
		if ($result->isSuccess())
		{
			$items = $this->getJsonForItems($factory, [$operation->getItem()], null, $isUseOriginalUfNames);

			return [
				'item' => $items[$item->getId()],
			];
		}

		$this->addErrors($result->getErrors());

		return null;
	}

	/**
	 * Import new item with $fields.
	 * Allow to set some system fields (CREATED_BY, UPDATED_BY, CREATED_DATE, UPDATED_DATE) for admins
	 * Automation will not be executed for created items
	 */
	public function importAction(int $entityTypeId, array $fields, string $useOriginalUfNames = 'N'): ?array
	{
		$factory = $this->getFactory($entityTypeId);
		if (!$factory)
		{
			return null;
		}

		$fmValues = [];
		if ($factory->isMultiFieldsEnabled())
		{
			$ormObjectConverter = Container::getInstance()->getOrmObjectConverter();
			$ormObjectConverter->convertFieldNameFromUpperCaseToCamelCase('VALUE');
			$ormObjectConverter->convertFieldNameFromUpperCaseToCamelCase('VALUE_TYPE');

			$fmTypes = array_keys(\CCrmFieldMulti::GetEntityTypes());
			foreach ($fmTypes as $fmType)
			{
				$ormObjectConverter->convertFieldNameFromUpperCaseToCamelCase($fmType);

				if (isset($fields[$fmType]))
				{
					$index = 0;
					$fmValues[$fmType] = [];
					foreach ($fields[$fmType] as $fmValue)
					{
						$fmValues[$fmType]['n' . $index++] = $fmValue;
					}
				}
			}
		}

		$isUseOriginalUfNames = $useOriginalUfNames === 'Y';
		if ($this->shouldUseDeprecatedImportApi($entityTypeId))
		{
			return $this->importViaDeprecatedApi($entityTypeId, $fields, $isUseOriginalUfNames);
		}

		$item = $factory->createItem();

		$fields = $this->convertFieldNamesToUpper($fields, $isUseOriginalUfNames);
		$this->processFields($item, $fields, $factory->getFieldsCollection());

		if (!empty($fmValues) && $item->hasField(\Bitrix\Crm\Item::FIELD_NAME_FM))
		{
			$fmCollection = $item->get(\Bitrix\Crm\Item::FIELD_NAME_FM);
			Assembler::updateCollectionByArray($fmCollection, $fmValues);
			$item->set(\Bitrix\Crm\Item::FIELD_NAME_FM, $fmCollection);
		}

		if (!Container::getInstance()->getUserPermissions()->item()->canImportItem($item))
		{
			$this->addError(\Bitrix\Crm\Controller\ErrorCode::getAccessDeniedError());

			return null;
		}

		$operation = $factory->getImportOperation($item);
		if (
			$this->getScope() === static::SCOPE_REST
			&& !RestSettings::getCurrent()?->isRequiredUserFieldCheckEnabled()
		)
		{
			$operation->disableCheckRequiredUserFields();
		}

		$result = $operation->launch();
		if ($result->isSuccess())
		{
			return [
				'item' => [
					'id' => $item->getId(),
				],
			];
		}

		$this->addErrors($result->getErrors());

		return null;
	}

	public function batchImportAction(int $entityTypeId, array $data, string $useOriginalUfNames = 'N'): ?array
	{
		$factory = $this->getFactory($entityTypeId);
		if (!$factory)
		{
			return null;
		}

		if (count($data) > self::MAX_IMPORT_BATCH_SIZE)
		{
			$this->addError(new Error(
				'You can only import ' . self::MAX_IMPORT_BATCH_SIZE . ' items at a time',
				'MAX_IMPORT_BATCH_SIZE_EXCEEDED'
			));

			return null;
		}

		$executionResult = [];

		foreach ($data as $itemKey => $itemData)
		{
			$itemData = is_array($itemData) ? $itemData : [];
			$itemResult = $this->importAction($entityTypeId, $itemData, $useOriginalUfNames);

			$error = $this->getErrors()[0] ?? null;

			$executionResult[$itemKey] = $error
				? [
					'error' => $error->getCode(),
					'error_description' => $error->getMessage(),
				]
				: $itemResult
			;
			$this->errorCollection->clear();
		}

		return [
			'items' => $executionResult,
		];
	}

	/**
	 * Return editor for item by $id.
	 *
	 * @param int $id
	 * @param string|null $guid
	 * @param string|null $configId
	 * @param int|null $categoryId
	 * @param string|null $stageId
	 * @param array $params
	 * @return Component|null
	 */
	public function getEditorAction(
		int $entityTypeId,
		int $id,
		string $guid = null,
		string $configId = null,
		int $categoryId = null,
		string $stageId = null,
		string $viewMode = null,
		array $params = []
	): ?Component
	{
		$factory = $this->getFactory($entityTypeId);
		if (!$factory)
		{
			return null;
		}
		$componentName = $params['componentName']
			?? Container::getInstance()->getRouter()->getItemDetailComponentName($entityTypeId);
		if (!$componentName)
		{
			$this->addError(new Error('Component for entity ' . $entityTypeId . ' not found'));
			return null;
		}

		$componentClassName = \CBitrixComponent::includeComponentClass($componentName);
		$component = new $componentClassName();
		if (!($component instanceof FactoryBased))
		{
			$this->addError(new Error('Component for entity ' . $entityTypeId . ' not found'));
			return null;
		}
		//@codingStandardsIgnoreStart
		$component->initComponent($componentName);
		$component->arParams = [
			'ENTITY_TYPE_ID' => $entityTypeId,
			'ENTITY_ID' => $id,
			'categoryId' => $categoryId,
			'skipFields' => [$factory->getEntityFieldNameByMap(\Bitrix\Crm\Item::FIELD_NAME_STAGE_ID)],
		];
		//@codingStandardsIgnoreEnd

		$component->init();
		if (!empty($component->getErrors()))
		{
			$this->addErrors($component->getErrors());
			return null;
		}

		$component->initializeEditorAdapter();

		$editorConfig = $component->getEditorConfig();
		$editorConfig['ENTITY_CONFIG'] = $component->getInlineEditorEntityConfig();

		if ($stageId)
		{
			$editorConfig['CONTEXT']['STAGE_ID'] = $stageId;
		}

		// In the deadlines mode we have to set actual_date and first stage for new entity
		if (
			$viewMode === ViewMode::MODE_DEADLINES &&
			Deadlines\DeadlinesStageManager::isEntitySupportDeadlines($entityTypeId)
		)
		{
			$fieldName = Deadlines\DeadlinesStageManager::dateFieldByEntityType($entityTypeId);
			$deadLinePeriods = new Deadlines\DatePeriods();

			$actualDate = $deadLinePeriods->calculateDateByStage($stageId);
			$stages = $factory->getStages()->getStatusIdList();
			$editorConfig['ENTITY_DATA'][$fieldName] = $actualDate;
			$editorConfig['CONTEXT']['STAGE_ID'] = $stages[0] ?? null ;
			$editorConfig['CONTEXT']['VIEW_MODE'] = ViewMode::MODE_DEADLINES;
			$editorConfig['CONTEXT']['DEADLINE_STAGE'] = $stageId;
		}

		$forceDefaultConfig = $params['forceDefaultConfig'] ?? 'N';
		$editorConfig['FORCE_DEFAULT_CONFIG'] = ($forceDefaultConfig === 'Y');
		$editorConfig['IS_EMBEDDED'] = ($params['IS_EMBEDDED'] ?? 'Y') === 'Y';
		$editorConfig['GUID'] = $guid ?? $editorConfig['GUID'];
		$editorConfig['CONFIG_ID'] = $configId ?? $editorConfig['CONFIG_ID'];
		$enableSingleSectionCombining = ($params['enableSingleSectionCombining'] ?? 'Y') === 'Y';

		//@codingStandardsIgnoreStart
		$editorConfig['COMPONENT_AJAX_DATA']['SIGNED_PARAMETERS'] = ParameterSigner::signParameters(
			$component->getName(),
			$component->arParams
		);
		//@codingStandardsIgnoreEnd

		if (isset($params['ANALYTICS_CONFIG']) && is_array($params['ANALYTICS_CONFIG']))
		{
			$editorConfig['ANALYTICS_CONFIG'] = $params['ANALYTICS_CONFIG'];
		}

		$disabledOptions = [
			'ENABLE_SECTION_EDIT',
			'ENABLE_SECTION_CREATION',
			'ENABLE_SECTION_DRAG_DROP',
			'ENABLE_FIELD_DRAG_DROP',
			'ENABLE_MODE_TOGGLE',
			'ENABLE_TOOL_PANEL',
			'ENABLE_BOTTOM_PANEL',
			'ENABLE_USER_FIELD_CREATION',
			'ENABLE_PAGE_TITLE_CONTROLS',
			'ENABLE_FIELDS_CONTEXT_MENU',
			'ENABLE_PERSONAL_CONFIGURATION_UPDATE',
			'ENABLE_COMMON_CONFIGURATION_UPDATE',
			'ENABLE_CONFIG_SCOPE_TOGGLE',
			'ENABLE_SETTINGS_FOR_ALL',
			'ENABLE_REQUIRED_FIELDS_INJECTION',
		];
		foreach ($disabledOptions as $option)
		{
			$value = $params[$option] ?? false;
			$editorConfig[$option] = match (true){
				in_array($value, ['true', 'Y'], true) => true,
				in_array($value, ['false', 'N'], true) => false,
				default => $value,
			};
		}

		$editorConfig['ENABLE_USER_FIELD_MANDATORY_CONTROL'] = true;
		$editorConfig['ENABLE_AJAX_FORM'] = true;
		$editorConfig['ENABLE_COMMUNICATION_CONTROLS'] = ($params['ENABLE_COMMUNICATION_CONTROLS'] ?? 'Y') === 'Y';
		$editorConfig['ENABLE_VISIBILITY_POLICY'] = ($params['ENABLE_VISIBILITY_POLICY'] ?? 'Y') === 'Y';
		$editorConfig['ENABLE_AVAILABLE_FIELDS_INJECTION'] = ($params['ENABLE_AVAILABLE_FIELDS_INJECTION'] ?? 'N') === 'Y';
		$editorConfig['ENABLE_EXTERNAL_LAYOUT_RESOLVERS'] = ($params['ENABLE_EXTERNAL_LAYOUT_RESOLVERS'] ?? 'N') === 'Y';
		$editorConfig['SHOW_EMPTY_FIELDS'] = ($params['SHOW_EMPTY_FIELDS'] ?? 'N') === 'Y';
		$editorConfig['READ_ONLY'] = ($params['READ_ONLY'] ?? 'N') === 'Y';
		$editorConfig['ENABLE_CONFIGURATION_UPDATE'] = ($params['ENABLE_CONFIGURATION_UPDATE'] ?? 'Y') === 'Y';
		$editorConfig['ENABLE_REQUIRED_USER_FIELD_CHECK'] = ($params['ENABLE_REQUIRED_USER_FIELD_CHECK'] ?? 'Y') === 'Y';

		$allowedInitialModes = ['view', 'edit'];
		$editorConfig['INITIAL_MODE'] = in_array($params['INITIAL_MODE'] ?? null, $allowedInitialModes, true)
			? $params['INITIAL_MODE']
			: 'edit'
		;

		if (isset($params['SCOPE']) && EntityEditorConfigScope::isDefined($params['SCOPE']))
		{
			$editorConfig['SCOPE'] = $params['SCOPE'];
		}

		$requiredFields = array_unique($params['requiredFields'] ?? []);
		$entityConfig = $editorConfig['ENTITY_CONFIG'];
		if (!empty($requiredFields))
		{
			$entityConfig = [
				[
					'elements' => [],
				],
			];

			foreach ($requiredFields as $field)
			{
				$entityConfig[0]['elements'][] = ['name' => $field];
			}

			$editorConfig['ENTITY_FIELDS'] = EditorAdapter::markFieldsAsRequired($editorConfig['ENTITY_FIELDS'], $requiredFields);
		}

		if ($enableSingleSectionCombining)
		{
			$editorConfig['ENTITY_CONFIG'] = EditorAdapter::combineConfigIntoOneSection($entityConfig, $params['title'] ?? '');
		}

		return new Component('bitrix:crm.entity.editor', '', $editorConfig);
	}

	/**
	 * Prepare filter for getList.
	 *
	 * @param array $filter
	 * @return array
	 */
	public function prepareFilter(Service\Factory $factory, array $filter): array
	{
		if($this->getScope() === static::SCOPE_REST)
		{
			$this->prepareDateTimeFieldsForFilter($filter, $factory->getFieldsCollection());
		}

		return $this->removeDotsFromKeys($filter);
	}

	protected function prepareSelect(Service\Factory $factory, array $select): array
	{
		if (in_array('*', $select, true))
		{
			$result = ['*'];
			if ($factory->isMultiFieldsEnabled())
			{
				$result = array_merge(
					$result,
					$this->getMultiFields(),
				);
			}

			return $result;
		}

		$select = array_values($select);
		$select = $this->removeDotsFromValues($select);

		if (in_array('UF_*', $select, true))
		{
			foreach ($factory->getFieldsCollection() as $field)
			{
				if ($field->isUserField())
				{
					$select[] = $field->getName();
				}
			}
		}

		return array_filter($select, static function ($fieldName) use ($factory) {
			return $factory->isFieldExists($fieldName);
		});
	}

	/**
	 * Return information about fields.
	 *
	 * @return array|null
	 */
	public function fieldsAction(int $entityTypeId, string $useOriginalUfNames = 'N'): ?array
	{
		$factory = $this->getFactory($entityTypeId);
		if (!$factory)
		{
			return null;
		}
		if (!Container::getInstance()->getUserPermissions()->entityType()->canReadItems($entityTypeId))
		{
			$this->addError(new Error(
				Loc::getMessage('CRM_COMMON_READ_ACCESS_DENIED'),
				ErrorCode::ACCESS_DENIED
			));

			return null;
		}

		$fieldsInfo = $factory->getFieldsInfo() + $factory->getUserFieldsInfo();

		return [
			'fields' => $this->prepareFieldsInfo($fieldsInfo, $useOriginalUfNames === 'Y'),
		];
	}

	/**
	 * Return file content of item with $id by $fieldName and $file_id.
	 *
	 * @param int $id
	 * @param string $fieldName
	 * @param int $fileId
	 * @param int|null $entityTypeId
	 * @return BFile|null
	 */
	public function getFileAction(
		int $entityTypeId,
		int $id,
		string $fieldName,
		int $fileId
	): ?BFile
	{
		$factory = $this->getFactory($entityTypeId);
		if (!$factory)
		{
			return null;
		}

		$item = $factory->getItem($id);
		if (!$item)
		{
			$this->addError(new Error(
				Loc::getMessage('CRM_TYPE_ITEM_NOT_FOUND'),
				ErrorCode::NOT_FOUND
			));
			return null;
		}
		if (!Container::getInstance()->getUserPermissions()->item()->canReadItem($item))
		{
			$this->addError(new Error(
				Loc::getMessage('CRM_COMMON_READ_ACCESS_DENIED'),
				ErrorCode::ACCESS_DENIED
			));
			return null;
		}

		$field = $factory->getFieldsCollection()->getField($fieldName);
		if (!$field || !$field->isFileUserField())
		{
			$this->addError(new Error('Field ' . $fieldName . ' is not a file field'));
			return null;
		}
		$value = $item->get($fieldName);
		if ((int)$value === $fileId && $fileId > 0)
		{
			return BFile::createByFileId($fileId);
		}
		if (is_array($value))
		{
			Collection::normalizeArrayValuesByInt($value);
			if (in_array($fileId, $value, true))
			{
				return BFile::createByFileId($fileId);
			}
		}

		return null;
	}

	/**
	 * @param Service\Factory $factory
	 * @param \Bitrix\Crm\Item[] $items
	 * @return array
	 */
	protected function getJsonForItems(
		Service\Factory $factory,
		array $items,
		array $select = null,
		bool $useOriginalUfNames = false,
	): array
	{
		$result = [];

		$isCheckSelect = (is_array($select) && !in_array('*', $select, true));

		if ($useOriginalUfNames)
		{
			$converter = Container::getInstance()->getOrmObjectConverter();
		}

		foreach ($items as $item)
		{
			$itemId = $item->getId();
			$result[$itemId] = $item->jsonSerialize();

			if ($useOriginalUfNames)
			{
				foreach ($result[$itemId] as $fieldName => $value)
				{
					if (str_starts_with($fieldName, 'uf'))
					{
						unset($result[$itemId][$fieldName]);
						$result[$itemId][$converter->convertFieldNameFromCamelCaseToUpperCase($fieldName)] = $value;
					}
				}
			}

			if ($factory->isMultiFieldsEnabled())
			{
				$result[$itemId]['fm'] = $this->getFm($item);
			}
		}

		if ($isCheckSelect)
		{
			$select = array_flip($select);
			if (!$useOriginalUfNames)
			{
				$select = $this->convertKeysToCamelCase($select);
			}

			foreach ($result as &$item)
			{
				$item = array_intersect_key($item, $select);
			}
		}

		return $result;
	}

	/**
	 * @deprecated This method will be removed when operations will be supported for all entity types
	 */
	private function shouldUseDeprecatedImportApi(int $entityTypeId): bool
	{
		if (
			$entityTypeId == \CCrmOwnerType::Lead
			&& !method_exists(\Bitrix\Crm\Settings\LeadSettings::class, 'isFactoryEnabled')
		)
		{
			//check for availability of \Bitrix\Crm\Settings\LeadSettings::getCurrent()->isFactoryEnabled();
			return true;
		}
		if (
			$entityTypeId == \CCrmOwnerType::Contact
			&& !method_exists(\Bitrix\Crm\Settings\ContactSettings::class, 'isFactoryEnabled')
		)
		{
			//check for availability of \Bitrix\Crm\Settings\ContactSettings::getCurrent()->isFactoryEnabled();
			return true;
		}
		if (
			$entityTypeId == \CCrmOwnerType::Company
			&& !method_exists(\Bitrix\Crm\Settings\CompanySettings::class, 'isFactoryEnabled')
		)
		{
			//check for availability of \Bitrix\Crm\Settings\CompanySettings::getCurrent()->isFactoryEnabled();
			return true;
		}

		return false;
	}

	/**
	 * @deprecated This method will be removed when operations will be supported for all entity types
	 */
	private function importViaDeprecatedApi(int $entityTypeId, array $fields, bool $useOriginalUfNames = false): ?array
	{
		$restEntity = match ($entityTypeId) {
			\CCrmOwnerType::Lead => new \CCrmLeadRestProxy(),
			\CCrmOwnerType::Contact => new \CCrmContactRestProxy(),
			\CCrmOwnerType::Company => new \CCrmCompanyRestProxy(),
			default => throw new NotSupportedException("Entity type {$entityTypeId} is not supported"),
		};

		if (!\CCrmAuthorizationHelper::CheckImportPermission($entityTypeId))
		{
			$this->addError(new Error(
				Loc::getMessage('CRM_COMMON_READ_ACCESS_DENIED'),
				ErrorCode::ACCESS_DENIED
			));

			return null;
		}

		$fields = $this->convertFieldNamesToUpper($fields, $useOriginalUfNames);
		$fieldsMap = Container::getInstance()->getFactory($entityTypeId)->getFieldsMap();
		foreach ($fieldsMap as $commonFieldName => $fieldName)
		{
			if (isset($fields[$commonFieldName]))
			{
				$fields[$fieldName] = $fields[$commonFieldName];
				unset($fields[$commonFieldName]);
			}
		}

		try
		{
			$id = $restEntity->add($fields, [ 'IMPORT' => true ]);
		}
		catch (\Bitrix\Rest\RestException $e)
		{
			$this->addError(new Error(
				$e->getMessage()
			));

			return null;
		}

		return [
			'item' => [
				'id' => (int)$id,
			],
		];
	}

	private function getMultiFields(): array
	{
		return [
			'EMAIL',
			'EMAIL_HOME',
			'EMAIL_WORK',
			'EMAIL_MAILING',
			'PHONE',
			'PHONE_MOBILE',
			'PHONE_WORK',
			'PHONE_MAILING',
			'IMOL',
		];
	}

	private function getFm(\Bitrix\Crm\Item $item): array
	{
		$multiFieldsCollection = $item->getFm();

		$multiFields = [];
		foreach ($multiFieldsCollection as $multiField)
		{
			$multiFields[] = [
				'id' => $multiField->getId(),
				'valueType' => $multiField->getValueType(),
				'value' => $multiField->getValue(),
				'typeId' => $multiField->getTypeId(),
			];
		}

		return $multiFields;
	}

	private function getFmValues(array $fields): array
	{
		$fmValues = [];
		if (isset($fields['fm']))
		{
			if (isset($fields['fm']['typeId']) && isset($fields['fm']['value']))
			{
				$typeId = $fields['fm']['typeId'];
				$value = $fields['fm']['value'];
				$fmValues[$typeId]['new']['VALUE'] = $value;
				if (isset($fields['fm']['valueType']))
				{
					$valueType = $fields['fm']['valueType'];
					$fmValues[$typeId]['new']['VALUE_TYPE'] = $valueType;
				}
			}

			foreach ($fields['fm'] as $id => $multiField)
			{
				if (!isset($multiField['typeId']) || !isset($multiField['value']))
				{
					continue;
				}

				$typeId = $multiField['typeId'];
				$fmValues[$typeId][$id]['VALUE'] = $multiField['value'];
				if (isset($multiField['valueType']))
				{
					$fmValues[$typeId][$id]['VALUE_TYPE'] = $multiField['valueType'];
				}
			}
		}

		return $fmValues;
	}

	private function setFm(\Bitrix\Crm\Item $item, array $fmValues): void
	{
		if ($fmValues && $item->hasField(\Bitrix\Crm\Item::FIELD_NAME_FM))
		{
			$fmCollection = $item->get(\Bitrix\Crm\Item::FIELD_NAME_FM);
			Assembler::updateCollectionByArray($fmCollection, $fmValues);
			$item->set(\Bitrix\Crm\Item::FIELD_NAME_FM, $fmCollection);
		}
	}

	private function convertFieldNamesToUpper(
		array $data,
		bool $useOriginalUfNames = false,
		bool $useFilterPrefix = false
	): array
	{
		$converter = Container::getInstance()->getOrmObjectConverter();

		if (!$useOriginalUfNames)
		{
			return $converter->convertKeysToUpperCase($data);
		}

		$result = [];
		foreach ($data as $fieldName => $fieldValue)
		{
			$filterCondition = (new \CSQLWhere())->MakeOperation($fieldName);
			$originalFieldName = $useFilterPrefix ? $filterCondition['FIELD'] : $fieldName;

			if (!str_starts_with($originalFieldName, 'UF_'))
			{
				$fieldName = $converter->convertFieldNameFromCamelCaseToUpperCase($fieldName);
			}

			$result[$fieldName] = (
				is_array($fieldValue)
					? $this->convertFieldNamesToUpper($fieldValue, $useOriginalUfNames)
					: $fieldValue
			);
		}

		return $result;
	}
}
