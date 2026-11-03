<?php

namespace Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Validator;

use Bitrix\Bizproc\Public\Entity\Activity\SetupTemplateActivity\SetupBlocksParseResult;
use Bitrix\Bizproc\Public\Entity\Activity\SetupTemplateActivity\SetupConstantDeclaration;
use Bitrix\BizprocDesigner\Internal\Entity\DocumentDescription;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Cache\BlockDescriptionCache;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentBlock;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentBlockCollection;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentComplexConstruction;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Enum\GraphErrorCode;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Enum\RequestSource;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Error\GraphError;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\AgentBlockMetadataResolver;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\CreateStorageNodePolicy;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\RestrictedSettingRegistry;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\SetupTemplateNodePolicy;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\StorageNodeClassifier;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\StorageNodeFingerprint;
use Bitrix\Main\Error;
use Bitrix\Main\Result;

final class AgentBlocksValidator
{
	/**
	 * Server-side DoS guard, not a business limit: layout is polynomial in the block count (see
	 * TopologyLayoutEngine). Single source of truth for the bound the Marta tool schema advertises via maxItems
	 * ({@see \Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Tool\SaveWorkflowTool::getInputSchema()}),
	 * enforced here so the REST path is guarded too, not only the schema-validated Marta one.
	 */
	public const MAX_BLOCKS = 256;

	/**
	 * Server-side DoS guard on the setup wizard form of ONE node: a form that passes it has every item parsed, and
	 * the forward path writes a constant item back declaration by declaration. Items of every kind are counted
	 * rather than the constants alone - a delimiter, a heading and a description cost the same parse as a constant
	 * does - and the counting itself is done on the RAW form, so a form over the bound is turned down without ever
	 * paying the parse the bound exists to keep out. The richest shipped form declares seven constants, so this is
	 * a generous upper bound that never clips a legitimate wizard, not a business limit.
	 */
	public const MAX_SETUP_FORM_ITEMS = 64;

	/**
	 * Server-side DoS guard on the constant declarations of the whole template: the codes the wizard nodes of the
	 * graph declare together with the ones the published version already owns AND the ones the bound draft has
	 * accumulated. The draft belongs in the count because that is where a reverse write merges declarations and it
	 * never removes one, so counting the published version alone would leave the size of the draft bounded by the
	 * storage column and nothing else. Bites growth alone - at the ceiling an edit that only updates declarations
	 * the published wizard carries still passes - so a template that outgrew the bound before it existed keeps
	 * being editable and needs no migration.
	 */
	public const MAX_SETUP_DECLARATIONS = 128;

	private readonly ?AgentBlockValidator $injectedBlockValidator;
	private readonly ?ValidationContext $context;
	private readonly RequestSource $source;
	private readonly CreateStorageNodePolicy $createStorageNodePolicy;
	private readonly SetupTemplateNodePolicy $setupTemplateNodePolicy;

	/**
	 * Built per run on the context enriched with the storage codes this template owns (ALG-11). An externally
	 * injected validator is taken as it is: a test double must never gain the enrichment, or a barrier resting
	 * on the owned codes would report green without ever being asked.
	 *
	 * Kept past the run because the enriched context lives nowhere else: reading it back off this property is the
	 * only way to tell the owned codes the main pass judged on from the ones it was handed. Nullable because
	 * validate() returns before building it on every malformed input, and a typed property left unset would answer
	 * that read with an Error instead of "there was no run".
	 */
	private ?AgentBlockValidator $blockValidator = null;

	/**
	 * Catalog lookups shared by the probe pass and the main pass of one validate() call. Both walk the same
	 * activity catalog with the same source, and a catalog walk is not memoised inside
	 * {@see \Bitrix\Bizproc\Runtime\ActivitySearcher\Searcher::searchByType()}, so a private cache per pass
	 * means every walk is paid twice. Sharing is safe: BlockDescriptionCache keys on block type, source, preset
	 * and document type, and AgentBlockMetadataResolver depends on the source alone, while the passes differ only
	 * by black list and context. Both are dropped at the start of every validate() all the same: the metadata
	 * resolver has no document type in its key, and a run keeps nothing of the previous one.
	 */
	private ?BlockDescriptionCache $blockDescriptionCache = null;
	private ?AgentBlockMetadataResolver $metadataResolver = null;

	/**
	 * Shared by every block validator this one builds, for the same reason the two above are: resolving the
	 * restricted names of a type loads condition files. Unlike them it is not dropped between runs - its key
	 * carries the document type, so an answer of one run cannot be read for another.
	 */
	private ?RestrictedSettingRegistry $restrictedSettings = null;

	private AgentBlockCollection $validBlocks;

	/**
	 * @var list<string>
	 */
	private array $blockIds = [];

	/**
	 * @var list<string> ids of the valid frame overlays (REST only). Frames carry no ports and are excluded
	 *      from the ordinary connections/connectivity check {@see AgentConnectionsValidator}.
	 */
	private array $frameBlockIds = [];

	/**
	 * @var array<string, array{input: list<string>, output: list<string>, dynamic?: bool}>
	 *      Known ports per block id. Complex nodes carry `dynamic: true` - their port set is projected
	 *      exhaustively from their own rules, so an unknown port is an error even when a direction is
	 *      empty (no "unknown ports -> skip check" bypass in the connections validator).
	 */
	private array $blockPortsMap = [];

	/**
	 * @var array<string, list<string>> loop-back input port ids per block id (loop nodes only)
	 */
	private array $blockLoopbackInputPortsMap = [];

	/**
	 * Setup wizard forms of the graph, parsed once per node by the pass that precedes the verdicts and kept by
	 * block id. Reused when the node is judged instead of being parsed again: a second parse pays the entity
	 * selector registry of every constant a second time, which is the very cost {@see self::MAX_SETUP_FORM_ITEMS}
	 * exists to bound.
	 *
	 * @var array<string, SetupBlocksParseResult>
	 */
	private array $setupNodeForms = [];

	/**
	 * @var array<string, int> occurrences of every constant code across the wizard nodes of the graph (ALG-01)
	 */
	private array $setupGraphCodeCounts = [];

	/**
	 * Ids of the wizard nodes whose raw form is over {@see self::MAX_SETUP_FORM_ITEMS}. Such a node is left
	 * unparsed, so it declares nothing to the code counter either: it is refused by the bound whatever its items
	 * say, and one refused node refuses the whole entry.
	 *
	 * @var array<string, true>
	 */
	private array $setupOversizedNodeIds = [];

	/**
	 * Constants declared by the wizard nodes this pass ADMITTED outside the baseline, in the order it met them
	 * (TPL-03). Taken from the very parse the verdict rested on, so the graph is judged and written by one reading
	 * of the same form. A node the baseline carries verbatim contributes nothing: its form was never parsed, and
	 * applying what it declares would repaint constants the published version already agreed on.
	 *
	 * @var list<SetupConstantDeclaration>
	 */
	private array $setupConstantDeclarations = [];

	/**
	 * @var list<string>|null constant types the wizard allows for the document type of the run; null means the
	 *      process engine of this portal publishes no such reading, which the policy refuses by its own reason
	 */
	private ?array $setupAllowedConstantTypes = null;

	/** Whether the declarations of the template as a whole are over {@see self::MAX_SETUP_DECLARATIONS}. */
	private bool $setupDeclarationLimitExceeded = false;

	public function __construct(
		?AgentBlockValidator $blockValidator = null,
		?ValidationContext $context = null,
		?CreateStorageNodePolicy $createStorageNodePolicy = null,
	)
	{
		$this->context = $context;
		// Fail-closed like ValidationContext itself: no context at all means the least permissive source.
		$this->source = $context?->source ?? RequestSource::Marta;
		$this->validBlocks = new AgentBlockCollection();
		$this->injectedBlockValidator = $blockValidator;
		$this->createStorageNodePolicy = $createStorageNodePolicy ?? new CreateStorageNodePolicy();
		$this->setupTemplateNodePolicy = new SetupTemplateNodePolicy();
	}

	/**
	 * Error texts are deliberately kept verbatim - the Marta model reads them as hints - so a message names
	 * `blocks` literally even though the address it is reported at comes from $path.
	 */
	public function validate(mixed $blocks, DocumentDescription $documentType, string $path = ''): Result
	{
		$this->blockIds = [];
		$this->frameBlockIds = [];
		$this->blockPortsMap = [];
		$this->blockLoopbackInputPortsMap = [];
		$this->blockDescriptionCache = null;
		$this->metadataResolver = null;
		$this->blockValidator = null;
		$this->setupNodeForms = [];
		$this->setupGraphCodeCounts = [];
		$this->setupOversizedNodeIds = [];
		$this->setupAllowedConstantTypes = null;
		$this->setupDeclarationLimitExceeded = false;
		$this->setupConstantDeclarations = [];
		$this->validBlocks = new AgentBlockCollection();

		if (!is_array($blocks))
		{
			return (new Result())->addError(GraphError::at($path, 'blocks should be array'));
		}

		if (empty($blocks))
		{
			return (new Result())->addError(GraphError::at($path, 'blocks should be not empty array'));
		}

		if (count($blocks) > self::MAX_BLOCKS)
		{
			return (new Result())->addError(
				GraphError::at(
					$path,
					'blocks should contain at most ' . self::MAX_BLOCKS . ' items',
					GraphErrorCode::BlockLimitExceeded,
				),
			);
		}

		// The owned codes are collected before the main pass, so a consumer is judged by the same set wherever
		// its creator stands in the array. The right-hand side is skipped for an injected validator: with no
		// enrichment to build, the graph is not walked for the codes either.
		$blockValidator = $this->injectedBlockValidator
			?? $this->createBlockValidator($this->contextWithOwnedStorageCodes($blocks, $documentType, $path));
		$this->blockValidator = $blockValidator;

		// Unlike the pass above this one enriches no validator - it assembles what a wizard verdict rests on - so
		// it runs whoever built the block validator: the verdict may not depend on how the caller was wired.
		$this->scanSetupTemplateNodes($blocks, $documentType, $path);

		$result = new Result();
		foreach ($blocks as $key => $block)
		{
			$blockValidateResult = $blockValidator->validate(
				block: $block,
				documentType: $documentType,
				blackListIds: $this->blockIds,
				path: "{$path}.{$key}",
			);
			$result->addErrors($blockValidateResult->getErrors());
			$validBlock = $blockValidateResult->isSuccess() ? $this->blockValidator->getValidBlock() : null;
			if ($validBlock !== null)
			{
				$validBlock = $blockValidator->getValidBlock();

				// An immutable storage node is a passthrough of the published baseline only (ALG-01), checked
				// here rather than in the consumer guard: a forged create carrying a token code is out of the
				// baseline too, so the guard's token branch would never catch it. Outside the baseline the
				// create node still has the admission policy left (ALG-10); the rest stay refused outright.
				if ($validBlock !== null && StorageNodeClassifier::isImmutable($validBlock->type))
				{
					$fingerprint = StorageNodeFingerprint::of($validBlock->type, $validBlock->settings);
					$baseline = $this->context?->baselineImmutableFingerprints ?? [];
					if (!isset($baseline[$fingerprint]))
					{
						$result->addErrors(
							$this->admitNodeOutsideBaseline($validBlock, "{$path}.{$key}")->getErrors(),
						);
					}
				}

				if ($validBlock !== null)
				{
					$result->addErrors(
						$this->validatePublishedReferenceScope($validBlock, $documentType, "{$path}.{$key}")->getErrors(),
					);
				}

				$this->validBlocks->add($validBlock);

				if (FrameBlockMatcher::matches($validBlock->type, $validBlock->presetId))
				{
					$this->frameBlockIds[] = $validBlock->id;
				}

				$blockDetail = $blockValidator->getValidBlockDetail();
				if ($validBlock !== null && $blockDetail !== null)
				{
					if ($validBlock->rules !== null)
					{
						// Complex node: ports are projected from the block's own rules (dynamic), not from
						// the static catalog topology. Marked `dynamic` so the connections validator does not
						// fall back to its "unknown ports -> skip check" bypass and let the agent reference a
						// non-existent dynamic port. Aux (tool) ports are source endpoints too, so they join
						// the output set. Complex nodes have no loop-back inputs.
						$this->blockPortsMap[$validBlock->id] = [
							'input' => $validBlock->rules->getInputPortIds(),
							'output' => [
								...$validBlock->rules->getOutputPortIds(),
								...$validBlock->rules->getAuxPortIds(),
							],
							'dynamic' => true,
						];
					}
					else
					{
						$this->blockPortsMap[$validBlock->id] = $blockDetail->getPortIds();

						$loopbackInputPorts = $blockDetail->getLoopbackInputPortIds();
						if (!empty($loopbackInputPorts))
						{
							$this->blockLoopbackInputPortsMap[$validBlock->id] = $loopbackInputPorts;
						}
					}
				}
			}
			if ($blockValidator->getId() !== null)
			{
				$this->blockIds[] = $blockValidator->getId();
			}
		}

		return $result;
	}

	/**
	 * A few values intentionally bypass the typed settings passport. Their value-level checks remain in the block
	 * validator; this graph-level check additionally holds each one to the published node and location that owns it.
	 */
	private function validatePublishedReferenceScope(
		AgentBlock $block,
		DocumentDescription $documentType,
		string $path,
	): Result
	{
		$context = $this->context;
		if ($context === null)
		{
			return new Result();
		}

		$result = new Result();
		if (AgentStartTriggerMatcher::matches($block->type))
		{
			$fingerprint = AgentStartTriggerMatcher::referenceFingerprint($block);
			if (!isset($context->baselineVerbatimStartTriggerReferences[$fingerprint]))
			{
				$result->addError(GraphError::at(
					$path,
					"{$path} agent start trigger must match a published template node exactly",
				));
			}
		}

		if (StorageNodeClassifier::isConsumer($block->type))
		{
			$fingerprint = StorageNodeFingerprint::of($block->type, $block->settings);
			if (
				isset($context->baselineStaticNodeFingerprints[$fingerprint])
				&& $context->baselineStaticNodeReferences !== []
				&& !isset($context->baselineStaticNodeReferences[StorageNodeFingerprint::referenceOf(
					$block->id,
					$block->type,
					$block->settings,
				)])
			)
			{
				$result->addError(GraphError::at(
					"{$path}.id",
					"{$path}.id static storage consumer must keep its published node identity",
				));
			}
		}

		return $result->addErrors(
			$this->validateRestrictedSettingReferences($block, $documentType, $path)->getErrors(),
		);
	}

	private function validateRestrictedSettingReferences(
		AgentBlock $block,
		DocumentDescription $documentType,
		string $path,
	): Result
	{
		$context = $this->context;
		if ($context === null || $context->baselineRestrictedSettingReferences === [])
		{
			return new Result();
		}

		$this->restrictedSettings ??= new RestrictedSettingRegistry();
		$result = new Result();
		$restrictedNames = $this->restrictedSettings->namesFor($block->type, $documentType);
		foreach ($block->settings as $setting)
		{
			if (!in_array(mb_strtolower($setting->name), $restrictedNames, true))
			{
				continue;
			}

			$this->assertRestrictedSettingReference(
				$result,
				"block:{$block->id}",
				$block->type,
				$setting->name,
				$setting->value,
				"{$path}.settings.{$setting->name}",
			);
		}

		if ($block->rules === null)
		{
			return $result;
		}

		foreach ($block->rules->portRules as $portId => $portRuleList)
		{
			foreach ($portRuleList as $rule)
			{
				foreach ($rule->constructions as $constructionIndex => $construction)
				{
					if (
						$construction->type !== AgentComplexConstruction::TYPE_ACTION
						&& $construction->type !== AgentComplexConstruction::TYPE_FILTER
					)
					{
						continue;
					}

					$activityCode = $construction->expression['activityCode'] ?? null;
					$settings = $construction->expression['settings'] ?? null;
					if (!is_string($activityCode) || !is_array($settings))
					{
						continue;
					}

					$location = "block:{$block->id}|port:{$portId}|rule:{$rule->id}|construction:{$constructionIndex}";
					$restrictedNames = $this->restrictedSettings->namesFor($activityCode, $documentType);
					foreach ($settings as $name => $value)
					{
						if (is_string($name) && in_array(mb_strtolower($name), $restrictedNames, true))
						{
							$this->assertRestrictedSettingReference(
								$result,
								$location,
								$activityCode,
								$name,
								$value,
								"{$path}.rules.{$portId}.{$rule->id}.constructions.{$constructionIndex}.settings.{$name}",
							);
						}
					}
				}
			}
		}

		return $result;
	}

	/**
	 * The location half of ALG-04, and it parts on the payload exactly as the value half does
	 * ({@see AgentBlockValidator::authorizeRestrictedSettings()}): an empty setting is duplicated by copying
	 * nothing, so there is no reuse for this check to close.
	 */
	private function assertRestrictedSettingReference(
		Result $result,
		string $location,
		string $type,
		string $name,
		mixed $value,
		string $path,
	): void
	{
		if (RestrictedSettingRegistry::carriesNoPayload($value))
		{
			return;
		}

		if (!isset($this->context->baselineRestrictedSettingReferences[
			RestrictedSettingRegistry::referenceFingerprint($location, $type, $name, $value)
		]))
		{
			$result->addError(GraphError::at(
				$path,
				"{$path} must match the published template location for this executable setting",
			));
		}
	}

	/**
	 * Judges an immutable storage node the published baseline does not carry. Both immutable types have a resource
	 * policy of their own past this point: the wizard node goes to {@see SetupTemplateNodePolicy} and the create
	 * node to {@see CreateStorageNodePolicy} (ALG-10). Each refusal carries the text of the policy that made it -
	 * the agent's only channel of self-correction - and leaves a diagnostic record of its own. What is left of the
	 * unconditional refusal answers for a type neither policy judges, and for a create node reaching here with no
	 * context: with no template there is no code to bind, so the policy is not consulted at all - the same
	 * fail-closed reading of a missing context the rest of the pipeline holds. The wizard branch is taken whatever
	 * the context, because its policy names that state by a reason of its own.
	 *
	 * The wizard is recognised by {@see SetupTemplateNodeMatcher} and not by the storage taxonomy of
	 * {@see StorageNodeClassifier}: it touches no storage, and a predicate for it there would invent a commonality
	 * the two node families do not have.
	 */
	private function admitNodeOutsideBaseline(AgentBlock $block, string $path): Result
	{
		if (SetupTemplateNodeMatcher::matches($block->type))
		{
			return $this->admitSetupTemplateNode($block, $path);
		}

		$context = $this->context;
		if ($context === null || !StorageNodeClassifier::isStorageCreator($block->type))
		{
			return (new Result())->addError(new Error(
				"{$path} " . CreateStorageNodePolicy::REASON_TYPE_NOT_ALLOWED,
			));
		}

		$verdict = $this->createStorageNodePolicy->admit($block->type, $block->settings, $context);
		if ($verdict->allowed)
		{
			return new Result();
		}

		$this->createStorageNodePolicy->reportRejection($block->id, $block->settings, $verdict, $context);

		return (new Result())->addError(new Error("{$path} {$verdict->reason}"));
	}

	/**
	 * Judges a setup wizard node the published baseline does not carry verbatim. Everything the verdict rests on is
	 * assembled by {@see self::scanSetupTemplateNodes()} before the first verdict, so that one and the same node
	 * gets one and the same verdict wherever it stands in the array.
	 *
	 * The two technical ceilings are held here rather than inside the policy: the numbers bound what THIS entry
	 * accepts and belong next to {@see self::MAX_BLOCKS}, while the wording of a refusal belongs to the policy,
	 * which is the single account of why a wizard node is turned down. Both arrive already decided from
	 * {@see self::scanSetupTemplateNodes()} - the item one before the form of the node was parsed at all.
	 *
	 * A refusal with no context at all cannot be recorded - the record names the template and the entry, and there
	 * is neither - so the agent still gets the reason and the diagnostic channel stays silent.
	 *
	 * An admitted node hands its declarations on to the write (TPL-03). They are taken from the parse the verdict
	 * was made on and only ever from a node that reached this point, so what a refused - or a verbatim - node
	 * declares is never applied.
	 */
	private function admitSetupTemplateNode(AgentBlock $block, string $path): Result
	{
		$parsedForm = $this->setupNodeForms[$block->id] ?? null;

		$verdict = $this->setupTemplateNodePolicy->admit(
			$block->type,
			$parsedForm,
			$this->setupAllowedConstantTypes,
			$this->setupGraphCodeCounts,
			isset($this->setupOversizedNodeIds[$block->id]),
			$this->setupDeclarationLimitExceeded,
			$this->context,
		);
		if ($verdict->allowed)
		{
			if ($parsedForm !== null)
			{
				$this->setupConstantDeclarations = [
					...$this->setupConstantDeclarations,
					...$parsedForm->declarations,
				];
			}

			return new Result();
		}

		if ($this->context !== null)
		{
			$this->setupTemplateNodePolicy->reportRejection($block->id, $verdict, $this->context);
		}

		return (new Result())->addError(new Error("{$path} {$verdict->reason}"));
	}

	/**
	 * Reads the setup wizard nodes of the graph the published baseline does not carry verbatim, and assembles what
	 * their verdicts rest on: the form of each node, how many times every constant code occurs across them all, and
	 * whether the declarations of the template as a whole are over the ceiling. Assembled here rather than inside
	 * the policy for the same reason the owned storage codes are: a value spanning several nodes that grew while
	 * the nodes were judged would make the verdict depend on the order of the blocks.
	 *
	 * The pass walks the nodes instead of asking the policy - the storage pass above can ask, because there
	 * admission does not depend on what the pass collects, while here it does. So the codes of every wizard node it
	 * parses are counted whatever the verdict on that node turns out to be, or two nodes declaring one code would
	 * legitimise each other. A node over the item bound is the one exception: it is refused by that bound alone,
	 * which refuses the entry as a whole, so nothing is left for its codes to decide.
	 *
	 * A node the baseline carries verbatim contributes its codes to the graph-wide uniqueness check, but its parsed
	 * declarations stay out of setupNodeForms. It remains admitted before the policy is consulted and never reaches
	 * the write path.
	 */
	private function scanSetupTemplateNodes(array $blocks, DocumentDescription $documentType, string $path): void
	{
		$context = $this->context;
		if ($context === null)
		{
			// No template to compare a form against: the policy refuses every wizard node by that state alone.
			return;
		}

		$probe = null;
		foreach ($blocks as $block)
		{
			$type = is_array($block) ? ($block['type'] ?? null) : null;
			if (!SetupTemplateNodeMatcher::matches($type))
			{
				continue;
			}

			$probe ??= $this->createBlockValidator($context);
			if (!$probe->validate($block, $documentType, [], $path)->isSuccess())
			{
				continue;
			}

			$validBlock = $probe->getValidBlock();
			if ($validBlock === null)
			{
				continue;
			}

			$isBaselineImmutable = isset($context->baselineImmutableFingerprints[
				StorageNodeFingerprint::of($validBlock->type, $validBlock->settings)
			]);

			// Two wizard nodes under one id: the main pass refuses such a graph through its black list, and what
			// this pass keeps is the reading of the node it met FIRST - a later node overwriting it would have the
			// verdict on one node made on the form of another.
			if (
				isset($this->setupNodeForms[$validBlock->id])
				|| isset($this->setupOversizedNodeIds[$validBlock->id])
			)
			{
				continue;
			}

			// One reading of the settings of the node feeds both the bound and the parse it bounds.
			$rawForm = SetupTemplateNodePolicy::readRawForm($validBlock->settings);

			// The item bound before the parse it bounds: counting the raw form reads no item of it, so a node over
			// the bound costs the entry nothing beyond the count and is refused by that bound alone.
			if (SetupTemplateNodePolicy::countFormItems($rawForm) > self::MAX_SETUP_FORM_ITEMS)
			{
				$this->setupOversizedNodeIds[$validBlock->id] = true;

				continue;
			}

			$parsedForm = SetupTemplateNodePolicy::parseNodeForm($rawForm);
			if ($parsedForm === null)
			{
				// The engine publishes no parse entry: the policy answers for that state by a reason of its own.
				continue;
			}

			foreach ($parsedForm->declarations as $declaration)
			{
				$this->setupGraphCodeCounts[$declaration->code]
					= ($this->setupGraphCodeCounts[$declaration->code] ?? 0) + 1;
			}

			if (!$isBaselineImmutable)
			{
				$this->setupNodeForms[$validBlock->id] = $parsedForm;
			}
		}

		if ($this->setupNodeForms === [])
		{
			return;
		}

		// Once per pass, and only with a node to judge: reading the list includes the activity file of the wizard.
		$this->setupAllowedConstantTypes = SetupTemplateNodePolicy::readAllowedConstantTypes($documentType);

		$declaredCodes = [
			...($context->baselineWizardCodes ?? []),
			...$context->draftWizardCodes,
			...array_keys($this->setupGraphCodeCounts),
		];
		$this->setupDeclarationLimitExceeded = count(array_unique($declaredCodes)) > self::MAX_SETUP_DECLARATIONS;
	}

	/**
	 * Collects the storage codes this template owns for the graph under validation (ALG-11): the creators of the
	 * published baseline plus the create nodes of this very graph the policy admits. Their settings are parsed
	 * by a probe instance of the same block validator, so both passes judge one and the same value; the probe's
	 * errors are dropped and its black list stays empty - the verdict on a node, duplicate ids included, belongs
	 * to the main pass alone.
	 *
	 * The policy is asked with the ORIGINAL context, never with the growing set, or two forged create nodes
	 * would legitimise each other. The enriched copy is assembled once and never mutated afterwards, or the
	 * verdict would start depending on the order of the blocks.
	 */
	private function contextWithOwnedStorageCodes(
		array $blocks,
		DocumentDescription $documentType,
		string $path,
	): ?ValidationContext
	{
		$context = $this->context;
		if ($context === null)
		{
			return null;
		}

		$ownedCodes = $context->baselineCreatorStorageCodes;
		$probe = null;
		foreach ($blocks as $block)
		{
			$type = is_array($block) ? ($block['type'] ?? null) : null;
			if (!is_string($type) || !StorageNodeClassifier::isStorageCreator($type))
			{
				continue;
			}

			$probe ??= $this->createBlockValidator($context);
			if (!$probe->validate($block, $documentType, [], $path)->isSuccess())
			{
				continue;
			}

			$validBlock = $probe->getValidBlock();
			if ($validBlock === null)
			{
				continue;
			}

			$verdict = $this->createStorageNodePolicy->admit($validBlock->type, $validBlock->settings, $context);
			$code = StorageNodeClassifier::extractStorageCode($validBlock->settings);
			if ($verdict->allowed && $code !== null && $code !== '')
			{
				$ownedCodes[] = $code;
			}
		}

		return $context->withOwnedStorageCodes(array_values(array_unique($ownedCodes)));
	}

	private function createBlockValidator(?ValidationContext $context): AgentBlockValidator
	{
		// The baseline types are the same on every context this validator builds (the enriched one is a copy), so
		// the catalogs keyed on them stay memoised for the whole run.
		$baselineBlockTypes = $context?->baselineBlockTypes ?? [];
		$this->blockDescriptionCache ??= new BlockDescriptionCache(
			source: $this->source,
			baselineBlockTypes: $baselineBlockTypes,
		);
		$this->metadataResolver ??= new AgentBlockMetadataResolver(
			source: $this->source,
			baselineBlockTypes: $baselineBlockTypes,
		);
		$this->restrictedSettings ??= new RestrictedSettingRegistry();

		return new AgentBlockValidator(
			$this->blockDescriptionCache,
			metadataResolver: $this->metadataResolver,
			context: $context,
			restrictedSettings: $this->restrictedSettings,
		);
	}

	public function getValidBlocks(): AgentBlockCollection
	{
		return $this->validBlocks;
	}

	/**
	 * @return list<string>
	 */
	public function getBlockIds(): array
	{
		return $this->blockIds;
	}

	/**
	 * @return list<string> ids of the valid frame overlays (empty unless a REST agent sent frames)
	 */
	public function getFrameBlockIds(): array
	{
		return $this->frameBlockIds;
	}

	/**
	 * @return array<string, array{input: list<string>, output: list<string>, dynamic?: bool}>
	 */
	public function getBlockPortsMap(): array
	{
		return $this->blockPortsMap;
	}

	/**
	 * @return array<string, list<string>> loop-back input port ids per block id (loop nodes only)
	 */
	public function getBlockLoopbackInputPortsMap(): array
	{
		return $this->blockLoopbackInputPortsMap;
	}

	/**
	 * @return list<SetupConstantDeclaration> constants the admitted wizard nodes outside the baseline declare
	 *         (empty unless the graph carries such a node)
	 */
	public function getSetupConstantDeclarations(): array
	{
		return $this->setupConstantDeclarations;
	}
}
