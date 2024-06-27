<?

namespace MyWebstor\Hms\Integration\UI\EntitySelector;

use Bitrix\Iblock\EO_Section_Collection;
use Bitrix\Iblock\SectionTable;
use Bitrix\Main\Localization\Loc;
use Bitrix\UI\EntitySelector\BaseProvider;
use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\SearchQuery;
use Bitrix\UI\EntitySelector\Tab;

Loc::loadMessages(__FILE__);

class SectionProvider extends BaseProvider {
    protected const SECTION_ENTITY_ID = 'hms-section';
    protected const SECTION_TAB_ID = 'hms-sections';

    public function __construct(array $options = []) {
        parent::__construct();

        $this->options = $options;
    }

    public function isAvailable(): bool {
        return $GLOBALS['USER']->isAuthorized();
    }

    public function getItems(array $ids): array {
        return array();
    }

    public function getSelectedItems(array $ids): array {
        return array();
    }

    public function fillDialog(Dialog $dialog): void {
        $departments = static::getStructure();

        $this->fillSections($dialog, $departments);

        $dialog
            ->getEntity(static::SECTION_ENTITY_ID)
            ->setDynamicSearch(false);

        $dialog->addTab(new Tab([
            'id' => static::SECTION_TAB_ID,
            'title' => Loc::getMessage('HMS_ENTITY_SELECTOR_TAB_TITLE'),
            'header' => Loc::getMessage('HMS_ENTITY_SELECTOR_TAB_HEADER'),
            'itemMaxDepth' => 7,
        ]));
    }

    private function fillSections(Dialog $dialog, EO_Section_Collection $sections) {
        /** @var Item[] $parents */
        $parents = [];
        $parentIdList = [];
        foreach ($sections as $section) {
            $parentIdList[$section->getId()] = $section->getIblockSectionId();

            $availableInRecentTab = false;

            $item = new Item(array(
                'id' => $section->getId(),
                'entityId' => static::SECTION_ENTITY_ID,
                'title' => $section->getName(),
                'subtitle' => Loc::getMessage("HMS_ENTITY_SELECTOR_LEVEL", array(
                    "#LEVEL#" => $section->getDepthLevel()
                )),
                'tabs' => static::SECTION_TAB_ID,
                'availableInRecentTab' => $availableInRecentTab,
                'nodeOptions' => array(
                    'dynamic' => false,
                    'open' => false,
                ),
                'children' => array(
                    array(
                        'id' => $section->getId() . '_S',
                        'title' => $section->getName(),
                        'entityId' => static::SECTION_ENTITY_ID,
                        'nodeOptions' => array(
                            'title' => Loc::getMessage('HMS_ENTITY_SELECTOR_SELECT_ONLY_SECTION'),
                            'renderMode' => 'override',
                        ),
                    ),
                    array(
                        'id' => $section->getId() . '_F',
                        'title' => Loc::getMessage('HMS_ENTITY_SELECTOR_WITH_SUBSECTIONS', array(
                            '#NAME#' => $section->getName()
                        )),
                        'entityId' => static::SECTION_ENTITY_ID,
                        'nodeOptions' => array(
                            'title' => Loc::getMessage('HMS_ENTITY_SELECTOR_WITH_SUBSECTIONS_NODE'),
                            'renderMode' => 'override',
                        ),
                    )
                )
            ));

            $parentItem = $parents[$section->getIblockSectionId()] ?? null;
            if ($parentItem) {
                $parentItem->addChild($item);
            } else {
                $dialog->addItem($item);
            }

            $parents[$section->getId()] = $item;
        }
    }

    public function getChildren(Item $parentItem, Dialog $dialog): void {
        $parentId = (int)$parentItem->getId();
        $iblockId = $this->getOptions()['iblockId'];
        if ($iblockId <= 0) {
            return;
        }

        $department = \CIBlockSection::getList(
            [],
            [
                'ID' => $parentId,
                'IBLOCK_ID' => $iblockId,
                'ACTIVE' => 'Y',
            ],
            false,
            ['UF_HEAD']
        )->fetch();

        if (!$department) {
            return;
        }

        $departments = $this->getStructure(['parentId' => $parentId]);
        $this->fillSections($dialog, $departments);
    }

    public function doSearch(SearchQuery $searchQuery, Dialog $dialog): void {
        $departments = $this->getStructure([
            'searchQuery' => $searchQuery->getQuery()
        ]);

        $this->fillSections($dialog, $departments);
    }

    public function getStructure(array $options = []): EO_Section_Collection {
        $iblockId = $this->getOptions()['iblockId'];
        if ($iblockId <= 0) {
            return new EO_Section_Collection();
        }

        $filter = [
            '=IBLOCK_ID' => $iblockId,
            '=ACTIVE' => 'Y'
        ];

        if (!empty($options['searchQuery']) && is_string($options['searchQuery'])) {
            $filter['?NAME'] = $options['searchQuery'];
        }

        if (!empty($options['parentId']) && is_int($options['parentId'])) {
            $filter['=IBLOCK_SECTION_ID'] = $options['parentId'];
        }

        if (!empty($options['depthLevel']) && is_int($options['depthLevel'])) {
            $filter['<=DEPTH_LEVEL'] = $options['depthLevel'];
        }

        if (!empty($options['sectionsFilter']) && is_array($options['sectionsFilter'])) {
            $filter = array_merge($filter, $options['sectionsFilter']);
        }

        return SectionTable::getList([
            'select' => ['ID', 'NAME', 'DEPTH_LEVEL', 'IBLOCK_SECTION_ID', 'LEFT_MARGIN', 'RIGHT_MARGIN'],
            'filter' => $filter,
            'order' => ['LEFT_MARGIN' => 'asc'],
        ])->fetchCollection();
    }
}
