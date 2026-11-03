<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$runtime = CBPRuntime::GetRuntime();
$runtime->IncludeActivityFile('SequenceActivity');

/** @property-read CBPActivityCondition Condition */
class CBPIfElseBranchActivity extends CBPSequenceActivity
{
	/** The AI contract of an activity reports into the channel of the AI description service. */
	private const AI_LOGGER_ID = 'bizproc.aiassistant.activity_description';

	/**
	 * Answers of {@see self::getAiPassthroughSettingNames()} per document type. Resolving them walks the whole
	 * activity catalog, which {@see \Bitrix\Bizproc\Runtime\ActivitySearcher\Searcher::searchByType()} does not
	 * memoise, while one reverse AI entry asks for them once per node that carries a condition.
	 *
	 * @var array<string, list<string>>
	 */
	private static array $aiConditionCodes = [];

	/**
	 * Answers of {@see self::getAiRestrictedSettingNames()} per document type. An answer a condition could not be
	 * asked for is absent from here on purpose - see the method.
	 *
	 * @var array<string, list<string>>
	 */
	private static array $aiRestrictedConditionCodes = [];

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			"Title" => "",
			"Condition" => null,
		];
	}

	public function execute()
	{
		$rootNode = $this->getRootActivity();
		if (!($rootNode instanceof CBPNodeWorkflowActivity))
		{
			return parent::execute();
		}

		$condition = $this->Condition;
		$isTrue = $condition?->evaluate($this) ?? true;

		$this->outputPortId = $isTrue ? 0 : 1;

		return CBPActivityExecutionStatus::Closed;
	}

	public function pullProperties(): array
	{
		$condition = $this->Condition;
		$this->Condition = null;
		$result = parent::pullProperties();
		$this->Condition = $condition;

		return $result;
	}

	protected function GetACNames()
	{
		$ar = parent::GetACNames();
		if ($this->arProperties["Condition"] != null)
		{
			$ar[] = mb_substr(get_class($this->arProperties["Condition"]), 3);
		}

		return $ar;
	}

	public function InitializeFromArray($arParams)
	{
		if (is_array($arParams))
		{
			foreach ($arParams as $key => $value)
			{
				$this->arProperties["Condition"] = $this->CreateCondition($key, $value);
				if ($this->arProperties["Condition"] != null)
				{
					break;
				}
			}
		}
	}

	private function CreateCondition($conditionCode, $data)
	{
		$runtime = CBPRuntime::GetRuntime();
		if ($runtime->IncludeActivityFile($conditionCode))
		{
			return CBPActivityCondition::CreateInstance($conditionCode, $data);
		}
		else
		{
			return null;
		}
	}

	public static function ValidateProperties($arTestProperties = [], CBPWorkflowTemplateUser $user = null)
	{
		$arErrors = [];

		$runtime = CBPRuntime::GetRuntime();
		$arActivities = $runtime->SearchActivitiesByType("condition");

		foreach ($arTestProperties as $key => $value)
		{
			if (array_key_exists(mb_strtolower($key), $arActivities))
			{
				$runtime->IncludeActivityFile($key);

				$arErrors = array_merge(
					CBPActivityCondition::CallStaticMethod(
						$key,
						"ValidateProperties",
						[$value, $user]
					),
					$arErrors
				);
			}
		}

		return array_merge($arErrors, parent::ValidateProperties($arTestProperties, $user));
	}

	public static function getAiPassthroughSettingNames(array $documentType): array
	{
		// Condition codes are stored as property keys; take them from the same source as the graph.
		return self::$aiConditionCodes[implode('|', $documentType)] ??= array_keys(
			CBPRuntime::GetRuntime()->SearchActivitiesByType('condition', $documentType)
		);
	}

	/**
	 * Condition codes whose payload is executable, so an AI agent may only pass an existing one through verbatim.
	 * Membership is asked of the condition class itself ({@see CBPActivityCondition::requiresAdminToAuthor()}),
	 * not hard-coded: today only `codecondition` answers true, but a new executable condition joins the rule by
	 * declaring it. The EXCLUDED flag is deliberately not used - it is distribution-specific and marks a different
	 * property (whether the editor offers the condition at all).
	 *
	 * The codes come from the passthrough list rather than from a catalog walk of its own: this is a subset of
	 * that list, and both are asked for on the same reverse entry.
	 *
	 * A condition that could not be asked is answered as restricted: the barrier of ALG-04 lets an agent author
	 * every name absent from this set, so an unknown status has to refuse authorship instead of granting it. The
	 * published template still survives the round-trip - the barrier compares against a baseline built through
	 * this very method, so the same code is restricted on both sides and its unchanged value matches. Such an
	 * answer is not memoised either: the restriction belongs to the failed load, not to the condition, and must
	 * not settle the question for the rest of the process.
	 */
	public static function getAiRestrictedSettingNames(array $documentType): array
	{
		$cacheKey = implode('|', $documentType);
		if (isset(self::$aiRestrictedConditionCodes[$cacheKey]))
		{
			return self::$aiRestrictedConditionCodes[$cacheKey];
		}

		$restricted = [];
		$isComplete = true;

		foreach (self::getAiPassthroughSettingNames($documentType) as $code)
		{
			try
			{
				if (CBPActivityCondition::CallStaticMethod($code, 'requiresAdminToAuthor') === true)
				{
					$restricted[] = $code;
				}
			}
			catch (Throwable $exception)
			{
				$restricted[] = $code;
				$isComplete = false;
				(new \Bitrix\Main\Diag\LoggerFactory())->createById(self::AI_LOGGER_ID)?->error(
					'Condition {code} could not be asked whether authoring it needs admin rights and stays'
					. ' restricted until it can be: {error}',
					['code' => $code, 'error' => $exception->getMessage()],
				);
			}
		}

		if (!$isComplete)
		{
			return $restricted;
		}

		return self::$aiRestrictedConditionCodes[$cacheKey] = $restricted;
	}

	public static function GetPropertiesDialog(
		$documentType, $activityName, $arWorkflowTemplate, $arWorkflowParameters, $arWorkflowVariables,
		$arCurrentValues = null, $formName = "", $popupWindow = null, $currentSiteId = null, $arWorkflowConstants = null
	)
	{
		if (!is_array($arWorkflowParameters))
		{
			$arWorkflowParameters = [];
		}
		if (!is_array($arWorkflowVariables))
		{
			$arWorkflowVariables = [];
		}

		$runtime = CBPRuntime::GetRuntime();
		$arActivities = $runtime->SearchActivitiesByType("condition", $documentType);

		$defaultCondition = "truecondition";
		$defaultConditionValue = null;
		if (!is_array($arCurrentValues))
		{
			$arCurrentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
			if (is_array($arCurrentActivity["Properties"]))
			{
				foreach ($arCurrentActivity["Properties"] as $key => $value)
				{
					if (array_key_exists($key, $arActivities))
					{
						$defaultCondition = $key;
						$defaultConditionValue = $value;
						break;
					}
				}
			}
		}

		$firstConditionType = "";
		$arActivityKeys = array_keys($arActivities);
		foreach ($arActivityKeys as $activityKey)
		{
			if (!empty($arActivities[$activityKey]['EXCLUDED']))
			{
				unset($arActivities[$activityKey]);
				continue;
			}

			$runtime->IncludeActivityFile($activityKey);
			$v = CBPActivityCondition::CallStaticMethod(
				$activityKey,
				"GetPropertiesDialog",
				[
					$documentType,
					$arWorkflowTemplate,
					$arWorkflowParameters,
					$arWorkflowVariables,
					(($defaultCondition == $activityKey) ? $defaultConditionValue : null),
					$arCurrentValues,
					$formName,
					$popupWindow,
					$currentSiteId,
					$arWorkflowConstants,
				]
			);
			if ($v == null)
			{
				unset($arActivities[$activityKey]);
				continue;
			}

			$arActivities[$activityKey]["PROPERTIES_DIALOG"] = $v;
			if ($firstConditionType == '')
			{
				$firstConditionType = $activityKey;
			}
		}

		if (!is_array($arCurrentValues))
		{
			$arCurrentValues = ["condition_type" => $defaultCondition];
		}

		return $runtime->ExecuteResourceFile(
			__FILE__,
			"properties_dialog.php",
			[
				"arActivities" => $arActivities,
				"arCurrentValues" => $arCurrentValues,
				"firstConditionType" => $firstConditionType,
			]
		);
	}

	public static function GetPropertiesDialogValues(
		$documentType, $activityName, &$arWorkflowTemplate, &$arWorkflowParameters, &$arWorkflowVariables,
		$arCurrentValues, &$arErrors, $arWorkflowConstants = null
	)
	{
		$runtime = CBPRuntime::GetRuntime();
		$arActivities = $runtime->SearchActivitiesByType("condition", $documentType);

		if (!array_key_exists($arCurrentValues["condition_type"], $arActivities))
		{
			$arErrors[] = [
				"code" => "",
				"message" => GetMessage("BPIEBA_EMPTY_TYPE"),
			];

			return false;
		}

		$arCurrentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
		if (!is_array($arCurrentActivity["Properties"]))
		{
			$arCurrentActivity["Properties"] = [];
		}

		foreach ($arActivities as $key => $value)
		{
			if (array_key_exists($key, $arCurrentActivity["Properties"]))
			{
				unset($arCurrentActivity["Properties"][$key]);
			}
		}

		$condition = CBPActivityCondition::CallStaticMethod(
			$arCurrentValues["condition_type"],
			"GetPropertiesDialogValues",
			[
				$documentType,
				$arWorkflowTemplate,
				$arWorkflowParameters,
				$arWorkflowVariables,
				$arCurrentValues,
				&$arErrors,
				$arWorkflowConstants,
			]
		);

		if ($condition != null)
		{
			$arCurrentActivity["Properties"][$arCurrentValues["condition_type"]] = $condition;

			return true;
		}

		return false;
	}

	public function collectUsages()
	{
		$usages = parent::collectUsages();
		foreach ($this->arProperties as $property)
		{
			if ($property instanceof CBPActivityCondition)
			{
				$usages = array_merge($usages, $property->collectUsages($this));
			}
		}

		return $usages;
	}
}
