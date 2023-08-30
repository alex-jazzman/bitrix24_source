<?
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");
//https://sms4b-mod-bus-cp1251.rarus-crimea.ru/test.php


echo 787;
/*
\Bitrix\Sale\PropertyValueCollectionBase::createItem([
    'ID' => 1,
    'NAME' => 'Напоминание о неоплаченом заказе',
    'TYPE' => 'STRING',
    'CODE' => 'FORGOTTEN_BASKET',
]);
*/

$order = \Bitrix\Sale\Order::load(11);
$collection = $order->getPropertyCollection();

$propertyValue = \Bitrix\Sale\PropertyValue::create($collection, [
    'ID' => 1,
    'NAME' => 'Напоминание о неоплаченом заказе',
    'TYPE' => 'STRING',
    'CODE' => 'FORGOTTEN_BASKET1',
]);

/*


$propertyValue->setField('VALUE', 'Свойство_3');
$collection->addItem($propertyValue);
*/
/*
$propertyValue = \Bitrix\Sale\PropertyValue::create($collection, [
    'ID' => 1,
    'NAME' => 'Новое свойство',
    'TYPE' => 'STRING',
    'CODE' => 'NEW_PROP',
]);

$propertyValue->setField('VALUE', 'Свойство_3');
$collection->addItem($propertyValue);
*/

/*
$collection = $order->getPropertyCollection();
foreach ($collection as $item)
{
    // $item - объект класса \Bitrix\Sale\PropertyValue
}
$propertyValue = $collection->getItemByOrderPropertyCode($code);
*/

/*$order = \Bitrix\Sale\Order::load(11);

$collection = $order->getPropertyCollection();

$propertyValue = $collection->getItemById(123);
$r = $propertyValue->setField('VALUE', 'Новое значение');
if (!$r->isSuccess())
{
    var_dump($r->getErrorMessages());
}

$order->save();
*/


// получение списка свойств для заказа с ID 123
$dbRes = \Bitrix\Sale\PropertyValueCollection::getList([
    'select' => ['*'],
    'filter' => [
        '=ORDER_ID' => 11,
    ]
]);

while ($item = $dbRes->fetch())
{
    var_dump($item);
}












/*function getOrdersNoPay()
{
    if (CModule::IncludeModule('sale')){
        $date = '';
        $filter = [
            'DATE_FROM' => $date,
            'PAYED' =>'N'

        ];
        \Bitrix\Sale\Order::loadByFilter($filter);
    }

}*/
//Rarus\Sms4b\Agent::smsOnOrdersWithoutPayment();











require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");
