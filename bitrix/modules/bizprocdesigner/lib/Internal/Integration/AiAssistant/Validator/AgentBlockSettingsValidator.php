<?php

namespace Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Validator;

use Bitrix\BizprocDesigner\Internal\Entity\BlockTypeDetail;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentSettingCollection;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Error\GraphError;
use Bitrix\Main\Result;

final class AgentBlockSettingsValidator
{
	private readonly AgentBlockSettingValidator $settingValidator;
	private ?AgentSettingCollection $validSettings = null;

	public function __construct(
		?AgentBlockSettingValidator $settingValidator = null,
		?ValidationContext $context = null,
	)
	{
		$this->settingValidator = $settingValidator ?? new AgentBlockSettingValidator(context: $context);
	}

	public function validate(
		mixed $settings,
		string $path,
		?BlockTypeDetail $blockTypeDetail,
		?string $blockType = null,
		?string $presetId = null,
	): Result
	{
		$this->validSettings = null;

		if (!is_array($settings))
		{
			return (new Result())->addError(GraphError::at($path, "{$path} should be array"));
		}

		if (empty($settings) && $blockTypeDetail && $this->hasRequiredSetting($blockTypeDetail))
		{
			return (new Result())->addError(GraphError::at($path, "{$path} should be not empty array"));
		}

		if ($blockTypeDetail)
		{
			$this->validSettings = new AgentSettingCollection();
		}

		$result = new Result();
		$seenNames = [];

		foreach ($settings as $key => $setting)
		{
			$settingValidateResult = $this->settingValidator->validate(
				$setting,
				"$path.$key",
				$blockTypeDetail,
				$blockType,
				$presetId,
			);
			$result->addErrors($settingValidateResult->getErrors());

			$name = $this->settingName($setting);
			if ($name !== null)
			{
				if (isset($seenNames[$name]))
				{
					$result->addError(GraphError::at("{$path}.{$key}.name", "{$path}.{$key}.name is duplicated"));

					continue;
				}

				$seenNames[$name] = true;
			}

			if ($settingValidateResult->isSuccess() && $this->validSettings && $this->settingValidator->getValidSetting())
			{
				$this->validSettings->add($this->settingValidator->getValidSetting());
			}
		}

		return $result;
	}

	/**
	 * A repeated setting name is refused instead of being silently collapsed: readers disagree on which
	 * occurrence wins - the validators read the first one, the draft converter persists the last - so a
	 * duplicate would let a node be authorised on one value and saved with another. Names are compared
	 * case-insensitively, exactly as the readers match them.
	 */
	private function settingName(mixed $setting): ?string
	{
		if (!is_array($setting))
		{
			return null;
		}

		$name = $setting['name'] ?? null;

		return is_string($name) && $name !== '' ? mb_strtolower($name) : null;
	}

	public function getValidSettings(): ?AgentSettingCollection
	{
		return $this->validSettings;
	}

	/**
	 * An empty settings payload is rejected only when the schema declares a required setting: a block whose
	 * schema is optional-only legitimately round-trips with no settings at all.
	 */
	private function hasRequiredSetting(BlockTypeDetail $blockTypeDetail): bool
	{
		foreach ($blockTypeDetail->settings as $setting)
		{
			if ($setting->required)
			{
				return true;
			}
		}

		return false;
	}
}
