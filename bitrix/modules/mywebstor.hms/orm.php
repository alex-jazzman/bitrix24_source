<?php

/* ORMENTITYANNOTATION:Bitrix\Crm\ProductRowTable */
namespace Bitrix\Crm {
	/**
	 * ProductRow
	 * @see \Bitrix\Crm\ProductRowTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Crm\ProductRow setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getOwnerId()
	 * @method \Bitrix\Crm\ProductRow setOwnerId(\int|\Bitrix\Main\DB\SqlExpression $ownerId)
	 * @method bool hasOwnerId()
	 * @method bool isOwnerIdFilled()
	 * @method bool isOwnerIdChanged()
	 * @method \int remindActualOwnerId()
	 * @method \int requireOwnerId()
	 * @method \Bitrix\Crm\ProductRow resetOwnerId()
	 * @method \Bitrix\Crm\ProductRow unsetOwnerId()
	 * @method \int fillOwnerId()
	 * @method \string getOwnerType()
	 * @method \Bitrix\Crm\ProductRow setOwnerType(\string|\Bitrix\Main\DB\SqlExpression $ownerType)
	 * @method bool hasOwnerType()
	 * @method bool isOwnerTypeFilled()
	 * @method bool isOwnerTypeChanged()
	 * @method \string remindActualOwnerType()
	 * @method \string requireOwnerType()
	 * @method \Bitrix\Crm\ProductRow resetOwnerType()
	 * @method \Bitrix\Crm\ProductRow unsetOwnerType()
	 * @method \string fillOwnerType()
	 * @method \Bitrix\Crm\EO_Deal getOwner()
	 * @method \Bitrix\Crm\EO_Deal remindActualOwner()
	 * @method \Bitrix\Crm\EO_Deal requireOwner()
	 * @method \Bitrix\Crm\ProductRow setOwner(\Bitrix\Crm\EO_Deal $object)
	 * @method \Bitrix\Crm\ProductRow resetOwner()
	 * @method \Bitrix\Crm\ProductRow unsetOwner()
	 * @method bool hasOwner()
	 * @method bool isOwnerFilled()
	 * @method bool isOwnerChanged()
	 * @method \Bitrix\Crm\EO_Deal fillOwner()
	 * @method \Bitrix\Crm\EO_Deal getDealOwner()
	 * @method \Bitrix\Crm\EO_Deal remindActualDealOwner()
	 * @method \Bitrix\Crm\EO_Deal requireDealOwner()
	 * @method \Bitrix\Crm\ProductRow setDealOwner(\Bitrix\Crm\EO_Deal $object)
	 * @method \Bitrix\Crm\ProductRow resetDealOwner()
	 * @method \Bitrix\Crm\ProductRow unsetDealOwner()
	 * @method bool hasDealOwner()
	 * @method bool isDealOwnerFilled()
	 * @method bool isDealOwnerChanged()
	 * @method \Bitrix\Crm\EO_Deal fillDealOwner()
	 * @method \Bitrix\Crm\EO_Lead getLeadOwner()
	 * @method \Bitrix\Crm\EO_Lead remindActualLeadOwner()
	 * @method \Bitrix\Crm\EO_Lead requireLeadOwner()
	 * @method \Bitrix\Crm\ProductRow setLeadOwner(\Bitrix\Crm\EO_Lead $object)
	 * @method \Bitrix\Crm\ProductRow resetLeadOwner()
	 * @method \Bitrix\Crm\ProductRow unsetLeadOwner()
	 * @method bool hasLeadOwner()
	 * @method bool isLeadOwnerFilled()
	 * @method bool isLeadOwnerChanged()
	 * @method \Bitrix\Crm\EO_Lead fillLeadOwner()
	 * @method \Bitrix\Crm\EO_Quote getQuoteOwner()
	 * @method \Bitrix\Crm\EO_Quote remindActualQuoteOwner()
	 * @method \Bitrix\Crm\EO_Quote requireQuoteOwner()
	 * @method \Bitrix\Crm\ProductRow setQuoteOwner(\Bitrix\Crm\EO_Quote $object)
	 * @method \Bitrix\Crm\ProductRow resetQuoteOwner()
	 * @method \Bitrix\Crm\ProductRow unsetQuoteOwner()
	 * @method bool hasQuoteOwner()
	 * @method bool isQuoteOwnerFilled()
	 * @method bool isQuoteOwnerChanged()
	 * @method \Bitrix\Crm\EO_Quote fillQuoteOwner()
	 * @method \int getProductId()
	 * @method \Bitrix\Crm\ProductRow setProductId(\int|\Bitrix\Main\DB\SqlExpression $productId)
	 * @method bool hasProductId()
	 * @method bool isProductIdFilled()
	 * @method bool isProductIdChanged()
	 * @method \int remindActualProductId()
	 * @method \int requireProductId()
	 * @method \Bitrix\Crm\ProductRow resetProductId()
	 * @method \Bitrix\Crm\ProductRow unsetProductId()
	 * @method \int fillProductId()
	 * @method \string getProductName()
	 * @method \Bitrix\Crm\ProductRow setProductName(\string|\Bitrix\Main\DB\SqlExpression $productName)
	 * @method bool hasProductName()
	 * @method bool isProductNameFilled()
	 * @method bool isProductNameChanged()
	 * @method \string remindActualProductName()
	 * @method \string requireProductName()
	 * @method \Bitrix\Crm\ProductRow resetProductName()
	 * @method \Bitrix\Crm\ProductRow unsetProductName()
	 * @method \string fillProductName()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy getIblockElement()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy remindActualIblockElement()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy requireIblockElement()
	 * @method \Bitrix\Crm\ProductRow setIblockElement(\Bitrix\Crm\EO_IBlockElementProxy $object)
	 * @method \Bitrix\Crm\ProductRow resetIblockElement()
	 * @method \Bitrix\Crm\ProductRow unsetIblockElement()
	 * @method bool hasIblockElement()
	 * @method bool isIblockElementFilled()
	 * @method bool isIblockElementChanged()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy fillIblockElement()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy getIblockElementGrc()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy remindActualIblockElementGrc()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy requireIblockElementGrc()
	 * @method \Bitrix\Crm\ProductRow setIblockElementGrc(\Bitrix\Crm\EO_IBlockElementGrcProxy $object)
	 * @method \Bitrix\Crm\ProductRow resetIblockElementGrc()
	 * @method \Bitrix\Crm\ProductRow unsetIblockElementGrc()
	 * @method bool hasIblockElementGrc()
	 * @method bool isIblockElementGrcFilled()
	 * @method bool isIblockElementGrcChanged()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy fillIblockElementGrc()
	 * @method \string getCpProductName()
	 * @method \string remindActualCpProductName()
	 * @method \string requireCpProductName()
	 * @method bool hasCpProductName()
	 * @method bool isCpProductNameFilled()
	 * @method \Bitrix\Crm\ProductRow unsetCpProductName()
	 * @method \string fillCpProductName()
	 * @method \float getPrice()
	 * @method \Bitrix\Crm\ProductRow setPrice(\float|\Bitrix\Main\DB\SqlExpression $price)
	 * @method bool hasPrice()
	 * @method bool isPriceFilled()
	 * @method bool isPriceChanged()
	 * @method \float remindActualPrice()
	 * @method \float requirePrice()
	 * @method \Bitrix\Crm\ProductRow resetPrice()
	 * @method \Bitrix\Crm\ProductRow unsetPrice()
	 * @method \float fillPrice()
	 * @method \float getPriceAccount()
	 * @method \Bitrix\Crm\ProductRow setPriceAccount(\float|\Bitrix\Main\DB\SqlExpression $priceAccount)
	 * @method bool hasPriceAccount()
	 * @method bool isPriceAccountFilled()
	 * @method bool isPriceAccountChanged()
	 * @method \float remindActualPriceAccount()
	 * @method \float requirePriceAccount()
	 * @method \Bitrix\Crm\ProductRow resetPriceAccount()
	 * @method \Bitrix\Crm\ProductRow unsetPriceAccount()
	 * @method \float fillPriceAccount()
	 * @method \float getPriceExclusive()
	 * @method \Bitrix\Crm\ProductRow setPriceExclusive(\float|\Bitrix\Main\DB\SqlExpression $priceExclusive)
	 * @method bool hasPriceExclusive()
	 * @method bool isPriceExclusiveFilled()
	 * @method bool isPriceExclusiveChanged()
	 * @method \float remindActualPriceExclusive()
	 * @method \float requirePriceExclusive()
	 * @method \Bitrix\Crm\ProductRow resetPriceExclusive()
	 * @method \Bitrix\Crm\ProductRow unsetPriceExclusive()
	 * @method \float fillPriceExclusive()
	 * @method \float getPriceNetto()
	 * @method \Bitrix\Crm\ProductRow setPriceNetto(\float|\Bitrix\Main\DB\SqlExpression $priceNetto)
	 * @method bool hasPriceNetto()
	 * @method bool isPriceNettoFilled()
	 * @method bool isPriceNettoChanged()
	 * @method \float remindActualPriceNetto()
	 * @method \float requirePriceNetto()
	 * @method \Bitrix\Crm\ProductRow resetPriceNetto()
	 * @method \Bitrix\Crm\ProductRow unsetPriceNetto()
	 * @method \float fillPriceNetto()
	 * @method \float getPriceBrutto()
	 * @method \Bitrix\Crm\ProductRow setPriceBrutto(\float|\Bitrix\Main\DB\SqlExpression $priceBrutto)
	 * @method bool hasPriceBrutto()
	 * @method bool isPriceBruttoFilled()
	 * @method bool isPriceBruttoChanged()
	 * @method \float remindActualPriceBrutto()
	 * @method \float requirePriceBrutto()
	 * @method \Bitrix\Crm\ProductRow resetPriceBrutto()
	 * @method \Bitrix\Crm\ProductRow unsetPriceBrutto()
	 * @method \float fillPriceBrutto()
	 * @method \float getQuantity()
	 * @method \Bitrix\Crm\ProductRow setQuantity(\float|\Bitrix\Main\DB\SqlExpression $quantity)
	 * @method bool hasQuantity()
	 * @method bool isQuantityFilled()
	 * @method bool isQuantityChanged()
	 * @method \float remindActualQuantity()
	 * @method \float requireQuantity()
	 * @method \Bitrix\Crm\ProductRow resetQuantity()
	 * @method \Bitrix\Crm\ProductRow unsetQuantity()
	 * @method \float fillQuantity()
	 * @method \float getSumAccount()
	 * @method \float remindActualSumAccount()
	 * @method \float requireSumAccount()
	 * @method bool hasSumAccount()
	 * @method bool isSumAccountFilled()
	 * @method \Bitrix\Crm\ProductRow unsetSumAccount()
	 * @method \float fillSumAccount()
	 * @method \int getDiscountTypeId()
	 * @method \Bitrix\Crm\ProductRow setDiscountTypeId(\int|\Bitrix\Main\DB\SqlExpression $discountTypeId)
	 * @method bool hasDiscountTypeId()
	 * @method bool isDiscountTypeIdFilled()
	 * @method bool isDiscountTypeIdChanged()
	 * @method \int remindActualDiscountTypeId()
	 * @method \int requireDiscountTypeId()
	 * @method \Bitrix\Crm\ProductRow resetDiscountTypeId()
	 * @method \Bitrix\Crm\ProductRow unsetDiscountTypeId()
	 * @method \int fillDiscountTypeId()
	 * @method \float getDiscountRate()
	 * @method \Bitrix\Crm\ProductRow setDiscountRate(\float|\Bitrix\Main\DB\SqlExpression $discountRate)
	 * @method bool hasDiscountRate()
	 * @method bool isDiscountRateFilled()
	 * @method bool isDiscountRateChanged()
	 * @method \float remindActualDiscountRate()
	 * @method \float requireDiscountRate()
	 * @method \Bitrix\Crm\ProductRow resetDiscountRate()
	 * @method \Bitrix\Crm\ProductRow unsetDiscountRate()
	 * @method \float fillDiscountRate()
	 * @method \float getDiscountSum()
	 * @method \Bitrix\Crm\ProductRow setDiscountSum(\float|\Bitrix\Main\DB\SqlExpression $discountSum)
	 * @method bool hasDiscountSum()
	 * @method bool isDiscountSumFilled()
	 * @method bool isDiscountSumChanged()
	 * @method \float remindActualDiscountSum()
	 * @method \float requireDiscountSum()
	 * @method \Bitrix\Crm\ProductRow resetDiscountSum()
	 * @method \Bitrix\Crm\ProductRow unsetDiscountSum()
	 * @method \float fillDiscountSum()
	 * @method ?\float getTaxRate()
	 * @method \Bitrix\Crm\ProductRow setTaxRate(?\float|\Bitrix\Main\DB\SqlExpression $taxRate)
	 * @method bool hasTaxRate()
	 * @method bool isTaxRateFilled()
	 * @method bool isTaxRateChanged()
	 * @method ?\float remindActualTaxRate()
	 * @method ?\float requireTaxRate()
	 * @method \Bitrix\Crm\ProductRow resetTaxRate()
	 * @method \Bitrix\Crm\ProductRow unsetTaxRate()
	 * @method ?\float fillTaxRate()
	 * @method \boolean getTaxIncluded()
	 * @method \Bitrix\Crm\ProductRow setTaxIncluded(\boolean|\Bitrix\Main\DB\SqlExpression $taxIncluded)
	 * @method bool hasTaxIncluded()
	 * @method bool isTaxIncludedFilled()
	 * @method bool isTaxIncludedChanged()
	 * @method \boolean remindActualTaxIncluded()
	 * @method \boolean requireTaxIncluded()
	 * @method \Bitrix\Crm\ProductRow resetTaxIncluded()
	 * @method \Bitrix\Crm\ProductRow unsetTaxIncluded()
	 * @method \boolean fillTaxIncluded()
	 * @method \boolean getCustomized()
	 * @method \Bitrix\Crm\ProductRow setCustomized(\boolean|\Bitrix\Main\DB\SqlExpression $customized)
	 * @method bool hasCustomized()
	 * @method bool isCustomizedFilled()
	 * @method bool isCustomizedChanged()
	 * @method \boolean remindActualCustomized()
	 * @method \boolean requireCustomized()
	 * @method \Bitrix\Crm\ProductRow resetCustomized()
	 * @method \Bitrix\Crm\ProductRow unsetCustomized()
	 * @method \boolean fillCustomized()
	 * @method \int getMeasureCode()
	 * @method \Bitrix\Crm\ProductRow setMeasureCode(\int|\Bitrix\Main\DB\SqlExpression $measureCode)
	 * @method bool hasMeasureCode()
	 * @method bool isMeasureCodeFilled()
	 * @method bool isMeasureCodeChanged()
	 * @method \int remindActualMeasureCode()
	 * @method \int requireMeasureCode()
	 * @method \Bitrix\Crm\ProductRow resetMeasureCode()
	 * @method \Bitrix\Crm\ProductRow unsetMeasureCode()
	 * @method \int fillMeasureCode()
	 * @method \string getMeasureName()
	 * @method \Bitrix\Crm\ProductRow setMeasureName(\string|\Bitrix\Main\DB\SqlExpression $measureName)
	 * @method bool hasMeasureName()
	 * @method bool isMeasureNameFilled()
	 * @method bool isMeasureNameChanged()
	 * @method \string remindActualMeasureName()
	 * @method \string requireMeasureName()
	 * @method \Bitrix\Crm\ProductRow resetMeasureName()
	 * @method \Bitrix\Crm\ProductRow unsetMeasureName()
	 * @method \string fillMeasureName()
	 * @method \int getSort()
	 * @method \Bitrix\Crm\ProductRow setSort(\int|\Bitrix\Main\DB\SqlExpression $sort)
	 * @method bool hasSort()
	 * @method bool isSortFilled()
	 * @method bool isSortChanged()
	 * @method \int remindActualSort()
	 * @method \int requireSort()
	 * @method \Bitrix\Crm\ProductRow resetSort()
	 * @method \Bitrix\Crm\ProductRow unsetSort()
	 * @method \int fillSort()
	 * @method \string getXmlId()
	 * @method \Bitrix\Crm\ProductRow setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \Bitrix\Crm\ProductRow resetXmlId()
	 * @method \Bitrix\Crm\ProductRow unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \int getType()
	 * @method \Bitrix\Crm\ProductRow setType(\int|\Bitrix\Main\DB\SqlExpression $type)
	 * @method bool hasType()
	 * @method bool isTypeFilled()
	 * @method bool isTypeChanged()
	 * @method \int remindActualType()
	 * @method \int requireType()
	 * @method \Bitrix\Crm\ProductRow resetType()
	 * @method \Bitrix\Crm\ProductRow unsetType()
	 * @method \int fillType()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation getProductRowReservation()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation remindActualProductRowReservation()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation requireProductRowReservation()
	 * @method \Bitrix\Crm\ProductRow setProductRowReservation(\Bitrix\Crm\Reservation\ProductRowReservation $object)
	 * @method \Bitrix\Crm\ProductRow resetProductRowReservation()
	 * @method \Bitrix\Crm\ProductRow unsetProductRowReservation()
	 * @method bool hasProductRowReservation()
	 * @method bool isProductRowReservationFilled()
	 * @method bool isProductRowReservationChanged()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation fillProductRowReservation()
	 * @method \MyWebstor\Hms\Object\Appointment getAppointmentOwner()
	 * @method \MyWebstor\Hms\Object\Appointment remindActualAppointmentOwner()
	 * @method \MyWebstor\Hms\Object\Appointment requireAppointmentOwner()
	 * @method \Bitrix\Crm\ProductRow setAppointmentOwner(\MyWebstor\Hms\Object\Appointment $object)
	 * @method \Bitrix\Crm\ProductRow resetAppointmentOwner()
	 * @method \Bitrix\Crm\ProductRow unsetAppointmentOwner()
	 * @method bool hasAppointmentOwner()
	 * @method bool isAppointmentOwnerFilled()
	 * @method bool isAppointmentOwnerChanged()
	 * @method \MyWebstor\Hms\Object\Appointment fillAppointmentOwner()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Crm\ProductRow set($fieldName, $value)
	 * @method \Bitrix\Crm\ProductRow reset($fieldName)
	 * @method \Bitrix\Crm\ProductRow unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Crm\ProductRow wakeUp($data)
	 */
	class EO_ProductRow {
		/* @var \Bitrix\Crm\ProductRowTable */
		static public $dataClass = '\Bitrix\Crm\ProductRowTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Crm {
	/**
	 * ProductRowCollection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getOwnerIdList()
	 * @method \int[] fillOwnerId()
	 * @method \string[] getOwnerTypeList()
	 * @method \string[] fillOwnerType()
	 * @method \Bitrix\Crm\EO_Deal[] getOwnerList()
	 * @method \Bitrix\Crm\ProductRowCollection getOwnerCollection()
	 * @method \Bitrix\Crm\EO_Deal_Collection fillOwner()
	 * @method \Bitrix\Crm\EO_Deal[] getDealOwnerList()
	 * @method \Bitrix\Crm\ProductRowCollection getDealOwnerCollection()
	 * @method \Bitrix\Crm\EO_Deal_Collection fillDealOwner()
	 * @method \Bitrix\Crm\EO_Lead[] getLeadOwnerList()
	 * @method \Bitrix\Crm\ProductRowCollection getLeadOwnerCollection()
	 * @method \Bitrix\Crm\EO_Lead_Collection fillLeadOwner()
	 * @method \Bitrix\Crm\EO_Quote[] getQuoteOwnerList()
	 * @method \Bitrix\Crm\ProductRowCollection getQuoteOwnerCollection()
	 * @method \Bitrix\Crm\EO_Quote_Collection fillQuoteOwner()
	 * @method \int[] getProductIdList()
	 * @method \int[] fillProductId()
	 * @method \string[] getProductNameList()
	 * @method \string[] fillProductName()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy[] getIblockElementList()
	 * @method \Bitrix\Crm\ProductRowCollection getIblockElementCollection()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy_Collection fillIblockElement()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy[] getIblockElementGrcList()
	 * @method \Bitrix\Crm\ProductRowCollection getIblockElementGrcCollection()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy_Collection fillIblockElementGrc()
	 * @method \string[] getCpProductNameList()
	 * @method \string[] fillCpProductName()
	 * @method \float[] getPriceList()
	 * @method \float[] fillPrice()
	 * @method \float[] getPriceAccountList()
	 * @method \float[] fillPriceAccount()
	 * @method \float[] getPriceExclusiveList()
	 * @method \float[] fillPriceExclusive()
	 * @method \float[] getPriceNettoList()
	 * @method \float[] fillPriceNetto()
	 * @method \float[] getPriceBruttoList()
	 * @method \float[] fillPriceBrutto()
	 * @method \float[] getQuantityList()
	 * @method \float[] fillQuantity()
	 * @method \float[] getSumAccountList()
	 * @method \float[] fillSumAccount()
	 * @method \int[] getDiscountTypeIdList()
	 * @method \int[] fillDiscountTypeId()
	 * @method \float[] getDiscountRateList()
	 * @method \float[] fillDiscountRate()
	 * @method \float[] getDiscountSumList()
	 * @method \float[] fillDiscountSum()
	 * @method ?\float[] getTaxRateList()
	 * @method ?\float[] fillTaxRate()
	 * @method \boolean[] getTaxIncludedList()
	 * @method \boolean[] fillTaxIncluded()
	 * @method \boolean[] getCustomizedList()
	 * @method \boolean[] fillCustomized()
	 * @method \int[] getMeasureCodeList()
	 * @method \int[] fillMeasureCode()
	 * @method \string[] getMeasureNameList()
	 * @method \string[] fillMeasureName()
	 * @method \int[] getSortList()
	 * @method \int[] fillSort()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \int[] getTypeList()
	 * @method \int[] fillType()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation[] getProductRowReservationList()
	 * @method \Bitrix\Crm\ProductRowCollection getProductRowReservationCollection()
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductRowReservation_Collection fillProductRowReservation()
	 * @method \MyWebstor\Hms\Object\Appointment[] getAppointmentOwnerList()
	 * @method \Bitrix\Crm\ProductRowCollection getAppointmentOwnerCollection()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fillAppointmentOwner()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Crm\ProductRow $object)
	 * @method bool has(\Bitrix\Crm\ProductRow $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Crm\ProductRow getByPrimary($primary)
	 * @method \Bitrix\Crm\ProductRow[] getAll()
	 * @method bool remove(\Bitrix\Crm\ProductRow $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Crm\ProductRowCollection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Crm\ProductRow current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method ProductRowCollection merge(?ProductRowCollection $collection)
	 * @method bool isEmpty()
	 */
	class EO_ProductRow_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Crm\ProductRowTable */
		static public $dataClass = '\Bitrix\Crm\ProductRowTable';
	}
}
namespace Bitrix\Crm {
	/**
	 * @method static EO_ProductRow_Query query()
	 * @method static EO_ProductRow_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_ProductRow_Result getById($id)
	 * @method static EO_ProductRow_Result getList(array $parameters = [])
	 * @method static EO_ProductRow_Entity getEntity()
	 * @method static \Bitrix\Crm\ProductRow createObject($setDefaultValues = true)
	 * @method static \Bitrix\Crm\ProductRowCollection createCollection()
	 * @method static \Bitrix\Crm\ProductRow wakeUpObject($row)
	 * @method static \Bitrix\Crm\ProductRowCollection wakeUpCollection($rows)
	 */
	class ProductRowTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_ProductRow_Result exec()
	 * @method \Bitrix\Crm\ProductRow fetchObject()
	 * @method \Bitrix\Crm\ProductRowCollection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_ProductRow_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Crm\ProductRow fetchObject()
	 * @method \Bitrix\Crm\ProductRowCollection fetchCollection()
	 */
	class EO_ProductRow_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Crm\ProductRow createObject($setDefaultValues = true)
	 * @method \Bitrix\Crm\ProductRowCollection createCollection()
	 * @method \Bitrix\Crm\ProductRow wakeUpObject($row)
	 * @method \Bitrix\Crm\ProductRowCollection wakeUpCollection($rows)
	 */
	class EO_ProductRow_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Crm\Reservation\Internals\ProductRowReservationTable */
namespace Bitrix\Crm\Reservation\Internals {
	/**
	 * ProductRowReservation
	 * @see \Bitrix\Crm\Reservation\Internals\ProductRowReservationTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getRowId()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation setRowId(\int|\Bitrix\Main\DB\SqlExpression $rowId)
	 * @method bool hasRowId()
	 * @method bool isRowIdFilled()
	 * @method bool isRowIdChanged()
	 * @method \int remindActualRowId()
	 * @method \int requireRowId()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation resetRowId()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation unsetRowId()
	 * @method \int fillRowId()
	 * @method \float getReserveQuantity()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation setReserveQuantity(\float|\Bitrix\Main\DB\SqlExpression $reserveQuantity)
	 * @method bool hasReserveQuantity()
	 * @method bool isReserveQuantityFilled()
	 * @method bool isReserveQuantityChanged()
	 * @method \float remindActualReserveQuantity()
	 * @method \float requireReserveQuantity()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation resetReserveQuantity()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation unsetReserveQuantity()
	 * @method \float fillReserveQuantity()
	 * @method \Bitrix\Main\Type\Date getDateReserveEnd()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation setDateReserveEnd(\Bitrix\Main\Type\Date|\Bitrix\Main\DB\SqlExpression $dateReserveEnd)
	 * @method bool hasDateReserveEnd()
	 * @method bool isDateReserveEndFilled()
	 * @method bool isDateReserveEndChanged()
	 * @method \Bitrix\Main\Type\Date remindActualDateReserveEnd()
	 * @method \Bitrix\Main\Type\Date requireDateReserveEnd()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation resetDateReserveEnd()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation unsetDateReserveEnd()
	 * @method \Bitrix\Main\Type\Date fillDateReserveEnd()
	 * @method \int getStoreId()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation setStoreId(\int|\Bitrix\Main\DB\SqlExpression $storeId)
	 * @method bool hasStoreId()
	 * @method bool isStoreIdFilled()
	 * @method bool isStoreIdChanged()
	 * @method \int remindActualStoreId()
	 * @method \int requireStoreId()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation resetStoreId()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation unsetStoreId()
	 * @method \int fillStoreId()
	 * @method \boolean getIsAuto()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation setIsAuto(\boolean|\Bitrix\Main\DB\SqlExpression $isAuto)
	 * @method bool hasIsAuto()
	 * @method bool isIsAutoFilled()
	 * @method bool isIsAutoChanged()
	 * @method \boolean remindActualIsAuto()
	 * @method \boolean requireIsAuto()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation resetIsAuto()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation unsetIsAuto()
	 * @method \boolean fillIsAuto()
	 * @method \Bitrix\Crm\ProductRow getProductRow()
	 * @method \Bitrix\Crm\ProductRow remindActualProductRow()
	 * @method \Bitrix\Crm\ProductRow requireProductRow()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation setProductRow(\Bitrix\Crm\ProductRow $object)
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation resetProductRow()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation unsetProductRow()
	 * @method bool hasProductRow()
	 * @method bool isProductRowFilled()
	 * @method bool isProductRowChanged()
	 * @method \Bitrix\Crm\ProductRow fillProductRow()
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductReservationMap getProductReservationMap()
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductReservationMap remindActualProductReservationMap()
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductReservationMap requireProductReservationMap()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation setProductReservationMap(\Bitrix\Crm\Reservation\Internals\EO_ProductReservationMap $object)
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation resetProductReservationMap()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation unsetProductReservationMap()
	 * @method bool hasProductReservationMap()
	 * @method bool isProductReservationMapFilled()
	 * @method bool isProductReservationMapChanged()
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductReservationMap fillProductReservationMap()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation set($fieldName, $value)
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation reset($fieldName)
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Crm\Reservation\ProductRowReservation wakeUp($data)
	 */
	class EO_ProductRowReservation {
		/* @var \Bitrix\Crm\Reservation\Internals\ProductRowReservationTable */
		static public $dataClass = '\Bitrix\Crm\Reservation\Internals\ProductRowReservationTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Crm\Reservation\Internals {
	/**
	 * EO_ProductRowReservation_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getRowIdList()
	 * @method \int[] fillRowId()
	 * @method \float[] getReserveQuantityList()
	 * @method \float[] fillReserveQuantity()
	 * @method \Bitrix\Main\Type\Date[] getDateReserveEndList()
	 * @method \Bitrix\Main\Type\Date[] fillDateReserveEnd()
	 * @method \int[] getStoreIdList()
	 * @method \int[] fillStoreId()
	 * @method \boolean[] getIsAutoList()
	 * @method \boolean[] fillIsAuto()
	 * @method \Bitrix\Crm\ProductRow[] getProductRowList()
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductRowReservation_Collection getProductRowCollection()
	 * @method \Bitrix\Crm\ProductRowCollection fillProductRow()
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductReservationMap[] getProductReservationMapList()
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductRowReservation_Collection getProductReservationMapCollection()
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductReservationMap_Collection fillProductReservationMap()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Crm\Reservation\ProductRowReservation $object)
	 * @method bool has(\Bitrix\Crm\Reservation\ProductRowReservation $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation getByPrimary($primary)
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation[] getAll()
	 * @method bool remove(\Bitrix\Crm\Reservation\ProductRowReservation $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Crm\Reservation\Internals\EO_ProductRowReservation_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_ProductRowReservation_Collection merge(?EO_ProductRowReservation_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_ProductRowReservation_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Crm\Reservation\Internals\ProductRowReservationTable */
		static public $dataClass = '\Bitrix\Crm\Reservation\Internals\ProductRowReservationTable';
	}
}
namespace Bitrix\Crm\Reservation\Internals {
	/**
	 * @method static EO_ProductRowReservation_Query query()
	 * @method static EO_ProductRowReservation_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_ProductRowReservation_Result getById($id)
	 * @method static EO_ProductRowReservation_Result getList(array $parameters = [])
	 * @method static EO_ProductRowReservation_Entity getEntity()
	 * @method static \Bitrix\Crm\Reservation\ProductRowReservation createObject($setDefaultValues = true)
	 * @method static \Bitrix\Crm\Reservation\Internals\EO_ProductRowReservation_Collection createCollection()
	 * @method static \Bitrix\Crm\Reservation\ProductRowReservation wakeUpObject($row)
	 * @method static \Bitrix\Crm\Reservation\Internals\EO_ProductRowReservation_Collection wakeUpCollection($rows)
	 */
	class ProductRowReservationTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_ProductRowReservation_Result exec()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation fetchObject()
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductRowReservation_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_ProductRowReservation_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation fetchObject()
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductRowReservation_Collection fetchCollection()
	 */
	class EO_ProductRowReservation_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation createObject($setDefaultValues = true)
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductRowReservation_Collection createCollection()
	 * @method \Bitrix\Crm\Reservation\ProductRowReservation wakeUpObject($row)
	 * @method \Bitrix\Crm\Reservation\Internals\EO_ProductRowReservation_Collection wakeUpCollection($rows)
	 */
	class EO_ProductRowReservation_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Crm\IBlockElementProxyTable */
namespace Bitrix\Crm {
	/**
	 * EO_IBlockElementProxy
	 * @see \Bitrix\Crm\IBlockElementProxyTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getIblockId()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy setIblockId(\int|\Bitrix\Main\DB\SqlExpression $iblockId)
	 * @method bool hasIblockId()
	 * @method bool isIblockIdFilled()
	 * @method bool isIblockIdChanged()
	 * @method \int remindActualIblockId()
	 * @method \int requireIblockId()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy resetIblockId()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy unsetIblockId()
	 * @method \int fillIblockId()
	 * @method \string getName()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy setName(\string|\Bitrix\Main\DB\SqlExpression $name)
	 * @method bool hasName()
	 * @method bool isNameFilled()
	 * @method bool isNameChanged()
	 * @method \string remindActualName()
	 * @method \string requireName()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy resetName()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy unsetName()
	 * @method \string fillName()
	 * @method \string getXmlId()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy resetXmlId()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy unsetXmlId()
	 * @method \string fillXmlId()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Crm\EO_IBlockElementProxy set($fieldName, $value)
	 * @method \Bitrix\Crm\EO_IBlockElementProxy reset($fieldName)
	 * @method \Bitrix\Crm\EO_IBlockElementProxy unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Crm\EO_IBlockElementProxy wakeUp($data)
	 */
	class EO_IBlockElementProxy {
		/* @var \Bitrix\Crm\IBlockElementProxyTable */
		static public $dataClass = '\Bitrix\Crm\IBlockElementProxyTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Crm {
	/**
	 * EO_IBlockElementProxy_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getIblockIdList()
	 * @method \int[] fillIblockId()
	 * @method \string[] getNameList()
	 * @method \string[] fillName()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Crm\EO_IBlockElementProxy $object)
	 * @method bool has(\Bitrix\Crm\EO_IBlockElementProxy $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Crm\EO_IBlockElementProxy getByPrimary($primary)
	 * @method \Bitrix\Crm\EO_IBlockElementProxy[] getAll()
	 * @method bool remove(\Bitrix\Crm\EO_IBlockElementProxy $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Crm\EO_IBlockElementProxy_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Crm\EO_IBlockElementProxy current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_IBlockElementProxy_Collection merge(?EO_IBlockElementProxy_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_IBlockElementProxy_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Crm\IBlockElementProxyTable */
		static public $dataClass = '\Bitrix\Crm\IBlockElementProxyTable';
	}
}
namespace Bitrix\Crm {
	/**
	 * @method static EO_IBlockElementProxy_Query query()
	 * @method static EO_IBlockElementProxy_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_IBlockElementProxy_Result getById($id)
	 * @method static EO_IBlockElementProxy_Result getList(array $parameters = [])
	 * @method static EO_IBlockElementProxy_Entity getEntity()
	 * @method static \Bitrix\Crm\EO_IBlockElementProxy createObject($setDefaultValues = true)
	 * @method static \Bitrix\Crm\EO_IBlockElementProxy_Collection createCollection()
	 * @method static \Bitrix\Crm\EO_IBlockElementProxy wakeUpObject($row)
	 * @method static \Bitrix\Crm\EO_IBlockElementProxy_Collection wakeUpCollection($rows)
	 */
	class IBlockElementProxyTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_IBlockElementProxy_Result exec()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy fetchObject()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_IBlockElementProxy_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Crm\EO_IBlockElementProxy fetchObject()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy_Collection fetchCollection()
	 */
	class EO_IBlockElementProxy_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Crm\EO_IBlockElementProxy createObject($setDefaultValues = true)
	 * @method \Bitrix\Crm\EO_IBlockElementProxy_Collection createCollection()
	 * @method \Bitrix\Crm\EO_IBlockElementProxy wakeUpObject($row)
	 * @method \Bitrix\Crm\EO_IBlockElementProxy_Collection wakeUpCollection($rows)
	 */
	class EO_IBlockElementProxy_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Crm\IBlockElementGrcProxyTable */
namespace Bitrix\Crm {
	/**
	 * EO_IBlockElementGrcProxy
	 * @see \Bitrix\Crm\IBlockElementGrcProxyTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getName()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy setName(\string|\Bitrix\Main\DB\SqlExpression $name)
	 * @method bool hasName()
	 * @method bool isNameFilled()
	 * @method bool isNameChanged()
	 * @method \string remindActualName()
	 * @method \string requireName()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy resetName()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy unsetName()
	 * @method \string fillName()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy set($fieldName, $value)
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy reset($fieldName)
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Crm\EO_IBlockElementGrcProxy wakeUp($data)
	 */
	class EO_IBlockElementGrcProxy {
		/* @var \Bitrix\Crm\IBlockElementGrcProxyTable */
		static public $dataClass = '\Bitrix\Crm\IBlockElementGrcProxyTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Crm {
	/**
	 * EO_IBlockElementGrcProxy_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getNameList()
	 * @method \string[] fillName()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Crm\EO_IBlockElementGrcProxy $object)
	 * @method bool has(\Bitrix\Crm\EO_IBlockElementGrcProxy $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy getByPrimary($primary)
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy[] getAll()
	 * @method bool remove(\Bitrix\Crm\EO_IBlockElementGrcProxy $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Crm\EO_IBlockElementGrcProxy_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_IBlockElementGrcProxy_Collection merge(?EO_IBlockElementGrcProxy_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_IBlockElementGrcProxy_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Crm\IBlockElementGrcProxyTable */
		static public $dataClass = '\Bitrix\Crm\IBlockElementGrcProxyTable';
	}
}
namespace Bitrix\Crm {
	/**
	 * @method static EO_IBlockElementGrcProxy_Query query()
	 * @method static EO_IBlockElementGrcProxy_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_IBlockElementGrcProxy_Result getById($id)
	 * @method static EO_IBlockElementGrcProxy_Result getList(array $parameters = [])
	 * @method static EO_IBlockElementGrcProxy_Entity getEntity()
	 * @method static \Bitrix\Crm\EO_IBlockElementGrcProxy createObject($setDefaultValues = true)
	 * @method static \Bitrix\Crm\EO_IBlockElementGrcProxy_Collection createCollection()
	 * @method static \Bitrix\Crm\EO_IBlockElementGrcProxy wakeUpObject($row)
	 * @method static \Bitrix\Crm\EO_IBlockElementGrcProxy_Collection wakeUpCollection($rows)
	 */
	class IBlockElementGrcProxyTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_IBlockElementGrcProxy_Result exec()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy fetchObject()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_IBlockElementGrcProxy_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy fetchObject()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy_Collection fetchCollection()
	 */
	class EO_IBlockElementGrcProxy_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy createObject($setDefaultValues = true)
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy_Collection createCollection()
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy wakeUpObject($row)
	 * @method \Bitrix\Crm\EO_IBlockElementGrcProxy_Collection wakeUpCollection($rows)
	 */
	class EO_IBlockElementGrcProxy_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Crm\ContactTable */
namespace Bitrix\Crm {
	/**
	 * Contact
	 * @see \Bitrix\Crm\ContactTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Crm\Contact setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \Bitrix\Main\Type\DateTime getDateCreate()
	 * @method \Bitrix\Crm\Contact setDateCreate(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateCreate)
	 * @method bool hasDateCreate()
	 * @method bool isDateCreateFilled()
	 * @method bool isDateCreateChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateCreate()
	 * @method \Bitrix\Main\Type\DateTime requireDateCreate()
	 * @method \Bitrix\Crm\Contact resetDateCreate()
	 * @method \Bitrix\Crm\Contact unsetDateCreate()
	 * @method \Bitrix\Main\Type\DateTime fillDateCreate()
	 * @method \Bitrix\Main\Type\DateTime getDateModify()
	 * @method \Bitrix\Crm\Contact setDateModify(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateModify)
	 * @method bool hasDateModify()
	 * @method bool isDateModifyFilled()
	 * @method bool isDateModifyChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateModify()
	 * @method \Bitrix\Main\Type\DateTime requireDateModify()
	 * @method \Bitrix\Crm\Contact resetDateModify()
	 * @method \Bitrix\Crm\Contact unsetDateModify()
	 * @method \Bitrix\Main\Type\DateTime fillDateModify()
	 * @method \int getCreatedById()
	 * @method \Bitrix\Crm\Contact setCreatedById(\int|\Bitrix\Main\DB\SqlExpression $createdById)
	 * @method bool hasCreatedById()
	 * @method bool isCreatedByIdFilled()
	 * @method bool isCreatedByIdChanged()
	 * @method \int remindActualCreatedById()
	 * @method \int requireCreatedById()
	 * @method \Bitrix\Crm\Contact resetCreatedById()
	 * @method \Bitrix\Crm\Contact unsetCreatedById()
	 * @method \int fillCreatedById()
	 * @method \Bitrix\Main\EO_User getCreatedBy()
	 * @method \Bitrix\Main\EO_User remindActualCreatedBy()
	 * @method \Bitrix\Main\EO_User requireCreatedBy()
	 * @method \Bitrix\Crm\Contact setCreatedBy(\Bitrix\Main\EO_User $object)
	 * @method \Bitrix\Crm\Contact resetCreatedBy()
	 * @method \Bitrix\Crm\Contact unsetCreatedBy()
	 * @method bool hasCreatedBy()
	 * @method bool isCreatedByFilled()
	 * @method bool isCreatedByChanged()
	 * @method \Bitrix\Main\EO_User fillCreatedBy()
	 * @method \int getModifyById()
	 * @method \Bitrix\Crm\Contact setModifyById(\int|\Bitrix\Main\DB\SqlExpression $modifyById)
	 * @method bool hasModifyById()
	 * @method bool isModifyByIdFilled()
	 * @method bool isModifyByIdChanged()
	 * @method \int remindActualModifyById()
	 * @method \int requireModifyById()
	 * @method \Bitrix\Crm\Contact resetModifyById()
	 * @method \Bitrix\Crm\Contact unsetModifyById()
	 * @method \int fillModifyById()
	 * @method \Bitrix\Main\EO_User getModifyBy()
	 * @method \Bitrix\Main\EO_User remindActualModifyBy()
	 * @method \Bitrix\Main\EO_User requireModifyBy()
	 * @method \Bitrix\Crm\Contact setModifyBy(\Bitrix\Main\EO_User $object)
	 * @method \Bitrix\Crm\Contact resetModifyBy()
	 * @method \Bitrix\Crm\Contact unsetModifyBy()
	 * @method bool hasModifyBy()
	 * @method bool isModifyByFilled()
	 * @method bool isModifyByChanged()
	 * @method \Bitrix\Main\EO_User fillModifyBy()
	 * @method \int getAssignedById()
	 * @method \Bitrix\Crm\Contact setAssignedById(\int|\Bitrix\Main\DB\SqlExpression $assignedById)
	 * @method bool hasAssignedById()
	 * @method bool isAssignedByIdFilled()
	 * @method bool isAssignedByIdChanged()
	 * @method \int remindActualAssignedById()
	 * @method \int requireAssignedById()
	 * @method \Bitrix\Crm\Contact resetAssignedById()
	 * @method \Bitrix\Crm\Contact unsetAssignedById()
	 * @method \int fillAssignedById()
	 * @method \Bitrix\Main\EO_User getAssignedBy()
	 * @method \Bitrix\Main\EO_User remindActualAssignedBy()
	 * @method \Bitrix\Main\EO_User requireAssignedBy()
	 * @method \Bitrix\Crm\Contact setAssignedBy(\Bitrix\Main\EO_User $object)
	 * @method \Bitrix\Crm\Contact resetAssignedBy()
	 * @method \Bitrix\Crm\Contact unsetAssignedBy()
	 * @method bool hasAssignedBy()
	 * @method bool isAssignedByFilled()
	 * @method bool isAssignedByChanged()
	 * @method \Bitrix\Main\EO_User fillAssignedBy()
	 * @method \boolean getOpened()
	 * @method \Bitrix\Crm\Contact setOpened(\boolean|\Bitrix\Main\DB\SqlExpression $opened)
	 * @method bool hasOpened()
	 * @method bool isOpenedFilled()
	 * @method bool isOpenedChanged()
	 * @method \boolean remindActualOpened()
	 * @method \boolean requireOpened()
	 * @method \Bitrix\Crm\Contact resetOpened()
	 * @method \Bitrix\Crm\Contact unsetOpened()
	 * @method \boolean fillOpened()
	 * @method \int getCompanyId()
	 * @method \Bitrix\Crm\Contact setCompanyId(\int|\Bitrix\Main\DB\SqlExpression $companyId)
	 * @method bool hasCompanyId()
	 * @method bool isCompanyIdFilled()
	 * @method bool isCompanyIdChanged()
	 * @method \int remindActualCompanyId()
	 * @method \int requireCompanyId()
	 * @method \Bitrix\Crm\Contact resetCompanyId()
	 * @method \Bitrix\Crm\Contact unsetCompanyId()
	 * @method \int fillCompanyId()
	 * @method \Bitrix\Crm\Company getCompany()
	 * @method \Bitrix\Crm\Company remindActualCompany()
	 * @method \Bitrix\Crm\Company requireCompany()
	 * @method \Bitrix\Crm\Contact setCompany(\Bitrix\Crm\Company $object)
	 * @method \Bitrix\Crm\Contact resetCompany()
	 * @method \Bitrix\Crm\Contact unsetCompany()
	 * @method bool hasCompany()
	 * @method bool isCompanyFilled()
	 * @method bool isCompanyChanged()
	 * @method \Bitrix\Crm\Company fillCompany()
	 * @method \string getSourceId()
	 * @method \Bitrix\Crm\Contact setSourceId(\string|\Bitrix\Main\DB\SqlExpression $sourceId)
	 * @method bool hasSourceId()
	 * @method bool isSourceIdFilled()
	 * @method bool isSourceIdChanged()
	 * @method \string remindActualSourceId()
	 * @method \string requireSourceId()
	 * @method \Bitrix\Crm\Contact resetSourceId()
	 * @method \Bitrix\Crm\Contact unsetSourceId()
	 * @method \string fillSourceId()
	 * @method \Bitrix\Crm\EO_Status getSourceBy()
	 * @method \Bitrix\Crm\EO_Status remindActualSourceBy()
	 * @method \Bitrix\Crm\EO_Status requireSourceBy()
	 * @method \Bitrix\Crm\Contact setSourceBy(\Bitrix\Crm\EO_Status $object)
	 * @method \Bitrix\Crm\Contact resetSourceBy()
	 * @method \Bitrix\Crm\Contact unsetSourceBy()
	 * @method bool hasSourceBy()
	 * @method bool isSourceByFilled()
	 * @method bool isSourceByChanged()
	 * @method \Bitrix\Crm\EO_Status fillSourceBy()
	 * @method \string getSourceDescription()
	 * @method \Bitrix\Crm\Contact setSourceDescription(\string|\Bitrix\Main\DB\SqlExpression $sourceDescription)
	 * @method bool hasSourceDescription()
	 * @method bool isSourceDescriptionFilled()
	 * @method bool isSourceDescriptionChanged()
	 * @method \string remindActualSourceDescription()
	 * @method \string requireSourceDescription()
	 * @method \Bitrix\Crm\Contact resetSourceDescription()
	 * @method \Bitrix\Crm\Contact unsetSourceDescription()
	 * @method \string fillSourceDescription()
	 * @method ?\string getFullName()
	 * @method \Bitrix\Crm\Contact setFullName(?\string|\Bitrix\Main\DB\SqlExpression $fullName)
	 * @method bool hasFullName()
	 * @method bool isFullNameFilled()
	 * @method bool isFullNameChanged()
	 * @method ?\string remindActualFullName()
	 * @method ?\string requireFullName()
	 * @method \Bitrix\Crm\Contact resetFullName()
	 * @method \Bitrix\Crm\Contact unsetFullName()
	 * @method ?\string fillFullName()
	 * @method ?\string getName()
	 * @method \Bitrix\Crm\Contact setName(?\string|\Bitrix\Main\DB\SqlExpression $name)
	 * @method bool hasName()
	 * @method bool isNameFilled()
	 * @method bool isNameChanged()
	 * @method ?\string remindActualName()
	 * @method ?\string requireName()
	 * @method \Bitrix\Crm\Contact resetName()
	 * @method \Bitrix\Crm\Contact unsetName()
	 * @method ?\string fillName()
	 * @method ?\string getLastName()
	 * @method \Bitrix\Crm\Contact setLastName(?\string|\Bitrix\Main\DB\SqlExpression $lastName)
	 * @method bool hasLastName()
	 * @method bool isLastNameFilled()
	 * @method bool isLastNameChanged()
	 * @method ?\string remindActualLastName()
	 * @method ?\string requireLastName()
	 * @method \Bitrix\Crm\Contact resetLastName()
	 * @method \Bitrix\Crm\Contact unsetLastName()
	 * @method ?\string fillLastName()
	 * @method ?\string getSecondName()
	 * @method \Bitrix\Crm\Contact setSecondName(?\string|\Bitrix\Main\DB\SqlExpression $secondName)
	 * @method bool hasSecondName()
	 * @method bool isSecondNameFilled()
	 * @method bool isSecondNameChanged()
	 * @method ?\string remindActualSecondName()
	 * @method ?\string requireSecondName()
	 * @method \Bitrix\Crm\Contact resetSecondName()
	 * @method \Bitrix\Crm\Contact unsetSecondName()
	 * @method ?\string fillSecondName()
	 * @method \string getShortName()
	 * @method \string remindActualShortName()
	 * @method \string requireShortName()
	 * @method bool hasShortName()
	 * @method bool isShortNameFilled()
	 * @method \Bitrix\Crm\Contact unsetShortName()
	 * @method \string fillShortName()
	 * @method ?\int getPhoto()
	 * @method \Bitrix\Crm\Contact setPhoto(?\int|\Bitrix\Main\DB\SqlExpression $photo)
	 * @method bool hasPhoto()
	 * @method bool isPhotoFilled()
	 * @method bool isPhotoChanged()
	 * @method ?\int remindActualPhoto()
	 * @method ?\int requirePhoto()
	 * @method \Bitrix\Crm\Contact resetPhoto()
	 * @method \Bitrix\Crm\Contact unsetPhoto()
	 * @method ?\int fillPhoto()
	 * @method ?\string getPost()
	 * @method \Bitrix\Crm\Contact setPost(?\string|\Bitrix\Main\DB\SqlExpression $post)
	 * @method bool hasPost()
	 * @method bool isPostFilled()
	 * @method bool isPostChanged()
	 * @method ?\string remindActualPost()
	 * @method ?\string requirePost()
	 * @method \Bitrix\Crm\Contact resetPost()
	 * @method \Bitrix\Crm\Contact unsetPost()
	 * @method ?\string fillPost()
	 * @method ?\string getAddress()
	 * @method \Bitrix\Crm\Contact setAddress(?\string|\Bitrix\Main\DB\SqlExpression $address)
	 * @method bool hasAddress()
	 * @method bool isAddressFilled()
	 * @method bool isAddressChanged()
	 * @method ?\string remindActualAddress()
	 * @method ?\string requireAddress()
	 * @method \Bitrix\Crm\Contact resetAddress()
	 * @method \Bitrix\Crm\Contact unsetAddress()
	 * @method ?\string fillAddress()
	 * @method ?\string getComments()
	 * @method \Bitrix\Crm\Contact setComments(?\string|\Bitrix\Main\DB\SqlExpression $comments)
	 * @method bool hasComments()
	 * @method bool isCommentsFilled()
	 * @method bool isCommentsChanged()
	 * @method ?\string remindActualComments()
	 * @method ?\string requireComments()
	 * @method \Bitrix\Crm\Contact resetComments()
	 * @method \Bitrix\Crm\Contact unsetComments()
	 * @method ?\string fillComments()
	 * @method ?\int getLeadId()
	 * @method \Bitrix\Crm\Contact setLeadId(?\int|\Bitrix\Main\DB\SqlExpression $leadId)
	 * @method bool hasLeadId()
	 * @method bool isLeadIdFilled()
	 * @method bool isLeadIdChanged()
	 * @method ?\int remindActualLeadId()
	 * @method ?\int requireLeadId()
	 * @method \Bitrix\Crm\Contact resetLeadId()
	 * @method \Bitrix\Crm\Contact unsetLeadId()
	 * @method ?\int fillLeadId()
	 * @method \boolean getExport()
	 * @method \Bitrix\Crm\Contact setExport(\boolean|\Bitrix\Main\DB\SqlExpression $export)
	 * @method bool hasExport()
	 * @method bool isExportFilled()
	 * @method bool isExportChanged()
	 * @method \boolean remindActualExport()
	 * @method \boolean requireExport()
	 * @method \Bitrix\Crm\Contact resetExport()
	 * @method \Bitrix\Crm\Contact unsetExport()
	 * @method \boolean fillExport()
	 * @method ?\string getTypeId()
	 * @method \Bitrix\Crm\Contact setTypeId(?\string|\Bitrix\Main\DB\SqlExpression $typeId)
	 * @method bool hasTypeId()
	 * @method bool isTypeIdFilled()
	 * @method bool isTypeIdChanged()
	 * @method ?\string remindActualTypeId()
	 * @method ?\string requireTypeId()
	 * @method \Bitrix\Crm\Contact resetTypeId()
	 * @method \Bitrix\Crm\Contact unsetTypeId()
	 * @method ?\string fillTypeId()
	 * @method \Bitrix\Crm\EO_Status getTypeBy()
	 * @method \Bitrix\Crm\EO_Status remindActualTypeBy()
	 * @method \Bitrix\Crm\EO_Status requireTypeBy()
	 * @method \Bitrix\Crm\Contact setTypeBy(\Bitrix\Crm\EO_Status $object)
	 * @method \Bitrix\Crm\Contact resetTypeBy()
	 * @method \Bitrix\Crm\Contact unsetTypeBy()
	 * @method bool hasTypeBy()
	 * @method bool isTypeByFilled()
	 * @method bool isTypeByChanged()
	 * @method \Bitrix\Crm\EO_Status fillTypeBy()
	 * @method \int getWebformId()
	 * @method \Bitrix\Crm\Contact setWebformId(\int|\Bitrix\Main\DB\SqlExpression $webformId)
	 * @method bool hasWebformId()
	 * @method bool isWebformIdFilled()
	 * @method bool isWebformIdChanged()
	 * @method \int remindActualWebformId()
	 * @method \int requireWebformId()
	 * @method \Bitrix\Crm\Contact resetWebformId()
	 * @method \Bitrix\Crm\Contact unsetWebformId()
	 * @method \int fillWebformId()
	 * @method ?\string getOriginatorId()
	 * @method \Bitrix\Crm\Contact setOriginatorId(?\string|\Bitrix\Main\DB\SqlExpression $originatorId)
	 * @method bool hasOriginatorId()
	 * @method bool isOriginatorIdFilled()
	 * @method bool isOriginatorIdChanged()
	 * @method ?\string remindActualOriginatorId()
	 * @method ?\string requireOriginatorId()
	 * @method \Bitrix\Crm\Contact resetOriginatorId()
	 * @method \Bitrix\Crm\Contact unsetOriginatorId()
	 * @method ?\string fillOriginatorId()
	 * @method ?\string getOriginId()
	 * @method \Bitrix\Crm\Contact setOriginId(?\string|\Bitrix\Main\DB\SqlExpression $originId)
	 * @method bool hasOriginId()
	 * @method bool isOriginIdFilled()
	 * @method bool isOriginIdChanged()
	 * @method ?\string remindActualOriginId()
	 * @method ?\string requireOriginId()
	 * @method \Bitrix\Crm\Contact resetOriginId()
	 * @method \Bitrix\Crm\Contact unsetOriginId()
	 * @method ?\string fillOriginId()
	 * @method ?\string getOriginVersion()
	 * @method \Bitrix\Crm\Contact setOriginVersion(?\string|\Bitrix\Main\DB\SqlExpression $originVersion)
	 * @method bool hasOriginVersion()
	 * @method bool isOriginVersionFilled()
	 * @method bool isOriginVersionChanged()
	 * @method ?\string remindActualOriginVersion()
	 * @method ?\string requireOriginVersion()
	 * @method \Bitrix\Crm\Contact resetOriginVersion()
	 * @method \Bitrix\Crm\Contact unsetOriginVersion()
	 * @method ?\string fillOriginVersion()
	 * @method ?\Bitrix\Main\Type\Date getBirthdate()
	 * @method \Bitrix\Crm\Contact setBirthdate(?\Bitrix\Main\Type\Date|\Bitrix\Main\DB\SqlExpression $birthdate)
	 * @method bool hasBirthdate()
	 * @method bool isBirthdateFilled()
	 * @method bool isBirthdateChanged()
	 * @method ?\Bitrix\Main\Type\Date remindActualBirthdate()
	 * @method ?\Bitrix\Main\Type\Date requireBirthdate()
	 * @method \Bitrix\Crm\Contact resetBirthdate()
	 * @method \Bitrix\Crm\Contact unsetBirthdate()
	 * @method ?\Bitrix\Main\Type\Date fillBirthdate()
	 * @method \int getBirthdaySort()
	 * @method \Bitrix\Crm\Contact setBirthdaySort(\int|\Bitrix\Main\DB\SqlExpression $birthdaySort)
	 * @method bool hasBirthdaySort()
	 * @method bool isBirthdaySortFilled()
	 * @method bool isBirthdaySortChanged()
	 * @method \int remindActualBirthdaySort()
	 * @method \int requireBirthdaySort()
	 * @method \Bitrix\Crm\Contact resetBirthdaySort()
	 * @method \Bitrix\Crm\Contact unsetBirthdaySort()
	 * @method \int fillBirthdaySort()
	 * @method ?\string getHonorific()
	 * @method \Bitrix\Crm\Contact setHonorific(?\string|\Bitrix\Main\DB\SqlExpression $honorific)
	 * @method bool hasHonorific()
	 * @method bool isHonorificFilled()
	 * @method bool isHonorificChanged()
	 * @method ?\string remindActualHonorific()
	 * @method ?\string requireHonorific()
	 * @method \Bitrix\Crm\Contact resetHonorific()
	 * @method \Bitrix\Crm\Contact unsetHonorific()
	 * @method ?\string fillHonorific()
	 * @method \boolean getHasPhone()
	 * @method \Bitrix\Crm\Contact setHasPhone(\boolean|\Bitrix\Main\DB\SqlExpression $hasPhone)
	 * @method bool hasHasPhone()
	 * @method bool isHasPhoneFilled()
	 * @method bool isHasPhoneChanged()
	 * @method \boolean remindActualHasPhone()
	 * @method \boolean requireHasPhone()
	 * @method \Bitrix\Crm\Contact resetHasPhone()
	 * @method \Bitrix\Crm\Contact unsetHasPhone()
	 * @method \boolean fillHasPhone()
	 * @method \boolean getHasEmail()
	 * @method \Bitrix\Crm\Contact setHasEmail(\boolean|\Bitrix\Main\DB\SqlExpression $hasEmail)
	 * @method bool hasHasEmail()
	 * @method bool isHasEmailFilled()
	 * @method bool isHasEmailChanged()
	 * @method \boolean remindActualHasEmail()
	 * @method \boolean requireHasEmail()
	 * @method \Bitrix\Crm\Contact resetHasEmail()
	 * @method \Bitrix\Crm\Contact unsetHasEmail()
	 * @method \boolean fillHasEmail()
	 * @method \boolean getHasImol()
	 * @method \Bitrix\Crm\Contact setHasImol(\boolean|\Bitrix\Main\DB\SqlExpression $hasImol)
	 * @method bool hasHasImol()
	 * @method bool isHasImolFilled()
	 * @method bool isHasImolChanged()
	 * @method \boolean remindActualHasImol()
	 * @method \boolean requireHasImol()
	 * @method \Bitrix\Crm\Contact resetHasImol()
	 * @method \Bitrix\Crm\Contact unsetHasImol()
	 * @method \boolean fillHasImol()
	 * @method ?\int getFaceId()
	 * @method \Bitrix\Crm\Contact setFaceId(?\int|\Bitrix\Main\DB\SqlExpression $faceId)
	 * @method bool hasFaceId()
	 * @method bool isFaceIdFilled()
	 * @method bool isFaceIdChanged()
	 * @method ?\int remindActualFaceId()
	 * @method ?\int requireFaceId()
	 * @method \Bitrix\Crm\Contact resetFaceId()
	 * @method \Bitrix\Crm\Contact unsetFaceId()
	 * @method ?\int fillFaceId()
	 * @method ?\string getSearchContent()
	 * @method \Bitrix\Crm\Contact setSearchContent(?\string|\Bitrix\Main\DB\SqlExpression $searchContent)
	 * @method bool hasSearchContent()
	 * @method bool isSearchContentFilled()
	 * @method bool isSearchContentChanged()
	 * @method ?\string remindActualSearchContent()
	 * @method ?\string requireSearchContent()
	 * @method \Bitrix\Crm\Contact resetSearchContent()
	 * @method \Bitrix\Crm\Contact unsetSearchContent()
	 * @method ?\string fillSearchContent()
	 * @method \int getCategoryId()
	 * @method \Bitrix\Crm\Contact setCategoryId(\int|\Bitrix\Main\DB\SqlExpression $categoryId)
	 * @method bool hasCategoryId()
	 * @method bool isCategoryIdFilled()
	 * @method bool isCategoryIdChanged()
	 * @method \int remindActualCategoryId()
	 * @method \int requireCategoryId()
	 * @method \Bitrix\Crm\Contact resetCategoryId()
	 * @method \Bitrix\Crm\Contact unsetCategoryId()
	 * @method \int fillCategoryId()
	 * @method \int getLastActivityBy()
	 * @method \Bitrix\Crm\Contact setLastActivityBy(\int|\Bitrix\Main\DB\SqlExpression $lastActivityBy)
	 * @method bool hasLastActivityBy()
	 * @method bool isLastActivityByFilled()
	 * @method bool isLastActivityByChanged()
	 * @method \int remindActualLastActivityBy()
	 * @method \int requireLastActivityBy()
	 * @method \Bitrix\Crm\Contact resetLastActivityBy()
	 * @method \Bitrix\Crm\Contact unsetLastActivityBy()
	 * @method \int fillLastActivityBy()
	 * @method \Bitrix\Main\Type\DateTime getLastActivityTime()
	 * @method \Bitrix\Crm\Contact setLastActivityTime(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $lastActivityTime)
	 * @method bool hasLastActivityTime()
	 * @method bool isLastActivityTimeFilled()
	 * @method bool isLastActivityTimeChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualLastActivityTime()
	 * @method \Bitrix\Main\Type\DateTime requireLastActivityTime()
	 * @method \Bitrix\Crm\Contact resetLastActivityTime()
	 * @method \Bitrix\Crm\Contact unsetLastActivityTime()
	 * @method \Bitrix\Main\Type\DateTime fillLastActivityTime()
	 * @method \Bitrix\Crm\Binding\EO_ContactCompany_Collection getCompanyBindings()
	 * @method \Bitrix\Crm\Binding\EO_ContactCompany_Collection requireCompanyBindings()
	 * @method \Bitrix\Crm\Binding\EO_ContactCompany_Collection fillCompanyBindings()
	 * @method bool hasCompanyBindings()
	 * @method bool isCompanyBindingsFilled()
	 * @method bool isCompanyBindingsChanged()
	 * @method void addToCompanyBindings(\Bitrix\Crm\Binding\EO_ContactCompany $contactCompany)
	 * @method void removeFromCompanyBindings(\Bitrix\Crm\Binding\EO_ContactCompany $contactCompany)
	 * @method void removeAllCompanyBindings()
	 * @method \Bitrix\Crm\Contact resetCompanyBindings()
	 * @method \Bitrix\Crm\Contact unsetCompanyBindings()
	 * @method \string getLogin()
	 * @method \string remindActualLogin()
	 * @method \string requireLogin()
	 * @method bool hasLogin()
	 * @method bool isLoginFilled()
	 * @method \Bitrix\Crm\Contact unsetLogin()
	 * @method \string fillLogin()
	 * @method \Bitrix\Crm\EO_EventRelations getEventRelation()
	 * @method \Bitrix\Crm\EO_EventRelations remindActualEventRelation()
	 * @method \Bitrix\Crm\EO_EventRelations requireEventRelation()
	 * @method \Bitrix\Crm\Contact setEventRelation(\Bitrix\Crm\EO_EventRelations $object)
	 * @method \Bitrix\Crm\Contact resetEventRelation()
	 * @method \Bitrix\Crm\Contact unsetEventRelation()
	 * @method bool hasEventRelation()
	 * @method bool isEventRelationFilled()
	 * @method bool isEventRelationChanged()
	 * @method \Bitrix\Crm\EO_EventRelations fillEventRelation()
	 * @method \Bitrix\Crm\Observer\Entity\EO_Observer_Collection getObserverIds()
	 * @method \Bitrix\Crm\Observer\Entity\EO_Observer_Collection requireObserverIds()
	 * @method \Bitrix\Crm\Observer\Entity\EO_Observer_Collection fillObserverIds()
	 * @method bool hasObserverIds()
	 * @method bool isObserverIdsFilled()
	 * @method bool isObserverIdsChanged()
	 * @method void addToObserverIds(\Bitrix\Crm\Observer\Entity\EO_Observer $observer)
	 * @method void removeFromObserverIds(\Bitrix\Crm\Observer\Entity\EO_Observer $observer)
	 * @method void removeAllObserverIds()
	 * @method \Bitrix\Crm\Contact resetObserverIds()
	 * @method \Bitrix\Crm\Contact unsetObserverIds()
	 * @method \string getEmailHome()
	 * @method \string remindActualEmailHome()
	 * @method \string requireEmailHome()
	 * @method bool hasEmailHome()
	 * @method bool isEmailHomeFilled()
	 * @method \Bitrix\Crm\Contact unsetEmailHome()
	 * @method \string fillEmailHome()
	 * @method \string getEmailWork()
	 * @method \string remindActualEmailWork()
	 * @method \string requireEmailWork()
	 * @method bool hasEmailWork()
	 * @method bool isEmailWorkFilled()
	 * @method \Bitrix\Crm\Contact unsetEmailWork()
	 * @method \string fillEmailWork()
	 * @method \string getEmailMailing()
	 * @method \string remindActualEmailMailing()
	 * @method \string requireEmailMailing()
	 * @method bool hasEmailMailing()
	 * @method bool isEmailMailingFilled()
	 * @method \Bitrix\Crm\Contact unsetEmailMailing()
	 * @method \string fillEmailMailing()
	 * @method \string getPhoneMobile()
	 * @method \string remindActualPhoneMobile()
	 * @method \string requirePhoneMobile()
	 * @method bool hasPhoneMobile()
	 * @method bool isPhoneMobileFilled()
	 * @method \Bitrix\Crm\Contact unsetPhoneMobile()
	 * @method \string fillPhoneMobile()
	 * @method \string getPhoneWork()
	 * @method \string remindActualPhoneWork()
	 * @method \string requirePhoneWork()
	 * @method bool hasPhoneWork()
	 * @method bool isPhoneWorkFilled()
	 * @method \Bitrix\Crm\Contact unsetPhoneWork()
	 * @method \string fillPhoneWork()
	 * @method \string getPhoneMailing()
	 * @method \string remindActualPhoneMailing()
	 * @method \string requirePhoneMailing()
	 * @method bool hasPhoneMailing()
	 * @method bool isPhoneMailingFilled()
	 * @method \Bitrix\Crm\Contact unsetPhoneMailing()
	 * @method \string fillPhoneMailing()
	 * @method \string getImol()
	 * @method \string remindActualImol()
	 * @method \string requireImol()
	 * @method bool hasImol()
	 * @method bool isImolFilled()
	 * @method \Bitrix\Crm\Contact unsetImol()
	 * @method \string fillImol()
	 * @method \string getEmail()
	 * @method \string remindActualEmail()
	 * @method \string requireEmail()
	 * @method bool hasEmail()
	 * @method bool isEmailFilled()
	 * @method \Bitrix\Crm\Contact unsetEmail()
	 * @method \string fillEmail()
	 * @method \string getPhone()
	 * @method \string remindActualPhone()
	 * @method \string requirePhone()
	 * @method bool hasPhone()
	 * @method bool isPhoneFilled()
	 * @method \Bitrix\Crm\Contact unsetPhone()
	 * @method \string fillPhone()
	 * @method \Bitrix\Crm\EO_Utm getUtmSource()
	 * @method \Bitrix\Crm\EO_Utm remindActualUtmSource()
	 * @method \Bitrix\Crm\EO_Utm requireUtmSource()
	 * @method \Bitrix\Crm\Contact setUtmSource(\Bitrix\Crm\EO_Utm $object)
	 * @method \Bitrix\Crm\Contact resetUtmSource()
	 * @method \Bitrix\Crm\Contact unsetUtmSource()
	 * @method bool hasUtmSource()
	 * @method bool isUtmSourceFilled()
	 * @method bool isUtmSourceChanged()
	 * @method \Bitrix\Crm\EO_Utm fillUtmSource()
	 * @method \Bitrix\Crm\EO_Utm getUtmMedium()
	 * @method \Bitrix\Crm\EO_Utm remindActualUtmMedium()
	 * @method \Bitrix\Crm\EO_Utm requireUtmMedium()
	 * @method \Bitrix\Crm\Contact setUtmMedium(\Bitrix\Crm\EO_Utm $object)
	 * @method \Bitrix\Crm\Contact resetUtmMedium()
	 * @method \Bitrix\Crm\Contact unsetUtmMedium()
	 * @method bool hasUtmMedium()
	 * @method bool isUtmMediumFilled()
	 * @method bool isUtmMediumChanged()
	 * @method \Bitrix\Crm\EO_Utm fillUtmMedium()
	 * @method \Bitrix\Crm\EO_Utm getUtmCampaign()
	 * @method \Bitrix\Crm\EO_Utm remindActualUtmCampaign()
	 * @method \Bitrix\Crm\EO_Utm requireUtmCampaign()
	 * @method \Bitrix\Crm\Contact setUtmCampaign(\Bitrix\Crm\EO_Utm $object)
	 * @method \Bitrix\Crm\Contact resetUtmCampaign()
	 * @method \Bitrix\Crm\Contact unsetUtmCampaign()
	 * @method bool hasUtmCampaign()
	 * @method bool isUtmCampaignFilled()
	 * @method bool isUtmCampaignChanged()
	 * @method \Bitrix\Crm\EO_Utm fillUtmCampaign()
	 * @method \Bitrix\Crm\EO_Utm getUtmContent()
	 * @method \Bitrix\Crm\EO_Utm remindActualUtmContent()
	 * @method \Bitrix\Crm\EO_Utm requireUtmContent()
	 * @method \Bitrix\Crm\Contact setUtmContent(\Bitrix\Crm\EO_Utm $object)
	 * @method \Bitrix\Crm\Contact resetUtmContent()
	 * @method \Bitrix\Crm\Contact unsetUtmContent()
	 * @method bool hasUtmContent()
	 * @method bool isUtmContentFilled()
	 * @method bool isUtmContentChanged()
	 * @method \Bitrix\Crm\EO_Utm fillUtmContent()
	 * @method \Bitrix\Crm\EO_Utm getUtmTerm()
	 * @method \Bitrix\Crm\EO_Utm remindActualUtmTerm()
	 * @method \Bitrix\Crm\EO_Utm requireUtmTerm()
	 * @method \Bitrix\Crm\Contact setUtmTerm(\Bitrix\Crm\EO_Utm $object)
	 * @method \Bitrix\Crm\Contact resetUtmTerm()
	 * @method \Bitrix\Crm\Contact unsetUtmTerm()
	 * @method bool hasUtmTerm()
	 * @method bool isUtmTermFilled()
	 * @method bool isUtmTermChanged()
	 * @method \Bitrix\Crm\EO_Utm fillUtmTerm()
	 * @method \Bitrix\Crm\EO_ContactUts getUtsObject()
	 * @method \Bitrix\Crm\EO_ContactUts remindActualUtsObject()
	 * @method \Bitrix\Crm\EO_ContactUts requireUtsObject()
	 * @method \Bitrix\Crm\Contact setUtsObject(\Bitrix\Crm\EO_ContactUts $object)
	 * @method \Bitrix\Crm\Contact resetUtsObject()
	 * @method \Bitrix\Crm\Contact unsetUtsObject()
	 * @method bool hasUtsObject()
	 * @method bool isUtsObjectFilled()
	 * @method bool isUtsObjectChanged()
	 * @method \Bitrix\Crm\EO_ContactUts fillUtsObject()
	 * @method \int getUfCrm1634118294911()
	 * @method \int remindActualUfCrm1634118294911()
	 * @method \int requireUfCrm1634118294911()
	 * @method bool hasUfCrm1634118294911()
	 * @method bool isUfCrm1634118294911Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm1634118294911()
	 * @method \int fillUfCrm1634118294911()
	 * @method \Bitrix\Crm\Contact setUfCrm1634118294911(\int $ufCrm1634118294911)
	 * @method bool isUfCrm1634118294911Changed()
	 * @method \int getUfCrm1648109417()
	 * @method \int remindActualUfCrm1648109417()
	 * @method \int requireUfCrm1648109417()
	 * @method bool hasUfCrm1648109417()
	 * @method bool isUfCrm1648109417Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm1648109417()
	 * @method \int fillUfCrm1648109417()
	 * @method \Bitrix\Crm\Contact setUfCrm1648109417(\int $ufCrm1648109417)
	 * @method bool isUfCrm1648109417Changed()
	 * @method \float getUfCrm635660669eaad()
	 * @method \float remindActualUfCrm635660669eaad()
	 * @method \float requireUfCrm635660669eaad()
	 * @method bool hasUfCrm635660669eaad()
	 * @method bool isUfCrm635660669eaadFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm635660669eaad()
	 * @method \float fillUfCrm635660669eaad()
	 * @method \Bitrix\Crm\Contact setUfCrm635660669eaad(\float $ufCrm635660669eaad)
	 * @method bool isUfCrm635660669eaadChanged()
	 * @method \Bitrix\Main\Type\DateTime getUfCrm63566066a950c()
	 * @method \Bitrix\Main\Type\DateTime remindActualUfCrm63566066a950c()
	 * @method \Bitrix\Main\Type\DateTime requireUfCrm63566066a950c()
	 * @method bool hasUfCrm63566066a950c()
	 * @method bool isUfCrm63566066a950cFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566066a950c()
	 * @method \Bitrix\Main\Type\DateTime fillUfCrm63566066a950c()
	 * @method \Bitrix\Crm\Contact setUfCrm63566066a950c(\Bitrix\Main\Type\DateTime $ufCrm63566066a950c)
	 * @method bool isUfCrm63566066a950cChanged()
	 * @method \float getUfCrm63566066b32cc()
	 * @method \float remindActualUfCrm63566066b32cc()
	 * @method \float requireUfCrm63566066b32cc()
	 * @method bool hasUfCrm63566066b32cc()
	 * @method bool isUfCrm63566066b32ccFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566066b32cc()
	 * @method \float fillUfCrm63566066b32cc()
	 * @method \Bitrix\Crm\Contact setUfCrm63566066b32cc(\float $ufCrm63566066b32cc)
	 * @method bool isUfCrm63566066b32ccChanged()
	 * @method \float getUfCrm63566066bd11a()
	 * @method \float remindActualUfCrm63566066bd11a()
	 * @method \float requireUfCrm63566066bd11a()
	 * @method bool hasUfCrm63566066bd11a()
	 * @method bool isUfCrm63566066bd11aFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566066bd11a()
	 * @method \float fillUfCrm63566066bd11a()
	 * @method \Bitrix\Crm\Contact setUfCrm63566066bd11a(\float $ufCrm63566066bd11a)
	 * @method bool isUfCrm63566066bd11aChanged()
	 * @method \float getUfCrm63566066c6b49()
	 * @method \float remindActualUfCrm63566066c6b49()
	 * @method \float requireUfCrm63566066c6b49()
	 * @method bool hasUfCrm63566066c6b49()
	 * @method bool isUfCrm63566066c6b49Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566066c6b49()
	 * @method \float fillUfCrm63566066c6b49()
	 * @method \Bitrix\Crm\Contact setUfCrm63566066c6b49(\float $ufCrm63566066c6b49)
	 * @method bool isUfCrm63566066c6b49Changed()
	 * @method \float getUfCrm63566066d0545()
	 * @method \float remindActualUfCrm63566066d0545()
	 * @method \float requireUfCrm63566066d0545()
	 * @method bool hasUfCrm63566066d0545()
	 * @method bool isUfCrm63566066d0545Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566066d0545()
	 * @method \float fillUfCrm63566066d0545()
	 * @method \Bitrix\Crm\Contact setUfCrm63566066d0545(\float $ufCrm63566066d0545)
	 * @method bool isUfCrm63566066d0545Changed()
	 * @method \string getUfCrm63566066da0fd()
	 * @method \string remindActualUfCrm63566066da0fd()
	 * @method \string requireUfCrm63566066da0fd()
	 * @method bool hasUfCrm63566066da0fd()
	 * @method bool isUfCrm63566066da0fdFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566066da0fd()
	 * @method \string fillUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\Contact setUfCrm63566066da0fd(\string[] $ufCrm63566066da0fd)
	 * @method bool isUfCrm63566066da0fdChanged()
	 * @method \float getUfCrm63566066e4ee1()
	 * @method \float remindActualUfCrm63566066e4ee1()
	 * @method \float requireUfCrm63566066e4ee1()
	 * @method bool hasUfCrm63566066e4ee1()
	 * @method bool isUfCrm63566066e4ee1Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566066e4ee1()
	 * @method \float fillUfCrm63566066e4ee1()
	 * @method \Bitrix\Crm\Contact setUfCrm63566066e4ee1(\float $ufCrm63566066e4ee1)
	 * @method bool isUfCrm63566066e4ee1Changed()
	 * @method \Bitrix\Main\Type\DateTime getUfCrm63566066ee731()
	 * @method \Bitrix\Main\Type\DateTime remindActualUfCrm63566066ee731()
	 * @method \Bitrix\Main\Type\DateTime requireUfCrm63566066ee731()
	 * @method bool hasUfCrm63566066ee731()
	 * @method bool isUfCrm63566066ee731Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566066ee731()
	 * @method \Bitrix\Main\Type\DateTime fillUfCrm63566066ee731()
	 * @method \Bitrix\Crm\Contact setUfCrm63566066ee731(\Bitrix\Main\Type\DateTime $ufCrm63566066ee731)
	 * @method bool isUfCrm63566066ee731Changed()
	 * @method \string getUfCrm635660670414e()
	 * @method \string remindActualUfCrm635660670414e()
	 * @method \string requireUfCrm635660670414e()
	 * @method bool hasUfCrm635660670414e()
	 * @method bool isUfCrm635660670414eFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm635660670414e()
	 * @method \string fillUfCrm635660670414e()
	 * @method \Bitrix\Crm\Contact setUfCrm635660670414e(\string $ufCrm635660670414e)
	 * @method bool isUfCrm635660670414eChanged()
	 * @method \boolean getUfCrm635660670dcbc()
	 * @method \boolean remindActualUfCrm635660670dcbc()
	 * @method \boolean requireUfCrm635660670dcbc()
	 * @method bool hasUfCrm635660670dcbc()
	 * @method bool isUfCrm635660670dcbcFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm635660670dcbc()
	 * @method \boolean fillUfCrm635660670dcbc()
	 * @method \Bitrix\Crm\Contact setUfCrm635660670dcbc(\boolean $ufCrm635660670dcbc)
	 * @method bool isUfCrm635660670dcbcChanged()
	 * @method \Bitrix\Main\Type\DateTime getUfCrm6356606717487()
	 * @method \Bitrix\Main\Type\DateTime remindActualUfCrm6356606717487()
	 * @method \Bitrix\Main\Type\DateTime requireUfCrm6356606717487()
	 * @method bool hasUfCrm6356606717487()
	 * @method bool isUfCrm6356606717487Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm6356606717487()
	 * @method \Bitrix\Main\Type\DateTime fillUfCrm6356606717487()
	 * @method \Bitrix\Crm\Contact setUfCrm6356606717487(\Bitrix\Main\Type\DateTime $ufCrm6356606717487)
	 * @method bool isUfCrm6356606717487Changed()
	 * @method \Bitrix\Main\Type\DateTime getUfCrm6356606720b70()
	 * @method \Bitrix\Main\Type\DateTime remindActualUfCrm6356606720b70()
	 * @method \Bitrix\Main\Type\DateTime requireUfCrm6356606720b70()
	 * @method bool hasUfCrm6356606720b70()
	 * @method bool isUfCrm6356606720b70Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm6356606720b70()
	 * @method \Bitrix\Main\Type\DateTime fillUfCrm6356606720b70()
	 * @method \Bitrix\Crm\Contact setUfCrm6356606720b70(\Bitrix\Main\Type\DateTime $ufCrm6356606720b70)
	 * @method bool isUfCrm6356606720b70Changed()
	 * @method \Bitrix\Main\Type\DateTime getUfCrm635660672a33c()
	 * @method \Bitrix\Main\Type\DateTime remindActualUfCrm635660672a33c()
	 * @method \Bitrix\Main\Type\DateTime requireUfCrm635660672a33c()
	 * @method bool hasUfCrm635660672a33c()
	 * @method bool isUfCrm635660672a33cFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm635660672a33c()
	 * @method \Bitrix\Main\Type\DateTime fillUfCrm635660672a33c()
	 * @method \Bitrix\Crm\Contact setUfCrm635660672a33c(\Bitrix\Main\Type\DateTime $ufCrm635660672a33c)
	 * @method bool isUfCrm635660672a33cChanged()
	 * @method \Bitrix\Main\Type\DateTime getUfCrm6356606733e46()
	 * @method \Bitrix\Main\Type\DateTime remindActualUfCrm6356606733e46()
	 * @method \Bitrix\Main\Type\DateTime requireUfCrm6356606733e46()
	 * @method bool hasUfCrm6356606733e46()
	 * @method bool isUfCrm6356606733e46Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm6356606733e46()
	 * @method \Bitrix\Main\Type\DateTime fillUfCrm6356606733e46()
	 * @method \Bitrix\Crm\Contact setUfCrm6356606733e46(\Bitrix\Main\Type\DateTime $ufCrm6356606733e46)
	 * @method bool isUfCrm6356606733e46Changed()
	 * @method \int getUfCrm635660673d81b()
	 * @method \int remindActualUfCrm635660673d81b()
	 * @method \int requireUfCrm635660673d81b()
	 * @method bool hasUfCrm635660673d81b()
	 * @method bool isUfCrm635660673d81bFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm635660673d81b()
	 * @method \int fillUfCrm635660673d81b()
	 * @method \Bitrix\Crm\Contact setUfCrm635660673d81b(\int $ufCrm635660673d81b)
	 * @method bool isUfCrm635660673d81bChanged()
	 * @method \string getUfCrm6356606747c42()
	 * @method \string remindActualUfCrm6356606747c42()
	 * @method \string requireUfCrm6356606747c42()
	 * @method bool hasUfCrm6356606747c42()
	 * @method bool isUfCrm6356606747c42Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm6356606747c42()
	 * @method \string fillUfCrm6356606747c42()
	 * @method \Bitrix\Crm\Contact setUfCrm6356606747c42(\string[] $ufCrm6356606747c42)
	 * @method bool isUfCrm6356606747c42Changed()
	 * @method \int getUfCrm635660675112d()
	 * @method \int remindActualUfCrm635660675112d()
	 * @method \int requireUfCrm635660675112d()
	 * @method bool hasUfCrm635660675112d()
	 * @method bool isUfCrm635660675112dFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm635660675112d()
	 * @method \int fillUfCrm635660675112d()
	 * @method \Bitrix\Crm\Contact setUfCrm635660675112d(\int $ufCrm635660675112d)
	 * @method bool isUfCrm635660675112dChanged()
	 * @method \string getUfCrm635660675a9cc()
	 * @method \string remindActualUfCrm635660675a9cc()
	 * @method \string requireUfCrm635660675a9cc()
	 * @method bool hasUfCrm635660675a9cc()
	 * @method bool isUfCrm635660675a9ccFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm635660675a9cc()
	 * @method \string fillUfCrm635660675a9cc()
	 * @method \Bitrix\Crm\Contact setUfCrm635660675a9cc(\string $ufCrm635660675a9cc)
	 * @method bool isUfCrm635660675a9ccChanged()
	 * @method \int getUfCrm63566067642c7()
	 * @method \int remindActualUfCrm63566067642c7()
	 * @method \int requireUfCrm63566067642c7()
	 * @method bool hasUfCrm63566067642c7()
	 * @method bool isUfCrm63566067642c7Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566067642c7()
	 * @method \int fillUfCrm63566067642c7()
	 * @method \Bitrix\Crm\Contact setUfCrm63566067642c7(\int $ufCrm63566067642c7)
	 * @method bool isUfCrm63566067642c7Changed()
	 * @method \int getUfCrm635660676e6cf()
	 * @method \int remindActualUfCrm635660676e6cf()
	 * @method \int requireUfCrm635660676e6cf()
	 * @method bool hasUfCrm635660676e6cf()
	 * @method bool isUfCrm635660676e6cfFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm635660676e6cf()
	 * @method \int fillUfCrm635660676e6cf()
	 * @method \Bitrix\Crm\Contact setUfCrm635660676e6cf(\int $ufCrm635660676e6cf)
	 * @method bool isUfCrm635660676e6cfChanged()
	 * @method \string getUfCrm6356606778c80()
	 * @method \string remindActualUfCrm6356606778c80()
	 * @method \string requireUfCrm6356606778c80()
	 * @method bool hasUfCrm6356606778c80()
	 * @method bool isUfCrm6356606778c80Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm6356606778c80()
	 * @method \string fillUfCrm6356606778c80()
	 * @method \Bitrix\Crm\Contact setUfCrm6356606778c80(\string $ufCrm6356606778c80)
	 * @method bool isUfCrm6356606778c80Changed()
	 * @method \string getUfCrm6356606782474()
	 * @method \string remindActualUfCrm6356606782474()
	 * @method \string requireUfCrm6356606782474()
	 * @method bool hasUfCrm6356606782474()
	 * @method bool isUfCrm6356606782474Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm6356606782474()
	 * @method \string fillUfCrm6356606782474()
	 * @method \Bitrix\Crm\Contact setUfCrm6356606782474(\string[] $ufCrm6356606782474)
	 * @method bool isUfCrm6356606782474Changed()
	 * @method \string getUfCrm635660678bafd()
	 * @method \string remindActualUfCrm635660678bafd()
	 * @method \string requireUfCrm635660678bafd()
	 * @method bool hasUfCrm635660678bafd()
	 * @method bool isUfCrm635660678bafdFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm635660678bafd()
	 * @method \string fillUfCrm635660678bafd()
	 * @method \Bitrix\Crm\Contact setUfCrm635660678bafd(\string $ufCrm635660678bafd)
	 * @method bool isUfCrm635660678bafdChanged()
	 * @method \string getUfCrm6356606795e71()
	 * @method \string remindActualUfCrm6356606795e71()
	 * @method \string requireUfCrm6356606795e71()
	 * @method bool hasUfCrm6356606795e71()
	 * @method bool isUfCrm6356606795e71Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm6356606795e71()
	 * @method \string fillUfCrm6356606795e71()
	 * @method \Bitrix\Crm\Contact setUfCrm6356606795e71(\string $ufCrm6356606795e71)
	 * @method bool isUfCrm6356606795e71Changed()
	 * @method \int getUfCrm63566067a0a8e()
	 * @method \int remindActualUfCrm63566067a0a8e()
	 * @method \int requireUfCrm63566067a0a8e()
	 * @method bool hasUfCrm63566067a0a8e()
	 * @method bool isUfCrm63566067a0a8eFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566067a0a8e()
	 * @method \int fillUfCrm63566067a0a8e()
	 * @method \Bitrix\Crm\Contact setUfCrm63566067a0a8e(\int $ufCrm63566067a0a8e)
	 * @method bool isUfCrm63566067a0a8eChanged()
	 * @method \string getUfCrm63566067abca0()
	 * @method \string remindActualUfCrm63566067abca0()
	 * @method \string requireUfCrm63566067abca0()
	 * @method bool hasUfCrm63566067abca0()
	 * @method bool isUfCrm63566067abca0Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566067abca0()
	 * @method \string fillUfCrm63566067abca0()
	 * @method \Bitrix\Crm\Contact setUfCrm63566067abca0(\string $ufCrm63566067abca0)
	 * @method bool isUfCrm63566067abca0Changed()
	 * @method \string getUfCrm63566067b69bf()
	 * @method \string remindActualUfCrm63566067b69bf()
	 * @method \string requireUfCrm63566067b69bf()
	 * @method bool hasUfCrm63566067b69bf()
	 * @method bool isUfCrm63566067b69bfFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566067b69bf()
	 * @method \string fillUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\Contact setUfCrm63566067b69bf(\string[] $ufCrm63566067b69bf)
	 * @method bool isUfCrm63566067b69bfChanged()
	 * @method \string getUfCrm63566067c0433()
	 * @method \string remindActualUfCrm63566067c0433()
	 * @method \string requireUfCrm63566067c0433()
	 * @method bool hasUfCrm63566067c0433()
	 * @method bool isUfCrm63566067c0433Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566067c0433()
	 * @method \string fillUfCrm63566067c0433()
	 * @method \Bitrix\Crm\Contact setUfCrm63566067c0433(\string[] $ufCrm63566067c0433)
	 * @method bool isUfCrm63566067c0433Changed()
	 * @method \int getUfCrm63566067ccde6()
	 * @method \int remindActualUfCrm63566067ccde6()
	 * @method \int requireUfCrm63566067ccde6()
	 * @method bool hasUfCrm63566067ccde6()
	 * @method bool isUfCrm63566067ccde6Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566067ccde6()
	 * @method \int fillUfCrm63566067ccde6()
	 * @method \Bitrix\Crm\Contact setUfCrm63566067ccde6(\int $ufCrm63566067ccde6)
	 * @method bool isUfCrm63566067ccde6Changed()
	 * @method \string getUfCrm1669277612()
	 * @method \string remindActualUfCrm1669277612()
	 * @method \string requireUfCrm1669277612()
	 * @method bool hasUfCrm1669277612()
	 * @method bool isUfCrm1669277612Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm1669277612()
	 * @method \string fillUfCrm1669277612()
	 * @method \Bitrix\Crm\Contact setUfCrm1669277612(\string $ufCrm1669277612)
	 * @method bool isUfCrm1669277612Changed()
	 * @method \string getUfCrm1672300269()
	 * @method \string remindActualUfCrm1672300269()
	 * @method \string requireUfCrm1672300269()
	 * @method bool hasUfCrm1672300269()
	 * @method bool isUfCrm1672300269Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm1672300269()
	 * @method \string fillUfCrm1672300269()
	 * @method \Bitrix\Crm\Contact setUfCrm1672300269(\string[] $ufCrm1672300269)
	 * @method bool isUfCrm1672300269Changed()
	 * @method \string getUfCrm1677834985()
	 * @method \string remindActualUfCrm1677834985()
	 * @method \string requireUfCrm1677834985()
	 * @method bool hasUfCrm1677834985()
	 * @method bool isUfCrm1677834985Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm1677834985()
	 * @method \string fillUfCrm1677834985()
	 * @method \Bitrix\Crm\Contact setUfCrm1677834985(\string $ufCrm1677834985)
	 * @method bool isUfCrm1677834985Changed()
	 * @method \string getUfCrm1677835111()
	 * @method \string remindActualUfCrm1677835111()
	 * @method \string requireUfCrm1677835111()
	 * @method bool hasUfCrm1677835111()
	 * @method bool isUfCrm1677835111Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm1677835111()
	 * @method \string fillUfCrm1677835111()
	 * @method \Bitrix\Crm\Contact setUfCrm1677835111(\string $ufCrm1677835111)
	 * @method bool isUfCrm1677835111Changed()
	 * @method \Bitrix\Main\Type\DateTime getUfCrm64ae43c5c647f()
	 * @method \Bitrix\Main\Type\DateTime remindActualUfCrm64ae43c5c647f()
	 * @method \Bitrix\Main\Type\DateTime requireUfCrm64ae43c5c647f()
	 * @method bool hasUfCrm64ae43c5c647f()
	 * @method bool isUfCrm64ae43c5c647fFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c5c647f()
	 * @method \Bitrix\Main\Type\DateTime fillUfCrm64ae43c5c647f()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c5c647f(\Bitrix\Main\Type\DateTime $ufCrm64ae43c5c647f)
	 * @method bool isUfCrm64ae43c5c647fChanged()
	 * @method \string getUfCrm64ae43c5dac14()
	 * @method \string remindActualUfCrm64ae43c5dac14()
	 * @method \string requireUfCrm64ae43c5dac14()
	 * @method bool hasUfCrm64ae43c5dac14()
	 * @method bool isUfCrm64ae43c5dac14Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c5dac14()
	 * @method \string fillUfCrm64ae43c5dac14()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c5dac14(\string $ufCrm64ae43c5dac14)
	 * @method bool isUfCrm64ae43c5dac14Changed()
	 * @method \string getUfCrm64ae43c5e8634()
	 * @method \string remindActualUfCrm64ae43c5e8634()
	 * @method \string requireUfCrm64ae43c5e8634()
	 * @method bool hasUfCrm64ae43c5e8634()
	 * @method bool isUfCrm64ae43c5e8634Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c5e8634()
	 * @method \string fillUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c5e8634(\string[] $ufCrm64ae43c5e8634)
	 * @method bool isUfCrm64ae43c5e8634Changed()
	 * @method \boolean getUfCrm64ae43c6026c6()
	 * @method \boolean remindActualUfCrm64ae43c6026c6()
	 * @method \boolean requireUfCrm64ae43c6026c6()
	 * @method bool hasUfCrm64ae43c6026c6()
	 * @method bool isUfCrm64ae43c6026c6Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c6026c6()
	 * @method \boolean fillUfCrm64ae43c6026c6()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c6026c6(\boolean $ufCrm64ae43c6026c6)
	 * @method bool isUfCrm64ae43c6026c6Changed()
	 * @method \string getUfCrm64ae43c6105ac()
	 * @method \string remindActualUfCrm64ae43c6105ac()
	 * @method \string requireUfCrm64ae43c6105ac()
	 * @method bool hasUfCrm64ae43c6105ac()
	 * @method bool isUfCrm64ae43c6105acFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c6105ac()
	 * @method \string fillUfCrm64ae43c6105ac()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c6105ac(\string $ufCrm64ae43c6105ac)
	 * @method bool isUfCrm64ae43c6105acChanged()
	 * @method \Bitrix\Main\Type\DateTime getUfCrm64ae43c61f5ac()
	 * @method \Bitrix\Main\Type\DateTime remindActualUfCrm64ae43c61f5ac()
	 * @method \Bitrix\Main\Type\DateTime requireUfCrm64ae43c61f5ac()
	 * @method bool hasUfCrm64ae43c61f5ac()
	 * @method bool isUfCrm64ae43c61f5acFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c61f5ac()
	 * @method \Bitrix\Main\Type\DateTime fillUfCrm64ae43c61f5ac()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c61f5ac(\Bitrix\Main\Type\DateTime $ufCrm64ae43c61f5ac)
	 * @method bool isUfCrm64ae43c61f5acChanged()
	 * @method \float getUfCrm64ae43c62cdce()
	 * @method \float remindActualUfCrm64ae43c62cdce()
	 * @method \float requireUfCrm64ae43c62cdce()
	 * @method bool hasUfCrm64ae43c62cdce()
	 * @method bool isUfCrm64ae43c62cdceFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c62cdce()
	 * @method \float fillUfCrm64ae43c62cdce()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c62cdce(\float $ufCrm64ae43c62cdce)
	 * @method bool isUfCrm64ae43c62cdceChanged()
	 * @method \string getUfCrm64ae43c63a0ec()
	 * @method \string remindActualUfCrm64ae43c63a0ec()
	 * @method \string requireUfCrm64ae43c63a0ec()
	 * @method bool hasUfCrm64ae43c63a0ec()
	 * @method bool isUfCrm64ae43c63a0ecFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c63a0ec()
	 * @method \string fillUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c63a0ec(\string[] $ufCrm64ae43c63a0ec)
	 * @method bool isUfCrm64ae43c63a0ecChanged()
	 * @method \boolean getUfCrm64ae43c64fe65()
	 * @method \boolean remindActualUfCrm64ae43c64fe65()
	 * @method \boolean requireUfCrm64ae43c64fe65()
	 * @method bool hasUfCrm64ae43c64fe65()
	 * @method bool isUfCrm64ae43c64fe65Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c64fe65()
	 * @method \boolean fillUfCrm64ae43c64fe65()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c64fe65(\boolean $ufCrm64ae43c64fe65)
	 * @method bool isUfCrm64ae43c64fe65Changed()
	 * @method \string getUfCrm64ae43c65f164()
	 * @method \string remindActualUfCrm64ae43c65f164()
	 * @method \string requireUfCrm64ae43c65f164()
	 * @method bool hasUfCrm64ae43c65f164()
	 * @method bool isUfCrm64ae43c65f164Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c65f164()
	 * @method \string fillUfCrm64ae43c65f164()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c65f164(\string $ufCrm64ae43c65f164)
	 * @method bool isUfCrm64ae43c65f164Changed()
	 * @method \string getUfCrm64ae43c66cdd2()
	 * @method \string remindActualUfCrm64ae43c66cdd2()
	 * @method \string requireUfCrm64ae43c66cdd2()
	 * @method bool hasUfCrm64ae43c66cdd2()
	 * @method bool isUfCrm64ae43c66cdd2Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c66cdd2()
	 * @method \string fillUfCrm64ae43c66cdd2()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c66cdd2(\string $ufCrm64ae43c66cdd2)
	 * @method bool isUfCrm64ae43c66cdd2Changed()
	 * @method \string getUfCrm64ae43c679c97()
	 * @method \string remindActualUfCrm64ae43c679c97()
	 * @method \string requireUfCrm64ae43c679c97()
	 * @method bool hasUfCrm64ae43c679c97()
	 * @method bool isUfCrm64ae43c679c97Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c679c97()
	 * @method \string fillUfCrm64ae43c679c97()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c679c97(\string $ufCrm64ae43c679c97)
	 * @method bool isUfCrm64ae43c679c97Changed()
	 * @method \string getUfCrm64ae43c68978d()
	 * @method \string remindActualUfCrm64ae43c68978d()
	 * @method \string requireUfCrm64ae43c68978d()
	 * @method bool hasUfCrm64ae43c68978d()
	 * @method bool isUfCrm64ae43c68978dFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c68978d()
	 * @method \string fillUfCrm64ae43c68978d()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c68978d(\string $ufCrm64ae43c68978d)
	 * @method bool isUfCrm64ae43c68978dChanged()
	 * @method \Bitrix\Main\Type\DateTime getUfCrm64ae43c696a97()
	 * @method \Bitrix\Main\Type\DateTime remindActualUfCrm64ae43c696a97()
	 * @method \Bitrix\Main\Type\DateTime requireUfCrm64ae43c696a97()
	 * @method bool hasUfCrm64ae43c696a97()
	 * @method bool isUfCrm64ae43c696a97Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c696a97()
	 * @method \Bitrix\Main\Type\DateTime fillUfCrm64ae43c696a97()
	 * @method \Bitrix\Crm\Contact setUfCrm64ae43c696a97(\Bitrix\Main\Type\DateTime $ufCrm64ae43c696a97)
	 * @method bool isUfCrm64ae43c696a97Changed()
	 * @method \string getUfMws1cContactGuid()
	 * @method \string remindActualUfMws1cContactGuid()
	 * @method \string requireUfMws1cContactGuid()
	 * @method bool hasUfMws1cContactGuid()
	 * @method bool isUfMws1cContactGuidFilled()
	 * @method \Bitrix\Crm\Contact unsetUfMws1cContactGuid()
	 * @method \string fillUfMws1cContactGuid()
	 * @method \Bitrix\Crm\Contact setUfMws1cContactGuid(\string $ufMws1cContactGuid)
	 * @method bool isUfMws1cContactGuidChanged()
	 * @method \int getUfHlTest()
	 * @method \int remindActualUfHlTest()
	 * @method \int requireUfHlTest()
	 * @method bool hasUfHlTest()
	 * @method bool isUfHlTestFilled()
	 * @method \Bitrix\Crm\Contact unsetUfHlTest()
	 * @method \int fillUfHlTest()
	 * @method \Bitrix\Crm\Contact setUfHlTest(\int $ufHlTest)
	 * @method bool isUfHlTestChanged()
	 * @method \string getUfCrm63566067d6bf9()
	 * @method \string remindActualUfCrm63566067d6bf9()
	 * @method \string requireUfCrm63566067d6bf9()
	 * @method bool hasUfCrm63566067d6bf9()
	 * @method bool isUfCrm63566067d6bf9Filled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566067d6bf9()
	 * @method \string fillUfCrm63566067d6bf9()
	 * @method \Bitrix\Crm\Contact setUfCrm63566067d6bf9(\string $ufCrm63566067d6bf9)
	 * @method bool isUfCrm63566067d6bf9Changed()
	 * @method \EO_ProgersMonthClosed getUfHlTestRef()
	 * @method \EO_ProgersMonthClosed remindActualUfHlTestRef()
	 * @method \EO_ProgersMonthClosed requireUfHlTestRef()
	 * @method \Bitrix\Crm\Contact setUfHlTestRef(\EO_ProgersMonthClosed $object)
	 * @method \Bitrix\Crm\Contact resetUfHlTestRef()
	 * @method \Bitrix\Crm\Contact unsetUfHlTestRef()
	 * @method bool hasUfHlTestRef()
	 * @method bool isUfHlTestRefFilled()
	 * @method bool isUfHlTestRefChanged()
	 * @method \EO_ProgersMonthClosed fillUfHlTestRef()
	 * @method \int getUfCrm63566066da0fdSingle()
	 * @method \int remindActualUfCrm63566066da0fdSingle()
	 * @method \int requireUfCrm63566066da0fdSingle()
	 * @method bool hasUfCrm63566066da0fdSingle()
	 * @method bool isUfCrm63566066da0fdSingleFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566066da0fdSingle()
	 * @method \int fillUfCrm63566066da0fdSingle()
	 * @method \Bitrix\Main\Type\DateTime getUfCrm6356606747c42Single()
	 * @method \Bitrix\Main\Type\DateTime remindActualUfCrm6356606747c42Single()
	 * @method \Bitrix\Main\Type\DateTime requireUfCrm6356606747c42Single()
	 * @method bool hasUfCrm6356606747c42Single()
	 * @method bool isUfCrm6356606747c42SingleFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm6356606747c42Single()
	 * @method \Bitrix\Main\Type\DateTime fillUfCrm6356606747c42Single()
	 * @method \int getUfCrm6356606782474Single()
	 * @method \int remindActualUfCrm6356606782474Single()
	 * @method \int requireUfCrm6356606782474Single()
	 * @method bool hasUfCrm6356606782474Single()
	 * @method bool isUfCrm6356606782474SingleFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm6356606782474Single()
	 * @method \int fillUfCrm6356606782474Single()
	 * @method \string getUfCrm63566067b69bfSingle()
	 * @method \string remindActualUfCrm63566067b69bfSingle()
	 * @method \string requireUfCrm63566067b69bfSingle()
	 * @method bool hasUfCrm63566067b69bfSingle()
	 * @method bool isUfCrm63566067b69bfSingleFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566067b69bfSingle()
	 * @method \string fillUfCrm63566067b69bfSingle()
	 * @method \float getUfCrm63566067c0433Single()
	 * @method \float remindActualUfCrm63566067c0433Single()
	 * @method \float requireUfCrm63566067c0433Single()
	 * @method bool hasUfCrm63566067c0433Single()
	 * @method bool isUfCrm63566067c0433SingleFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm63566067c0433Single()
	 * @method \float fillUfCrm63566067c0433Single()
	 * @method \int getUfCrm1672300269Single()
	 * @method \int remindActualUfCrm1672300269Single()
	 * @method \int requireUfCrm1672300269Single()
	 * @method bool hasUfCrm1672300269Single()
	 * @method bool isUfCrm1672300269SingleFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm1672300269Single()
	 * @method \int fillUfCrm1672300269Single()
	 * @method \string getUfCrm64ae43c5e8634Single()
	 * @method \string remindActualUfCrm64ae43c5e8634Single()
	 * @method \string requireUfCrm64ae43c5e8634Single()
	 * @method bool hasUfCrm64ae43c5e8634Single()
	 * @method bool isUfCrm64ae43c5e8634SingleFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c5e8634Single()
	 * @method \string fillUfCrm64ae43c5e8634Single()
	 * @method \int getUfCrm64ae43c63a0ecSingle()
	 * @method \int remindActualUfCrm64ae43c63a0ecSingle()
	 * @method \int requireUfCrm64ae43c63a0ecSingle()
	 * @method bool hasUfCrm64ae43c63a0ecSingle()
	 * @method bool isUfCrm64ae43c63a0ecSingleFilled()
	 * @method \Bitrix\Crm\Contact unsetUfCrm64ae43c63a0ecSingle()
	 * @method \int fillUfCrm64ae43c63a0ecSingle()
	 * @method \string getInitials()
	 * @method \string remindActualInitials()
	 * @method \string requireInitials()
	 * @method bool hasInitials()
	 * @method bool isInitialsFilled()
	 * @method \Bitrix\Crm\Contact unsetInitials()
	 * @method \string fillInitials()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Crm\Contact set($fieldName, $value)
	 * @method \Bitrix\Crm\Contact reset($fieldName)
	 * @method \Bitrix\Crm\Contact unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Crm\Contact wakeUp($data)
	 */
	class EO_Contact {
		/* @var \Bitrix\Crm\ContactTable */
		static public $dataClass = '\Bitrix\Crm\ContactTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Crm {
	/**
	 * EO_Contact_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \Bitrix\Main\Type\DateTime[] getDateCreateList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateCreate()
	 * @method \Bitrix\Main\Type\DateTime[] getDateModifyList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateModify()
	 * @method \int[] getCreatedByIdList()
	 * @method \int[] fillCreatedById()
	 * @method \Bitrix\Main\EO_User[] getCreatedByList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getCreatedByCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillCreatedBy()
	 * @method \int[] getModifyByIdList()
	 * @method \int[] fillModifyById()
	 * @method \Bitrix\Main\EO_User[] getModifyByList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getModifyByCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillModifyBy()
	 * @method \int[] getAssignedByIdList()
	 * @method \int[] fillAssignedById()
	 * @method \Bitrix\Main\EO_User[] getAssignedByList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getAssignedByCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillAssignedBy()
	 * @method \boolean[] getOpenedList()
	 * @method \boolean[] fillOpened()
	 * @method \int[] getCompanyIdList()
	 * @method \int[] fillCompanyId()
	 * @method \Bitrix\Crm\Company[] getCompanyList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getCompanyCollection()
	 * @method \Bitrix\Crm\EO_Company_Collection fillCompany()
	 * @method \string[] getSourceIdList()
	 * @method \string[] fillSourceId()
	 * @method \Bitrix\Crm\EO_Status[] getSourceByList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getSourceByCollection()
	 * @method \Bitrix\Crm\EO_Status_Collection fillSourceBy()
	 * @method \string[] getSourceDescriptionList()
	 * @method \string[] fillSourceDescription()
	 * @method ?\string[] getFullNameList()
	 * @method ?\string[] fillFullName()
	 * @method ?\string[] getNameList()
	 * @method ?\string[] fillName()
	 * @method ?\string[] getLastNameList()
	 * @method ?\string[] fillLastName()
	 * @method ?\string[] getSecondNameList()
	 * @method ?\string[] fillSecondName()
	 * @method \string[] getShortNameList()
	 * @method \string[] fillShortName()
	 * @method ?\int[] getPhotoList()
	 * @method ?\int[] fillPhoto()
	 * @method ?\string[] getPostList()
	 * @method ?\string[] fillPost()
	 * @method ?\string[] getAddressList()
	 * @method ?\string[] fillAddress()
	 * @method ?\string[] getCommentsList()
	 * @method ?\string[] fillComments()
	 * @method ?\int[] getLeadIdList()
	 * @method ?\int[] fillLeadId()
	 * @method \boolean[] getExportList()
	 * @method \boolean[] fillExport()
	 * @method ?\string[] getTypeIdList()
	 * @method ?\string[] fillTypeId()
	 * @method \Bitrix\Crm\EO_Status[] getTypeByList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getTypeByCollection()
	 * @method \Bitrix\Crm\EO_Status_Collection fillTypeBy()
	 * @method \int[] getWebformIdList()
	 * @method \int[] fillWebformId()
	 * @method ?\string[] getOriginatorIdList()
	 * @method ?\string[] fillOriginatorId()
	 * @method ?\string[] getOriginIdList()
	 * @method ?\string[] fillOriginId()
	 * @method ?\string[] getOriginVersionList()
	 * @method ?\string[] fillOriginVersion()
	 * @method ?\Bitrix\Main\Type\Date[] getBirthdateList()
	 * @method ?\Bitrix\Main\Type\Date[] fillBirthdate()
	 * @method \int[] getBirthdaySortList()
	 * @method \int[] fillBirthdaySort()
	 * @method ?\string[] getHonorificList()
	 * @method ?\string[] fillHonorific()
	 * @method \boolean[] getHasPhoneList()
	 * @method \boolean[] fillHasPhone()
	 * @method \boolean[] getHasEmailList()
	 * @method \boolean[] fillHasEmail()
	 * @method \boolean[] getHasImolList()
	 * @method \boolean[] fillHasImol()
	 * @method ?\int[] getFaceIdList()
	 * @method ?\int[] fillFaceId()
	 * @method ?\string[] getSearchContentList()
	 * @method ?\string[] fillSearchContent()
	 * @method \int[] getCategoryIdList()
	 * @method \int[] fillCategoryId()
	 * @method \int[] getLastActivityByList()
	 * @method \int[] fillLastActivityBy()
	 * @method \Bitrix\Main\Type\DateTime[] getLastActivityTimeList()
	 * @method \Bitrix\Main\Type\DateTime[] fillLastActivityTime()
	 * @method \Bitrix\Crm\Binding\EO_ContactCompany_Collection[] getCompanyBindingsList()
	 * @method \Bitrix\Crm\Binding\EO_ContactCompany_Collection getCompanyBindingsCollection()
	 * @method \Bitrix\Crm\Binding\EO_ContactCompany_Collection fillCompanyBindings()
	 * @method \string[] getLoginList()
	 * @method \string[] fillLogin()
	 * @method \Bitrix\Crm\EO_EventRelations[] getEventRelationList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getEventRelationCollection()
	 * @method \Bitrix\Crm\EO_EventRelations_Collection fillEventRelation()
	 * @method \Bitrix\Crm\Observer\Entity\EO_Observer_Collection[] getObserverIdsList()
	 * @method \Bitrix\Crm\Observer\Entity\EO_Observer_Collection getObserverIdsCollection()
	 * @method \Bitrix\Crm\Observer\Entity\EO_Observer_Collection fillObserverIds()
	 * @method \string[] getEmailHomeList()
	 * @method \string[] fillEmailHome()
	 * @method \string[] getEmailWorkList()
	 * @method \string[] fillEmailWork()
	 * @method \string[] getEmailMailingList()
	 * @method \string[] fillEmailMailing()
	 * @method \string[] getPhoneMobileList()
	 * @method \string[] fillPhoneMobile()
	 * @method \string[] getPhoneWorkList()
	 * @method \string[] fillPhoneWork()
	 * @method \string[] getPhoneMailingList()
	 * @method \string[] fillPhoneMailing()
	 * @method \string[] getImolList()
	 * @method \string[] fillImol()
	 * @method \string[] getEmailList()
	 * @method \string[] fillEmail()
	 * @method \string[] getPhoneList()
	 * @method \string[] fillPhone()
	 * @method \Bitrix\Crm\EO_Utm[] getUtmSourceList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getUtmSourceCollection()
	 * @method \Bitrix\Crm\EO_Utm_Collection fillUtmSource()
	 * @method \Bitrix\Crm\EO_Utm[] getUtmMediumList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getUtmMediumCollection()
	 * @method \Bitrix\Crm\EO_Utm_Collection fillUtmMedium()
	 * @method \Bitrix\Crm\EO_Utm[] getUtmCampaignList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getUtmCampaignCollection()
	 * @method \Bitrix\Crm\EO_Utm_Collection fillUtmCampaign()
	 * @method \Bitrix\Crm\EO_Utm[] getUtmContentList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getUtmContentCollection()
	 * @method \Bitrix\Crm\EO_Utm_Collection fillUtmContent()
	 * @method \Bitrix\Crm\EO_Utm[] getUtmTermList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getUtmTermCollection()
	 * @method \Bitrix\Crm\EO_Utm_Collection fillUtmTerm()
	 * @method \Bitrix\Crm\EO_ContactUts[] getUtsObjectList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getUtsObjectCollection()
	 * @method \Bitrix\Crm\EO_ContactUts_Collection fillUtsObject()
	 * @method \int[] getUfCrm1634118294911List()
	 * @method \int[] fillUfCrm1634118294911()
	 * @method \int[] getUfCrm1648109417List()
	 * @method \int[] fillUfCrm1648109417()
	 * @method \float[] getUfCrm635660669eaadList()
	 * @method \float[] fillUfCrm635660669eaad()
	 * @method \Bitrix\Main\Type\DateTime[] getUfCrm63566066a950cList()
	 * @method \Bitrix\Main\Type\DateTime[] fillUfCrm63566066a950c()
	 * @method \float[] getUfCrm63566066b32ccList()
	 * @method \float[] fillUfCrm63566066b32cc()
	 * @method \float[] getUfCrm63566066bd11aList()
	 * @method \float[] fillUfCrm63566066bd11a()
	 * @method \float[] getUfCrm63566066c6b49List()
	 * @method \float[] fillUfCrm63566066c6b49()
	 * @method \float[] getUfCrm63566066d0545List()
	 * @method \float[] fillUfCrm63566066d0545()
	 * @method \string[] getUfCrm63566066da0fdList()
	 * @method \string[] fillUfCrm63566066da0fd()
	 * @method \float[] getUfCrm63566066e4ee1List()
	 * @method \float[] fillUfCrm63566066e4ee1()
	 * @method \Bitrix\Main\Type\DateTime[] getUfCrm63566066ee731List()
	 * @method \Bitrix\Main\Type\DateTime[] fillUfCrm63566066ee731()
	 * @method \string[] getUfCrm635660670414eList()
	 * @method \string[] fillUfCrm635660670414e()
	 * @method \boolean[] getUfCrm635660670dcbcList()
	 * @method \boolean[] fillUfCrm635660670dcbc()
	 * @method \Bitrix\Main\Type\DateTime[] getUfCrm6356606717487List()
	 * @method \Bitrix\Main\Type\DateTime[] fillUfCrm6356606717487()
	 * @method \Bitrix\Main\Type\DateTime[] getUfCrm6356606720b70List()
	 * @method \Bitrix\Main\Type\DateTime[] fillUfCrm6356606720b70()
	 * @method \Bitrix\Main\Type\DateTime[] getUfCrm635660672a33cList()
	 * @method \Bitrix\Main\Type\DateTime[] fillUfCrm635660672a33c()
	 * @method \Bitrix\Main\Type\DateTime[] getUfCrm6356606733e46List()
	 * @method \Bitrix\Main\Type\DateTime[] fillUfCrm6356606733e46()
	 * @method \int[] getUfCrm635660673d81bList()
	 * @method \int[] fillUfCrm635660673d81b()
	 * @method \string[] getUfCrm6356606747c42List()
	 * @method \string[] fillUfCrm6356606747c42()
	 * @method \int[] getUfCrm635660675112dList()
	 * @method \int[] fillUfCrm635660675112d()
	 * @method \string[] getUfCrm635660675a9ccList()
	 * @method \string[] fillUfCrm635660675a9cc()
	 * @method \int[] getUfCrm63566067642c7List()
	 * @method \int[] fillUfCrm63566067642c7()
	 * @method \int[] getUfCrm635660676e6cfList()
	 * @method \int[] fillUfCrm635660676e6cf()
	 * @method \string[] getUfCrm6356606778c80List()
	 * @method \string[] fillUfCrm6356606778c80()
	 * @method \string[] getUfCrm6356606782474List()
	 * @method \string[] fillUfCrm6356606782474()
	 * @method \string[] getUfCrm635660678bafdList()
	 * @method \string[] fillUfCrm635660678bafd()
	 * @method \string[] getUfCrm6356606795e71List()
	 * @method \string[] fillUfCrm6356606795e71()
	 * @method \int[] getUfCrm63566067a0a8eList()
	 * @method \int[] fillUfCrm63566067a0a8e()
	 * @method \string[] getUfCrm63566067abca0List()
	 * @method \string[] fillUfCrm63566067abca0()
	 * @method \string[] getUfCrm63566067b69bfList()
	 * @method \string[] fillUfCrm63566067b69bf()
	 * @method \string[] getUfCrm63566067c0433List()
	 * @method \string[] fillUfCrm63566067c0433()
	 * @method \int[] getUfCrm63566067ccde6List()
	 * @method \int[] fillUfCrm63566067ccde6()
	 * @method \string[] getUfCrm1669277612List()
	 * @method \string[] fillUfCrm1669277612()
	 * @method \string[] getUfCrm1672300269List()
	 * @method \string[] fillUfCrm1672300269()
	 * @method \string[] getUfCrm1677834985List()
	 * @method \string[] fillUfCrm1677834985()
	 * @method \string[] getUfCrm1677835111List()
	 * @method \string[] fillUfCrm1677835111()
	 * @method \Bitrix\Main\Type\DateTime[] getUfCrm64ae43c5c647fList()
	 * @method \Bitrix\Main\Type\DateTime[] fillUfCrm64ae43c5c647f()
	 * @method \string[] getUfCrm64ae43c5dac14List()
	 * @method \string[] fillUfCrm64ae43c5dac14()
	 * @method \string[] getUfCrm64ae43c5e8634List()
	 * @method \string[] fillUfCrm64ae43c5e8634()
	 * @method \boolean[] getUfCrm64ae43c6026c6List()
	 * @method \boolean[] fillUfCrm64ae43c6026c6()
	 * @method \string[] getUfCrm64ae43c6105acList()
	 * @method \string[] fillUfCrm64ae43c6105ac()
	 * @method \Bitrix\Main\Type\DateTime[] getUfCrm64ae43c61f5acList()
	 * @method \Bitrix\Main\Type\DateTime[] fillUfCrm64ae43c61f5ac()
	 * @method \float[] getUfCrm64ae43c62cdceList()
	 * @method \float[] fillUfCrm64ae43c62cdce()
	 * @method \string[] getUfCrm64ae43c63a0ecList()
	 * @method \string[] fillUfCrm64ae43c63a0ec()
	 * @method \boolean[] getUfCrm64ae43c64fe65List()
	 * @method \boolean[] fillUfCrm64ae43c64fe65()
	 * @method \string[] getUfCrm64ae43c65f164List()
	 * @method \string[] fillUfCrm64ae43c65f164()
	 * @method \string[] getUfCrm64ae43c66cdd2List()
	 * @method \string[] fillUfCrm64ae43c66cdd2()
	 * @method \string[] getUfCrm64ae43c679c97List()
	 * @method \string[] fillUfCrm64ae43c679c97()
	 * @method \string[] getUfCrm64ae43c68978dList()
	 * @method \string[] fillUfCrm64ae43c68978d()
	 * @method \Bitrix\Main\Type\DateTime[] getUfCrm64ae43c696a97List()
	 * @method \Bitrix\Main\Type\DateTime[] fillUfCrm64ae43c696a97()
	 * @method \string[] getUfMws1cContactGuidList()
	 * @method \string[] fillUfMws1cContactGuid()
	 * @method \int[] getUfHlTestList()
	 * @method \int[] fillUfHlTest()
	 * @method \string[] getUfCrm63566067d6bf9List()
	 * @method \string[] fillUfCrm63566067d6bf9()
	 * @method \EO_ProgersMonthClosed[] getUfHlTestRefList()
	 * @method \Bitrix\Crm\EO_Contact_Collection getUfHlTestRefCollection()
	 * @method \EO_ProgersMonthClosed_Collection fillUfHlTestRef()
	 * @method \int[] getUfCrm63566066da0fdSingleList()
	 * @method \int[] fillUfCrm63566066da0fdSingle()
	 * @method \Bitrix\Main\Type\DateTime[] getUfCrm6356606747c42SingleList()
	 * @method \Bitrix\Main\Type\DateTime[] fillUfCrm6356606747c42Single()
	 * @method \int[] getUfCrm6356606782474SingleList()
	 * @method \int[] fillUfCrm6356606782474Single()
	 * @method \string[] getUfCrm63566067b69bfSingleList()
	 * @method \string[] fillUfCrm63566067b69bfSingle()
	 * @method \float[] getUfCrm63566067c0433SingleList()
	 * @method \float[] fillUfCrm63566067c0433Single()
	 * @method \int[] getUfCrm1672300269SingleList()
	 * @method \int[] fillUfCrm1672300269Single()
	 * @method \string[] getUfCrm64ae43c5e8634SingleList()
	 * @method \string[] fillUfCrm64ae43c5e8634Single()
	 * @method \int[] getUfCrm64ae43c63a0ecSingleList()
	 * @method \int[] fillUfCrm64ae43c63a0ecSingle()
	 * @method \string[] getInitialsList()
	 * @method \string[] fillInitials()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Crm\Contact $object)
	 * @method bool has(\Bitrix\Crm\Contact $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Crm\Contact getByPrimary($primary)
	 * @method \Bitrix\Crm\Contact[] getAll()
	 * @method bool remove(\Bitrix\Crm\Contact $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Crm\EO_Contact_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Crm\Contact current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Contact_Collection merge(?EO_Contact_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Contact_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Crm\ContactTable */
		static public $dataClass = '\Bitrix\Crm\ContactTable';
	}
}
namespace Bitrix\Crm {
	/**
	 * @method static EO_Contact_Query query()
	 * @method static EO_Contact_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Contact_Result getById($id)
	 * @method static EO_Contact_Result getList(array $parameters = [])
	 * @method static EO_Contact_Entity getEntity()
	 * @method static \Bitrix\Crm\Contact createObject($setDefaultValues = true)
	 * @method static \Bitrix\Crm\EO_Contact_Collection createCollection()
	 * @method static \Bitrix\Crm\Contact wakeUpObject($row)
	 * @method static \Bitrix\Crm\EO_Contact_Collection wakeUpCollection($rows)
	 */
	class ContactTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Contact_Result exec()
	 * @method \Bitrix\Crm\Contact fetchObject()
	 * @method \Bitrix\Crm\EO_Contact_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Contact_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Crm\Contact fetchObject()
	 * @method \Bitrix\Crm\EO_Contact_Collection fetchCollection()
	 */
	class EO_Contact_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Crm\Contact createObject($setDefaultValues = true)
	 * @method \Bitrix\Crm\EO_Contact_Collection createCollection()
	 * @method \Bitrix\Crm\Contact wakeUpObject($row)
	 * @method \Bitrix\Crm\EO_Contact_Collection wakeUpCollection($rows)
	 */
	class EO_Contact_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Crm\Model\Dynamic\TypeTable */
namespace Bitrix\Crm\Model\Dynamic {
	/**
	 * Type
	 * @see \Bitrix\Crm\Model\Dynamic\TypeTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getName()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setName(\string|\Bitrix\Main\DB\SqlExpression $name)
	 * @method bool hasName()
	 * @method bool isNameFilled()
	 * @method bool isNameChanged()
	 * @method \string remindActualName()
	 * @method \string requireName()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetName()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetName()
	 * @method \string fillName()
	 * @method \string getTableName()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setTableName(\string|\Bitrix\Main\DB\SqlExpression $tableName)
	 * @method bool hasTableName()
	 * @method bool isTableNameFilled()
	 * @method bool isTableNameChanged()
	 * @method \string remindActualTableName()
	 * @method \string requireTableName()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetTableName()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetTableName()
	 * @method \string fillTableName()
	 * @method \string getTitle()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetTitle()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetTitle()
	 * @method \string fillTitle()
	 * @method \string getCode()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setCode(\string|\Bitrix\Main\DB\SqlExpression $code)
	 * @method bool hasCode()
	 * @method bool isCodeFilled()
	 * @method bool isCodeChanged()
	 * @method \string remindActualCode()
	 * @method \string requireCode()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetCode()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetCode()
	 * @method \string fillCode()
	 * @method \int getCreatedBy()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setCreatedBy(\int|\Bitrix\Main\DB\SqlExpression $createdBy)
	 * @method bool hasCreatedBy()
	 * @method bool isCreatedByFilled()
	 * @method bool isCreatedByChanged()
	 * @method \int remindActualCreatedBy()
	 * @method \int requireCreatedBy()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetCreatedBy()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetCreatedBy()
	 * @method \int fillCreatedBy()
	 * @method \int getEntityTypeId()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setEntityTypeId(\int|\Bitrix\Main\DB\SqlExpression $entityTypeId)
	 * @method bool hasEntityTypeId()
	 * @method bool isEntityTypeIdFilled()
	 * @method bool isEntityTypeIdChanged()
	 * @method \int remindActualEntityTypeId()
	 * @method \int requireEntityTypeId()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetEntityTypeId()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetEntityTypeId()
	 * @method \int fillEntityTypeId()
	 * @method \boolean getIsCategoriesEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsCategoriesEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isCategoriesEnabled)
	 * @method bool hasIsCategoriesEnabled()
	 * @method bool isIsCategoriesEnabledFilled()
	 * @method bool isIsCategoriesEnabledChanged()
	 * @method \boolean remindActualIsCategoriesEnabled()
	 * @method \boolean requireIsCategoriesEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsCategoriesEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsCategoriesEnabled()
	 * @method \boolean fillIsCategoriesEnabled()
	 * @method \boolean getIsStagesEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsStagesEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isStagesEnabled)
	 * @method bool hasIsStagesEnabled()
	 * @method bool isIsStagesEnabledFilled()
	 * @method bool isIsStagesEnabledChanged()
	 * @method \boolean remindActualIsStagesEnabled()
	 * @method \boolean requireIsStagesEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsStagesEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsStagesEnabled()
	 * @method \boolean fillIsStagesEnabled()
	 * @method \boolean getIsBeginCloseDatesEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsBeginCloseDatesEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isBeginCloseDatesEnabled)
	 * @method bool hasIsBeginCloseDatesEnabled()
	 * @method bool isIsBeginCloseDatesEnabledFilled()
	 * @method bool isIsBeginCloseDatesEnabledChanged()
	 * @method \boolean remindActualIsBeginCloseDatesEnabled()
	 * @method \boolean requireIsBeginCloseDatesEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsBeginCloseDatesEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsBeginCloseDatesEnabled()
	 * @method \boolean fillIsBeginCloseDatesEnabled()
	 * @method \boolean getIsClientEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsClientEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isClientEnabled)
	 * @method bool hasIsClientEnabled()
	 * @method bool isIsClientEnabledFilled()
	 * @method bool isIsClientEnabledChanged()
	 * @method \boolean remindActualIsClientEnabled()
	 * @method \boolean requireIsClientEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsClientEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsClientEnabled()
	 * @method \boolean fillIsClientEnabled()
	 * @method \boolean getIsUseInUserfieldEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsUseInUserfieldEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isUseInUserfieldEnabled)
	 * @method bool hasIsUseInUserfieldEnabled()
	 * @method bool isIsUseInUserfieldEnabledFilled()
	 * @method bool isIsUseInUserfieldEnabledChanged()
	 * @method \boolean remindActualIsUseInUserfieldEnabled()
	 * @method \boolean requireIsUseInUserfieldEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsUseInUserfieldEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsUseInUserfieldEnabled()
	 * @method \boolean fillIsUseInUserfieldEnabled()
	 * @method \boolean getIsLinkWithProductsEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsLinkWithProductsEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isLinkWithProductsEnabled)
	 * @method bool hasIsLinkWithProductsEnabled()
	 * @method bool isIsLinkWithProductsEnabledFilled()
	 * @method bool isIsLinkWithProductsEnabledChanged()
	 * @method \boolean remindActualIsLinkWithProductsEnabled()
	 * @method \boolean requireIsLinkWithProductsEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsLinkWithProductsEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsLinkWithProductsEnabled()
	 * @method \boolean fillIsLinkWithProductsEnabled()
	 * @method \boolean getIsCrmTrackingEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsCrmTrackingEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isCrmTrackingEnabled)
	 * @method bool hasIsCrmTrackingEnabled()
	 * @method bool isIsCrmTrackingEnabledFilled()
	 * @method bool isIsCrmTrackingEnabledChanged()
	 * @method \boolean remindActualIsCrmTrackingEnabled()
	 * @method \boolean requireIsCrmTrackingEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsCrmTrackingEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsCrmTrackingEnabled()
	 * @method \boolean fillIsCrmTrackingEnabled()
	 * @method \boolean getIsMycompanyEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsMycompanyEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isMycompanyEnabled)
	 * @method bool hasIsMycompanyEnabled()
	 * @method bool isIsMycompanyEnabledFilled()
	 * @method bool isIsMycompanyEnabledChanged()
	 * @method \boolean remindActualIsMycompanyEnabled()
	 * @method \boolean requireIsMycompanyEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsMycompanyEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsMycompanyEnabled()
	 * @method \boolean fillIsMycompanyEnabled()
	 * @method \boolean getIsDocumentsEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsDocumentsEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isDocumentsEnabled)
	 * @method bool hasIsDocumentsEnabled()
	 * @method bool isIsDocumentsEnabledFilled()
	 * @method bool isIsDocumentsEnabledChanged()
	 * @method \boolean remindActualIsDocumentsEnabled()
	 * @method \boolean requireIsDocumentsEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsDocumentsEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsDocumentsEnabled()
	 * @method \boolean fillIsDocumentsEnabled()
	 * @method \boolean getIsSourceEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsSourceEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isSourceEnabled)
	 * @method bool hasIsSourceEnabled()
	 * @method bool isIsSourceEnabledFilled()
	 * @method bool isIsSourceEnabledChanged()
	 * @method \boolean remindActualIsSourceEnabled()
	 * @method \boolean requireIsSourceEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsSourceEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsSourceEnabled()
	 * @method \boolean fillIsSourceEnabled()
	 * @method \boolean getIsObserversEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsObserversEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isObserversEnabled)
	 * @method bool hasIsObserversEnabled()
	 * @method bool isIsObserversEnabledFilled()
	 * @method bool isIsObserversEnabledChanged()
	 * @method \boolean remindActualIsObserversEnabled()
	 * @method \boolean requireIsObserversEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsObserversEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsObserversEnabled()
	 * @method \boolean fillIsObserversEnabled()
	 * @method \boolean getIsRecyclebinEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsRecyclebinEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isRecyclebinEnabled)
	 * @method bool hasIsRecyclebinEnabled()
	 * @method bool isIsRecyclebinEnabledFilled()
	 * @method bool isIsRecyclebinEnabledChanged()
	 * @method \boolean remindActualIsRecyclebinEnabled()
	 * @method \boolean requireIsRecyclebinEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsRecyclebinEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsRecyclebinEnabled()
	 * @method \boolean fillIsRecyclebinEnabled()
	 * @method \boolean getIsAutomationEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsAutomationEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isAutomationEnabled)
	 * @method bool hasIsAutomationEnabled()
	 * @method bool isIsAutomationEnabledFilled()
	 * @method bool isIsAutomationEnabledChanged()
	 * @method \boolean remindActualIsAutomationEnabled()
	 * @method \boolean requireIsAutomationEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsAutomationEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsAutomationEnabled()
	 * @method \boolean fillIsAutomationEnabled()
	 * @method \boolean getIsBizProcEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsBizProcEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isBizProcEnabled)
	 * @method bool hasIsBizProcEnabled()
	 * @method bool isIsBizProcEnabledFilled()
	 * @method bool isIsBizProcEnabledChanged()
	 * @method \boolean remindActualIsBizProcEnabled()
	 * @method \boolean requireIsBizProcEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsBizProcEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsBizProcEnabled()
	 * @method \boolean fillIsBizProcEnabled()
	 * @method \boolean getIsSetOpenPermissions()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsSetOpenPermissions(\boolean|\Bitrix\Main\DB\SqlExpression $isSetOpenPermissions)
	 * @method bool hasIsSetOpenPermissions()
	 * @method bool isIsSetOpenPermissionsFilled()
	 * @method bool isIsSetOpenPermissionsChanged()
	 * @method \boolean remindActualIsSetOpenPermissions()
	 * @method \boolean requireIsSetOpenPermissions()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsSetOpenPermissions()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsSetOpenPermissions()
	 * @method \boolean fillIsSetOpenPermissions()
	 * @method \boolean getIsPaymentsEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsPaymentsEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isPaymentsEnabled)
	 * @method bool hasIsPaymentsEnabled()
	 * @method bool isIsPaymentsEnabledFilled()
	 * @method bool isIsPaymentsEnabledChanged()
	 * @method \boolean remindActualIsPaymentsEnabled()
	 * @method \boolean requireIsPaymentsEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsPaymentsEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsPaymentsEnabled()
	 * @method \boolean fillIsPaymentsEnabled()
	 * @method \boolean getIsCountersEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setIsCountersEnabled(\boolean|\Bitrix\Main\DB\SqlExpression $isCountersEnabled)
	 * @method bool hasIsCountersEnabled()
	 * @method bool isIsCountersEnabledFilled()
	 * @method bool isIsCountersEnabledChanged()
	 * @method \boolean remindActualIsCountersEnabled()
	 * @method \boolean requireIsCountersEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetIsCountersEnabled()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetIsCountersEnabled()
	 * @method \boolean fillIsCountersEnabled()
	 * @method \Bitrix\Main\Type\DateTime getCreatedTime()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setCreatedTime(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $createdTime)
	 * @method bool hasCreatedTime()
	 * @method bool isCreatedTimeFilled()
	 * @method bool isCreatedTimeChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualCreatedTime()
	 * @method \Bitrix\Main\Type\DateTime requireCreatedTime()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetCreatedTime()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetCreatedTime()
	 * @method \Bitrix\Main\Type\DateTime fillCreatedTime()
	 * @method \Bitrix\Main\Type\DateTime getUpdatedTime()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setUpdatedTime(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $updatedTime)
	 * @method bool hasUpdatedTime()
	 * @method bool isUpdatedTimeFilled()
	 * @method bool isUpdatedTimeChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualUpdatedTime()
	 * @method \Bitrix\Main\Type\DateTime requireUpdatedTime()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetUpdatedTime()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetUpdatedTime()
	 * @method \Bitrix\Main\Type\DateTime fillUpdatedTime()
	 * @method \int getUpdatedBy()
	 * @method \Bitrix\Crm\Model\Dynamic\Type setUpdatedBy(\int|\Bitrix\Main\DB\SqlExpression $updatedBy)
	 * @method bool hasUpdatedBy()
	 * @method bool isUpdatedByFilled()
	 * @method bool isUpdatedByChanged()
	 * @method \int remindActualUpdatedBy()
	 * @method \int requireUpdatedBy()
	 * @method \Bitrix\Crm\Model\Dynamic\Type resetUpdatedBy()
	 * @method \Bitrix\Crm\Model\Dynamic\Type unsetUpdatedBy()
	 * @method \int fillUpdatedBy()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Crm\Model\Dynamic\Type set($fieldName, $value)
	 * @method \Bitrix\Crm\Model\Dynamic\Type reset($fieldName)
	 * @method \Bitrix\Crm\Model\Dynamic\Type unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Crm\Model\Dynamic\Type wakeUp($data)
	 */
	class EO_Type {
		/* @var \Bitrix\Crm\Model\Dynamic\TypeTable */
		static public $dataClass = '\Bitrix\Crm\Model\Dynamic\TypeTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Crm\Model\Dynamic {
	/**
	 * EO_Type_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getNameList()
	 * @method \string[] fillName()
	 * @method \string[] getTableNameList()
	 * @method \string[] fillTableName()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \string[] getCodeList()
	 * @method \string[] fillCode()
	 * @method \int[] getCreatedByList()
	 * @method \int[] fillCreatedBy()
	 * @method \int[] getEntityTypeIdList()
	 * @method \int[] fillEntityTypeId()
	 * @method \boolean[] getIsCategoriesEnabledList()
	 * @method \boolean[] fillIsCategoriesEnabled()
	 * @method \boolean[] getIsStagesEnabledList()
	 * @method \boolean[] fillIsStagesEnabled()
	 * @method \boolean[] getIsBeginCloseDatesEnabledList()
	 * @method \boolean[] fillIsBeginCloseDatesEnabled()
	 * @method \boolean[] getIsClientEnabledList()
	 * @method \boolean[] fillIsClientEnabled()
	 * @method \boolean[] getIsUseInUserfieldEnabledList()
	 * @method \boolean[] fillIsUseInUserfieldEnabled()
	 * @method \boolean[] getIsLinkWithProductsEnabledList()
	 * @method \boolean[] fillIsLinkWithProductsEnabled()
	 * @method \boolean[] getIsCrmTrackingEnabledList()
	 * @method \boolean[] fillIsCrmTrackingEnabled()
	 * @method \boolean[] getIsMycompanyEnabledList()
	 * @method \boolean[] fillIsMycompanyEnabled()
	 * @method \boolean[] getIsDocumentsEnabledList()
	 * @method \boolean[] fillIsDocumentsEnabled()
	 * @method \boolean[] getIsSourceEnabledList()
	 * @method \boolean[] fillIsSourceEnabled()
	 * @method \boolean[] getIsObserversEnabledList()
	 * @method \boolean[] fillIsObserversEnabled()
	 * @method \boolean[] getIsRecyclebinEnabledList()
	 * @method \boolean[] fillIsRecyclebinEnabled()
	 * @method \boolean[] getIsAutomationEnabledList()
	 * @method \boolean[] fillIsAutomationEnabled()
	 * @method \boolean[] getIsBizProcEnabledList()
	 * @method \boolean[] fillIsBizProcEnabled()
	 * @method \boolean[] getIsSetOpenPermissionsList()
	 * @method \boolean[] fillIsSetOpenPermissions()
	 * @method \boolean[] getIsPaymentsEnabledList()
	 * @method \boolean[] fillIsPaymentsEnabled()
	 * @method \boolean[] getIsCountersEnabledList()
	 * @method \boolean[] fillIsCountersEnabled()
	 * @method \Bitrix\Main\Type\DateTime[] getCreatedTimeList()
	 * @method \Bitrix\Main\Type\DateTime[] fillCreatedTime()
	 * @method \Bitrix\Main\Type\DateTime[] getUpdatedTimeList()
	 * @method \Bitrix\Main\Type\DateTime[] fillUpdatedTime()
	 * @method \int[] getUpdatedByList()
	 * @method \int[] fillUpdatedBy()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Crm\Model\Dynamic\Type $object)
	 * @method bool has(\Bitrix\Crm\Model\Dynamic\Type $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Crm\Model\Dynamic\Type getByPrimary($primary)
	 * @method \Bitrix\Crm\Model\Dynamic\Type[] getAll()
	 * @method bool remove(\Bitrix\Crm\Model\Dynamic\Type $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Crm\Model\Dynamic\EO_Type_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Crm\Model\Dynamic\Type current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Type_Collection merge(?EO_Type_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Type_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Crm\Model\Dynamic\TypeTable */
		static public $dataClass = '\Bitrix\Crm\Model\Dynamic\TypeTable';
	}
}
namespace Bitrix\Crm\Model\Dynamic {
	/**
	 * @method static EO_Type_Query query()
	 * @method static EO_Type_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Type_Result getById($id)
	 * @method static EO_Type_Result getList(array $parameters = [])
	 * @method static EO_Type_Entity getEntity()
	 * @method static \Bitrix\Crm\Model\Dynamic\Type createObject($setDefaultValues = true)
	 * @method static \Bitrix\Crm\Model\Dynamic\EO_Type_Collection createCollection()
	 * @method static \Bitrix\Crm\Model\Dynamic\Type wakeUpObject($row)
	 * @method static \Bitrix\Crm\Model\Dynamic\EO_Type_Collection wakeUpCollection($rows)
	 */
	class TypeTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Type_Result exec()
	 * @method \Bitrix\Crm\Model\Dynamic\Type fetchObject()
	 * @method \Bitrix\Crm\Model\Dynamic\EO_Type_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Type_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Crm\Model\Dynamic\Type fetchObject()
	 * @method \Bitrix\Crm\Model\Dynamic\EO_Type_Collection fetchCollection()
	 */
	class EO_Type_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Crm\Model\Dynamic\Type createObject($setDefaultValues = true)
	 * @method \Bitrix\Crm\Model\Dynamic\EO_Type_Collection createCollection()
	 * @method \Bitrix\Crm\Model\Dynamic\Type wakeUpObject($row)
	 * @method \Bitrix\Crm\Model\Dynamic\EO_Type_Collection wakeUpCollection($rows)
	 */
	class EO_Type_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Crm\StatusTable */
namespace Bitrix\Crm {
	/**
	 * EO_Status
	 * @see \Bitrix\Crm\StatusTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Crm\EO_Status setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getEntityId()
	 * @method \Bitrix\Crm\EO_Status setEntityId(\string|\Bitrix\Main\DB\SqlExpression $entityId)
	 * @method bool hasEntityId()
	 * @method bool isEntityIdFilled()
	 * @method bool isEntityIdChanged()
	 * @method \string remindActualEntityId()
	 * @method \string requireEntityId()
	 * @method \Bitrix\Crm\EO_Status resetEntityId()
	 * @method \Bitrix\Crm\EO_Status unsetEntityId()
	 * @method \string fillEntityId()
	 * @method \string getStatusId()
	 * @method \Bitrix\Crm\EO_Status setStatusId(\string|\Bitrix\Main\DB\SqlExpression $statusId)
	 * @method bool hasStatusId()
	 * @method bool isStatusIdFilled()
	 * @method bool isStatusIdChanged()
	 * @method \string remindActualStatusId()
	 * @method \string requireStatusId()
	 * @method \Bitrix\Crm\EO_Status resetStatusId()
	 * @method \Bitrix\Crm\EO_Status unsetStatusId()
	 * @method \string fillStatusId()
	 * @method \string getName()
	 * @method \Bitrix\Crm\EO_Status setName(\string|\Bitrix\Main\DB\SqlExpression $name)
	 * @method bool hasName()
	 * @method bool isNameFilled()
	 * @method bool isNameChanged()
	 * @method \string remindActualName()
	 * @method \string requireName()
	 * @method \Bitrix\Crm\EO_Status resetName()
	 * @method \Bitrix\Crm\EO_Status unsetName()
	 * @method \string fillName()
	 * @method \string getNameInit()
	 * @method \Bitrix\Crm\EO_Status setNameInit(\string|\Bitrix\Main\DB\SqlExpression $nameInit)
	 * @method bool hasNameInit()
	 * @method bool isNameInitFilled()
	 * @method bool isNameInitChanged()
	 * @method \string remindActualNameInit()
	 * @method \string requireNameInit()
	 * @method \Bitrix\Crm\EO_Status resetNameInit()
	 * @method \Bitrix\Crm\EO_Status unsetNameInit()
	 * @method \string fillNameInit()
	 * @method \int getSort()
	 * @method \Bitrix\Crm\EO_Status setSort(\int|\Bitrix\Main\DB\SqlExpression $sort)
	 * @method bool hasSort()
	 * @method bool isSortFilled()
	 * @method bool isSortChanged()
	 * @method \int remindActualSort()
	 * @method \int requireSort()
	 * @method \Bitrix\Crm\EO_Status resetSort()
	 * @method \Bitrix\Crm\EO_Status unsetSort()
	 * @method \int fillSort()
	 * @method \boolean getSystem()
	 * @method \Bitrix\Crm\EO_Status setSystem(\boolean|\Bitrix\Main\DB\SqlExpression $system)
	 * @method bool hasSystem()
	 * @method bool isSystemFilled()
	 * @method bool isSystemChanged()
	 * @method \boolean remindActualSystem()
	 * @method \boolean requireSystem()
	 * @method \Bitrix\Crm\EO_Status resetSystem()
	 * @method \Bitrix\Crm\EO_Status unsetSystem()
	 * @method \boolean fillSystem()
	 * @method \string getColor()
	 * @method \Bitrix\Crm\EO_Status setColor(\string|\Bitrix\Main\DB\SqlExpression $color)
	 * @method bool hasColor()
	 * @method bool isColorFilled()
	 * @method bool isColorChanged()
	 * @method \string remindActualColor()
	 * @method \string requireColor()
	 * @method \Bitrix\Crm\EO_Status resetColor()
	 * @method \Bitrix\Crm\EO_Status unsetColor()
	 * @method \string fillColor()
	 * @method \string getSemantics()
	 * @method \Bitrix\Crm\EO_Status setSemantics(\string|\Bitrix\Main\DB\SqlExpression $semantics)
	 * @method bool hasSemantics()
	 * @method bool isSemanticsFilled()
	 * @method bool isSemanticsChanged()
	 * @method \string remindActualSemantics()
	 * @method \string requireSemantics()
	 * @method \Bitrix\Crm\EO_Status resetSemantics()
	 * @method \Bitrix\Crm\EO_Status unsetSemantics()
	 * @method \string fillSemantics()
	 * @method \int getCategoryId()
	 * @method \Bitrix\Crm\EO_Status setCategoryId(\int|\Bitrix\Main\DB\SqlExpression $categoryId)
	 * @method bool hasCategoryId()
	 * @method bool isCategoryIdFilled()
	 * @method bool isCategoryIdChanged()
	 * @method \int remindActualCategoryId()
	 * @method \int requireCategoryId()
	 * @method \Bitrix\Crm\EO_Status resetCategoryId()
	 * @method \Bitrix\Crm\EO_Status unsetCategoryId()
	 * @method \int fillCategoryId()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Crm\EO_Status set($fieldName, $value)
	 * @method \Bitrix\Crm\EO_Status reset($fieldName)
	 * @method \Bitrix\Crm\EO_Status unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Crm\EO_Status wakeUp($data)
	 */
	class EO_Status {
		/* @var \Bitrix\Crm\StatusTable */
		static public $dataClass = '\Bitrix\Crm\StatusTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Crm {
	/**
	 * EO_Status_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getEntityIdList()
	 * @method \string[] fillEntityId()
	 * @method \string[] getStatusIdList()
	 * @method \string[] fillStatusId()
	 * @method \string[] getNameList()
	 * @method \string[] fillName()
	 * @method \string[] getNameInitList()
	 * @method \string[] fillNameInit()
	 * @method \int[] getSortList()
	 * @method \int[] fillSort()
	 * @method \boolean[] getSystemList()
	 * @method \boolean[] fillSystem()
	 * @method \string[] getColorList()
	 * @method \string[] fillColor()
	 * @method \string[] getSemanticsList()
	 * @method \string[] fillSemantics()
	 * @method \int[] getCategoryIdList()
	 * @method \int[] fillCategoryId()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Crm\EO_Status $object)
	 * @method bool has(\Bitrix\Crm\EO_Status $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Crm\EO_Status getByPrimary($primary)
	 * @method \Bitrix\Crm\EO_Status[] getAll()
	 * @method bool remove(\Bitrix\Crm\EO_Status $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Crm\EO_Status_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Crm\EO_Status current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Status_Collection merge(?EO_Status_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Status_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Crm\StatusTable */
		static public $dataClass = '\Bitrix\Crm\StatusTable';
	}
}
namespace Bitrix\Crm {
	/**
	 * @method static EO_Status_Query query()
	 * @method static EO_Status_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Status_Result getById($id)
	 * @method static EO_Status_Result getList(array $parameters = [])
	 * @method static EO_Status_Entity getEntity()
	 * @method static \Bitrix\Crm\EO_Status createObject($setDefaultValues = true)
	 * @method static \Bitrix\Crm\EO_Status_Collection createCollection()
	 * @method static \Bitrix\Crm\EO_Status wakeUpObject($row)
	 * @method static \Bitrix\Crm\EO_Status_Collection wakeUpCollection($rows)
	 */
	class StatusTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Status_Result exec()
	 * @method \Bitrix\Crm\EO_Status fetchObject()
	 * @method \Bitrix\Crm\EO_Status_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Status_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Crm\EO_Status fetchObject()
	 * @method \Bitrix\Crm\EO_Status_Collection fetchCollection()
	 */
	class EO_Status_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Crm\EO_Status createObject($setDefaultValues = true)
	 * @method \Bitrix\Crm\EO_Status_Collection createCollection()
	 * @method \Bitrix\Crm\EO_Status wakeUpObject($row)
	 * @method \Bitrix\Crm\EO_Status_Collection wakeUpCollection($rows)
	 */
	class EO_Status_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Crm\FieldMultiTable */
namespace Bitrix\Crm {
	/**
	 * EO_FieldMulti
	 * @see \Bitrix\Crm\FieldMultiTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Crm\EO_FieldMulti setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getEntityId()
	 * @method \Bitrix\Crm\EO_FieldMulti setEntityId(\string|\Bitrix\Main\DB\SqlExpression $entityId)
	 * @method bool hasEntityId()
	 * @method bool isEntityIdFilled()
	 * @method bool isEntityIdChanged()
	 * @method \string remindActualEntityId()
	 * @method \string requireEntityId()
	 * @method \Bitrix\Crm\EO_FieldMulti resetEntityId()
	 * @method \Bitrix\Crm\EO_FieldMulti unsetEntityId()
	 * @method \string fillEntityId()
	 * @method \int getElementId()
	 * @method \Bitrix\Crm\EO_FieldMulti setElementId(\int|\Bitrix\Main\DB\SqlExpression $elementId)
	 * @method bool hasElementId()
	 * @method bool isElementIdFilled()
	 * @method bool isElementIdChanged()
	 * @method \int remindActualElementId()
	 * @method \int requireElementId()
	 * @method \Bitrix\Crm\EO_FieldMulti resetElementId()
	 * @method \Bitrix\Crm\EO_FieldMulti unsetElementId()
	 * @method \int fillElementId()
	 * @method \string getTypeId()
	 * @method \Bitrix\Crm\EO_FieldMulti setTypeId(\string|\Bitrix\Main\DB\SqlExpression $typeId)
	 * @method bool hasTypeId()
	 * @method bool isTypeIdFilled()
	 * @method bool isTypeIdChanged()
	 * @method \string remindActualTypeId()
	 * @method \string requireTypeId()
	 * @method \Bitrix\Crm\EO_FieldMulti resetTypeId()
	 * @method \Bitrix\Crm\EO_FieldMulti unsetTypeId()
	 * @method \string fillTypeId()
	 * @method \string getValueType()
	 * @method \Bitrix\Crm\EO_FieldMulti setValueType(\string|\Bitrix\Main\DB\SqlExpression $valueType)
	 * @method bool hasValueType()
	 * @method bool isValueTypeFilled()
	 * @method bool isValueTypeChanged()
	 * @method \string remindActualValueType()
	 * @method \string requireValueType()
	 * @method \Bitrix\Crm\EO_FieldMulti resetValueType()
	 * @method \Bitrix\Crm\EO_FieldMulti unsetValueType()
	 * @method \string fillValueType()
	 * @method \string getComplexId()
	 * @method \Bitrix\Crm\EO_FieldMulti setComplexId(\string|\Bitrix\Main\DB\SqlExpression $complexId)
	 * @method bool hasComplexId()
	 * @method bool isComplexIdFilled()
	 * @method bool isComplexIdChanged()
	 * @method \string remindActualComplexId()
	 * @method \string requireComplexId()
	 * @method \Bitrix\Crm\EO_FieldMulti resetComplexId()
	 * @method \Bitrix\Crm\EO_FieldMulti unsetComplexId()
	 * @method \string fillComplexId()
	 * @method \string getValue()
	 * @method \Bitrix\Crm\EO_FieldMulti setValue(\string|\Bitrix\Main\DB\SqlExpression $value)
	 * @method bool hasValue()
	 * @method bool isValueFilled()
	 * @method bool isValueChanged()
	 * @method \string remindActualValue()
	 * @method \string requireValue()
	 * @method \Bitrix\Crm\EO_FieldMulti resetValue()
	 * @method \Bitrix\Crm\EO_FieldMulti unsetValue()
	 * @method \string fillValue()
	 * @method \Bitrix\Crm\Model\EO_FieldMultiPhoneCountry getPhoneCountry()
	 * @method \Bitrix\Crm\Model\EO_FieldMultiPhoneCountry remindActualPhoneCountry()
	 * @method \Bitrix\Crm\Model\EO_FieldMultiPhoneCountry requirePhoneCountry()
	 * @method \Bitrix\Crm\EO_FieldMulti setPhoneCountry(\Bitrix\Crm\Model\EO_FieldMultiPhoneCountry $object)
	 * @method \Bitrix\Crm\EO_FieldMulti resetPhoneCountry()
	 * @method \Bitrix\Crm\EO_FieldMulti unsetPhoneCountry()
	 * @method bool hasPhoneCountry()
	 * @method bool isPhoneCountryFilled()
	 * @method bool isPhoneCountryChanged()
	 * @method \Bitrix\Crm\Model\EO_FieldMultiPhoneCountry fillPhoneCountry()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Crm\EO_FieldMulti set($fieldName, $value)
	 * @method \Bitrix\Crm\EO_FieldMulti reset($fieldName)
	 * @method \Bitrix\Crm\EO_FieldMulti unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Crm\EO_FieldMulti wakeUp($data)
	 */
	class EO_FieldMulti {
		/* @var \Bitrix\Crm\FieldMultiTable */
		static public $dataClass = '\Bitrix\Crm\FieldMultiTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Crm {
	/**
	 * EO_FieldMulti_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getEntityIdList()
	 * @method \string[] fillEntityId()
	 * @method \int[] getElementIdList()
	 * @method \int[] fillElementId()
	 * @method \string[] getTypeIdList()
	 * @method \string[] fillTypeId()
	 * @method \string[] getValueTypeList()
	 * @method \string[] fillValueType()
	 * @method \string[] getComplexIdList()
	 * @method \string[] fillComplexId()
	 * @method \string[] getValueList()
	 * @method \string[] fillValue()
	 * @method \Bitrix\Crm\Model\EO_FieldMultiPhoneCountry[] getPhoneCountryList()
	 * @method \Bitrix\Crm\EO_FieldMulti_Collection getPhoneCountryCollection()
	 * @method \Bitrix\Crm\Model\EO_FieldMultiPhoneCountry_Collection fillPhoneCountry()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Crm\EO_FieldMulti $object)
	 * @method bool has(\Bitrix\Crm\EO_FieldMulti $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Crm\EO_FieldMulti getByPrimary($primary)
	 * @method \Bitrix\Crm\EO_FieldMulti[] getAll()
	 * @method bool remove(\Bitrix\Crm\EO_FieldMulti $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Crm\EO_FieldMulti_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Crm\EO_FieldMulti current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_FieldMulti_Collection merge(?EO_FieldMulti_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_FieldMulti_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Crm\FieldMultiTable */
		static public $dataClass = '\Bitrix\Crm\FieldMultiTable';
	}
}
namespace Bitrix\Crm {
	/**
	 * @method static EO_FieldMulti_Query query()
	 * @method static EO_FieldMulti_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_FieldMulti_Result getById($id)
	 * @method static EO_FieldMulti_Result getList(array $parameters = [])
	 * @method static EO_FieldMulti_Entity getEntity()
	 * @method static \Bitrix\Crm\EO_FieldMulti createObject($setDefaultValues = true)
	 * @method static \Bitrix\Crm\EO_FieldMulti_Collection createCollection()
	 * @method static \Bitrix\Crm\EO_FieldMulti wakeUpObject($row)
	 * @method static \Bitrix\Crm\EO_FieldMulti_Collection wakeUpCollection($rows)
	 */
	class FieldMultiTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_FieldMulti_Result exec()
	 * @method \Bitrix\Crm\EO_FieldMulti fetchObject()
	 * @method \Bitrix\Crm\EO_FieldMulti_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_FieldMulti_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Crm\EO_FieldMulti fetchObject()
	 * @method \Bitrix\Crm\EO_FieldMulti_Collection fetchCollection()
	 */
	class EO_FieldMulti_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Crm\EO_FieldMulti createObject($setDefaultValues = true)
	 * @method \Bitrix\Crm\EO_FieldMulti_Collection createCollection()
	 * @method \Bitrix\Crm\EO_FieldMulti wakeUpObject($row)
	 * @method \Bitrix\Crm\EO_FieldMulti_Collection wakeUpCollection($rows)
	 */
	class EO_FieldMulti_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Crm\UtmTable */
namespace Bitrix\Crm {
	/**
	 * EO_Utm
	 * @see \Bitrix\Crm\UtmTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getEntityTypeId()
	 * @method \Bitrix\Crm\EO_Utm setEntityTypeId(\int|\Bitrix\Main\DB\SqlExpression $entityTypeId)
	 * @method bool hasEntityTypeId()
	 * @method bool isEntityTypeIdFilled()
	 * @method bool isEntityTypeIdChanged()
	 * @method \int getEntityId()
	 * @method \Bitrix\Crm\EO_Utm setEntityId(\int|\Bitrix\Main\DB\SqlExpression $entityId)
	 * @method bool hasEntityId()
	 * @method bool isEntityIdFilled()
	 * @method bool isEntityIdChanged()
	 * @method \string getCode()
	 * @method \Bitrix\Crm\EO_Utm setCode(\string|\Bitrix\Main\DB\SqlExpression $code)
	 * @method bool hasCode()
	 * @method bool isCodeFilled()
	 * @method bool isCodeChanged()
	 * @method \string getValue()
	 * @method \Bitrix\Crm\EO_Utm setValue(\string|\Bitrix\Main\DB\SqlExpression $value)
	 * @method bool hasValue()
	 * @method bool isValueFilled()
	 * @method bool isValueChanged()
	 * @method \string remindActualValue()
	 * @method \string requireValue()
	 * @method \Bitrix\Crm\EO_Utm resetValue()
	 * @method \Bitrix\Crm\EO_Utm unsetValue()
	 * @method \string fillValue()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Crm\EO_Utm set($fieldName, $value)
	 * @method \Bitrix\Crm\EO_Utm reset($fieldName)
	 * @method \Bitrix\Crm\EO_Utm unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Crm\EO_Utm wakeUp($data)
	 */
	class EO_Utm {
		/* @var \Bitrix\Crm\UtmTable */
		static public $dataClass = '\Bitrix\Crm\UtmTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Crm {
	/**
	 * EO_Utm_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getEntityTypeIdList()
	 * @method \int[] getEntityIdList()
	 * @method \string[] getCodeList()
	 * @method \string[] getValueList()
	 * @method \string[] fillValue()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Crm\EO_Utm $object)
	 * @method bool has(\Bitrix\Crm\EO_Utm $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Crm\EO_Utm getByPrimary($primary)
	 * @method \Bitrix\Crm\EO_Utm[] getAll()
	 * @method bool remove(\Bitrix\Crm\EO_Utm $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Crm\EO_Utm_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Crm\EO_Utm current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Utm_Collection merge(?EO_Utm_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Utm_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Crm\UtmTable */
		static public $dataClass = '\Bitrix\Crm\UtmTable';
	}
}
namespace Bitrix\Crm {
	/**
	 * @method static EO_Utm_Query query()
	 * @method static EO_Utm_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Utm_Result getById($id)
	 * @method static EO_Utm_Result getList(array $parameters = [])
	 * @method static EO_Utm_Entity getEntity()
	 * @method static \Bitrix\Crm\EO_Utm createObject($setDefaultValues = true)
	 * @method static \Bitrix\Crm\EO_Utm_Collection createCollection()
	 * @method static \Bitrix\Crm\EO_Utm wakeUpObject($row)
	 * @method static \Bitrix\Crm\EO_Utm_Collection wakeUpCollection($rows)
	 */
	class UtmTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Utm_Result exec()
	 * @method \Bitrix\Crm\EO_Utm fetchObject()
	 * @method \Bitrix\Crm\EO_Utm_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Utm_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Crm\EO_Utm fetchObject()
	 * @method \Bitrix\Crm\EO_Utm_Collection fetchCollection()
	 */
	class EO_Utm_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Crm\EO_Utm createObject($setDefaultValues = true)
	 * @method \Bitrix\Crm\EO_Utm_Collection createCollection()
	 * @method \Bitrix\Crm\EO_Utm wakeUpObject($row)
	 * @method \Bitrix\Crm\EO_Utm_Collection wakeUpCollection($rows)
	 */
	class EO_Utm_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Main\UserFieldTable */
namespace Bitrix\Main {
	/**
	 * EO_UserField
	 * @see \Bitrix\Main\UserFieldTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Main\EO_UserField setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getEntityId()
	 * @method \Bitrix\Main\EO_UserField setEntityId(\string|\Bitrix\Main\DB\SqlExpression $entityId)
	 * @method bool hasEntityId()
	 * @method bool isEntityIdFilled()
	 * @method bool isEntityIdChanged()
	 * @method \string remindActualEntityId()
	 * @method \string requireEntityId()
	 * @method \Bitrix\Main\EO_UserField resetEntityId()
	 * @method \Bitrix\Main\EO_UserField unsetEntityId()
	 * @method \string fillEntityId()
	 * @method \string getFieldName()
	 * @method \Bitrix\Main\EO_UserField setFieldName(\string|\Bitrix\Main\DB\SqlExpression $fieldName)
	 * @method bool hasFieldName()
	 * @method bool isFieldNameFilled()
	 * @method bool isFieldNameChanged()
	 * @method \string remindActualFieldName()
	 * @method \string requireFieldName()
	 * @method \Bitrix\Main\EO_UserField resetFieldName()
	 * @method \Bitrix\Main\EO_UserField unsetFieldName()
	 * @method \string fillFieldName()
	 * @method \string getUserTypeId()
	 * @method \Bitrix\Main\EO_UserField setUserTypeId(\string|\Bitrix\Main\DB\SqlExpression $userTypeId)
	 * @method bool hasUserTypeId()
	 * @method bool isUserTypeIdFilled()
	 * @method bool isUserTypeIdChanged()
	 * @method \string remindActualUserTypeId()
	 * @method \string requireUserTypeId()
	 * @method \Bitrix\Main\EO_UserField resetUserTypeId()
	 * @method \Bitrix\Main\EO_UserField unsetUserTypeId()
	 * @method \string fillUserTypeId()
	 * @method \string getXmlId()
	 * @method \Bitrix\Main\EO_UserField setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \Bitrix\Main\EO_UserField resetXmlId()
	 * @method \Bitrix\Main\EO_UserField unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \int getSort()
	 * @method \Bitrix\Main\EO_UserField setSort(\int|\Bitrix\Main\DB\SqlExpression $sort)
	 * @method bool hasSort()
	 * @method bool isSortFilled()
	 * @method bool isSortChanged()
	 * @method \int remindActualSort()
	 * @method \int requireSort()
	 * @method \Bitrix\Main\EO_UserField resetSort()
	 * @method \Bitrix\Main\EO_UserField unsetSort()
	 * @method \int fillSort()
	 * @method \boolean getMultiple()
	 * @method \Bitrix\Main\EO_UserField setMultiple(\boolean|\Bitrix\Main\DB\SqlExpression $multiple)
	 * @method bool hasMultiple()
	 * @method bool isMultipleFilled()
	 * @method bool isMultipleChanged()
	 * @method \boolean remindActualMultiple()
	 * @method \boolean requireMultiple()
	 * @method \Bitrix\Main\EO_UserField resetMultiple()
	 * @method \Bitrix\Main\EO_UserField unsetMultiple()
	 * @method \boolean fillMultiple()
	 * @method \boolean getMandatory()
	 * @method \Bitrix\Main\EO_UserField setMandatory(\boolean|\Bitrix\Main\DB\SqlExpression $mandatory)
	 * @method bool hasMandatory()
	 * @method bool isMandatoryFilled()
	 * @method bool isMandatoryChanged()
	 * @method \boolean remindActualMandatory()
	 * @method \boolean requireMandatory()
	 * @method \Bitrix\Main\EO_UserField resetMandatory()
	 * @method \Bitrix\Main\EO_UserField unsetMandatory()
	 * @method \boolean fillMandatory()
	 * @method \boolean getShowFilter()
	 * @method \Bitrix\Main\EO_UserField setShowFilter(\boolean|\Bitrix\Main\DB\SqlExpression $showFilter)
	 * @method bool hasShowFilter()
	 * @method bool isShowFilterFilled()
	 * @method bool isShowFilterChanged()
	 * @method \boolean remindActualShowFilter()
	 * @method \boolean requireShowFilter()
	 * @method \Bitrix\Main\EO_UserField resetShowFilter()
	 * @method \Bitrix\Main\EO_UserField unsetShowFilter()
	 * @method \boolean fillShowFilter()
	 * @method \boolean getShowInList()
	 * @method \Bitrix\Main\EO_UserField setShowInList(\boolean|\Bitrix\Main\DB\SqlExpression $showInList)
	 * @method bool hasShowInList()
	 * @method bool isShowInListFilled()
	 * @method bool isShowInListChanged()
	 * @method \boolean remindActualShowInList()
	 * @method \boolean requireShowInList()
	 * @method \Bitrix\Main\EO_UserField resetShowInList()
	 * @method \Bitrix\Main\EO_UserField unsetShowInList()
	 * @method \boolean fillShowInList()
	 * @method \boolean getEditInList()
	 * @method \Bitrix\Main\EO_UserField setEditInList(\boolean|\Bitrix\Main\DB\SqlExpression $editInList)
	 * @method bool hasEditInList()
	 * @method bool isEditInListFilled()
	 * @method bool isEditInListChanged()
	 * @method \boolean remindActualEditInList()
	 * @method \boolean requireEditInList()
	 * @method \Bitrix\Main\EO_UserField resetEditInList()
	 * @method \Bitrix\Main\EO_UserField unsetEditInList()
	 * @method \boolean fillEditInList()
	 * @method \boolean getIsSearchable()
	 * @method \Bitrix\Main\EO_UserField setIsSearchable(\boolean|\Bitrix\Main\DB\SqlExpression $isSearchable)
	 * @method bool hasIsSearchable()
	 * @method bool isIsSearchableFilled()
	 * @method bool isIsSearchableChanged()
	 * @method \boolean remindActualIsSearchable()
	 * @method \boolean requireIsSearchable()
	 * @method \Bitrix\Main\EO_UserField resetIsSearchable()
	 * @method \Bitrix\Main\EO_UserField unsetIsSearchable()
	 * @method \boolean fillIsSearchable()
	 * @method \string getSettings()
	 * @method \Bitrix\Main\EO_UserField setSettings(\string|\Bitrix\Main\DB\SqlExpression $settings)
	 * @method bool hasSettings()
	 * @method bool isSettingsFilled()
	 * @method bool isSettingsChanged()
	 * @method \string remindActualSettings()
	 * @method \string requireSettings()
	 * @method \Bitrix\Main\EO_UserField resetSettings()
	 * @method \Bitrix\Main\EO_UserField unsetSettings()
	 * @method \string fillSettings()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Main\EO_UserField set($fieldName, $value)
	 * @method \Bitrix\Main\EO_UserField reset($fieldName)
	 * @method \Bitrix\Main\EO_UserField unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Main\EO_UserField wakeUp($data)
	 */
	class EO_UserField {
		/* @var \Bitrix\Main\UserFieldTable */
		static public $dataClass = '\Bitrix\Main\UserFieldTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Main {
	/**
	 * EO_UserField_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getEntityIdList()
	 * @method \string[] fillEntityId()
	 * @method \string[] getFieldNameList()
	 * @method \string[] fillFieldName()
	 * @method \string[] getUserTypeIdList()
	 * @method \string[] fillUserTypeId()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \int[] getSortList()
	 * @method \int[] fillSort()
	 * @method \boolean[] getMultipleList()
	 * @method \boolean[] fillMultiple()
	 * @method \boolean[] getMandatoryList()
	 * @method \boolean[] fillMandatory()
	 * @method \boolean[] getShowFilterList()
	 * @method \boolean[] fillShowFilter()
	 * @method \boolean[] getShowInListList()
	 * @method \boolean[] fillShowInList()
	 * @method \boolean[] getEditInListList()
	 * @method \boolean[] fillEditInList()
	 * @method \boolean[] getIsSearchableList()
	 * @method \boolean[] fillIsSearchable()
	 * @method \string[] getSettingsList()
	 * @method \string[] fillSettings()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Main\EO_UserField $object)
	 * @method bool has(\Bitrix\Main\EO_UserField $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Main\EO_UserField getByPrimary($primary)
	 * @method \Bitrix\Main\EO_UserField[] getAll()
	 * @method bool remove(\Bitrix\Main\EO_UserField $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Main\EO_UserField_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Main\EO_UserField current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_UserField_Collection merge(?EO_UserField_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_UserField_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Main\UserFieldTable */
		static public $dataClass = '\Bitrix\Main\UserFieldTable';
	}
}
namespace Bitrix\Main {
	/**
	 * @method static EO_UserField_Query query()
	 * @method static EO_UserField_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_UserField_Result getById($id)
	 * @method static EO_UserField_Result getList(array $parameters = [])
	 * @method static EO_UserField_Entity getEntity()
	 * @method static \Bitrix\Main\EO_UserField createObject($setDefaultValues = true)
	 * @method static \Bitrix\Main\EO_UserField_Collection createCollection()
	 * @method static \Bitrix\Main\EO_UserField wakeUpObject($row)
	 * @method static \Bitrix\Main\EO_UserField_Collection wakeUpCollection($rows)
	 */
	class UserFieldTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_UserField_Result exec()
	 * @method \Bitrix\Main\EO_UserField fetchObject()
	 * @method \Bitrix\Main\EO_UserField_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_UserField_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Main\EO_UserField fetchObject()
	 * @method \Bitrix\Main\EO_UserField_Collection fetchCollection()
	 */
	class EO_UserField_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Main\EO_UserField createObject($setDefaultValues = true)
	 * @method \Bitrix\Main\EO_UserField_Collection createCollection()
	 * @method \Bitrix\Main\EO_UserField wakeUpObject($row)
	 * @method \Bitrix\Main\EO_UserField_Collection wakeUpCollection($rows)
	 */
	class EO_UserField_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Rest\PlacementTable */
namespace Bitrix\Rest {
	/**
	 * EO_Placement
	 * @see \Bitrix\Rest\PlacementTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Rest\EO_Placement setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getAppId()
	 * @method \Bitrix\Rest\EO_Placement setAppId(\int|\Bitrix\Main\DB\SqlExpression $appId)
	 * @method bool hasAppId()
	 * @method bool isAppIdFilled()
	 * @method bool isAppIdChanged()
	 * @method \int remindActualAppId()
	 * @method \int requireAppId()
	 * @method \Bitrix\Rest\EO_Placement resetAppId()
	 * @method \Bitrix\Rest\EO_Placement unsetAppId()
	 * @method \int fillAppId()
	 * @method \int getUserId()
	 * @method \Bitrix\Rest\EO_Placement setUserId(\int|\Bitrix\Main\DB\SqlExpression $userId)
	 * @method bool hasUserId()
	 * @method bool isUserIdFilled()
	 * @method bool isUserIdChanged()
	 * @method \int remindActualUserId()
	 * @method \int requireUserId()
	 * @method \Bitrix\Rest\EO_Placement resetUserId()
	 * @method \Bitrix\Rest\EO_Placement unsetUserId()
	 * @method \int fillUserId()
	 * @method \string getPlacement()
	 * @method \Bitrix\Rest\EO_Placement setPlacement(\string|\Bitrix\Main\DB\SqlExpression $placement)
	 * @method bool hasPlacement()
	 * @method bool isPlacementFilled()
	 * @method bool isPlacementChanged()
	 * @method \string remindActualPlacement()
	 * @method \string requirePlacement()
	 * @method \Bitrix\Rest\EO_Placement resetPlacement()
	 * @method \Bitrix\Rest\EO_Placement unsetPlacement()
	 * @method \string fillPlacement()
	 * @method \string getPlacementHandler()
	 * @method \Bitrix\Rest\EO_Placement setPlacementHandler(\string|\Bitrix\Main\DB\SqlExpression $placementHandler)
	 * @method bool hasPlacementHandler()
	 * @method bool isPlacementHandlerFilled()
	 * @method bool isPlacementHandlerChanged()
	 * @method \string remindActualPlacementHandler()
	 * @method \string requirePlacementHandler()
	 * @method \Bitrix\Rest\EO_Placement resetPlacementHandler()
	 * @method \Bitrix\Rest\EO_Placement unsetPlacementHandler()
	 * @method \string fillPlacementHandler()
	 * @method \string getGroupName()
	 * @method \Bitrix\Rest\EO_Placement setGroupName(\string|\Bitrix\Main\DB\SqlExpression $groupName)
	 * @method bool hasGroupName()
	 * @method bool isGroupNameFilled()
	 * @method bool isGroupNameChanged()
	 * @method \string remindActualGroupName()
	 * @method \string requireGroupName()
	 * @method \Bitrix\Rest\EO_Placement resetGroupName()
	 * @method \Bitrix\Rest\EO_Placement unsetGroupName()
	 * @method \string fillGroupName()
	 * @method \int getIconId()
	 * @method \Bitrix\Rest\EO_Placement setIconId(\int|\Bitrix\Main\DB\SqlExpression $iconId)
	 * @method bool hasIconId()
	 * @method bool isIconIdFilled()
	 * @method bool isIconIdChanged()
	 * @method \int remindActualIconId()
	 * @method \int requireIconId()
	 * @method \Bitrix\Rest\EO_Placement resetIconId()
	 * @method \Bitrix\Rest\EO_Placement unsetIconId()
	 * @method \int fillIconId()
	 * @method \string getTitle()
	 * @method \Bitrix\Rest\EO_Placement setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \Bitrix\Rest\EO_Placement resetTitle()
	 * @method \Bitrix\Rest\EO_Placement unsetTitle()
	 * @method \string fillTitle()
	 * @method \string getComment()
	 * @method \Bitrix\Rest\EO_Placement setComment(\string|\Bitrix\Main\DB\SqlExpression $comment)
	 * @method bool hasComment()
	 * @method bool isCommentFilled()
	 * @method bool isCommentChanged()
	 * @method \string remindActualComment()
	 * @method \string requireComment()
	 * @method \Bitrix\Rest\EO_Placement resetComment()
	 * @method \Bitrix\Rest\EO_Placement unsetComment()
	 * @method \string fillComment()
	 * @method \Bitrix\Main\Type\DateTime getDateCreate()
	 * @method \Bitrix\Rest\EO_Placement setDateCreate(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateCreate)
	 * @method bool hasDateCreate()
	 * @method bool isDateCreateFilled()
	 * @method bool isDateCreateChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateCreate()
	 * @method \Bitrix\Main\Type\DateTime requireDateCreate()
	 * @method \Bitrix\Rest\EO_Placement resetDateCreate()
	 * @method \Bitrix\Rest\EO_Placement unsetDateCreate()
	 * @method \Bitrix\Main\Type\DateTime fillDateCreate()
	 * @method \string getAdditional()
	 * @method \Bitrix\Rest\EO_Placement setAdditional(\string|\Bitrix\Main\DB\SqlExpression $additional)
	 * @method bool hasAdditional()
	 * @method bool isAdditionalFilled()
	 * @method bool isAdditionalChanged()
	 * @method \string remindActualAdditional()
	 * @method \string requireAdditional()
	 * @method \Bitrix\Rest\EO_Placement resetAdditional()
	 * @method \Bitrix\Rest\EO_Placement unsetAdditional()
	 * @method \string fillAdditional()
	 * @method array getOptions()
	 * @method \Bitrix\Rest\EO_Placement setOptions(array|\Bitrix\Main\DB\SqlExpression $options)
	 * @method bool hasOptions()
	 * @method bool isOptionsFilled()
	 * @method bool isOptionsChanged()
	 * @method array remindActualOptions()
	 * @method array requireOptions()
	 * @method \Bitrix\Rest\EO_Placement resetOptions()
	 * @method \Bitrix\Rest\EO_Placement unsetOptions()
	 * @method array fillOptions()
	 * @method \Bitrix\Rest\EO_App getRestApp()
	 * @method \Bitrix\Rest\EO_App remindActualRestApp()
	 * @method \Bitrix\Rest\EO_App requireRestApp()
	 * @method \Bitrix\Rest\EO_Placement setRestApp(\Bitrix\Rest\EO_App $object)
	 * @method \Bitrix\Rest\EO_Placement resetRestApp()
	 * @method \Bitrix\Rest\EO_Placement unsetRestApp()
	 * @method bool hasRestApp()
	 * @method bool isRestAppFilled()
	 * @method bool isRestAppChanged()
	 * @method \Bitrix\Rest\EO_App fillRestApp()
	 * @method \Bitrix\Rest\EO_PlacementLang_Collection getLangAll()
	 * @method \Bitrix\Rest\EO_PlacementLang_Collection requireLangAll()
	 * @method \Bitrix\Rest\EO_PlacementLang_Collection fillLangAll()
	 * @method bool hasLangAll()
	 * @method bool isLangAllFilled()
	 * @method bool isLangAllChanged()
	 * @method void addToLangAll(\Bitrix\Rest\EO_PlacementLang $placementLang)
	 * @method void removeFromLangAll(\Bitrix\Rest\EO_PlacementLang $placementLang)
	 * @method void removeAllLangAll()
	 * @method \Bitrix\Rest\EO_Placement resetLangAll()
	 * @method \Bitrix\Rest\EO_Placement unsetLangAll()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Rest\EO_Placement set($fieldName, $value)
	 * @method \Bitrix\Rest\EO_Placement reset($fieldName)
	 * @method \Bitrix\Rest\EO_Placement unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Rest\EO_Placement wakeUp($data)
	 */
	class EO_Placement {
		/* @var \Bitrix\Rest\PlacementTable */
		static public $dataClass = '\Bitrix\Rest\PlacementTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Rest {
	/**
	 * EO_Placement_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getAppIdList()
	 * @method \int[] fillAppId()
	 * @method \int[] getUserIdList()
	 * @method \int[] fillUserId()
	 * @method \string[] getPlacementList()
	 * @method \string[] fillPlacement()
	 * @method \string[] getPlacementHandlerList()
	 * @method \string[] fillPlacementHandler()
	 * @method \string[] getGroupNameList()
	 * @method \string[] fillGroupName()
	 * @method \int[] getIconIdList()
	 * @method \int[] fillIconId()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \string[] getCommentList()
	 * @method \string[] fillComment()
	 * @method \Bitrix\Main\Type\DateTime[] getDateCreateList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateCreate()
	 * @method \string[] getAdditionalList()
	 * @method \string[] fillAdditional()
	 * @method array[] getOptionsList()
	 * @method array[] fillOptions()
	 * @method \Bitrix\Rest\EO_App[] getRestAppList()
	 * @method \Bitrix\Rest\EO_Placement_Collection getRestAppCollection()
	 * @method \Bitrix\Rest\EO_App_Collection fillRestApp()
	 * @method \Bitrix\Rest\EO_PlacementLang_Collection[] getLangAllList()
	 * @method \Bitrix\Rest\EO_PlacementLang_Collection getLangAllCollection()
	 * @method \Bitrix\Rest\EO_PlacementLang_Collection fillLangAll()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Rest\EO_Placement $object)
	 * @method bool has(\Bitrix\Rest\EO_Placement $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Rest\EO_Placement getByPrimary($primary)
	 * @method \Bitrix\Rest\EO_Placement[] getAll()
	 * @method bool remove(\Bitrix\Rest\EO_Placement $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Rest\EO_Placement_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Rest\EO_Placement current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Placement_Collection merge(?EO_Placement_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Placement_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Rest\PlacementTable */
		static public $dataClass = '\Bitrix\Rest\PlacementTable';
	}
}
namespace Bitrix\Rest {
	/**
	 * @method static EO_Placement_Query query()
	 * @method static EO_Placement_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Placement_Result getById($id)
	 * @method static EO_Placement_Result getList(array $parameters = [])
	 * @method static EO_Placement_Entity getEntity()
	 * @method static \Bitrix\Rest\EO_Placement createObject($setDefaultValues = true)
	 * @method static \Bitrix\Rest\EO_Placement_Collection createCollection()
	 * @method static \Bitrix\Rest\EO_Placement wakeUpObject($row)
	 * @method static \Bitrix\Rest\EO_Placement_Collection wakeUpCollection($rows)
	 */
	class PlacementTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Placement_Result exec()
	 * @method \Bitrix\Rest\EO_Placement fetchObject()
	 * @method \Bitrix\Rest\EO_Placement_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Placement_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Rest\EO_Placement fetchObject()
	 * @method \Bitrix\Rest\EO_Placement_Collection fetchCollection()
	 */
	class EO_Placement_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Rest\EO_Placement createObject($setDefaultValues = true)
	 * @method \Bitrix\Rest\EO_Placement_Collection createCollection()
	 * @method \Bitrix\Rest\EO_Placement wakeUpObject($row)
	 * @method \Bitrix\Rest\EO_Placement_Collection wakeUpCollection($rows)
	 */
	class EO_Placement_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Iblock\IblockTable */
namespace Bitrix\Iblock {
	/**
	 * Iblock
	 * @see \Bitrix\Iblock\IblockTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Iblock\Iblock setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \Bitrix\Main\Type\DateTime getTimestampX()
	 * @method \Bitrix\Iblock\Iblock setTimestampX(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $timestampX)
	 * @method bool hasTimestampX()
	 * @method bool isTimestampXFilled()
	 * @method bool isTimestampXChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualTimestampX()
	 * @method \Bitrix\Main\Type\DateTime requireTimestampX()
	 * @method \Bitrix\Iblock\Iblock resetTimestampX()
	 * @method \Bitrix\Iblock\Iblock unsetTimestampX()
	 * @method \Bitrix\Main\Type\DateTime fillTimestampX()
	 * @method \string getIblockTypeId()
	 * @method \Bitrix\Iblock\Iblock setIblockTypeId(\string|\Bitrix\Main\DB\SqlExpression $iblockTypeId)
	 * @method bool hasIblockTypeId()
	 * @method bool isIblockTypeIdFilled()
	 * @method bool isIblockTypeIdChanged()
	 * @method \string remindActualIblockTypeId()
	 * @method \string requireIblockTypeId()
	 * @method \Bitrix\Iblock\Iblock resetIblockTypeId()
	 * @method \Bitrix\Iblock\Iblock unsetIblockTypeId()
	 * @method \string fillIblockTypeId()
	 * @method \string getLid()
	 * @method \Bitrix\Iblock\Iblock setLid(\string|\Bitrix\Main\DB\SqlExpression $lid)
	 * @method bool hasLid()
	 * @method bool isLidFilled()
	 * @method bool isLidChanged()
	 * @method \string remindActualLid()
	 * @method \string requireLid()
	 * @method \Bitrix\Iblock\Iblock resetLid()
	 * @method \Bitrix\Iblock\Iblock unsetLid()
	 * @method \string fillLid()
	 * @method \string getCode()
	 * @method \Bitrix\Iblock\Iblock setCode(\string|\Bitrix\Main\DB\SqlExpression $code)
	 * @method bool hasCode()
	 * @method bool isCodeFilled()
	 * @method bool isCodeChanged()
	 * @method \string remindActualCode()
	 * @method \string requireCode()
	 * @method \Bitrix\Iblock\Iblock resetCode()
	 * @method \Bitrix\Iblock\Iblock unsetCode()
	 * @method \string fillCode()
	 * @method \string getApiCode()
	 * @method \Bitrix\Iblock\Iblock setApiCode(\string|\Bitrix\Main\DB\SqlExpression $apiCode)
	 * @method bool hasApiCode()
	 * @method bool isApiCodeFilled()
	 * @method bool isApiCodeChanged()
	 * @method \string remindActualApiCode()
	 * @method \string requireApiCode()
	 * @method \Bitrix\Iblock\Iblock resetApiCode()
	 * @method \Bitrix\Iblock\Iblock unsetApiCode()
	 * @method \string fillApiCode()
	 * @method \boolean getRestOn()
	 * @method \Bitrix\Iblock\Iblock setRestOn(\boolean|\Bitrix\Main\DB\SqlExpression $restOn)
	 * @method bool hasRestOn()
	 * @method bool isRestOnFilled()
	 * @method bool isRestOnChanged()
	 * @method \boolean remindActualRestOn()
	 * @method \boolean requireRestOn()
	 * @method \Bitrix\Iblock\Iblock resetRestOn()
	 * @method \Bitrix\Iblock\Iblock unsetRestOn()
	 * @method \boolean fillRestOn()
	 * @method \string getName()
	 * @method \Bitrix\Iblock\Iblock setName(\string|\Bitrix\Main\DB\SqlExpression $name)
	 * @method bool hasName()
	 * @method bool isNameFilled()
	 * @method bool isNameChanged()
	 * @method \string remindActualName()
	 * @method \string requireName()
	 * @method \Bitrix\Iblock\Iblock resetName()
	 * @method \Bitrix\Iblock\Iblock unsetName()
	 * @method \string fillName()
	 * @method \boolean getActive()
	 * @method \Bitrix\Iblock\Iblock setActive(\boolean|\Bitrix\Main\DB\SqlExpression $active)
	 * @method bool hasActive()
	 * @method bool isActiveFilled()
	 * @method bool isActiveChanged()
	 * @method \boolean remindActualActive()
	 * @method \boolean requireActive()
	 * @method \Bitrix\Iblock\Iblock resetActive()
	 * @method \Bitrix\Iblock\Iblock unsetActive()
	 * @method \boolean fillActive()
	 * @method \int getSort()
	 * @method \Bitrix\Iblock\Iblock setSort(\int|\Bitrix\Main\DB\SqlExpression $sort)
	 * @method bool hasSort()
	 * @method bool isSortFilled()
	 * @method bool isSortChanged()
	 * @method \int remindActualSort()
	 * @method \int requireSort()
	 * @method \Bitrix\Iblock\Iblock resetSort()
	 * @method \Bitrix\Iblock\Iblock unsetSort()
	 * @method \int fillSort()
	 * @method \string getListPageUrl()
	 * @method \Bitrix\Iblock\Iblock setListPageUrl(\string|\Bitrix\Main\DB\SqlExpression $listPageUrl)
	 * @method bool hasListPageUrl()
	 * @method bool isListPageUrlFilled()
	 * @method bool isListPageUrlChanged()
	 * @method \string remindActualListPageUrl()
	 * @method \string requireListPageUrl()
	 * @method \Bitrix\Iblock\Iblock resetListPageUrl()
	 * @method \Bitrix\Iblock\Iblock unsetListPageUrl()
	 * @method \string fillListPageUrl()
	 * @method \string getDetailPageUrl()
	 * @method \Bitrix\Iblock\Iblock setDetailPageUrl(\string|\Bitrix\Main\DB\SqlExpression $detailPageUrl)
	 * @method bool hasDetailPageUrl()
	 * @method bool isDetailPageUrlFilled()
	 * @method bool isDetailPageUrlChanged()
	 * @method \string remindActualDetailPageUrl()
	 * @method \string requireDetailPageUrl()
	 * @method \Bitrix\Iblock\Iblock resetDetailPageUrl()
	 * @method \Bitrix\Iblock\Iblock unsetDetailPageUrl()
	 * @method \string fillDetailPageUrl()
	 * @method \string getSectionPageUrl()
	 * @method \Bitrix\Iblock\Iblock setSectionPageUrl(\string|\Bitrix\Main\DB\SqlExpression $sectionPageUrl)
	 * @method bool hasSectionPageUrl()
	 * @method bool isSectionPageUrlFilled()
	 * @method bool isSectionPageUrlChanged()
	 * @method \string remindActualSectionPageUrl()
	 * @method \string requireSectionPageUrl()
	 * @method \Bitrix\Iblock\Iblock resetSectionPageUrl()
	 * @method \Bitrix\Iblock\Iblock unsetSectionPageUrl()
	 * @method \string fillSectionPageUrl()
	 * @method \string getCanonicalPageUrl()
	 * @method \Bitrix\Iblock\Iblock setCanonicalPageUrl(\string|\Bitrix\Main\DB\SqlExpression $canonicalPageUrl)
	 * @method bool hasCanonicalPageUrl()
	 * @method bool isCanonicalPageUrlFilled()
	 * @method bool isCanonicalPageUrlChanged()
	 * @method \string remindActualCanonicalPageUrl()
	 * @method \string requireCanonicalPageUrl()
	 * @method \Bitrix\Iblock\Iblock resetCanonicalPageUrl()
	 * @method \Bitrix\Iblock\Iblock unsetCanonicalPageUrl()
	 * @method \string fillCanonicalPageUrl()
	 * @method \int getPicture()
	 * @method \Bitrix\Iblock\Iblock setPicture(\int|\Bitrix\Main\DB\SqlExpression $picture)
	 * @method bool hasPicture()
	 * @method bool isPictureFilled()
	 * @method bool isPictureChanged()
	 * @method \int remindActualPicture()
	 * @method \int requirePicture()
	 * @method \Bitrix\Iblock\Iblock resetPicture()
	 * @method \Bitrix\Iblock\Iblock unsetPicture()
	 * @method \int fillPicture()
	 * @method \string getDescription()
	 * @method \Bitrix\Iblock\Iblock setDescription(\string|\Bitrix\Main\DB\SqlExpression $description)
	 * @method bool hasDescription()
	 * @method bool isDescriptionFilled()
	 * @method bool isDescriptionChanged()
	 * @method \string remindActualDescription()
	 * @method \string requireDescription()
	 * @method \Bitrix\Iblock\Iblock resetDescription()
	 * @method \Bitrix\Iblock\Iblock unsetDescription()
	 * @method \string fillDescription()
	 * @method \string getDescriptionType()
	 * @method \Bitrix\Iblock\Iblock setDescriptionType(\string|\Bitrix\Main\DB\SqlExpression $descriptionType)
	 * @method bool hasDescriptionType()
	 * @method bool isDescriptionTypeFilled()
	 * @method bool isDescriptionTypeChanged()
	 * @method \string remindActualDescriptionType()
	 * @method \string requireDescriptionType()
	 * @method \Bitrix\Iblock\Iblock resetDescriptionType()
	 * @method \Bitrix\Iblock\Iblock unsetDescriptionType()
	 * @method \string fillDescriptionType()
	 * @method \string getXmlId()
	 * @method \Bitrix\Iblock\Iblock setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \Bitrix\Iblock\Iblock resetXmlId()
	 * @method \Bitrix\Iblock\Iblock unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \string getTmpId()
	 * @method \Bitrix\Iblock\Iblock setTmpId(\string|\Bitrix\Main\DB\SqlExpression $tmpId)
	 * @method bool hasTmpId()
	 * @method bool isTmpIdFilled()
	 * @method bool isTmpIdChanged()
	 * @method \string remindActualTmpId()
	 * @method \string requireTmpId()
	 * @method \Bitrix\Iblock\Iblock resetTmpId()
	 * @method \Bitrix\Iblock\Iblock unsetTmpId()
	 * @method \string fillTmpId()
	 * @method \boolean getIndexElement()
	 * @method \Bitrix\Iblock\Iblock setIndexElement(\boolean|\Bitrix\Main\DB\SqlExpression $indexElement)
	 * @method bool hasIndexElement()
	 * @method bool isIndexElementFilled()
	 * @method bool isIndexElementChanged()
	 * @method \boolean remindActualIndexElement()
	 * @method \boolean requireIndexElement()
	 * @method \Bitrix\Iblock\Iblock resetIndexElement()
	 * @method \Bitrix\Iblock\Iblock unsetIndexElement()
	 * @method \boolean fillIndexElement()
	 * @method \boolean getIndexSection()
	 * @method \Bitrix\Iblock\Iblock setIndexSection(\boolean|\Bitrix\Main\DB\SqlExpression $indexSection)
	 * @method bool hasIndexSection()
	 * @method bool isIndexSectionFilled()
	 * @method bool isIndexSectionChanged()
	 * @method \boolean remindActualIndexSection()
	 * @method \boolean requireIndexSection()
	 * @method \Bitrix\Iblock\Iblock resetIndexSection()
	 * @method \Bitrix\Iblock\Iblock unsetIndexSection()
	 * @method \boolean fillIndexSection()
	 * @method \boolean getWorkflow()
	 * @method \Bitrix\Iblock\Iblock setWorkflow(\boolean|\Bitrix\Main\DB\SqlExpression $workflow)
	 * @method bool hasWorkflow()
	 * @method bool isWorkflowFilled()
	 * @method bool isWorkflowChanged()
	 * @method \boolean remindActualWorkflow()
	 * @method \boolean requireWorkflow()
	 * @method \Bitrix\Iblock\Iblock resetWorkflow()
	 * @method \Bitrix\Iblock\Iblock unsetWorkflow()
	 * @method \boolean fillWorkflow()
	 * @method \boolean getBizproc()
	 * @method \Bitrix\Iblock\Iblock setBizproc(\boolean|\Bitrix\Main\DB\SqlExpression $bizproc)
	 * @method bool hasBizproc()
	 * @method bool isBizprocFilled()
	 * @method bool isBizprocChanged()
	 * @method \boolean remindActualBizproc()
	 * @method \boolean requireBizproc()
	 * @method \Bitrix\Iblock\Iblock resetBizproc()
	 * @method \Bitrix\Iblock\Iblock unsetBizproc()
	 * @method \boolean fillBizproc()
	 * @method \string getSectionChooser()
	 * @method \Bitrix\Iblock\Iblock setSectionChooser(\string|\Bitrix\Main\DB\SqlExpression $sectionChooser)
	 * @method bool hasSectionChooser()
	 * @method bool isSectionChooserFilled()
	 * @method bool isSectionChooserChanged()
	 * @method \string remindActualSectionChooser()
	 * @method \string requireSectionChooser()
	 * @method \Bitrix\Iblock\Iblock resetSectionChooser()
	 * @method \Bitrix\Iblock\Iblock unsetSectionChooser()
	 * @method \string fillSectionChooser()
	 * @method \string getListMode()
	 * @method \Bitrix\Iblock\Iblock setListMode(\string|\Bitrix\Main\DB\SqlExpression $listMode)
	 * @method bool hasListMode()
	 * @method bool isListModeFilled()
	 * @method bool isListModeChanged()
	 * @method \string remindActualListMode()
	 * @method \string requireListMode()
	 * @method \Bitrix\Iblock\Iblock resetListMode()
	 * @method \Bitrix\Iblock\Iblock unsetListMode()
	 * @method \string fillListMode()
	 * @method \string getRightsMode()
	 * @method \Bitrix\Iblock\Iblock setRightsMode(\string|\Bitrix\Main\DB\SqlExpression $rightsMode)
	 * @method bool hasRightsMode()
	 * @method bool isRightsModeFilled()
	 * @method bool isRightsModeChanged()
	 * @method \string remindActualRightsMode()
	 * @method \string requireRightsMode()
	 * @method \Bitrix\Iblock\Iblock resetRightsMode()
	 * @method \Bitrix\Iblock\Iblock unsetRightsMode()
	 * @method \string fillRightsMode()
	 * @method \boolean getSectionProperty()
	 * @method \Bitrix\Iblock\Iblock setSectionProperty(\boolean|\Bitrix\Main\DB\SqlExpression $sectionProperty)
	 * @method bool hasSectionProperty()
	 * @method bool isSectionPropertyFilled()
	 * @method bool isSectionPropertyChanged()
	 * @method \boolean remindActualSectionProperty()
	 * @method \boolean requireSectionProperty()
	 * @method \Bitrix\Iblock\Iblock resetSectionProperty()
	 * @method \Bitrix\Iblock\Iblock unsetSectionProperty()
	 * @method \boolean fillSectionProperty()
	 * @method \string getPropertyIndex()
	 * @method \Bitrix\Iblock\Iblock setPropertyIndex(\string|\Bitrix\Main\DB\SqlExpression $propertyIndex)
	 * @method bool hasPropertyIndex()
	 * @method bool isPropertyIndexFilled()
	 * @method bool isPropertyIndexChanged()
	 * @method \string remindActualPropertyIndex()
	 * @method \string requirePropertyIndex()
	 * @method \Bitrix\Iblock\Iblock resetPropertyIndex()
	 * @method \Bitrix\Iblock\Iblock unsetPropertyIndex()
	 * @method \string fillPropertyIndex()
	 * @method \string getVersion()
	 * @method \Bitrix\Iblock\Iblock setVersion(\string|\Bitrix\Main\DB\SqlExpression $version)
	 * @method bool hasVersion()
	 * @method bool isVersionFilled()
	 * @method bool isVersionChanged()
	 * @method \string remindActualVersion()
	 * @method \string requireVersion()
	 * @method \Bitrix\Iblock\Iblock resetVersion()
	 * @method \Bitrix\Iblock\Iblock unsetVersion()
	 * @method \string fillVersion()
	 * @method \int getLastConvElement()
	 * @method \Bitrix\Iblock\Iblock setLastConvElement(\int|\Bitrix\Main\DB\SqlExpression $lastConvElement)
	 * @method bool hasLastConvElement()
	 * @method bool isLastConvElementFilled()
	 * @method bool isLastConvElementChanged()
	 * @method \int remindActualLastConvElement()
	 * @method \int requireLastConvElement()
	 * @method \Bitrix\Iblock\Iblock resetLastConvElement()
	 * @method \Bitrix\Iblock\Iblock unsetLastConvElement()
	 * @method \int fillLastConvElement()
	 * @method \int getSocnetGroupId()
	 * @method \Bitrix\Iblock\Iblock setSocnetGroupId(\int|\Bitrix\Main\DB\SqlExpression $socnetGroupId)
	 * @method bool hasSocnetGroupId()
	 * @method bool isSocnetGroupIdFilled()
	 * @method bool isSocnetGroupIdChanged()
	 * @method \int remindActualSocnetGroupId()
	 * @method \int requireSocnetGroupId()
	 * @method \Bitrix\Iblock\Iblock resetSocnetGroupId()
	 * @method \Bitrix\Iblock\Iblock unsetSocnetGroupId()
	 * @method \int fillSocnetGroupId()
	 * @method \string getEditFileBefore()
	 * @method \Bitrix\Iblock\Iblock setEditFileBefore(\string|\Bitrix\Main\DB\SqlExpression $editFileBefore)
	 * @method bool hasEditFileBefore()
	 * @method bool isEditFileBeforeFilled()
	 * @method bool isEditFileBeforeChanged()
	 * @method \string remindActualEditFileBefore()
	 * @method \string requireEditFileBefore()
	 * @method \Bitrix\Iblock\Iblock resetEditFileBefore()
	 * @method \Bitrix\Iblock\Iblock unsetEditFileBefore()
	 * @method \string fillEditFileBefore()
	 * @method \string getEditFileAfter()
	 * @method \Bitrix\Iblock\Iblock setEditFileAfter(\string|\Bitrix\Main\DB\SqlExpression $editFileAfter)
	 * @method bool hasEditFileAfter()
	 * @method bool isEditFileAfterFilled()
	 * @method bool isEditFileAfterChanged()
	 * @method \string remindActualEditFileAfter()
	 * @method \string requireEditFileAfter()
	 * @method \Bitrix\Iblock\Iblock resetEditFileAfter()
	 * @method \Bitrix\Iblock\Iblock unsetEditFileAfter()
	 * @method \string fillEditFileAfter()
	 * @method \Bitrix\Iblock\EO_Type getType()
	 * @method \Bitrix\Iblock\EO_Type remindActualType()
	 * @method \Bitrix\Iblock\EO_Type requireType()
	 * @method \Bitrix\Iblock\Iblock setType(\Bitrix\Iblock\EO_Type $object)
	 * @method \Bitrix\Iblock\Iblock resetType()
	 * @method \Bitrix\Iblock\Iblock unsetType()
	 * @method bool hasType()
	 * @method bool isTypeFilled()
	 * @method bool isTypeChanged()
	 * @method \Bitrix\Iblock\EO_Type fillType()
	 * @method \Bitrix\Iblock\EO_Property_Collection getProperties()
	 * @method \Bitrix\Iblock\EO_Property_Collection requireProperties()
	 * @method \Bitrix\Iblock\EO_Property_Collection fillProperties()
	 * @method bool hasProperties()
	 * @method bool isPropertiesFilled()
	 * @method bool isPropertiesChanged()
	 * @method void addToProperties(\Bitrix\Iblock\Property $property)
	 * @method void removeFromProperties(\Bitrix\Iblock\Property $property)
	 * @method void removeAllProperties()
	 * @method \Bitrix\Iblock\Iblock resetProperties()
	 * @method \Bitrix\Iblock\Iblock unsetProperties()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Iblock\Iblock set($fieldName, $value)
	 * @method \Bitrix\Iblock\Iblock reset($fieldName)
	 * @method \Bitrix\Iblock\Iblock unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Iblock\Iblock wakeUp($data)
	 */
	class EO_Iblock {
		/* @var \Bitrix\Iblock\IblockTable */
		static public $dataClass = '\Bitrix\Iblock\IblockTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Iblock {
	/**
	 * EO_Iblock_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \Bitrix\Main\Type\DateTime[] getTimestampXList()
	 * @method \Bitrix\Main\Type\DateTime[] fillTimestampX()
	 * @method \string[] getIblockTypeIdList()
	 * @method \string[] fillIblockTypeId()
	 * @method \string[] getLidList()
	 * @method \string[] fillLid()
	 * @method \string[] getCodeList()
	 * @method \string[] fillCode()
	 * @method \string[] getApiCodeList()
	 * @method \string[] fillApiCode()
	 * @method \boolean[] getRestOnList()
	 * @method \boolean[] fillRestOn()
	 * @method \string[] getNameList()
	 * @method \string[] fillName()
	 * @method \boolean[] getActiveList()
	 * @method \boolean[] fillActive()
	 * @method \int[] getSortList()
	 * @method \int[] fillSort()
	 * @method \string[] getListPageUrlList()
	 * @method \string[] fillListPageUrl()
	 * @method \string[] getDetailPageUrlList()
	 * @method \string[] fillDetailPageUrl()
	 * @method \string[] getSectionPageUrlList()
	 * @method \string[] fillSectionPageUrl()
	 * @method \string[] getCanonicalPageUrlList()
	 * @method \string[] fillCanonicalPageUrl()
	 * @method \int[] getPictureList()
	 * @method \int[] fillPicture()
	 * @method \string[] getDescriptionList()
	 * @method \string[] fillDescription()
	 * @method \string[] getDescriptionTypeList()
	 * @method \string[] fillDescriptionType()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \string[] getTmpIdList()
	 * @method \string[] fillTmpId()
	 * @method \boolean[] getIndexElementList()
	 * @method \boolean[] fillIndexElement()
	 * @method \boolean[] getIndexSectionList()
	 * @method \boolean[] fillIndexSection()
	 * @method \boolean[] getWorkflowList()
	 * @method \boolean[] fillWorkflow()
	 * @method \boolean[] getBizprocList()
	 * @method \boolean[] fillBizproc()
	 * @method \string[] getSectionChooserList()
	 * @method \string[] fillSectionChooser()
	 * @method \string[] getListModeList()
	 * @method \string[] fillListMode()
	 * @method \string[] getRightsModeList()
	 * @method \string[] fillRightsMode()
	 * @method \boolean[] getSectionPropertyList()
	 * @method \boolean[] fillSectionProperty()
	 * @method \string[] getPropertyIndexList()
	 * @method \string[] fillPropertyIndex()
	 * @method \string[] getVersionList()
	 * @method \string[] fillVersion()
	 * @method \int[] getLastConvElementList()
	 * @method \int[] fillLastConvElement()
	 * @method \int[] getSocnetGroupIdList()
	 * @method \int[] fillSocnetGroupId()
	 * @method \string[] getEditFileBeforeList()
	 * @method \string[] fillEditFileBefore()
	 * @method \string[] getEditFileAfterList()
	 * @method \string[] fillEditFileAfter()
	 * @method \Bitrix\Iblock\EO_Type[] getTypeList()
	 * @method \Bitrix\Iblock\EO_Iblock_Collection getTypeCollection()
	 * @method \Bitrix\Iblock\EO_Type_Collection fillType()
	 * @method \Bitrix\Iblock\EO_Property_Collection[] getPropertiesList()
	 * @method \Bitrix\Iblock\EO_Property_Collection getPropertiesCollection()
	 * @method \Bitrix\Iblock\EO_Property_Collection fillProperties()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Iblock\Iblock $object)
	 * @method bool has(\Bitrix\Iblock\Iblock $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Iblock\Iblock getByPrimary($primary)
	 * @method \Bitrix\Iblock\Iblock[] getAll()
	 * @method bool remove(\Bitrix\Iblock\Iblock $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Iblock\EO_Iblock_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Iblock\Iblock current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Iblock_Collection merge(?EO_Iblock_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Iblock_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Iblock\IblockTable */
		static public $dataClass = '\Bitrix\Iblock\IblockTable';
	}
}
namespace Bitrix\Iblock {
	/**
	 * @method static EO_Iblock_Query query()
	 * @method static EO_Iblock_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Iblock_Result getById($id)
	 * @method static EO_Iblock_Result getList(array $parameters = [])
	 * @method static EO_Iblock_Entity getEntity()
	 * @method static \Bitrix\Iblock\Iblock createObject($setDefaultValues = true)
	 * @method static \Bitrix\Iblock\EO_Iblock_Collection createCollection()
	 * @method static \Bitrix\Iblock\Iblock wakeUpObject($row)
	 * @method static \Bitrix\Iblock\EO_Iblock_Collection wakeUpCollection($rows)
	 */
	class IblockTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Iblock_Result exec()
	 * @method \Bitrix\Iblock\Iblock fetchObject()
	 * @method \Bitrix\Iblock\EO_Iblock_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Iblock_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Iblock\Iblock fetchObject()
	 * @method \Bitrix\Iblock\EO_Iblock_Collection fetchCollection()
	 */
	class EO_Iblock_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Iblock\Iblock createObject($setDefaultValues = true)
	 * @method \Bitrix\Iblock\EO_Iblock_Collection createCollection()
	 * @method \Bitrix\Iblock\Iblock wakeUpObject($row)
	 * @method \Bitrix\Iblock\EO_Iblock_Collection wakeUpCollection($rows)
	 */
	class EO_Iblock_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Crm\ContactUtsTable */
namespace Bitrix\Crm {
	/**
	 * EO_ContactUts
	 * @see \Bitrix\Crm\ContactUtsTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getValueId()
	 * @method \Bitrix\Crm\EO_ContactUts setValueId(\int|\Bitrix\Main\DB\SqlExpression $valueId)
	 * @method bool hasValueId()
	 * @method bool isValueIdFilled()
	 * @method bool isValueIdChanged()
	 * @method \Bitrix\Crm\Contact getParent()
	 * @method \Bitrix\Crm\Contact remindActualParent()
	 * @method \Bitrix\Crm\Contact requireParent()
	 * @method \Bitrix\Crm\EO_ContactUts setParent(\Bitrix\Crm\Contact $object)
	 * @method \Bitrix\Crm\EO_ContactUts resetParent()
	 * @method \Bitrix\Crm\EO_ContactUts unsetParent()
	 * @method bool hasParent()
	 * @method bool isParentFilled()
	 * @method bool isParentChanged()
	 * @method \Bitrix\Crm\Contact fillParent()
	 * @method ?\int getUfCrm1634118294911()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm1634118294911(?\int|\Bitrix\Main\DB\SqlExpression $ufCrm1634118294911)
	 * @method bool hasUfCrm1634118294911()
	 * @method bool isUfCrm1634118294911Filled()
	 * @method bool isUfCrm1634118294911Changed()
	 * @method ?\int remindActualUfCrm1634118294911()
	 * @method ?\int requireUfCrm1634118294911()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm1634118294911()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm1634118294911()
	 * @method ?\int fillUfCrm1634118294911()
	 * @method ?\int getUfCrm1648109417()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm1648109417(?\int|\Bitrix\Main\DB\SqlExpression $ufCrm1648109417)
	 * @method bool hasUfCrm1648109417()
	 * @method bool isUfCrm1648109417Filled()
	 * @method bool isUfCrm1648109417Changed()
	 * @method ?\int remindActualUfCrm1648109417()
	 * @method ?\int requireUfCrm1648109417()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm1648109417()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm1648109417()
	 * @method ?\int fillUfCrm1648109417()
	 * @method ?\float getUfCrm635660669eaad()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm635660669eaad(?\float|\Bitrix\Main\DB\SqlExpression $ufCrm635660669eaad)
	 * @method bool hasUfCrm635660669eaad()
	 * @method bool isUfCrm635660669eaadFilled()
	 * @method bool isUfCrm635660669eaadChanged()
	 * @method ?\float remindActualUfCrm635660669eaad()
	 * @method ?\float requireUfCrm635660669eaad()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm635660669eaad()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm635660669eaad()
	 * @method ?\float fillUfCrm635660669eaad()
	 * @method ?\Bitrix\Main\Type\DateTime getUfCrm63566066a950c()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566066a950c(?\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $ufCrm63566066a950c)
	 * @method bool hasUfCrm63566066a950c()
	 * @method bool isUfCrm63566066a950cFilled()
	 * @method bool isUfCrm63566066a950cChanged()
	 * @method ?\Bitrix\Main\Type\DateTime remindActualUfCrm63566066a950c()
	 * @method ?\Bitrix\Main\Type\DateTime requireUfCrm63566066a950c()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566066a950c()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566066a950c()
	 * @method ?\Bitrix\Main\Type\DateTime fillUfCrm63566066a950c()
	 * @method ?\float getUfCrm63566066b32cc()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566066b32cc(?\float|\Bitrix\Main\DB\SqlExpression $ufCrm63566066b32cc)
	 * @method bool hasUfCrm63566066b32cc()
	 * @method bool isUfCrm63566066b32ccFilled()
	 * @method bool isUfCrm63566066b32ccChanged()
	 * @method ?\float remindActualUfCrm63566066b32cc()
	 * @method ?\float requireUfCrm63566066b32cc()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566066b32cc()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566066b32cc()
	 * @method ?\float fillUfCrm63566066b32cc()
	 * @method ?\float getUfCrm63566066bd11a()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566066bd11a(?\float|\Bitrix\Main\DB\SqlExpression $ufCrm63566066bd11a)
	 * @method bool hasUfCrm63566066bd11a()
	 * @method bool isUfCrm63566066bd11aFilled()
	 * @method bool isUfCrm63566066bd11aChanged()
	 * @method ?\float remindActualUfCrm63566066bd11a()
	 * @method ?\float requireUfCrm63566066bd11a()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566066bd11a()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566066bd11a()
	 * @method ?\float fillUfCrm63566066bd11a()
	 * @method ?\float getUfCrm63566066c6b49()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566066c6b49(?\float|\Bitrix\Main\DB\SqlExpression $ufCrm63566066c6b49)
	 * @method bool hasUfCrm63566066c6b49()
	 * @method bool isUfCrm63566066c6b49Filled()
	 * @method bool isUfCrm63566066c6b49Changed()
	 * @method ?\float remindActualUfCrm63566066c6b49()
	 * @method ?\float requireUfCrm63566066c6b49()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566066c6b49()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566066c6b49()
	 * @method ?\float fillUfCrm63566066c6b49()
	 * @method ?\float getUfCrm63566066d0545()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566066d0545(?\float|\Bitrix\Main\DB\SqlExpression $ufCrm63566066d0545)
	 * @method bool hasUfCrm63566066d0545()
	 * @method bool isUfCrm63566066d0545Filled()
	 * @method bool isUfCrm63566066d0545Changed()
	 * @method ?\float remindActualUfCrm63566066d0545()
	 * @method ?\float requireUfCrm63566066d0545()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566066d0545()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566066d0545()
	 * @method ?\float fillUfCrm63566066d0545()
	 * @method ?\float getUfCrm63566066e4ee1()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566066e4ee1(?\float|\Bitrix\Main\DB\SqlExpression $ufCrm63566066e4ee1)
	 * @method bool hasUfCrm63566066e4ee1()
	 * @method bool isUfCrm63566066e4ee1Filled()
	 * @method bool isUfCrm63566066e4ee1Changed()
	 * @method ?\float remindActualUfCrm63566066e4ee1()
	 * @method ?\float requireUfCrm63566066e4ee1()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566066e4ee1()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566066e4ee1()
	 * @method ?\float fillUfCrm63566066e4ee1()
	 * @method ?\Bitrix\Main\Type\DateTime getUfCrm63566066ee731()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566066ee731(?\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $ufCrm63566066ee731)
	 * @method bool hasUfCrm63566066ee731()
	 * @method bool isUfCrm63566066ee731Filled()
	 * @method bool isUfCrm63566066ee731Changed()
	 * @method ?\Bitrix\Main\Type\DateTime remindActualUfCrm63566066ee731()
	 * @method ?\Bitrix\Main\Type\DateTime requireUfCrm63566066ee731()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566066ee731()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566066ee731()
	 * @method ?\Bitrix\Main\Type\DateTime fillUfCrm63566066ee731()
	 * @method ?\string getUfCrm635660670414e()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm635660670414e(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm635660670414e)
	 * @method bool hasUfCrm635660670414e()
	 * @method bool isUfCrm635660670414eFilled()
	 * @method bool isUfCrm635660670414eChanged()
	 * @method ?\string remindActualUfCrm635660670414e()
	 * @method ?\string requireUfCrm635660670414e()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm635660670414e()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm635660670414e()
	 * @method ?\string fillUfCrm635660670414e()
	 * @method ?\boolean getUfCrm635660670dcbc()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm635660670dcbc(?\boolean|\Bitrix\Main\DB\SqlExpression $ufCrm635660670dcbc)
	 * @method bool hasUfCrm635660670dcbc()
	 * @method bool isUfCrm635660670dcbcFilled()
	 * @method bool isUfCrm635660670dcbcChanged()
	 * @method ?\boolean remindActualUfCrm635660670dcbc()
	 * @method ?\boolean requireUfCrm635660670dcbc()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm635660670dcbc()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm635660670dcbc()
	 * @method ?\boolean fillUfCrm635660670dcbc()
	 * @method ?\Bitrix\Main\Type\DateTime getUfCrm6356606717487()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm6356606717487(?\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $ufCrm6356606717487)
	 * @method bool hasUfCrm6356606717487()
	 * @method bool isUfCrm6356606717487Filled()
	 * @method bool isUfCrm6356606717487Changed()
	 * @method ?\Bitrix\Main\Type\DateTime remindActualUfCrm6356606717487()
	 * @method ?\Bitrix\Main\Type\DateTime requireUfCrm6356606717487()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm6356606717487()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm6356606717487()
	 * @method ?\Bitrix\Main\Type\DateTime fillUfCrm6356606717487()
	 * @method ?\Bitrix\Main\Type\DateTime getUfCrm6356606720b70()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm6356606720b70(?\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $ufCrm6356606720b70)
	 * @method bool hasUfCrm6356606720b70()
	 * @method bool isUfCrm6356606720b70Filled()
	 * @method bool isUfCrm6356606720b70Changed()
	 * @method ?\Bitrix\Main\Type\DateTime remindActualUfCrm6356606720b70()
	 * @method ?\Bitrix\Main\Type\DateTime requireUfCrm6356606720b70()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm6356606720b70()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm6356606720b70()
	 * @method ?\Bitrix\Main\Type\DateTime fillUfCrm6356606720b70()
	 * @method ?\Bitrix\Main\Type\DateTime getUfCrm635660672a33c()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm635660672a33c(?\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $ufCrm635660672a33c)
	 * @method bool hasUfCrm635660672a33c()
	 * @method bool isUfCrm635660672a33cFilled()
	 * @method bool isUfCrm635660672a33cChanged()
	 * @method ?\Bitrix\Main\Type\DateTime remindActualUfCrm635660672a33c()
	 * @method ?\Bitrix\Main\Type\DateTime requireUfCrm635660672a33c()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm635660672a33c()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm635660672a33c()
	 * @method ?\Bitrix\Main\Type\DateTime fillUfCrm635660672a33c()
	 * @method ?\Bitrix\Main\Type\DateTime getUfCrm6356606733e46()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm6356606733e46(?\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $ufCrm6356606733e46)
	 * @method bool hasUfCrm6356606733e46()
	 * @method bool isUfCrm6356606733e46Filled()
	 * @method bool isUfCrm6356606733e46Changed()
	 * @method ?\Bitrix\Main\Type\DateTime remindActualUfCrm6356606733e46()
	 * @method ?\Bitrix\Main\Type\DateTime requireUfCrm6356606733e46()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm6356606733e46()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm6356606733e46()
	 * @method ?\Bitrix\Main\Type\DateTime fillUfCrm6356606733e46()
	 * @method ?\int getUfCrm635660673d81b()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm635660673d81b(?\int|\Bitrix\Main\DB\SqlExpression $ufCrm635660673d81b)
	 * @method bool hasUfCrm635660673d81b()
	 * @method bool isUfCrm635660673d81bFilled()
	 * @method bool isUfCrm635660673d81bChanged()
	 * @method ?\int remindActualUfCrm635660673d81b()
	 * @method ?\int requireUfCrm635660673d81b()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm635660673d81b()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm635660673d81b()
	 * @method ?\int fillUfCrm635660673d81b()
	 * @method ?\int getUfCrm635660675112d()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm635660675112d(?\int|\Bitrix\Main\DB\SqlExpression $ufCrm635660675112d)
	 * @method bool hasUfCrm635660675112d()
	 * @method bool isUfCrm635660675112dFilled()
	 * @method bool isUfCrm635660675112dChanged()
	 * @method ?\int remindActualUfCrm635660675112d()
	 * @method ?\int requireUfCrm635660675112d()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm635660675112d()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm635660675112d()
	 * @method ?\int fillUfCrm635660675112d()
	 * @method ?\string getUfCrm635660675a9cc()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm635660675a9cc(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm635660675a9cc)
	 * @method bool hasUfCrm635660675a9cc()
	 * @method bool isUfCrm635660675a9ccFilled()
	 * @method bool isUfCrm635660675a9ccChanged()
	 * @method ?\string remindActualUfCrm635660675a9cc()
	 * @method ?\string requireUfCrm635660675a9cc()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm635660675a9cc()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm635660675a9cc()
	 * @method ?\string fillUfCrm635660675a9cc()
	 * @method ?\int getUfCrm63566067642c7()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566067642c7(?\int|\Bitrix\Main\DB\SqlExpression $ufCrm63566067642c7)
	 * @method bool hasUfCrm63566067642c7()
	 * @method bool isUfCrm63566067642c7Filled()
	 * @method bool isUfCrm63566067642c7Changed()
	 * @method ?\int remindActualUfCrm63566067642c7()
	 * @method ?\int requireUfCrm63566067642c7()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566067642c7()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566067642c7()
	 * @method ?\int fillUfCrm63566067642c7()
	 * @method ?\int getUfCrm635660676e6cf()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm635660676e6cf(?\int|\Bitrix\Main\DB\SqlExpression $ufCrm635660676e6cf)
	 * @method bool hasUfCrm635660676e6cf()
	 * @method bool isUfCrm635660676e6cfFilled()
	 * @method bool isUfCrm635660676e6cfChanged()
	 * @method ?\int remindActualUfCrm635660676e6cf()
	 * @method ?\int requireUfCrm635660676e6cf()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm635660676e6cf()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm635660676e6cf()
	 * @method ?\int fillUfCrm635660676e6cf()
	 * @method ?\string getUfCrm6356606778c80()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm6356606778c80(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm6356606778c80)
	 * @method bool hasUfCrm6356606778c80()
	 * @method bool isUfCrm6356606778c80Filled()
	 * @method bool isUfCrm6356606778c80Changed()
	 * @method ?\string remindActualUfCrm6356606778c80()
	 * @method ?\string requireUfCrm6356606778c80()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm6356606778c80()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm6356606778c80()
	 * @method ?\string fillUfCrm6356606778c80()
	 * @method ?\string getUfCrm635660678bafd()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm635660678bafd(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm635660678bafd)
	 * @method bool hasUfCrm635660678bafd()
	 * @method bool isUfCrm635660678bafdFilled()
	 * @method bool isUfCrm635660678bafdChanged()
	 * @method ?\string remindActualUfCrm635660678bafd()
	 * @method ?\string requireUfCrm635660678bafd()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm635660678bafd()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm635660678bafd()
	 * @method ?\string fillUfCrm635660678bafd()
	 * @method ?\string getUfCrm6356606795e71()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm6356606795e71(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm6356606795e71)
	 * @method bool hasUfCrm6356606795e71()
	 * @method bool isUfCrm6356606795e71Filled()
	 * @method bool isUfCrm6356606795e71Changed()
	 * @method ?\string remindActualUfCrm6356606795e71()
	 * @method ?\string requireUfCrm6356606795e71()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm6356606795e71()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm6356606795e71()
	 * @method ?\string fillUfCrm6356606795e71()
	 * @method ?\int getUfCrm63566067a0a8e()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566067a0a8e(?\int|\Bitrix\Main\DB\SqlExpression $ufCrm63566067a0a8e)
	 * @method bool hasUfCrm63566067a0a8e()
	 * @method bool isUfCrm63566067a0a8eFilled()
	 * @method bool isUfCrm63566067a0a8eChanged()
	 * @method ?\int remindActualUfCrm63566067a0a8e()
	 * @method ?\int requireUfCrm63566067a0a8e()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566067a0a8e()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566067a0a8e()
	 * @method ?\int fillUfCrm63566067a0a8e()
	 * @method ?\string getUfCrm63566067abca0()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566067abca0(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm63566067abca0)
	 * @method bool hasUfCrm63566067abca0()
	 * @method bool isUfCrm63566067abca0Filled()
	 * @method bool isUfCrm63566067abca0Changed()
	 * @method ?\string remindActualUfCrm63566067abca0()
	 * @method ?\string requireUfCrm63566067abca0()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566067abca0()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566067abca0()
	 * @method ?\string fillUfCrm63566067abca0()
	 * @method ?\int getUfCrm63566067ccde6()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566067ccde6(?\int|\Bitrix\Main\DB\SqlExpression $ufCrm63566067ccde6)
	 * @method bool hasUfCrm63566067ccde6()
	 * @method bool isUfCrm63566067ccde6Filled()
	 * @method bool isUfCrm63566067ccde6Changed()
	 * @method ?\int remindActualUfCrm63566067ccde6()
	 * @method ?\int requireUfCrm63566067ccde6()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566067ccde6()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566067ccde6()
	 * @method ?\int fillUfCrm63566067ccde6()
	 * @method ?\string getUfCrm1669277612()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm1669277612(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm1669277612)
	 * @method bool hasUfCrm1669277612()
	 * @method bool isUfCrm1669277612Filled()
	 * @method bool isUfCrm1669277612Changed()
	 * @method ?\string remindActualUfCrm1669277612()
	 * @method ?\string requireUfCrm1669277612()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm1669277612()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm1669277612()
	 * @method ?\string fillUfCrm1669277612()
	 * @method ?\string getUfCrm1677834985()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm1677834985(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm1677834985)
	 * @method bool hasUfCrm1677834985()
	 * @method bool isUfCrm1677834985Filled()
	 * @method bool isUfCrm1677834985Changed()
	 * @method ?\string remindActualUfCrm1677834985()
	 * @method ?\string requireUfCrm1677834985()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm1677834985()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm1677834985()
	 * @method ?\string fillUfCrm1677834985()
	 * @method ?\string getUfCrm1677835111()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm1677835111(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm1677835111)
	 * @method bool hasUfCrm1677835111()
	 * @method bool isUfCrm1677835111Filled()
	 * @method bool isUfCrm1677835111Changed()
	 * @method ?\string remindActualUfCrm1677835111()
	 * @method ?\string requireUfCrm1677835111()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm1677835111()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm1677835111()
	 * @method ?\string fillUfCrm1677835111()
	 * @method ?\Bitrix\Main\Type\DateTime getUfCrm64ae43c5c647f()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c5c647f(?\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c5c647f)
	 * @method bool hasUfCrm64ae43c5c647f()
	 * @method bool isUfCrm64ae43c5c647fFilled()
	 * @method bool isUfCrm64ae43c5c647fChanged()
	 * @method ?\Bitrix\Main\Type\DateTime remindActualUfCrm64ae43c5c647f()
	 * @method ?\Bitrix\Main\Type\DateTime requireUfCrm64ae43c5c647f()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c5c647f()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c5c647f()
	 * @method ?\Bitrix\Main\Type\DateTime fillUfCrm64ae43c5c647f()
	 * @method ?\string getUfCrm64ae43c5dac14()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c5dac14(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c5dac14)
	 * @method bool hasUfCrm64ae43c5dac14()
	 * @method bool isUfCrm64ae43c5dac14Filled()
	 * @method bool isUfCrm64ae43c5dac14Changed()
	 * @method ?\string remindActualUfCrm64ae43c5dac14()
	 * @method ?\string requireUfCrm64ae43c5dac14()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c5dac14()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c5dac14()
	 * @method ?\string fillUfCrm64ae43c5dac14()
	 * @method ?\boolean getUfCrm64ae43c6026c6()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c6026c6(?\boolean|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c6026c6)
	 * @method bool hasUfCrm64ae43c6026c6()
	 * @method bool isUfCrm64ae43c6026c6Filled()
	 * @method bool isUfCrm64ae43c6026c6Changed()
	 * @method ?\boolean remindActualUfCrm64ae43c6026c6()
	 * @method ?\boolean requireUfCrm64ae43c6026c6()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c6026c6()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c6026c6()
	 * @method ?\boolean fillUfCrm64ae43c6026c6()
	 * @method ?\string getUfCrm64ae43c6105ac()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c6105ac(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c6105ac)
	 * @method bool hasUfCrm64ae43c6105ac()
	 * @method bool isUfCrm64ae43c6105acFilled()
	 * @method bool isUfCrm64ae43c6105acChanged()
	 * @method ?\string remindActualUfCrm64ae43c6105ac()
	 * @method ?\string requireUfCrm64ae43c6105ac()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c6105ac()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c6105ac()
	 * @method ?\string fillUfCrm64ae43c6105ac()
	 * @method ?\Bitrix\Main\Type\DateTime getUfCrm64ae43c61f5ac()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c61f5ac(?\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c61f5ac)
	 * @method bool hasUfCrm64ae43c61f5ac()
	 * @method bool isUfCrm64ae43c61f5acFilled()
	 * @method bool isUfCrm64ae43c61f5acChanged()
	 * @method ?\Bitrix\Main\Type\DateTime remindActualUfCrm64ae43c61f5ac()
	 * @method ?\Bitrix\Main\Type\DateTime requireUfCrm64ae43c61f5ac()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c61f5ac()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c61f5ac()
	 * @method ?\Bitrix\Main\Type\DateTime fillUfCrm64ae43c61f5ac()
	 * @method ?\float getUfCrm64ae43c62cdce()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c62cdce(?\float|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c62cdce)
	 * @method bool hasUfCrm64ae43c62cdce()
	 * @method bool isUfCrm64ae43c62cdceFilled()
	 * @method bool isUfCrm64ae43c62cdceChanged()
	 * @method ?\float remindActualUfCrm64ae43c62cdce()
	 * @method ?\float requireUfCrm64ae43c62cdce()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c62cdce()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c62cdce()
	 * @method ?\float fillUfCrm64ae43c62cdce()
	 * @method ?\boolean getUfCrm64ae43c64fe65()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c64fe65(?\boolean|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c64fe65)
	 * @method bool hasUfCrm64ae43c64fe65()
	 * @method bool isUfCrm64ae43c64fe65Filled()
	 * @method bool isUfCrm64ae43c64fe65Changed()
	 * @method ?\boolean remindActualUfCrm64ae43c64fe65()
	 * @method ?\boolean requireUfCrm64ae43c64fe65()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c64fe65()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c64fe65()
	 * @method ?\boolean fillUfCrm64ae43c64fe65()
	 * @method ?\string getUfCrm64ae43c65f164()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c65f164(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c65f164)
	 * @method bool hasUfCrm64ae43c65f164()
	 * @method bool isUfCrm64ae43c65f164Filled()
	 * @method bool isUfCrm64ae43c65f164Changed()
	 * @method ?\string remindActualUfCrm64ae43c65f164()
	 * @method ?\string requireUfCrm64ae43c65f164()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c65f164()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c65f164()
	 * @method ?\string fillUfCrm64ae43c65f164()
	 * @method ?\string getUfCrm64ae43c66cdd2()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c66cdd2(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c66cdd2)
	 * @method bool hasUfCrm64ae43c66cdd2()
	 * @method bool isUfCrm64ae43c66cdd2Filled()
	 * @method bool isUfCrm64ae43c66cdd2Changed()
	 * @method ?\string remindActualUfCrm64ae43c66cdd2()
	 * @method ?\string requireUfCrm64ae43c66cdd2()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c66cdd2()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c66cdd2()
	 * @method ?\string fillUfCrm64ae43c66cdd2()
	 * @method ?\string getUfCrm64ae43c679c97()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c679c97(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c679c97)
	 * @method bool hasUfCrm64ae43c679c97()
	 * @method bool isUfCrm64ae43c679c97Filled()
	 * @method bool isUfCrm64ae43c679c97Changed()
	 * @method ?\string remindActualUfCrm64ae43c679c97()
	 * @method ?\string requireUfCrm64ae43c679c97()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c679c97()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c679c97()
	 * @method ?\string fillUfCrm64ae43c679c97()
	 * @method ?\string getUfCrm64ae43c68978d()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c68978d(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c68978d)
	 * @method bool hasUfCrm64ae43c68978d()
	 * @method bool isUfCrm64ae43c68978dFilled()
	 * @method bool isUfCrm64ae43c68978dChanged()
	 * @method ?\string remindActualUfCrm64ae43c68978d()
	 * @method ?\string requireUfCrm64ae43c68978d()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c68978d()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c68978d()
	 * @method ?\string fillUfCrm64ae43c68978d()
	 * @method ?\Bitrix\Main\Type\DateTime getUfCrm64ae43c696a97()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c696a97(?\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c696a97)
	 * @method bool hasUfCrm64ae43c696a97()
	 * @method bool isUfCrm64ae43c696a97Filled()
	 * @method bool isUfCrm64ae43c696a97Changed()
	 * @method ?\Bitrix\Main\Type\DateTime remindActualUfCrm64ae43c696a97()
	 * @method ?\Bitrix\Main\Type\DateTime requireUfCrm64ae43c696a97()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c696a97()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c696a97()
	 * @method ?\Bitrix\Main\Type\DateTime fillUfCrm64ae43c696a97()
	 * @method ?\string getUfMws1cContactGuid()
	 * @method \Bitrix\Crm\EO_ContactUts setUfMws1cContactGuid(?\string|\Bitrix\Main\DB\SqlExpression $ufMws1cContactGuid)
	 * @method bool hasUfMws1cContactGuid()
	 * @method bool isUfMws1cContactGuidFilled()
	 * @method bool isUfMws1cContactGuidChanged()
	 * @method ?\string remindActualUfMws1cContactGuid()
	 * @method ?\string requireUfMws1cContactGuid()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfMws1cContactGuid()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfMws1cContactGuid()
	 * @method ?\string fillUfMws1cContactGuid()
	 * @method ?\int getUfHlTest()
	 * @method \Bitrix\Crm\EO_ContactUts setUfHlTest(?\int|\Bitrix\Main\DB\SqlExpression $ufHlTest)
	 * @method bool hasUfHlTest()
	 * @method bool isUfHlTestFilled()
	 * @method bool isUfHlTestChanged()
	 * @method ?\int remindActualUfHlTest()
	 * @method ?\int requireUfHlTest()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfHlTest()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfHlTest()
	 * @method ?\int fillUfHlTest()
	 * @method \EO_ProgersMonthClosed getUfHlTestRef()
	 * @method \EO_ProgersMonthClosed remindActualUfHlTestRef()
	 * @method \EO_ProgersMonthClosed requireUfHlTestRef()
	 * @method \Bitrix\Crm\EO_ContactUts setUfHlTestRef(\EO_ProgersMonthClosed $object)
	 * @method \Bitrix\Crm\EO_ContactUts resetUfHlTestRef()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfHlTestRef()
	 * @method bool hasUfHlTestRef()
	 * @method bool isUfHlTestRefFilled()
	 * @method bool isUfHlTestRefChanged()
	 * @method \EO_ProgersMonthClosed fillUfHlTestRef()
	 * @method ?\string getUfCrm63566067d6bf9()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566067d6bf9(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm63566067d6bf9)
	 * @method bool hasUfCrm63566067d6bf9()
	 * @method bool isUfCrm63566067d6bf9Filled()
	 * @method bool isUfCrm63566067d6bf9Changed()
	 * @method ?\string remindActualUfCrm63566067d6bf9()
	 * @method ?\string requireUfCrm63566067d6bf9()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566067d6bf9()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566067d6bf9()
	 * @method ?\string fillUfCrm63566067d6bf9()
	 * @method \string getUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566066da0fd(\string|\Bitrix\Main\DB\SqlExpression $ufCrm63566066da0fd)
	 * @method bool hasUfCrm63566066da0fd()
	 * @method bool isUfCrm63566066da0fdFilled()
	 * @method bool isUfCrm63566066da0fdChanged()
	 * @method \string remindActualUfCrm63566066da0fd()
	 * @method \string requireUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566066da0fd()
	 * @method \string fillUfCrm63566066da0fd()
	 * @method \string getUfCrm6356606747c42()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm6356606747c42(\string|\Bitrix\Main\DB\SqlExpression $ufCrm6356606747c42)
	 * @method bool hasUfCrm6356606747c42()
	 * @method bool isUfCrm6356606747c42Filled()
	 * @method bool isUfCrm6356606747c42Changed()
	 * @method \string remindActualUfCrm6356606747c42()
	 * @method \string requireUfCrm6356606747c42()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm6356606747c42()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm6356606747c42()
	 * @method \string fillUfCrm6356606747c42()
	 * @method \string getUfCrm6356606782474()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm6356606782474(\string|\Bitrix\Main\DB\SqlExpression $ufCrm6356606782474)
	 * @method bool hasUfCrm6356606782474()
	 * @method bool isUfCrm6356606782474Filled()
	 * @method bool isUfCrm6356606782474Changed()
	 * @method \string remindActualUfCrm6356606782474()
	 * @method \string requireUfCrm6356606782474()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm6356606782474()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm6356606782474()
	 * @method \string fillUfCrm6356606782474()
	 * @method \string getUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566067b69bf(\string|\Bitrix\Main\DB\SqlExpression $ufCrm63566067b69bf)
	 * @method bool hasUfCrm63566067b69bf()
	 * @method bool isUfCrm63566067b69bfFilled()
	 * @method bool isUfCrm63566067b69bfChanged()
	 * @method \string remindActualUfCrm63566067b69bf()
	 * @method \string requireUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566067b69bf()
	 * @method \string fillUfCrm63566067b69bf()
	 * @method \string getUfCrm63566067c0433()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm63566067c0433(\string|\Bitrix\Main\DB\SqlExpression $ufCrm63566067c0433)
	 * @method bool hasUfCrm63566067c0433()
	 * @method bool isUfCrm63566067c0433Filled()
	 * @method bool isUfCrm63566067c0433Changed()
	 * @method \string remindActualUfCrm63566067c0433()
	 * @method \string requireUfCrm63566067c0433()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm63566067c0433()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm63566067c0433()
	 * @method \string fillUfCrm63566067c0433()
	 * @method \string getUfCrm1672300269()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm1672300269(\string|\Bitrix\Main\DB\SqlExpression $ufCrm1672300269)
	 * @method bool hasUfCrm1672300269()
	 * @method bool isUfCrm1672300269Filled()
	 * @method bool isUfCrm1672300269Changed()
	 * @method \string remindActualUfCrm1672300269()
	 * @method \string requireUfCrm1672300269()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm1672300269()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm1672300269()
	 * @method \string fillUfCrm1672300269()
	 * @method \string getUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c5e8634(\string|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c5e8634)
	 * @method bool hasUfCrm64ae43c5e8634()
	 * @method bool isUfCrm64ae43c5e8634Filled()
	 * @method bool isUfCrm64ae43c5e8634Changed()
	 * @method \string remindActualUfCrm64ae43c5e8634()
	 * @method \string requireUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c5e8634()
	 * @method \string fillUfCrm64ae43c5e8634()
	 * @method \string getUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\EO_ContactUts setUfCrm64ae43c63a0ec(\string|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c63a0ec)
	 * @method bool hasUfCrm64ae43c63a0ec()
	 * @method bool isUfCrm64ae43c63a0ecFilled()
	 * @method bool isUfCrm64ae43c63a0ecChanged()
	 * @method \string remindActualUfCrm64ae43c63a0ec()
	 * @method \string requireUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\EO_ContactUts resetUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\EO_ContactUts unsetUfCrm64ae43c63a0ec()
	 * @method \string fillUfCrm64ae43c63a0ec()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Crm\EO_ContactUts set($fieldName, $value)
	 * @method \Bitrix\Crm\EO_ContactUts reset($fieldName)
	 * @method \Bitrix\Crm\EO_ContactUts unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Crm\EO_ContactUts wakeUp($data)
	 */
	class EO_ContactUts {
		/* @var \Bitrix\Crm\ContactUtsTable */
		static public $dataClass = '\Bitrix\Crm\ContactUtsTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Crm {
	/**
	 * EO_ContactUts_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getValueIdList()
	 * @method \Bitrix\Crm\Contact[] getParentList()
	 * @method \Bitrix\Crm\EO_ContactUts_Collection getParentCollection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillParent()
	 * @method ?\int[] getUfCrm1634118294911List()
	 * @method ?\int[] fillUfCrm1634118294911()
	 * @method ?\int[] getUfCrm1648109417List()
	 * @method ?\int[] fillUfCrm1648109417()
	 * @method ?\float[] getUfCrm635660669eaadList()
	 * @method ?\float[] fillUfCrm635660669eaad()
	 * @method ?\Bitrix\Main\Type\DateTime[] getUfCrm63566066a950cList()
	 * @method ?\Bitrix\Main\Type\DateTime[] fillUfCrm63566066a950c()
	 * @method ?\float[] getUfCrm63566066b32ccList()
	 * @method ?\float[] fillUfCrm63566066b32cc()
	 * @method ?\float[] getUfCrm63566066bd11aList()
	 * @method ?\float[] fillUfCrm63566066bd11a()
	 * @method ?\float[] getUfCrm63566066c6b49List()
	 * @method ?\float[] fillUfCrm63566066c6b49()
	 * @method ?\float[] getUfCrm63566066d0545List()
	 * @method ?\float[] fillUfCrm63566066d0545()
	 * @method ?\float[] getUfCrm63566066e4ee1List()
	 * @method ?\float[] fillUfCrm63566066e4ee1()
	 * @method ?\Bitrix\Main\Type\DateTime[] getUfCrm63566066ee731List()
	 * @method ?\Bitrix\Main\Type\DateTime[] fillUfCrm63566066ee731()
	 * @method ?\string[] getUfCrm635660670414eList()
	 * @method ?\string[] fillUfCrm635660670414e()
	 * @method ?\boolean[] getUfCrm635660670dcbcList()
	 * @method ?\boolean[] fillUfCrm635660670dcbc()
	 * @method ?\Bitrix\Main\Type\DateTime[] getUfCrm6356606717487List()
	 * @method ?\Bitrix\Main\Type\DateTime[] fillUfCrm6356606717487()
	 * @method ?\Bitrix\Main\Type\DateTime[] getUfCrm6356606720b70List()
	 * @method ?\Bitrix\Main\Type\DateTime[] fillUfCrm6356606720b70()
	 * @method ?\Bitrix\Main\Type\DateTime[] getUfCrm635660672a33cList()
	 * @method ?\Bitrix\Main\Type\DateTime[] fillUfCrm635660672a33c()
	 * @method ?\Bitrix\Main\Type\DateTime[] getUfCrm6356606733e46List()
	 * @method ?\Bitrix\Main\Type\DateTime[] fillUfCrm6356606733e46()
	 * @method ?\int[] getUfCrm635660673d81bList()
	 * @method ?\int[] fillUfCrm635660673d81b()
	 * @method ?\int[] getUfCrm635660675112dList()
	 * @method ?\int[] fillUfCrm635660675112d()
	 * @method ?\string[] getUfCrm635660675a9ccList()
	 * @method ?\string[] fillUfCrm635660675a9cc()
	 * @method ?\int[] getUfCrm63566067642c7List()
	 * @method ?\int[] fillUfCrm63566067642c7()
	 * @method ?\int[] getUfCrm635660676e6cfList()
	 * @method ?\int[] fillUfCrm635660676e6cf()
	 * @method ?\string[] getUfCrm6356606778c80List()
	 * @method ?\string[] fillUfCrm6356606778c80()
	 * @method ?\string[] getUfCrm635660678bafdList()
	 * @method ?\string[] fillUfCrm635660678bafd()
	 * @method ?\string[] getUfCrm6356606795e71List()
	 * @method ?\string[] fillUfCrm6356606795e71()
	 * @method ?\int[] getUfCrm63566067a0a8eList()
	 * @method ?\int[] fillUfCrm63566067a0a8e()
	 * @method ?\string[] getUfCrm63566067abca0List()
	 * @method ?\string[] fillUfCrm63566067abca0()
	 * @method ?\int[] getUfCrm63566067ccde6List()
	 * @method ?\int[] fillUfCrm63566067ccde6()
	 * @method ?\string[] getUfCrm1669277612List()
	 * @method ?\string[] fillUfCrm1669277612()
	 * @method ?\string[] getUfCrm1677834985List()
	 * @method ?\string[] fillUfCrm1677834985()
	 * @method ?\string[] getUfCrm1677835111List()
	 * @method ?\string[] fillUfCrm1677835111()
	 * @method ?\Bitrix\Main\Type\DateTime[] getUfCrm64ae43c5c647fList()
	 * @method ?\Bitrix\Main\Type\DateTime[] fillUfCrm64ae43c5c647f()
	 * @method ?\string[] getUfCrm64ae43c5dac14List()
	 * @method ?\string[] fillUfCrm64ae43c5dac14()
	 * @method ?\boolean[] getUfCrm64ae43c6026c6List()
	 * @method ?\boolean[] fillUfCrm64ae43c6026c6()
	 * @method ?\string[] getUfCrm64ae43c6105acList()
	 * @method ?\string[] fillUfCrm64ae43c6105ac()
	 * @method ?\Bitrix\Main\Type\DateTime[] getUfCrm64ae43c61f5acList()
	 * @method ?\Bitrix\Main\Type\DateTime[] fillUfCrm64ae43c61f5ac()
	 * @method ?\float[] getUfCrm64ae43c62cdceList()
	 * @method ?\float[] fillUfCrm64ae43c62cdce()
	 * @method ?\boolean[] getUfCrm64ae43c64fe65List()
	 * @method ?\boolean[] fillUfCrm64ae43c64fe65()
	 * @method ?\string[] getUfCrm64ae43c65f164List()
	 * @method ?\string[] fillUfCrm64ae43c65f164()
	 * @method ?\string[] getUfCrm64ae43c66cdd2List()
	 * @method ?\string[] fillUfCrm64ae43c66cdd2()
	 * @method ?\string[] getUfCrm64ae43c679c97List()
	 * @method ?\string[] fillUfCrm64ae43c679c97()
	 * @method ?\string[] getUfCrm64ae43c68978dList()
	 * @method ?\string[] fillUfCrm64ae43c68978d()
	 * @method ?\Bitrix\Main\Type\DateTime[] getUfCrm64ae43c696a97List()
	 * @method ?\Bitrix\Main\Type\DateTime[] fillUfCrm64ae43c696a97()
	 * @method ?\string[] getUfMws1cContactGuidList()
	 * @method ?\string[] fillUfMws1cContactGuid()
	 * @method ?\int[] getUfHlTestList()
	 * @method ?\int[] fillUfHlTest()
	 * @method \EO_ProgersMonthClosed[] getUfHlTestRefList()
	 * @method \Bitrix\Crm\EO_ContactUts_Collection getUfHlTestRefCollection()
	 * @method \EO_ProgersMonthClosed_Collection fillUfHlTestRef()
	 * @method ?\string[] getUfCrm63566067d6bf9List()
	 * @method ?\string[] fillUfCrm63566067d6bf9()
	 * @method \string[] getUfCrm63566066da0fdList()
	 * @method \string[] fillUfCrm63566066da0fd()
	 * @method \string[] getUfCrm6356606747c42List()
	 * @method \string[] fillUfCrm6356606747c42()
	 * @method \string[] getUfCrm6356606782474List()
	 * @method \string[] fillUfCrm6356606782474()
	 * @method \string[] getUfCrm63566067b69bfList()
	 * @method \string[] fillUfCrm63566067b69bf()
	 * @method \string[] getUfCrm63566067c0433List()
	 * @method \string[] fillUfCrm63566067c0433()
	 * @method \string[] getUfCrm1672300269List()
	 * @method \string[] fillUfCrm1672300269()
	 * @method \string[] getUfCrm64ae43c5e8634List()
	 * @method \string[] fillUfCrm64ae43c5e8634()
	 * @method \string[] getUfCrm64ae43c63a0ecList()
	 * @method \string[] fillUfCrm64ae43c63a0ec()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Crm\EO_ContactUts $object)
	 * @method bool has(\Bitrix\Crm\EO_ContactUts $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Crm\EO_ContactUts getByPrimary($primary)
	 * @method \Bitrix\Crm\EO_ContactUts[] getAll()
	 * @method bool remove(\Bitrix\Crm\EO_ContactUts $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Crm\EO_ContactUts_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Crm\EO_ContactUts current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_ContactUts_Collection merge(?EO_ContactUts_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_ContactUts_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Crm\ContactUtsTable */
		static public $dataClass = '\Bitrix\Crm\ContactUtsTable';
	}
}
namespace Bitrix\Crm {
	/**
	 * @method static EO_ContactUts_Query query()
	 * @method static EO_ContactUts_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_ContactUts_Result getById($id)
	 * @method static EO_ContactUts_Result getList(array $parameters = [])
	 * @method static EO_ContactUts_Entity getEntity()
	 * @method static \Bitrix\Crm\EO_ContactUts createObject($setDefaultValues = true)
	 * @method static \Bitrix\Crm\EO_ContactUts_Collection createCollection()
	 * @method static \Bitrix\Crm\EO_ContactUts wakeUpObject($row)
	 * @method static \Bitrix\Crm\EO_ContactUts_Collection wakeUpCollection($rows)
	 */
	class ContactUtsTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_ContactUts_Result exec()
	 * @method \Bitrix\Crm\EO_ContactUts fetchObject()
	 * @method \Bitrix\Crm\EO_ContactUts_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_ContactUts_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Crm\EO_ContactUts fetchObject()
	 * @method \Bitrix\Crm\EO_ContactUts_Collection fetchCollection()
	 */
	class EO_ContactUts_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Crm\EO_ContactUts createObject($setDefaultValues = true)
	 * @method \Bitrix\Crm\EO_ContactUts_Collection createCollection()
	 * @method \Bitrix\Crm\EO_ContactUts wakeUpObject($row)
	 * @method \Bitrix\Crm\EO_ContactUts_Collection wakeUpCollection($rows)
	 */
	class EO_ContactUts_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Highloadblock\HighloadBlockTable */
namespace Bitrix\Highloadblock {
	/**
	 * HighloadBlock
	 * @see \Bitrix\Highloadblock\HighloadBlockTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Highloadblock\HighloadBlock setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getName()
	 * @method \Bitrix\Highloadblock\HighloadBlock setName(\string|\Bitrix\Main\DB\SqlExpression $name)
	 * @method bool hasName()
	 * @method bool isNameFilled()
	 * @method bool isNameChanged()
	 * @method \string remindActualName()
	 * @method \string requireName()
	 * @method \Bitrix\Highloadblock\HighloadBlock resetName()
	 * @method \Bitrix\Highloadblock\HighloadBlock unsetName()
	 * @method \string fillName()
	 * @method \string getTableName()
	 * @method \Bitrix\Highloadblock\HighloadBlock setTableName(\string|\Bitrix\Main\DB\SqlExpression $tableName)
	 * @method bool hasTableName()
	 * @method bool isTableNameFilled()
	 * @method bool isTableNameChanged()
	 * @method \string remindActualTableName()
	 * @method \string requireTableName()
	 * @method \Bitrix\Highloadblock\HighloadBlock resetTableName()
	 * @method \Bitrix\Highloadblock\HighloadBlock unsetTableName()
	 * @method \string fillTableName()
	 * @method \int getFieldsCount()
	 * @method \int remindActualFieldsCount()
	 * @method \int requireFieldsCount()
	 * @method bool hasFieldsCount()
	 * @method bool isFieldsCountFilled()
	 * @method \Bitrix\Highloadblock\HighloadBlock unsetFieldsCount()
	 * @method \int fillFieldsCount()
	 * @method \Bitrix\Highloadblock\EO_HighloadBlockLang getLang()
	 * @method \Bitrix\Highloadblock\EO_HighloadBlockLang remindActualLang()
	 * @method \Bitrix\Highloadblock\EO_HighloadBlockLang requireLang()
	 * @method \Bitrix\Highloadblock\HighloadBlock setLang(\Bitrix\Highloadblock\EO_HighloadBlockLang $object)
	 * @method \Bitrix\Highloadblock\HighloadBlock resetLang()
	 * @method \Bitrix\Highloadblock\HighloadBlock unsetLang()
	 * @method bool hasLang()
	 * @method bool isLangFilled()
	 * @method bool isLangChanged()
	 * @method \Bitrix\Highloadblock\EO_HighloadBlockLang fillLang()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Highloadblock\HighloadBlock set($fieldName, $value)
	 * @method \Bitrix\Highloadblock\HighloadBlock reset($fieldName)
	 * @method \Bitrix\Highloadblock\HighloadBlock unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Highloadblock\HighloadBlock wakeUp($data)
	 */
	class EO_HighloadBlock {
		/* @var \Bitrix\Highloadblock\HighloadBlockTable */
		static public $dataClass = '\Bitrix\Highloadblock\HighloadBlockTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Highloadblock {
	/**
	 * EO_HighloadBlock_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getNameList()
	 * @method \string[] fillName()
	 * @method \string[] getTableNameList()
	 * @method \string[] fillTableName()
	 * @method \int[] getFieldsCountList()
	 * @method \int[] fillFieldsCount()
	 * @method \Bitrix\Highloadblock\EO_HighloadBlockLang[] getLangList()
	 * @method \Bitrix\Highloadblock\EO_HighloadBlock_Collection getLangCollection()
	 * @method \Bitrix\Highloadblock\EO_HighloadBlockLang_Collection fillLang()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Highloadblock\HighloadBlock $object)
	 * @method bool has(\Bitrix\Highloadblock\HighloadBlock $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Highloadblock\HighloadBlock getByPrimary($primary)
	 * @method \Bitrix\Highloadblock\HighloadBlock[] getAll()
	 * @method bool remove(\Bitrix\Highloadblock\HighloadBlock $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Highloadblock\EO_HighloadBlock_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Highloadblock\HighloadBlock current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_HighloadBlock_Collection merge(?EO_HighloadBlock_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_HighloadBlock_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Highloadblock\HighloadBlockTable */
		static public $dataClass = '\Bitrix\Highloadblock\HighloadBlockTable';
	}
}
namespace Bitrix\Highloadblock {
	/**
	 * @method static EO_HighloadBlock_Query query()
	 * @method static EO_HighloadBlock_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_HighloadBlock_Result getById($id)
	 * @method static EO_HighloadBlock_Result getList(array $parameters = [])
	 * @method static EO_HighloadBlock_Entity getEntity()
	 * @method static \Bitrix\Highloadblock\HighloadBlock createObject($setDefaultValues = true)
	 * @method static \Bitrix\Highloadblock\EO_HighloadBlock_Collection createCollection()
	 * @method static \Bitrix\Highloadblock\HighloadBlock wakeUpObject($row)
	 * @method static \Bitrix\Highloadblock\EO_HighloadBlock_Collection wakeUpCollection($rows)
	 */
	class HighloadBlockTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_HighloadBlock_Result exec()
	 * @method \Bitrix\Highloadblock\HighloadBlock fetchObject()
	 * @method \Bitrix\Highloadblock\EO_HighloadBlock_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_HighloadBlock_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Highloadblock\HighloadBlock fetchObject()
	 * @method \Bitrix\Highloadblock\EO_HighloadBlock_Collection fetchCollection()
	 */
	class EO_HighloadBlock_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Highloadblock\HighloadBlock createObject($setDefaultValues = true)
	 * @method \Bitrix\Highloadblock\EO_HighloadBlock_Collection createCollection()
	 * @method \Bitrix\Highloadblock\HighloadBlock wakeUpObject($row)
	 * @method \Bitrix\Highloadblock\EO_HighloadBlock_Collection wakeUpCollection($rows)
	 */
	class EO_HighloadBlock_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:ProgersMonthClosedTable */
namespace  {
	/**
	 * EO_ProgersMonthClosed
	 * @see \ProgersMonthClosedTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \EO_ProgersMonthClosed setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method ?\int getUfUserId()
	 * @method \EO_ProgersMonthClosed setUfUserId(?\int|\Bitrix\Main\DB\SqlExpression $ufUserId)
	 * @method bool hasUfUserId()
	 * @method bool isUfUserIdFilled()
	 * @method bool isUfUserIdChanged()
	 * @method ?\int remindActualUfUserId()
	 * @method ?\int requireUfUserId()
	 * @method \EO_ProgersMonthClosed resetUfUserId()
	 * @method \EO_ProgersMonthClosed unsetUfUserId()
	 * @method ?\int fillUfUserId()
	 * @method ?\string getUfTasks()
	 * @method \EO_ProgersMonthClosed setUfTasks(?\string|\Bitrix\Main\DB\SqlExpression $ufTasks)
	 * @method bool hasUfTasks()
	 * @method bool isUfTasksFilled()
	 * @method bool isUfTasksChanged()
	 * @method ?\string remindActualUfTasks()
	 * @method ?\string requireUfTasks()
	 * @method \EO_ProgersMonthClosed resetUfTasks()
	 * @method \EO_ProgersMonthClosed unsetUfTasks()
	 * @method ?\string fillUfTasks()
	 * @method \Bitrix\Main\Type\Date getUfDate()
	 * @method \EO_ProgersMonthClosed setUfDate(\Bitrix\Main\Type\Date|\Bitrix\Main\DB\SqlExpression $ufDate)
	 * @method bool hasUfDate()
	 * @method bool isUfDateFilled()
	 * @method bool isUfDateChanged()
	 * @method \Bitrix\Main\Type\Date remindActualUfDate()
	 * @method \Bitrix\Main\Type\Date requireUfDate()
	 * @method \EO_ProgersMonthClosed resetUfDate()
	 * @method \EO_ProgersMonthClosed unsetUfDate()
	 * @method \Bitrix\Main\Type\Date fillUfDate()
	 * @method ?\string getUfPeriod()
	 * @method \EO_ProgersMonthClosed setUfPeriod(?\string|\Bitrix\Main\DB\SqlExpression $ufPeriod)
	 * @method bool hasUfPeriod()
	 * @method bool isUfPeriodFilled()
	 * @method bool isUfPeriodChanged()
	 * @method ?\string remindActualUfPeriod()
	 * @method ?\string requireUfPeriod()
	 * @method \EO_ProgersMonthClosed resetUfPeriod()
	 * @method \EO_ProgersMonthClosed unsetUfPeriod()
	 * @method ?\string fillUfPeriod()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \EO_ProgersMonthClosed set($fieldName, $value)
	 * @method \EO_ProgersMonthClosed reset($fieldName)
	 * @method \EO_ProgersMonthClosed unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \EO_ProgersMonthClosed wakeUp($data)
	 */
	class EO_ProgersMonthClosed {
		/* @var \ProgersMonthClosedTable */
		static public $dataClass = '\ProgersMonthClosedTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace  {
	/**
	 * EO_ProgersMonthClosed_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method ?\int[] getUfUserIdList()
	 * @method ?\int[] fillUfUserId()
	 * @method ?\string[] getUfTasksList()
	 * @method ?\string[] fillUfTasks()
	 * @method \Bitrix\Main\Type\Date[] getUfDateList()
	 * @method \Bitrix\Main\Type\Date[] fillUfDate()
	 * @method ?\string[] getUfPeriodList()
	 * @method ?\string[] fillUfPeriod()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\EO_ProgersMonthClosed $object)
	 * @method bool has(\EO_ProgersMonthClosed $object)
	 * @method bool hasByPrimary($primary)
	 * @method \EO_ProgersMonthClosed getByPrimary($primary)
	 * @method \EO_ProgersMonthClosed[] getAll()
	 * @method bool remove(\EO_ProgersMonthClosed $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \EO_ProgersMonthClosed_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \EO_ProgersMonthClosed current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_ProgersMonthClosed_Collection merge(?EO_ProgersMonthClosed_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_ProgersMonthClosed_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \ProgersMonthClosedTable */
		static public $dataClass = '\ProgersMonthClosedTable';
	}
}
namespace  {
	/**
	 * @method static EO_ProgersMonthClosed_Query query()
	 * @method static EO_ProgersMonthClosed_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_ProgersMonthClosed_Result getById($id)
	 * @method static EO_ProgersMonthClosed_Result getList(array $parameters = [])
	 * @method static EO_ProgersMonthClosed_Entity getEntity()
	 * @method static \EO_ProgersMonthClosed createObject($setDefaultValues = true)
	 * @method static \EO_ProgersMonthClosed_Collection createCollection()
	 * @method static \EO_ProgersMonthClosed wakeUpObject($row)
	 * @method static \EO_ProgersMonthClosed_Collection wakeUpCollection($rows)
	 */
	class ProgersMonthClosedTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_ProgersMonthClosed_Result exec()
	 * @method \EO_ProgersMonthClosed fetchObject()
	 * @method \EO_ProgersMonthClosed_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_ProgersMonthClosed_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \EO_ProgersMonthClosed fetchObject()
	 * @method \EO_ProgersMonthClosed_Collection fetchCollection()
	 */
	class EO_ProgersMonthClosed_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \EO_ProgersMonthClosed createObject($setDefaultValues = true)
	 * @method \EO_ProgersMonthClosed_Collection createCollection()
	 * @method \EO_ProgersMonthClosed wakeUpObject($row)
	 * @method \EO_ProgersMonthClosed_Collection wakeUpCollection($rows)
	 */
	class EO_ProgersMonthClosed_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Crm\ContactUtmTable */
namespace Bitrix\Crm {
	/**
	 * EO_ContactUtm
	 * @see \Bitrix\Crm\ContactUtmTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Crm\EO_ContactUtm setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getValueId()
	 * @method \Bitrix\Crm\EO_ContactUtm setValueId(\int|\Bitrix\Main\DB\SqlExpression $valueId)
	 * @method bool hasValueId()
	 * @method bool isValueIdFilled()
	 * @method bool isValueIdChanged()
	 * @method \Bitrix\Crm\Contact getParent()
	 * @method \Bitrix\Crm\Contact remindActualParent()
	 * @method \Bitrix\Crm\Contact requireParent()
	 * @method \Bitrix\Crm\EO_ContactUtm setParent(\Bitrix\Crm\Contact $object)
	 * @method \Bitrix\Crm\EO_ContactUtm resetParent()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetParent()
	 * @method bool hasParent()
	 * @method bool isParentFilled()
	 * @method bool isParentChanged()
	 * @method \Bitrix\Crm\Contact fillParent()
	 * @method \int getFieldId()
	 * @method \Bitrix\Crm\EO_ContactUtm setFieldId(\int|\Bitrix\Main\DB\SqlExpression $fieldId)
	 * @method bool hasFieldId()
	 * @method bool isFieldIdFilled()
	 * @method bool isFieldIdChanged()
	 * @method \int remindActualFieldId()
	 * @method \int requireFieldId()
	 * @method \Bitrix\Crm\EO_ContactUtm resetFieldId()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetFieldId()
	 * @method \int fillFieldId()
	 * @method \string getValue()
	 * @method \Bitrix\Crm\EO_ContactUtm setValue(\string|\Bitrix\Main\DB\SqlExpression $value)
	 * @method bool hasValue()
	 * @method bool isValueFilled()
	 * @method bool isValueChanged()
	 * @method \string remindActualValue()
	 * @method \string requireValue()
	 * @method \Bitrix\Crm\EO_ContactUtm resetValue()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetValue()
	 * @method \string fillValue()
	 * @method \int getValueInt()
	 * @method \Bitrix\Crm\EO_ContactUtm setValueInt(\int|\Bitrix\Main\DB\SqlExpression $valueInt)
	 * @method bool hasValueInt()
	 * @method bool isValueIntFilled()
	 * @method bool isValueIntChanged()
	 * @method \int remindActualValueInt()
	 * @method \int requireValueInt()
	 * @method \Bitrix\Crm\EO_ContactUtm resetValueInt()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetValueInt()
	 * @method \int fillValueInt()
	 * @method \float getValueDouble()
	 * @method \Bitrix\Crm\EO_ContactUtm setValueDouble(\float|\Bitrix\Main\DB\SqlExpression $valueDouble)
	 * @method bool hasValueDouble()
	 * @method bool isValueDoubleFilled()
	 * @method bool isValueDoubleChanged()
	 * @method \float remindActualValueDouble()
	 * @method \float requireValueDouble()
	 * @method \Bitrix\Crm\EO_ContactUtm resetValueDouble()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetValueDouble()
	 * @method \float fillValueDouble()
	 * @method \Bitrix\Main\Type\DateTime getValueDate()
	 * @method \Bitrix\Crm\EO_ContactUtm setValueDate(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $valueDate)
	 * @method bool hasValueDate()
	 * @method bool isValueDateFilled()
	 * @method bool isValueDateChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualValueDate()
	 * @method \Bitrix\Main\Type\DateTime requireValueDate()
	 * @method \Bitrix\Crm\EO_ContactUtm resetValueDate()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetValueDate()
	 * @method \Bitrix\Main\Type\DateTime fillValueDate()
	 * @method ?\int getUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\EO_ContactUtm setUfCrm63566066da0fd(?\int|\Bitrix\Main\DB\SqlExpression $ufCrm63566066da0fd)
	 * @method bool hasUfCrm63566066da0fd()
	 * @method bool isUfCrm63566066da0fdFilled()
	 * @method bool isUfCrm63566066da0fdChanged()
	 * @method ?\int remindActualUfCrm63566066da0fd()
	 * @method ?\int requireUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\EO_ContactUtm resetUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetUfCrm63566066da0fd()
	 * @method ?\int fillUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\Contact getParentUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\Contact remindActualParentUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\Contact requireParentUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\EO_ContactUtm setParentUfCrm63566066da0fd(\Bitrix\Crm\Contact $object)
	 * @method \Bitrix\Crm\EO_ContactUtm resetParentUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetParentUfCrm63566066da0fd()
	 * @method bool hasParentUfCrm63566066da0fd()
	 * @method bool isParentUfCrm63566066da0fdFilled()
	 * @method bool isParentUfCrm63566066da0fdChanged()
	 * @method \Bitrix\Crm\Contact fillParentUfCrm63566066da0fd()
	 * @method ?\Bitrix\Main\Type\DateTime getUfCrm6356606747c42()
	 * @method \Bitrix\Crm\EO_ContactUtm setUfCrm6356606747c42(?\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $ufCrm6356606747c42)
	 * @method bool hasUfCrm6356606747c42()
	 * @method bool isUfCrm6356606747c42Filled()
	 * @method bool isUfCrm6356606747c42Changed()
	 * @method ?\Bitrix\Main\Type\DateTime remindActualUfCrm6356606747c42()
	 * @method ?\Bitrix\Main\Type\DateTime requireUfCrm6356606747c42()
	 * @method \Bitrix\Crm\EO_ContactUtm resetUfCrm6356606747c42()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetUfCrm6356606747c42()
	 * @method ?\Bitrix\Main\Type\DateTime fillUfCrm6356606747c42()
	 * @method \Bitrix\Crm\Contact getParentUfCrm6356606747c42()
	 * @method \Bitrix\Crm\Contact remindActualParentUfCrm6356606747c42()
	 * @method \Bitrix\Crm\Contact requireParentUfCrm6356606747c42()
	 * @method \Bitrix\Crm\EO_ContactUtm setParentUfCrm6356606747c42(\Bitrix\Crm\Contact $object)
	 * @method \Bitrix\Crm\EO_ContactUtm resetParentUfCrm6356606747c42()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetParentUfCrm6356606747c42()
	 * @method bool hasParentUfCrm6356606747c42()
	 * @method bool isParentUfCrm6356606747c42Filled()
	 * @method bool isParentUfCrm6356606747c42Changed()
	 * @method \Bitrix\Crm\Contact fillParentUfCrm6356606747c42()
	 * @method ?\int getUfCrm6356606782474()
	 * @method \Bitrix\Crm\EO_ContactUtm setUfCrm6356606782474(?\int|\Bitrix\Main\DB\SqlExpression $ufCrm6356606782474)
	 * @method bool hasUfCrm6356606782474()
	 * @method bool isUfCrm6356606782474Filled()
	 * @method bool isUfCrm6356606782474Changed()
	 * @method ?\int remindActualUfCrm6356606782474()
	 * @method ?\int requireUfCrm6356606782474()
	 * @method \Bitrix\Crm\EO_ContactUtm resetUfCrm6356606782474()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetUfCrm6356606782474()
	 * @method ?\int fillUfCrm6356606782474()
	 * @method \Bitrix\Crm\Contact getParentUfCrm6356606782474()
	 * @method \Bitrix\Crm\Contact remindActualParentUfCrm6356606782474()
	 * @method \Bitrix\Crm\Contact requireParentUfCrm6356606782474()
	 * @method \Bitrix\Crm\EO_ContactUtm setParentUfCrm6356606782474(\Bitrix\Crm\Contact $object)
	 * @method \Bitrix\Crm\EO_ContactUtm resetParentUfCrm6356606782474()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetParentUfCrm6356606782474()
	 * @method bool hasParentUfCrm6356606782474()
	 * @method bool isParentUfCrm6356606782474Filled()
	 * @method bool isParentUfCrm6356606782474Changed()
	 * @method \Bitrix\Crm\Contact fillParentUfCrm6356606782474()
	 * @method ?\string getUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\EO_ContactUtm setUfCrm63566067b69bf(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm63566067b69bf)
	 * @method bool hasUfCrm63566067b69bf()
	 * @method bool isUfCrm63566067b69bfFilled()
	 * @method bool isUfCrm63566067b69bfChanged()
	 * @method ?\string remindActualUfCrm63566067b69bf()
	 * @method ?\string requireUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\EO_ContactUtm resetUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetUfCrm63566067b69bf()
	 * @method ?\string fillUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\Contact getParentUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\Contact remindActualParentUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\Contact requireParentUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\EO_ContactUtm setParentUfCrm63566067b69bf(\Bitrix\Crm\Contact $object)
	 * @method \Bitrix\Crm\EO_ContactUtm resetParentUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetParentUfCrm63566067b69bf()
	 * @method bool hasParentUfCrm63566067b69bf()
	 * @method bool isParentUfCrm63566067b69bfFilled()
	 * @method bool isParentUfCrm63566067b69bfChanged()
	 * @method \Bitrix\Crm\Contact fillParentUfCrm63566067b69bf()
	 * @method ?\float getUfCrm63566067c0433()
	 * @method \Bitrix\Crm\EO_ContactUtm setUfCrm63566067c0433(?\float|\Bitrix\Main\DB\SqlExpression $ufCrm63566067c0433)
	 * @method bool hasUfCrm63566067c0433()
	 * @method bool isUfCrm63566067c0433Filled()
	 * @method bool isUfCrm63566067c0433Changed()
	 * @method ?\float remindActualUfCrm63566067c0433()
	 * @method ?\float requireUfCrm63566067c0433()
	 * @method \Bitrix\Crm\EO_ContactUtm resetUfCrm63566067c0433()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetUfCrm63566067c0433()
	 * @method ?\float fillUfCrm63566067c0433()
	 * @method \Bitrix\Crm\Contact getParentUfCrm63566067c0433()
	 * @method \Bitrix\Crm\Contact remindActualParentUfCrm63566067c0433()
	 * @method \Bitrix\Crm\Contact requireParentUfCrm63566067c0433()
	 * @method \Bitrix\Crm\EO_ContactUtm setParentUfCrm63566067c0433(\Bitrix\Crm\Contact $object)
	 * @method \Bitrix\Crm\EO_ContactUtm resetParentUfCrm63566067c0433()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetParentUfCrm63566067c0433()
	 * @method bool hasParentUfCrm63566067c0433()
	 * @method bool isParentUfCrm63566067c0433Filled()
	 * @method bool isParentUfCrm63566067c0433Changed()
	 * @method \Bitrix\Crm\Contact fillParentUfCrm63566067c0433()
	 * @method ?\int getUfCrm1672300269()
	 * @method \Bitrix\Crm\EO_ContactUtm setUfCrm1672300269(?\int|\Bitrix\Main\DB\SqlExpression $ufCrm1672300269)
	 * @method bool hasUfCrm1672300269()
	 * @method bool isUfCrm1672300269Filled()
	 * @method bool isUfCrm1672300269Changed()
	 * @method ?\int remindActualUfCrm1672300269()
	 * @method ?\int requireUfCrm1672300269()
	 * @method \Bitrix\Crm\EO_ContactUtm resetUfCrm1672300269()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetUfCrm1672300269()
	 * @method ?\int fillUfCrm1672300269()
	 * @method \Bitrix\Crm\Contact getParentUfCrm1672300269()
	 * @method \Bitrix\Crm\Contact remindActualParentUfCrm1672300269()
	 * @method \Bitrix\Crm\Contact requireParentUfCrm1672300269()
	 * @method \Bitrix\Crm\EO_ContactUtm setParentUfCrm1672300269(\Bitrix\Crm\Contact $object)
	 * @method \Bitrix\Crm\EO_ContactUtm resetParentUfCrm1672300269()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetParentUfCrm1672300269()
	 * @method bool hasParentUfCrm1672300269()
	 * @method bool isParentUfCrm1672300269Filled()
	 * @method bool isParentUfCrm1672300269Changed()
	 * @method \Bitrix\Crm\Contact fillParentUfCrm1672300269()
	 * @method ?\string getUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\EO_ContactUtm setUfCrm64ae43c5e8634(?\string|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c5e8634)
	 * @method bool hasUfCrm64ae43c5e8634()
	 * @method bool isUfCrm64ae43c5e8634Filled()
	 * @method bool isUfCrm64ae43c5e8634Changed()
	 * @method ?\string remindActualUfCrm64ae43c5e8634()
	 * @method ?\string requireUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\EO_ContactUtm resetUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetUfCrm64ae43c5e8634()
	 * @method ?\string fillUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\Contact getParentUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\Contact remindActualParentUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\Contact requireParentUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\EO_ContactUtm setParentUfCrm64ae43c5e8634(\Bitrix\Crm\Contact $object)
	 * @method \Bitrix\Crm\EO_ContactUtm resetParentUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetParentUfCrm64ae43c5e8634()
	 * @method bool hasParentUfCrm64ae43c5e8634()
	 * @method bool isParentUfCrm64ae43c5e8634Filled()
	 * @method bool isParentUfCrm64ae43c5e8634Changed()
	 * @method \Bitrix\Crm\Contact fillParentUfCrm64ae43c5e8634()
	 * @method ?\int getUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\EO_ContactUtm setUfCrm64ae43c63a0ec(?\int|\Bitrix\Main\DB\SqlExpression $ufCrm64ae43c63a0ec)
	 * @method bool hasUfCrm64ae43c63a0ec()
	 * @method bool isUfCrm64ae43c63a0ecFilled()
	 * @method bool isUfCrm64ae43c63a0ecChanged()
	 * @method ?\int remindActualUfCrm64ae43c63a0ec()
	 * @method ?\int requireUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\EO_ContactUtm resetUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetUfCrm64ae43c63a0ec()
	 * @method ?\int fillUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\Contact getParentUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\Contact remindActualParentUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\Contact requireParentUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\EO_ContactUtm setParentUfCrm64ae43c63a0ec(\Bitrix\Crm\Contact $object)
	 * @method \Bitrix\Crm\EO_ContactUtm resetParentUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\EO_ContactUtm unsetParentUfCrm64ae43c63a0ec()
	 * @method bool hasParentUfCrm64ae43c63a0ec()
	 * @method bool isParentUfCrm64ae43c63a0ecFilled()
	 * @method bool isParentUfCrm64ae43c63a0ecChanged()
	 * @method \Bitrix\Crm\Contact fillParentUfCrm64ae43c63a0ec()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Crm\EO_ContactUtm set($fieldName, $value)
	 * @method \Bitrix\Crm\EO_ContactUtm reset($fieldName)
	 * @method \Bitrix\Crm\EO_ContactUtm unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Crm\EO_ContactUtm wakeUp($data)
	 */
	class EO_ContactUtm {
		/* @var \Bitrix\Crm\ContactUtmTable */
		static public $dataClass = '\Bitrix\Crm\ContactUtmTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Crm {
	/**
	 * EO_ContactUtm_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getValueIdList()
	 * @method \Bitrix\Crm\Contact[] getParentList()
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection getParentCollection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillParent()
	 * @method \int[] getFieldIdList()
	 * @method \int[] fillFieldId()
	 * @method \string[] getValueList()
	 * @method \string[] fillValue()
	 * @method \int[] getValueIntList()
	 * @method \int[] fillValueInt()
	 * @method \float[] getValueDoubleList()
	 * @method \float[] fillValueDouble()
	 * @method \Bitrix\Main\Type\DateTime[] getValueDateList()
	 * @method \Bitrix\Main\Type\DateTime[] fillValueDate()
	 * @method ?\int[] getUfCrm63566066da0fdList()
	 * @method ?\int[] fillUfCrm63566066da0fd()
	 * @method \Bitrix\Crm\Contact[] getParentUfCrm63566066da0fdList()
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection getParentUfCrm63566066da0fdCollection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillParentUfCrm63566066da0fd()
	 * @method ?\Bitrix\Main\Type\DateTime[] getUfCrm6356606747c42List()
	 * @method ?\Bitrix\Main\Type\DateTime[] fillUfCrm6356606747c42()
	 * @method \Bitrix\Crm\Contact[] getParentUfCrm6356606747c42List()
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection getParentUfCrm6356606747c42Collection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillParentUfCrm6356606747c42()
	 * @method ?\int[] getUfCrm6356606782474List()
	 * @method ?\int[] fillUfCrm6356606782474()
	 * @method \Bitrix\Crm\Contact[] getParentUfCrm6356606782474List()
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection getParentUfCrm6356606782474Collection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillParentUfCrm6356606782474()
	 * @method ?\string[] getUfCrm63566067b69bfList()
	 * @method ?\string[] fillUfCrm63566067b69bf()
	 * @method \Bitrix\Crm\Contact[] getParentUfCrm63566067b69bfList()
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection getParentUfCrm63566067b69bfCollection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillParentUfCrm63566067b69bf()
	 * @method ?\float[] getUfCrm63566067c0433List()
	 * @method ?\float[] fillUfCrm63566067c0433()
	 * @method \Bitrix\Crm\Contact[] getParentUfCrm63566067c0433List()
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection getParentUfCrm63566067c0433Collection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillParentUfCrm63566067c0433()
	 * @method ?\int[] getUfCrm1672300269List()
	 * @method ?\int[] fillUfCrm1672300269()
	 * @method \Bitrix\Crm\Contact[] getParentUfCrm1672300269List()
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection getParentUfCrm1672300269Collection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillParentUfCrm1672300269()
	 * @method ?\string[] getUfCrm64ae43c5e8634List()
	 * @method ?\string[] fillUfCrm64ae43c5e8634()
	 * @method \Bitrix\Crm\Contact[] getParentUfCrm64ae43c5e8634List()
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection getParentUfCrm64ae43c5e8634Collection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillParentUfCrm64ae43c5e8634()
	 * @method ?\int[] getUfCrm64ae43c63a0ecList()
	 * @method ?\int[] fillUfCrm64ae43c63a0ec()
	 * @method \Bitrix\Crm\Contact[] getParentUfCrm64ae43c63a0ecList()
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection getParentUfCrm64ae43c63a0ecCollection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillParentUfCrm64ae43c63a0ec()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Crm\EO_ContactUtm $object)
	 * @method bool has(\Bitrix\Crm\EO_ContactUtm $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Crm\EO_ContactUtm getByPrimary($primary)
	 * @method \Bitrix\Crm\EO_ContactUtm[] getAll()
	 * @method bool remove(\Bitrix\Crm\EO_ContactUtm $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Crm\EO_ContactUtm_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Crm\EO_ContactUtm current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_ContactUtm_Collection merge(?EO_ContactUtm_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_ContactUtm_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Crm\ContactUtmTable */
		static public $dataClass = '\Bitrix\Crm\ContactUtmTable';
	}
}
namespace Bitrix\Crm {
	/**
	 * @method static EO_ContactUtm_Query query()
	 * @method static EO_ContactUtm_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_ContactUtm_Result getById($id)
	 * @method static EO_ContactUtm_Result getList(array $parameters = [])
	 * @method static EO_ContactUtm_Entity getEntity()
	 * @method static \Bitrix\Crm\EO_ContactUtm createObject($setDefaultValues = true)
	 * @method static \Bitrix\Crm\EO_ContactUtm_Collection createCollection()
	 * @method static \Bitrix\Crm\EO_ContactUtm wakeUpObject($row)
	 * @method static \Bitrix\Crm\EO_ContactUtm_Collection wakeUpCollection($rows)
	 */
	class ContactUtmTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_ContactUtm_Result exec()
	 * @method \Bitrix\Crm\EO_ContactUtm fetchObject()
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_ContactUtm_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Crm\EO_ContactUtm fetchObject()
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection fetchCollection()
	 */
	class EO_ContactUtm_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Crm\EO_ContactUtm createObject($setDefaultValues = true)
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection createCollection()
	 * @method \Bitrix\Crm\EO_ContactUtm wakeUpObject($row)
	 * @method \Bitrix\Crm\EO_ContactUtm_Collection wakeUpCollection($rows)
	 */
	class EO_ContactUtm_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\ClinicTable */
namespace MyWebstor\Hms {
	/**
	 * EO_Clinic
	 * @see \MyWebstor\Hms\ClinicTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\EO_Clinic setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getXmlId()
	 * @method \MyWebstor\Hms\EO_Clinic setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \MyWebstor\Hms\EO_Clinic resetXmlId()
	 * @method \MyWebstor\Hms\EO_Clinic unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \string getTitle()
	 * @method \MyWebstor\Hms\EO_Clinic setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\Hms\EO_Clinic resetTitle()
	 * @method \MyWebstor\Hms\EO_Clinic unsetTitle()
	 * @method \string fillTitle()
	 * @method \int getCompanyId()
	 * @method \MyWebstor\Hms\EO_Clinic setCompanyId(\int|\Bitrix\Main\DB\SqlExpression $companyId)
	 * @method bool hasCompanyId()
	 * @method bool isCompanyIdFilled()
	 * @method bool isCompanyIdChanged()
	 * @method \int remindActualCompanyId()
	 * @method \int requireCompanyId()
	 * @method \MyWebstor\Hms\EO_Clinic resetCompanyId()
	 * @method \MyWebstor\Hms\EO_Clinic unsetCompanyId()
	 * @method \int fillCompanyId()
	 * @method \Bitrix\Crm\Company getCompany()
	 * @method \Bitrix\Crm\Company remindActualCompany()
	 * @method \Bitrix\Crm\Company requireCompany()
	 * @method \MyWebstor\Hms\EO_Clinic setCompany(\Bitrix\Crm\Company $object)
	 * @method \MyWebstor\Hms\EO_Clinic resetCompany()
	 * @method \MyWebstor\Hms\EO_Clinic unsetCompany()
	 * @method bool hasCompany()
	 * @method bool isCompanyFilled()
	 * @method bool isCompanyChanged()
	 * @method \Bitrix\Crm\Company fillCompany()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\EO_Clinic set($fieldName, $value)
	 * @method \MyWebstor\Hms\EO_Clinic reset($fieldName)
	 * @method \MyWebstor\Hms\EO_Clinic unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\EO_Clinic wakeUp($data)
	 */
	class EO_Clinic {
		/* @var \MyWebstor\Hms\ClinicTable */
		static public $dataClass = '\MyWebstor\Hms\ClinicTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms {
	/**
	 * EO_Clinic_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \int[] getCompanyIdList()
	 * @method \int[] fillCompanyId()
	 * @method \Bitrix\Crm\Company[] getCompanyList()
	 * @method \MyWebstor\Hms\EO_Clinic_Collection getCompanyCollection()
	 * @method \Bitrix\Crm\EO_Company_Collection fillCompany()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\EO_Clinic $object)
	 * @method bool has(\MyWebstor\Hms\EO_Clinic $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Clinic getByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Clinic[] getAll()
	 * @method bool remove(\MyWebstor\Hms\EO_Clinic $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\EO_Clinic_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\EO_Clinic current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Clinic_Collection merge(?EO_Clinic_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Clinic_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\ClinicTable */
		static public $dataClass = '\MyWebstor\Hms\ClinicTable';
	}
}
namespace MyWebstor\Hms {
	/**
	 * @method static EO_Clinic_Query query()
	 * @method static EO_Clinic_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Clinic_Result getById($id)
	 * @method static EO_Clinic_Result getList(array $parameters = [])
	 * @method static EO_Clinic_Entity getEntity()
	 * @method static \MyWebstor\Hms\EO_Clinic createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\EO_Clinic_Collection createCollection()
	 * @method static \MyWebstor\Hms\EO_Clinic wakeUpObject($row)
	 * @method static \MyWebstor\Hms\EO_Clinic_Collection wakeUpCollection($rows)
	 */
	class ClinicTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Clinic_Result exec()
	 * @method \MyWebstor\Hms\EO_Clinic fetchObject()
	 * @method \MyWebstor\Hms\EO_Clinic_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Clinic_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\EO_Clinic fetchObject()
	 * @method \MyWebstor\Hms\EO_Clinic_Collection fetchCollection()
	 */
	class EO_Clinic_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\EO_Clinic createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\EO_Clinic_Collection createCollection()
	 * @method \MyWebstor\Hms\EO_Clinic wakeUpObject($row)
	 * @method \MyWebstor\Hms\EO_Clinic_Collection wakeUpCollection($rows)
	 */
	class EO_Clinic_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\ReceiveTable */
namespace MyWebstor\Hms {
	/**
	 * Receive
	 * @see \MyWebstor\Hms\ReceiveTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Object\Receive setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getType()
	 * @method \MyWebstor\Hms\Object\Receive setType(\string|\Bitrix\Main\DB\SqlExpression $type)
	 * @method bool hasType()
	 * @method bool isTypeFilled()
	 * @method bool isTypeChanged()
	 * @method \string remindActualType()
	 * @method \string requireType()
	 * @method \MyWebstor\Hms\Object\Receive resetType()
	 * @method \MyWebstor\Hms\Object\Receive unsetType()
	 * @method \string fillType()
	 * @method \Bitrix\Main\Type\DateTime getDateStart()
	 * @method \MyWebstor\Hms\Object\Receive setDateStart(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateStart)
	 * @method bool hasDateStart()
	 * @method bool isDateStartFilled()
	 * @method bool isDateStartChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateStart()
	 * @method \Bitrix\Main\Type\DateTime requireDateStart()
	 * @method \MyWebstor\Hms\Object\Receive resetDateStart()
	 * @method \MyWebstor\Hms\Object\Receive unsetDateStart()
	 * @method \Bitrix\Main\Type\DateTime fillDateStart()
	 * @method \Bitrix\Main\Type\DateTime getDateEnd()
	 * @method \MyWebstor\Hms\Object\Receive setDateEnd(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateEnd)
	 * @method bool hasDateEnd()
	 * @method bool isDateEndFilled()
	 * @method bool isDateEndChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateEnd()
	 * @method \Bitrix\Main\Type\DateTime requireDateEnd()
	 * @method \MyWebstor\Hms\Object\Receive resetDateEnd()
	 * @method \MyWebstor\Hms\Object\Receive unsetDateEnd()
	 * @method \Bitrix\Main\Type\DateTime fillDateEnd()
	 * @method \MyWebstor\Hms\Object\Appointment getAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment remindActualAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment requireAppointment()
	 * @method \MyWebstor\Hms\Object\Receive setAppointment(\MyWebstor\Hms\Object\Appointment $object)
	 * @method \MyWebstor\Hms\Object\Receive resetAppointment()
	 * @method \MyWebstor\Hms\Object\Receive unsetAppointment()
	 * @method bool hasAppointment()
	 * @method bool isAppointmentFilled()
	 * @method bool isAppointmentChanged()
	 * @method \MyWebstor\Hms\Object\Appointment fillAppointment()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Object\Receive set($fieldName, $value)
	 * @method \MyWebstor\Hms\Object\Receive reset($fieldName)
	 * @method \MyWebstor\Hms\Object\Receive unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Object\Receive wakeUp($data)
	 */
	class EO_Receive {
		/* @var \MyWebstor\Hms\ReceiveTable */
		static public $dataClass = '\MyWebstor\Hms\ReceiveTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms {
	/**
	 * EO_Receive_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getTypeList()
	 * @method \string[] fillType()
	 * @method \Bitrix\Main\Type\DateTime[] getDateStartList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateStart()
	 * @method \Bitrix\Main\Type\DateTime[] getDateEndList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateEnd()
	 * @method \MyWebstor\Hms\Object\Appointment[] getAppointmentList()
	 * @method \MyWebstor\Hms\EO_Receive_Collection getAppointmentCollection()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fillAppointment()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Object\Receive $object)
	 * @method bool has(\MyWebstor\Hms\Object\Receive $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Object\Receive getByPrimary($primary)
	 * @method \MyWebstor\Hms\Object\Receive[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Object\Receive $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\EO_Receive_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Object\Receive current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Receive_Collection merge(?EO_Receive_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Receive_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\ReceiveTable */
		static public $dataClass = '\MyWebstor\Hms\ReceiveTable';
	}
}
namespace MyWebstor\Hms {
	/**
	 * @method static EO_Receive_Query query()
	 * @method static EO_Receive_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Receive_Result getById($id)
	 * @method static EO_Receive_Result getList(array $parameters = [])
	 * @method static EO_Receive_Entity getEntity()
	 * @method static \MyWebstor\Hms\Object\Receive createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\EO_Receive_Collection createCollection()
	 * @method static \MyWebstor\Hms\Object\Receive wakeUpObject($row)
	 * @method static \MyWebstor\Hms\EO_Receive_Collection wakeUpCollection($rows)
	 */
	class ReceiveTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Receive_Result exec()
	 * @method \MyWebstor\Hms\Object\Receive fetchObject()
	 * @method \MyWebstor\Hms\EO_Receive_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Receive_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Object\Receive fetchObject()
	 * @method \MyWebstor\Hms\EO_Receive_Collection fetchCollection()
	 */
	class EO_Receive_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Object\Receive createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\EO_Receive_Collection createCollection()
	 * @method \MyWebstor\Hms\Object\Receive wakeUpObject($row)
	 * @method \MyWebstor\Hms\EO_Receive_Collection wakeUpCollection($rows)
	 */
	class EO_Receive_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Vhi\VhiTypeTable */
namespace MyWebstor\Hms\Vhi {
	/**
	 * EO_VhiType
	 * @see \MyWebstor\Hms\Vhi\VhiTypeTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getXmlId()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType resetXmlId()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \string getTitle()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType resetTitle()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType unsetTitle()
	 * @method \string fillTitle()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection getServiceType()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection requireServiceType()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection fillServiceType()
	 * @method bool hasServiceType()
	 * @method bool isServiceTypeFilled()
	 * @method bool isServiceTypeChanged()
	 * @method void addToServiceType(\MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType $vhiTypeVhiServiceType)
	 * @method void removeFromServiceType(\MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType $vhiTypeVhiServiceType)
	 * @method void removeAllServiceType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType resetServiceType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType unsetServiceType()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType set($fieldName, $value)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType reset($fieldName)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiType wakeUp($data)
	 */
	class EO_VhiType {
		/* @var \MyWebstor\Hms\Vhi\VhiTypeTable */
		static public $dataClass = '\MyWebstor\Hms\Vhi\VhiTypeTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Vhi {
	/**
	 * EO_VhiType_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection[] getServiceTypeList()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection getServiceTypeCollection()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection fillServiceType()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Vhi\EO_VhiType $object)
	 * @method bool has(\MyWebstor\Hms\Vhi\EO_VhiType $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType getByPrimary($primary)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Vhi\EO_VhiType $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiType_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_VhiType_Collection merge(?EO_VhiType_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_VhiType_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Vhi\VhiTypeTable */
		static public $dataClass = '\MyWebstor\Hms\Vhi\VhiTypeTable';
	}
}
namespace MyWebstor\Hms\Vhi {
	/**
	 * @method static EO_VhiType_Query query()
	 * @method static EO_VhiType_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_VhiType_Result getById($id)
	 * @method static EO_VhiType_Result getList(array $parameters = [])
	 * @method static EO_VhiType_Entity getEntity()
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiType createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiType_Collection createCollection()
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiType wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiType_Collection wakeUpCollection($rows)
	 */
	class VhiTypeTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_VhiType_Result exec()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType fetchObject()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_VhiType_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType fetchObject()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType_Collection fetchCollection()
	 */
	class EO_VhiType_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType_Collection createCollection()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType wakeUpObject($row)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType_Collection wakeUpCollection($rows)
	 */
	class EO_VhiType_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Vhi\VhiStorageTable */
namespace MyWebstor\Hms\Vhi {
	/**
	 * EO_VhiStorage
	 * @see \MyWebstor\Hms\Vhi\VhiStorageTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getVhiTypeId()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setVhiTypeId(\int|\Bitrix\Main\DB\SqlExpression $vhiTypeId)
	 * @method bool hasVhiTypeId()
	 * @method bool isVhiTypeIdFilled()
	 * @method bool isVhiTypeIdChanged()
	 * @method \int remindActualVhiTypeId()
	 * @method \int requireVhiTypeId()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage resetVhiTypeId()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetVhiTypeId()
	 * @method \int fillVhiTypeId()
	 * @method \string getNumber()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setNumber(\string|\Bitrix\Main\DB\SqlExpression $number)
	 * @method bool hasNumber()
	 * @method bool isNumberFilled()
	 * @method bool isNumberChanged()
	 * @method \string remindActualNumber()
	 * @method \string requireNumber()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage resetNumber()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetNumber()
	 * @method \string fillNumber()
	 * @method \string getLastName()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setLastName(\string|\Bitrix\Main\DB\SqlExpression $lastName)
	 * @method bool hasLastName()
	 * @method bool isLastNameFilled()
	 * @method bool isLastNameChanged()
	 * @method \string remindActualLastName()
	 * @method \string requireLastName()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage resetLastName()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetLastName()
	 * @method \string fillLastName()
	 * @method \string getName()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setName(\string|\Bitrix\Main\DB\SqlExpression $name)
	 * @method bool hasName()
	 * @method bool isNameFilled()
	 * @method bool isNameChanged()
	 * @method \string remindActualName()
	 * @method \string requireName()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage resetName()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetName()
	 * @method \string fillName()
	 * @method \string getSecondName()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setSecondName(\string|\Bitrix\Main\DB\SqlExpression $secondName)
	 * @method bool hasSecondName()
	 * @method bool isSecondNameFilled()
	 * @method bool isSecondNameChanged()
	 * @method \string remindActualSecondName()
	 * @method \string requireSecondName()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage resetSecondName()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetSecondName()
	 * @method \string fillSecondName()
	 * @method \Bitrix\Main\Type\Date getBirthdate()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setBirthdate(\Bitrix\Main\Type\Date|\Bitrix\Main\DB\SqlExpression $birthdate)
	 * @method bool hasBirthdate()
	 * @method bool isBirthdateFilled()
	 * @method bool isBirthdateChanged()
	 * @method \Bitrix\Main\Type\Date remindActualBirthdate()
	 * @method \Bitrix\Main\Type\Date requireBirthdate()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage resetBirthdate()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetBirthdate()
	 * @method \Bitrix\Main\Type\Date fillBirthdate()
	 * @method \Bitrix\Main\Type\Date getDateStart()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setDateStart(\Bitrix\Main\Type\Date|\Bitrix\Main\DB\SqlExpression $dateStart)
	 * @method bool hasDateStart()
	 * @method bool isDateStartFilled()
	 * @method bool isDateStartChanged()
	 * @method \Bitrix\Main\Type\Date remindActualDateStart()
	 * @method \Bitrix\Main\Type\Date requireDateStart()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage resetDateStart()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetDateStart()
	 * @method \Bitrix\Main\Type\Date fillDateStart()
	 * @method \Bitrix\Main\Type\Date getDateEnd()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setDateEnd(\Bitrix\Main\Type\Date|\Bitrix\Main\DB\SqlExpression $dateEnd)
	 * @method bool hasDateEnd()
	 * @method bool isDateEndFilled()
	 * @method bool isDateEndChanged()
	 * @method \Bitrix\Main\Type\Date remindActualDateEnd()
	 * @method \Bitrix\Main\Type\Date requireDateEnd()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage resetDateEnd()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetDateEnd()
	 * @method \Bitrix\Main\Type\Date fillDateEnd()
	 * @method \string getGender()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setGender(\string|\Bitrix\Main\DB\SqlExpression $gender)
	 * @method bool hasGender()
	 * @method bool isGenderFilled()
	 * @method bool isGenderChanged()
	 * @method \string remindActualGender()
	 * @method \string requireGender()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage resetGender()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetGender()
	 * @method \string fillGender()
	 * @method \string getAddress()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setAddress(\string|\Bitrix\Main\DB\SqlExpression $address)
	 * @method bool hasAddress()
	 * @method bool isAddressFilled()
	 * @method bool isAddressChanged()
	 * @method \string remindActualAddress()
	 * @method \string requireAddress()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage resetAddress()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetAddress()
	 * @method \string fillAddress()
	 * @method \string getPhone()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setPhone(\string|\Bitrix\Main\DB\SqlExpression $phone)
	 * @method bool hasPhone()
	 * @method bool isPhoneFilled()
	 * @method bool isPhoneChanged()
	 * @method \string remindActualPhone()
	 * @method \string requirePhone()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage resetPhone()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetPhone()
	 * @method \string fillPhone()
	 * @method \string getContactTitle()
	 * @method \string remindActualContactTitle()
	 * @method \string requireContactTitle()
	 * @method bool hasContactTitle()
	 * @method bool isContactTitleFilled()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetContactTitle()
	 * @method \string fillContactTitle()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType getVhiType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType remindActualVhiType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType requireVhiType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage setVhiType(\MyWebstor\Hms\Vhi\EO_VhiType $object)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage resetVhiType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unsetVhiType()
	 * @method bool hasVhiType()
	 * @method bool isVhiTypeFilled()
	 * @method bool isVhiTypeChanged()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType fillVhiType()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage set($fieldName, $value)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage reset($fieldName)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiStorage wakeUp($data)
	 */
	class EO_VhiStorage {
		/* @var \MyWebstor\Hms\Vhi\VhiStorageTable */
		static public $dataClass = '\MyWebstor\Hms\Vhi\VhiStorageTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Vhi {
	/**
	 * EO_VhiStorage_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getVhiTypeIdList()
	 * @method \int[] fillVhiTypeId()
	 * @method \string[] getNumberList()
	 * @method \string[] fillNumber()
	 * @method \string[] getLastNameList()
	 * @method \string[] fillLastName()
	 * @method \string[] getNameList()
	 * @method \string[] fillName()
	 * @method \string[] getSecondNameList()
	 * @method \string[] fillSecondName()
	 * @method \Bitrix\Main\Type\Date[] getBirthdateList()
	 * @method \Bitrix\Main\Type\Date[] fillBirthdate()
	 * @method \Bitrix\Main\Type\Date[] getDateStartList()
	 * @method \Bitrix\Main\Type\Date[] fillDateStart()
	 * @method \Bitrix\Main\Type\Date[] getDateEndList()
	 * @method \Bitrix\Main\Type\Date[] fillDateEnd()
	 * @method \string[] getGenderList()
	 * @method \string[] fillGender()
	 * @method \string[] getAddressList()
	 * @method \string[] fillAddress()
	 * @method \string[] getPhoneList()
	 * @method \string[] fillPhone()
	 * @method \string[] getContactTitleList()
	 * @method \string[] fillContactTitle()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType[] getVhiTypeList()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage_Collection getVhiTypeCollection()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType_Collection fillVhiType()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Vhi\EO_VhiStorage $object)
	 * @method bool has(\MyWebstor\Hms\Vhi\EO_VhiStorage $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage getByPrimary($primary)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Vhi\EO_VhiStorage $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiStorage_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_VhiStorage_Collection merge(?EO_VhiStorage_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_VhiStorage_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Vhi\VhiStorageTable */
		static public $dataClass = '\MyWebstor\Hms\Vhi\VhiStorageTable';
	}
}
namespace MyWebstor\Hms\Vhi {
	/**
	 * @method static EO_VhiStorage_Query query()
	 * @method static EO_VhiStorage_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_VhiStorage_Result getById($id)
	 * @method static EO_VhiStorage_Result getList(array $parameters = [])
	 * @method static EO_VhiStorage_Entity getEntity()
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiStorage createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiStorage_Collection createCollection()
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiStorage wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiStorage_Collection wakeUpCollection($rows)
	 */
	class VhiStorageTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_VhiStorage_Result exec()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage fetchObject()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_VhiStorage_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage fetchObject()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage_Collection fetchCollection()
	 */
	class EO_VhiStorage_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage_Collection createCollection()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage wakeUpObject($row)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage_Collection wakeUpCollection($rows)
	 */
	class EO_VhiStorage_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Vhi\VhiServiceTypeTable */
namespace MyWebstor\Hms\Vhi {
	/**
	 * EO_VhiServiceType
	 * @see \MyWebstor\Hms\Vhi\VhiServiceTypeTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getXmlId()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType resetXmlId()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \string getTitle()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType resetTitle()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType unsetTitle()
	 * @method \string fillTitle()
	 * @method array getServices()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType setServices(array|\Bitrix\Main\DB\SqlExpression $services)
	 * @method bool hasServices()
	 * @method bool isServicesFilled()
	 * @method bool isServicesChanged()
	 * @method array remindActualServices()
	 * @method array requireServices()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType resetServices()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType unsetServices()
	 * @method array fillServices()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType set($fieldName, $value)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType reset($fieldName)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiServiceType wakeUp($data)
	 */
	class EO_VhiServiceType {
		/* @var \MyWebstor\Hms\Vhi\VhiServiceTypeTable */
		static public $dataClass = '\MyWebstor\Hms\Vhi\VhiServiceTypeTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Vhi {
	/**
	 * EO_VhiServiceType_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method array[] getServicesList()
	 * @method array[] fillServices()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Vhi\EO_VhiServiceType $object)
	 * @method bool has(\MyWebstor\Hms\Vhi\EO_VhiServiceType $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType getByPrimary($primary)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Vhi\EO_VhiServiceType $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiServiceType_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_VhiServiceType_Collection merge(?EO_VhiServiceType_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_VhiServiceType_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Vhi\VhiServiceTypeTable */
		static public $dataClass = '\MyWebstor\Hms\Vhi\VhiServiceTypeTable';
	}
}
namespace MyWebstor\Hms\Vhi {
	/**
	 * @method static EO_VhiServiceType_Query query()
	 * @method static EO_VhiServiceType_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_VhiServiceType_Result getById($id)
	 * @method static EO_VhiServiceType_Result getList(array $parameters = [])
	 * @method static EO_VhiServiceType_Entity getEntity()
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiServiceType createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiServiceType_Collection createCollection()
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiServiceType wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Vhi\EO_VhiServiceType_Collection wakeUpCollection($rows)
	 */
	class VhiServiceTypeTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_VhiServiceType_Result exec()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType fetchObject()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_VhiServiceType_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType fetchObject()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType_Collection fetchCollection()
	 */
	class EO_VhiServiceType_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType_Collection createCollection()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType wakeUpObject($row)
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType_Collection wakeUpCollection($rows)
	 */
	class EO_VhiServiceType_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\OfficeTable */
namespace MyWebstor\Hms {
	/**
	 * EO_Office
	 * @see \MyWebstor\Hms\OfficeTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\EO_Office setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getXmlId()
	 * @method \MyWebstor\Hms\EO_Office setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \MyWebstor\Hms\EO_Office resetXmlId()
	 * @method \MyWebstor\Hms\EO_Office unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \string getTitle()
	 * @method \MyWebstor\Hms\EO_Office setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\Hms\EO_Office resetTitle()
	 * @method \MyWebstor\Hms\EO_Office unsetTitle()
	 * @method \string fillTitle()
	 * @method \int getClinicId()
	 * @method \MyWebstor\Hms\EO_Office setClinicId(\int|\Bitrix\Main\DB\SqlExpression $clinicId)
	 * @method bool hasClinicId()
	 * @method bool isClinicIdFilled()
	 * @method bool isClinicIdChanged()
	 * @method \int remindActualClinicId()
	 * @method \int requireClinicId()
	 * @method \MyWebstor\Hms\EO_Office resetClinicId()
	 * @method \MyWebstor\Hms\EO_Office unsetClinicId()
	 * @method \int fillClinicId()
	 * @method \boolean getIsContinuousScheme()
	 * @method \MyWebstor\Hms\EO_Office setIsContinuousScheme(\boolean|\Bitrix\Main\DB\SqlExpression $isContinuousScheme)
	 * @method bool hasIsContinuousScheme()
	 * @method bool isIsContinuousSchemeFilled()
	 * @method bool isIsContinuousSchemeChanged()
	 * @method \boolean remindActualIsContinuousScheme()
	 * @method \boolean requireIsContinuousScheme()
	 * @method \MyWebstor\Hms\EO_Office resetIsContinuousScheme()
	 * @method \MyWebstor\Hms\EO_Office unsetIsContinuousScheme()
	 * @method \boolean fillIsContinuousScheme()
	 * @method \MyWebstor\Hms\EO_Clinic getClinic()
	 * @method \MyWebstor\Hms\EO_Clinic remindActualClinic()
	 * @method \MyWebstor\Hms\EO_Clinic requireClinic()
	 * @method \MyWebstor\Hms\EO_Office setClinic(\MyWebstor\Hms\EO_Clinic $object)
	 * @method \MyWebstor\Hms\EO_Office resetClinic()
	 * @method \MyWebstor\Hms\EO_Office unsetClinic()
	 * @method bool hasClinic()
	 * @method bool isClinicFilled()
	 * @method bool isClinicChanged()
	 * @method \MyWebstor\Hms\EO_Clinic fillClinic()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection getSpecialization()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection requireSpecialization()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection fillSpecialization()
	 * @method bool hasSpecialization()
	 * @method bool isSpecializationFilled()
	 * @method bool isSpecializationChanged()
	 * @method void addToSpecialization(\MyWebstor\Hms\EO_Specialization $specialization)
	 * @method void removeFromSpecialization(\MyWebstor\Hms\EO_Specialization $specialization)
	 * @method void removeAllSpecialization()
	 * @method \MyWebstor\Hms\EO_Office resetSpecialization()
	 * @method \MyWebstor\Hms\EO_Office unsetSpecialization()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\EO_Office set($fieldName, $value)
	 * @method \MyWebstor\Hms\EO_Office reset($fieldName)
	 * @method \MyWebstor\Hms\EO_Office unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\EO_Office wakeUp($data)
	 */
	class EO_Office {
		/* @var \MyWebstor\Hms\OfficeTable */
		static public $dataClass = '\MyWebstor\Hms\OfficeTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms {
	/**
	 * EO_Office_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \int[] getClinicIdList()
	 * @method \int[] fillClinicId()
	 * @method \boolean[] getIsContinuousSchemeList()
	 * @method \boolean[] fillIsContinuousScheme()
	 * @method \MyWebstor\Hms\EO_Clinic[] getClinicList()
	 * @method \MyWebstor\Hms\EO_Office_Collection getClinicCollection()
	 * @method \MyWebstor\Hms\EO_Clinic_Collection fillClinic()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection[] getSpecializationList()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection getSpecializationCollection()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection fillSpecialization()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\EO_Office $object)
	 * @method bool has(\MyWebstor\Hms\EO_Office $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Office getByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Office[] getAll()
	 * @method bool remove(\MyWebstor\Hms\EO_Office $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\EO_Office_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\EO_Office current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Office_Collection merge(?EO_Office_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Office_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\OfficeTable */
		static public $dataClass = '\MyWebstor\Hms\OfficeTable';
	}
}
namespace MyWebstor\Hms {
	/**
	 * @method static EO_Office_Query query()
	 * @method static EO_Office_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Office_Result getById($id)
	 * @method static EO_Office_Result getList(array $parameters = [])
	 * @method static EO_Office_Entity getEntity()
	 * @method static \MyWebstor\Hms\EO_Office createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\EO_Office_Collection createCollection()
	 * @method static \MyWebstor\Hms\EO_Office wakeUpObject($row)
	 * @method static \MyWebstor\Hms\EO_Office_Collection wakeUpCollection($rows)
	 */
	class OfficeTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Office_Result exec()
	 * @method \MyWebstor\Hms\EO_Office fetchObject()
	 * @method \MyWebstor\Hms\EO_Office_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Office_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\EO_Office fetchObject()
	 * @method \MyWebstor\Hms\EO_Office_Collection fetchCollection()
	 */
	class EO_Office_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\EO_Office createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\EO_Office_Collection createCollection()
	 * @method \MyWebstor\Hms\EO_Office wakeUpObject($row)
	 * @method \MyWebstor\Hms\EO_Office_Collection wakeUpCollection($rows)
	 */
	class EO_Office_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\DoctorTable */
namespace MyWebstor\Hms {
	/**
	 * EO_Doctor
	 * @see \MyWebstor\Hms\DoctorTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\EO_Doctor setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getXmlId()
	 * @method \MyWebstor\Hms\EO_Doctor setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \MyWebstor\Hms\EO_Doctor resetXmlId()
	 * @method \MyWebstor\Hms\EO_Doctor unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \int getOfficeId()
	 * @method \MyWebstor\Hms\EO_Doctor setOfficeId(\int|\Bitrix\Main\DB\SqlExpression $officeId)
	 * @method bool hasOfficeId()
	 * @method bool isOfficeIdFilled()
	 * @method bool isOfficeIdChanged()
	 * @method \int remindActualOfficeId()
	 * @method \int requireOfficeId()
	 * @method \MyWebstor\Hms\EO_Doctor resetOfficeId()
	 * @method \MyWebstor\Hms\EO_Doctor unsetOfficeId()
	 * @method \int fillOfficeId()
	 * @method \boolean getIsContinuousScheme()
	 * @method \MyWebstor\Hms\EO_Doctor setIsContinuousScheme(\boolean|\Bitrix\Main\DB\SqlExpression $isContinuousScheme)
	 * @method bool hasIsContinuousScheme()
	 * @method bool isIsContinuousSchemeFilled()
	 * @method bool isIsContinuousSchemeChanged()
	 * @method \boolean remindActualIsContinuousScheme()
	 * @method \boolean requireIsContinuousScheme()
	 * @method \MyWebstor\Hms\EO_Doctor resetIsContinuousScheme()
	 * @method \MyWebstor\Hms\EO_Doctor unsetIsContinuousScheme()
	 * @method \boolean fillIsContinuousScheme()
	 * @method \string getUserTitle()
	 * @method \string remindActualUserTitle()
	 * @method \string requireUserTitle()
	 * @method bool hasUserTitle()
	 * @method bool isUserTitleFilled()
	 * @method \MyWebstor\Hms\EO_Doctor unsetUserTitle()
	 * @method \string fillUserTitle()
	 * @method \string getUserInitials()
	 * @method \string remindActualUserInitials()
	 * @method \string requireUserInitials()
	 * @method bool hasUserInitials()
	 * @method bool isUserInitialsFilled()
	 * @method \MyWebstor\Hms\EO_Doctor unsetUserInitials()
	 * @method \string fillUserInitials()
	 * @method \Bitrix\Main\EO_User getUser()
	 * @method \Bitrix\Main\EO_User remindActualUser()
	 * @method \Bitrix\Main\EO_User requireUser()
	 * @method \MyWebstor\Hms\EO_Doctor setUser(\Bitrix\Main\EO_User $object)
	 * @method \MyWebstor\Hms\EO_Doctor resetUser()
	 * @method \MyWebstor\Hms\EO_Doctor unsetUser()
	 * @method bool hasUser()
	 * @method bool isUserFilled()
	 * @method bool isUserChanged()
	 * @method \Bitrix\Main\EO_User fillUser()
	 * @method \MyWebstor\Hms\EO_Office getOffice()
	 * @method \MyWebstor\Hms\EO_Office remindActualOffice()
	 * @method \MyWebstor\Hms\EO_Office requireOffice()
	 * @method \MyWebstor\Hms\EO_Doctor setOffice(\MyWebstor\Hms\EO_Office $object)
	 * @method \MyWebstor\Hms\EO_Doctor resetOffice()
	 * @method \MyWebstor\Hms\EO_Doctor unsetOffice()
	 * @method bool hasOffice()
	 * @method bool isOfficeFilled()
	 * @method bool isOfficeChanged()
	 * @method \MyWebstor\Hms\EO_Office fillOffice()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection getSpecialization()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection requireSpecialization()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection fillSpecialization()
	 * @method bool hasSpecialization()
	 * @method bool isSpecializationFilled()
	 * @method bool isSpecializationChanged()
	 * @method void addToSpecialization(\MyWebstor\Hms\EO_Specialization $specialization)
	 * @method void removeFromSpecialization(\MyWebstor\Hms\EO_Specialization $specialization)
	 * @method void removeAllSpecialization()
	 * @method \MyWebstor\Hms\EO_Doctor resetSpecialization()
	 * @method \MyWebstor\Hms\EO_Doctor unsetSpecialization()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\EO_Doctor set($fieldName, $value)
	 * @method \MyWebstor\Hms\EO_Doctor reset($fieldName)
	 * @method \MyWebstor\Hms\EO_Doctor unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\EO_Doctor wakeUp($data)
	 */
	class EO_Doctor {
		/* @var \MyWebstor\Hms\DoctorTable */
		static public $dataClass = '\MyWebstor\Hms\DoctorTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms {
	/**
	 * EO_Doctor_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \int[] getOfficeIdList()
	 * @method \int[] fillOfficeId()
	 * @method \boolean[] getIsContinuousSchemeList()
	 * @method \boolean[] fillIsContinuousScheme()
	 * @method \string[] getUserTitleList()
	 * @method \string[] fillUserTitle()
	 * @method \string[] getUserInitialsList()
	 * @method \string[] fillUserInitials()
	 * @method \Bitrix\Main\EO_User[] getUserList()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection getUserCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillUser()
	 * @method \MyWebstor\Hms\EO_Office[] getOfficeList()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection getOfficeCollection()
	 * @method \MyWebstor\Hms\EO_Office_Collection fillOffice()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection[] getSpecializationList()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection getSpecializationCollection()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection fillSpecialization()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\EO_Doctor $object)
	 * @method bool has(\MyWebstor\Hms\EO_Doctor $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Doctor getByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Doctor[] getAll()
	 * @method bool remove(\MyWebstor\Hms\EO_Doctor $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\EO_Doctor_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\EO_Doctor current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Doctor_Collection merge(?EO_Doctor_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Doctor_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\DoctorTable */
		static public $dataClass = '\MyWebstor\Hms\DoctorTable';
	}
}
namespace MyWebstor\Hms {
	/**
	 * @method static EO_Doctor_Query query()
	 * @method static EO_Doctor_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Doctor_Result getById($id)
	 * @method static EO_Doctor_Result getList(array $parameters = [])
	 * @method static EO_Doctor_Entity getEntity()
	 * @method static \MyWebstor\Hms\EO_Doctor createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\EO_Doctor_Collection createCollection()
	 * @method static \MyWebstor\Hms\EO_Doctor wakeUpObject($row)
	 * @method static \MyWebstor\Hms\EO_Doctor_Collection wakeUpCollection($rows)
	 */
	class DoctorTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Doctor_Result exec()
	 * @method \MyWebstor\Hms\EO_Doctor fetchObject()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Doctor_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\EO_Doctor fetchObject()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection fetchCollection()
	 */
	class EO_Doctor_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\EO_Doctor createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\EO_Doctor_Collection createCollection()
	 * @method \MyWebstor\Hms\EO_Doctor wakeUpObject($row)
	 * @method \MyWebstor\Hms\EO_Doctor_Collection wakeUpCollection($rows)
	 */
	class EO_Doctor_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\AppointmentTable */
namespace MyWebstor\Hms {
	/**
	 * Appointment
	 * @see \MyWebstor\Hms\AppointmentTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Object\Appointment setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getXmlId()
	 * @method \MyWebstor\Hms\Object\Appointment setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \MyWebstor\Hms\Object\Appointment resetXmlId()
	 * @method \MyWebstor\Hms\Object\Appointment unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \string getReserveXmlId()
	 * @method \MyWebstor\Hms\Object\Appointment setReserveXmlId(\string|\Bitrix\Main\DB\SqlExpression $reserveXmlId)
	 * @method bool hasReserveXmlId()
	 * @method bool isReserveXmlIdFilled()
	 * @method bool isReserveXmlIdChanged()
	 * @method \string remindActualReserveXmlId()
	 * @method \string requireReserveXmlId()
	 * @method \MyWebstor\Hms\Object\Appointment resetReserveXmlId()
	 * @method \MyWebstor\Hms\Object\Appointment unsetReserveXmlId()
	 * @method \string fillReserveXmlId()
	 * @method \Bitrix\Main\Type\DateTime getDateCreate()
	 * @method \MyWebstor\Hms\Object\Appointment setDateCreate(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateCreate)
	 * @method bool hasDateCreate()
	 * @method bool isDateCreateFilled()
	 * @method bool isDateCreateChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateCreate()
	 * @method \Bitrix\Main\Type\DateTime requireDateCreate()
	 * @method \MyWebstor\Hms\Object\Appointment resetDateCreate()
	 * @method \MyWebstor\Hms\Object\Appointment unsetDateCreate()
	 * @method \Bitrix\Main\Type\DateTime fillDateCreate()
	 * @method \string getTitle()
	 * @method \MyWebstor\Hms\Object\Appointment setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\Hms\Object\Appointment resetTitle()
	 * @method \MyWebstor\Hms\Object\Appointment unsetTitle()
	 * @method \string fillTitle()
	 * @method \string getRealStatusId()
	 * @method \MyWebstor\Hms\Object\Appointment setRealStatusId(\string|\Bitrix\Main\DB\SqlExpression $realStatusId)
	 * @method bool hasRealStatusId()
	 * @method bool isRealStatusIdFilled()
	 * @method bool isRealStatusIdChanged()
	 * @method \string remindActualRealStatusId()
	 * @method \string requireRealStatusId()
	 * @method \MyWebstor\Hms\Object\Appointment resetRealStatusId()
	 * @method \MyWebstor\Hms\Object\Appointment unsetRealStatusId()
	 * @method \string fillRealStatusId()
	 * @method \string getSourceType()
	 * @method \MyWebstor\Hms\Object\Appointment setSourceType(\string|\Bitrix\Main\DB\SqlExpression $sourceType)
	 * @method bool hasSourceType()
	 * @method bool isSourceTypeFilled()
	 * @method bool isSourceTypeChanged()
	 * @method \string remindActualSourceType()
	 * @method \string requireSourceType()
	 * @method \MyWebstor\Hms\Object\Appointment resetSourceType()
	 * @method \MyWebstor\Hms\Object\Appointment unsetSourceType()
	 * @method \string fillSourceType()
	 * @method \int getSourceId()
	 * @method \MyWebstor\Hms\Object\Appointment setSourceId(\int|\Bitrix\Main\DB\SqlExpression $sourceId)
	 * @method bool hasSourceId()
	 * @method bool isSourceIdFilled()
	 * @method bool isSourceIdChanged()
	 * @method \int remindActualSourceId()
	 * @method \int requireSourceId()
	 * @method \MyWebstor\Hms\Object\Appointment resetSourceId()
	 * @method \MyWebstor\Hms\Object\Appointment unsetSourceId()
	 * @method \int fillSourceId()
	 * @method \int getClinicId()
	 * @method \MyWebstor\Hms\Object\Appointment setClinicId(\int|\Bitrix\Main\DB\SqlExpression $clinicId)
	 * @method bool hasClinicId()
	 * @method bool isClinicIdFilled()
	 * @method bool isClinicIdChanged()
	 * @method \int remindActualClinicId()
	 * @method \int requireClinicId()
	 * @method \MyWebstor\Hms\Object\Appointment resetClinicId()
	 * @method \MyWebstor\Hms\Object\Appointment unsetClinicId()
	 * @method \int fillClinicId()
	 * @method \int getDoctorId()
	 * @method \MyWebstor\Hms\Object\Appointment setDoctorId(\int|\Bitrix\Main\DB\SqlExpression $doctorId)
	 * @method bool hasDoctorId()
	 * @method bool isDoctorIdFilled()
	 * @method bool isDoctorIdChanged()
	 * @method \int remindActualDoctorId()
	 * @method \int requireDoctorId()
	 * @method \MyWebstor\Hms\Object\Appointment resetDoctorId()
	 * @method \MyWebstor\Hms\Object\Appointment unsetDoctorId()
	 * @method \int fillDoctorId()
	 * @method \int getOfficeId()
	 * @method \MyWebstor\Hms\Object\Appointment setOfficeId(\int|\Bitrix\Main\DB\SqlExpression $officeId)
	 * @method bool hasOfficeId()
	 * @method bool isOfficeIdFilled()
	 * @method bool isOfficeIdChanged()
	 * @method \int remindActualOfficeId()
	 * @method \int requireOfficeId()
	 * @method \MyWebstor\Hms\Object\Appointment resetOfficeId()
	 * @method \MyWebstor\Hms\Object\Appointment unsetOfficeId()
	 * @method \int fillOfficeId()
	 * @method \int getSpecializationId()
	 * @method \MyWebstor\Hms\Object\Appointment setSpecializationId(\int|\Bitrix\Main\DB\SqlExpression $specializationId)
	 * @method bool hasSpecializationId()
	 * @method bool isSpecializationIdFilled()
	 * @method bool isSpecializationIdChanged()
	 * @method \int remindActualSpecializationId()
	 * @method \int requireSpecializationId()
	 * @method \MyWebstor\Hms\Object\Appointment resetSpecializationId()
	 * @method \MyWebstor\Hms\Object\Appointment unsetSpecializationId()
	 * @method \int fillSpecializationId()
	 * @method \Bitrix\Main\Type\DateTime getDateFrom()
	 * @method \MyWebstor\Hms\Object\Appointment setDateFrom(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateFrom)
	 * @method bool hasDateFrom()
	 * @method bool isDateFromFilled()
	 * @method bool isDateFromChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateFrom()
	 * @method \Bitrix\Main\Type\DateTime requireDateFrom()
	 * @method \MyWebstor\Hms\Object\Appointment resetDateFrom()
	 * @method \MyWebstor\Hms\Object\Appointment unsetDateFrom()
	 * @method \Bitrix\Main\Type\DateTime fillDateFrom()
	 * @method \int getDuration()
	 * @method \MyWebstor\Hms\Object\Appointment setDuration(\int|\Bitrix\Main\DB\SqlExpression $duration)
	 * @method bool hasDuration()
	 * @method bool isDurationFilled()
	 * @method bool isDurationChanged()
	 * @method \int remindActualDuration()
	 * @method \int requireDuration()
	 * @method \MyWebstor\Hms\Object\Appointment resetDuration()
	 * @method \MyWebstor\Hms\Object\Appointment unsetDuration()
	 * @method \int fillDuration()
	 * @method \string getComments()
	 * @method \MyWebstor\Hms\Object\Appointment setComments(\string|\Bitrix\Main\DB\SqlExpression $comments)
	 * @method bool hasComments()
	 * @method bool isCommentsFilled()
	 * @method bool isCommentsChanged()
	 * @method \string remindActualComments()
	 * @method \string requireComments()
	 * @method \MyWebstor\Hms\Object\Appointment resetComments()
	 * @method \MyWebstor\Hms\Object\Appointment unsetComments()
	 * @method \string fillComments()
	 * @method \int getAssignedById()
	 * @method \MyWebstor\Hms\Object\Appointment setAssignedById(\int|\Bitrix\Main\DB\SqlExpression $assignedById)
	 * @method bool hasAssignedById()
	 * @method bool isAssignedByIdFilled()
	 * @method bool isAssignedByIdChanged()
	 * @method \int remindActualAssignedById()
	 * @method \int requireAssignedById()
	 * @method \MyWebstor\Hms\Object\Appointment resetAssignedById()
	 * @method \MyWebstor\Hms\Object\Appointment unsetAssignedById()
	 * @method \int fillAssignedById()
	 * @method \Bitrix\Main\Type\DateTime getDateTo()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateTo()
	 * @method \Bitrix\Main\Type\DateTime requireDateTo()
	 * @method bool hasDateTo()
	 * @method bool isDateToFilled()
	 * @method \MyWebstor\Hms\Object\Appointment unsetDateTo()
	 * @method \Bitrix\Main\Type\DateTime fillDateTo()
	 * @method \string getStatusId()
	 * @method \string remindActualStatusId()
	 * @method \string requireStatusId()
	 * @method bool hasStatusId()
	 * @method bool isStatusIdFilled()
	 * @method \MyWebstor\Hms\Object\Appointment unsetStatusId()
	 * @method \string fillStatusId()
	 * @method \MyWebstor\Hms\EO_Clinic getClinic()
	 * @method \MyWebstor\Hms\EO_Clinic remindActualClinic()
	 * @method \MyWebstor\Hms\EO_Clinic requireClinic()
	 * @method \MyWebstor\Hms\Object\Appointment setClinic(\MyWebstor\Hms\EO_Clinic $object)
	 * @method \MyWebstor\Hms\Object\Appointment resetClinic()
	 * @method \MyWebstor\Hms\Object\Appointment unsetClinic()
	 * @method bool hasClinic()
	 * @method bool isClinicFilled()
	 * @method bool isClinicChanged()
	 * @method \MyWebstor\Hms\EO_Clinic fillClinic()
	 * @method \MyWebstor\Hms\EO_Doctor getDoctor()
	 * @method \MyWebstor\Hms\EO_Doctor remindActualDoctor()
	 * @method \MyWebstor\Hms\EO_Doctor requireDoctor()
	 * @method \MyWebstor\Hms\Object\Appointment setDoctor(\MyWebstor\Hms\EO_Doctor $object)
	 * @method \MyWebstor\Hms\Object\Appointment resetDoctor()
	 * @method \MyWebstor\Hms\Object\Appointment unsetDoctor()
	 * @method bool hasDoctor()
	 * @method bool isDoctorFilled()
	 * @method bool isDoctorChanged()
	 * @method \MyWebstor\Hms\EO_Doctor fillDoctor()
	 * @method \MyWebstor\Hms\EO_Office getOffice()
	 * @method \MyWebstor\Hms\EO_Office remindActualOffice()
	 * @method \MyWebstor\Hms\EO_Office requireOffice()
	 * @method \MyWebstor\Hms\Object\Appointment setOffice(\MyWebstor\Hms\EO_Office $object)
	 * @method \MyWebstor\Hms\Object\Appointment resetOffice()
	 * @method \MyWebstor\Hms\Object\Appointment unsetOffice()
	 * @method bool hasOffice()
	 * @method bool isOfficeFilled()
	 * @method bool isOfficeChanged()
	 * @method \MyWebstor\Hms\EO_Office fillOffice()
	 * @method \MyWebstor\Hms\EO_Specialization getSpecialization()
	 * @method \MyWebstor\Hms\EO_Specialization remindActualSpecialization()
	 * @method \MyWebstor\Hms\EO_Specialization requireSpecialization()
	 * @method \MyWebstor\Hms\Object\Appointment setSpecialization(\MyWebstor\Hms\EO_Specialization $object)
	 * @method \MyWebstor\Hms\Object\Appointment resetSpecialization()
	 * @method \MyWebstor\Hms\Object\Appointment unsetSpecialization()
	 * @method bool hasSpecialization()
	 * @method bool isSpecializationFilled()
	 * @method bool isSpecializationChanged()
	 * @method \MyWebstor\Hms\EO_Specialization fillSpecialization()
	 * @method \Bitrix\Crm\EO_Status getStatus()
	 * @method \Bitrix\Crm\EO_Status remindActualStatus()
	 * @method \Bitrix\Crm\EO_Status requireStatus()
	 * @method \MyWebstor\Hms\Object\Appointment setStatus(\Bitrix\Crm\EO_Status $object)
	 * @method \MyWebstor\Hms\Object\Appointment resetStatus()
	 * @method \MyWebstor\Hms\Object\Appointment unsetStatus()
	 * @method bool hasStatus()
	 * @method bool isStatusFilled()
	 * @method bool isStatusChanged()
	 * @method \Bitrix\Crm\EO_Status fillStatus()
	 * @method \int getContactId()
	 * @method \int remindActualContactId()
	 * @method \int requireContactId()
	 * @method bool hasContactId()
	 * @method bool isContactIdFilled()
	 * @method \MyWebstor\Hms\Object\Appointment unsetContactId()
	 * @method \int fillContactId()
	 * @method \Bitrix\Crm\Contact getContact()
	 * @method \Bitrix\Crm\Contact remindActualContact()
	 * @method \Bitrix\Crm\Contact requireContact()
	 * @method \MyWebstor\Hms\Object\Appointment setContact(\Bitrix\Crm\Contact $object)
	 * @method \MyWebstor\Hms\Object\Appointment resetContact()
	 * @method \MyWebstor\Hms\Object\Appointment unsetContact()
	 * @method bool hasContact()
	 * @method bool isContactFilled()
	 * @method bool isContactChanged()
	 * @method \Bitrix\Crm\Contact fillContact()
	 * @method \Bitrix\Main\EO_User getAssignedBy()
	 * @method \Bitrix\Main\EO_User remindActualAssignedBy()
	 * @method \Bitrix\Main\EO_User requireAssignedBy()
	 * @method \MyWebstor\Hms\Object\Appointment setAssignedBy(\Bitrix\Main\EO_User $object)
	 * @method \MyWebstor\Hms\Object\Appointment resetAssignedBy()
	 * @method \MyWebstor\Hms\Object\Appointment unsetAssignedBy()
	 * @method bool hasAssignedBy()
	 * @method bool isAssignedByFilled()
	 * @method bool isAssignedByChanged()
	 * @method \Bitrix\Main\EO_User fillAssignedBy()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection getContactBindings()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection requireContactBindings()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection fillContactBindings()
	 * @method bool hasContactBindings()
	 * @method bool isContactBindingsFilled()
	 * @method bool isContactBindingsChanged()
	 * @method void addToContactBindings(\MyWebstor\Hms\Binding\EO_AppointmentContact $appointmentContact)
	 * @method void removeFromContactBindings(\MyWebstor\Hms\Binding\EO_AppointmentContact $appointmentContact)
	 * @method void removeAllContactBindings()
	 * @method \MyWebstor\Hms\Object\Appointment resetContactBindings()
	 * @method \MyWebstor\Hms\Object\Appointment unsetContactBindings()
	 * @method \Bitrix\Crm\ProductRowCollection getProductRows()
	 * @method \Bitrix\Crm\ProductRowCollection requireProductRows()
	 * @method \Bitrix\Crm\ProductRowCollection fillProductRows()
	 * @method bool hasProductRows()
	 * @method bool isProductRowsFilled()
	 * @method bool isProductRowsChanged()
	 * @method void addToProductRows(\Bitrix\Crm\ProductRow $productRow)
	 * @method void removeFromProductRows(\Bitrix\Crm\ProductRow $productRow)
	 * @method void removeAllProductRows()
	 * @method \MyWebstor\Hms\Object\Appointment resetProductRows()
	 * @method \MyWebstor\Hms\Object\Appointment unsetProductRows()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection getReserveDoctor()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection requireReserveDoctor()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection fillReserveDoctor()
	 * @method bool hasReserveDoctor()
	 * @method bool isReserveDoctorFilled()
	 * @method bool isReserveDoctorChanged()
	 * @method void addToReserveDoctor(\MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor $appointmentReserveDoctor)
	 * @method void removeFromReserveDoctor(\MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor $appointmentReserveDoctor)
	 * @method void removeAllReserveDoctor()
	 * @method \MyWebstor\Hms\Object\Appointment resetReserveDoctor()
	 * @method \MyWebstor\Hms\Object\Appointment unsetReserveDoctor()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection getReserveOffice()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection requireReserveOffice()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection fillReserveOffice()
	 * @method bool hasReserveOffice()
	 * @method bool isReserveOfficeFilled()
	 * @method bool isReserveOfficeChanged()
	 * @method void addToReserveOffice(\MyWebstor\Hms\Binding\EO_AppointmentReserveOffice $appointmentReserveOffice)
	 * @method void removeFromReserveOffice(\MyWebstor\Hms\Binding\EO_AppointmentReserveOffice $appointmentReserveOffice)
	 * @method void removeAllReserveOffice()
	 * @method \MyWebstor\Hms\Object\Appointment resetReserveOffice()
	 * @method \MyWebstor\Hms\Object\Appointment unsetReserveOffice()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection getReserveSpecialization()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection requireReserveSpecialization()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection fillReserveSpecialization()
	 * @method bool hasReserveSpecialization()
	 * @method bool isReserveSpecializationFilled()
	 * @method bool isReserveSpecializationChanged()
	 * @method void addToReserveSpecialization(\MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization $appointmentReserveSpecialization)
	 * @method void removeFromReserveSpecialization(\MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization $appointmentReserveSpecialization)
	 * @method void removeAllReserveSpecialization()
	 * @method \MyWebstor\Hms\Object\Appointment resetReserveSpecialization()
	 * @method \MyWebstor\Hms\Object\Appointment unsetReserveSpecialization()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection getReserveDate()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection requireReserveDate()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection fillReserveDate()
	 * @method bool hasReserveDate()
	 * @method bool isReserveDateFilled()
	 * @method bool isReserveDateChanged()
	 * @method void addToReserveDate(\MyWebstor\Hms\Binding\EO_AppointmentReserveDate $appointmentReserveDate)
	 * @method void removeFromReserveDate(\MyWebstor\Hms\Binding\EO_AppointmentReserveDate $appointmentReserveDate)
	 * @method void removeAllReserveDate()
	 * @method \MyWebstor\Hms\Object\Appointment resetReserveDate()
	 * @method \MyWebstor\Hms\Object\Appointment unsetReserveDate()
	 * @method \MyWebstor\Hms\Object\Receive getReceive()
	 * @method \MyWebstor\Hms\Object\Receive remindActualReceive()
	 * @method \MyWebstor\Hms\Object\Receive requireReceive()
	 * @method \MyWebstor\Hms\Object\Appointment setReceive(\MyWebstor\Hms\Object\Receive $object)
	 * @method \MyWebstor\Hms\Object\Appointment resetReceive()
	 * @method \MyWebstor\Hms\Object\Appointment unsetReceive()
	 * @method bool hasReceive()
	 * @method bool isReceiveFilled()
	 * @method bool isReceiveChanged()
	 * @method \MyWebstor\Hms\Object\Receive fillReceive()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection getDeals()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection requireDeals()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection fillDeals()
	 * @method bool hasDeals()
	 * @method bool isDealsFilled()
	 * @method bool isDealsChanged()
	 * @method void addToDeals(\MyWebstor\Hms\Binding\EO_AppointmentDeal $appointmentDeal)
	 * @method void removeFromDeals(\MyWebstor\Hms\Binding\EO_AppointmentDeal $appointmentDeal)
	 * @method void removeAllDeals()
	 * @method \MyWebstor\Hms\Object\Appointment resetDeals()
	 * @method \MyWebstor\Hms\Object\Appointment unsetDeals()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Object\Appointment set($fieldName, $value)
	 * @method \MyWebstor\Hms\Object\Appointment reset($fieldName)
	 * @method \MyWebstor\Hms\Object\Appointment unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Object\Appointment wakeUp($data)
	 */
	class EO_Appointment {
		/* @var \MyWebstor\Hms\AppointmentTable */
		static public $dataClass = '\MyWebstor\Hms\AppointmentTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms {
	/**
	 * EO_Appointment_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \string[] getReserveXmlIdList()
	 * @method \string[] fillReserveXmlId()
	 * @method \Bitrix\Main\Type\DateTime[] getDateCreateList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateCreate()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \string[] getRealStatusIdList()
	 * @method \string[] fillRealStatusId()
	 * @method \string[] getSourceTypeList()
	 * @method \string[] fillSourceType()
	 * @method \int[] getSourceIdList()
	 * @method \int[] fillSourceId()
	 * @method \int[] getClinicIdList()
	 * @method \int[] fillClinicId()
	 * @method \int[] getDoctorIdList()
	 * @method \int[] fillDoctorId()
	 * @method \int[] getOfficeIdList()
	 * @method \int[] fillOfficeId()
	 * @method \int[] getSpecializationIdList()
	 * @method \int[] fillSpecializationId()
	 * @method \Bitrix\Main\Type\DateTime[] getDateFromList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateFrom()
	 * @method \int[] getDurationList()
	 * @method \int[] fillDuration()
	 * @method \string[] getCommentsList()
	 * @method \string[] fillComments()
	 * @method \int[] getAssignedByIdList()
	 * @method \int[] fillAssignedById()
	 * @method \Bitrix\Main\Type\DateTime[] getDateToList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateTo()
	 * @method \string[] getStatusIdList()
	 * @method \string[] fillStatusId()
	 * @method \MyWebstor\Hms\EO_Clinic[] getClinicList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getClinicCollection()
	 * @method \MyWebstor\Hms\EO_Clinic_Collection fillClinic()
	 * @method \MyWebstor\Hms\EO_Doctor[] getDoctorList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getDoctorCollection()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection fillDoctor()
	 * @method \MyWebstor\Hms\EO_Office[] getOfficeList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getOfficeCollection()
	 * @method \MyWebstor\Hms\EO_Office_Collection fillOffice()
	 * @method \MyWebstor\Hms\EO_Specialization[] getSpecializationList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getSpecializationCollection()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection fillSpecialization()
	 * @method \Bitrix\Crm\EO_Status[] getStatusList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getStatusCollection()
	 * @method \Bitrix\Crm\EO_Status_Collection fillStatus()
	 * @method \int[] getContactIdList()
	 * @method \int[] fillContactId()
	 * @method \Bitrix\Crm\Contact[] getContactList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getContactCollection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillContact()
	 * @method \Bitrix\Main\EO_User[] getAssignedByList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getAssignedByCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillAssignedBy()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection[] getContactBindingsList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection getContactBindingsCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection fillContactBindings()
	 * @method \Bitrix\Crm\ProductRowCollection[] getProductRowsList()
	 * @method \Bitrix\Crm\ProductRowCollection getProductRowsCollection()
	 * @method \Bitrix\Crm\ProductRowCollection fillProductRows()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection[] getReserveDoctorList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection getReserveDoctorCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection fillReserveDoctor()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection[] getReserveOfficeList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection getReserveOfficeCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection fillReserveOffice()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection[] getReserveSpecializationList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection getReserveSpecializationCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection fillReserveSpecialization()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection[] getReserveDateList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection getReserveDateCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection fillReserveDate()
	 * @method \MyWebstor\Hms\Object\Receive[] getReceiveList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getReceiveCollection()
	 * @method \MyWebstor\Hms\EO_Receive_Collection fillReceive()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection[] getDealsList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection getDealsCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection fillDeals()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Object\Appointment $object)
	 * @method bool has(\MyWebstor\Hms\Object\Appointment $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Object\Appointment getByPrimary($primary)
	 * @method \MyWebstor\Hms\Object\Appointment[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Object\Appointment $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\EO_Appointment_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Object\Appointment current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Appointment_Collection merge(?EO_Appointment_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Appointment_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\AppointmentTable */
		static public $dataClass = '\MyWebstor\Hms\AppointmentTable';
	}
}
namespace MyWebstor\Hms {
	/**
	 * @method static EO_Appointment_Query query()
	 * @method static EO_Appointment_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Appointment_Result getById($id)
	 * @method static EO_Appointment_Result getList(array $parameters = [])
	 * @method static EO_Appointment_Entity getEntity()
	 * @method static \MyWebstor\Hms\Object\Appointment createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\EO_Appointment_Collection createCollection()
	 * @method static \MyWebstor\Hms\Object\Appointment wakeUpObject($row)
	 * @method static \MyWebstor\Hms\EO_Appointment_Collection wakeUpCollection($rows)
	 */
	class AppointmentTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Appointment_Result exec()
	 * @method \MyWebstor\Hms\Object\Appointment fetchObject()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Appointment_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Object\Appointment fetchObject()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fetchCollection()
	 */
	class EO_Appointment_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Object\Appointment createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\EO_Appointment_Collection createCollection()
	 * @method \MyWebstor\Hms\Object\Appointment wakeUpObject($row)
	 * @method \MyWebstor\Hms\EO_Appointment_Collection wakeUpCollection($rows)
	 */
	class EO_Appointment_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Dent\TeethChartTable */
namespace MyWebstor\Hms\Dent {
	/**
	 * EO_TeethChart
	 * @see \MyWebstor\Hms\Dent\TeethChartTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getContactId()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setContactId(\int|\Bitrix\Main\DB\SqlExpression $contactId)
	 * @method bool hasContactId()
	 * @method bool isContactIdFilled()
	 * @method bool isContactIdChanged()
	 * @method \int remindActualContactId()
	 * @method \int requireContactId()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetContactId()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetContactId()
	 * @method \int fillContactId()
	 * @method \int getReceiveId()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setReceiveId(\int|\Bitrix\Main\DB\SqlExpression $receiveId)
	 * @method bool hasReceiveId()
	 * @method bool isReceiveIdFilled()
	 * @method bool isReceiveIdChanged()
	 * @method \int remindActualReceiveId()
	 * @method \int requireReceiveId()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetReceiveId()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetReceiveId()
	 * @method \int fillReceiveId()
	 * @method \Bitrix\Main\Type\DateTime getDateCreate()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setDateCreate(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateCreate)
	 * @method bool hasDateCreate()
	 * @method bool isDateCreateFilled()
	 * @method bool isDateCreateChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateCreate()
	 * @method \Bitrix\Main\Type\DateTime requireDateCreate()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetDateCreate()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetDateCreate()
	 * @method \Bitrix\Main\Type\DateTime fillDateCreate()
	 * @method \string getDiagnosis()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setDiagnosis(\string|\Bitrix\Main\DB\SqlExpression $diagnosis)
	 * @method bool hasDiagnosis()
	 * @method bool isDiagnosisFilled()
	 * @method bool isDiagnosisChanged()
	 * @method \string remindActualDiagnosis()
	 * @method \string requireDiagnosis()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetDiagnosis()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetDiagnosis()
	 * @method \string fillDiagnosis()
	 * @method \string getComplaints()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setComplaints(\string|\Bitrix\Main\DB\SqlExpression $complaints)
	 * @method bool hasComplaints()
	 * @method bool isComplaintsFilled()
	 * @method bool isComplaintsChanged()
	 * @method \string remindActualComplaints()
	 * @method \string requireComplaints()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetComplaints()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetComplaints()
	 * @method \string fillComplaints()
	 * @method \string getAnamnesis()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setAnamnesis(\string|\Bitrix\Main\DB\SqlExpression $anamnesis)
	 * @method bool hasAnamnesis()
	 * @method bool isAnamnesisFilled()
	 * @method bool isAnamnesisChanged()
	 * @method \string remindActualAnamnesis()
	 * @method \string requireAnamnesis()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetAnamnesis()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetAnamnesis()
	 * @method \string fillAnamnesis()
	 * @method \string getObjectively()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setObjectively(\string|\Bitrix\Main\DB\SqlExpression $objectively)
	 * @method bool hasObjectively()
	 * @method bool isObjectivelyFilled()
	 * @method bool isObjectivelyChanged()
	 * @method \string remindActualObjectively()
	 * @method \string requireObjectively()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetObjectively()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetObjectively()
	 * @method \string fillObjectively()
	 * @method \string getTreatment()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setTreatment(\string|\Bitrix\Main\DB\SqlExpression $treatment)
	 * @method bool hasTreatment()
	 * @method bool isTreatmentFilled()
	 * @method bool isTreatmentChanged()
	 * @method \string remindActualTreatment()
	 * @method \string requireTreatment()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetTreatment()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetTreatment()
	 * @method \string fillTreatment()
	 * @method \string getRecommendations()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setRecommendations(\string|\Bitrix\Main\DB\SqlExpression $recommendations)
	 * @method bool hasRecommendations()
	 * @method bool isRecommendationsFilled()
	 * @method bool isRecommendationsChanged()
	 * @method \string remindActualRecommendations()
	 * @method \string requireRecommendations()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetRecommendations()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetRecommendations()
	 * @method \string fillRecommendations()
	 * @method array getTeethChart()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setTeethChart(array|\Bitrix\Main\DB\SqlExpression $teethChart)
	 * @method bool hasTeethChart()
	 * @method bool isTeethChartFilled()
	 * @method bool isTeethChartChanged()
	 * @method array remindActualTeethChart()
	 * @method array requireTeethChart()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetTeethChart()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetTeethChart()
	 * @method array fillTeethChart()
	 * @method \Bitrix\Crm\Contact getContact()
	 * @method \Bitrix\Crm\Contact remindActualContact()
	 * @method \Bitrix\Crm\Contact requireContact()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setContact(\Bitrix\Crm\Contact $object)
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetContact()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetContact()
	 * @method bool hasContact()
	 * @method bool isContactFilled()
	 * @method bool isContactChanged()
	 * @method \Bitrix\Crm\Contact fillContact()
	 * @method \MyWebstor\Hms\Object\Receive getReceive()
	 * @method \MyWebstor\Hms\Object\Receive remindActualReceive()
	 * @method \MyWebstor\Hms\Object\Receive requireReceive()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setReceive(\MyWebstor\Hms\Object\Receive $object)
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetReceive()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetReceive()
	 * @method bool hasReceive()
	 * @method bool isReceiveFilled()
	 * @method bool isReceiveChanged()
	 * @method \MyWebstor\Hms\Object\Receive fillReceive()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive getDentReceive()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive remindActualDentReceive()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive requireDentReceive()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart setDentReceive(\MyWebstor\Hms\Object\Receive\DentReceive $object)
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart resetDentReceive()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unsetDentReceive()
	 * @method bool hasDentReceive()
	 * @method bool isDentReceiveFilled()
	 * @method bool isDentReceiveChanged()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive fillDentReceive()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart set($fieldName, $value)
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart reset($fieldName)
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Dent\EO_TeethChart wakeUp($data)
	 */
	class EO_TeethChart {
		/* @var \MyWebstor\Hms\Dent\TeethChartTable */
		static public $dataClass = '\MyWebstor\Hms\Dent\TeethChartTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Dent {
	/**
	 * EO_TeethChart_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getContactIdList()
	 * @method \int[] fillContactId()
	 * @method \int[] getReceiveIdList()
	 * @method \int[] fillReceiveId()
	 * @method \Bitrix\Main\Type\DateTime[] getDateCreateList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateCreate()
	 * @method \string[] getDiagnosisList()
	 * @method \string[] fillDiagnosis()
	 * @method \string[] getComplaintsList()
	 * @method \string[] fillComplaints()
	 * @method \string[] getAnamnesisList()
	 * @method \string[] fillAnamnesis()
	 * @method \string[] getObjectivelyList()
	 * @method \string[] fillObjectively()
	 * @method \string[] getTreatmentList()
	 * @method \string[] fillTreatment()
	 * @method \string[] getRecommendationsList()
	 * @method \string[] fillRecommendations()
	 * @method array[] getTeethChartList()
	 * @method array[] fillTeethChart()
	 * @method \Bitrix\Crm\Contact[] getContactList()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart_Collection getContactCollection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillContact()
	 * @method \MyWebstor\Hms\Object\Receive[] getReceiveList()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart_Collection getReceiveCollection()
	 * @method \MyWebstor\Hms\EO_Receive_Collection fillReceive()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive[] getDentReceiveList()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart_Collection getDentReceiveCollection()
	 * @method \MyWebstor\Hms\Receive\EO_DentReceive_Collection fillDentReceive()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Dent\EO_TeethChart $object)
	 * @method bool has(\MyWebstor\Hms\Dent\EO_TeethChart $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart getByPrimary($primary)
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Dent\EO_TeethChart $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Dent\EO_TeethChart_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_TeethChart_Collection merge(?EO_TeethChart_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_TeethChart_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Dent\TeethChartTable */
		static public $dataClass = '\MyWebstor\Hms\Dent\TeethChartTable';
	}
}
namespace MyWebstor\Hms\Dent {
	/**
	 * @method static EO_TeethChart_Query query()
	 * @method static EO_TeethChart_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_TeethChart_Result getById($id)
	 * @method static EO_TeethChart_Result getList(array $parameters = [])
	 * @method static EO_TeethChart_Entity getEntity()
	 * @method static \MyWebstor\Hms\Dent\EO_TeethChart createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Dent\EO_TeethChart_Collection createCollection()
	 * @method static \MyWebstor\Hms\Dent\EO_TeethChart wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Dent\EO_TeethChart_Collection wakeUpCollection($rows)
	 */
	class TeethChartTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_TeethChart_Result exec()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart fetchObject()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_TeethChart_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart fetchObject()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart_Collection fetchCollection()
	 */
	class EO_TeethChart_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart_Collection createCollection()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart wakeUpObject($row)
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart_Collection wakeUpCollection($rows)
	 */
	class EO_TeethChart_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Receive\BaseReceiveTable */
namespace MyWebstor\Hms\Receive {
	/**
	 * BaseReceive
	 * @see \MyWebstor\Hms\Receive\BaseReceiveTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getDiagnosis()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive setDiagnosis(\string|\Bitrix\Main\DB\SqlExpression $diagnosis)
	 * @method bool hasDiagnosis()
	 * @method bool isDiagnosisFilled()
	 * @method bool isDiagnosisChanged()
	 * @method \string remindActualDiagnosis()
	 * @method \string requireDiagnosis()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive resetDiagnosis()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive unsetDiagnosis()
	 * @method \string fillDiagnosis()
	 * @method \string getReport()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive setReport(\string|\Bitrix\Main\DB\SqlExpression $report)
	 * @method bool hasReport()
	 * @method bool isReportFilled()
	 * @method bool isReportChanged()
	 * @method \string remindActualReport()
	 * @method \string requireReport()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive resetReport()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive unsetReport()
	 * @method \string fillReport()
	 * @method \string getRecommendation()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive setRecommendation(\string|\Bitrix\Main\DB\SqlExpression $recommendation)
	 * @method bool hasRecommendation()
	 * @method bool isRecommendationFilled()
	 * @method bool isRecommendationChanged()
	 * @method \string remindActualRecommendation()
	 * @method \string requireRecommendation()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive resetRecommendation()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive unsetRecommendation()
	 * @method \string fillRecommendation()
	 * @method \MyWebstor\Hms\Object\Receive getReceive()
	 * @method \MyWebstor\Hms\Object\Receive remindActualReceive()
	 * @method \MyWebstor\Hms\Object\Receive requireReceive()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive setReceive(\MyWebstor\Hms\Object\Receive $object)
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive resetReceive()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive unsetReceive()
	 * @method bool hasReceive()
	 * @method bool isReceiveFilled()
	 * @method bool isReceiveChanged()
	 * @method \MyWebstor\Hms\Object\Receive fillReceive()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive set($fieldName, $value)
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive reset($fieldName)
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Object\Receive\BaseReceive wakeUp($data)
	 */
	class EO_BaseReceive {
		/* @var \MyWebstor\Hms\Receive\BaseReceiveTable */
		static public $dataClass = '\MyWebstor\Hms\Receive\BaseReceiveTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Receive {
	/**
	 * EO_BaseReceive_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getDiagnosisList()
	 * @method \string[] fillDiagnosis()
	 * @method \string[] getReportList()
	 * @method \string[] fillReport()
	 * @method \string[] getRecommendationList()
	 * @method \string[] fillRecommendation()
	 * @method \MyWebstor\Hms\Object\Receive[] getReceiveList()
	 * @method \MyWebstor\Hms\Receive\EO_BaseReceive_Collection getReceiveCollection()
	 * @method \MyWebstor\Hms\EO_Receive_Collection fillReceive()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Object\Receive\BaseReceive $object)
	 * @method bool has(\MyWebstor\Hms\Object\Receive\BaseReceive $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive getByPrimary($primary)
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Object\Receive\BaseReceive $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Receive\EO_BaseReceive_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_BaseReceive_Collection merge(?EO_BaseReceive_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_BaseReceive_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Receive\BaseReceiveTable */
		static public $dataClass = '\MyWebstor\Hms\Receive\BaseReceiveTable';
	}
}
namespace MyWebstor\Hms\Receive {
	/**
	 * @method static EO_BaseReceive_Query query()
	 * @method static EO_BaseReceive_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_BaseReceive_Result getById($id)
	 * @method static EO_BaseReceive_Result getList(array $parameters = [])
	 * @method static EO_BaseReceive_Entity getEntity()
	 * @method static \MyWebstor\Hms\Object\Receive\BaseReceive createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Receive\EO_BaseReceive_Collection createCollection()
	 * @method static \MyWebstor\Hms\Object\Receive\BaseReceive wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Receive\EO_BaseReceive_Collection wakeUpCollection($rows)
	 */
	class BaseReceiveTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_BaseReceive_Result exec()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive fetchObject()
	 * @method \MyWebstor\Hms\Receive\EO_BaseReceive_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_BaseReceive_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive fetchObject()
	 * @method \MyWebstor\Hms\Receive\EO_BaseReceive_Collection fetchCollection()
	 */
	class EO_BaseReceive_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Receive\EO_BaseReceive_Collection createCollection()
	 * @method \MyWebstor\Hms\Object\Receive\BaseReceive wakeUpObject($row)
	 * @method \MyWebstor\Hms\Receive\EO_BaseReceive_Collection wakeUpCollection($rows)
	 */
	class EO_BaseReceive_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Receive\DentReceiveTable */
namespace MyWebstor\Hms\Receive {
	/**
	 * DentReceive
	 * @see \MyWebstor\Hms\Receive\DentReceiveTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getDentTeethChartId()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive setDentTeethChartId(\int|\Bitrix\Main\DB\SqlExpression $dentTeethChartId)
	 * @method bool hasDentTeethChartId()
	 * @method bool isDentTeethChartIdFilled()
	 * @method bool isDentTeethChartIdChanged()
	 * @method \int remindActualDentTeethChartId()
	 * @method \int requireDentTeethChartId()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive resetDentTeethChartId()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive unsetDentTeethChartId()
	 * @method \int fillDentTeethChartId()
	 * @method \MyWebstor\Hms\Object\Receive getReceive()
	 * @method \MyWebstor\Hms\Object\Receive remindActualReceive()
	 * @method \MyWebstor\Hms\Object\Receive requireReceive()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive setReceive(\MyWebstor\Hms\Object\Receive $object)
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive resetReceive()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive unsetReceive()
	 * @method bool hasReceive()
	 * @method bool isReceiveFilled()
	 * @method bool isReceiveChanged()
	 * @method \MyWebstor\Hms\Object\Receive fillReceive()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart getDentTeethChart()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart remindActualDentTeethChart()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart requireDentTeethChart()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive setDentTeethChart(\MyWebstor\Hms\Dent\EO_TeethChart $object)
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive resetDentTeethChart()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive unsetDentTeethChart()
	 * @method bool hasDentTeethChart()
	 * @method bool isDentTeethChartFilled()
	 * @method bool isDentTeethChartChanged()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart fillDentTeethChart()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive set($fieldName, $value)
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive reset($fieldName)
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Object\Receive\DentReceive wakeUp($data)
	 */
	class EO_DentReceive {
		/* @var \MyWebstor\Hms\Receive\DentReceiveTable */
		static public $dataClass = '\MyWebstor\Hms\Receive\DentReceiveTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Receive {
	/**
	 * EO_DentReceive_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getDentTeethChartIdList()
	 * @method \int[] fillDentTeethChartId()
	 * @method \MyWebstor\Hms\Object\Receive[] getReceiveList()
	 * @method \MyWebstor\Hms\Receive\EO_DentReceive_Collection getReceiveCollection()
	 * @method \MyWebstor\Hms\EO_Receive_Collection fillReceive()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart[] getDentTeethChartList()
	 * @method \MyWebstor\Hms\Receive\EO_DentReceive_Collection getDentTeethChartCollection()
	 * @method \MyWebstor\Hms\Dent\EO_TeethChart_Collection fillDentTeethChart()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Object\Receive\DentReceive $object)
	 * @method bool has(\MyWebstor\Hms\Object\Receive\DentReceive $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive getByPrimary($primary)
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Object\Receive\DentReceive $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Receive\EO_DentReceive_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_DentReceive_Collection merge(?EO_DentReceive_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_DentReceive_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Receive\DentReceiveTable */
		static public $dataClass = '\MyWebstor\Hms\Receive\DentReceiveTable';
	}
}
namespace MyWebstor\Hms\Receive {
	/**
	 * @method static EO_DentReceive_Query query()
	 * @method static EO_DentReceive_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_DentReceive_Result getById($id)
	 * @method static EO_DentReceive_Result getList(array $parameters = [])
	 * @method static EO_DentReceive_Entity getEntity()
	 * @method static \MyWebstor\Hms\Object\Receive\DentReceive createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Receive\EO_DentReceive_Collection createCollection()
	 * @method static \MyWebstor\Hms\Object\Receive\DentReceive wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Receive\EO_DentReceive_Collection wakeUpCollection($rows)
	 */
	class DentReceiveTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_DentReceive_Result exec()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive fetchObject()
	 * @method \MyWebstor\Hms\Receive\EO_DentReceive_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_DentReceive_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive fetchObject()
	 * @method \MyWebstor\Hms\Receive\EO_DentReceive_Collection fetchCollection()
	 */
	class EO_DentReceive_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Receive\EO_DentReceive_Collection createCollection()
	 * @method \MyWebstor\Hms\Object\Receive\DentReceive wakeUpObject($row)
	 * @method \MyWebstor\Hms\Receive\EO_DentReceive_Collection wakeUpCollection($rows)
	 */
	class EO_DentReceive_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\SpecializationTable */
namespace MyWebstor\Hms {
	/**
	 * EO_Specialization
	 * @see \MyWebstor\Hms\SpecializationTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\EO_Specialization setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getXmlId()
	 * @method \MyWebstor\Hms\EO_Specialization setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \MyWebstor\Hms\EO_Specialization resetXmlId()
	 * @method \MyWebstor\Hms\EO_Specialization unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \string getTitle()
	 * @method \MyWebstor\Hms\EO_Specialization setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\Hms\EO_Specialization resetTitle()
	 * @method \MyWebstor\Hms\EO_Specialization unsetTitle()
	 * @method \string fillTitle()
	 * @method \string getReceiveType()
	 * @method \MyWebstor\Hms\EO_Specialization setReceiveType(\string|\Bitrix\Main\DB\SqlExpression $receiveType)
	 * @method bool hasReceiveType()
	 * @method bool isReceiveTypeFilled()
	 * @method bool isReceiveTypeChanged()
	 * @method \string remindActualReceiveType()
	 * @method \string requireReceiveType()
	 * @method \MyWebstor\Hms\EO_Specialization resetReceiveType()
	 * @method \MyWebstor\Hms\EO_Specialization unsetReceiveType()
	 * @method \string fillReceiveType()
	 * @method array getServices()
	 * @method \MyWebstor\Hms\EO_Specialization setServices(array|\Bitrix\Main\DB\SqlExpression $services)
	 * @method bool hasServices()
	 * @method bool isServicesFilled()
	 * @method bool isServicesChanged()
	 * @method array remindActualServices()
	 * @method array requireServices()
	 * @method \MyWebstor\Hms\EO_Specialization resetServices()
	 * @method \MyWebstor\Hms\EO_Specialization unsetServices()
	 * @method array fillServices()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\EO_Specialization set($fieldName, $value)
	 * @method \MyWebstor\Hms\EO_Specialization reset($fieldName)
	 * @method \MyWebstor\Hms\EO_Specialization unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\EO_Specialization wakeUp($data)
	 */
	class EO_Specialization {
		/* @var \MyWebstor\Hms\SpecializationTable */
		static public $dataClass = '\MyWebstor\Hms\SpecializationTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms {
	/**
	 * EO_Specialization_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \string[] getReceiveTypeList()
	 * @method \string[] fillReceiveType()
	 * @method array[] getServicesList()
	 * @method array[] fillServices()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\EO_Specialization $object)
	 * @method bool has(\MyWebstor\Hms\EO_Specialization $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Specialization getByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Specialization[] getAll()
	 * @method bool remove(\MyWebstor\Hms\EO_Specialization $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\EO_Specialization_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\EO_Specialization current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Specialization_Collection merge(?EO_Specialization_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Specialization_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\SpecializationTable */
		static public $dataClass = '\MyWebstor\Hms\SpecializationTable';
	}
}
namespace MyWebstor\Hms {
	/**
	 * @method static EO_Specialization_Query query()
	 * @method static EO_Specialization_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Specialization_Result getById($id)
	 * @method static EO_Specialization_Result getList(array $parameters = [])
	 * @method static EO_Specialization_Entity getEntity()
	 * @method static \MyWebstor\Hms\EO_Specialization createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\EO_Specialization_Collection createCollection()
	 * @method static \MyWebstor\Hms\EO_Specialization wakeUpObject($row)
	 * @method static \MyWebstor\Hms\EO_Specialization_Collection wakeUpCollection($rows)
	 */
	class SpecializationTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Specialization_Result exec()
	 * @method \MyWebstor\Hms\EO_Specialization fetchObject()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Specialization_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\EO_Specialization fetchObject()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection fetchCollection()
	 */
	class EO_Specialization_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\EO_Specialization createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\EO_Specialization_Collection createCollection()
	 * @method \MyWebstor\Hms\EO_Specialization wakeUpObject($row)
	 * @method \MyWebstor\Hms\EO_Specialization_Collection wakeUpCollection($rows)
	 */
	class EO_Specialization_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\VhiTable */
namespace MyWebstor\Hms {
	/**
	 * EO_Vhi
	 * @see \MyWebstor\Hms\VhiTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\EO_Vhi setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getXmlId()
	 * @method \MyWebstor\Hms\EO_Vhi setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \MyWebstor\Hms\EO_Vhi resetXmlId()
	 * @method \MyWebstor\Hms\EO_Vhi unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \int getContactId()
	 * @method \MyWebstor\Hms\EO_Vhi setContactId(\int|\Bitrix\Main\DB\SqlExpression $contactId)
	 * @method bool hasContactId()
	 * @method bool isContactIdFilled()
	 * @method bool isContactIdChanged()
	 * @method \int remindActualContactId()
	 * @method \int requireContactId()
	 * @method \MyWebstor\Hms\EO_Vhi resetContactId()
	 * @method \MyWebstor\Hms\EO_Vhi unsetContactId()
	 * @method \int fillContactId()
	 * @method \int getVhiStorageId()
	 * @method \MyWebstor\Hms\EO_Vhi setVhiStorageId(\int|\Bitrix\Main\DB\SqlExpression $vhiStorageId)
	 * @method bool hasVhiStorageId()
	 * @method bool isVhiStorageIdFilled()
	 * @method bool isVhiStorageIdChanged()
	 * @method \int remindActualVhiStorageId()
	 * @method \int requireVhiStorageId()
	 * @method \MyWebstor\Hms\EO_Vhi resetVhiStorageId()
	 * @method \MyWebstor\Hms\EO_Vhi unsetVhiStorageId()
	 * @method \int fillVhiStorageId()
	 * @method \int getVhiTypeId()
	 * @method \MyWebstor\Hms\EO_Vhi setVhiTypeId(\int|\Bitrix\Main\DB\SqlExpression $vhiTypeId)
	 * @method bool hasVhiTypeId()
	 * @method bool isVhiTypeIdFilled()
	 * @method bool isVhiTypeIdChanged()
	 * @method \int remindActualVhiTypeId()
	 * @method \int requireVhiTypeId()
	 * @method \MyWebstor\Hms\EO_Vhi resetVhiTypeId()
	 * @method \MyWebstor\Hms\EO_Vhi unsetVhiTypeId()
	 * @method \int fillVhiTypeId()
	 * @method \boolean getActive()
	 * @method \MyWebstor\Hms\EO_Vhi setActive(\boolean|\Bitrix\Main\DB\SqlExpression $active)
	 * @method bool hasActive()
	 * @method bool isActiveFilled()
	 * @method bool isActiveChanged()
	 * @method \boolean remindActualActive()
	 * @method \boolean requireActive()
	 * @method \MyWebstor\Hms\EO_Vhi resetActive()
	 * @method \MyWebstor\Hms\EO_Vhi unsetActive()
	 * @method \boolean fillActive()
	 * @method \string getNumber()
	 * @method \MyWebstor\Hms\EO_Vhi setNumber(\string|\Bitrix\Main\DB\SqlExpression $number)
	 * @method bool hasNumber()
	 * @method bool isNumberFilled()
	 * @method bool isNumberChanged()
	 * @method \string remindActualNumber()
	 * @method \string requireNumber()
	 * @method \MyWebstor\Hms\EO_Vhi resetNumber()
	 * @method \MyWebstor\Hms\EO_Vhi unsetNumber()
	 * @method \string fillNumber()
	 * @method \Bitrix\Main\Type\Date getDateStart()
	 * @method \MyWebstor\Hms\EO_Vhi setDateStart(\Bitrix\Main\Type\Date|\Bitrix\Main\DB\SqlExpression $dateStart)
	 * @method bool hasDateStart()
	 * @method bool isDateStartFilled()
	 * @method bool isDateStartChanged()
	 * @method \Bitrix\Main\Type\Date remindActualDateStart()
	 * @method \Bitrix\Main\Type\Date requireDateStart()
	 * @method \MyWebstor\Hms\EO_Vhi resetDateStart()
	 * @method \MyWebstor\Hms\EO_Vhi unsetDateStart()
	 * @method \Bitrix\Main\Type\Date fillDateStart()
	 * @method \Bitrix\Main\Type\Date getDateEnd()
	 * @method \MyWebstor\Hms\EO_Vhi setDateEnd(\Bitrix\Main\Type\Date|\Bitrix\Main\DB\SqlExpression $dateEnd)
	 * @method bool hasDateEnd()
	 * @method bool isDateEndFilled()
	 * @method bool isDateEndChanged()
	 * @method \Bitrix\Main\Type\Date remindActualDateEnd()
	 * @method \Bitrix\Main\Type\Date requireDateEnd()
	 * @method \MyWebstor\Hms\EO_Vhi resetDateEnd()
	 * @method \MyWebstor\Hms\EO_Vhi unsetDateEnd()
	 * @method \Bitrix\Main\Type\Date fillDateEnd()
	 * @method \boolean getIsActive()
	 * @method \boolean remindActualIsActive()
	 * @method \boolean requireIsActive()
	 * @method bool hasIsActive()
	 * @method bool isIsActiveFilled()
	 * @method \MyWebstor\Hms\EO_Vhi unsetIsActive()
	 * @method \boolean fillIsActive()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage getVhiStorage()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage remindActualVhiStorage()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage requireVhiStorage()
	 * @method \MyWebstor\Hms\EO_Vhi setVhiStorage(\MyWebstor\Hms\Vhi\EO_VhiStorage $object)
	 * @method \MyWebstor\Hms\EO_Vhi resetVhiStorage()
	 * @method \MyWebstor\Hms\EO_Vhi unsetVhiStorage()
	 * @method bool hasVhiStorage()
	 * @method bool isVhiStorageFilled()
	 * @method bool isVhiStorageChanged()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage fillVhiStorage()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType getVhiType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType remindActualVhiType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType requireVhiType()
	 * @method \MyWebstor\Hms\EO_Vhi setVhiType(\MyWebstor\Hms\Vhi\EO_VhiType $object)
	 * @method \MyWebstor\Hms\EO_Vhi resetVhiType()
	 * @method \MyWebstor\Hms\EO_Vhi unsetVhiType()
	 * @method bool hasVhiType()
	 * @method bool isVhiTypeFilled()
	 * @method bool isVhiTypeChanged()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType fillVhiType()
	 * @method \Bitrix\Crm\Contact getContact()
	 * @method \Bitrix\Crm\Contact remindActualContact()
	 * @method \Bitrix\Crm\Contact requireContact()
	 * @method \MyWebstor\Hms\EO_Vhi setContact(\Bitrix\Crm\Contact $object)
	 * @method \MyWebstor\Hms\EO_Vhi resetContact()
	 * @method \MyWebstor\Hms\EO_Vhi unsetContact()
	 * @method bool hasContact()
	 * @method bool isContactFilled()
	 * @method bool isContactChanged()
	 * @method \Bitrix\Crm\Contact fillContact()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\EO_Vhi set($fieldName, $value)
	 * @method \MyWebstor\Hms\EO_Vhi reset($fieldName)
	 * @method \MyWebstor\Hms\EO_Vhi unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\EO_Vhi wakeUp($data)
	 */
	class EO_Vhi {
		/* @var \MyWebstor\Hms\VhiTable */
		static public $dataClass = '\MyWebstor\Hms\VhiTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms {
	/**
	 * EO_Vhi_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \int[] getContactIdList()
	 * @method \int[] fillContactId()
	 * @method \int[] getVhiStorageIdList()
	 * @method \int[] fillVhiStorageId()
	 * @method \int[] getVhiTypeIdList()
	 * @method \int[] fillVhiTypeId()
	 * @method \boolean[] getActiveList()
	 * @method \boolean[] fillActive()
	 * @method \string[] getNumberList()
	 * @method \string[] fillNumber()
	 * @method \Bitrix\Main\Type\Date[] getDateStartList()
	 * @method \Bitrix\Main\Type\Date[] fillDateStart()
	 * @method \Bitrix\Main\Type\Date[] getDateEndList()
	 * @method \Bitrix\Main\Type\Date[] fillDateEnd()
	 * @method \boolean[] getIsActiveList()
	 * @method \boolean[] fillIsActive()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage[] getVhiStorageList()
	 * @method \MyWebstor\Hms\EO_Vhi_Collection getVhiStorageCollection()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiStorage_Collection fillVhiStorage()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType[] getVhiTypeList()
	 * @method \MyWebstor\Hms\EO_Vhi_Collection getVhiTypeCollection()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType_Collection fillVhiType()
	 * @method \Bitrix\Crm\Contact[] getContactList()
	 * @method \MyWebstor\Hms\EO_Vhi_Collection getContactCollection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillContact()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\EO_Vhi $object)
	 * @method bool has(\MyWebstor\Hms\EO_Vhi $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Vhi getByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Vhi[] getAll()
	 * @method bool remove(\MyWebstor\Hms\EO_Vhi $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\EO_Vhi_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\EO_Vhi current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Vhi_Collection merge(?EO_Vhi_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Vhi_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\VhiTable */
		static public $dataClass = '\MyWebstor\Hms\VhiTable';
	}
}
namespace MyWebstor\Hms {
	/**
	 * @method static EO_Vhi_Query query()
	 * @method static EO_Vhi_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Vhi_Result getById($id)
	 * @method static EO_Vhi_Result getList(array $parameters = [])
	 * @method static EO_Vhi_Entity getEntity()
	 * @method static \MyWebstor\Hms\EO_Vhi createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\EO_Vhi_Collection createCollection()
	 * @method static \MyWebstor\Hms\EO_Vhi wakeUpObject($row)
	 * @method static \MyWebstor\Hms\EO_Vhi_Collection wakeUpCollection($rows)
	 */
	class VhiTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Vhi_Result exec()
	 * @method \MyWebstor\Hms\EO_Vhi fetchObject()
	 * @method \MyWebstor\Hms\EO_Vhi_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Vhi_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\EO_Vhi fetchObject()
	 * @method \MyWebstor\Hms\EO_Vhi_Collection fetchCollection()
	 */
	class EO_Vhi_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\EO_Vhi createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\EO_Vhi_Collection createCollection()
	 * @method \MyWebstor\Hms\EO_Vhi wakeUpObject($row)
	 * @method \MyWebstor\Hms\EO_Vhi_Collection wakeUpCollection($rows)
	 */
	class EO_Vhi_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Schedule\WorktimeTable */
namespace MyWebstor\Hms\Schedule {
	/**
	 * EO_Worktime
	 * @see \MyWebstor\Hms\Schedule\WorktimeTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getScheduleId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setScheduleId(\int|\Bitrix\Main\DB\SqlExpression $scheduleId)
	 * @method bool hasScheduleId()
	 * @method bool isScheduleIdFilled()
	 * @method bool isScheduleIdChanged()
	 * @method \int remindActualScheduleId()
	 * @method \int requireScheduleId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetScheduleId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetScheduleId()
	 * @method \int fillScheduleId()
	 * @method \int getDoctorId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setDoctorId(\int|\Bitrix\Main\DB\SqlExpression $doctorId)
	 * @method bool hasDoctorId()
	 * @method bool isDoctorIdFilled()
	 * @method bool isDoctorIdChanged()
	 * @method \int remindActualDoctorId()
	 * @method \int requireDoctorId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetDoctorId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetDoctorId()
	 * @method \int fillDoctorId()
	 * @method \int getOfficeId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setOfficeId(\int|\Bitrix\Main\DB\SqlExpression $officeId)
	 * @method bool hasOfficeId()
	 * @method bool isOfficeIdFilled()
	 * @method bool isOfficeIdChanged()
	 * @method \int remindActualOfficeId()
	 * @method \int requireOfficeId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetOfficeId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetOfficeId()
	 * @method \int fillOfficeId()
	 * @method \Bitrix\Main\Type\DateTime getWorktimeFrom()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setWorktimeFrom(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $worktimeFrom)
	 * @method bool hasWorktimeFrom()
	 * @method bool isWorktimeFromFilled()
	 * @method bool isWorktimeFromChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualWorktimeFrom()
	 * @method \Bitrix\Main\Type\DateTime requireWorktimeFrom()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetWorktimeFrom()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetWorktimeFrom()
	 * @method \Bitrix\Main\Type\DateTime fillWorktimeFrom()
	 * @method \Bitrix\Main\Type\DateTime getWorktimeTo()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setWorktimeTo(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $worktimeTo)
	 * @method bool hasWorktimeTo()
	 * @method bool isWorktimeToFilled()
	 * @method bool isWorktimeToChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualWorktimeTo()
	 * @method \Bitrix\Main\Type\DateTime requireWorktimeTo()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetWorktimeTo()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetWorktimeTo()
	 * @method \Bitrix\Main\Type\DateTime fillWorktimeTo()
	 * @method \string getColor()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setColor(\string|\Bitrix\Main\DB\SqlExpression $color)
	 * @method bool hasColor()
	 * @method bool isColorFilled()
	 * @method bool isColorChanged()
	 * @method \string remindActualColor()
	 * @method \string requireColor()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetColor()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetColor()
	 * @method \string fillColor()
	 * @method \string getDescription()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setDescription(\string|\Bitrix\Main\DB\SqlExpression $description)
	 * @method bool hasDescription()
	 * @method bool isDescriptionFilled()
	 * @method bool isDescriptionChanged()
	 * @method \string remindActualDescription()
	 * @method \string requireDescription()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetDescription()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetDescription()
	 * @method \string fillDescription()
	 * @method array getBreaks()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setBreaks(array|\Bitrix\Main\DB\SqlExpression $breaks)
	 * @method bool hasBreaks()
	 * @method bool isBreaksFilled()
	 * @method bool isBreaksChanged()
	 * @method array remindActualBreaks()
	 * @method array requireBreaks()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetBreaks()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetBreaks()
	 * @method array fillBreaks()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule getSchedule()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule remindActualSchedule()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule requireSchedule()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setSchedule(\MyWebstor\Hms\Schedule\EO_Schedule $object)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetSchedule()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetSchedule()
	 * @method bool hasSchedule()
	 * @method bool isScheduleFilled()
	 * @method bool isScheduleChanged()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule fillSchedule()
	 * @method \MyWebstor\Hms\EO_Doctor getDoctor()
	 * @method \MyWebstor\Hms\EO_Doctor remindActualDoctor()
	 * @method \MyWebstor\Hms\EO_Doctor requireDoctor()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setDoctor(\MyWebstor\Hms\EO_Doctor $object)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetDoctor()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetDoctor()
	 * @method bool hasDoctor()
	 * @method bool isDoctorFilled()
	 * @method bool isDoctorChanged()
	 * @method \MyWebstor\Hms\EO_Doctor fillDoctor()
	 * @method \MyWebstor\Hms\EO_Office getOffice()
	 * @method \MyWebstor\Hms\EO_Office remindActualOffice()
	 * @method \MyWebstor\Hms\EO_Office requireOffice()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setOffice(\MyWebstor\Hms\EO_Office $object)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetOffice()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetOffice()
	 * @method bool hasOffice()
	 * @method bool isOfficeFilled()
	 * @method bool isOfficeChanged()
	 * @method \MyWebstor\Hms\EO_Office fillOffice()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime set($fieldName, $value)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime reset($fieldName)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Schedule\EO_Worktime wakeUp($data)
	 */
	class EO_Worktime {
		/* @var \MyWebstor\Hms\Schedule\WorktimeTable */
		static public $dataClass = '\MyWebstor\Hms\Schedule\WorktimeTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Schedule {
	/**
	 * EO_Worktime_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getScheduleIdList()
	 * @method \int[] fillScheduleId()
	 * @method \int[] getDoctorIdList()
	 * @method \int[] fillDoctorId()
	 * @method \int[] getOfficeIdList()
	 * @method \int[] fillOfficeId()
	 * @method \Bitrix\Main\Type\DateTime[] getWorktimeFromList()
	 * @method \Bitrix\Main\Type\DateTime[] fillWorktimeFrom()
	 * @method \Bitrix\Main\Type\DateTime[] getWorktimeToList()
	 * @method \Bitrix\Main\Type\DateTime[] fillWorktimeTo()
	 * @method \string[] getColorList()
	 * @method \string[] fillColor()
	 * @method \string[] getDescriptionList()
	 * @method \string[] fillDescription()
	 * @method array[] getBreaksList()
	 * @method array[] fillBreaks()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule[] getScheduleList()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection getScheduleCollection()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection fillSchedule()
	 * @method \MyWebstor\Hms\EO_Doctor[] getDoctorList()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection getDoctorCollection()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection fillDoctor()
	 * @method \MyWebstor\Hms\EO_Office[] getOfficeList()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection getOfficeCollection()
	 * @method \MyWebstor\Hms\EO_Office_Collection fillOffice()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Schedule\EO_Worktime $object)
	 * @method bool has(\MyWebstor\Hms\Schedule\EO_Worktime $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime getByPrimary($primary)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Schedule\EO_Worktime $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Schedule\EO_Worktime_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Worktime_Collection merge(?EO_Worktime_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Worktime_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Schedule\WorktimeTable */
		static public $dataClass = '\MyWebstor\Hms\Schedule\WorktimeTable';
	}
}
namespace MyWebstor\Hms\Schedule {
	/**
	 * @method static EO_Worktime_Query query()
	 * @method static EO_Worktime_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Worktime_Result getById($id)
	 * @method static EO_Worktime_Result getList(array $parameters = [])
	 * @method static EO_Worktime_Entity getEntity()
	 * @method static \MyWebstor\Hms\Schedule\EO_Worktime createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Schedule\EO_Worktime_Collection createCollection()
	 * @method static \MyWebstor\Hms\Schedule\EO_Worktime wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Schedule\EO_Worktime_Collection wakeUpCollection($rows)
	 */
	class WorktimeTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Worktime_Result exec()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime fetchObject()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Worktime_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime fetchObject()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection fetchCollection()
	 */
	class EO_Worktime_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection createCollection()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime wakeUpObject($row)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection wakeUpCollection($rows)
	 */
	class EO_Worktime_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Schedule\ScheduleTable */
namespace MyWebstor\Hms\Schedule {
	/**
	 * EO_Schedule
	 * @see \MyWebstor\Hms\Schedule\ScheduleTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getXmlId()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetXmlId()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \boolean getActive()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setActive(\boolean|\Bitrix\Main\DB\SqlExpression $active)
	 * @method bool hasActive()
	 * @method bool isActiveFilled()
	 * @method bool isActiveChanged()
	 * @method \boolean remindActualActive()
	 * @method \boolean requireActive()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetActive()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetActive()
	 * @method \boolean fillActive()
	 * @method \int getClinicId()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setClinicId(\int|\Bitrix\Main\DB\SqlExpression $clinicId)
	 * @method bool hasClinicId()
	 * @method bool isClinicIdFilled()
	 * @method bool isClinicIdChanged()
	 * @method \int remindActualClinicId()
	 * @method \int requireClinicId()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetClinicId()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetClinicId()
	 * @method \int fillClinicId()
	 * @method \string getMode()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setMode(\string|\Bitrix\Main\DB\SqlExpression $mode)
	 * @method bool hasMode()
	 * @method bool isModeFilled()
	 * @method bool isModeChanged()
	 * @method \string remindActualMode()
	 * @method \string requireMode()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetMode()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetMode()
	 * @method \string fillMode()
	 * @method \Bitrix\Main\Type\DateTime getDateCreate()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setDateCreate(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateCreate)
	 * @method bool hasDateCreate()
	 * @method bool isDateCreateFilled()
	 * @method bool isDateCreateChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateCreate()
	 * @method \Bitrix\Main\Type\DateTime requireDateCreate()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetDateCreate()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetDateCreate()
	 * @method \Bitrix\Main\Type\DateTime fillDateCreate()
	 * @method array getParticipants()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setParticipants(array|\Bitrix\Main\DB\SqlExpression $participants)
	 * @method bool hasParticipants()
	 * @method bool isParticipantsFilled()
	 * @method bool isParticipantsChanged()
	 * @method array remindActualParticipants()
	 * @method array requireParticipants()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetParticipants()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetParticipants()
	 * @method array fillParticipants()
	 * @method \Bitrix\Main\Type\Date getPlanDate()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setPlanDate(\Bitrix\Main\Type\Date|\Bitrix\Main\DB\SqlExpression $planDate)
	 * @method bool hasPlanDate()
	 * @method bool isPlanDateFilled()
	 * @method bool isPlanDateChanged()
	 * @method \Bitrix\Main\Type\Date remindActualPlanDate()
	 * @method \Bitrix\Main\Type\Date requirePlanDate()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetPlanDate()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetPlanDate()
	 * @method \Bitrix\Main\Type\Date fillPlanDate()
	 * @method \string getNumber()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setNumber(\string|\Bitrix\Main\DB\SqlExpression $number)
	 * @method bool hasNumber()
	 * @method bool isNumberFilled()
	 * @method bool isNumberChanged()
	 * @method \string remindActualNumber()
	 * @method \string requireNumber()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetNumber()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetNumber()
	 * @method \string fillNumber()
	 * @method \int getAssignedById()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setAssignedById(\int|\Bitrix\Main\DB\SqlExpression $assignedById)
	 * @method bool hasAssignedById()
	 * @method bool isAssignedByIdFilled()
	 * @method bool isAssignedByIdChanged()
	 * @method \int remindActualAssignedById()
	 * @method \int requireAssignedById()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetAssignedById()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetAssignedById()
	 * @method \int fillAssignedById()
	 * @method \string getComment()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setComment(\string|\Bitrix\Main\DB\SqlExpression $comment)
	 * @method bool hasComment()
	 * @method bool isCommentFilled()
	 * @method bool isCommentChanged()
	 * @method \string remindActualComment()
	 * @method \string requireComment()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetComment()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetComment()
	 * @method \string fillComment()
	 * @method \MyWebstor\Hms\EO_Clinic getClinic()
	 * @method \MyWebstor\Hms\EO_Clinic remindActualClinic()
	 * @method \MyWebstor\Hms\EO_Clinic requireClinic()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setClinic(\MyWebstor\Hms\EO_Clinic $object)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetClinic()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetClinic()
	 * @method bool hasClinic()
	 * @method bool isClinicFilled()
	 * @method bool isClinicChanged()
	 * @method \MyWebstor\Hms\EO_Clinic fillClinic()
	 * @method \Bitrix\Main\EO_User getAssignedBy()
	 * @method \Bitrix\Main\EO_User remindActualAssignedBy()
	 * @method \Bitrix\Main\EO_User requireAssignedBy()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setAssignedBy(\Bitrix\Main\EO_User $object)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetAssignedBy()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetAssignedBy()
	 * @method bool hasAssignedBy()
	 * @method bool isAssignedByFilled()
	 * @method bool isAssignedByChanged()
	 * @method \Bitrix\Main\EO_User fillAssignedBy()
	 * @method \string getAssignedByFullName()
	 * @method \string remindActualAssignedByFullName()
	 * @method \string requireAssignedByFullName()
	 * @method bool hasAssignedByFullName()
	 * @method bool isAssignedByFullNameFilled()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetAssignedByFullName()
	 * @method \string fillAssignedByFullName()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection getWorktime()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection requireWorktime()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection fillWorktime()
	 * @method bool hasWorktime()
	 * @method bool isWorktimeFilled()
	 * @method bool isWorktimeChanged()
	 * @method void addToWorktime(\MyWebstor\Hms\Schedule\EO_Worktime $worktime)
	 * @method void removeFromWorktime(\MyWebstor\Hms\Schedule\EO_Worktime $worktime)
	 * @method void removeAllWorktime()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetWorktime()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetWorktime()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule set($fieldName, $value)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule reset($fieldName)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Schedule\EO_Schedule wakeUp($data)
	 */
	class EO_Schedule {
		/* @var \MyWebstor\Hms\Schedule\ScheduleTable */
		static public $dataClass = '\MyWebstor\Hms\Schedule\ScheduleTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Schedule {
	/**
	 * EO_Schedule_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \boolean[] getActiveList()
	 * @method \boolean[] fillActive()
	 * @method \int[] getClinicIdList()
	 * @method \int[] fillClinicId()
	 * @method \string[] getModeList()
	 * @method \string[] fillMode()
	 * @method \Bitrix\Main\Type\DateTime[] getDateCreateList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateCreate()
	 * @method array[] getParticipantsList()
	 * @method array[] fillParticipants()
	 * @method \Bitrix\Main\Type\Date[] getPlanDateList()
	 * @method \Bitrix\Main\Type\Date[] fillPlanDate()
	 * @method \string[] getNumberList()
	 * @method \string[] fillNumber()
	 * @method \int[] getAssignedByIdList()
	 * @method \int[] fillAssignedById()
	 * @method \string[] getCommentList()
	 * @method \string[] fillComment()
	 * @method \MyWebstor\Hms\EO_Clinic[] getClinicList()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection getClinicCollection()
	 * @method \MyWebstor\Hms\EO_Clinic_Collection fillClinic()
	 * @method \Bitrix\Main\EO_User[] getAssignedByList()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection getAssignedByCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillAssignedBy()
	 * @method \string[] getAssignedByFullNameList()
	 * @method \string[] fillAssignedByFullName()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection[] getWorktimeList()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection getWorktimeCollection()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection fillWorktime()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Schedule\EO_Schedule $object)
	 * @method bool has(\MyWebstor\Hms\Schedule\EO_Schedule $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule getByPrimary($primary)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Schedule\EO_Schedule $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Schedule\EO_Schedule_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Schedule_Collection merge(?EO_Schedule_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Schedule_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Schedule\ScheduleTable */
		static public $dataClass = '\MyWebstor\Hms\Schedule\ScheduleTable';
	}
}
namespace MyWebstor\Hms\Schedule {
	/**
	 * @method static EO_Schedule_Query query()
	 * @method static EO_Schedule_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Schedule_Result getById($id)
	 * @method static EO_Schedule_Result getList(array $parameters = [])
	 * @method static EO_Schedule_Entity getEntity()
	 * @method static \MyWebstor\Hms\Schedule\EO_Schedule createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Schedule\EO_Schedule_Collection createCollection()
	 * @method static \MyWebstor\Hms\Schedule\EO_Schedule wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Schedule\EO_Schedule_Collection wakeUpCollection($rows)
	 */
	class ScheduleTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Schedule_Result exec()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule fetchObject()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Schedule_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule fetchObject()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection fetchCollection()
	 */
	class EO_Schedule_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection createCollection()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule wakeUpObject($row)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection wakeUpCollection($rows)
	 */
	class EO_Schedule_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Schedule\FillingMethodTable */
namespace MyWebstor\Hms\Schedule {
	/**
	 * EO_FillingMethod
	 * @see \MyWebstor\Hms\Schedule\FillingMethodTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getTitle()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod resetTitle()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod unsetTitle()
	 * @method \string fillTitle()
	 * @method \string getType()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod setType(\string|\Bitrix\Main\DB\SqlExpression $type)
	 * @method bool hasType()
	 * @method bool isTypeFilled()
	 * @method bool isTypeChanged()
	 * @method \string remindActualType()
	 * @method \string requireType()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod resetType()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod unsetType()
	 * @method \string fillType()
	 * @method array getSegments()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod setSegments(array|\Bitrix\Main\DB\SqlExpression $segments)
	 * @method bool hasSegments()
	 * @method bool isSegmentsFilled()
	 * @method bool isSegmentsChanged()
	 * @method array remindActualSegments()
	 * @method array requireSegments()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod resetSegments()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod unsetSegments()
	 * @method array fillSegments()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod set($fieldName, $value)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod reset($fieldName)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Schedule\EO_FillingMethod wakeUp($data)
	 */
	class EO_FillingMethod {
		/* @var \MyWebstor\Hms\Schedule\FillingMethodTable */
		static public $dataClass = '\MyWebstor\Hms\Schedule\FillingMethodTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Schedule {
	/**
	 * EO_FillingMethod_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \string[] getTypeList()
	 * @method \string[] fillType()
	 * @method array[] getSegmentsList()
	 * @method array[] fillSegments()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Schedule\EO_FillingMethod $object)
	 * @method bool has(\MyWebstor\Hms\Schedule\EO_FillingMethod $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod getByPrimary($primary)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Schedule\EO_FillingMethod $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_FillingMethod_Collection merge(?EO_FillingMethod_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_FillingMethod_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Schedule\FillingMethodTable */
		static public $dataClass = '\MyWebstor\Hms\Schedule\FillingMethodTable';
	}
}
namespace MyWebstor\Hms\Schedule {
	/**
	 * @method static EO_FillingMethod_Query query()
	 * @method static EO_FillingMethod_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_FillingMethod_Result getById($id)
	 * @method static EO_FillingMethod_Result getList(array $parameters = [])
	 * @method static EO_FillingMethod_Entity getEntity()
	 * @method static \MyWebstor\Hms\Schedule\EO_FillingMethod createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection createCollection()
	 * @method static \MyWebstor\Hms\Schedule\EO_FillingMethod wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection wakeUpCollection($rows)
	 */
	class FillingMethodTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_FillingMethod_Result exec()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod fetchObject()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_FillingMethod_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod fetchObject()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection fetchCollection()
	 */
	class EO_FillingMethod_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection createCollection()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod wakeUpObject($row)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection wakeUpCollection($rows)
	 */
	class EO_FillingMethod_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\HMS\Schedule\ShiftWorkTable */
namespace MyWebstor\HMS\Schedule {
	/**
	 * EO_ShiftWork
	 * @see \MyWebstor\HMS\Schedule\ShiftWorkTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getTitle()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork resetTitle()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork unsetTitle()
	 * @method \string fillTitle()
	 * @method array getWorktimes()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork setWorktimes(array|\Bitrix\Main\DB\SqlExpression $worktimes)
	 * @method bool hasWorktimes()
	 * @method bool isWorktimesFilled()
	 * @method bool isWorktimesChanged()
	 * @method array remindActualWorktimes()
	 * @method array requireWorktimes()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork resetWorktimes()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork unsetWorktimes()
	 * @method array fillWorktimes()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork set($fieldName, $value)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork reset($fieldName)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\HMS\Schedule\EO_ShiftWork wakeUp($data)
	 */
	class EO_ShiftWork {
		/* @var \MyWebstor\HMS\Schedule\ShiftWorkTable */
		static public $dataClass = '\MyWebstor\HMS\Schedule\ShiftWorkTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\HMS\Schedule {
	/**
	 * EO_ShiftWork_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method array[] getWorktimesList()
	 * @method array[] fillWorktimes()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\HMS\Schedule\EO_ShiftWork $object)
	 * @method bool has(\MyWebstor\HMS\Schedule\EO_ShiftWork $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork getByPrimary($primary)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork[] getAll()
	 * @method bool remove(\MyWebstor\HMS\Schedule\EO_ShiftWork $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_ShiftWork_Collection merge(?EO_ShiftWork_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_ShiftWork_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\HMS\Schedule\ShiftWorkTable */
		static public $dataClass = '\MyWebstor\HMS\Schedule\ShiftWorkTable';
	}
}
namespace MyWebstor\HMS\Schedule {
	/**
	 * @method static EO_ShiftWork_Query query()
	 * @method static EO_ShiftWork_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_ShiftWork_Result getById($id)
	 * @method static EO_ShiftWork_Result getList(array $parameters = [])
	 * @method static EO_ShiftWork_Entity getEntity()
	 * @method static \MyWebstor\HMS\Schedule\EO_ShiftWork createObject($setDefaultValues = true)
	 * @method static \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection createCollection()
	 * @method static \MyWebstor\HMS\Schedule\EO_ShiftWork wakeUpObject($row)
	 * @method static \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection wakeUpCollection($rows)
	 */
	class ShiftWorkTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_ShiftWork_Result exec()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork fetchObject()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_ShiftWork_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork fetchObject()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection fetchCollection()
	 */
	class EO_ShiftWork_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork createObject($setDefaultValues = true)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection createCollection()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork wakeUpObject($row)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection wakeUpCollection($rows)
	 */
	class EO_ShiftWork_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\ProductRowTable */
namespace MyWebstor\Hms {
	/**
	 * EO_ProductRow
	 * @see \MyWebstor\Hms\ProductRowTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\EO_ProductRow setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \boolean getIsVhi()
	 * @method \MyWebstor\Hms\EO_ProductRow setIsVhi(\boolean|\Bitrix\Main\DB\SqlExpression $isVhi)
	 * @method bool hasIsVhi()
	 * @method bool isIsVhiFilled()
	 * @method bool isIsVhiChanged()
	 * @method \boolean remindActualIsVhi()
	 * @method \boolean requireIsVhi()
	 * @method \MyWebstor\Hms\EO_ProductRow resetIsVhi()
	 * @method \MyWebstor\Hms\EO_ProductRow unsetIsVhi()
	 * @method \boolean fillIsVhi()
	 * @method array getTeeth()
	 * @method \MyWebstor\Hms\EO_ProductRow setTeeth(array|\Bitrix\Main\DB\SqlExpression $teeth)
	 * @method bool hasTeeth()
	 * @method bool isTeethFilled()
	 * @method bool isTeethChanged()
	 * @method array remindActualTeeth()
	 * @method array requireTeeth()
	 * @method \MyWebstor\Hms\EO_ProductRow resetTeeth()
	 * @method \MyWebstor\Hms\EO_ProductRow unsetTeeth()
	 * @method array fillTeeth()
	 * @method \Bitrix\Crm\ProductRow getProductRow()
	 * @method \Bitrix\Crm\ProductRow remindActualProductRow()
	 * @method \Bitrix\Crm\ProductRow requireProductRow()
	 * @method \MyWebstor\Hms\EO_ProductRow setProductRow(\Bitrix\Crm\ProductRow $object)
	 * @method \MyWebstor\Hms\EO_ProductRow resetProductRow()
	 * @method \MyWebstor\Hms\EO_ProductRow unsetProductRow()
	 * @method bool hasProductRow()
	 * @method bool isProductRowFilled()
	 * @method bool isProductRowChanged()
	 * @method \Bitrix\Crm\ProductRow fillProductRow()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\EO_ProductRow set($fieldName, $value)
	 * @method \MyWebstor\Hms\EO_ProductRow reset($fieldName)
	 * @method \MyWebstor\Hms\EO_ProductRow unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\EO_ProductRow wakeUp($data)
	 */
	class EO_ProductRow {
		/* @var \MyWebstor\Hms\ProductRowTable */
		static public $dataClass = '\MyWebstor\Hms\ProductRowTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms {
	/**
	 * EO_ProductRow_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \boolean[] getIsVhiList()
	 * @method \boolean[] fillIsVhi()
	 * @method array[] getTeethList()
	 * @method array[] fillTeeth()
	 * @method \Bitrix\Crm\ProductRow[] getProductRowList()
	 * @method \MyWebstor\Hms\EO_ProductRow_Collection getProductRowCollection()
	 * @method \Bitrix\Crm\ProductRowCollection fillProductRow()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\EO_ProductRow $object)
	 * @method bool has(\MyWebstor\Hms\EO_ProductRow $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_ProductRow getByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_ProductRow[] getAll()
	 * @method bool remove(\MyWebstor\Hms\EO_ProductRow $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\EO_ProductRow_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\EO_ProductRow current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_ProductRow_Collection merge(?EO_ProductRow_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_ProductRow_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\ProductRowTable */
		static public $dataClass = '\MyWebstor\Hms\ProductRowTable';
	}
}
namespace MyWebstor\Hms {
	/**
	 * @method static EO_ProductRow_Query query()
	 * @method static EO_ProductRow_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_ProductRow_Result getById($id)
	 * @method static EO_ProductRow_Result getList(array $parameters = [])
	 * @method static EO_ProductRow_Entity getEntity()
	 * @method static \MyWebstor\Hms\EO_ProductRow createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\EO_ProductRow_Collection createCollection()
	 * @method static \MyWebstor\Hms\EO_ProductRow wakeUpObject($row)
	 * @method static \MyWebstor\Hms\EO_ProductRow_Collection wakeUpCollection($rows)
	 */
	class ProductRowTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_ProductRow_Result exec()
	 * @method \MyWebstor\Hms\EO_ProductRow fetchObject()
	 * @method \MyWebstor\Hms\EO_ProductRow_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_ProductRow_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\EO_ProductRow fetchObject()
	 * @method \MyWebstor\Hms\EO_ProductRow_Collection fetchCollection()
	 */
	class EO_ProductRow_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\EO_ProductRow createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\EO_ProductRow_Collection createCollection()
	 * @method \MyWebstor\Hms\EO_ProductRow wakeUpObject($row)
	 * @method \MyWebstor\Hms\EO_ProductRow_Collection wakeUpCollection($rows)
	 */
	class EO_ProductRow_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Binding\AppointmentContactTable */
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentContact
	 * @see \MyWebstor\Hms\Binding\AppointmentContactTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getAppointmentId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact setAppointmentId(\int|\Bitrix\Main\DB\SqlExpression $appointmentId)
	 * @method bool hasAppointmentId()
	 * @method bool isAppointmentIdFilled()
	 * @method bool isAppointmentIdChanged()
	 * @method \int getContactId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact setContactId(\int|\Bitrix\Main\DB\SqlExpression $contactId)
	 * @method bool hasContactId()
	 * @method bool isContactIdFilled()
	 * @method bool isContactIdChanged()
	 * @method \int getSort()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact setSort(\int|\Bitrix\Main\DB\SqlExpression $sort)
	 * @method bool hasSort()
	 * @method bool isSortFilled()
	 * @method bool isSortChanged()
	 * @method \int remindActualSort()
	 * @method \int requireSort()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact resetSort()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact unsetSort()
	 * @method \int fillSort()
	 * @method \boolean getIsPrimary()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact setIsPrimary(\boolean|\Bitrix\Main\DB\SqlExpression $isPrimary)
	 * @method bool hasIsPrimary()
	 * @method bool isIsPrimaryFilled()
	 * @method bool isIsPrimaryChanged()
	 * @method \boolean remindActualIsPrimary()
	 * @method \boolean requireIsPrimary()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact resetIsPrimary()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact unsetIsPrimary()
	 * @method \boolean fillIsPrimary()
	 * @method \MyWebstor\Hms\Object\Appointment getAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment remindActualAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment requireAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact setAppointment(\MyWebstor\Hms\Object\Appointment $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact resetAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact unsetAppointment()
	 * @method bool hasAppointment()
	 * @method bool isAppointmentFilled()
	 * @method bool isAppointmentChanged()
	 * @method \MyWebstor\Hms\Object\Appointment fillAppointment()
	 * @method \Bitrix\Crm\Contact getContact()
	 * @method \Bitrix\Crm\Contact remindActualContact()
	 * @method \Bitrix\Crm\Contact requireContact()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact setContact(\Bitrix\Crm\Contact $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact resetContact()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact unsetContact()
	 * @method bool hasContact()
	 * @method bool isContactFilled()
	 * @method bool isContactChanged()
	 * @method \Bitrix\Crm\Contact fillContact()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact set($fieldName, $value)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact reset($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentContact wakeUp($data)
	 */
	class EO_AppointmentContact {
		/* @var \MyWebstor\Hms\Binding\AppointmentContactTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentContactTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentContact_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getAppointmentIdList()
	 * @method \int[] getContactIdList()
	 * @method \int[] getSortList()
	 * @method \int[] fillSort()
	 * @method \boolean[] getIsPrimaryList()
	 * @method \boolean[] fillIsPrimary()
	 * @method \MyWebstor\Hms\Object\Appointment[] getAppointmentList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection getAppointmentCollection()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fillAppointment()
	 * @method \Bitrix\Crm\Contact[] getContactList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection getContactCollection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillContact()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Binding\EO_AppointmentContact $object)
	 * @method bool has(\MyWebstor\Hms\Binding\EO_AppointmentContact $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact getByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Binding\EO_AppointmentContact $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_AppointmentContact_Collection merge(?EO_AppointmentContact_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_AppointmentContact_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Binding\AppointmentContactTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentContactTable';
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * @method static EO_AppointmentContact_Query query()
	 * @method static EO_AppointmentContact_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_AppointmentContact_Result getById($id)
	 * @method static EO_AppointmentContact_Result getList(array $parameters = [])
	 * @method static EO_AppointmentContact_Entity getEntity()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentContact createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection createCollection()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentContact wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection wakeUpCollection($rows)
	 */
	class AppointmentContactTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_AppointmentContact_Result exec()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_AppointmentContact_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection fetchCollection()
	 */
	class EO_AppointmentContact_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection createCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact wakeUpObject($row)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection wakeUpCollection($rows)
	 */
	class EO_AppointmentContact_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Binding\AppointmentReserveOfficeTable */
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentReserveOffice
	 * @see \MyWebstor\Hms\Binding\AppointmentReserveOfficeTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getAppointmentId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice setAppointmentId(\int|\Bitrix\Main\DB\SqlExpression $appointmentId)
	 * @method bool hasAppointmentId()
	 * @method bool isAppointmentIdFilled()
	 * @method bool isAppointmentIdChanged()
	 * @method \int getOfficeId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice setOfficeId(\int|\Bitrix\Main\DB\SqlExpression $officeId)
	 * @method bool hasOfficeId()
	 * @method bool isOfficeIdFilled()
	 * @method bool isOfficeIdChanged()
	 * @method \MyWebstor\Hms\Object\Appointment getAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment remindActualAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment requireAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice setAppointment(\MyWebstor\Hms\Object\Appointment $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice resetAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice unsetAppointment()
	 * @method bool hasAppointment()
	 * @method bool isAppointmentFilled()
	 * @method bool isAppointmentChanged()
	 * @method \MyWebstor\Hms\Object\Appointment fillAppointment()
	 * @method \MyWebstor\Hms\EO_Office getOffice()
	 * @method \MyWebstor\Hms\EO_Office remindActualOffice()
	 * @method \MyWebstor\Hms\EO_Office requireOffice()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice setOffice(\MyWebstor\Hms\EO_Office $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice resetOffice()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice unsetOffice()
	 * @method bool hasOffice()
	 * @method bool isOfficeFilled()
	 * @method bool isOfficeChanged()
	 * @method \MyWebstor\Hms\EO_Office fillOffice()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice set($fieldName, $value)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice reset($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice wakeUp($data)
	 */
	class EO_AppointmentReserveOffice {
		/* @var \MyWebstor\Hms\Binding\AppointmentReserveOfficeTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentReserveOfficeTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentReserveOffice_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getAppointmentIdList()
	 * @method \int[] getOfficeIdList()
	 * @method \MyWebstor\Hms\Object\Appointment[] getAppointmentList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection getAppointmentCollection()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fillAppointment()
	 * @method \MyWebstor\Hms\EO_Office[] getOfficeList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection getOfficeCollection()
	 * @method \MyWebstor\Hms\EO_Office_Collection fillOffice()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Binding\EO_AppointmentReserveOffice $object)
	 * @method bool has(\MyWebstor\Hms\Binding\EO_AppointmentReserveOffice $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice getByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Binding\EO_AppointmentReserveOffice $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_AppointmentReserveOffice_Collection merge(?EO_AppointmentReserveOffice_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_AppointmentReserveOffice_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Binding\AppointmentReserveOfficeTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentReserveOfficeTable';
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * @method static EO_AppointmentReserveOffice_Query query()
	 * @method static EO_AppointmentReserveOffice_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_AppointmentReserveOffice_Result getById($id)
	 * @method static EO_AppointmentReserveOffice_Result getList(array $parameters = [])
	 * @method static EO_AppointmentReserveOffice_Entity getEntity()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection createCollection()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection wakeUpCollection($rows)
	 */
	class AppointmentReserveOfficeTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_AppointmentReserveOffice_Result exec()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_AppointmentReserveOffice_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection fetchCollection()
	 */
	class EO_AppointmentReserveOffice_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection createCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice wakeUpObject($row)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveOffice_Collection wakeUpCollection($rows)
	 */
	class EO_AppointmentReserveOffice_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Binding\VhiTypeVhiServiceTypeTable */
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_VhiTypeVhiServiceType
	 * @see \MyWebstor\Hms\Binding\VhiTypeVhiServiceTypeTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getVhiTypeId()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType setVhiTypeId(\int|\Bitrix\Main\DB\SqlExpression $vhiTypeId)
	 * @method bool hasVhiTypeId()
	 * @method bool isVhiTypeIdFilled()
	 * @method bool isVhiTypeIdChanged()
	 * @method \int getVhiServiceTypeId()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType setVhiServiceTypeId(\int|\Bitrix\Main\DB\SqlExpression $vhiServiceTypeId)
	 * @method bool hasVhiServiceTypeId()
	 * @method bool isVhiServiceTypeIdFilled()
	 * @method bool isVhiServiceTypeIdChanged()
	 * @method \boolean getActive()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType setActive(\boolean|\Bitrix\Main\DB\SqlExpression $active)
	 * @method bool hasActive()
	 * @method bool isActiveFilled()
	 * @method bool isActiveChanged()
	 * @method \boolean remindActualActive()
	 * @method \boolean requireActive()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType resetActive()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType unsetActive()
	 * @method \boolean fillActive()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType getVhiType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType remindActualVhiType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType requireVhiType()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType setVhiType(\MyWebstor\Hms\Vhi\EO_VhiType $object)
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType resetVhiType()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType unsetVhiType()
	 * @method bool hasVhiType()
	 * @method bool isVhiTypeFilled()
	 * @method bool isVhiTypeChanged()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType fillVhiType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType getVhiServiceType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType remindActualVhiServiceType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType requireVhiServiceType()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType setVhiServiceType(\MyWebstor\Hms\Vhi\EO_VhiServiceType $object)
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType resetVhiServiceType()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType unsetVhiServiceType()
	 * @method bool hasVhiServiceType()
	 * @method bool isVhiServiceTypeFilled()
	 * @method bool isVhiServiceTypeChanged()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType fillVhiServiceType()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType set($fieldName, $value)
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType reset($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType wakeUp($data)
	 */
	class EO_VhiTypeVhiServiceType {
		/* @var \MyWebstor\Hms\Binding\VhiTypeVhiServiceTypeTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\VhiTypeVhiServiceTypeTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_VhiTypeVhiServiceType_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getVhiTypeIdList()
	 * @method \int[] getVhiServiceTypeIdList()
	 * @method \boolean[] getActiveList()
	 * @method \boolean[] fillActive()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType[] getVhiTypeList()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection getVhiTypeCollection()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiType_Collection fillVhiType()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType[] getVhiServiceTypeList()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection getVhiServiceTypeCollection()
	 * @method \MyWebstor\Hms\Vhi\EO_VhiServiceType_Collection fillVhiServiceType()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType $object)
	 * @method bool has(\MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType getByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_VhiTypeVhiServiceType_Collection merge(?EO_VhiTypeVhiServiceType_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_VhiTypeVhiServiceType_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Binding\VhiTypeVhiServiceTypeTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\VhiTypeVhiServiceTypeTable';
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * @method static EO_VhiTypeVhiServiceType_Query query()
	 * @method static EO_VhiTypeVhiServiceType_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_VhiTypeVhiServiceType_Result getById($id)
	 * @method static EO_VhiTypeVhiServiceType_Result getList(array $parameters = [])
	 * @method static EO_VhiTypeVhiServiceType_Entity getEntity()
	 * @method static \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection createCollection()
	 * @method static \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection wakeUpCollection($rows)
	 */
	class VhiTypeVhiServiceTypeTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_VhiTypeVhiServiceType_Result exec()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_VhiTypeVhiServiceType_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection fetchCollection()
	 */
	class EO_VhiTypeVhiServiceType_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection createCollection()
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType wakeUpObject($row)
	 * @method \MyWebstor\Hms\Binding\EO_VhiTypeVhiServiceType_Collection wakeUpCollection($rows)
	 */
	class EO_VhiTypeVhiServiceType_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Binding\AppointmentDealTable */
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentDeal
	 * @see \MyWebstor\Hms\Binding\AppointmentDealTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getAppointmentId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal setAppointmentId(\int|\Bitrix\Main\DB\SqlExpression $appointmentId)
	 * @method bool hasAppointmentId()
	 * @method bool isAppointmentIdFilled()
	 * @method bool isAppointmentIdChanged()
	 * @method \int getDealId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal setDealId(\int|\Bitrix\Main\DB\SqlExpression $dealId)
	 * @method bool hasDealId()
	 * @method bool isDealIdFilled()
	 * @method bool isDealIdChanged()
	 * @method \MyWebstor\Hms\Object\Appointment getAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment remindActualAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment requireAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal setAppointment(\MyWebstor\Hms\Object\Appointment $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal resetAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal unsetAppointment()
	 * @method bool hasAppointment()
	 * @method bool isAppointmentFilled()
	 * @method bool isAppointmentChanged()
	 * @method \MyWebstor\Hms\Object\Appointment fillAppointment()
	 * @method \Bitrix\Crm\EO_Deal getDeal()
	 * @method \Bitrix\Crm\EO_Deal remindActualDeal()
	 * @method \Bitrix\Crm\EO_Deal requireDeal()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal setDeal(\Bitrix\Crm\EO_Deal $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal resetDeal()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal unsetDeal()
	 * @method bool hasDeal()
	 * @method bool isDealFilled()
	 * @method bool isDealChanged()
	 * @method \Bitrix\Crm\EO_Deal fillDeal()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal set($fieldName, $value)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal reset($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentDeal wakeUp($data)
	 */
	class EO_AppointmentDeal {
		/* @var \MyWebstor\Hms\Binding\AppointmentDealTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentDealTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentDeal_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getAppointmentIdList()
	 * @method \int[] getDealIdList()
	 * @method \MyWebstor\Hms\Object\Appointment[] getAppointmentList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection getAppointmentCollection()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fillAppointment()
	 * @method \Bitrix\Crm\EO_Deal[] getDealList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection getDealCollection()
	 * @method \Bitrix\Crm\EO_Deal_Collection fillDeal()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Binding\EO_AppointmentDeal $object)
	 * @method bool has(\MyWebstor\Hms\Binding\EO_AppointmentDeal $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal getByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Binding\EO_AppointmentDeal $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_AppointmentDeal_Collection merge(?EO_AppointmentDeal_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_AppointmentDeal_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Binding\AppointmentDealTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentDealTable';
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * @method static EO_AppointmentDeal_Query query()
	 * @method static EO_AppointmentDeal_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_AppointmentDeal_Result getById($id)
	 * @method static EO_AppointmentDeal_Result getList(array $parameters = [])
	 * @method static EO_AppointmentDeal_Entity getEntity()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentDeal createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection createCollection()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentDeal wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection wakeUpCollection($rows)
	 */
	class AppointmentDealTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_AppointmentDeal_Result exec()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_AppointmentDeal_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection fetchCollection()
	 */
	class EO_AppointmentDeal_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection createCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal wakeUpObject($row)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentDeal_Collection wakeUpCollection($rows)
	 */
	class EO_AppointmentDeal_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Binding\AppointmentReserveDateTable */
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentReserveDate
	 * @see \MyWebstor\Hms\Binding\AppointmentReserveDateTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getAppointmentId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate setAppointmentId(\int|\Bitrix\Main\DB\SqlExpression $appointmentId)
	 * @method bool hasAppointmentId()
	 * @method bool isAppointmentIdFilled()
	 * @method bool isAppointmentIdChanged()
	 * @method \int remindActualAppointmentId()
	 * @method \int requireAppointmentId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate resetAppointmentId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate unsetAppointmentId()
	 * @method \int fillAppointmentId()
	 * @method \Bitrix\Main\Type\DateTime getDateFrom()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate setDateFrom(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateFrom)
	 * @method bool hasDateFrom()
	 * @method bool isDateFromFilled()
	 * @method bool isDateFromChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateFrom()
	 * @method \Bitrix\Main\Type\DateTime requireDateFrom()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate resetDateFrom()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate unsetDateFrom()
	 * @method \Bitrix\Main\Type\DateTime fillDateFrom()
	 * @method \Bitrix\Main\Type\DateTime getDateTo()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate setDateTo(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateTo)
	 * @method bool hasDateTo()
	 * @method bool isDateToFilled()
	 * @method bool isDateToChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateTo()
	 * @method \Bitrix\Main\Type\DateTime requireDateTo()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate resetDateTo()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate unsetDateTo()
	 * @method \Bitrix\Main\Type\DateTime fillDateTo()
	 * @method \MyWebstor\Hms\Object\Appointment getAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment remindActualAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment requireAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate setAppointment(\MyWebstor\Hms\Object\Appointment $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate resetAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate unsetAppointment()
	 * @method bool hasAppointment()
	 * @method bool isAppointmentFilled()
	 * @method bool isAppointmentChanged()
	 * @method \MyWebstor\Hms\Object\Appointment fillAppointment()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate set($fieldName, $value)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate reset($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveDate wakeUp($data)
	 */
	class EO_AppointmentReserveDate {
		/* @var \MyWebstor\Hms\Binding\AppointmentReserveDateTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentReserveDateTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentReserveDate_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getAppointmentIdList()
	 * @method \int[] fillAppointmentId()
	 * @method \Bitrix\Main\Type\DateTime[] getDateFromList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateFrom()
	 * @method \Bitrix\Main\Type\DateTime[] getDateToList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateTo()
	 * @method \MyWebstor\Hms\Object\Appointment[] getAppointmentList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection getAppointmentCollection()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fillAppointment()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Binding\EO_AppointmentReserveDate $object)
	 * @method bool has(\MyWebstor\Hms\Binding\EO_AppointmentReserveDate $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate getByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Binding\EO_AppointmentReserveDate $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_AppointmentReserveDate_Collection merge(?EO_AppointmentReserveDate_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_AppointmentReserveDate_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Binding\AppointmentReserveDateTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentReserveDateTable';
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * @method static EO_AppointmentReserveDate_Query query()
	 * @method static EO_AppointmentReserveDate_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_AppointmentReserveDate_Result getById($id)
	 * @method static EO_AppointmentReserveDate_Result getList(array $parameters = [])
	 * @method static EO_AppointmentReserveDate_Entity getEntity()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveDate createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection createCollection()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveDate wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection wakeUpCollection($rows)
	 */
	class AppointmentReserveDateTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_AppointmentReserveDate_Result exec()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_AppointmentReserveDate_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection fetchCollection()
	 */
	class EO_AppointmentReserveDate_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection createCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate wakeUpObject($row)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDate_Collection wakeUpCollection($rows)
	 */
	class EO_AppointmentReserveDate_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Binding\AppointmentReserveSpecializationTable */
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentReserveSpecialization
	 * @see \MyWebstor\Hms\Binding\AppointmentReserveSpecializationTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getAppointmentId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization setAppointmentId(\int|\Bitrix\Main\DB\SqlExpression $appointmentId)
	 * @method bool hasAppointmentId()
	 * @method bool isAppointmentIdFilled()
	 * @method bool isAppointmentIdChanged()
	 * @method \int getSpecializationId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization setSpecializationId(\int|\Bitrix\Main\DB\SqlExpression $specializationId)
	 * @method bool hasSpecializationId()
	 * @method bool isSpecializationIdFilled()
	 * @method bool isSpecializationIdChanged()
	 * @method \MyWebstor\Hms\Object\Appointment getAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment remindActualAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment requireAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization setAppointment(\MyWebstor\Hms\Object\Appointment $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization resetAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization unsetAppointment()
	 * @method bool hasAppointment()
	 * @method bool isAppointmentFilled()
	 * @method bool isAppointmentChanged()
	 * @method \MyWebstor\Hms\Object\Appointment fillAppointment()
	 * @method \MyWebstor\Hms\EO_Specialization getSpecialization()
	 * @method \MyWebstor\Hms\EO_Specialization remindActualSpecialization()
	 * @method \MyWebstor\Hms\EO_Specialization requireSpecialization()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization setSpecialization(\MyWebstor\Hms\EO_Specialization $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization resetSpecialization()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization unsetSpecialization()
	 * @method bool hasSpecialization()
	 * @method bool isSpecializationFilled()
	 * @method bool isSpecializationChanged()
	 * @method \MyWebstor\Hms\EO_Specialization fillSpecialization()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization set($fieldName, $value)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization reset($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization wakeUp($data)
	 */
	class EO_AppointmentReserveSpecialization {
		/* @var \MyWebstor\Hms\Binding\AppointmentReserveSpecializationTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentReserveSpecializationTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentReserveSpecialization_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getAppointmentIdList()
	 * @method \int[] getSpecializationIdList()
	 * @method \MyWebstor\Hms\Object\Appointment[] getAppointmentList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection getAppointmentCollection()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fillAppointment()
	 * @method \MyWebstor\Hms\EO_Specialization[] getSpecializationList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection getSpecializationCollection()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection fillSpecialization()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization $object)
	 * @method bool has(\MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization getByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_AppointmentReserveSpecialization_Collection merge(?EO_AppointmentReserveSpecialization_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_AppointmentReserveSpecialization_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Binding\AppointmentReserveSpecializationTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentReserveSpecializationTable';
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * @method static EO_AppointmentReserveSpecialization_Query query()
	 * @method static EO_AppointmentReserveSpecialization_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_AppointmentReserveSpecialization_Result getById($id)
	 * @method static EO_AppointmentReserveSpecialization_Result getList(array $parameters = [])
	 * @method static EO_AppointmentReserveSpecialization_Entity getEntity()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection createCollection()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection wakeUpCollection($rows)
	 */
	class AppointmentReserveSpecializationTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_AppointmentReserveSpecialization_Result exec()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_AppointmentReserveSpecialization_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection fetchCollection()
	 */
	class EO_AppointmentReserveSpecialization_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection createCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization wakeUpObject($row)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveSpecialization_Collection wakeUpCollection($rows)
	 */
	class EO_AppointmentReserveSpecialization_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Binding\AppointmentReserveDoctorTable */
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentReserveDoctor
	 * @see \MyWebstor\Hms\Binding\AppointmentReserveDoctorTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getAppointmentId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor setAppointmentId(\int|\Bitrix\Main\DB\SqlExpression $appointmentId)
	 * @method bool hasAppointmentId()
	 * @method bool isAppointmentIdFilled()
	 * @method bool isAppointmentIdChanged()
	 * @method \int getDoctorId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor setDoctorId(\int|\Bitrix\Main\DB\SqlExpression $doctorId)
	 * @method bool hasDoctorId()
	 * @method bool isDoctorIdFilled()
	 * @method bool isDoctorIdChanged()
	 * @method \MyWebstor\Hms\Object\Appointment getAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment remindActualAppointment()
	 * @method \MyWebstor\Hms\Object\Appointment requireAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor setAppointment(\MyWebstor\Hms\Object\Appointment $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor resetAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor unsetAppointment()
	 * @method bool hasAppointment()
	 * @method bool isAppointmentFilled()
	 * @method bool isAppointmentChanged()
	 * @method \MyWebstor\Hms\Object\Appointment fillAppointment()
	 * @method \MyWebstor\Hms\EO_Doctor getDoctor()
	 * @method \MyWebstor\Hms\EO_Doctor remindActualDoctor()
	 * @method \MyWebstor\Hms\EO_Doctor requireDoctor()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor setDoctor(\MyWebstor\Hms\EO_Doctor $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor resetDoctor()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor unsetDoctor()
	 * @method bool hasDoctor()
	 * @method bool isDoctorFilled()
	 * @method bool isDoctorChanged()
	 * @method \MyWebstor\Hms\EO_Doctor fillDoctor()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor set($fieldName, $value)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor reset($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor wakeUp($data)
	 */
	class EO_AppointmentReserveDoctor {
		/* @var \MyWebstor\Hms\Binding\AppointmentReserveDoctorTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentReserveDoctorTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentReserveDoctor_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getAppointmentIdList()
	 * @method \int[] getDoctorIdList()
	 * @method \MyWebstor\Hms\Object\Appointment[] getAppointmentList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection getAppointmentCollection()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fillAppointment()
	 * @method \MyWebstor\Hms\EO_Doctor[] getDoctorList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection getDoctorCollection()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection fillDoctor()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor $object)
	 * @method bool has(\MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor getByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_AppointmentReserveDoctor_Collection merge(?EO_AppointmentReserveDoctor_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_AppointmentReserveDoctor_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Binding\AppointmentReserveDoctorTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentReserveDoctorTable';
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * @method static EO_AppointmentReserveDoctor_Query query()
	 * @method static EO_AppointmentReserveDoctor_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_AppointmentReserveDoctor_Result getById($id)
	 * @method static EO_AppointmentReserveDoctor_Result getList(array $parameters = [])
	 * @method static EO_AppointmentReserveDoctor_Entity getEntity()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection createCollection()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection wakeUpCollection($rows)
	 */
	class AppointmentReserveDoctorTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_AppointmentReserveDoctor_Result exec()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_AppointmentReserveDoctor_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection fetchCollection()
	 */
	class EO_AppointmentReserveDoctor_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection createCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor wakeUpObject($row)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentReserveDoctor_Collection wakeUpCollection($rows)
	 */
	class EO_AppointmentReserveDoctor_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Binding\DoctorSpecializationTable */
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_DoctorSpecialization
	 * @see \MyWebstor\Hms\Binding\DoctorSpecializationTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getDoctorId()
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization setDoctorId(\int|\Bitrix\Main\DB\SqlExpression $doctorId)
	 * @method bool hasDoctorId()
	 * @method bool isDoctorIdFilled()
	 * @method bool isDoctorIdChanged()
	 * @method \int getSpecializationId()
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization setSpecializationId(\int|\Bitrix\Main\DB\SqlExpression $specializationId)
	 * @method bool hasSpecializationId()
	 * @method bool isSpecializationIdFilled()
	 * @method bool isSpecializationIdChanged()
	 * @method \MyWebstor\Hms\EO_Doctor getDoctor()
	 * @method \MyWebstor\Hms\EO_Doctor remindActualDoctor()
	 * @method \MyWebstor\Hms\EO_Doctor requireDoctor()
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization setDoctor(\MyWebstor\Hms\EO_Doctor $object)
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization resetDoctor()
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization unsetDoctor()
	 * @method bool hasDoctor()
	 * @method bool isDoctorFilled()
	 * @method bool isDoctorChanged()
	 * @method \MyWebstor\Hms\EO_Doctor fillDoctor()
	 * @method \MyWebstor\Hms\EO_Specialization getSpecialization()
	 * @method \MyWebstor\Hms\EO_Specialization remindActualSpecialization()
	 * @method \MyWebstor\Hms\EO_Specialization requireSpecialization()
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization setSpecialization(\MyWebstor\Hms\EO_Specialization $object)
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization resetSpecialization()
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization unsetSpecialization()
	 * @method bool hasSpecialization()
	 * @method bool isSpecializationFilled()
	 * @method bool isSpecializationChanged()
	 * @method \MyWebstor\Hms\EO_Specialization fillSpecialization()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization set($fieldName, $value)
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization reset($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Binding\EO_DoctorSpecialization wakeUp($data)
	 */
	class EO_DoctorSpecialization {
		/* @var \MyWebstor\Hms\Binding\DoctorSpecializationTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\DoctorSpecializationTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_DoctorSpecialization_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getDoctorIdList()
	 * @method \int[] getSpecializationIdList()
	 * @method \MyWebstor\Hms\EO_Doctor[] getDoctorList()
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization_Collection getDoctorCollection()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection fillDoctor()
	 * @method \MyWebstor\Hms\EO_Specialization[] getSpecializationList()
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization_Collection getSpecializationCollection()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection fillSpecialization()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Binding\EO_DoctorSpecialization $object)
	 * @method bool has(\MyWebstor\Hms\Binding\EO_DoctorSpecialization $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization getByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Binding\EO_DoctorSpecialization $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Binding\EO_DoctorSpecialization_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_DoctorSpecialization_Collection merge(?EO_DoctorSpecialization_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_DoctorSpecialization_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Binding\DoctorSpecializationTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\DoctorSpecializationTable';
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * @method static EO_DoctorSpecialization_Query query()
	 * @method static EO_DoctorSpecialization_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_DoctorSpecialization_Result getById($id)
	 * @method static EO_DoctorSpecialization_Result getList(array $parameters = [])
	 * @method static EO_DoctorSpecialization_Entity getEntity()
	 * @method static \MyWebstor\Hms\Binding\EO_DoctorSpecialization createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Binding\EO_DoctorSpecialization_Collection createCollection()
	 * @method static \MyWebstor\Hms\Binding\EO_DoctorSpecialization wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Binding\EO_DoctorSpecialization_Collection wakeUpCollection($rows)
	 */
	class DoctorSpecializationTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_DoctorSpecialization_Result exec()
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_DoctorSpecialization_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization_Collection fetchCollection()
	 */
	class EO_DoctorSpecialization_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization_Collection createCollection()
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization wakeUpObject($row)
	 * @method \MyWebstor\Hms\Binding\EO_DoctorSpecialization_Collection wakeUpCollection($rows)
	 */
	class EO_DoctorSpecialization_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Binding\OfficeSpecializationTable */
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_OfficeSpecialization
	 * @see \MyWebstor\Hms\Binding\OfficeSpecializationTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getOfficeId()
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization setOfficeId(\int|\Bitrix\Main\DB\SqlExpression $officeId)
	 * @method bool hasOfficeId()
	 * @method bool isOfficeIdFilled()
	 * @method bool isOfficeIdChanged()
	 * @method \int getSpecializationId()
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization setSpecializationId(\int|\Bitrix\Main\DB\SqlExpression $specializationId)
	 * @method bool hasSpecializationId()
	 * @method bool isSpecializationIdFilled()
	 * @method bool isSpecializationIdChanged()
	 * @method \MyWebstor\Hms\EO_Office getOffice()
	 * @method \MyWebstor\Hms\EO_Office remindActualOffice()
	 * @method \MyWebstor\Hms\EO_Office requireOffice()
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization setOffice(\MyWebstor\Hms\EO_Office $object)
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization resetOffice()
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization unsetOffice()
	 * @method bool hasOffice()
	 * @method bool isOfficeFilled()
	 * @method bool isOfficeChanged()
	 * @method \MyWebstor\Hms\EO_Office fillOffice()
	 * @method \MyWebstor\Hms\EO_Specialization getSpecialization()
	 * @method \MyWebstor\Hms\EO_Specialization remindActualSpecialization()
	 * @method \MyWebstor\Hms\EO_Specialization requireSpecialization()
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization setSpecialization(\MyWebstor\Hms\EO_Specialization $object)
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization resetSpecialization()
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization unsetSpecialization()
	 * @method bool hasSpecialization()
	 * @method bool isSpecializationFilled()
	 * @method bool isSpecializationChanged()
	 * @method \MyWebstor\Hms\EO_Specialization fillSpecialization()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization set($fieldName, $value)
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization reset($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Binding\EO_OfficeSpecialization wakeUp($data)
	 */
	class EO_OfficeSpecialization {
		/* @var \MyWebstor\Hms\Binding\OfficeSpecializationTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\OfficeSpecializationTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_OfficeSpecialization_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getOfficeIdList()
	 * @method \int[] getSpecializationIdList()
	 * @method \MyWebstor\Hms\EO_Office[] getOfficeList()
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization_Collection getOfficeCollection()
	 * @method \MyWebstor\Hms\EO_Office_Collection fillOffice()
	 * @method \MyWebstor\Hms\EO_Specialization[] getSpecializationList()
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization_Collection getSpecializationCollection()
	 * @method \MyWebstor\Hms\EO_Specialization_Collection fillSpecialization()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Binding\EO_OfficeSpecialization $object)
	 * @method bool has(\MyWebstor\Hms\Binding\EO_OfficeSpecialization $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization getByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Binding\EO_OfficeSpecialization $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Binding\EO_OfficeSpecialization_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_OfficeSpecialization_Collection merge(?EO_OfficeSpecialization_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_OfficeSpecialization_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Binding\OfficeSpecializationTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\OfficeSpecializationTable';
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * @method static EO_OfficeSpecialization_Query query()
	 * @method static EO_OfficeSpecialization_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_OfficeSpecialization_Result getById($id)
	 * @method static EO_OfficeSpecialization_Result getList(array $parameters = [])
	 * @method static EO_OfficeSpecialization_Entity getEntity()
	 * @method static \MyWebstor\Hms\Binding\EO_OfficeSpecialization createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Binding\EO_OfficeSpecialization_Collection createCollection()
	 * @method static \MyWebstor\Hms\Binding\EO_OfficeSpecialization wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Binding\EO_OfficeSpecialization_Collection wakeUpCollection($rows)
	 */
	class OfficeSpecializationTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_OfficeSpecialization_Result exec()
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_OfficeSpecialization_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization_Collection fetchCollection()
	 */
	class EO_OfficeSpecialization_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization_Collection createCollection()
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization wakeUpObject($row)
	 * @method \MyWebstor\Hms\Binding\EO_OfficeSpecialization_Collection wakeUpCollection($rows)
	 */
	class EO_OfficeSpecialization_Entity extends \Bitrix\Main\ORM\Entity {}
}
