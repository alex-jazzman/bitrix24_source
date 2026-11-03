<?php

namespace Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Validator;

use Bitrix\Bizproc\Public\Service\Storage\StorageAuthorizationContext;
use Bitrix\Bizproc\Public\Service\Storage\StorageReference;
use Bitrix\Bizproc\Public\Service\Storage\StorageReferenceGuard;
use Bitrix\BizprocDesigner\Internal\Entity\BlockTypeDetail;
use Bitrix\BizprocDesigner\Internal\Entity\DocumentDescription;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Cache\BlockDescriptionCache;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentBlock;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentSettingCollection;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Enum\GraphErrorCode;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Enum\RequestSource;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Error\GraphError;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Result\BlockSettingsResult;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Sanitizer\FrameStyleSanitizer;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\AgentBlockMetadataResolver;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\RestrictedSettingRegistry;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\StorageNodeClassifier;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\StorageNodeFingerprint;
use Bitrix\Main\DI\Exception\CircularDependencyException;
use Bitrix\Main\DI\Exception\ServiceNotFoundException;
use Bitrix\Main\ObjectNotFoundException;
use Bitrix\Main\Result;

final class AgentBlockValidator
{
	// Sanitary length caps, kept in sync with the tool input schema (SaveWorkflowTool::getInputSchema).
	private const TITLE_MAX_LENGTH = 255;
	private const DESCRIPTION_MAX_LENGTH = 1000;
	private const PRESET_ID_MAX_LENGTH = 255;

	/** Frame background/border colours the editor offers (FRAME_COLOR_NAMES in the chart extension). */
	private const ALLOWED_FRAME_COLOR_NAMES = ['grey', 'orange', 'green', 'blue', 'purple', 'pink'];

	/** Fields only a frame overlay carries, in the order the block resource declares them {@see validateFrame}. */
	private const FRAME_ONLY_FIELDS = ['memberBlockIds', 'frameColorName', 'frameContent'];

	private readonly BlockDescriptionCache $blockDescriptionCache;
	private readonly AgentBlockSettingsValidator $settingsValidator;
	private readonly AgentBlockMetadataResolver $metadataResolver;
	private readonly AgentComplexRulesValidator $complexRulesValidator;
	private readonly RequestSource $source;
	private readonly ?ValidationContext $context;
	private readonly StorageReferenceGuard $storageReferenceGuard;
	private readonly RestrictedSettingRegistry $restrictedSettings;
	private ?StorageAuthorizationContext $storageAuthorizationContext = null;
	private ?AgentBlock $validBlock = null;
	private ?BlockTypeDetail $validBlockDetail = null;
	private ?string $id = null;

	public function __construct(
		BlockDescriptionCache $blockDescriptionCache,
		?AgentBlockSettingsValidator $settingsValidator = null,
		?AgentBlockMetadataResolver $metadataResolver = null,
		?AgentComplexRulesValidator $complexRulesValidator = null,
		?ValidationContext $context = null,
		?StorageReferenceGuard $storageReferenceGuard = null,
		?RestrictedSettingRegistry $restrictedSettings = null,
	) {
		$this->blockDescriptionCache = $blockDescriptionCache;
		$this->settingsValidator = $settingsValidator ?? new AgentBlockSettingsValidator(context: $context);
		$this->context = $context;
		// Fail-closed like ValidationContext itself: no context at all means the least permissive source.
		$this->source = $context?->source ?? RequestSource::Marta;
		// Source-aware resolver: the reverse REST path keeps EXCLUDED activities so a system AI agent's own
		// nodes still resolve a system name.
		$this->metadataResolver = $metadataResolver ?? new AgentBlockMetadataResolver(source: $this->source);
		$this->storageReferenceGuard = $storageReferenceGuard ?? new StorageReferenceGuard();
		$this->restrictedSettings = $restrictedSettings ?? new RestrictedSettingRegistry();
		// The nested level is judged by the same barrier as this one, so it is handed the same context and the same
		// memoized registry rather than resolving restricted names of its own.
		$this->complexRulesValidator = $complexRulesValidator
			?? new AgentComplexRulesValidator($context, $this->restrictedSettings)
		;
	}

	public function validate(
		mixed $block,
		DocumentDescription $documentType,
		array $blackListIds = [],
		string $path = '',
	): Result
	{
		if (!is_array($block))
		{
			return (new Result())->addError(GraphError::at($path, "$path should be object"));
		}
		$this->validBlock = null;
		$this->validBlockDetail = null;
		$this->id = null;

		$id = $block['id'] ?? null;
		$title = $block['title'] ?? null;
		$description = $block['description'] ?? null;
		$presetId = $block['presetId'] ?? null;
		$type = $block['type'] ?? null;
		$settings = $block['settings'] ?? null;

		// The frame overlay is not an activity with ports/dialog, so it bypasses the catalog lookup entirely
		// and validates its own shape instead. Only the REST agent may build frames; for Marta this branch is
		// skipped and the frame falls through to validateType(), where it is rejected as an incorrect type.
		if ($this->source === RequestSource::Rest && FrameBlockMatcher::matches($type, $presetId))
		{
			$frameResult = $this->validateFrame($block, $id, $title, $type, $presetId, $path, $blackListIds);
			$this->id = $id;

			return $frameResult;
		}

		// An agent entry node declares an empty settings schema, so its settings bypass the schema check and are
		// carried through verbatim. Judged the same on every entry: the node is one and the same wherever it comes
		// from. The branch is entered on the type alone - whether that type applies to this document type is not
		// checked here, so the node is accepted in a template of any document type.
		if (AgentStartTriggerMatcher::matches($type))
		{
			$triggerResult = $this->validateVerbatimStartTrigger(
				$block,
				$documentType,
				$id,
				$title,
				$type,
				$presetId,
				$path,
				$blackListIds,
			);
			$this->id = $id;

			return $triggerResult;
		}

		$result = new Result();
		$result->addErrors($this->validateId($id, $path, $blackListIds)->getErrors());
		$result->addErrors($this->validateTitle($title, $path)->getErrors());
		$result->addErrors($this->validateDescription($description, $path)->getErrors());
		$result->addErrors($this->validatePresetId($presetId, $path)->getErrors());
		$typeValidationResult = $this->validateType($type, $path, $documentType, is_string($presetId) ? $presetId : null);
		$blockDetail = $typeValidationResult instanceof BlockSettingsResult ? $typeValidationResult->blockDetail : null;
		$result->addErrors($typeValidationResult->getErrors());
		if ($blockDetail !== null)
		{
			try
			{
				$result->addErrors($this->validateSystemName($type, $presetId, $path)->getErrors());
				if (is_string($type) && is_string($presetId) && $presetId !== '' && !$this->metadataResolver->hasPreset($type, $presetId))
				{
					$result->addError(GraphError::at(
						"{$path}.presetId",
						"{$path}.presetId is not a valid preset for this block type",
					));
				}
			}
			catch (ServiceNotFoundException | CircularDependencyException | ObjectNotFoundException)
			{
				$result->addError(GraphError::at(
					"{$path}.type",
					"{$path}.type block system name cannot be resolved (catalog unavailable)",
				));
			}
		}
		$settingValidationResult = $this->settingsValidator->validate(
			$settings,
			"$path.settings",
			$blockDetail,
			is_string($type) ? $type : null,
			// The very preset $blockDetail - and thus the option lists inside it - was resolved with, so the
			// carried-value passthrough of the option check can only unlock a value inside the variant that
			// carried it. Normalised as above: the empty preset is no preset.
			is_string($presetId) && $presetId !== '' ? $presetId : null,
		);
		$result->addErrors($settingValidationResult->getErrors());

		$validRules = null;
		if ($blockDetail !== null)
		{
			if ($blockDetail->complexDetail !== null)
			{
				$rulesValidationResult = $this->complexRulesValidator->validate(
					$block['rules'] ?? null,
					$blockDetail->complexDetail,
					"$path.rules",
					$documentType,
					is_string($type) ? $type : null,
				);
				$result->addErrors($rulesValidationResult->getErrors());
				$validRules = $this->complexRulesValidator->getValidRules();
			}
			elseif (array_key_exists('rules', $block) && $block['rules'] !== null)
			{
				$result->addError(GraphError::at("$path.rules", "$path.rules is only allowed for complex nodes"));
			}
		}

		// Same refusal as rules on a plain block, for the same reason: the overlay fields belong to a frame,
		// and dropping them without a word leaves the caller believing it grouped and annotated blocks that
		// stayed plain.
		foreach (self::FRAME_ONLY_FIELDS as $frameField)
		{
			if (array_key_exists($frameField, $block) && $block[$frameField] !== null)
			{
				$result->addError(GraphError::at(
					"$path.$frameField",
					"$path.$frameField is only allowed for frame blocks",
				));
			}
		}

		// A storage consumer is authorised against the published baseline once its type is known (ALG-02).
		// create/setuptemplate are out of scope here - AgentBlocksValidator checks them against the immutable
		// baseline instead, so a forged create carrying a token code cannot slip through the token branch.
		if ($blockDetail !== null && is_string($type) && StorageNodeClassifier::isConsumer($type))
		{
			$result->addErrors($this->authorizeStorageReference($type, $path)->getErrors());
		}

		if ($blockDetail !== null && is_string($type))
		{
			$result->addErrors(
				$this->authorizeRestrictedSettings(
					$type,
					$documentType,
					$this->settingsValidator->getValidSettings() ?? new AgentSettingCollection(),
					$path,
				)->getErrors(),
			);
		}

		if ($result->isSuccess() && $this->settingsValidator->getValidSettings())
		{
			$this->validBlock = new AgentBlock(
				$type,
				$title ?? '',
				$id,
				$this->settingsValidator->getValidSettings(),
				$description,
				is_string($presetId) && $presetId !== '' ? $presetId : null,
				$validRules,
			);
			$this->validBlockDetail = $blockDetail;
		}

		$this->id = $id;

		return $result;
	}

	/**
	 * Validates a frame overlay's own shape (id + styling allowlist), sanitises its free-text styling and
	 * builds the valid frame block. Membership (memberBlockIds) and member connectivity are delegated to
	 * {@see AgentFrameMembershipValidator}, which runs once over the whole graph in the workflow validator.
	 */
	private function validateFrame(
		array $block,
		mixed $id,
		mixed $title,
		mixed $type,
		mixed $presetId,
		string $path,
		array $blackListIds,
	): Result
	{
		$result = new Result();
		$result->addErrors($this->validateId($id, $path, $blackListIds)->getErrors());
		$result->addErrors($this->validateTitle($title, $path)->getErrors());

		$frameColorName = $block['frameColorName'] ?? null;
		$result->addErrors($this->validateFrameColorName($frameColorName, $path)->getErrors());

		$frameContent = $block['frameContent'] ?? null;
		$result->addErrors(
			$this->validateOptionalText($frameContent, "{$path}.frameContent", FrameStyleSanitizer::MAX_CONTENT_LENGTH)->getErrors(),
		);

		if ($result->isSuccess())
		{
			$this->validBlock = new AgentBlock(
				type: (string)$type,
				// The frontend escapes the title at render time, so encoding it here would double-escape it
				// and break round-trip idempotency.
				title: is_string($title) ? $title : '',
				id: (string)$id,
				settings: new AgentSettingCollection(),
				description: null,
				presetId: (string)$presetId,
				rules: null,
				returnProperties: [],
				memberBlockIds: $this->parseMemberBlockIds($block),
				frameColorName: is_string($frameColorName) ? $frameColorName : null,
				frameContent: is_string($frameContent) ? FrameStyleSanitizer::sanitizeContent($frameContent) : null,
			);
		}

		return $result;
	}

	/**
	 * Validates an agent entry node, whose settings schema is empty by design: the old-format template converter
	 * writes presentational settings (Icon, ColorIndex) onto every trigger, so a schema check would refuse them
	 * and cost the round-trip its idempotency. Hence the settings are carried through verbatim while the other
	 * fields keep the ordinary node's strictness, so nothing is silently dropped on save: presetId and rules are
	 * refused (no preset, no complex sub-graph), which template.get honours by emitting both as null. Verbatim is
	 * not unchecked either: a setting the activity itself declares restricted is held to the published baseline by
	 * the same barrier the ordinary path applies (ALG-04), so the empty schema buys no exemption from it.
	 *
	 * The node stays a connectable graph node (kept out of frameBlockIds, so its outgoing edge goes through the
	 * connections validator). Its catalog passport is looked up for the port topology alone; having none is a
	 * legal state that only keeps the node out of the ports map.
	 */
	private function validateVerbatimStartTrigger(
		array $block,
		DocumentDescription $documentType,
		mixed $id,
		mixed $title,
		mixed $type,
		mixed $presetId,
		string $path,
		array $blackListIds,
	): Result
	{
		$description = $block['description'] ?? null;

		$result = new Result();
		$result->addErrors($this->validateId($id, $path, $blackListIds)->getErrors());
		$result->addErrors($this->validateTitle($title, $path)->getErrors());
		$result->addErrors($this->validateDescription($description, $path)->getErrors());
		$result->addErrors($this->validatePresetId($presetId, $path)->getErrors());

		if (is_string($presetId) && $presetId !== '')
		{
			$result->addError(GraphError::at("{$path}.presetId", "{$path}.presetId is not a valid preset for this block type"));
		}

		if (array_key_exists('rules', $block) && $block['rules'] !== null)
		{
			$result->addError(GraphError::at("$path.rules", "$path.rules is only allowed for complex nodes"));
		}

		$settings = $this->collectPassthroughSettings($block['settings'] ?? null, "{$path}.settings", $result);
		$result->addErrors(
			$this->authorizeRestrictedSettings((string)$type, $documentType, $settings, $path)->getErrors(),
		);
		// The catalog is keyed by the lower-cased type while the matcher above takes the type in any case, so the
		// lookup normalises it. The block below keeps the type as it arrived - the server accepts back exactly what
		// it emitted.
		$blockDetail = $this->resolveBlockDetailOrNull(
			mb_strtolower((string)$type),
			$documentType,
			is_string($presetId) ? $presetId : null,
		);

		if ($result->isSuccess())
		{
			$this->validBlock = new AgentBlock(
				type: (string)$type,
				title: is_string($title) ? $title : '',
				id: (string)$id,
				settings: $settings,
				description: is_string($description) ? $description : null,
			);
			$this->validBlockDetail = $blockDetail;
		}

		return $result;
	}

	/**
	 * Resolves the catalog passport of a verbatim node, needed for its port topology alone. Having none - an
	 * unreachable catalog included - is a legal state rather than a validation error: the node simply stays out of
	 * the ports map, so a template the server itself emitted is never refused over a service the request cannot
	 * reach. The lookup itself is inside the try, unlike on the ordinary path, where the cache is consulted before
	 * the guarded block.
	 */
	private function resolveBlockDetailOrNull(
		string $type,
		DocumentDescription $documentType,
		?string $presetId = null,
	): ?BlockTypeDetail
	{
		try
		{
			return $this->blockDescriptionCache->get($type, $documentType, $presetId);
		}
		catch (ServiceNotFoundException | CircularDependencyException | ObjectNotFoundException)
		{
			return null;
		}
	}

	/**
	 * Builds the setting collection of a verbatim node: every setting is taken as it is, so nothing the template
	 * persisted is lost. Only the per-setting shape is checked - the empty schema of such a node declares no name
	 * to cross-check a setting against and no type to coerce its value to.
	 */
	private function collectPassthroughSettings(mixed $settings, string $path, Result $result): AgentSettingCollection
	{
		$collection = new AgentSettingCollection();
		if ($settings === null)
		{
			return $collection;
		}

		if (!is_array($settings))
		{
			$result->addError(GraphError::at($path, "{$path} should be array"));

			return $collection;
		}

		$settingValidator = new AgentBlockSettingValidator();
		foreach ($settings as $key => $rawSetting)
		{
			$settingResult = $settingValidator->validate($rawSetting, "{$path}.{$key}", null);
			$result->addErrors($settingResult->getErrors());

			$validSetting = $settingValidator->getValidSetting();
			if ($settingResult->isSuccess() && $validSetting !== null)
			{
				$collection->add($validSetting);
			}
		}

		return $collection;
	}

	private function validateFrameColorName(mixed $frameColorName, string $path): Result
	{
		if ($frameColorName === null)
		{
			return new Result();
		}

		$colorPath = "{$path}.frameColorName";

		if (!is_string($frameColorName))
		{
			return (new Result())->addError(GraphError::at($colorPath, "{$colorPath} should be string"));
		}

		if (!in_array($frameColorName, self::ALLOWED_FRAME_COLOR_NAMES, true))
		{
			// The allowed names are nowhere else in the contract - the frame carries an empty settings schema,
			// so the catalog has no field to publish them through - and the refusal is the only place a caller
			// can learn them.
			return (new Result())->addError(GraphError::at(
				$colorPath,
				"{$colorPath} is not an allowed frame colour. Allowed values: "
					. implode(', ', self::ALLOWED_FRAME_COLOR_NAMES),
			));
		}

		return new Result();
	}

	/**
	 * @return list<string>
	 */
	private function parseMemberBlockIds(array $block): array
	{
		$memberBlockIds = [];
		foreach ((array)($block['memberBlockIds'] ?? []) as $memberId)
		{
			if (is_string($memberId) || is_int($memberId))
			{
				$memberBlockIds[] = (string)$memberId;
			}
		}

		return $memberBlockIds;
	}

	private function validateId(mixed $id, string $path, array $blackListIds): Result
	{
		$idPath = "{$path}.id";

		if (!is_string($id) || $id === '')
		{
			return (new Result())->addError(GraphError::at($idPath, "{$idPath} should be not empty string"));
		}

		if (in_array($id, $blackListIds, true))
		{
			return (new Result())->addError(GraphError::at($idPath, "{$idPath} should be unique value"));
		}

		return new Result();
	}

	private function validateTitle(mixed $title, string $path): Result
	{
		return $this->validateOptionalText($title, "{$path}.title", self::TITLE_MAX_LENGTH);
	}

	private function validateDescription(mixed $description, string $path): Result
	{
		return $this->validateOptionalText($description, "{$path}.description", self::DESCRIPTION_MAX_LENGTH);
	}

	private function validatePresetId(mixed $presetId, string $path): Result
	{
		return $this->validateOptionalText($presetId, "{$path}.presetId", self::PRESET_ID_MAX_LENGTH);
	}

	private function validateOptionalText(mixed $value, string $path, int $maxLength): Result
	{
		if ($value === null)
		{
			return new Result();
		}

		if (!is_string($value))
		{
			return (new Result())->addError(GraphError::at($path, "{$path} should be string"));
		}

		if (mb_strlen($value) > $maxLength)
		{
			return (new Result())->addError(
				GraphError::at($path, "{$path} should be at most {$maxLength} characters"),
			);
		}

		return new Result();
	}

	private function validateType(
		mixed $type,
		string $path,
		DocumentDescription $documentType,
		?string $presetId = null,
	): Result|BlockSettingsResult
	{
		$typePath = "{$path}.type";

		if (!is_string($type) || $type === '')
		{
			return (new Result())->addError(GraphError::at($typePath, "{$typePath} should be not empty string"));
		}

		$blockDetail = $this->blockDescriptionCache->get($type, $documentType, $presetId);

		if ($blockDetail === null)
		{
			return (new Result())->addError(
				GraphError::at($typePath, "{$typePath} is incorrect type", GraphErrorCode::BlockTypeUnknown),
			);
		}

		return new BlockSettingsResult($blockDetail);
	}

	/**
	 * Authorises a storage consumer node against the published template baseline via the bizproc
	 * {@see StorageReferenceGuard} (ALG-02). The guard stays free of agent types, so the node fingerprint is
	 * computed here, where the graph shape is known, and operationKind is derived per node - the guard refuses a
	 * result data-view only when editing.
	 *
	 * The owned codes come from the enriched context the first pass of {@see AgentBlocksValidator} assembles
	 * (ALG-11), so a consumer of storage this very graph creates is authorised by origin instead of by shape.
	 */
	private function authorizeStorageReference(string $type, string $path): Result
	{
		$settings = $this->settingsValidator->getValidSettings() ?? new AgentSettingCollection();
		$operationKind = StorageNodeClassifier::resolveOperationKind($type, $settings);
		if ($operationKind === null)
		{
			return new Result();
		}

		$verdict = $this->storageReferenceGuard->authorizeReference(
			new StorageReference(
				storageCode: StorageNodeClassifier::extractStorageCode($settings),
				storageId: StorageNodeClassifier::extractStorageId($settings),
				fingerprint: StorageNodeFingerprint::of($type, $settings),
			),
			$operationKind,
			$this->getStorageAuthorizationContext(),
		);

		if (!$verdict->allowed)
		{
			return (new Result())->addError(
				GraphError::at("{$path}.settings", "{$path}.settings " . ($verdict->reason ?? 'storage reference is not allowed')),
			);
		}

		return new Result();
	}

	/**
	 * Assembled once per validator, like the guard it is passed to: every field it reads is readonly and settled at
	 * construction, so the same context answers for every node of the run and the verdict cannot depend on which
	 * node asked first. Its constructor indexes both code sets - a regexp per code - which a per-node instance
	 * would repeat for each of the 256 blocks an entry may carry.
	 */
	private function getStorageAuthorizationContext(): StorageAuthorizationContext
	{
		return $this->storageAuthorizationContext ??= new StorageAuthorizationContext(
			templateId: $this->context?->templateId ?? 0,
			baselineStaticNodeFingerprints: $this->context?->baselineStaticNodeFingerprints ?? [],
			baselineStorageCodes: $this->context?->baselineStorageCodes ?? [],
			ownedStorageCodes: $this->context?->ownedStorageCodes ?? [],
		);
	}

	/**
	 * Authorises the restricted passthrough settings of a node against the published baseline (ALG-04). A
	 * passthrough setting has no typed passport, so its value is otherwise taken verbatim; where that value is an
	 * executable payload - the ifelse branch condition whose class requires admin rights to author - the agent may
	 * only re-send what the published template already carries.
	 *
	 * The two halves of the rule part on whether there is a payload at all. A written value must match the baseline
	 * byte for byte, so a template with no published version refuses every one of them - it has nothing to carry
	 * over. An empty value ({@see RestrictedSettingRegistry::carriesNoPayload()}) is authorised on its own, because
	 * the baseline exists to vouch for a payload and here there is none: the dialog writes such a setting on every
	 * save whether or not a human filled it, so holding it to the published version would cost a node that lives
	 * only in the draft the whole graph over a setting that carries nothing.
	 *
	 * The settings are handed in rather than read off the settings validator, because the verbatim branch collects
	 * its own and must reach this barrier through the very same code the ordinary path does.
	 */
	private function authorizeRestrictedSettings(
		string $type,
		DocumentDescription $documentType,
		AgentSettingCollection $settings,
		string $path,
	): Result
	{
		$restrictedNames = $this->restrictedSettings->namesFor($type, $documentType);
		if ($restrictedNames === [])
		{
			return new Result();
		}

		$baseline = $this->context?->baselineRestrictedSettingFingerprints ?? [];
		$result = new Result();
		foreach ($settings as $setting)
		{
			if (!in_array(mb_strtolower($setting->name), $restrictedNames, true))
			{
				continue;
			}

			if (RestrictedSettingRegistry::carriesNoPayload($setting->value))
			{
				continue;
			}

			if (!isset($baseline[RestrictedSettingRegistry::fingerprintOf($setting->name, $setting->value)]))
			{
				$result->addError(GraphError::at(
					"{$path}.settings.{$setting->name}",
					"{$path}.settings.{$setting->name} must match the published template baseline"
					. ' (this setting carries an executable payload and can only be passed through unchanged)',
				));
			}
		}

		return $result;
	}

	/**
	 * Fail-closed guard: a block whose type validates must also have a resolvable, non-empty system name.
	 * That name becomes node.title in the draft converter (same source — ActivityDescription::getName()),
	 * so a nameless-but-otherwise-valid type must be rejected here instead of yielding an empty node title.
	 *
	 * Multi-preset activities carry their name on the preset, so the guard resolves with the supplied
	 * presetId: a preset block with a valid presetId passes, while the same type without a presetId (empty
	 * base name) is still rejected — the error hints that a presetId is required for such blocks.
	 *
	 * The one exemption is a nameless internal node ({@see NamelessInternalNodeMatcher}), whose system name is
	 * empty by design. It is granted by type, not by "any empty name", so a genuinely nameless (broken or
	 * obsolete) block still fails the guard.
	 */
	private function validateSystemName(mixed $type, mixed $presetId, string $path): Result
	{
		$normalizedPresetId = is_string($presetId) && $presetId !== '' ? $presetId : null;
		$systemName = is_string($type)
			? $this->metadataResolver->resolveSystemName($type, $normalizedPresetId)
			: '';
		if (trim($systemName) === '')
		{
			$typePath = "{$path}.type";

			// Marta never reaches here (the node is hidden from it), so the source check is defence in depth.
			if ($this->source === RequestSource::Rest && NamelessInternalNodeMatcher::matches($type))
			{
				return new Result();
			}

			$message = "{$typePath} block system name is not defined";
			if ($normalizedPresetId === null)
			{
				// The presetId hint only helps when none was supplied; with a bad presetId the
				// "not a valid preset" error already explains the failure, so the hint would mislead.
				$message .= ' (specify presetId for multi-preset blocks)';
			}

			return (new Result())->addError(GraphError::at($typePath, $message));
		}

		return new Result();
	}

	public function getValidBlock(): ?AgentBlock
	{
		return $this->validBlock;
	}

	public function getValidBlockDetail(): ?BlockTypeDetail
	{
		return $this->validBlockDetail;
	}

	public function getId(): mixed
	{
		return $this->id;
	}
}