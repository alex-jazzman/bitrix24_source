<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository;

use Slim\Http\StatusCode;
use Sotbit\RestAPI\Exception\UserException;
use Sotbit\RestAPI\Core;
use Bitrix\Main\UserTable;
use Bitrix\Main\Loader;
use Bitrix\Main\Type;
use Sotbit\RestAPI\Core\Helper;
use Sotbit\RestAPI\Localisation as l;

class UserRepository extends BaseRepository
{
    protected $allowedUserFields
        = [
            'main'     => [
                "ID",
                "LOGIN",
                "ACTIVE",
                "EMAIL",
                "NAME",
                "LAST_NAME",
                "SECOND_NAME",
                "PERSONAL_PHOTO",
            ],
            'groups'   => [],
            'personal' => [
                "PERSONAL_GENDER",
                "PERSONAL_PROFESSION",
                "PERSONAL_WWW",
                "PERSONAL_BIRTHDAY",
                "PERSONAL_ICQ",
                "PERSONAL_PHONE",
                "PERSONAL_FAX",
                "PERSONAL_MOBILE",
                "PERSONAL_PAGER",
                "PERSONAL_STREET",
                "PERSONAL_CITY",
                "PERSONAL_STATE",
                "PERSONAL_ZIP",
                "PERSONAL_COUNTRY",
            ],
            'job'      => [
                "WORK_COMPANY",
                "WORK_POSITION",
                "WORK_PHONE",
                //"UF_DEPARTMENT", "UF_INTERESTS", "UF_SKILLS", "UF_WEB_SITES", "UF_XING", "UF_LINKEDIN", "UF_FACEBOOK", "UF_TWITTER", "UF_SKYPE", "UF_DISTRICT", "UF_PHONE_INNER"
            ],
        ];


    /**
     * Get user info
     *
     * @param  int  $userId
     *
     * @return array
     * @throws \Bitrix\Main\LoaderException
     */
    public function get(int $userId): array
    {
        $result = [];

        // User table
        $getListClassName = '\Bitrix\Main\UserTable';
        if(Loader::includeModule('intranet')) {
            $getListClassName = '\Bitrix\Intranet\UserTable';
        }

        // Filter
        $filer = [];
        $filter['=IS_REAL_USER'] = 'Y';
        $filter['=ID'] = $userId;

        // GetList
        $dbRes = $getListClassName::getList(
            [
                'filter'        => $filter,
                'select'        => Helper::arrayValueRecursive($this->allowedUserFields),
                'limit'         => 1,
                'data_doubling' => false,
            ]
        );
        $user = $dbRes->fetch();

        if(empty($user)) {
            throw new UserException(l::get('ERROR_USER_NOT_FOUND'), 404);
        }

        // Personal photo
        if($user['PERSONAL_PHOTO']) {
            $user['PERSONAL_PHOTO'] = \CFile::GetPath($user['PERSONAL_PHOTO']);
        }
        // User country
        $user['PERSONAL_COUNTRY'] = $user['PERSONAL_COUNTRY'] ? GetCountryByID((int)$user['PERSONAL_COUNTRY']) : null;

        // Birthday format
        if($user['PERSONAL_BIRTHDAY'] && $user['PERSONAL_BIRTHDAY'] instanceof Type\Date) {
            $user['PERSONAL_BIRTHDAY'] = $user['PERSONAL_BIRTHDAY']->format(
                Type\Date::convertFormatToPhp(\CSite::GetDateFormat('SHORT'))
            );
        }

        // Gender format
        if($user['PERSONAL_GENDER']) {
            $user['PERSONAL_GENDER'] = $user['PERSONAL_GENDER'] === 'M' ? l::get('USER_MALE') : l::get('USER_FEMALE');
        } else {
            $user['PERSONAL_GENDER'] = l::get('USER_DONT_KNOW');
        }


        // Get groups
        $groups = $getListClassName::getUserGroupIds($user['ID']);

        foreach($this->allowedUserFields as $key => $val) {
            if($key === 'groups') {
                $result[$key] = $groups;
            } else {
                $result[$key] = array_intersect_key($user, array_flip(array_diff($val, [''])));
            }
        }


        return $result;
    }

    /**
     * Sign up
     *
     * @param  string  $login
     * @param  string  $password
     *
     * @return array
     */
    public function login(string $login, string $password): array
    {
        $select = [
            'ID',
            'LOGIN',
            'PASSWORD',
            'ACTIVE',
        ];
        $user = UserTable::getList(['select' => $select, 'filter' => ['=LOGIN' => $login], 'limit' => 1])->fetchRaw();

        if(empty($user) || !$this->isUserPassword($user['PASSWORD'], $password)) {
            throw new UserException(l::get('ERROR_AUTH_INCORRECT'), StatusCode::HTTP_BAD_REQUEST);
        }

        if($user['ACTIVE'] !== 'Y') {
            throw new UserException(l::get('ERROR_AUTH_USER_DEACTIVATED'), StatusCode::HTTP_BAD_REQUEST);
        }
        unset($user['ACTIVE']);

        return $user;
    }

    public function forgot(string $email): array
    {
        $user = $this->checkUserByEmail($email);

        return \CUser::SendPassword($user['LOGIN'], $user['EMAIL']);
    }


    /**
     * Check user by email
     *
     * @param  string  $email
     *
     * @throws UserException
     * @throws \Bitrix\Main\LoaderException
     */
    public function checkUserByEmail(string $email): array
    {
        // User table
        $getListClassName = '\Bitrix\Main\UserTable';
        if(Loader::includeModule('intranet')) {
            $getListClassName = '\Bitrix\Intranet\UserTable';
        }

        // Filter
        $filer = [];
        $filter['=IS_REAL_USER'] = 'Y';
        $filter['=EMAIL'] = $email;

        // GetList
        $dbRes = $getListClassName::getList(
            [
                'filter'        => $filter,
                'select'        => ['ID', 'LOGIN', 'EMAIL'],
                'limit'         => 1,
                'data_doubling' => false,
            ]
        );
        $user = $dbRes->fetch();

        if(!$user) {
            throw new UserException(l::get('ERROR_USER_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }

        return $user;
    }

    /**
     * Check user by login
     *
     * @param  string  $login
     *
     * @throws UserException
     */
    public function checkUserByLogin(string $login): array
    {
        // User table
        $getListClassName = '\Bitrix\Main\UserTable';
        if(Loader::includeModule('intranet')) {
            $getListClassName = '\Bitrix\Intranet\UserTable';
        }

        // Filter
        $filer = [];
        $filter['=IS_REAL_USER'] = 'Y';
        $filter['=EMAIL'] = $email;

        // GetList
        $dbRes = $getListClassName::getList(
            [
                'filter'        => $filter,
                'select'        => ['ID', 'LOGIN', 'EMAIL'],
                'limit'         => 1,
                'data_doubling' => false,
            ]
        );
        $user = $dbRes->fetch();

        if(!$user) {
            throw new UserException(l::get('ERROR_USER_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }

        return $user;
    }


    /**
     * Check user by Id
     *
     * @param  int  $id
     *
     * @throws UserException
     */
    public function checkUserById(int $id): array
    {
        // User table
        $getListClassName = '\Bitrix\Main\UserTable';
        if(Loader::includeModule('intranet')) {
            $getListClassName = '\Bitrix\Intranet\UserTable';
        }

        // Filter
        $filer = [];
        $filter['=IS_REAL_USER'] = 'Y';
        $filter['=ID'] = $id;

        // GetList
        $dbRes = $getListClassName::getList(
            [
                'filter'        => $filter,
                'select'        => ['ID', 'LOGIN', 'EMAIL'],
                'limit'         => 1,
                'data_doubling' => false,
            ]
        );
        $user = $dbRes->fetch();

        if(!$user) {
            throw new UserException(l::get('ERROR_USER_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }

        return $user;
    }

    public function getUserSid(int $id): string
    {
        $userInfo = $this->checkUserById($id);

        return $userInfo['EMAIL'] ? : $userInfo['LOGIN'];
    }

    public function isUserPassword(string $userPassword, string $inputPassword): bool
    {
        // v20.5.400
        // 2020-07-24
        if(class_exists('\Bitrix\Main\Security\Password')) {
            return \Bitrix\Main\Security\Password::equals($userPassword, $inputPassword);
        }

        // Old
        $salt = substr($userPassword, 0, (strlen($userPassword) - 32));
        $realPassword = substr($userPassword, -32);
        $inputPassword = md5($salt.$inputPassword);

        return ($inputPassword == $realPassword);
    }
}