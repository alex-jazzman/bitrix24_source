<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Source\Wiki;

use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;

/**
 * Discovers wiki bases the importing user may read and resolves a collection id
 * back into the iblock/section context needed to read it.
 *
 * Every access decision is taken for an explicit $userId (never the global
 * current user), so the locator behaves identically in the preflight transport
 * context and in the background stepper agent.
 *
 * Two kinds of base exist:
 *   - group wiki — all groups share one iblock (option wiki.socnet_iblock_id);
 *     each group owns one root section, and its pages live in that subtree;
 *   - company/standalone wiki — its own iblock, recognised by the wiki-specific
 *     SECTION_PAGE_URL signature ("category:#EXTERNAL_ID#"). There is no global
 *     option pointing at it, so it is discovered by that signature.
 */
class WikiBaseLocator
{
	private const WIKI_IBLOCK_SIGNATURE = 'category:#EXTERNAL_ID#';

	private ?int $socnetIblockId = null;
	private ?string $moduleRight = null;

	public function __construct(private readonly int $userId)
	{
	}

	/**
	 * @return array<int, array{id: string, name: string}>
	 */
	public function listCollections(): array
	{
		if (!Loader::includeModule('iblock'))
		{
			return [];
		}

		return array_merge($this->listCompanyWikis(), $this->listGroupWikis());
	}

	/**
	 * Unique iblock ids of every wiki base the user may read. Used as an
	 * ownership allowlist when copying attachments: a file is only importable if
	 * it is an IMAGES attachment of a page inside one of these iblocks. Reuses
	 * the same access-checked discovery as listCollections(), so it never widens
	 * what the user can reach.
	 *
	 * @return int[]
	 */
	public function listAccessibleIblockIds(): array
	{
		$ids = [];
		foreach ($this->listCollections() as $collection)
		{
			$parsed = WikiId::parseCollectionId($collection['id']);
			if ($parsed !== null)
			{
				$ids[$parsed['iblockId']] = true;
			}
		}

		return array_map('intval', array_keys($ids));
	}

	/**
	 * Resolves a collection id into a read context. Returns null when the id is
	 * malformed, the base no longer exists or the user has lost access.
	 *
	 * @return array{
	 *     kind: string,
	 *     iblockId: int,
	 *     groupId: int|null,
	 *     rootSectionId: int|null,
	 *     left: int|null,
	 *     right: int|null
	 * }|null
	 */
	public function resolveContext(string $collectionId): ?array
	{
		$parsed = WikiId::parseCollectionId($collectionId);
		if ($parsed === null || !Loader::includeModule('iblock'))
		{
			return null;
		}

		if ($parsed['kind'] === 'company')
		{
			// Reject ids that point at a non-wiki iblock the user merely happens to
			// be able to read (lists, bizproc, catalog, ...). listCollections() only
			// ever exposes real wiki iblocks; resolveContext must agree, so the
			// transport cannot be driven past the bases shown in the UI.
			if (
				!$this->isWikiCompanyIblock($parsed['iblockId'])
				|| !$this->canReadCompanyIblock($parsed['iblockId'])
			)
			{
				return null;
			}

			return [
				'kind' => 'company',
				'iblockId' => $parsed['iblockId'],
				'groupId' => null,
				'rootSectionId' => null,
				'left' => null,
				'right' => null,
			];
		}

		$groupId = (int)$parsed['groupId'];
		if (!$this->canReadGroupWiki($groupId))
		{
			return null;
		}

		$root = $this->getGroupRootSection($parsed['iblockId'], $groupId);
		if ($root === null)
		{
			return null;
		}

		return [
			'kind' => 'group',
			'iblockId' => $parsed['iblockId'],
			'groupId' => $groupId,
			'rootSectionId' => (int)$root['ID'],
			'left' => (int)$root['LEFT_MARGIN'],
			'right' => (int)$root['RIGHT_MARGIN'],
		];
	}

	/**
	 * Builds the note ACL for a wiki base, expressed as Bitrix access codes so the
	 * import can apply it verbatim and the access stays "live" (membership changes
	 * are re-resolved by note on every permission check). Re-uses resolveContext,
	 * so it never widens beyond what the user may actually read.
	 *
	 * @return array{permissions: array<array{subjectCode: string, level: string}>, policyLevel: string}
	 */
	public function getCollectionAccess(string $collectionId): array
	{
		$empty = ['permissions' => [], 'policyLevel' => 'none'];

		$context = $this->resolveContext($collectionId);
		if ($context === null)
		{
			return $empty;
		}

		if ($context['kind'] === 'group')
		{
			return $this->buildGroupAccess((int)$context['groupId']);
		}

		return $this->buildCompanyAccess((int)$context['iblockId']);
	}

	/**
	 * Group wiki rights come from the socnet feature 'wiki', where every group
	 * member (role USER) already has write. So everyone who could edit the wiki can
	 * edit the collection (note MANAGE), and the group owner additionally
	 * administers it (note MODERATE).
	 *
	 * The whole group is granted with a single SG{id}_K -> manage code: every role
	 * (member/moderator/owner) carries SG{id}_K in their access codes, so one grant
	 * covers all members, and the collection-permissions popup can render and
	 * round-trip it as the group entity. The owner is granted as their own user
	 * code (U{ownerId} -> moderate) rather than the SG{id}_A role code, because the
	 * popup models a socnet group as a single entity and cannot display per-role
	 * group grants — a concrete user round-trips cleanly and shows the owner by name.
	 *
	 * @return array{permissions: array<array{subjectCode: string, level: string}>, policyLevel: string}
	 */
	private function buildGroupAccess(int $groupId): array
	{
		if ($groupId <= 0)
		{
			return ['permissions' => [], 'policyLevel' => 'none'];
		}

		$permissions = [
			['subjectCode' => 'SG' . $groupId . '_K', 'level' => 'manage'],
		];

		$ownerId = $this->getGroupOwnerId($groupId);
		if ($ownerId > 0)
		{
			$permissions[] = ['subjectCode' => 'U' . $ownerId, 'level' => 'moderate'];
		}

		return ['permissions' => $permissions, 'policyLevel' => 'none'];
	}

	private function getGroupOwnerId(int $groupId): int
	{
		if (!Loader::includeModule('socialnetwork'))
		{
			return 0;
		}

		$group = \CSocNetGroup::GetByID($groupId);

		return is_array($group) ? (int)($group['OWNER_ID'] ?? 0) : 0;
	}

	/**
	 * Company wiki rights = wiki module right AND iblock permission (see
	 * wiki/classes/general/wiki_utils.php). Per Bitrix group G{id}: the module
	 * right is treated as a coarse gate (must be >= R), and the per-base level
	 * comes from the iblock letter. The "all users" group (id 2) is expressed as
	 * the '*' fallback policy instead of a G2 grant.
	 *
	 * @return array{permissions: array<array{subjectCode: string, level: string}>, policyLevel: string}
	 */
	private function buildCompanyAccess(int $iblockId): array
	{
		$permissions = [];
		$policyLevel = 'none';

		foreach (\CIBlock::GetGroupPermissions($iblockId) as $groupId => $letter)
		{
			$groupId = (int)$groupId;
			if ($groupId <= 0 || !$this->groupHasWikiModuleAccess($groupId))
			{
				continue;
			}

			$level = $this->mapIblockLetterToLevel((string)$letter);
			if ($level === null)
			{
				continue;
			}

			if ($groupId === 2)
			{
				$policyLevel = $this->maxLevelCode($policyLevel, $level);
				continue;
			}

			$permissions[] = ['subjectCode' => 'G' . $groupId, 'level' => $level];
		}

		return ['permissions' => $permissions, 'policyLevel' => $policyLevel];
	}

	/**
	 * Maps an iblock permission letter (b_iblock_group.PERMISSION) to a note level,
	 * following the thresholds wiki_utils uses (>= R read, >= W write). Letters are
	 * ordered ascending (D < R < ... < W < X), so string comparison is correct.
	 * 'D' (denied) and empty yield null = no grant.
	 */
	private function mapIblockLetterToLevel(string $letter): ?string
	{
		if ($letter === '' || $letter < 'R')
		{
			return null;
		}
		if ($letter >= 'X')
		{
			return 'moderate';
		}
		if ($letter >= 'W')
		{
			return 'manage';
		}

		return 'view';
	}

	private function groupHasWikiModuleAccess(int $groupId): bool
	{
		global $APPLICATION;

		return (string)$APPLICATION->GetGroupRight('wiki', [$groupId]) >= 'R';
	}

	private function maxLevelCode(string $a, string $b): string
	{
		$rank = ['none' => 0, 'view' => 10, 'manage' => 30, 'moderate' => 40];

		return ($rank[$b] ?? 0) > ($rank[$a] ?? 0) ? $b : $a;
	}

	/**
	 * @return array<int, array{id: string, name: string}>
	 */
	private function listCompanyWikis(): array
	{
		$socnetIblockId = $this->getSocnetIblockId();
		$collections = [];

		$rs = \CIBlock::GetList(
			['SORT' => 'ASC'],
			['CHECK_PERMISSIONS' => 'N'],
		);
		while ($iblock = $rs->Fetch())
		{
			$iblockId = (int)$iblock['ID'];
			if ($iblockId === $socnetIblockId)
			{
				continue;
			}

			$sectionUrl = (string)($iblock['SECTION_PAGE_URL'] ?? '');
			if (!str_contains($sectionUrl, self::WIKI_IBLOCK_SIGNATURE))
			{
				continue;
			}

			if (!$this->canReadCompanyIblock($iblockId))
			{
				continue;
			}

			$collections[] = [
				'id' => WikiId::companyCollectionId($iblockId),
				'name' => (string)($iblock['NAME'] ?? ('Wiki #' . $iblockId)),
			];
		}

		return $collections;
	}

	/**
	 * @return array<int, array{id: string, name: string}>
	 */
	private function listGroupWikis(): array
	{
		$socnetIblockId = $this->getSocnetIblockId();
		if ($socnetIblockId <= 0 || !Loader::includeModule('socialnetwork'))
		{
			return [];
		}

		$collections = [];
		$rs = \CSocNetUserToGroup::GetList(
			['ID' => 'ASC'],
			[
				'USER_ID' => $this->userId,
				'<=ROLE' => SONET_ROLES_USER,
				'GROUP_ACTIVE' => 'Y',
			],
			false,
			false,
			['GROUP_ID', 'GROUP_NAME'],
		);
		while ($row = $rs->Fetch())
		{
			$groupId = (int)$row['GROUP_ID'];
			if ($groupId <= 0)
			{
				continue;
			}

			if (!$this->canReadGroupWiki($groupId))
			{
				continue;
			}

			// Only list groups that actually have a wiki root section (pages exist).
			if ($this->getGroupRootSection($socnetIblockId, $groupId) === null)
			{
				continue;
			}

			$name = (string)($row['GROUP_NAME'] ?? '');
			if ($name === '')
			{
				$group = \CSocNetGroup::GetByID($groupId);
				$name = is_array($group) ? (string)($group['NAME'] ?? '') : '';
			}

			$collections[] = [
				'id' => WikiId::groupCollectionId($groupId, $socnetIblockId),
				'name' => $name !== '' ? $name : ('Group #' . $groupId),
			];
		}

		return $collections;
	}

	private function canReadGroupWiki(int $groupId): bool
	{
		if (!Loader::includeModule('socialnetwork'))
		{
			return false;
		}

		if (!\CSocNetFeatures::IsActiveFeature(SONET_ENTITY_GROUP, $groupId, 'wiki'))
		{
			return false;
		}

		return \CSocNetFeaturesPerms::CanPerformOperation(
			$this->userId,
			SONET_ENTITY_GROUP,
			$groupId,
			'wiki',
			'view',
		);
	}

	private function canReadCompanyIblock(int $iblockId): bool
	{
		if ($this->getModuleRight() < 'R')
		{
			return false;
		}

		return \CIBlock::GetPermission($iblockId, $this->userId) >= 'R';
	}

	/**
	 * True when the iblock is a standalone/company wiki, recognised by the same
	 * SECTION_PAGE_URL signature used in listCompanyWikis(). The shared socnet
	 * iblock (group wikis) is explicitly not a company wiki.
	 */
	private function isWikiCompanyIblock(int $iblockId): bool
	{
		if ($iblockId <= 0 || $iblockId === $this->getSocnetIblockId())
		{
			return false;
		}

		$rs = \CIBlock::GetList([], ['ID' => $iblockId, 'CHECK_PERMISSIONS' => 'N']);
		$iblock = $rs->Fetch();
		if (!is_array($iblock))
		{
			return false;
		}

		return str_contains((string)($iblock['SECTION_PAGE_URL'] ?? ''), self::WIKI_IBLOCK_SIGNATURE);
	}

	/**
	 * @return array{ID: int, LEFT_MARGIN: int, RIGHT_MARGIN: int}|null
	 */
	private function getGroupRootSection(int $iblockId, int $groupId): ?array
	{
		$rs = \CIBlockSection::GetList(
			[],
			[
				'IBLOCK_ID' => $iblockId,
				'SOCNET_GROUP_ID' => $groupId,
				'CHECK_PERMISSIONS' => 'N',
			],
			false,
			['ID', 'LEFT_MARGIN', 'RIGHT_MARGIN'],
		);
		$section = $rs->Fetch();

		return is_array($section) ? $section : null;
	}

	private function getSocnetIblockId(): int
	{
		if ($this->socnetIblockId === null)
		{
			$this->socnetIblockId = (int)Option::get('wiki', 'socnet_iblock_id', '0');
		}

		return $this->socnetIblockId;
	}

	private function getModuleRight(): string
	{
		if ($this->moduleRight === null)
		{
			global $APPLICATION;
			$groups = \CUser::GetUserGroup($this->userId);
			$this->moduleRight = (string)$APPLICATION->GetGroupRight('wiki', $groups);
		}

		return $this->moduleRight;
	}
}
