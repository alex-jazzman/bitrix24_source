<?php

declare(strict_types=1);

namespace Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service;

use Bitrix\Bizproc\Internal\Service\Container as BizprocContainer;
use Bitrix\Bizproc\Public\Service\Storage\StorageReferenceGuard;
use Bitrix\BizprocDesigner\Internal\Entity\DocumentDescription;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentBlock;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentComplexConstruction;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentSettingCollection;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentTemplate;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\WorkflowTemplateIdentifier;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Enum\RequestSource;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Validator\AgentStartTriggerMatcher;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Validator\SetupTemplateNodeMatcher;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Validator\ValidationContext;
use Bitrix\BizprocDesigner\Internal\Service\Container;

/**
 * Assembles the {@see ValidationContext} identically on all three reverse entries (REST validate/push and Marta),
 * so validate == push == Marta (TPL-02). The storage baseline comes from the *published* bound template
 * ({@see AgentWorkflowResolverService::getPublishedAgentTemplate}) - the draft resolver would make the enforcement
 * circular - and is run through the same forward converter (RequestSource::Rest) the agent's template.get uses, so
 * an unchanged round-trip node fingerprints identically (ALG-01):
 *   - IMMUTABLE_TYPES (create/setuptemplate) -> baselineImmutableFingerprints, unconditionally (setuptemplate
 *     carries no StorageCode, so its immutability must not depend on one);
 *   - CONSUMER_TYPES (read/write/delete) with a static code, with a code the barrier cannot read whole, or
 *     addressed by StorageId -> baselineStaticNodeFingerprints, so the guard can let an unchanged id-addressed
 *     node through its anti-IDOR rule (ALG-02 rule 1 -> rule 4);
 *   - storage codes the published template declares -> baselineStorageCodes, which is what authorises a token
 *     code (ALG-02 rule 3). Codes come from the immutable create nodes AND from the token codes the published
 *     consumers themselves use: a storage may have been created by the setup wizard rather than by a graph
 *     node, and without that relaxation a legitimate template would stop round-tripping.
 *   - codes of the create nodes alone -> baselineCreatorStorageCodes, the narrower set the admission policy of
 *     a create node outside the baseline inherits from (ALG-10). It stays separate from baselineStorageCodes
 *     because a consumer token code proves no ownership: merging the two would let an agent create storage
 *     under a code the published template only ever read. A create node addressing storage by StorageId
 *     contributes nothing to it: the runtime prefers the id over the code, so such a node reconfigures storage
 *     its StorageCode does not name and owns nothing under that code.
 *   - restricted passthrough settings of any node type, and of the sub-steps a complex node carries in its rules
 *     -> baselineRestrictedSettingFingerprints, which is what lets an executable condition be carried through but
 *     never authored (ALG-04). Both levels are collected because both are judged.
 *   - every (block type, preset, document type, setting name, value) tuple the baseline carries, top-level and
 *     nested alike -> baselineOptionValues ({@see ValidationContext::hasCarriedOptionValue()}). Every part of the
 *     key is a part the option list is built from: without the preset a value published in the deal variant of a
 *     trigger would unlock it in the lead variant, and without the document type a status published in the sub-step
 *     of a deal complex node would unlock it in the sub-step of a lead one - the same sub-step class sits in both
 *     dictionaries. The document type is named at the nested level alone, where it is the host node's effective one;
 *     a block of the graph is described for the type of the whole request and names none. Collected for every
 *     setting rather than for the described ones alone: the passthrough only ever applies inside the option check,
 *     and asking the catalog to describe each baseline block would cost a lookup per node for nothing.
 *   - the types the baseline is built of -> baselineBlockTypes, against which the reverse path lifts the EXCLUDED
 *     barrier of a reverse-visible CLASS: a switched-off block the template already published reads back, while
 *     one the agent invents does not.
 *   - constants the published template declares -> baselineConstants, whose keys are the wider ownership set a
 *     code is judged taken against, and the codes the setup-wizard nodes of that same published version declare
 *     -> baselineWizardCodes, the narrow set a constant counts as inherited by (ALG-01). The two are kept apart
 *     because declaring a code outside the wizard proves the constant exists but gives the wizard no right to
 *     redefine it. The narrow set is collected by reading the item codes of the baseline forms rather than by
 *     parsing them: the sample is already published, so only its codes are of interest here.
 *   - the presence of the published version itself -> hasPublishedBaseline, taken from the baseline graph and never
 *     from the emptiness of those two sets: a published template that has declared no constant yet is a baseline
 *     all the same, and the wizard admission has to let a first constant into it.
 *   - wizard-authored codes the bound DRAFT already carries -> draftWizardCodes, the one reading here that does not
 *     come from the published version. It authorises nothing and is measured against the declaration ceiling alone:
 *     a reverse write merges declarations into the draft and never removes one, so a ceiling that saw the published
 *     version only would watch the draft grow without a bound.
 *
 * One reading does NOT come from the published version: the option values of the graph the agent was handed - the
 * bound draft when the template has one -> draftOptionValues ({@see ValidationContext::$draftOptionValues}). It
 * relaxes the option check alone and no barrier: the agent must be able to return unchanged the graph it was given,
 * and a value the user saved into the draft may since have dropped out of the portal's list. The restricted-setting
 * barrier, the storage baselines and the block-type baseline stay on the published version, or a graph would
 * authorise itself through the draft it wrote. Narrowed to what the published version does not already carry, which
 * is what that reading means and all the check can use of it: the two maps are joined by
 * {@see ValidationContext::hasCarriedOptionValue()}, so a tuple both graphs hold is answered by the baseline, and
 * the draft is exactly the graph whose width the agent writes itself.
 *
 * The baseline is assembled on the Marta entry as well, although storage nodes are hidden from it: one graph must
 * get one verdict on every entry, so the extra published-template conversion is an accepted cost.
 */
final class ValidationContextFactory
{
	private const TEMPLATE_ID_TOKEN = '{=Workflow:TemplateId}';

	private readonly AgentWorkflowResolverService $resolverService;

	public function __construct(?AgentWorkflowResolverService $resolverService = null)
	{
		$this->resolverService = $resolverService ?? Container::getAgentWorkflowResolverService();
	}

	public function create(
		WorkflowTemplateIdentifier $identifier,
		RequestSource $source,
		int $userId,
		bool $isUserAdmin,
	): ValidationContext
	{
		$publishedTemplate = $identifier->templateId !== null
			? $this->resolverService->getPublishedAgentTemplate($identifier->templateId)
			: null;

		$publishedConstants = $identifier->templateId !== null
			? $this->resolverService->getPublishedTemplateConstants($identifier->templateId)
			: [];

		// The draft is read for its SIZE alone (see ValidationContext::$draftWizardCodes): the baselines an edit is
		// judged against stay the published version's, or a graph would vouch for itself through the draft it wrote.
		$draftWizardCodes = $identifier->draftId !== null
			? self::wizardAuthoredCodes($this->resolverService->getDraftConstants($identifier->draftId))
			: [];

		// The graph the agent was HANDED, which is the draft whenever the template has one. It feeds the option-list
		// passthrough and nothing else (see ValidationContext::$draftOptionValues): the agent has to be able to
		// return unchanged what it was given, and a value the user saved into the draft may have dropped out of the
		// portal's list since. Read only when a draft exists - without one this is the published version already
		// converted above, and a second conversion of it would buy nothing.
		$handedTemplate = $identifier->draftId !== null
			? $this->resolverService->getAgentTemplate($identifier)
			: null;

		return self::fromBaselineTemplate(
			$publishedTemplate,
			$identifier->documentDescription,
			$identifier->templateId,
			$source,
			$userId,
			$isUserAdmin,
			publishedConstants: $publishedConstants,
			draftWizardCodes: $draftWizardCodes,
			handedTemplate: $handedTemplate,
		);
	}

	/**
	 * The baseline formula itself, split off the resolver lookup so a caller that already holds the baseline graph
	 * assembles the context through the very same code the request path uses.
	 *
	 * @param array<string, array> $publishedConstants CONSTANTS of the published template, as written
	 * @param list<string> $draftWizardCodes wizard-authored codes the bound draft already carries, for the
	 *        declaration ceiling alone ({@see ValidationContext::$draftWizardCodes})
	 * @param AgentTemplate|null $handedTemplate the graph template.get answered the agent with - the bound draft when
	 *        the template has one. Read for its option values alone ({@see ValidationContext::$draftOptionValues}),
	 *        and only for those the published version does not carry; no barrier of this context is assembled from it
	 */
	public static function fromBaselineTemplate(
		?AgentTemplate $publishedTemplate,
		DocumentDescription $documentType,
		?int $templateId,
		RequestSource $source,
		int $userId = 0,
		bool $isUserAdmin = false,
		?RestrictedSettingRegistry $restrictedSettings = null,
		array $publishedConstants = [],
		array $draftWizardCodes = [],
		?AgentTemplate $handedTemplate = null,
	): ValidationContext
	{
		$restrictedSettings ??= new RestrictedSettingRegistry();
		$baselineImmutableFingerprints = [];
		$baselineStaticNodeFingerprints = [];
		$baselineStorageCodes = [];
		$baselineCreatorStorageCodes = [];
		$baselineRestrictedSettingFingerprints = [];
		$baselineVerbatimStartTriggerReferences = [];
		$baselineStaticNodeReferences = [];
		$baselineRestrictedSettingReferences = [];
		$baselineWizardCodes = [];
		$baselineBlockTypes = [];
		$baselineOptionValues = [];

		if ($publishedTemplate !== null)
		{
			foreach ($publishedTemplate->blocks as $block)
			{
				/** @var AgentBlock $block */
				$baselineBlockTypes[mb_strtolower($block->type)] = true;
				if (AgentStartTriggerMatcher::matches($block->type))
				{
					$baselineVerbatimStartTriggerReferences[
						AgentStartTriggerMatcher::referenceFingerprint($block)
					] = true;
				}

				$baselineRestrictedSettingFingerprints += self::collectRestrictedSettings(
					$block,
					$documentType,
					$restrictedSettings,
				);
				$baselineRestrictedSettingReferences += self::collectRestrictedSettingReferences(
					$block,
					$documentType,
					$restrictedSettings,
				);
				$baselineOptionValues += self::collectOptionValues($block, $documentType);

				if (SetupTemplateNodeMatcher::matches($block->type))
				{
					$wizardCodes = self::readWizardConstantCodes($block->settings);
					if ($wizardCodes === null)
					{
						// One unreadable baseline form settles the whole narrow set: a partial one would pass an
						// inherited constant off as a new one.
						$baselineWizardCodes = null;
					}
					elseif ($baselineWizardCodes !== null)
					{
						$baselineWizardCodes = [...$baselineWizardCodes, ...$wizardCodes];
					}
				}

				if (StorageNodeClassifier::isImmutable($block->type))
				{
					$baselineImmutableFingerprints[StorageNodeFingerprint::of($block->type, $block->settings)] = true;

					$declaredCode = StorageNodeClassifier::extractStorageCode($block->settings);
					if ($declaredCode !== null && $declaredCode !== '')
					{
						$baselineStorageCodes[] = $declaredCode;

						// The id-addressing predicate answers here exactly as it answers for a consumer (below):
						// a create node carrying a StorageId reconfigures the storage that id points at, not the
						// one its StorageCode names, so the code proves no ownership and must not open rule 3a to
						// consumers. The declared set keeps the code regardless - it only makes a per-template
						// token code editable, and dropping it would cost an unchanged template its round-trip.
						if (
							StorageNodeClassifier::isStorageCreator($block->type)
							&& !self::addressesStorageById($block->settings)
						)
						{
							$baselineCreatorStorageCodes[] = $declaredCode;
						}
					}

					continue;
				}

				if (StorageNodeClassifier::isConsumer($block->type))
				{
					$storageCode = StorageNodeClassifier::extractStorageCode($block->settings);
					// An opaque code is anchored by the fingerprint as well. It would otherwise fall to
					// baselineStorageCodes, where {@see StorageAuthorizationContext::indexCodes()} drops it for
					// being unreadable - anchoring the published node nowhere and costing an unchanged template
					// its round-trip. "The barrier does not read this code" therefore always means "anchor it by
					// fingerprint", never "drop it from both sets".
					$hasStaticCode = $storageCode !== null
						&& (
							self::isStaticCode($storageCode)
							|| !StorageReferenceGuard::isFullyInterpretableCode($storageCode)
						);

					if ($hasStaticCode || self::addressesStorageById($block->settings))
					{
						$fingerprint = StorageNodeFingerprint::of($block->type, $block->settings);
						$baselineStaticNodeFingerprints[$fingerprint] = true;
						$baselineStaticNodeReferences[StorageNodeFingerprint::referenceOf(
							$block->id,
							$block->type,
							$block->settings,
						)] = true;
					}
					elseif ($storageCode !== null && $storageCode !== '')
					{
						// A pure token code of a published consumer: its storage may predate the graph.
						$baselineStorageCodes[] = $storageCode;
					}
				}
			}
		}

		// Only what the published version does NOT already carry: the check reads the two maps as one
		// ({@see ValidationContext::hasCarriedOptionValue()}), so a tuple in both would answer twice and be held
		// twice - and the handed graph is the draft, whose width the agent writes itself.
		$draftOptionValues = [];
		if ($handedTemplate !== null)
		{
			foreach ($handedTemplate->blocks as $block)
			{
				/** @var AgentBlock $block */
				$draftOptionValues += array_diff_key(
					self::collectOptionValues($block, $documentType),
					$baselineOptionValues,
				);
			}
		}

		return new ValidationContext(
			documentType: $documentType,
			templateId: $templateId,
			source: $source,
			userId: $userId,
			isUserAdmin: $isUserAdmin,
			baselineImmutableFingerprints: $baselineImmutableFingerprints,
			baselineStaticNodeFingerprints: $baselineStaticNodeFingerprints,
			baselineStorageCodes: array_values(array_unique($baselineStorageCodes)),
			baselineRestrictedSettingFingerprints: $baselineRestrictedSettingFingerprints,
			baselineCreatorStorageCodes: array_values(array_unique($baselineCreatorStorageCodes)),
			baselineConstants: $publishedConstants,
			baselineWizardCodes: $baselineWizardCodes === null
				? null
				: array_values(array_unique($baselineWizardCodes)),
			draftWizardCodes: $draftWizardCodes,
			// The baseline graph itself answers whether anything is published, so a published template that declares
			// no constant yet is told apart from a template with no published version at all.
			hasPublishedBaseline: $publishedTemplate !== null,
			baselineBlockTypes: $baselineBlockTypes,
			baselineVerbatimStartTriggerReferences: $baselineVerbatimStartTriggerReferences,
			baselineStaticNodeReferences: $baselineStaticNodeReferences,
			baselineRestrictedSettingReferences: $baselineRestrictedSettingReferences,
			baselineOptionValues: $baselineOptionValues,
			draftOptionValues: $draftOptionValues,
		);
	}

	/**
	 * Every value the block holds, its own and those of the sub-steps a complex node carries in its rules, keyed by
	 * what the option list of each level is built from. The block's own values name no document type: a block is
	 * described for the type of the edited template, one and the same for the whole map
	 * ({@see ValidationContext::optionValueFingerprint()}). A sub-step's values are keyed by the activity the
	 * construction names rather than by the host node, with no preset and with the host node's EFFECTIVE document
	 * type, exactly as the nested check asks its schema ({@see self::constructionOptionValues()}).
	 *
	 * @return array<string, true>
	 */
	private static function collectOptionValues(AgentBlock $block, DocumentDescription $documentType): array
	{
		$values = [];
		foreach ($block->settings as $setting)
		{
			$values += self::optionValueFingerprints(
				$block->type,
				$block->presetId,
				$setting->name,
				$setting->value,
				documentType: null,
			);
		}

		return $values + self::collectNestedOptionValues($block, $documentType);
	}

	/** @return array<string, true> */
	private static function collectNestedOptionValues(AgentBlock $block, DocumentDescription $documentType): array
	{
		if ($block->rules === null)
		{
			return [];
		}

		$nestedDocumentType = self::nestedDocumentTypeOf($block->type, $documentType);
		if ($nestedDocumentType === null)
		{
			// No effective document type means no sub-step schema at all
			// ({@see ComplexBlockDetailFactory::describeSubAction()}), so the nested option check never runs and a
			// key collected here could only ever sit unread.
			return [];
		}

		$values = [];
		foreach ($block->rules->portRules as $portRuleList)
		{
			foreach ($portRuleList as $rule)
			{
				foreach ($rule->constructions as $construction)
				{
					$values += self::constructionOptionValues($construction, $nestedDocumentType);
				}
			}
		}

		return $values;
	}

	/**
	 * The document type the sub-steps of one host node are described for: the type its complex activity fixes, the
	 * type of the edited template when it fixes none. Asked of the same two services the DESCRIBING side of this
	 * contour asks ({@see ComplexBlockDetailFactory::build()}), so the key a value is collected under is the key
	 * the check looks it up by.
	 *
	 * It is not the question the editor asks, though. Both ends of this contour read
	 * {@see \Bitrix\Bizproc\Internal\Service\Activity\ComplexActivityService::getFixedDocumentTypeForNodeAction()},
	 * while the surfaces of the editor read `getPublishedDocumentTypeForNode($type, $properties)`, which at a
	 * trigger also answers with the document type of the event. The two diverge on exactly six shipped triggers -
	 * `crm{company,contact,deal,lead,quote,smartinvoice}manualstarttrigger` - where the fixed type is null and the
	 * published one names a real CRM type. No graph reaches that divergence today: a host node has a detail only
	 * when its NODE_TYPE is `complex` ({@see ComplexBlockDetailFactory::build()}) and none of the six declares one,
	 * so this contour stays consistent with itself. Written down because the difference is invisible from here.
	 *
	 * It cannot be left out of the key and it cannot be replaced by the type of the request: one template may hold
	 * a deal complex node and a lead one, both offering the same sub-step, and their option lists differ. Reading
	 * this per host node costs a lookup for complex nodes alone - a plain block never reaches here.
	 */
	private static function nestedDocumentTypeOf(string $blockType, DocumentDescription $documentType): ?array
	{
		$fixedDocumentType = BizprocContainer::instance()
			->getComplexActivityService()
			->getFixedDocumentTypeForNodeAction($blockType)
		;

		return Container::getNodeFilterAvailability()->resolveEffectiveDocumentType(
			$fixedDocumentType,
			$documentType->toBizprocComplexType(),
		);
	}

	/**
	 * The values of one sub-step, keyed with NO preset and with the effective document type of its host node. The
	 * absent preset is the whole of it rather than an omission: a sub-step carries none, and its option list is a
	 * function of its activity code and that document type alone
	 * ({@see ComplexBlockDetailFactory::describeSubAction()}). The nested check keys its lookup exactly the same way
	 * ({@see \Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Validator\AgentComplexRulesValidator::validateNestedSettingNames()}).
	 *
	 * @return array<string, true>
	 */
	private static function constructionOptionValues(
		AgentComplexConstruction $construction,
		array $nestedDocumentType,
	): array
	{
		if (
			$construction->type !== AgentComplexConstruction::TYPE_ACTION
			&& $construction->type !== AgentComplexConstruction::TYPE_FILTER
		)
		{
			return [];
		}

		$activityCode = $construction->expression['activityCode'] ?? null;
		$settings = $construction->expression['settings'] ?? null;
		if (!is_string($activityCode) || $activityCode === '' || !is_array($settings))
		{
			return [];
		}

		$values = [];
		foreach ($settings as $name => $value)
		{
			if (is_string($name) && $name !== '')
			{
				$values += self::optionValueFingerprints(
					$activityCode,
					presetId: null,
					name: $name,
					value: $value,
					documentType: $nestedDocumentType,
				);
			}
		}

		return $values;
	}

	/**
	 * A multiple setting holds its values in a list, and the option check judges each element on its own, so the
	 * baseline is collected per element too, by the predicate the option check itself applies: a scalar is judged
	 * by its string form, and an element that has none is refused there whatever the baseline holds, so a
	 * fingerprint of one is never asked for.
	 *
	 * @return array<string, true>
	 */
	private static function optionValueFingerprints(
		string $blockType,
		?string $presetId,
		string $name,
		mixed $value,
		?array $documentType,
	): array
	{
		$fingerprints = [];
		foreach (is_array($value) ? $value : [$value] as $item)
		{
			if (is_scalar($item))
			{
				$fingerprints[ValidationContext::optionValueFingerprint(
					$blockType,
					$presetId,
					$name,
					(string)$item,
					$documentType,
				)] = true;
			}
		}

		return $fingerprints;
	}

	/**
	 * Codes of the constant items one baseline wizard form declares. The public parser is the single account of a
	 * readable form, so a baseline with an unknown item or an incomplete constant fails closed here too.
	 *
	 * Never returns an empty list for an unreadable form: an unreadable sample read as "declares nothing" would send
	 * an inherited constant down the branch of a new one (see {@see ValidationContext::__construct} for that refusal).
	 *
	 * @return list<string>|null
	 */
	private static function readWizardConstantCodes(AgentSettingCollection $settings): ?array
	{
		$parsed = SetupTemplateNodePolicy::parseNodeForm(
			SetupTemplateNodePolicy::readRawForm($settings),
		);
		if ($parsed === null || !$parsed->isSuccess())
		{
			return null;
		}

		$codes = [];
		foreach ($parsed->declarations as $declaration)
		{
			$codes[] = $declaration->code;
		}

		return $codes;
	}

	/**
	 * Codes of the constants a wizard authored, out of the ones a draft carries. Told apart by the code form the
	 * wizard editor produces ({@see SetupTemplateNodePolicy::isEditorAuthoredCode()}) - the very form the admission
	 * of a new constant demands - so a constant the owner declared elsewhere in the template is not counted against
	 * a ceiling that is about the wizard.
	 *
	 * @param array<string, mixed> $constants
	 *
	 * @return list<string>
	 */
	private static function wizardAuthoredCodes(array $constants): array
	{
		$codes = [];
		foreach (array_keys($constants) as $code)
		{
			if (SetupTemplateNodePolicy::isEditorAuthoredCode((string)$code))
			{
				$codes[] = (string)$code;
			}
		}

		return $codes;
	}

	/**
	 * Restricted passthrough settings of one baseline block (ALG-04) - its own and those of the sub-steps a complex
	 * node carries in its rules. Anchored per (name, value) rather than per node, so an unrelated edit on the same
	 * block - a new title, a moved connection - does not cost the template a condition it already published.
	 *
	 * @return array<string, true>
	 */
	private static function collectRestrictedSettings(
		AgentBlock $block,
		DocumentDescription $documentType,
		RestrictedSettingRegistry $restrictedSettings,
	): array
	{
		$fingerprints = [];

		$restrictedNames = $restrictedSettings->namesFor($block->type, $documentType);
		if ($restrictedNames !== [])
		{
			foreach ($block->settings as $setting)
			{
				if (in_array(mb_strtolower($setting->name), $restrictedNames, true))
				{
					$fingerprints[RestrictedSettingRegistry::fingerprintOf($setting->name, $setting->value)] = true;
				}
			}
		}

		return $fingerprints + self::collectNestedRestrictedSettings($block, $documentType, $restrictedSettings);
	}

	/** @return array<string, true> */
	private static function collectRestrictedSettingReferences(
		AgentBlock $block,
		DocumentDescription $documentType,
		RestrictedSettingRegistry $restrictedSettings,
	): array
	{
		$references = [];
		$restrictedNames = $restrictedSettings->namesFor($block->type, $documentType);
		foreach ($block->settings as $setting)
		{
			if (in_array(mb_strtolower($setting->name), $restrictedNames, true))
			{
				$references[RestrictedSettingRegistry::referenceFingerprint(
					"block:{$block->id}",
					$block->type,
					$setting->name,
					$setting->value,
				)] = true;
			}
		}

		return $references + self::collectNestedRestrictedSettingReferences($block, $documentType, $restrictedSettings);
	}

	/** @return array<string, true> */
	private static function collectNestedRestrictedSettingReferences(
		AgentBlock $block,
		DocumentDescription $documentType,
		RestrictedSettingRegistry $restrictedSettings,
	): array
	{
		if ($block->rules === null)
		{
			return [];
		}

		$references = [];
		foreach ($block->rules->portRules as $portId => $portRuleList)
		{
			foreach ($portRuleList as $rule)
			{
				foreach ($rule->constructions as $constructionIndex => $construction)
				{
					$references += self::constructionRestrictedSettingReferences(
						$construction,
						"block:{$block->id}|port:{$portId}|rule:{$rule->id}|construction:{$constructionIndex}",
						$documentType,
						$restrictedSettings,
					);
				}
			}
		}

		return $references;
	}

	/** @return array<string, true> */
	private static function constructionRestrictedSettingReferences(
		AgentComplexConstruction $construction,
		string $location,
		DocumentDescription $documentType,
		RestrictedSettingRegistry $restrictedSettings,
	): array
	{
		if (
			$construction->type !== AgentComplexConstruction::TYPE_ACTION
			&& $construction->type !== AgentComplexConstruction::TYPE_FILTER
		)
		{
			return [];
		}

		$activityCode = $construction->expression['activityCode'] ?? null;
		$settings = $construction->expression['settings'] ?? null;
		if (!is_string($activityCode) || $activityCode === '' || !is_array($settings) || $settings === [])
		{
			return [];
		}

		$references = [];
		$restrictedNames = $restrictedSettings->namesFor($activityCode, $documentType);
		foreach ($settings as $name => $value)
		{
			if (is_string($name) && in_array(mb_strtolower($name), $restrictedNames, true))
			{
				$references[RestrictedSettingRegistry::referenceFingerprint($location, $activityCode, $name, $value)] = true;
			}
		}

		return $references;
	}


	/**
	 * The nested half of the sample, collected because the barrier reaches that level too
	 * ({@see \Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Validator\AgentComplexRulesValidator}): were the
	 * sub-steps left out here, one returned unchanged from the published version would find no fingerprint of its own
	 * and be refused as newly authored - the round-trip of an untouched template, not an attack, is what would break.
	 *
	 * Names are asked of the activity each construction names, never of the host node, exactly as the nested check
	 * asks them: a sub-step is a different class with restrictions of its own.
	 *
	 * @return array<string, true>
	 */
	private static function collectNestedRestrictedSettings(
		AgentBlock $block,
		DocumentDescription $documentType,
		RestrictedSettingRegistry $restrictedSettings,
	): array
	{
		if ($block->rules === null)
		{
			return [];
		}

		$fingerprints = [];
		foreach ($block->rules->portRules as $portRuleList)
		{
			foreach ($portRuleList as $rule)
			{
				foreach ($rule->constructions as $construction)
				{
					$fingerprints += self::constructionRestrictedSettings(
						$construction,
						$documentType,
						$restrictedSettings,
					);
				}
			}
		}

		return $fingerprints;
	}

	/**
	 * Restricted settings of one sub-step. Only `action` and `filter` carry an activity of their own - the very two
	 * kinds the nested check authorises; a condition or an output has no settings map to judge.
	 *
	 * @return array<string, true>
	 */
	private static function constructionRestrictedSettings(
		AgentComplexConstruction $construction,
		DocumentDescription $documentType,
		RestrictedSettingRegistry $restrictedSettings,
	): array
	{
		if (
			$construction->type !== AgentComplexConstruction::TYPE_ACTION
			&& $construction->type !== AgentComplexConstruction::TYPE_FILTER
		)
		{
			return [];
		}

		$activityCode = $construction->expression['activityCode'] ?? null;
		$settings = $construction->expression['settings'] ?? null;
		if (!is_string($activityCode) || $activityCode === '' || !is_array($settings) || $settings === [])
		{
			return [];
		}

		$restrictedNames = $restrictedSettings->namesFor($activityCode, $documentType);
		if ($restrictedNames === [])
		{
			return [];
		}

		$fingerprints = [];
		foreach ($settings as $name => $value)
		{
			if (is_string($name) && in_array(mb_strtolower($name), $restrictedNames, true))
			{
				$fingerprints[RestrictedSettingRegistry::fingerprintOf($name, $value)] = true;
			}
		}

		return $fingerprints;
	}

	/**
	 * Static means "not isolated to the bound template by the token alone" - every non-empty consumer code except a
	 * pure token one. A token nested in a computable expression expands to a foreign code at runtime, so the guard
	 * denies it the token branch (ALG-02 rule 3) and it must be anchored by its baseline fingerprint.
	 */
	private static function isStaticCode(string $code): bool
	{
		if ($code === '')
		{
			return false;
		}

		// Byte-wise on purpose: anything this check does not recognise as the canonical token is treated as
		// static, i.e. anchored by the node fingerprint instead of becoming an editable token code. The guard
		// judges what a code EXPANDS to ({@see StorageReferenceGuard::isFullyInterpretableCode()}); erring
		// towards "static" here can only narrow what the agent may edit, never widen it.
		return !str_contains($code, self::TEMPLATE_ID_TOKEN)
			|| str_contains(str_replace(self::TEMPLATE_ID_TOKEN, '', $code), '{=');
	}

	/**
	 * The very predicate the guard applies in ALG-02 rule 1, so the baseline collection and the refusal cannot
	 * drift apart: what the guard refuses as an id-addressed node is exactly what is anchored here.
	 */
	private static function addressesStorageById(AgentSettingCollection $settings): bool
	{
		return StorageReferenceGuard::addressesStorageById(StorageNodeClassifier::extractStorageId($settings));
	}
}
