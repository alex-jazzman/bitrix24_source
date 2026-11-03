<?php

namespace Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Validator;

use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Integration\AiAssistant\ActivityAiPropertyConverter;
use Bitrix\Bizproc\Internal\Entity\Activity\Setting;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingOptionCollection;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Error\GraphError;
use Bitrix\Main\ArgumentException;
use Bitrix\Main\Result;
use Bitrix\Main\Web\Json;

class AgentSettingValueValidator
{
	/**
	 * How many rejected elements one answer names before it counts the rest. The agent corrects a list from the
	 * positions it is given, and ten of them are enough to see the pattern of what it got wrong.
	 */
	private const MAX_REPORTED_REJECTED_VALUES = 10;

	/**
	 * How many allowed values one answer lists before it counts the rest and points at the catalog instead. This
	 * is the part that used to be repeated per element, so it is the part the bound exists for.
	 */
	private const MAX_REPORTED_ALLOWED_VALUES = 20;

	private string|array|null $expectedTypeValue = null;
	private readonly ?ValidationContext $context;

	public function __construct(?ValidationContext $context = null)
	{
		$this->context = $context;
	}

	/**
	 * A block of the graph is described for the document type of the edited template, so this entry names no
	 * document type of its own and the key carries the mark of the request's own type
	 * ({@see ValidationContext::optionValueFingerprint()}). The nested entry below is where a level names one.
	 *
	 * @param string|null $blockType the type that owns the setting - the block's own type at the top level, the
	 *        sub-action's activity code inside a complex node's rules. Only the carried-value passthrough of
	 *        the option check needs it, and without it that passthrough simply does not apply.
	 * @param string|null $presetId the preset the block is pinned to, the other half of what the option list is
	 *        built from. Carried beside $blockType because the passthrough may only unlock a value inside the
	 *        variant that carried it ({@see ValidationContext::hasCarriedOptionValue()}).
	 */
	public function validate(
		mixed $value,
		string $path,
		?Setting $settingConfig,
		?string $blockType = null,
		?string $presetId = null,
	): Result
	{
		$this->expectedTypeValue = null;
		$valuePath = "{$path}.value";
		if (!is_string($value) && !is_array($value))
		{
			return (new Result())->addError(GraphError::at($valuePath, "{$valuePath} is required"));
		}

		if ($settingConfig === null)
		{
			// setting is not described by the schema (e.g. it came from an existing template),
			// keep the value as is so the draft round-trip does not lose it
			$this->expectedTypeValue = $value;

			return new Result();
		}

		if ($settingConfig->type === ActivityAiPropertyConverter::SETTING_TYPE_MAP)
		{
			if ($value === '')
			{
				// The properties dialog writes its whole map on every save and a draft is autosaved half-built, so
				// a map the editor left unfilled reads back as the empty string. That is an empty map, not a type
				// error: refusing it would cost the whole template its way back.
				$value = [];
			}
			elseif (is_string($value))
			{
				$value = $this->getValueAsArray($value);
			}

			if (!is_array($value))
			{
				return (new Result())->addError(GraphError::at($valuePath, "{$valuePath} expected type is object"));
			}
			$this->expectedTypeValue = $value;

			return new Result();
		}

		if (
			!$settingConfig->multiple
			&& is_array($value)
			&& (string)$settingConfig->type === FieldType::USER
		)
		{
			// Bizproc persists a single USER value as a one-element array even without Multiple; coerce it to the
			// scalar the schema expects. Gated on the USER type, so other single-value settings still reject arrays.
			$coerced = $this->coerceSingleUserValue($value);
			if ($coerced === null)
			{
				return (new Result())->addError(GraphError::at("{$path}.value", "{$path}.value expected type is string"));
			}

			$value = $coerced;
		}

		if (!$settingConfig->multiple && !is_string($value))
		{
			return (new Result())->addError(GraphError::at($valuePath, "{$valuePath} expected type is string"));
		}

		// Requiredness is not judged here: nothing checks that a required setting was sent at all
		// ({@see AgentBlockSettingsValidator::validate()} refuses only a wholly empty set), so refusing the one
		// that arrives empty would refuse the block the editor autosaved half-built and pass the same block with
		// the setting left out.

		$optionsResult = self::validateAgainstOptions(
			$value,
			$settingConfig,
			$path,
			$this->context,
			$blockType,
			$presetId,
		);
		if (!$optionsResult->isSuccess())
		{
			return $optionsResult;
		}

		$this->expectedTypeValue = $value;

		return new Result();
	}

	/**
	 * The declared-options branch of the value check on its own, so a caller that cannot run the whole check
	 * still holds the agent to the option set the schema published to it. The nested settings of a complex
	 * node's sub-action are such a caller ({@see AgentComplexRulesValidator::validateNestedSettingNames()}):
	 * there the shape checks above do not run, but the options are the same contract.
	 *
	 * $context and $blockType together enable the carried-value passthrough; omitting either holds every
	 * value to the current option list. $presetId and $documentType qualify the block type with the variant and the
	 * document type the list was built for, so a value carried under one of them does not unlock it under another.
	 *
	 * @param array|null $documentType the document type the option list was built for, for a level that names one of
	 *        its own - the sub-step of a complex node, described for the effective document type of its host node.
	 *        Null for a block of the graph, described for the document type of the request itself
	 *        ({@see ValidationContext::optionValueFingerprint()}).
	 */
	public static function validateAgainstOptions(
		mixed $value,
		Setting $setting,
		string $path,
		?ValidationContext $context = null,
		?string $blockType = null,
		?string $presetId = null,
		?array $documentType = null,
	): Result
	{
		$result = new Result();

		if ($setting->options === null)
		{
			return $result;
		}

		// Keyed by the id rather than listed: the check runs per element of a multiple setting, and a linear
		// search turns that into O(elements x options). Casting the key to int on a numeric id changes nothing -
		// the lookup happens only on a string value, and PHP casts it the same way.
		$validIds = [];
		foreach ($setting->options as $option)
		{
			$validIds[$option->id] = true;
		}

		// A multiple setting holds a list, and skipping the whole check for it left the published option set
		// meaningless exactly where it matters most: a monitored-fields list took any code at all, the graph
		// was accepted, and the block then silently lost the outputs it computes from that setting. Each element
		// is held to the same contract as a single value.
		//
		// Every array is walked, keyed or not. Nothing above rejects a keyed array for a multiple setting, so
		// exempting one here handed the agent the bypass this check exists to close: `{"a": "MADE_UP_CODE"}`
		// passed with nothing examined.
		if (is_array($value))
		{
			return self::validateOptionValueList(
				$value,
				$setting,
				$validIds,
				$path,
				$context,
				$blockType,
				$presetId,
				$documentType,
			);
		}

		return self::validateOptionValue(
			$value,
			$setting,
			$validIds,
			"{$path}.value",
			$context,
			$blockType,
			$presetId,
			$documentType,
		);
	}

	/**
	 * Every element of a list against the option set, answered as ONE error for the setting.
	 *
	 * The check stays per element - that is the hole it was written to close - but the answer does not. Naming
	 * the whole allowed set beside every rejected element turned a 1.8 MB request into 42 MB of message text,
	 * and this contour serves a model that regularly sends field codes that do not exist, so the size is reached
	 * by an ordinary mistake rather than by an attack. What is bounded is the retelling: the positions of the
	 * rejected elements up to {@see self::MAX_REPORTED_REJECTED_VALUES} and the allowed set once, up to
	 * {@see self::MAX_REPORTED_ALLOWED_VALUES}.
	 *
	 * @param array<string, true> $validIds
	 */
	private static function validateOptionValueList(
		array $value,
		Setting $setting,
		array $validIds,
		string $path,
		?ValidationContext $context,
		?string $blockType,
		?string $presetId,
		?array $documentType,
	): Result
	{
		$result = new Result();

		$rejectedCount = 0;
		$reported = [];
		foreach ($value as $index => $item)
		{
			if (self::isAllowedOptionValue($item, $setting, $validIds, $context, $blockType, $presetId, $documentType))
			{
				continue;
			}

			++$rejectedCount;
			if (count($reported) < self::MAX_REPORTED_REJECTED_VALUES)
			{
				// An element that is not a scalar is named by its shape: `(string)` on it would yield the literal
				// 'Array' plus a PHP warning on every validate/push.
				$reported[] = "[{$index}] " . (is_scalar($item) ? "\"{$item}\"" : get_debug_type($item));
			}
		}

		if ($rejectedCount === 0)
		{
			return $result;
		}

		$hidden = $rejectedCount - count($reported);
		$listed = implode(', ', $reported) . ($hidden > 0 ? " and {$hidden} more" : '');

		$valuePath = "{$path}.value";
		$result->addError(GraphError::at(
			$valuePath,
			"{$valuePath} is not valid. Elements outside the allowed set ({$rejectedCount}): {$listed}."
			. ' ' . self::describeAllowedValues($validIds),
		));

		return $result;
	}

	/**
	 * The allowed set for an answer that names it once. Beyond the bound the answer stops listing and says where
	 * the whole set lives instead, so the agent can still correct the graph from one round.
	 *
	 * @param array<string, true> $validIds
	 */
	private static function describeAllowedValues(array $validIds): string
	{
		$ids = array_keys($validIds);
		$listed = array_slice($ids, 0, self::MAX_REPORTED_ALLOWED_VALUES);
		$hidden = count($ids) - count($listed);

		$text = 'Allowed values (' . count($ids) . '): ' . implode(', ', $listed);

		return $hidden > 0
			? $text . " and {$hidden} more."
				. ' Read the whole set from the "options" of this setting in the block catalog.'
			: $text . '.'
		;
	}

	/**
	 * One value against the published option set, phrased for a setting that holds a single value.
	 *
	 * @param array<string, true> $validIds
	 */
	private static function validateOptionValue(
		mixed $value,
		Setting $setting,
		array $validIds,
		string $path,
		?ValidationContext $context = null,
		?string $blockType = null,
		?string $presetId = null,
		?array $documentType = null,
	): Result
	{
		$result = new Result();

		if (self::isAllowedOptionValue($value, $setting, $validIds, $context, $blockType, $presetId, $documentType))
		{
			return $result;
		}

		$result->addError(GraphError::at(
			$path,
			"{$path} is not valid. Allowed values: " . implode(', ', array_keys($validIds)),
		));

		return $result;
	}

	/**
	 * The verdict on one value, kept apart from the wording so that a single value and an element of a list are
	 * judged by the very same code and answered by different ones. An empty value is not an option violation -
	 * requiredness is a separate check - and an entity-reference setting may carry an expression instead of an id.
	 *
	 * @param array<string, true> $validIds
	 */
	private static function isAllowedOptionValue(
		mixed $value,
		Setting $setting,
		array $validIds,
		?ValidationContext $context,
		?string $blockType,
		?string $presetId,
		?array $documentType,
	): bool
	{
		if ($value === null)
		{
			return true;
		}

		// A number is the same id in another transport shape - the core leaves a JSON number unconverted - so it is
		// judged by its string form. Anything not scalar is a shape no option can hold, and letting it past unjudged
		// was the very bypass this check exists to close.
		if (!is_scalar($value))
		{
			return false;
		}

		$value = (string)$value;
		if ($value === '')
		{
			return true;
		}

		if (self::allowsEntityReferenceExpression($setting) && \CBPActivity::isExpression($value))
		{
			return true;
		}

		if (isset($validIds[$value]))
		{
			return true;
		}

		// A value the template the agent was handed already holds under this very preset and document type passes;
		// one the agent authored, and one carried under another preset or another document type of the same block
		// type, is still held to the current list. Why: {@see ValidationContext::hasCarriedOptionValue()}.
		return $blockType !== null
			&& $context?->hasCarriedOptionValue($blockType, $presetId, $setting->name, $value, $documentType) === true
		;
	}

	/**
	 * The only array shapes a single USER value is persisted in: the empty list (no user) and a one-element list.
	 * Every other shape is a value the schema cannot hold, so it is refused rather than folded into a scalar:
	 * a multi-element list would be silently truncated to its first element, and a nested one would stringify to
	 * the literal 'Array'. `(string)` is applied instead of a truthiness test, so the id '0' stays '0' rather than
	 * collapsing into the empty string a required setting would then report as missing.
	 *
	 * @return string|null null means "not coercible" - the caller turns it into a type error
	 */
	private function coerceSingleUserValue(array $value): ?string
	{
		if (!array_is_list($value))
		{
			return null;
		}

		if ($value === [])
		{
			return '';
		}

		if (count($value) !== 1 || !is_scalar($value[0]))
		{
			return null;
		}

		return (string)$value[0];
	}

	/**
	 * An activity that declares `AllowSelection` on an option-bearing property makes the expression part of the
	 * setting's contract: the dialog offers the expression picker and stores what it picks alongside the ids, so
	 * refusing it here would refuse a value assembled by hand in the editor.
	 *
	 * The `botId` branch remains for descriptions that carry no such flag - a hand-written `.ai.php` declares no
	 * `AllowSelection` - and stays as narrow as it was: numeric option ids alone do not prove that an option is a
	 * portal entity, static enums often use numbers too. Every other option set stays closed.
	 */
	private static function allowsEntityReferenceExpression(Setting $setting): bool
	{
		if ($setting->options === null)
		{
			return false;
		}

		if ($setting->allowSelection)
		{
			return true;
		}

		return mb_strtolower($setting->name) === 'botid'
			&& self::optionsArePositiveIntegerIds($setting->options)
		;
	}

	/** The digit test is a PCRE one because the ctype extension is absent on portals: a call into it is a fatal. */
	private static function optionsArePositiveIntegerIds(SettingOptionCollection $options): bool
	{
		if (count($options) === 0)
		{
			return false;
		}

		foreach ($options as $option)
		{
			if (preg_match('/^[0-9]+$/D', $option->id) !== 1 || (int)$option->id <= 0)
			{
				return false;
			}
		}

		return true;
	}

	private function getValueAsArray(string|array $value): mixed
	{
		if (is_array($value))
		{
			return $value;
		}

		try
		{
			return Json::decode($value);
		}
		catch (ArgumentException)
		{
			return null;
		}
	}

	public function getExpectedTypeValue(): array|string|null
	{
		return $this->expectedTypeValue;
	}
}
