<?php

declare(strict_types=1);

namespace Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Service;

use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentSetting;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentSettingCollection;

/**
 * Deterministic fingerprint of a storage node: a hash of its type and the canonical form of *all* its persisted
 * settings (ALG-01). The reverse pipeline compares an incoming node against the fingerprints of the published
 * baseline, so an unchanged round-trip node passes while any edited setting shifts the hash and is refused. Both
 * sides run this identical function, so the comparison stays symmetric.
 *
 * Canonical form: the type is lower-cased (an agent re-send may not be); settings are keyed by name and
	 * name-sorted; immutable nodes preserve their opaque settings verbatim, while mutable consumers use
	 * {@see AgentSettingValueCanonicalizer} to undo the typed USER/MAP normalizations the reverse validator applies
	 * only to the incoming side.
 */
final class StorageNodeFingerprint
{
	public static function of(string $type, AgentSettingCollection $settings): string
	{
		$canonical = [
			'type' => mb_strtolower($type),
			'settings' => self::canonicalizeSettings($type, $settings),
		];

		return hash('sha256', serialize($canonical));
	}

	/**
	 * A static storage reference is bound to the graph node that published it, not merely to an equal settings hash.
	 */
	public static function referenceOf(string $blockId, string $type, AgentSettingCollection $settings): string
	{
		return hash('sha256', serialize([$blockId, self::of($type, $settings)]));
	}

	/**
	 * @return array<string, mixed>
	 */
	private static function canonicalizeSettings(string $type, AgentSettingCollection $settings): array
	{
		$map = [];
		$normalizeTransport = !StorageNodeClassifier::isImmutable($type);
		foreach ($settings as $setting)
		{
			/** @var AgentSetting $setting */
			$map[$setting->name] = AgentSettingValueCanonicalizer::canonicalize(
				$setting->value,
				$normalizeTransport,
			);
		}
		ksort($map);

		return $map;
	}
}
