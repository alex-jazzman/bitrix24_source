<?php

declare(strict_types=1);

namespace Bitrix\BizprocDesigner\Infrastructure\Controller\Activity;

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\NodeBlockType;
use Bitrix\Bizproc\Api\Enum\ErrorMessage;
use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Internal\Service\Activity\ComplexActivityService;
use Bitrix\Bizproc\Internal\Service\Container;
use Bitrix\Bizproc\Public\Activity\Configurator;
use Bitrix\BizprocDesigner\Infrastructure\Dto\Activity\Complex\AvailableBlocksDto;
use Bitrix\BizprocDesigner\Infrastructure\Dto\Activity\Complex\CapabilityCatalogResponseDto;
use Bitrix\BizprocDesigner\Infrastructure\Dto\Activity\Complex\SaveSettingsRequestDto;
use Bitrix\BizprocDesigner\Infrastructure\Dto\Activity\Complex\Rule\ActionExpressionDto;
use Bitrix\BizprocDesigner\Infrastructure\Enum\ConstructionType;
use Bitrix\BizprocDesigner\Internal\Exception\CommandValidateException;
use Bitrix\BizprocDesigner\Infrastructure\Dto\Activity\Complex\ActionDictionaryEntryDto;
use Bitrix\BizprocDesigner\Infrastructure\Dto\Activity\Complex\LoadSettingsResponseDto;
use Bitrix\BizprocDesigner\Infrastructure\Dto\Activity\Complex\PortRuleDto;
use Bitrix\BizprocDesigner\Internal\Command\Activity\Complex\ConvertRuleCommand;
use Bitrix\BizprocDesigner\Internal\Command\Activity\Complex\ConvertRuleCommandResult;
use Bitrix\BizprocDesigner\Internal\Command\Activity\Complex\SaveSingleRuleCommand;
use Bitrix\BizprocDesigner\Internal\Command\Activity\Complex\SaveSingleRuleCommandResult;
use Bitrix\BizprocDesigner\Internal\Command\Activity\Complex\ValidateSingleRuleCommand;
use Bitrix\BizprocDesigner\Internal\Config\Feature;
use Bitrix\BizprocDesigner\Internal\Entity\ActivityData;
use Bitrix\BizprocDesigner\Internal\Service\Activity\RuleContentBlock;
use Bitrix\BizprocDesigner\Internal\Service\Container as DesignerContainer;
use Bitrix\BizprocDesigner\Internal\Service\RelationAutofillMatcher;
use Bitrix\BizprocDesigner\Internal\Service\TemplateEditAccess;
use Bitrix\BizprocDesigner\Public\Service\Activity\TriggerUpgradeResolver;
use Bitrix\Main\Engine\AutoWire\ExactParameter;
use Bitrix\Main\Loader;
use Bitrix\Main\Error;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Result;
use Bitrix\Main\Web\Json;
use CBPCanUserOperateOperation;
use CBPDocument;
use Exception;

class Complex extends \Bitrix\Main\Engine\JsonController
{
	private const MAX_AUTOFILL_SOURCES = 50;
	private const MAX_AUTOFILL_OUTPUTS_PER_SOURCE = 500;
	private const MAX_AUTOFILL_PACKAGE_ENTRIES_PER_SOURCE = 500;
	private const MAX_AUTOFILL_IDENTIFIER_LENGTH = 128;
	private const MAX_AUTOFILL_FIELD_ID_LENGTH = 128;
	private const MAX_DOCUMENT_TYPE_PART_LENGTH = 128;

	// Field of the settings form that is edited on the basic tab of the panel and never counted among the
	// base settings, exactly as the form of those settings leaves it out (EditBaseSettings.prepareNodeControls).
	private const TITLE_FIELD_NAME = 'title';

	protected function init()
	{
		parent::init();
		Loader::requireModule('bizproc');
	}

	public function getAutoWiredParameters()
	{
		return [
			new ExactParameter(
				PortRuleDto::class,
				'portRule',
				static fn(string $className, array $portRule) => PortRuleDto::fromArray($portRule),
			),
			new ExactParameter(
				ActivityData::class,
				'activity',
				static fn(string $className, array $activity) => ActivityData::createFromArray($activity),
			),
			new ExactParameter(
				SaveSettingsRequestDto::class,
				'saveSettingsRequest',
				static fn(string $className, array $saveSettingsRequest) => SaveSettingsRequestDto::fromArray($saveSettingsRequest),
			),
		];
	}

	/**
	 * @param ActivityData $activity Target complex node whose settings are loaded.
	 * @param array $sources Relation ancestors of the target node (canonical source shape, owned here):
	 *   list of {
	 *     blockId: string,
	 *     documentType: array[moduleId, entity, documentType],
	 *     outputs: string[],         // normalized ReturnProperties codes of the ancestor block
	 *     documentOutput?: string,   // code of the ancestor document output that carries the linked entity id
	 *     package?: list of {
	 *       id: string,
	 *       fieldId: string,
	 *       targetDocumentType: array[moduleId, entity, documentType],
	 *       required?: bool
	 *     }
	 *   }.
	 *   `outputs` are the ancestor's real normalized ReturnProperties, held by the frontend on the canvas
	 *   (same data ValueSelector uses to build {=block.id:property.Id}). `documentOutput` is the accessor
	 *   seam through which the linked entity id is reached (`{=blockId:documentOutput.propertyId}`).
	 *   `package` carries direct target-field descriptors published by the ancestor.
	 *   These values only ever come from the frontend, so a source missing them builds no corresponding
	 *   autofill branch. Empty $sources keeps the response backward compatible (autofillMap stays empty).
	 * @param array $documentType Edited template document type ([moduleId, entity, documentType]). Used as the
	 *   node's effective document type when it has no fixed one, feeding node-action resolution and the
	 *   available-blocks lookup. Legacy loads omit it and stay unaffected.
	 * @param int $templateId Edited template identifier for requests with relation sources; zero for a new template.
	 */
	public function loadSettingsAction(
		ActivityData $activity,
		array $sources = [],
		array $documentType = [],
		int $templateId = 0,
	): ?LoadSettingsResponseDto
	{
		if (empty($activity->type))
		{
			return null;
		}

		$isTemplateAutofillRequest = $sources !== [] && ($templateId > 0 || $documentType !== []);
		if ($isTemplateAutofillRequest && !$this->canLoadRelationAutofill($templateId, $documentType))
		{
			$this->addError(ErrorMessage::ACCESS_DENIED->getError());

			return null;
		}

		// The template document type is authorized first for ordinary loads, as in the catalog and save actions:
		// without it a node publishing that very type would slip past the resolved-type check below as
		// "the one and same". A legacy load carries no document type and keeps its pre-gate behaviour.
		if (!$isTemplateAutofillRequest && $documentType !== [])
		{
			$result = $this->validateCurrentUserOperateDocument(
				operation: CBPCanUserOperateOperation::CreateWorkflow,
				documentType: $documentType,
			);
			if (!$result->isSuccess())
			{
				$this->addErrors($result->getErrors());

				return null;
			}
		}

		$complexActivityService = Container::instance()->getComplexActivityService();
		$complexActivityName = strtolower($activity->type);

		// Resolve description once; reuse for the panel gate below, for nodeSettings and for
		// getCorrespondingNodeActionActivityByName, to avoid a duplicate getActivityDescriptionByCode lookup.
		$nodeDescription = $complexActivityService->getActivityDescriptionByCode($complexActivityName);

		$configurator = \CBPActivity::createConfigurator($activity->type, $activity->properties);
		if (!$this->isNodeSettingsSurfaceAvailable($complexActivityName, $configurator, $nodeDescription))
		{
			$this->addActivityNotFoundError($activity->type);

			return null;
		}

		// Two answers, and they are not interchangeable: the class-declared type gates the surfaces with a
		// runtime counterpart (the filter block, the relation autofill), while the published one is what the
		// panel works in - it also carries the document type of the event of a trigger.
		$fixedDocumentType = $complexActivityService->getFixedDocumentTypeForNodeAction($activity->type);
		$publishedDocumentType = $complexActivityService->getPublishedDocumentTypeForNode(
			$activity->type,
			$activity->properties,
		);

		// Before the action catalog of that document type is built, and therefore before any of it is disclosed.
		// Unconditional, autofill request included: the template right the autofill branch is gated by answers
		// about the template, not about the type a foreign node publishes, so skipping this would turn that
		// branch into a general bypass of the document rights of the controller.
		$accessResult = $this->validateResolvedDocumentTypeAccess($publishedDocumentType, $documentType);
		if (!$accessResult->isSuccess())
		{
			$this->addErrors($accessResult->getErrors());

			return null;
		}

		$filterAvailability = DesignerContainer::getNodeFilterAvailability();
		$effectiveDocumentType = $filterAvailability->resolveEffectiveDocumentType($publishedDocumentType, $documentType);

		$nodeSettings = $nodeDescription?->getComplexActivitySettings();

		$nodeActionCollection = $complexActivityService
			->getCorrespondingNodeActionActivityByName($complexActivityName, $effectiveDocumentType)
		;

		$portRuleDtoDictionary = $this->extractRulePropertyValue($configurator, $activity);
		if (!$portRuleDtoDictionary)
		{
			$this->addError(ErrorMessage::UNKNOWN_ERROR->getError());

			return null;
		}

		$searcher = Container::instance()->getActivitySearcherService();
		$actionCatalogMap = Container::instance()->getActionCatalogMapService();

		// isRelationCreate feeds the autofill consumer only, which is itself gated behind the
		// relation-connections feature. With the feature off the flag stays false and the map is skipped.
		$relationsAvailable = Feature::instance()->areComplexNodeConnectionsAvailable();

		$actionDictionary = [];
		$hasRelationCreateAction = false;
		foreach ($nodeActionCollection as $nodeAction)
		{
			$properties = $nodeAction->get('PROPERTIES');
			$normalizedCode = $searcher->normalizeActivityCode($nodeAction->getClass());
			$group = $nodeSettings?->actionDictionary->get($normalizedCode)?->group?->value;
			// Actions coming from the global catalog have no dictionary entry — group comes from
			// their own classification, the same fallback the capability catalog applies.
			$group ??= $actionCatalogMap->getAvailableClassification($normalizedCode)?->group?->value;
			// A relation "Create" sub-action is flagged by CREATES_DOCUMENT in its node-action settings
			// (design-time metadata), so its class is never loaded just to detect it and any create-kind
			// activity qualifies regardless of its base class (e.g. SPA create extends BaseActivity).
			$isRelationCreate = $relationsAvailable
				&& ($nodeAction->getNodeActionSettings()['CREATES_DOCUMENT'] ?? false);
			$hasRelationCreateAction = $hasRelationCreateAction || $isRelationCreate;
			$actionDictionary[$nodeAction->getClass()] = new ActionDictionaryEntryDto(
				id: $nodeAction->getClass(),
				title: $nodeAction->getName(),
				handlesDocument: $nodeAction->getNodeActionSettingsDto()?->handlesDocument ?? false,
				group: $group,
				properties: is_array($properties) ? $properties : null,
				isRelationCreate: $isRelationCreate,
			);
		}

		$relationActionDto = null;
		$relationActionDescription = $complexActivityService->getRelationActionActivity($complexActivityName);
		if ($relationActionDescription)
		{
			$properties = $relationActionDescription->get('PROPERTIES');
			$relationActionDto = new ActionDictionaryEntryDto(
				id: $relationActionDescription->getClass(),
				title: $relationActionDescription->getName(),
				handlesDocument: $relationActionDescription->getNodeActionSettings()['HANDLES_DOCUMENT'] ?? false,
				properties: is_array($properties) ? $properties : null,
			);
		}

		// The saved relation dictionary is served only while the node actually offers the relations
		// surface - the same availability the capability catalog reports to the frontend. Otherwise
		// relation data saved before the availability gates existed would round-trip through the
		// settings form of a node whose UI can neither show nor edit it.
		$relationPortRuleDtoDictionary = [];
		if ($this->isRelationsSurfaceAvailable($nodeDescription, $relationsAvailable))
		{
			$relationsRaw = $activity->properties['Relations'] ?? [];
			if (is_array($relationsRaw))
			{
				foreach ($relationsRaw as $portId => $ruleCollection)
				{
					if (is_array($ruleCollection))
					{
						$relationPortRuleDtoDictionary[$portId] = PortRuleDto::fromArray($ruleCollection);
					}
				}
			}
		}

		$filterRuntimeAvailable = $filterAvailability->isRuntimeAvailable($fixedDocumentType, $documentType);

		// getAvailableBlocksForNode() avoids a second getCorrespondingNodeActionActivityByName() traversal.
		$availableBlocks = Container::instance()->getCapabilityCatalogService()->getAvailableBlocksForNode(
			activityType: $activity->type,
			filterAvailable: $filterRuntimeAvailable,
			relationsAvailable: $relationsAvailable,
			documentType: $effectiveDocumentType,
			filterModuleSupported: $filterAvailability->supportsModule($fixedDocumentType, $documentType),
		);

		$availableBlocksDto = $availableBlocks !== null
			? AvailableBlocksDto::fromBlockAvailability($filterAvailability->hideFilterUntilRolledOut($availableBlocks))
			: null;

		// filterSupported is a mirror of availableBlocks.filter.available, as its DTO promises: the two
		// cannot disagree, so the client never shows a filter the save path would reject and never hides
		// one it would accept.
		$filterSupported = $filterAvailability->isAvailableForNode($availableBlocks, $filterRuntimeAvailable);

		// The target type always comes from the node declaration.
		$autofillMap = [];
		$autofillRequiredFields = [];
		$autofillConflicts = [];
		if (
			$relationsAvailable
			&& $hasRelationCreateAction
			&& $sources
			&& is_array($fixedDocumentType)
		)
		{
			$accessGranted = $isTemplateAutofillRequest;
			if (!$accessGranted)
			{
				try
				{
					$accessGranted = $this->validateCurrentUserOperateDocument(
						operation: CBPCanUserOperateOperation::CreateWorkflow,
						documentType: $fixedDocumentType,
					)->isSuccess();
				}
				catch (\Throwable)
				{
					$accessGranted = false;
				}
			}

			if ($accessGranted)
			{
				$autofillResult
					= (new RelationAutofillMatcher(Container::instance()->getRelationFieldResolverRegistry()))
						->buildAutofillResult(
							$this->buildSourceCandidates($sources, $fixedDocumentType),
							$fixedDocumentType,
						)
				;
				$autofillMap = $autofillResult->autofillMap;
				$autofillRequiredFields = $autofillResult->autofillRequiredFields;
				$autofillConflicts = $autofillResult->autofillConflicts;
			}
		}

		// The preview of an action is derived, not stored: it is recalculated here from the current
		// configuration of the nested activity, so a template saved before its provider existed gets one
		// without being rewritten, and a copy left in an old template is replaced instead of being served.
		// Only the actions this very node offers are admitted, which is what keeps the client from naming
		// an arbitrary activity of the product and having its provider called. The relation container is
		// drawn by the same preview and admits the single action the node declares for relations - the only
		// one its cards may carry. One instance for both: the budget of recalculations is per request.
		$ruleContentBlock = new RuleContentBlock();
		$ruleContentBlock->resolveForNode($portRuleDtoDictionary, $actionDictionary);
		$ruleContentBlock->resolveForNode(
			$relationPortRuleDtoDictionary,
			$relationActionDto === null ? [] : [$relationActionDto->id => $relationActionDto],
		);

		// The document type the base-settings form of the panel is built in: the one the node publishes,
		// or the one of the template (EditBaseSettings.propertiesDialogDocumentType). Answered here so the
		// short form of the panel can say that a node has nothing to fill in without building that form -
		// and therefore without a request of its own.
		$baseSettingsDocumentType = count($publishedDocumentType ?? []) === 3
			? $publishedDocumentType
			: $documentType
		;

		return new LoadSettingsResponseDto(
			title: $activity->properties['Title'] ?? '',
			description: $activity->properties['EditorComment'] ?? '',
			portRuleDtoDictionary: $portRuleDtoDictionary,
			actionEntryDtoDictionary: $actionDictionary,
			fixedDocumentType: $publishedDocumentType,
			filterSupported: $filterSupported,
			availableBlocks: $availableBlocksDto,
			autofillMap: $autofillMap,
			autofillRequiredFields: $autofillRequiredFields,
			autofillConflicts: $autofillConflicts,
			relationAction: $relationActionDto,
			relationPortRuleDtoDictionary: $relationPortRuleDtoDictionary,
			baseSettingsHasFillableFields: $this->hasFillableBaseSettingsFields(
				$activity,
				$baseSettingsDocumentType,
			),
		);
	}

	private function canLoadRelationAutofill(int $templateId, array $documentType): bool
	{
		try
		{
			if ($templateId > 0)
			{
				$access = new TemplateEditAccess();
				$template = $access->resolve($templateId);

				return $template !== null
					&& ($documentType === [] || $this->isSameDocumentType($template->getDocumentComplexType(), $documentType))
					&& $access->canEdit($template, (int)($this->getCurrentUser()?->getId() ?? 0));
			}

			return $documentType !== [] && $this->validateCurrentUserOperateDocument(
				operation: CBPCanUserOperateOperation::CreateWorkflow,
				documentType: $documentType,
			)->isSuccess();
		}
		catch (\Throwable)
		{
			return false;
		}
	}

	/**
	 * Whether the base settings of the node have a field for a person to fill in at all. Some nodes the
	 * unified panel serves carry nothing but service properties - a manual-start trigger has no setting
	 * of its own - and both forms of the panel then say so instead of showing an empty form.
	 *
	 * Read off the very property map the form of the base settings is built from
	 * ({@see \Bitrix\BizprocDesigner\Infrastructure\Controller\Activity::getSettingsControlsAction()}) and
	 * filtered exactly as that form filters the controls made out of it, so the two cannot disagree about
	 * what is shown: a rules property is the service property of the complex framework and no field of a
	 * person ({@see \Bitrix\Bizproc\Public\Activity\ActivityControlsBuilder::buildPropertyControls()}), a
	 * hidden one carries the identity of the node and the defaults of the map, and the title is edited on the
	 * basic tab and never among the base settings. The map is the whole source of the field set, so it is
	 * read instead of building - and throwing away - a control DTO of every property. The three controls the
	 * builder adds on top of the map are outside the set either way: the title by its name, the id and the
	 * editor comment by being hidden.
	 *
	 * Null when there is no answer to give - no document type to build the property map against, an
	 * activity the runtime cannot configure, or a map that raised. The client then keeps asking the form
	 * itself, exactly as it did before this answer existed.
	 *
	 * The context of the map is narrower here than the one the form builds in, and the difference is not
	 * checked: `getSettingsControlsAction()` also hands `getPropertiesMap()` the workflow template, and that
	 * template is not a stored one - the client assembles it out of the edited node and its ancestors on the
	 * canvas (`EditBaseSettings.compatibleTemplate`) and sends it with the request for the controls. This
	 * action is given no part of it, so there is nothing to pass on. An activity whose property map reads the
	 * template therefore answers a different field set here than its form shows, and the short form of the
	 * panel then says a node needs nothing filled in while its form does have fields. That line is the whole
	 * extent of it: the answer is read by the preview row alone, never by the form and never by the save path.
	 *
	 * What the two do share is the class the map is asked of: the deprecated-to-actual trigger upgrade is
	 * repeated here exactly as that action does it before building the map
	 * ({@see \Bitrix\BizprocDesigner\Public\Service\Activity\TriggerUpgradeResolver}), so a node saved with a
	 * deprecated trigger class is answered by the class replacing it - the one whose form it is shown. The
	 * project context of the form is not part of the difference either: it only adds the state of a project
	 * field to the metadata of a control and never withholds one.
	 */
	private function hasFillableBaseSettingsFields(ActivityData $activity, array $documentType): ?bool
	{
		if (count($documentType) !== 3)
		{
			return null;
		}

		try
		{
			// Same candidate order as the form: a trigger keeps its target in its own Document property, and
			// the document type the panel works in closes the list.
			$upgradeResolver = new TriggerUpgradeResolver();
			$upgrade = $upgradeResolver->resolveUpgradedType(
				$activity->type,
				$upgradeResolver->resolveNodeDocumentType(
					[$activity->properties['Document'] ?? null],
					$documentType,
				),
			);

			$configurator = \CBPActivity::createConfigurator(
				$upgrade['type'],
				$upgradeResolver->applyUpgradeProperties($activity->properties, $upgrade['properties']),
				$documentType,
			);
			if (!$configurator->getActivityType())
			{
				return null;
			}

			foreach ($configurator->getPropertiesMap() as $propertyName => $property)
			{
				if (!is_array($property) || ($property['Type'] ?? '') === FieldType::RULES)
				{
					continue;
				}

				$fieldName = (string)($property['FieldName'] ?? $propertyName);
				if ($fieldName === '' || $fieldName === self::TITLE_FIELD_NAME || !empty($property['Hidden']))
				{
					continue;
				}

				return true;
			}
		}
		catch (\Throwable)
		{
			return null;
		}

		return false;
	}

	/**
	 * @param array $sources Raw relation ancestors from the request.
	 * @return list<array{
	 *   blockId: string,
	 *   documentType: array{string, string, string},
	 *   outputs: list<string>,
	 *   outputSet: array<string, true>,
	 *   documentOutput: string,
	 *   package: list<array{id: string, fieldId: string, targetDocumentType: array{string, string, string}, required: bool}>
	 * }>
	 */
	private function buildSourceCandidates(array $sources, array $targetDocumentType): array
	{
		$candidates = [];
		$seenBlockIds = [];
		foreach (array_slice($sources, 0, self::MAX_AUTOFILL_SOURCES) as $source)
		{
			if (!is_array($source))
			{
				continue;
			}

			$blockId = $source['blockId'] ?? null;
			$documentType = $source['documentType'] ?? null;
			// An absent document output is not malformed: such a source simply builds no accessor.
			$documentOutput = $source['documentOutput'] ?? '';
			if (
				!$this->isExpressionIdentifier($blockId)
				|| !$this->isCanonicalDocumentType($documentType)
				|| ($documentOutput !== '' && !$this->isExpressionIdentifier($documentOutput))
				|| isset($seenBlockIds[$blockId])
			)
			{
				continue;
			}
			$seenBlockIds[$blockId] = true;

			$rawOutputs = $source['outputs'] ?? null;
			$rawPackage = $source['package'] ?? null;
			if (
				(is_array($rawOutputs) && count($rawOutputs) > self::MAX_AUTOFILL_OUTPUTS_PER_SOURCE)
				|| (is_array($rawPackage) && count($rawPackage) > self::MAX_AUTOFILL_PACKAGE_ENTRIES_PER_SOURCE)
			)
			{
				continue;
			}

			// The real normalized ReturnProperties the frontend already holds for the block on the canvas.
			// Without them (and the documentOutput) the candidate cannot build an autofill accessor.
			$outputs = is_array($rawOutputs)
				? $this->normalizeOutputs($rawOutputs)
				: [];
			$outputSet = array_fill_keys($outputs, true);

			$candidates[] = [
				'blockId' => $blockId,
				'documentType' => $documentType,
				'outputs' => $outputs,
				'outputSet' => $outputSet,
				'documentOutput' => $documentOutput,
				'package' => $this->normalizeSourcePackage(
					$rawPackage,
					$outputSet,
					$targetDocumentType,
				),
			];
		}

		return $candidates;
	}

	/**
	 * @param array<string, true> $outputSet
	 * @param array $targetDocumentType Server-resolved document type of the target node.
	 * @return list<array{id: string, fieldId: string, targetDocumentType: array{string, string, string}, required: bool}>
	 */
	private function normalizeSourcePackage(
		mixed $package,
		array $outputSet,
		array $targetDocumentType,
	): array
	{
		if (!is_array($package) || !$this->isCanonicalDocumentType($targetDocumentType))
		{
			return [];
		}

		$normalized = [];
		$seenEntries = [];
		foreach ($package as $entry)
		{
			if (!is_array($entry))
			{
				continue;
			}

			$id = $entry['id'] ?? null;
			$fieldId = $entry['fieldId'] ?? null;
			$entryTargetDocumentType = $entry['targetDocumentType'] ?? null;
			if (
				!$this->isExpressionIdentifier($id)
				|| !isset($outputSet[$id])
				|| !is_string($fieldId)
				|| $fieldId === ''
				|| strlen($fieldId) > self::MAX_AUTOFILL_FIELD_ID_LENGTH
				|| !$this->isCanonicalDocumentType($entryTargetDocumentType)
				|| !$this->isSameDocumentType($entryTargetDocumentType, $targetDocumentType)
			)
			{
				continue;
			}

			$entryKey = $id . "\0" . $fieldId;
			if (isset($seenEntries[$entryKey]))
			{
				continue;
			}
			$seenEntries[$entryKey] = true;

			// The entry named the same target as the server did, so the normalized package carries the
			// server-resolved triplet: what the client spelled it as is not propagated any further.
			$normalized[] = [
				'id' => $id,
				'fieldId' => $fieldId,
				'targetDocumentType' => $targetDocumentType,
				'required' => ($entry['required'] ?? false) === true,
			];
		}

		return $normalized;
	}

	/**
	 * The canonical bizproc document type: the [moduleId, entity, documentType] triplet of non-empty
	 * strings. Any other shape names no ancestor a resolver could relate to the target, and its elements
	 * would still be read as strings down the path, so its source is skipped rather than refused.
	 */
	private function isCanonicalDocumentType(mixed $documentType): bool
	{
		if (!is_array($documentType) || count($documentType) !== 3)
		{
			return false;
		}

		foreach ([0, 1, 2] as $key)
		{
			$element = $documentType[$key] ?? null;
			if (
				!is_string($element)
				|| $element === ''
				|| strlen($element) > self::MAX_DOCUMENT_TYPE_PART_LENGTH
			)
			{
				return false;
			}
		}

		return true;
	}

	/**
	 * Both client-owned parts of the autofill accessor {=<blockId>:<documentOutput>.<propertyId>} - block
	 * id and document output - may only be latin letters, digits and underscores, the object position of
	 * {@see \CBPActivity::ValuePattern}; anything else is stringified or punctuated into an accessor the
	 * source does not describe. The dot is excluded not by the grammar (the field position allows it) but
	 * because it separates the document output from the property id. Cost: a block id outside the set
	 * (AI-generated MartaGeneratedId-*, blocks renamed via the activity_id control) gets no autofill, and
	 * composed no parsable expression before the check either.
	 */
	private function isExpressionIdentifier(mixed $value): bool
	{
		return is_string($value)
			&& $value !== ''
			&& strlen($value) <= self::MAX_AUTOFILL_IDENTIFIER_LENGTH
			&& preg_match('#\A[A-Za-z0-9_]+\z#', $value) === 1;
	}

	/**
	 * @param array $outputs Raw output codes from the request.
	 * @return list<string> Non-empty string output codes.
	 */
	private function normalizeOutputs(array $outputs): array
	{
		$normalized = [];
		$seen = [];
		foreach ($outputs as $output)
		{
			if (is_string($output) || is_int($output))
			{
				$code = (string)$output;
				if (
					$code !== ''
					&& strlen($code) <= self::MAX_AUTOFILL_IDENTIFIER_LENGTH
					&& !isset($seen[$code])
				)
				{
					$seen[$code] = true;
					$normalized[] = $code;
				}
			}
		}

		return $normalized;
	}

	public function getCapabilityCatalogAction(
		ActivityData $activity,
		array $documentType,
	): ?CapabilityCatalogResponseDto
	{
		$result = $this->validateCurrentUserOperateDocument(
			operation: CBPCanUserOperateOperation::CreateWorkflow,
			documentType: $documentType,
		);
		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		if (empty($activity->type))
		{
			$this->addError(ErrorMessage::ACTIVITY_NOT_FOUND->getError());

			return null;
		}

		$complexActivityService = Container::instance()->getComplexActivityService();
		// Same split as loadSettingsAction: the filter gate stays on the class-declared type, the action
		// catalog is built in the document context the node actually works in.
		$fixedDocumentType = $complexActivityService->getFixedDocumentTypeForNodeAction($activity->type);
		$publishedDocumentType = $complexActivityService->getPublishedDocumentTypeForNode(
			$activity->type,
			$activity->properties,
		);

		// The published type is client-resolved, so being authorized for $documentType is not enough to be
		// handed the catalog this node is served in.
		$accessResult = $this->validateResolvedDocumentTypeAccess($publishedDocumentType, $documentType);
		if (!$accessResult->isSuccess())
		{
			$this->addErrors($accessResult->getErrors());

			return null;
		}

		$filterAvailability = DesignerContainer::getNodeFilterAvailability();
		$relationsAvailable = Feature::instance()->areComplexNodeConnectionsAvailable();

		$catalog = Container::instance()->getCapabilityCatalogService()->getCatalogForNode(
			activityType: $activity->type,
			filterAvailable: $filterAvailability->isRuntimeAvailable($fixedDocumentType, $documentType),
			relationsAvailable: $relationsAvailable,
			documentType: $filterAvailability->resolveEffectiveDocumentType($publishedDocumentType, $documentType),
			filterModuleSupported: $filterAvailability->supportsModule($fixedDocumentType, $documentType),
		);

		if ($catalog === null)
		{
			$this->addError(ErrorMessage::ACTIVITY_NOT_FOUND->getError());

			return null;
		}

		return CapabilityCatalogResponseDto::fromNodeCapabilityCatalog($catalog);
	}

	public function saveSettingsAction(
		SaveSettingsRequestDto $saveSettingsRequest,
		ActivityData $activity,
		array $documentType,
	): ?array
	{
		$result = $this->validateCurrentUserOperateDocument(
			operation: CBPCanUserOperateOperation::CreateWorkflow,
			documentType: $documentType,
		);
		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		$complexActivityService = Container::instance()->getComplexActivityService();
		$complexActivityName = strtolower($activity->type);
		$nodeDescription = $complexActivityService->getActivityDescriptionByCode($complexActivityName);

		$configurator = \CBPActivity::createConfigurator($activity->type, $activity->properties);
		// The save path is stricter than the load path on purpose: it needs the descriptor itself and not
		// merely a settings surface, because every gate of the surfaces the payload writes is read off that
		// descriptor. A node the portal cannot resolve a description for would have its relations answered
		// "unavailable" and the ones it already carries dropped by the very same save - a silent loss of
		// user data. Refused whole instead.
		// The asymmetry is deliberate and stays: loadSettingsAction() answers such a node by the
		// configurator alone and keeps serving its settings for display (without relations), because that
		// branch is what every legacy node routed into the panel is opened by. Writing is the only side
		// where a missing descriptor costs data, so only writing is refused. From the UI neither side is
		// reachable for such a node - the catalog answers servedByUnifiedPanel = false for it.
		if (
			$nodeDescription === null
			|| !$this->isNodeSettingsSurfaceAvailable($complexActivityName, $configurator, $nodeDescription)
		)
		{
			$this->addActivityNotFoundError($activity->type);

			return null;
		}

		// The node is saved in the document context it publishes - that is the context its children are
		// validated against - so the authorization for $documentType alone does not carry over to it.
		$accessResult = $this->validateResolvedDocumentTypeAccess(
			$complexActivityService->getPublishedDocumentTypeForNode($activity->type, $activity->properties),
			$documentType,
		);
		if (!$accessResult->isSuccess())
		{
			$this->addErrors($accessResult->getErrors());

			return null;
		}

		if (empty($saveSettingsRequest->portRuleCollectionDictionary))
		{
			$this->addError(ErrorMessage::UNKNOWN_ERROR->getError());

			return null;
		}

		// Runtime gate of the relations surface, the same one loadSettingsAction() and the capability
		// catalog apply: with the feature off - or the node declaring no relation action - the node has
		// no relations block, so a payload carrying relations is ignored instead of being normalised and
		// written. Already stored relations are not part of that payload: they remain opaque while the
		// surface is unavailable and are restored after the other blocks have been converted.
		$relationsSurfaceAvailable = $this->isRelationsSurfaceAvailable(
			$nodeDescription,
			Feature::instance()->areComplexNodeConnectionsAvailable(),
		);
		// Cut here and once: the same payload becomes both the property of the node and the relation cards
		// the conversion builds its children from.
		$relationPortRuleCollectionDictionary = [];
		if ($relationsSurfaceAvailable)
		{
			$relationPortRuleCollectionDictionary = (new RuleContentBlock())
				->stripFromRawRules($saveSettingsRequest->relationPortRuleCollectionDictionary)
			;
		}

		// The limit came with this feature: a portal whose bizproc is older than this module knows no such
		// contract at all, and the settings of every complex node are saved without it instead of the save
		// action taking down each of them.
		$availableBlocks = $nodeDescription->getComplexActivitySettings()?->availableBlocks;
		$maxItems = $availableBlocks !== null && method_exists($availableBlocks, 'getMaxItems')
			? $availableBlocks->getMaxItems(NodeBlockType::RELATIONS)
			: null
		;
		if ($maxItems !== null)
		{
			// Counted on the set the node ends up with, not on the submitted one: while the surface is
			// unavailable the payload is ignored and restoreUnavailableRelations() puts back the fragment the
			// request carries in the activity itself, so that fragment is what the limit has to answer about.
			$actualItems = $this->countRelationCards(
				$relationsSurfaceAvailable
					? $relationPortRuleCollectionDictionary
					: ($activity->properties['Relations'] ?? []),
			);
			if ($actualItems > $maxItems)
			{
				$this->addError(new Error(
					Loc::getMessage('BIZPROCDESIGNER_COMPLEX_RELATIONS_LIMIT_EXCEEDED', [
						'#MAX_ITEMS#' => $maxItems,
						'#ACTUAL_ITEMS#' => $actualItems,
					]),
					'RELATION_ITEMS_LIMIT_EXCEEDED',
					['maxItems' => $maxItems, 'actualItems' => $actualItems],
				));

				return null;
			}
		}

		$originalActivity = $activity;
		$activity = $this->applySettingsToActivity(
			$configurator,
			$activity,
			$saveSettingsRequest,
			$relationPortRuleCollectionDictionary,
			$relationsSurfaceAvailable,
		);
		if (!$activity)
		{
			$this->addError(ErrorMessage::UNKNOWN_ERROR->getError());

			return null;
		}

		$portRuleDtoDictionary = $this->extractRulePropertyValue($configurator, $activity);
		if (!$portRuleDtoDictionary)
		{
			$this->addError(ErrorMessage::UNKNOWN_ERROR->getError());

			return null;
		}

		$relationPortRuleDtoDictionary = [];
		if (!empty($relationPortRuleCollectionDictionary))
		{
			$expectedRelationActionClass = $complexActivityService
				->getRelationActionActivity($complexActivityName)
				?->getClass()
			;

			// The surface is available, yet the relation activity cannot be resolved (a declared code
			// with no backing activity, or a legacy descriptor no gate can decide): an unresolvable
			// configuration, not a permission problem. The message names the action the cards ask for,
			// then the one the node declares, and only falls back to the host node type when neither
			// identifier exists.
			if ($expectedRelationActionClass === null)
			{
				$missingActivity = $this->findSubmittedRelationActionId($relationPortRuleCollectionDictionary)
					?? $this->findDeclaredRelationActionCode($complexActivityService, $complexActivityName)
					?? $activity->type;

				$this->addError(ErrorMessage::ACTIVITY_NOT_FOUND->getError(['#ACTIVITY#' => $missingActivity]));

				return null;
			}

			$hasUnfilledRelationCard = false;
			foreach ($relationPortRuleCollectionDictionary as $portId => $ruleCollection)
			{
				try
				{
					$relationPortRuleDto = PortRuleDto::fromArray($ruleCollection);

					if (!$this->isRelationActionAllowed($relationPortRuleDto, $expectedRelationActionClass))
					{
						$this->addError(ErrorMessage::ACCESS_DENIED->getError());

						return null;
					}

					// A card the user started but left without an action is unfinished, not forbidden,
					// so it takes the same NotFilled path as any rule that fails validation. That path is
					// chosen after the loop, so every remaining port still gets its action checked.
					if ($this->hasRuleMissingRelationAction($relationPortRuleDto))
					{
						$hasUnfilledRelationCard = true;
					}

					// Normalising the rest is pointless once the node goes the NotFilled path.
					if ($hasUnfilledRelationCard)
					{
						continue;
					}

					$saveRuleResult = (new SaveSingleRuleCommand($relationPortRuleDto, $documentType))->run();
				}
				catch (Exception)
				{
					$this->addError(ErrorMessage::UNKNOWN_ERROR->getError());

					return null;
				}

				if (!$saveRuleResult instanceof SaveSingleRuleCommandResult)
				{
					$this->addErrors($saveRuleResult->getErrors());

					return null;
				}

				$relationPortRuleDtoDictionary[$portId] = $saveRuleResult->portRuleDto;
			}

			if ($hasUnfilledRelationCard)
			{
				return [
					'activity' => $this->markActivityFilled($activity, isFilled: false),
				];
			}

			$activity = $this->applyRelationsToActivity($activity, $relationPortRuleDtoDictionary);
		}

		try
		{
			$result = (new ConvertRuleCommand(
				activity: $activity,
				portRuleDtoDictionary: $portRuleDtoDictionary,
				documentType: $documentType,
				relationPortRuleDtoDictionary: $relationPortRuleDtoDictionary,
			))->run();
		}
		catch (CommandValidateException $e)
		{
			return [
				'activity' => $this->markActivityFilled($activity, isFilled: false),
			];
		}
		catch (Exception)
		{
			$this->addError(ErrorMessage::UNKNOWN_ERROR->getError());

			return null;
		}

		if (!$result instanceof ConvertRuleCommandResult)
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		$convertedActivity = $relationsSurfaceAvailable
			? $result->activityData
			: $this->restoreUnavailableRelations($originalActivity, $result->activityData);

		// Once more on the merged properties: a base-settings construction is host-merged into the node by
		// ConvertRuleCommand, and for a trigger those very properties are what its published document type is
		// read off - so the type checked before the conversion is not necessarily the one the node ends up in.
		$mergedAccessResult = $this->validateResolvedDocumentTypeAccess(
			$complexActivityService->getPublishedDocumentTypeForNode(
				$convertedActivity->type,
				$convertedActivity->properties,
			),
			$documentType,
		);
		if (!$mergedAccessResult->isSuccess())
		{
			$this->addErrors($mergedAccessResult->getErrors());

			return null;
		}

		return [
			'activity' => $this->markActivityFilled($convertedActivity),
		];
	}

	public function saveRuleAction(
		PortRuleDto $portRule,
		array $documentType,
	): ?PortRuleDto {
		$result = $this->validateCurrentUserOperateDocument(
			operation: CBPCanUserOperateOperation::CreateWorkflow,
			documentType: $documentType,
		);
		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		try
		{
			$result = (new SaveSingleRuleCommand($portRule, $documentType))->run();
		}
		catch (Exception)
		{
			$this->addError(ErrorMessage::UNKNOWN_ERROR->getError());

			return null;
		}

		if (!$result instanceof SaveSingleRuleCommandResult)
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		// The rule returns to the panel with the preview of its action recalculated from the values the save
		// has just normalised. Admitted are the actions of the node the container names as its host, the same
		// set the load path admits; the document type is the authorized argument of this request.
		(new RuleContentBlock())->resolveForRule($result->portRuleDto, $documentType);

		return $result->portRuleDto;
	}

	/**
	 * @param ActivityData $activity
	 * @param array<string, PortRuleDto> $relationPortRuleDtoDictionary
	 * @return ActivityData
	 */
	private function applyRelationsToActivity(ActivityData $activity, array $relationPortRuleDtoDictionary): ActivityData
	{
		$activityArray = $activity->toArray();
		// Recursively expand via JsonSerializable (jsonSerialize() alone only expands one level
		// and would leave nested RuleDto/ConstructionDto objects instead of plain arrays).
		$activityArray['Properties']['Relations'] = array_map(
			static fn(PortRuleDto $dto) => Json::decode(Json::encode($dto)),
			$relationPortRuleDtoDictionary,
		);

		return ActivityData::createFromArray($activityArray);
	}

	/**
	 * No rule card may carry an action other than the expected relation action, nor a construction
	 * type outside the relation-port allowlist. The type check runs here, before any NotFilled
	 * return, because those returns persist the activity while ConvertRuleCommand (the allowlist's
	 * other enforcement point) never runs on them — a base-settings/filter smuggled next to an
	 * unfinished card would otherwise reach Properties.Relations.
	 */
	private function isRelationActionAllowed(PortRuleDto $portRuleDto, string $expectedActionClass): bool
	{
		foreach ($portRuleDto->rules as $rule)
		{
			foreach ($rule->constructions as $construction)
			{
				if (
					!in_array(
						$construction->constructionType,
						ValidateSingleRuleCommand::RELATION_PORT_CONSTRUCTION_TYPES,
						true,
					)
				)
				{
					return false;
				}

				if ($construction->constructionType !== ConstructionType::ACTION)
				{
					continue;
				}

				$expression = $construction->expression;
				if (!$expression instanceof ActionExpressionDto || $expression->actionId !== $expectedActionClass)
				{
					return false;
				}

				// actionId alone isn't what ends up in Children: ConvertRuleCommand builds the child
				// activity from activityData/rawActivityData, so that actual type must match too,
				// otherwise a client could pass a matching actionId but a different node-action type.
				$actualActionType = $expression->rawActivityData['activityType']
					?? $expression->activityData['Type']
					?? null;
				if ($actualActionType !== null && $actualActionType !== $expectedActionClass)
				{
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * A relation card without an action is an unfinished card, whatever else it carries: the port only
	 * makes sense once its relation action is chosen. An empty port and an empty card are the extreme
	 * cases of the same state — ValidateSingleRuleCommand treats an empty rule list as filled, so they
	 * would otherwise save without the NotFilled marker.
	 */
	private function hasRuleMissingRelationAction(PortRuleDto $portRuleDto): bool
	{
		if ($portRuleDto->rules === [])
		{
			return true;
		}

		foreach ($portRuleDto->rules as $rule)
		{
			if (empty($rule->constructions))
			{
				return true;
			}

			foreach ($rule->constructions as $construction)
			{
				if ($construction->constructionType === ConstructionType::ACTION)
				{
					continue 2;
				}
			}

			return true;
		}

		return false;
	}

	/**
	 * The relation action a client asks for lives in the submitted cards, so an unresolvable relation
	 * declaration can be reported by that identifier instead of by the host node type.
	 *
	 * @param array<string, mixed> $relationPortRuleCollectionDictionary
	 */
	private function findSubmittedRelationActionId(array $relationPortRuleCollectionDictionary): ?string
	{
		foreach ($relationPortRuleCollectionDictionary as $ruleCollection)
		{
			foreach ((array)($ruleCollection['ruleCards'] ?? []) as $ruleCard)
			{
				foreach ((array)($ruleCard['constructions'] ?? []) as $construction)
				{
					if (($construction['type'] ?? null) !== ConstructionType::ACTION->value)
					{
						continue;
					}

					$expression = (array)($construction['expression'] ?? []);
					$actionId = $expression['actionId']
						?? $expression['rawActivityData']['activityType']
						?? $expression['activityData']['Type']
						?? null;
					if (is_string($actionId) && $actionId !== '')
					{
						return $actionId;
					}
				}
			}
		}

		return null;
	}

	/**
	 * The node descriptor names its relation action by activity code, so a declaration whose activity
	 * cannot be resolved is reported by that code instead of by the host node type. Null means the node
	 * declares no relation action at all: then no action identifier exists to name.
	 */
	private function findDeclaredRelationActionCode(
		ComplexActivityService $complexActivityService,
		string $complexActivityName,
	): ?string
	{
		$declaredCode = $complexActivityService
			->getActivityDescriptionByCode($complexActivityName)
			?->getComplexActivitySettings()
			?->relationAction
			?->activityCode
		;

		return ($declaredCode === null || $declaredCode === '') ? null : $declaredCode;
	}

	/**
	 * The relations surface exists for a node only when the runtime feature flag allows it and the
	 * node's descriptor declares both a relation action and the relations block - the same gate the
	 * capability catalog reports to the frontend via availableBlocks. A node the portal has no
	 * description for declares nothing, so it has no relations surface either: the controller answers
	 * by the resolver alone and never by the feature flag on its own.
	 *
	 * The null case is the load path: a legacy node is served for display by the configurator alone, and
	 * its saved relations are the ones this answer keeps out of the response. saveSettingsAction()
	 * refuses a null description before it ever gets here.
	 */
	private function isRelationsSurfaceAvailable(
		?ActivityDescription $nodeDescription,
		bool $relationsAvailable,
	): bool
	{
		if ($nodeDescription === null)
		{
			return false;
		}

		return Container::instance()
			->getCapabilityCatalogService()
			->getRelationsAvailabilityForNode($nodeDescription, $relationsAvailable)
		;
	}

	/**
	 * One relation port is one card to the user, so a port counts as at least one even before it holds a rule:
	 * the same arithmetic the panel counts the add button by (`relationRuleCardsCount` of node-settings-store).
	 * A server answer below it would let the interface offer a card the save path then refuses.
	 */
	private function countRelationCards(mixed $portRuleCollectionDictionary): int
	{
		if (!is_array($portRuleCollectionDictionary))
		{
			return 0;
		}

		$count = 0;
		foreach ($portRuleCollectionDictionary as $ruleCollection)
		{
			$ruleCards = is_array($ruleCollection) ? ($ruleCollection['ruleCards'] ?? []) : [];
			$count += max(1, is_array($ruleCards) ? count($ruleCards) : 0);
		}

		return $count;
	}

	/**
	 * The refused activity is named in the message: leaving the placeholder unreplaced is what turned every
	 * refusal into the same "#ACTIVITY#", telling neither the user nor the log which node was meant. Only an
	 * activity code is substituted - the same character set {@see \CBPActivity::createInstance()} accepts -
	 * so a type the client made up is reported without its own text reaching the message.
	 */
	private function addActivityNotFoundError(string $activityType): void
	{
		$replace = preg_match('#\A[a-zA-Z0-9_]+\z#', $activityType) === 1
			? ['#ACTIVITY#' => $activityType]
			: [];

		$this->addError(ErrorMessage::ACTIVITY_NOT_FOUND->getError($replace));
	}

	/**
	 * Whether the node settings can be built for the activity at all. The configurator answers for a class
	 * rendering its own configurable form; a class implementing no `IBPConfigurableActivity` is answered with
	 * an empty one, and then the descriptor decides: a node served by the unified panel keeps its settings in
	 * the service properties of the panel, not in the properties map of its class, and refusing it here is
	 * what left every translated legacy node unopenable while the catalog kept routing it into the panel.
	 * A non-empty properties map is deliberately not synthesised for such a node - see
	 * {@see ComplexActivityService::resolveRuleProperty()}.
	 *
	 * A node with a descriptor is answered by the rollout gate of the panel alone and never by its configurator:
	 * a translated node with the feature rolled back has to be refused even though its class renders a form of
	 * its own, otherwise the very settings the panel is not offering could still be sent in
	 * ({@see self::isUnifiedPanelSurfaceAvailable()}).
	 *
	 * @param ?ActivityDescription $nodeDescription Description of the node, already gated on owning a
	 *     complex-settings descriptor by {@see ComplexActivityService::getActivityDescriptionByCode()}, so a
	 *     non-null one means "served by the unified panel".
	 */
	private function isNodeSettingsSurfaceAvailable(
		string $activityCode,
		Configurator $configurator,
		?ActivityDescription $nodeDescription,
	): bool
	{
		if ($nodeDescription !== null)
		{
			return $this->isUnifiedPanelSurfaceAvailable($activityCode, $nodeDescription);
		}

		return !empty($configurator->getActivityType());
	}

	/**
	 * Rollout gate of the panel, applied to every surface of it alike: a node whose complex-settings descriptor
	 * was completed for it - a trigger, a base node - is served by the panel only while the feature is rolled
	 * out, so with the flag off the editor stays on the legacy form of that node and the server refuses the
	 * unified settings a client would send for it. A complex node, declaring its descriptor itself, is not what
	 * the flag decides about, and settings the panel saved earlier keep running and keep publishing either way
	 * ({@see \Bitrix\Bizproc\Internal\Service\Activity\UnifiedPanelDescriptorProvider::isSurfaceAvailableForNode()}).
	 */
	private function isUnifiedPanelSurfaceAvailable(
		string $activityCode,
		ActivityDescription $nodeDescription,
	): bool
	{
		return Container::instance()->getUnifiedPanelDescriptorProvider()->isSurfaceAvailableForNode(
			$activityCode,
			$nodeDescription,
			Feature::instance()->areComplexNodeConnectionsAvailable(),
		);
	}

	/**
	 * @param array<string, mixed> $relationPortRuleCollectionDictionary Relations of the request, already
	 *     without the client copy of the preview and already emptied when the surface is unavailable.
	 */
	private function applySettingsToActivity(
		Configurator $configurator,
		ActivityData $activity,
		SaveSettingsRequestDto $saveSettingsRequestDto,
		array $relationPortRuleCollectionDictionary,
		bool $relationsSurfaceAvailable,
	): ?ActivityData
	{
		$rulePropertyName = $this->resolveRuleProperty($configurator, $activity->type)['FieldName'] ?? null;
		if (!$rulePropertyName)
		{
			return null;
		}

		$newActivity = $activity->toArray();

		// The preview the client submitted is dropped before the rules become a property of the node: it is
		// derived data the read path recalculates, and a stored copy would be handed to the children of the
		// node by the conversion that reads these very rules.
		$portRuleCollectionDictionary = (new RuleContentBlock())
			->stripFromRawRules($saveSettingsRequestDto->portRuleCollectionDictionary)
		;

		$newProperties = [
			...($newActivity['Properties'] ?? []),
			$rulePropertyName => $portRuleCollectionDictionary,
			'Title' => $saveSettingsRequestDto->title,
			'EditorComment' => $saveSettingsRequestDto->description,
		];

		if ($relationsSurfaceAvailable)
		{
			$newProperties['Relations'] = $relationPortRuleCollectionDictionary;
		}

		$newActivity['Properties'] = $newProperties;

		return ActivityData::createFromArray($newActivity);
	}

	private function restoreUnavailableRelations(
		ActivityData $originalActivity,
		ActivityData $convertedActivity,
	): ActivityData
	{
		$original = $originalActivity->toArray();
		$originalProperties = is_array($original['Properties'] ?? null) ? $original['Properties'] : [];
		if (!array_key_exists('Relations', $originalProperties))
		{
			return $convertedActivity;
		}

		$relationActivityNames = [];
		$this->collectRelationActivityNames($originalProperties['Relations'], $relationActivityNames);
		$relationReturnPropertiesMap = $originalProperties['RelationReturnPropertiesMap'] ?? null;
		if (is_array($relationReturnPropertiesMap))
		{
			foreach ($relationReturnPropertiesMap as $property)
			{
				$sourceActivity = is_array($property) ? ($property['SourceActivity'] ?? null) : null;
				if (is_string($sourceActivity))
				{
					$relationActivityNames[$sourceActivity] = true;
				}
			}
		}

		$originalLinks = is_array($originalProperties['Links'] ?? null) ? $originalProperties['Links'] : [];
		do
		{
			$namesAdded = false;
			foreach ($originalLinks as $link)
			{
				if (!is_array($link))
				{
					continue;
				}

				$sourceName = $this->extractLinkedActivityName($link[0] ?? null);
				$targetName = $this->extractLinkedActivityName($link[1] ?? null);
				if (
					($sourceName !== null && isset($relationActivityNames[$sourceName]))
					|| ($targetName !== null && isset($relationActivityNames[$targetName]))
				)
				{
					foreach ([$sourceName, $targetName] as $activityName)
					{
						if ($activityName !== null && !isset($relationActivityNames[$activityName]))
						{
							$relationActivityNames[$activityName] = true;
							$namesAdded = true;
						}
					}
				}
			}
		}
		while ($namesAdded);

		$converted = $convertedActivity->toArray();
		$convertedProperties = is_array($converted['Properties'] ?? null) ? $converted['Properties'] : [];

		$originalChildren = is_array($original['Children'] ?? null) ? $original['Children'] : [];
		$convertedChildren = is_array($converted['Children'] ?? null) ? $converted['Children'] : [];
		$converted['Children'] = $this->mergePreservedList(
			$originalChildren,
			$convertedChildren,
			static fn(mixed $child): bool => is_array($child)
				&& is_string($child['Name'] ?? null)
				&& isset($relationActivityNames[$child['Name']]),
		);

		$convertedLinks = is_array($convertedProperties['Links'] ?? null) ? $convertedProperties['Links'] : [];
		$convertedProperties['Links'] = $this->mergePreservedList(
			$originalLinks,
			$convertedLinks,
			fn(mixed $link): bool => $this->referencesRelationActivity($link, $relationActivityNames),
		);

		foreach (['InputNames', 'OutputNames'] as $propertyName)
		{
			$originalNames = is_array($originalProperties[$propertyName] ?? null)
				? $originalProperties[$propertyName]
				: [];
			$convertedNames = is_array($convertedProperties[$propertyName] ?? null)
				? $convertedProperties[$propertyName]
				: [];
			$convertedProperties[$propertyName] = $this->mergePreservedMap(
				$originalNames,
				$convertedNames,
				fn(mixed $value, string|int $key): bool => $this->referencesRelationActivity(
					$propertyName === 'OutputNames' ? $key : $value,
					$relationActivityNames,
				),
			);
		}

		$relationReturnPropertyIds = is_array($relationReturnPropertiesMap)
			? array_fill_keys(array_map('strval', array_keys($relationReturnPropertiesMap)), true)
			: [];
		$originalReturnProperties = is_array($original['ReturnProperties'] ?? null)
			? $original['ReturnProperties']
			: [];
		$convertedReturnProperties = is_array($converted['ReturnProperties'] ?? null)
			? $converted['ReturnProperties']
			: [];
		$converted['ReturnProperties'] = $this->mergePreservedList(
			$originalReturnProperties,
			$convertedReturnProperties,
			static fn(mixed $property): bool => is_array($property)
				&& isset($relationReturnPropertyIds[(string)($property['Id'] ?? '')]),
		);

		$convertedProperties['Relations'] = $originalProperties['Relations'];
		if (array_key_exists('RelationReturnPropertiesMap', $originalProperties))
		{
			$convertedProperties['RelationReturnPropertiesMap']
				= $originalProperties['RelationReturnPropertiesMap'];
		}
		else
		{
			unset($convertedProperties['RelationReturnPropertiesMap']);
		}

		$converted['Properties'] = $this->mergePreservedMap(
			$originalProperties,
			$convertedProperties,
			static fn(mixed $value, string|int $key): bool => in_array(
				$key,
				['Relations', 'RelationReturnPropertiesMap'],
				true,
			),
		);

		return ActivityData::createFromArray($converted);
	}

	private function collectRelationActivityNames(mixed $value, array &$activityNames): void
	{
		if (!is_array($value))
		{
			return;
		}

		foreach (['activityData', 'rawActivityData'] as $activityDataKey)
		{
			$activityData = $value[$activityDataKey] ?? null;
			if (!is_array($activityData))
			{
				continue;
			}

			$activityName = $activityData['Name'] ?? $activityData['activityName'] ?? null;
			if (is_string($activityName))
			{
				$activityNames[$activityName] = true;
			}
		}

		foreach ($value as $item)
		{
			$this->collectRelationActivityNames($item, $activityNames);
		}
	}

	private function extractLinkedActivityName(mixed $reference): ?string
	{
		if (!is_string($reference))
		{
			return null;
		}

		$delimiterPosition = strrpos($reference, ':');

		return $delimiterPosition === false ? $reference : substr($reference, 0, $delimiterPosition);
	}

	private function referencesRelationActivity(mixed $value, array $activityNames): bool
	{
		if (is_string($value) || is_int($value))
		{
			$activityName = $this->extractLinkedActivityName((string)$value);

			return $activityName !== null && isset($activityNames[$activityName]);
		}

		if (!is_array($value))
		{
			return false;
		}

		foreach ($value as $item)
		{
			if ($this->referencesRelationActivity($item, $activityNames))
			{
				return true;
			}
		}

		return false;
	}

	private function mergePreservedList(array $original, array $converted, callable $shouldPreserve): array
	{
		$result = [];
		$converted = array_values($converted);
		$convertedIndex = 0;
		foreach ($original as $key => $value)
		{
			if ($shouldPreserve($value, $key))
			{
				$result[] = $value;
			}
			elseif (array_key_exists($convertedIndex, $converted))
			{
				$result[] = $converted[$convertedIndex++];
			}
		}

		while (array_key_exists($convertedIndex, $converted))
		{
			$result[] = $converted[$convertedIndex++];
		}

		return $result;
	}

	private function mergePreservedMap(array $original, array $converted, callable $shouldPreserve): array
	{
		$result = [];
		$consumedKeys = [];
		foreach ($original as $key => $value)
		{
			if ($shouldPreserve($value, $key))
			{
				$result[$key] = $value;
			}
			elseif (array_key_exists($key, $converted))
			{
				$result[$key] = $converted[$key];
				$consumedKeys[$key] = true;
			}
		}

		foreach ($converted as $key => $value)
		{
			if (!isset($consumedKeys[$key]) && !array_key_exists($key, $result))
			{
				$result[$key] = $value;
			}
		}

		return $result;
	}

	/**
	 * The rules property of a node, addressed by name and not by the order of the properties map - the
	 * single lookup of {@see ComplexActivityService::resolveRuleProperty()}, shared with the AI converters.
	 *
	 * @param string $activityType Type of the node: it names the rules of a node whose class renders no
	 *     configurable form, and whose configurator therefore carries no properties map at all.
	 */
	private function resolveRuleProperty(Configurator $configurator, string $activityType = ''): ?array
	{
		return Container::instance()
			->getComplexActivityService()
			->resolveRuleProperty($configurator, $activityType)
		;
	}

	/**
	 * Rules of a node are a collection of containers keyed by input port id, or the single reserved
	 * `ComplexActivityService::PORTLESS_RULES_KEY` for a node without input ports. Neither kind is resolved
	 * against the ports the node actually has - the key only names the container.
	 *
	 * @return array<string, PortRuleDto>|null Null when the node carries no rules property at all, which is
	 *     what tells the caller the node is not served by the unified settings panel.
	 */
	private function extractRulePropertyValue(Configurator $configurator, ActivityData $activity): ?array
	{
		$ruleProperty = $this->resolveRuleProperty($configurator, $activity->type);
		$rulePropertyName = $ruleProperty['FieldName'] ?? null;
		if (!$rulePropertyName)
		{
			return null;
		}

		$rulePropertyValue = $activity->properties[$rulePropertyName] ?? $ruleProperty['Default'] ?? [];
		if (!is_array($rulePropertyValue) || empty($rulePropertyValue))
		{
			return null;
		}

		$portRuleDtoDictionary = [];
		foreach ($rulePropertyValue as $containerKey => $ruleCollection)
		{
			if (!is_array($ruleCollection))
			{
				continue;
			}

			// A container and its payload carry the same name, so a payload that omits it is still
			// addressed by the key it arrived under instead of failing the whole settings load.
			$ruleCollection['portId'] ??= (string)$containerKey;

			$portRuleDtoDictionary[$containerKey] = PortRuleDto::fromArray($ruleCollection);
		}

		return $portRuleDtoDictionary === [] ? null : $portRuleDtoDictionary;
	}

	/**
	 * The document type a node publishes is a second document context the request works in, and it is resolved
	 * from properties the client fully owns - a trigger names the document type of its event in them. Being
	 * authorized for the document type of the edited template says nothing about that one, so a direct request
	 * could name any type, get the capability catalog built in it and save the child actions it allows: every
	 * check downstream only asks whether an action belongs to that catalog, never whether the user may author
	 * workflows on its document.
	 *
	 * A node publishing no type of its own works in the document type of the template, which the caller was
	 * already authorized for; the same holds when the two types are the one and same.
	 *
	 * @param array|null $publishedDocumentType Resolved by
	 *     {@see ComplexActivityService::getPublishedDocumentTypeForNode()} from the properties the request
	 *     carries - and, on the save path, resolved once more from the merged ones.
	 */
	private function validateResolvedDocumentTypeAccess(
		?array $publishedDocumentType,
		array $documentType,
	): Result
	{
		if ($publishedDocumentType === null || $this->isSameDocumentType($publishedDocumentType, $documentType))
		{
			return new Result();
		}

		try
		{
			return $this->validateCurrentUserOperateDocument(
				operation: CBPCanUserOperateOperation::CreateWorkflow,
				documentType: $publishedDocumentType,
			);
		}
		catch (\Throwable)
		{
			// This is an authorization gate, so a document type the CreateWorkflow provider cannot answer
			// for is refused and not waved through - the opposite of the fail-open autofill lookup.
			$result = new Result();
			$result->addError(ErrorMessage::ACCESS_DENIED->getError());

			return $result;
		}
	}

	private function isSameDocumentType(array $documentType, array $otherDocumentType): bool
	{
		return array_map(strval(...), array_values($documentType))
			=== array_map(strval(...), array_values($otherDocumentType));
	}

	/**
	 * @param \CBPCanUserOperateOperation::* $operation
	 * @param array $documentType
	 * @return Result
	 */
	private function validateCurrentUserOperateDocument(int $operation, array $documentType): Result
	{
		$result = new Result();

		// Null while no current user was set on the controller: an unauthenticated request is refused by the
		// permission check itself instead of failing on the call.
		$userId = (int)($this->getCurrentUser()?->getId() ?? 0);
		$canOperate = CBPDocument::CanUserOperateDocumentType(
			$operation,
			$userId,
			$documentType,
		);

		if (!$canOperate)
		{
			$result->addError(ErrorMessage::ACCESS_DENIED->getError());
		}

		return $result;
	}

	private function markActivityFilled(ActivityData $activityData, bool $isFilled = true): ActivityData
	{
		$activityData = $activityData->toArray();
		if ($isFilled)
		{
			unset($activityData['Properties']['NotFilled']);
		}
		else
		{
			$activityData['Properties']['NotFilled'] = 'Y';
		}

		return ActivityData::createFromArray($activityData);
	}
}
