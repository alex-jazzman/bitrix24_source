<?php

declare(strict_types=1);

namespace Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Validator;

use Bitrix\BizprocDesigner\Internal\Entity\DocumentDescription;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Enum\RequestSource;

/**
 * Reverse-validation context threaded through SaveWorkflowValidator -> AgentBlocksValidator -> AgentBlockValidator
 * (TPL-02). Assembled once per request by {@see \Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\ValidationContextFactory}
 * on every entry (REST validate/push and Marta), so validate == push == Marta. The storage baselines come from
 * the *published* bound template (never the agent draft), so a forged storage node cannot anchor itself. So does
 * every other barrier here; the one reading taken from the graph the agent was handed is the option-list
 * passthrough, which is a help to the agent and not a barrier ({@see self::$draftOptionValues}).
 *
 * The subject (userId, isUserAdmin) arrives already resolved from the calling entry; the factory never re-resolves
 * it from CurrentUser, because on the Marta entry the ambient subject is not guaranteed to equal the authorized
 * one. operationKind is deliberately absent: it is per-node and resolved at the guard call site.
 */
final class ValidationContext
{
	/**
	 * Bytes of a value the key still carries as it is. The check itself judges codes - a field code, a funnel id,
	 * an enum id - and those are tens of bytes, so the bound is chosen well above the longest of them. What it
	 * catches is the other kind of value: the map is collected for every setting of the template rather
	 * than for the described ones alone, so the system prompt of an AI activity lands in it too - 23 611
	 * characters at its longest measured, the figure {@see GraphLimitsValidator::MAX_SETTING_VALUE_LENGTH} is
	 * set against.
	 */
	private const MAX_INLINE_VALUE_LENGTH = 128;

	private const INLINE_VALUE_MARK = '=';
	private const DIGESTED_VALUE_MARK = '#';

	/**
	 * Marks of the document-type part, kept apart the way the two value forms are: the level whose option list is
	 * built for the document type of the whole request writes one byte, a level that names a document type of its
	 * own writes the other. So a named type can never spell the part of the request's own type, whatever bytes it
	 * holds.
	 */
	private const OWN_DOCUMENT_TYPE_MARK = '*';
	private const NAMED_DOCUMENT_TYPE_MARK = '@';

	/** Not promoted: the constructor derives it when the assembler of the context leaves it unsaid. */
	public readonly bool $hasPublishedBaseline;

	/**
	 * @param RequestSource $source origin of the write; fail-closed by default like on the read side, so a context
	 *        assembled without an explicit source cannot widen REST-only visibility. The validators mirror this
	 *        default for the case of no context at all.
	 * @param array<string, true> $baselineImmutableFingerprints create/setuptemplate node fingerprints
	 * @param array<string, true> $baselineStaticNodeFingerprints static read/write/delete consumer fingerprints
	 * @param list<string> $baselineStorageCodes storage codes the published template declares, as written; the
	 *        guard authorises a token code only against them (a token alone proves no ownership)
	 * @param array<string, true> $baselineRestrictedSettingFingerprints (name, value) fingerprints of the
	 *        published template's restricted passthrough settings - the executable payloads an agent may carry
	 *        through but never author (ALG-04)
	 * @param list<string> $baselineCreatorStorageCodes codes the published template's CREATE nodes declare, as
	 *        written. Kept apart from baselineStorageCodes on purpose: that set also holds the token codes of
	 *        published consumers, whose storage the template may only ever have read, while this one answers
	 *        "the template owns this code" - the sole inheritance criterion of the admission policy (ALG-10)
	 * @param list<string> $ownedStorageCodes codes this template creates for the graph under validation - the
	 *        baseline creators plus the create nodes the policy admitted. Filled by the first pass of
	 *        {@see AgentBlocksValidator} (ALG-11), never by the factory, whose subject is the published version
	 * @param array<string, array> $baselineConstants constants the published template declares, keyed by code
	 *        (ALG-01 `baselineConstants`; its keys are the wider ownership set `baselineTemplateCodes`, against
	 *        which a code is judged taken). Declaring a code proves the constant exists, nothing more: a code
	 *        declared outside the setup wizard gives the wizard no right to redefine it
	 * @param list<string>|null $baselineWizardCodes codes of the constant items the setup-wizard nodes of the
	 *        published template declare (ALG-01 `baselineWizardCodes`) - the narrow set, and the sole criterion
	 *        by which a constant counts as inherited. null means the baseline wizard form could not be read at
	 *        all, which is a refusal of its own and never an empty set: read as "declares nothing", an inherited
	 *        constant would take the branch of a new one, hit its own code as taken, and the agent - which is
	 *        given no deletion - would answer by changing the code and duplicating what it meant to edit
	 * @param list<string> $draftWizardCodes codes of the wizard-authored constants the bound draft has already
	 *        accumulated. The draft is where a reverse write merges what a graph declares, and that merge never
	 *        removes a code, so without this set the declaration ceiling would measure a template that keeps
	 *        growing against the published version alone. Counted against that ceiling and used for nothing else:
	 *        the draft authorises no edit - it would let the graph under validation vouch for itself - it only
	 *        says how much the write it feeds has already grown
	 * @param bool|null $hasPublishedBaseline whether the template has a published version at all, as the assembler
	 *        of the context knows it. Told apart from the two baseline constant sets on purpose: a published
	 *        template that has not declared a single constant yet leaves both of them empty while being a baseline,
	 *        and reading that state off their emptiness would refuse the very edit the wizard admission exists for -
	 *        adding a wizard to a template that had none. null is "the assembler did not say": the flag then falls
	 *        back to that coarse reading, so a context built by hand keeps the verdict it had before the flag
	 * @param array<string, true> $baselineBlockTypes block types the published template is built of, keyed
	 *        lowercase. The reverse path lifts the EXCLUDED barrier of a reverse-visible CLASS against this set,
	 *        so a switched-off block the template already published reads back while a newly authored one does
	 *        not. Coarser than a fingerprint on purpose: an agent edits the settings of the nodes it carries
	 *        through, and anchoring the barrier per node would cost every such edit its round-trip
	 * @param array<string, true> $baselineVerbatimStartTriggerReferences exact published instances of the two agent
	 *        start triggers. Their settings are intentionally untyped, hence a type-only admission would let an agent
	 *        add, copy or alter one under the verbatim exception.
	 * @param array<string, true> $baselineStaticNodeReferences published static storage consumers keyed by their
	 *        block identity and full storage fingerprint. The storage guard authorises the sensitive reference; this
	 *        companion map keeps an authorised fingerprint from being copied or rebound to another node id.
	 * @param array<string, true> $baselineRestrictedSettingReferences executable passthrough settings keyed by their
	 *        stable top-level or nested location, activity type, name and value. The value-only baseline remains for
	 *        the local validator; this map closes cross-node reuse and duplication in the graph pass.
	 * @param array<string, true> $baselineOptionValues (block type, preset, document type, setting name, value)
	 *        tuples the published template already carries. An option list is a snapshot of the portal - a deleted
	 *        custom field or funnel drops out of it while the code stays written in the template - so a value already
	 *        published is let through the option check and only a NEW value is held to the current list. Every part
	 *        of the key is a part the list is built from
	 *        ({@see \Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\BlockDescriptionService},
	 *        {@see \Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\ComplexBlockDetailFactory::describeSubAction()}):
	 *        without the preset a funnel id published in the deal variant of a trigger would unlock the same id in
	 *        the lead variant of the same trigger, and without the document type a status published in the sub-step
	 *        of a deal complex node would unlock it in the sub-step of a lead one. Keyed by neither node id nor node
	 *        position on purpose: the agent may rebuild the graph and renumber its nodes, while a node keeps its
	 *        preset and its document type through that rebuild, so anchoring the passthrough per node would cost an
	 *        untouched setting its round-trip
	 * @param array<string, true> $draftOptionValues the tuples of the graph the agent was actually HANDED - the bound
	 *        draft whenever the template has one ({@see \Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\AgentWorkflowResolverService::getAgentTemplate()}) -
	 *        that {@see self::$baselineOptionValues} does not already carry: the two are joined by
	 *        {@see self::hasCarriedOptionValue()}, so this map means "carried by the draft and by the published
	 *        version not", and a tuple in both would be held twice for one answer. Read by the option check alone
	 *        and by no barrier: a value the user saved into the draft and the portal has since dropped from its list
	 *        would otherwise make the graph the agent was given unreturnable, since the check judges every element
	 *        of a multiple setting. This is not a second security baseline and must not become one - the
	 *        restricted-setting barrier (ALG-04), the storage baselines and the block-type baseline stay on the
	 *        published version, or the agent would author a payload into the draft and then collect its
	 *        authorisation. The option list is a help to the agent rather than a barrier, and a value can only reach
	 *        the draft by passing this very check or by the hand of the user
	 */
	public function __construct(
		public readonly DocumentDescription $documentType,
		public readonly ?int $templateId,
		public readonly RequestSource $source = RequestSource::Marta,
		public readonly int $userId = 0,
		public readonly bool $isUserAdmin = false,
		public readonly array $baselineImmutableFingerprints = [],
		public readonly array $baselineStaticNodeFingerprints = [],
		public readonly array $baselineStorageCodes = [],
		public readonly array $baselineRestrictedSettingFingerprints = [],
		public readonly array $baselineCreatorStorageCodes = [],
		public readonly array $ownedStorageCodes = [],
		public readonly array $baselineConstants = [],
		public readonly ?array $baselineWizardCodes = [],
		public readonly array $draftWizardCodes = [],
		?bool $hasPublishedBaseline = null,
		public readonly array $baselineBlockTypes = [],
		public readonly array $baselineVerbatimStartTriggerReferences = [],
		public readonly array $baselineStaticNodeReferences = [],
		public readonly array $baselineRestrictedSettingReferences = [],
		public readonly array $baselineOptionValues = [],
		public readonly array $draftOptionValues = [],
	)
	{
		$this->hasPublishedBaseline = $hasPublishedBaseline
			?? ($baselineConstants !== [] || $baselineWizardCodes !== [])
		;
	}

	/**
	 * @param list<string> $codes
	 */
	public function withOwnedStorageCodes(array $codes): self
	{
		return new self(
			documentType: $this->documentType,
			templateId: $this->templateId,
			source: $this->source,
			userId: $this->userId,
			isUserAdmin: $this->isUserAdmin,
			baselineImmutableFingerprints: $this->baselineImmutableFingerprints,
			baselineStaticNodeFingerprints: $this->baselineStaticNodeFingerprints,
			baselineStorageCodes: $this->baselineStorageCodes,
			baselineRestrictedSettingFingerprints: $this->baselineRestrictedSettingFingerprints,
			baselineCreatorStorageCodes: $this->baselineCreatorStorageCodes,
			ownedStorageCodes: $codes,
			baselineConstants: $this->baselineConstants,
			baselineWizardCodes: $this->baselineWizardCodes,
			draftWizardCodes: $this->draftWizardCodes,
			hasPublishedBaseline: $this->hasPublishedBaseline,
			baselineBlockTypes: $this->baselineBlockTypes,
			baselineVerbatimStartTriggerReferences: $this->baselineVerbatimStartTriggerReferences,
			baselineStaticNodeReferences: $this->baselineStaticNodeReferences,
			baselineRestrictedSettingReferences: $this->baselineRestrictedSettingReferences,
			baselineOptionValues: $this->baselineOptionValues,
			draftOptionValues: $this->draftOptionValues,
		);
	}

	/**
	 * Whether the template the agent was handed already carries this value for this setting of this block type,
	 * under this preset and this document type - the published version or the bound draft alike
	 * ({@see self::$draftOptionValues} for why the draft counts here and nowhere else).
	 *
	 * The single account of the key, so the collection in
	 * {@see \Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\ValidationContextFactory} and the
	 * lookup in {@see AgentSettingValueValidator} cannot drift apart.
	 *
	 * @param array|null $documentType the document type the option list was built for; null for a level built for
	 *        the document type of the request itself ({@see self::optionValueFingerprint()})
	 */
	public function hasCarriedOptionValue(
		string $blockType,
		?string $presetId,
		string $settingName,
		string $value,
		?array $documentType = null,
	): bool
	{
		$fingerprint = self::optionValueFingerprint($blockType, $presetId, $settingName, $value, $documentType);

		return isset($this->baselineOptionValues[$fingerprint])
			|| isset($this->draftOptionValues[$fingerprint])
		;
	}

	/**
	 * The key never leaves the request - it is an array key of {@see self::$baselineOptionValues} and nothing
	 * else - so it has to separate tuples, not resist anyone, and a hash over a serialize costs both on every
	 * element of every published value. Each part is written with its own length in front, so the key of one
	 * tuple cannot spell the key of another whatever bytes a block type, a preset, a setting name or a value hold.
	 *
	 * The block type and the setting name are matched without regard to case, because both are resolved that way.
	 * The preset rides verbatim, because it is not: the catalog holds it under an exact key
	 * ({@see \Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\AgentBlockMetadataResolver::hasPreset()},
	 * {@see \Bitrix\Bizproc\Activity\ActivityDescription::getPresetById()}), so a case variant is a different
	 * preset - and a block carrying one is refused before this check ever runs. No preset and the empty preset are
	 * the same key, exactly as they are the same (empty) option list.
	 *
	 * $documentType is the third half of what the list is built from, and it is not the same answer at every level.
	 * A block of the graph is described for the document type of the edited template, one and the same for every
	 * block of the request, so it names none and the part carries {@see self::OWN_DOCUMENT_TYPE_MARK}: the whole map
	 * belongs to one request and one template. The sub-step of a complex node is described for the EFFECTIVE
	 * document type of its host node instead - the type the host class fixes, the template's when it fixes none
	 * ({@see \Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\ComplexBlockDetailFactory::describeSubAction()},
	 * {@see \Bitrix\BizprocDesigner\Internal\Service\Activity\NodeFilterAvailability::resolveEffectiveDocumentType()}) -
	 * and one template may well hold complex nodes of two different fixed types, the same sub-step under both. So
	 * that level names its type, and the deal variant of a sub-step unlocks nothing in the lead one.
	 *
	 * The value is the one part that has no length written for it, because it is last and nothing follows it -
	 * and that is what let a long text be carried whole: the map then cost a second copy of every setting of the
	 * published template, megabytes rather than kilobytes where those settings are texts. Past
	 * {@see self::MAX_INLINE_VALUE_LENGTH} the value rides as a digest instead ({@see self::valueTail()}).
	 */
	public static function optionValueFingerprint(
		string $blockType,
		?string $presetId,
		string $settingName,
		string $value,
		?array $documentType = null,
	): string
	{
		$type = mb_strtolower($blockType);
		$preset = $presetId ?? '';
		$name = mb_strtolower($settingName);
		$document = self::documentTypePart($documentType);

		return strlen($type) . ':' . $type
			. '|' . strlen($preset) . ':' . $preset
			. '|' . strlen($document) . ':' . $document
			. '|' . strlen($name) . ':' . $name
			. '|' . self::valueTail($value)
		;
	}

	/**
	 * The document-type part, marked by which of the two answers it is. A named type is written element by element
	 * with the length of each in front, so a type of two elements cannot spell one of three however its elements
	 * are cut, and it rides verbatim: a document type is matched exactly everywhere else it is used
	 * ({@see \Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service\RestrictedSettingRegistry::namesFor()},
	 * {@see \CBPRuntime::searchActivitiesByType()}).
	 */
	private static function documentTypePart(?array $documentType): string
	{
		if ($documentType === null)
		{
			return self::OWN_DOCUMENT_TYPE_MARK;
		}

		$part = self::NAMED_DOCUMENT_TYPE_MARK;
		foreach ($documentType as $element)
		{
			$element = is_scalar($element) ? (string)$element : '';
			$part .= strlen($element) . ':' . $element . ',';
		}

		return $part;
	}

	/**
	 * The tail of the key, marked by which of the two forms it is in. The marks are what keeps the two forms
	 * apart: every digested tail starts with one byte, every carried one with the other, so no value can be
	 * written in a way that spells the tail of a different value - a value shaped like a digest is short and
	 * therefore carried, mark and all.
	 *
	 * A crafted digest collision is not guarded against, and does not need to be: the option list is a help to
	 * the agent rather than a barrier, and the same value passes the check anyway on a block sent without a
	 * presetId, where the list is empty.
	 */
	private static function valueTail(string $value): string
	{
		return strlen($value) > self::MAX_INLINE_VALUE_LENGTH
			? self::DIGESTED_VALUE_MARK . md5($value)
			: self::INLINE_VALUE_MARK . $value
		;
	}
}
