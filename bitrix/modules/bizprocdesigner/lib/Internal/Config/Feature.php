<?php

namespace Bitrix\BizprocDesigner\Internal\Config;

use Bitrix\Bizproc\Internal\Service\Feature\AiAgentsFeature;
use Bitrix\Bizproc\Internal\Service\ProcessData\ProcessDataFeature;
use Bitrix\Bizproc\Public\Service\AiAgent\RegionAvailabilityService;
use Bitrix\Bizproc\Public\Service\LastValues\LastValuesService;
use Bitrix\Bizproc\Public\Service\WorkflowTemplate\PilotEditorStateService;
use Bitrix\BizprocDesigner\Public\Features\ComponentLibrary;
use Bitrix\Main;
use Bitrix\Main\DI\Exception\CircularDependencyException;
use Bitrix\Main\DI\Exception\ServiceNotFoundException;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\BizprocDesigner\Internal\Trait\SingletonTrait;
use Bitrix\Main\ObjectNotFoundException;

class Feature
{
	use SingletonTrait;

	private const MODULE_NAME = 'bizprocdesigner';

	public function isAiAssistantAvailable(): bool
	{
		return $this->getOptionValue('ai_assistant_available', 'N') === 'Y';
	}

	public function isExternalAiAgentAvailable(): bool
	{
		return $this->getOptionValue('external_ai_agent_available', 'N') === 'Y';
	}

	public function areComplexNodeConnectionsAvailable(): bool
	{
		return $this->getOptionValue('complex_node_connections_available', 'N') === 'Y';
	}

	public function isDebugBarAvailable(): bool
	{
		return $this->getOptionValue('debugger_available', 'N') === 'Y';
	}

	/**
	 * Closes only the history interface: capturing the versions themselves is governed by the option of
	 * the bizproc module and is switched on earlier.
	 */
	public function isVersionHistoryAvailable(): bool
	{
		return $this->getOptionValue('version_history_available', 'N') === 'Y';
	}

	/**
	 * Covers the editing lease and the draft conflict guard. The editor passes the state to bizproc in each
	 * write request, so bizproc keeps no dependency on this module or its option.
	 */
	public function isTemplateEditLockAvailable(): bool
	{
		return $this->getOptionValue('template_edit_lock_available', 'N') === 'Y';
	}

	public function isNodeFilterAvailable(): bool
	{
		return $this->getOptionValue('node_filter_available', 'N') === 'Y';
	}

	/**
	 * Closes the whole server surface of the note discussions, not only the controller: the hint of the
	 * mentions answers an empty result while it is off, so a disabled feature is refused on the server
	 * and not merely hidden in the interface.
	 */
	public function areTemplateNotesAvailable(): bool
	{
		return $this->getOptionValue('template_notes_available', 'N') === 'Y';
	}

	/**
	 * Closes the interface behaviour alone: the link between a frame and the nodes lying in it is
	 * never sent to the server, so there is nothing here to refuse.
	 */
	public function isFrameNodeStickingAvailable(): bool
	{
		return $this->getOptionValue('frame_node_sticking_available', 'N') === 'Y';
	}

	/**
	 * Closes the whole surface of the library of the reusable assemblies: both the entry points of the
	 * client and every action of its controller, so a disabled feature is refused on the server and not
	 * merely hidden in the interface (DTO-04).
	 *
	 * The only flag of this registry kept in the package of the main module rather than in an option of the
	 * editor: the feature is new, and a new flag belongs to the mechanism the repository moved to
	 * ({@see \Bitrix\Main\Config\Feature}, main 26.700.0 and up). What the neighbours above answer by is not
	 * touched - migrating them is the business of their own tasks. The registry of the codes stays the one
	 * place that turns the verdict into the `componentLibrary` code of the client, so nothing but this line
	 * knows where the verdict comes from.
	 */
	public function isComponentLibraryAvailable(): bool
	{
		return Main\Config\Feature::isEnabled(ComponentLibrary::class);
	}

	public function areDataTablesAvailable(): bool
	{
		return Main\Config\Option::get('bizproc', 'dataview_enabled', 'N') === 'Y';
	}

	/**
	 * The window of the designer and the server rules of the labels are one feature: the switch of bizproc
	 * is asked, not repeated here.
	 */
	public function isProcessDataAvailable(): bool
	{
		return ProcessDataFeature::isEnabled();
	}

	public function isExpressionBuilderAvailable(): bool
	{
		return $this->getOptionValue('expression_builder_available', 'N') === 'Y';
	}

	public function isReadableExpressionsAvailable(): bool
	{
		return $this->getOptionValue('readable_expressions_available', 'N') === 'Y';
	}

	/**
	 * Closes only the summary of the node settings shown by the settings panel: the providers and the
	 * content block of the canvas are resolved regardless of the flag.
	 */
	public function isRulesSummaryAvailable(): bool
	{
		return $this->getOptionValue('rules_summary_available', 'N') === 'Y';
	}

	/**
	 * The editor has no flag of its own here: showing the values of the last run makes sense only while
	 * bizproc really captures them, so both sides follow the single option of that module.
	 */
	public function isLastRunValuesAvailable(): bool
	{
		return Main\Loader::includeModule('bizproc') && (new LastValuesService())->isAvailable();
	}

	/**
	 * The editor has no flag of its own here either: the choice of the audience may only be offered while
	 * the module of the processes really accepts a pilot publication, so both sides follow the single
	 * source of that flag instead of reading the option twice.
	 */
	public function isPilotPublicationAvailable(): bool
	{
		return Main\Loader::includeModule('bizproc') && (new PilotEditorStateService())->isFeatureEnabled();
	}

	public function getAgentTokenTtl(): int
	{
		$ttl = (int)Main\Config\Option::get(self::MODULE_NAME, 'agent_token_ttl', 86400);

		// A non-positive TTL would make the token expire at or before creation (expire_at <= now),
		// breaking the whole lifecycle; fall back to the safe default for such invalid overrides.
		if ($ttl <= 0)
		{
			return 86400;
		}

		return $ttl;
	}

	private function getOptionValue(string $option, mixed $defaultValue): ?string
	{
		return Main\Config\Option::get(self::MODULE_NAME, $option, $defaultValue);
	}

	/**
	 * @return list<string>
	 */
	public function getAvailableFeatureCodes(): array
	{
		$featureCodes = [];
		if ($this->isAiAssistantAvailable())
		{
			$featureCodes[] = 'aiAssistant';
		}

		if ($this->areComplexNodeConnectionsAvailable())
		{
			$featureCodes[] = 'complexNodeConnections';
		}

		if ($this->isDebugBarAvailable())
		{
			$featureCodes[] = 'debugBar';
		}

		if ($this->areDataTablesAvailable())
		{
			$featureCodes[] = 'dataTables';
		}

		if ($this->isExternalAiAgentAvailable())
		{
			$featureCodes[] = 'externalAiAgent';
		}

		if ($this->isExpressionBuilderAvailable())
		{
			$featureCodes[] = 'expressionBuilder';
		}

		if ($this->isReadableExpressionsAvailable())
		{
			$featureCodes[] = 'readableExpressions';
		}

		if ($this->isLastRunValuesAvailable())
		{
			$featureCodes[] = 'lastRunValues';
		}

		if ($this->isVersionHistoryAvailable())
		{
			$featureCodes[] = 'versionHistory';
		}

		if ($this->isTemplateEditLockAvailable())
		{
			$featureCodes[] = 'templateEditLock';
		}

		if ($this->isPilotPublicationAvailable())
		{
			$featureCodes[] = 'pilotPublication';
		}

		if ($this->areTemplateNotesAvailable())
		{
			$featureCodes[] = 'templateNotes';
		}

		if ($this->isRulesSummaryAvailable())
		{
			$featureCodes[] = 'rulesSummary';
		}

		if ($this->isFrameNodeStickingAvailable())
		{
			$featureCodes[] = 'frameNodeSticking';
		}

		if ($this->isNodeFilterAvailable())
		{
			$featureCodes[] = 'nodeFilter';
		}

		if ($this->isProcessDataAvailable())
		{
			$featureCodes[] = 'processData';
		}

		if ($this->isComponentLibraryAvailable())
		{
			$featureCodes[] = 'componentLibrary';
		}

		return $featureCodes;
	}

	/**
	 * @return list<string>
	 */
	public function getLockedFeatureCodes(): array
	{
		$lockedCodes = [];

		if ($this->isExternalAiAgentAvailable() && !$this->isExternalAiAgentUnlocked())
		{
			$lockedCodes[] = 'externalAiAgent';
		}

		return $lockedCodes;
	}

	/**
	 * The single server-side gate of the external AI agent feature: the rollout option is enabled AND
	 * the feature is unlocked for the portal (AI tariff + region). The REST availability filter and the
	 * agent-token issuance controller call it so a disabled feature is refused on the server, not merely
	 * hidden in the UI.
	 *
	 * @throws CircularDependencyException
	 * @throws ObjectNotFoundException
	 */
	public function isExternalAiAgentAccessible(): bool
	{
		return $this->isExternalAiAgentAvailable() && $this->isExternalAiAgentUnlocked();
	}

	/**
	 * @throws CircularDependencyException
	 * @throws ObjectNotFoundException
	 */
	private function isExternalAiAgentUnlocked(): bool
	{
		try
		{
			$aiAgentsFeature = ServiceLocator::getInstance()->get(AiAgentsFeature::class);
		}
		catch (ServiceNotFoundException)
		{
			$aiAgentsFeature = null;
		}

		if ($aiAgentsFeature !== null && !$aiAgentsFeature->isAvailable())
		{
			return false;
		}

		try
		{
			$regionService = ServiceLocator::getInstance()->get(RegionAvailabilityService::class);
		}
		catch (ServiceNotFoundException)
		{
			$regionService = null;
		}

		if ($regionService !== null && !$regionService->isAvailable())
		{
			return false;
		}

		return true;
	}
}
