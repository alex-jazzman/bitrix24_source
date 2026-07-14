<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access\Model;

use Bitrix\Note\Internal\Access\Service\CollectionAccessService;

/**
 * Immutable lexical diff between two SUBJECT_CODE => LEVEL maps.
 *
 * Boundary is detected when membership crosses the VIEW threshold for any
 * potential subject: added or removed non-'*' subjects, '*' policy crossing
 * the LEVEL_NONE↔LEVEL_VIEW boundary, or any retained subject flipping
 * between LEVEL_NONE (deny) and a positive level (allow).
 *
 * Lexical means: we compare SUBJECT_CODE strings only — no group expansion,
 * no effective-level recompute. Cheap, deterministic, safe to run inside
 * an ACL-replace operation.
 */
final class CollectionAccessChange
{
	private const VIEW = CollectionAccessService::LEVEL_VIEW;
	private const NONE = CollectionAccessService::LEVEL_NONE;

	/** @var list<string> */
	public readonly array $addedSubjects;

	/** @var list<string> */
	public readonly array $removedSubjects;

	/** @var list<string> */
	public readonly array $denyFlippedSubjects;

	public readonly bool $policyCrossedView;

	/**
	 * @param array<string, int> $oldRows SUBJECT_CODE => LEVEL
	 * @param array<string, int> $newRows SUBJECT_CODE => LEVEL
	 */
	public static function lexical(array $oldRows, array $newRows): self
	{
		$oldSubjects = self::nonStarSubjects($oldRows);
		$newSubjects = self::nonStarSubjects($newRows);

		$added = array_values(array_diff($newSubjects, $oldSubjects));
		$removed = array_values(array_diff($oldSubjects, $newSubjects));
		sort($added);
		sort($removed);

		$retained = array_intersect($oldSubjects, $newSubjects);
		$denyFlipped = [];
		foreach ($retained as $subject)
		{
			$oldDeny = ((int)($oldRows[$subject] ?? self::NONE)) === self::NONE;
			$newDeny = ((int)($newRows[$subject] ?? self::NONE)) === self::NONE;
			if ($oldDeny !== $newDeny)
			{
				$denyFlipped[] = $subject;
			}
		}
		sort($denyFlipped);

		$oldPolicy = (int)($oldRows['*'] ?? self::NONE);
		$newPolicy = (int)($newRows['*'] ?? self::NONE);
		$policyCrossed = ($oldPolicy < self::VIEW) !== ($newPolicy < self::VIEW);

		return new self($added, $removed, $denyFlipped, $policyCrossed);
	}

	/**
	 * True when the change could move any subject across the VIEW threshold
	 * — receivers may have gained or lost visibility, /shared/ index must be
	 * refetched globally.
	 */
	public function maybeBoundary(): bool
	{
		return $this->policyCrossedView
			|| $this->addedSubjects !== []
			|| $this->removedSubjects !== []
			|| $this->denyFlippedSubjects !== [];
	}

	/**
	 * @param list<string> $addedSubjects
	 * @param list<string> $removedSubjects
	 * @param list<string> $denyFlippedSubjects
	 */
	private function __construct(
		array $addedSubjects,
		array $removedSubjects,
		array $denyFlippedSubjects,
		bool $policyCrossedView,
	)
	{
		$this->addedSubjects = $addedSubjects;
		$this->removedSubjects = $removedSubjects;
		$this->denyFlippedSubjects = $denyFlippedSubjects;
		$this->policyCrossedView = $policyCrossedView;
	}

	/**
	 * @param array<string, int> $rows
	 * @return list<string>
	 */
	private static function nonStarSubjects(array $rows): array
	{
		$subjects = [];
		foreach (array_keys($rows) as $code)
		{
			$code = (string)$code;
			if ($code !== '' && $code !== '*')
			{
				$subjects[] = $code;
			}
		}

		return $subjects;
	}
}
