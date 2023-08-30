<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository;

use Slim\Http\StatusCode;
use Sotbit\RestAPI\Exception\CatalogException,
    Sotbit\RestAPI\Repository\Catalog as _Catalog,
    Sotbit\RestAPI\Repository\Catalog\Product,
    Sotbit\RestAPI\Core,
    Sotbit\RestAPI\Config\Config,
    Sotbit\RestAPI\Localisation as l;

use Sotbit\RestAPI\Repository\UserRepository;

use Bitrix\Sale,
    Bitrix\Main\Entity,
    Bitrix\Main\Loader,
    Bitrix\Main\Type\DateTime;


class CatalogRepository extends BaseRepository
{
    protected $error = [];
    protected $userId;
    protected $permission;
    protected $user;


    /**
     * OrderRepository constructor.
     *
     * @throws \Bitrix\Main\LoaderException
     */
    public function __construct()
    {
        parent::__construct();
        if(!Loader::includeModule("sale")) {
            throw new CatalogException(l::get('ERROR_MODULE_SALE'), StatusCode::HTTP_BAD_REQUEST);
        }
        if(!Loader::includeModule("catalog")) {
            throw new CatalogException(l::get('ERROR_MODULE_CATALOG'), StatusCode::HTTP_BAD_REQUEST);
        }
        if(!Loader::includeModule("currency")) {
            throw new CatalogException(l::get('ERROR_MODULE_CURRENCY'), StatusCode::HTTP_BAD_REQUEST);
        }


        if(!Config::getInstance()->isCatalogActive()) {
            throw new CatalogException(l::get('ERROR_CATALOG_IS_ACTIVE'), StatusCode::HTTP_BAD_REQUEST);
        }

        $this->permission = new _Catalog\Permission();
        $this->user = new UserRepository();

    }

    /**
     * @return mixed
     */
    public function getUserId()
    {
        return $this->userId;
    }

    /**
     * @param  mixed  $userId
     */
    public function setUserId($userId)
    {
        $this->userId = $userId;

        return $this;
    }

    /**
     * @return mixed
     */
    public function getUserGroups()
    {
        $groups = $this->user->get($this->getUserId())['groups'];
        if(is_array($groups)) {
            return $groups;
        }

        return [];
    }



    public function getCatalog(int $iblockId, $userId)
    {
        // check permission
        $this->permission->user($userId)->section($iblockId, 0);

        $result = [];

        $catalog = new _Catalog\Catalog();
        $result = $catalog->setUserId($userId)->get($iblockId);

        return $result;
    }

    public function getCatalogList(array $params)
    {
        // check permission
        //$this->permission->user($params['user_id'])->section($iblockId, 0);

        $userId = $params['user_id'];

        // prepare params to catalog params
        $params = $this->prepareNavigationCatalog($params);

        $result = [];

        $catalog = new _Catalog\Catalog();
        $result = $catalog->setUserId($userId)->list($params);

        return $result;
    }


    public function getSection(int $iblockId, int $sectionId, int $userId)
    {
        // check permission
        $this->permission->user($userId)->section($iblockId, $sectionId);

        $section = new _Catalog\Section();

        return $section->setUserId($userId)->get($sectionId);
    }

    /**
     * https://dev.1c-bitrix.ru/api_help/iblock/classes/ciblocksection/getlist.php
     *
     * @param  array  $params
     *
     * @return array
     * @throws CatalogException
     */
    public function getSectionsList(array $params)
    {
        $userId = $params['user_id'];

        // prepare params to catalog params
        $params = $this->prepareNavigationCatalog($params);

        //$params['filter']['IBLOCK_ID'] = $params;


        // check permission
        $this->permission->user($userId)->section((int) $params['filter']['IBLOCK_ID'], 0);

        $section = new _Catalog\Section();

        return $section->setUserId($userId)->list($params);
    }

    /**
     * Product get
     *
     * @param  int  $id
     * @param  null  $userId
     *
     * @return array
     * @throws CatalogException
     */
    public function getProduct(int $iblockId, int $productId, int $userId) {
        // check permission
        //$this->permission->user($userId)->product($id);


        /**
         * if ((string)Main\Config\Option::get('catalog', 'enable_viewed_products') !== 'N')
        {
        // add record
        Catalog\CatalogViewedProductTable::refresh(
        $productID,
        CSaleBasket::GetBasketUserID(),
        $siteID,
        $parentID,
        $recommendationId
        );
        }
         */

        $product = new _Catalog\Product();

        return $product->setUserId($userId)->get($productId);

    }

    public function getProductsList(array $params) {
        $userId = $params['user_id'];

        /**
         * if ((string)Main\Config\Option::get('catalog', 'enable_viewed_products') !== 'N')
        {
        // add record
        Catalog\CatalogViewedProductTable::refresh(
        $productID,
        CSaleBasket::GetBasketUserID(),
        $siteID,
        $parentID,
        $recommendationId
        );
        }
         */

        // prepare params to catalog params
        $params = $this->prepareNavigationCatalogProducts($params);

        // check permission
        $this->permission->user($userId)->section((int) $params['filter']['IBLOCK_ID'], 0);



        $section = new _Catalog\Product();

        return $section->setUserId($userId)->list($params);
    }

    public function getFilter(array $params) {
        $userId = $params['user_id'];

        // prepare params to catalog params
        $params = $this->prepareNavigationCatalogProducts($params);

        // check permission
        $this->permission->user($userId)->section((int) $params['filter']['IBLOCK_ID'], 0);


        $section = new _Catalog\Filter();

        return $section->setUserId($userId)->select($params['select'])->filter($params['filter'])->execute();
    }

    /**
     * Get IBLOCK_ID by SECTION_ID
     *
     * @param  int  $sectionId
     *
     * @return int
     */
    protected function getIblockBySection(int $sectionId)
    {
        return (int) \CIBlockSection::GetList([], ['ID' => $sectionId], false, ['IBLOCK_ID'])->fetch()['IBLOCK_ID'];
    }


    /**
     * Prepare picture and etc
     *
     * @param  array  $array
     *
     * @return array
     */
    protected function prepareReturn(array $array, string $typeView = self::TYPE_LIST): array
    {
        $sizePreview = $this->getSizeImage($typeView);
        if($array) {
            // prepare picture
            if(is_numeric($array['PICTURE'])) {
                $array['PICTURE'] = $this->getPictureSrc((int) $array['PICTURE'], $sizePreview);
            }

            // prepare detail picture
            if(is_numeric($array['DETAIL_PICTURE'])) {
                $array['DETAIL_PICTURE'] = $this->getPictureSrc((int) $array['DETAIL_PICTURE'], $sizePreview);
            } else {
                $array['DETAIL_PICTURE']['ORIGINAL'] = $array['DETAIL_PICTURE']['RESIZE'] = Product::IMAGE_NOT_FOUND;
            }


            // prepare preview picture
            if(is_numeric($array['PREVIEW_PICTURE'])) {
                $array['PREVIEW_PICTURE'] = $this->getPictureSrc((int) $array['PREVIEW_PICTURE'], $sizePreview);
            } else {
                $array['PREVIEW_PICTURE']['ORIGINAL'] = $array['PREVIEW_PICTURE']['RESIZE'] = Product::IMAGE_NOT_FOUND;
            }
        }

        return $array;
    }


}
