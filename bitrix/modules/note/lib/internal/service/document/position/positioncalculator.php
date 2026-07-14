<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Document\Position;

final class PositionCalculator
{
	public const POSITION_GAP = 1000;

	/**
	 * @param int $maxPosition
	 * @return int
	 */
	public function calculateNextPosition(int $maxPosition): int
	{
		return max(0, $maxPosition) + self::POSITION_GAP;
	}

	/**
	 * @param int $index
	 * @return int
	 */
	public function calculateSequentialPosition(int $index): int
	{
		return self::POSITION_GAP * ($index + 1);
	}

	/**
	 * @param int[] $descPositions Positions sorted DESC (highest first).
	 */
	public function calculateGapPosition(array $descPositions, ?int $targetPosition): ?int
	{
		$count = count($descPositions);
		if ($count === 0)
		{
			return self::POSITION_GAP;
		}

		$normalizedTarget = $this->normalizePosition($targetPosition, $count + 1);
		$insertIndex = $normalizedTarget - 1;

		if ($insertIndex <= 0)
		{
			return (int)$descPositions[0] + self::POSITION_GAP;
		}

		if ($insertIndex >= $count)
		{
			$lastPosition = (int)$descPositions[$count - 1];
			$newPosition = (int)floor($lastPosition / 2);

			return $newPosition > 0 ? $newPosition : null;
		}

		$higherPosition = (int)$descPositions[$insertIndex - 1];
		$lowerPosition = (int)$descPositions[$insertIndex];
		$middlePosition = (int)floor(($higherPosition + $lowerPosition) / 2);

		return ($middlePosition >= $higherPosition || $middlePosition <= $lowerPosition) ? null : $middlePosition;
	}

	/**
	 * @param int|null $position
	 * @param int $maxPosition
	 * @return int
	 */
	public function normalizePosition(?int $position, int $maxPosition): int
	{
		$maxPosition = max(1, $maxPosition);
		if ($position === null)
		{
			return $maxPosition;
		}

		return max(1, min($position, $maxPosition));
	}
}
