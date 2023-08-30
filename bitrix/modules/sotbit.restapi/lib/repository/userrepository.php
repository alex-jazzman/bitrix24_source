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
use Slim\Http\UploadedFile;

class UserRepository extends BaseRepository
{
    public const FIELD_MAIN
        = [
            //"ID",
            'TITLE'             => 'string',
            'NAME'              => 'string',
            'LAST_NAME'         => 'string',
            'SECOND_NAME'       => 'string',
            'EMAIL'             => 'string',
            'LOGIN'             => 'string',
            'PERSONAL_PHOTO'    => 'file',
            'PASSWORD'          => 'password',
            'PASSWORD_CONFIRM'  => 'password'
        ];

    public const FIELD_PERSONAL
        = [
            "PERSONAL_GENDER"     => 'enumeration',
            "PERSONAL_PROFESSION" => 'string',
            "PERSONAL_WWW"        => 'string',
            "PERSONAL_BIRTHDAY"   => 'date',
            "PERSONAL_PHONE"      => 'string',
            "PERSONAL_FAX"        => 'string',
            "PERSONAL_MOBILE"     => 'string',
            "PERSONAL_STREET"     => 'string',
            "PERSONAL_CITY"       => 'string',
            "PERSONAL_STATE"      => 'string',
            "PERSONAL_ZIP"        => 'string',
            "PERSONAL_COUNTRY"    => 'select',
            "PERSONAL_NOTES"      => 'string',
            "PERSONAL_MAILBOX"    => 'string',
        ];

    public const FIELD_WORK
        = [
            "WORK_COMPANY"    => 'string',
            "WORK_DEPARTMENT" => 'string',
            "WORK_POSITION"   => 'string',
            "WORK_WWW"        => 'string',
            "WORK_PROFILE"    => 'string',
            "WORK_LOGO"       => 'file',
            "WORK_PHONE"      => 'string',
            "WORK_FAX"        => 'string',
            "WORK_NOTES"      => 'string',
            "WORK_COUNTRY"    => 'select',
            "WORK_STATE"      => 'string',
            "WORK_CITY"       => 'string',
            "WORK_ZIP"        => 'string',
            "WORK_STREET"     => 'string',
            "WORK_MAILBOX"    => 'string',
            //"UF_DEPARTMENT", "UF_INTERESTS", "UF_SKILLS", "UF_WEB_SITES", "UF_XING", "UF_LINKEDIN", "UF_FACEBOOK", "UF_TWITTER", "UF_SKYPE", "UF_DISTRICT", "UF_PHONE_INNER"
        ];

    /*public const FIELD_FORUM = [
        'forum_ALLOW_POST',
        'forum_SHOW_NAME',
        'forum_DESCRIPTION',
        'forum_INTERESTS',
        'forum_SIGNATURE',
        'forum_AVATAR'
    ];

    public const FIELD_BLOG = [
        'blog_ALIAS',
        'blog_DESCRIPTION',
        'blog_INTERESTS',
        'blog_AVATAR',
    ];

    public const FIELD_STUDENT = [
        'student_PUBLIC_PROFILE',
        'student_RESUME'
    ];*/

    /**
     * @return string
     * @throws \Bitrix\Main\LoaderException
     */
    public function getUserClass()
    {
        if(Loader::includeModule('intranet')) {
            return '\Bitrix\Intranet\UserTable';
        }

        return '\Bitrix\Main\UserTable';
    }

    /**
     * @param $params
     *
     * @return array
     * @throws \Bitrix\Main\LoaderException
     */
    public function getList($params): array
    {
        $result = [];
        $params = $this->prepareNavigationBase($params);

        // user table
        $getListClassName = $this->getUserClass();

        // select
        $select = $params['select'] ?? ['*', 'UF_*'];

        // filter
        $filter = array_merge([/*'=IS_REAL_USER' => 'Y',*/ 'ACTIVE' => 'Y'], $params['filter']);


        $filterParams = [
            'select'        => $select,
            'filter'        => $filter,
            'order'         => $params['order'],
            'limit'         => $params['limit'],
            'offset'        => ($params['limit'] * ($params['page'] - 1)),
            'data_doubling' => false,
        ];

        $dbRes = $getListClassName::getList($filterParams);
        while($res = $dbRes->fetch()) {
            $result[$res['ID']] = $res;
        }

        return $result;
    }

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
        $user = $this->getList([
                                   'select' => ['*', 'UF_*'],
                                   'filter' => ['=ID' => $userId],
                                   'limit'  => 1,
                               ]);

        if(empty($user)) {
            throw new UserException(l::get('ERROR_USER_NOT_FOUND'), 404);
        }

        $user = $this->prepareUserFields(reset($user), $userId);

        return $user;
    }

    public function update($fields, $userId)
    {
        global $USER_FIELD_MANAGER;

        if(empty($userId)) {
            throw new UserException(l::get('ERROR_USER_NOT_FOUND'), 404);
        }

        if(empty($fields)) {
            return false;
        }

        $updateUser = [];

        // get info for current user
        $userInfo = $this->getList([
                                       'select' => ['*', 'UF_*'],
                                       'filter' => ['=ID' => $userId],
                                       'limit'  => 1,
                                   ]);
        if($userInfo) {
            $userInfo = reset($userInfo);
        }


        // default fields
        $defaultFields = self::FIELD_MAIN + self::FIELD_PERSONAL + self::FIELD_WORK;

        // collect
        $updateUser = array_merge($updateUser, array_intersect_key($fields, $defaultFields));


        // collect FILES
        $fileFields = array_intersect_key($fields, array_filter($defaultFields, fn($v) => $v === 'file'));
        if($fileFields) {
            foreach($fileFields as $key => $file) {
                if($file instanceof UploadedFile && $file->getError() === UPLOAD_ERR_OK && $file->getSize()) {
                    $updateUser[$key] = [
                        'name'      => Helper::convertEncodingToSite($file->getClientFilename()),
                        'type'      => $file->getClientMediaType(),
                        'tmp_name'  => $file->file,
                        'error'     => $file->getError(),
                        'size'      => $file->getSize(),
                        "MODULE_ID" => "main",
                    ];

                    if($userInfo[$key]) {
                        $updateUser[$key]['old_file'] = $userInfo[$key];
                        $updateUser[$key]['del'] = $userInfo[$key];
                    }
                } else {
                    $updateUser[$key] = [
                        'old_file' => $userInfo[$key],
                        'del'      => $userInfo[$key] ?: true
                    ];
                }
            }
        }

        // collect USER_PROPERTIES
        $properties = array_intersect_key(
            array_filter($fields, fn($k) => stripos($k, 'UF_') !== false, ARRAY_FILTER_USE_KEY),
            $userInfo
        );
        if($properties) {
            $updateUser = array_merge($updateUser, $properties);
        }

        // password
        if(!empty($updateUser['PASSWORD']) && empty($updateUser['PASSWORD_CONFIRM'])) {
            throw new UserException(l::get('ERROR_USER_PASSWORD_CONFIRM'), StatusCode::HTTP_BAD_REQUEST);
        } elseif(!empty($updateUser['PASSWORD']) && !empty($updateUser['PASSWORD_CONFIRM']) && $updateUser['PASSWORD'] === $updateUser['PASSWORD_CONFIRM']) {
            $updateUser["CONFIRM_PASSWORD"] = $updateUser['PASSWORD_CONFIRM'];
            unset($updateUser['PASSWORD_CONFIRM']);
        }

        if($updateUser) {
            $user = new \CUser();
            $res = $user->Update($userId, $updateUser, true);

            if($user->LAST_ERROR) {
                throw new UserException($user->LAST_ERROR, StatusCode::HTTP_BAD_REQUEST);
            }

            return $res;
        }

        return false;
    }


    /**
     * @param  int  $id
     *
     * @return string
     * @throws UserException
     * @throws \Bitrix\Main\LoaderException
     */
    public function getUserSid(int $id): string
    {
        $userInfo = $this->checkUserById($id);

        return $userInfo['EMAIL'] ? : $userInfo['LOGIN'];
    }


    /**
     * @param  int  $id
     *
     * @return string|null
     * @throws UserException
     * @throws \Bitrix\Main\LoaderException
     */
    public function getUserAvatarSrc(int $id)
    {
        $photo = '';
        $user = $this->getList([
                                   'select' => ['PERSONAL_PHOTO'],
                                   'filter' => ['=ID' => $id],
                                   'limit'  => 1,
                               ]);

        if(!$user) {
            throw new UserException(l::get('ERROR_USER_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }

        $user = reset($user);

        // Personal photo
        if(!empty($user['PERSONAL_PHOTO'])) {
            $photo = \CFile::GetPath($user['PERSONAL_PHOTO']);
        }

        return $photo;
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
        $returnFields = ['ID', 'LOGIN'];
        /*$select = [
            'ID',
            'LOGIN',
            'PASSWORD',
            'ACTIVE',
        ];
        $user = UserTable::getList(['select' => $select, 'filter' => ['=LOGIN' => $login], 'limit' => 1])->fetchRaw();*/

        $user = \CUser::GetByLogin($login)->fetch();

        if(empty($user) || !$this->isUserPassword($user['PASSWORD'], $password)) {
            throw new UserException(l::get('ERROR_AUTH_INCORRECT'), StatusCode::HTTP_BAD_REQUEST);
        }

        if($user['ACTIVE'] !== 'Y') {
            throw new UserException(l::get('ERROR_AUTH_USER_DEACTIVATED'), StatusCode::HTTP_BAD_REQUEST);
        }


        return array_intersect_key($user, array_flip($returnFields));
    }

    /**
     * @param  string  $email
     *
     * @return array
     * @throws UserException
     * @throws \Bitrix\Main\LoaderException
     */
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
     * @return array
     * @throws UserException
     * @throws \Bitrix\Main\LoaderException
     */
    public function checkUserByEmail(string $email): array
    {
        $user = $this->getList([
                                   'select' => ['ID', 'LOGIN', 'EMAIL'],
                                   'filter' => ['=EMAIL' => $email],
                                   'limit'  => 1,
                               ]);

        if(!$user) {
            throw new UserException(l::get('ERROR_USER_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }

        return reset($user);
    }

    /**
     * Check user by login
     *
     * @param  string  $login
     *
     * @return array
     * @throws UserException
     * @throws \Bitrix\Main\LoaderException
     */
    public function checkUserByLogin(string $login): array
    {
        $user = $this->getList([
                                   'select' => ['ID', 'LOGIN', 'EMAIL'],
                                   'filter' => ['=LOGIN' => $login],
                                   'limit'  => 1,
                               ]);

        if(!$user) {
            throw new UserException(l::get('ERROR_USER_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }

        return reset($user);
    }


    /**
     * Check user by Id
     *
     * @param  int  $id
     *
     * @return array
     * @throws UserException
     * @throws \Bitrix\Main\LoaderException
     */
    public function checkUserById(int $id): array
    {
        $user = $this->getList([
                                   'select' => ['ID', 'LOGIN', 'EMAIL'],
                                   'filter' => ['=ID' => $id],
                                   'limit'  => 1,
                               ]);

        if(!$user) {
            throw new UserException(l::get('ERROR_USER_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }

        return reset($user);
    }


    /**
     * @param  string  $userPassword
     * @param  string  $inputPassword
     *
     * @return bool
     */
    public function isUserPassword(
        #[\SensitiveParameter]
        string $userPassword,
        #[\SensitiveParameter]
        string $inputPassword
    ): bool {
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

    public function prepareUserFields(array $userFields, $userId = null): array
    {
        global $USER_FIELD_MANAGER;

        $config = $this->config->getPersonalUserProperties();
        $userProperties = $USER_FIELD_MANAGER->GetUserFields("USER", $userId, LANGUAGE_ID);
        $countries = GetCountryArray();

        $viewFields = [];

        if(array_filter($config)) {

            foreach($config as $_config) {
                if($_config) {
                    $viewFields = array_merge($viewFields, $_config);
                }
            }
        } else {
            $viewFields = array_keys(
                array_merge(self::FIELD_MAIN, self::FIELD_PERSONAL, self::FIELD_WORK, $userProperties)
            );
        }

        $userFields = array_intersect_key($userFields, array_flip($viewFields));

        // file src
        foreach(['PERSONAL_PHOTO', 'WORK_LOGO'] as $v) {
            if(in_array($v, $viewFields, true)) {
                $userFields[$v] = \CFile::GetPath($userFields[$v]);
            }
        }

        // sort by tabs
        $userFieldSort = [];
        foreach($userFields as $nameField => $field) {
            $field = $field ?? null;
            if(array_key_exists($nameField, self::FIELD_MAIN)) {
                $userFieldSort['MAIN'][$nameField] = $field;
            } elseif(array_key_exists($nameField, self::FIELD_WORK)) {
                $userFieldSort['WORK'][$nameField] = $field;
            } elseif(array_key_exists($nameField, self::FIELD_PERSONAL)) {
                $userFieldSort['PERSONAL'][$nameField] = $field;
            } else {
                $userFieldSort['USER_PROPERTIES'][$nameField] = $field;
            }
        }
        $userFields = $userFieldSort;

        // get groups
        $getListClassName = $this->getUserClass();
        $groups = $getListClassName::getUserGroupIds($userId);
        $userFields['groups'] = $groups;

        // get fields types
        $userFieldTypes = array_merge(self::FIELD_MAIN, self::FIELD_PERSONAL, self::FIELD_WORK);

        // set password fields
        if(in_array('PASSWORD', $viewFields, true)) {
            $userFields['MAIN'] = array_merge($userFields['MAIN'] ?? [], ['PASSWORD' => '', 'PASSWORD_CONFIRM' => '']);
        }

        // add title for values
        $reformatResult = [];
        foreach($userFields as $nameTab => $values) {
            if($nameTab === 'groups') {
                $reformatResult[$nameTab] = $values;
                continue;
            }
            $valuesTab = [];

            foreach($values as $valueName => $value) {
                $valuesTab[$valueName]['TITLE'] = l::get('USER_'.$valueName);
                $valuesTab[$valueName]['TYPE'] = $userFieldTypes[$valueName];
                $valuesTab[$valueName]['VALUE'] = $value;

                // types for user properties
                if($nameTab === 'USER_PROPERTIES') {
                    $valuesTab[$valueName]['TITLE'] = $userProperties[$valueName]['EDIT_FORM_LABEL'];
                    $valuesTab[$valueName]['TYPE'] = $userProperties[$valueName]['USER_TYPE_ID'];
                    $valuesTab[$valueName]['VALUE'] = $userProperties[$valueName]['VALUE'];

                    if(isset($value['USER_TYPE']['CLASS_NAME']) && class_exists($value['USER_TYPE']['CLASS_NAME'])) {

                        // list
                        if($value['USER_TYPE_ID'] === 'enumeration') {
                            $value['USER_TYPE']['CLASS_NAME']::getEnumList($value);
                            if(!empty($value['USER_TYPE']['FIELDS'])) {
                                $valuesTab[$valueName]['VALUES'] = $value['USER_TYPE']['~FIELDS'];
                            }
                        }
                    }
                }
            }
            $reformatResult[$nameTab]['TITLE'] = l::get('USER_TITLE_'.$nameTab);
            $reformatResult[$nameTab]['VALUES'] = $valuesTab;
        }

        // select gender
        if(isset($reformatResult['PERSONAL']['VALUES']['PERSONAL_GENDER'])) {
            $reformatResult['PERSONAL']['VALUES']['PERSONAL_GENDER']['VALUES'] = [
                'M' => l::get('USER_MALE'),
                'F' => l::get('USER_FEMALE'),
            ];
        }
        if(isset($reformatResult['PERSONAL']['VALUES']['PERSONAL_COUNTRY'])) {
            $reformatResult['PERSONAL']['VALUES']['PERSONAL_COUNTRY']['VALUES'] = array_combine($countries['reference_id'], $countries['reference']);
        }
        if(isset($reformatResult['WORK']['VALUES']['WORK_COUNTRY'])) {
            $reformatResult['WORK']['VALUES']['WORK_COUNTRY']['VALUES'] = array_combine($countries['reference_id'], $countries['reference']);
        }


        $userFields = $reformatResult;

        return $userFields;
    }

    public function getFields(): array
    {
        $template = static function($section, $field) {
            return [
                $section =>
                    [
                        'TITLE'  => l::get('USER_TITLE_'.$section),
                        'VALUES' =>
                            array_combine(
                                $field,
                                array_map(fn($v) => [
                                    'TITLE' => l::get('USER_'.$v),
                                    'VALUE' => null,
                                ],
                                    $field)
                            ),
                    ],
            ];
        };
        $userFields = array_merge(
            $template('MAIN', static::FIELD_MAIN),
            $template('PERSONAL', static::FIELD_PERSONAL),
            $template('WORK', static::FIELD_WORK),
        //$template('FORUM', static::FIELD_FORUM),
        //$template('BLOG', static::FIELD_BLOG),
        //$template('STUDENT', static::FIELD_STUDENT),
        );

        return $userFields;
    }
}