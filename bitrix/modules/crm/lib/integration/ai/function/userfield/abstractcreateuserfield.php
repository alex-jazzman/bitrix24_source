<?php

namespace Bitrix\Crm\Integration\AI\Function\UserField;

use Bitrix\Crm\Controller\ErrorCode;
use Bitrix\Crm\Entity\EntityEditorConfig;
use Bitrix\Crm\Integration\AI\Contract\AIFunction;
use Bitrix\Crm\Integration\AI\Function\UserField\Dto\CreateUserFieldParameters;
use Bitrix\Crm\Integration\AI\Function\UserField\Enum\UserFieldType;
use Bitrix\Crm\Result;
use Bitrix\Crm\Service\UserPermissions;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\UserField\FieldNameGenerator;
use Bitrix\Main\Loader;
use CCrmOwnerType;
use CLanguage;
use CUserTypeEntity;

abstract class AbstractCreateUserField implements AIFunction
{
	protected FieldNameGenerator $fieldNameGenerator;
	protected UserPermissions $userPermissions;

	public function __construct(
		private readonly int $currentUserId,
	)
	{
		$this->fieldNameGenerator = new FieldNameGenerator();
		$this->userPermissions = Container::getInstance()->getUserPermissions($this->currentUserId);
	}

	public function isAvailable(): bool
	{
		return true;
	}

	abstract protected function isMultiple(): bool;

	abstract protected function getType(): UserFieldType;

	protected function settings(): array
	{
		return [];
	}

	final public function invoke(...$args): Result
	{
		$parameters = $this->parseParameters($args);
		if ($parameters->hasValidationErrors())
		{
			return Result::fail($parameters->getValidationErrors());
		}

		if (!$this->userPermissions->isAdminForEntity($parameters->entityTypeId))
		{
			return Result::fail(ErrorCode::getAccessDeniedError());
		}

		$result = $this->save($parameters);
		if (!$result->isSuccess())
		{
			return $result;
		}

		$fieldName = $result->getData()['fields']['FIELD_NAME'];
		$this->addFieldToAdditionalOrFirstSectionIntoCurrentUserView($parameters, $fieldName);

		return $result;
	}

	protected function parseParameters(array $args): CreateUserFieldParameters
	{
		return new CreateUserFieldParameters($args);
	}

	protected function save(CreateUserFieldParameters $parameters): Result
	{
		$entityId = CCrmOwnerType::ResolveUserFieldEntityID($parameters->entityTypeId);
		if (empty($entityId))
		{
			return Result::fail(ErrorCode::getEntityTypeNotSupportedError($parameters->entityTypeId));
		}

		$fields = [
			'ENTITY_ID' => $entityId,
			'FIELD_NAME' => $this->fieldNameGenerator->generate($entityId),
			'MULTIPLE' => $this->isMultiple() ? 'Y' : 'N',
			'USER_TYPE_ID' => $this->getType()->id(),
			'SETTINGS' => $this->settings(),
			...$this->getLabelFields($parameters->label),
		];

		$userTypeEntity = new CUserTypeEntity();
		$id = $userTypeEntity->Add($fields);
		if ($id === false)
		{
			return Result::failFromApplication();
		}

		return Result::success(id: $id, fields: $fields);
	}

	protected function addFieldToAdditionalOrFirstSectionIntoCurrentUserView(
		CreateUserFieldParameters $parameters,
		string $fieldName,
	): void
	{
		if (!Loader::includeModule('ui'))
		{
			return;
		}

		$extras = [
			'USER_ID' => $this->currentUserId,
			'CATEGORY_ID' => $parameters->categoryId,
		];

		$config = EntityEditorConfig::createWithCurrentScope($parameters->entityTypeId, $extras);
		$configuration = $config->get() ?? $config->getDefault();

		$isConfigNotFound = $configuration === null;
		$isConfigHasNoSections = is_array($configuration) && count($configuration) === 0;
		if ($isConfigNotFound || $isConfigHasNoSections)
		{
			return;
		}

		$targetSection = 0;
		foreach ($configuration as $i => $section)
		{
			if ($section['name'] === 'additional')
			{
				$targetSection = $i;

				break;
			}
		}

		$elements = &$configuration[$targetSection]['elements'];
		$elements = $elements ?? [];

		$isConfigContainsAddedField = false;
		foreach ($elements as &$element)
		{
			if ($element['name'] === $fieldName)
			{
				$isConfigContainsAddedField = true;
				$element['optionFlags'] = 1;

				break;
			}
		}
		unset($element);

		if (!$isConfigContainsAddedField)
		{
			$elements[] = [
				'name' => $fieldName,
				'optionFlags' => 1,
			];
		}

		$config->set($configuration);
	}

	protected function getLabelFields(string $label): array
	{
		$result = [];
		$fields = [
			'EDIT_FORM_LABEL',
			'LIST_COLUMN_LABEL',
			'LIST_FILTER_LABEL',
		];

		$lids = $this->getLanguageIds();
		foreach ($fields as $field)
		{
			foreach ($lids as $lid)
			{
				$result[$field][$lid] = $label;
			}
		}

		return $result;
	}

	protected function getLanguageIds(): array
	{
		$ids = [];

		$languageResult = CLanguage::GetList();
		while ($language = $languageResult->Fetch())
		{
			$ids[] = $language['LID'];
		}

		return $ids;
	}
}
