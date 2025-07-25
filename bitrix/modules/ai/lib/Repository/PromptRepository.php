<?php declare(strict_types=1);

namespace Bitrix\AI\Repository;

use Bitrix\AI\BaseRepository;
use Bitrix\AI\Model\PromptCategoryTable;
use Bitrix\AI\Model\PromptTable;
use Bitrix\AI\Model\PromptTranslateNameTable;
use Bitrix\Main\ORM\Fields\Relations\Reference;
use Bitrix\Main\ORM\Query\Join;
use Bitrix\AI\Model\EO_Prompt_Collection;

class PromptRepository extends BaseRepository
{
	public function getPromptsByRoleCodes(string $category, array $roleCodes, string $lang): array
	{
		return PromptTable::query()
			->setSelect([
				'ID',
				'SORT',
				'CODE',
				'TYPE',
				'TEXT_TRANSLATES',
				'CODE',
				'IS_NEW',
				'TITLE_DEFAULT' => 'DEFAULT_TITLE',
				'TITLE_FOR_USER' => 'PROMPT_TRANSLATE_NAME_USER.TEXT',
			])
			->registerRuntimeField(
				new Reference(
					'PROMPT_CATEGORY_INNER_JOIN',
					PromptCategoryTable::class,
					Join::on('this.ID', 'ref.PROMPT_ID')
						->where('ref.CODE', $category),
					['join_type' => Join::TYPE_INNER]
				)
			)
			->registerRuntimeField(
				new Reference(
					'PROMPT_TRANSLATE_NAME_USER',
					PromptTranslateNameTable::class,
					Join::on('this.ID', 'ref.PROMPT_ID')
						->where('ref.LANG', $lang),
					['join_type' => Join::TYPE_LEFT]
				)
			)
			->whereIn('ROLES.CODE', $roleCodes)
			->setGroup([
				'ID', 'IS_NEW', 'SORT', 'PROMPT_TRANSLATE_NAME_USER.TEXT'
			])
			->setOrder([
				'SORT' => 'ASC'
			])
			->fetchAll()
		;
	}

	public function getRoleCodesForPromptIds(array $promptIds): EO_Prompt_Collection
	{
		return PromptTable::query()
			->setSelect([
				'ID',
				'ROLES.CODE'
			])
			->whereIn('ID', $promptIds)
			->fetchCollection();
	}
}