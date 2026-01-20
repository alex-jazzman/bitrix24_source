BX.namespace("BX.Crm");

//region FACTORY
if(typeof BX.Crm.EntityEditorValidatorFactory === "undefined")
{
	/**
	 * @deprecated
	 */
	BX.Crm.EntityEditorValidatorFactory = BX.UI.EntityEditorValidatorFactory;
}

if(typeof BX.Crm.EntityEditorControlFactory === "undefined")
{
	BX.Crm.EntityEditorControlFactory =
		{
			initialized: false,
			methods: {},

			isInitialized: function()
			{
				return this.initialized;
			},
			initialize: function()
			{
				if(this.initialized)
				{
					return;
				}

				var eventArgs = { methods: {} };
				BX.onCustomEvent(
					window,
					"BX.Crm.EntityEditorControlFactory:onInitialize",
					[ this, eventArgs ]
				);

				for(var name in eventArgs.methods)
				{
					if(eventArgs.methods.hasOwnProperty(name))
					{
						this.registerFactoryMethod(name, eventArgs.methods[name]);
					}
				}

				this.initialized = true;
			},
			registerFactoryMethod: function(name, method)
			{
				if(BX.type.isFunction(method))
				{
					this.methods[name] = method;
				}
			},
			create(type, controlId, settings)
			{
				if (!this.initialized)
				{
					this.initialize();
				}

				const entityCreators = {
					column: BX.UI.EntityEditorColumn,
					section: BX.Crm.EntityEditorSection,
					text: BX.Crm.EntityEditorText,
					number: BX.UI.EntityEditorNumber,
					datetime: BX.UI.EntityEditorDatetime,
					boolean: BX.UI.EntityEditorBoolean,
					list: BX.UI.EntityEditorList,
					multilist: BX.UI.EntityEditorMultiList,
					html: BX.UI.EntityEditorHtml,
					bb: BX.UI.EntityEditorBB,
					bbcode: BX.UI.EntityEditorBBCode,
					file: BX.UI.EntityEditorFile,
					money: BX.Crm.EntityEditorMoney,
					calculated_delivery_price: BX.Crm.EntityEditorCalculatedDeliveryPrice,
					moneyPay: BX.Crm.EntityEditorMoneyPay,
					image: BX.Crm.EntityEditorImage,
					user: BX.Crm.EntityEditorUser,
					multiple_user: BX.Crm.EntityEditorMultipleUser,
					address_form: BX.Crm.EntityEditorAddress,
					address: BX.Crm.EntityEditorAddressField,
					crm_entity: BX.Crm.EntityEditorEntity,
					crm_entity_tag: BX.Crm.EntityEditorEntityTag,
					file_storage: BX.Crm.EntityEditorFileStorage,
					phone: BX.Crm.EntityEditorPhone,
					client: BX.Crm.EntityEditorClient,
					client_light: BX.Crm.EntityEditorClientLight,
					multifield: BX.Crm.EntityEditorMultifield,
					product_row_summary: BX.UI.EntityEditorProductRowSummary,
					requisite_selector: BX.Crm.EntityEditorRequisiteSelector,
					requisite: BX.Crm.EntityEditorRequisiteField,
					requisite_address: BX.Crm.EntityEditorRequisiteAddressField,
					requisite_list: BX.Crm.EntityEditorRequisiteList,
					userField: BX.Crm.EntityEditorUserField,
					userFieldConfig: BX.Crm.EntityEditorUserFieldConfigurator,
					recurringV2: BX.Crm.EntityEditorRecurringV2,
					custom: BX.UI.EntityEditorCustom,
					shipment: BX.Crm.EntityEditorShipment,
					payment: BX.Crm.EntityEditorPayment,
					payment_status: BX.Crm.EntityEditorPaymentStatus,
					payment_check: BX.Crm.EntityEditorPaymentCheck,
					order_subsection: BX.Crm.EntityEditorSubsection,
					order_property_wrapper: BX.Crm.EntityEditorOrderPropertyWrapper,
					order_property_subsection: BX.Crm.EntityEditorOrderPropertySubsection,
					order_property_file: BX.Crm.EntityEditorOrderPropertyFile,
					order_product_property: BX.Crm.EntityEditorOrderProductProperty,
					order_trading_platform: BX.Crm.EntityEditorOrderTradingPlatform,
					order_person_type: BX.Crm.EntityEditorOrderPersonType,
					order_quantity: BX.Crm.EntityEditorOrderQuantity,
					order_user: BX.Crm.EntityEditorOrderUser,
					order_client: BX.Crm.EntityEditorOrderClient,
					hidden: BX.Crm.EntityEditorHidden,
					delivery_selector: BX.Crm.EntityEditorDeliverySelector,
					shipment_extra_services: BX.Crm.EntityEditorShipmentExtraServices,
					pay_system_selector: BX.Crm.EntityEditorPaySystemSelector,
					document_number: BX.Crm.EntityEditorDocumentNumber,
				};

				if (entityCreators[type])
				{
					return entityCreators[type].create(controlId, settings);
				}

				for (const name of Object.keys(this.methods))
				{
					const control = this.methods[name](type, controlId, settings);
					if (control)
					{
						return control;
					}
				}

				return null;
			},
		};
}

if(typeof BX.Crm.EntityEditorControllerFactory === "undefined")
{
	BX.Crm.EntityEditorControllerFactory =
		{
			methods: null,

			create: function(type, controllerId, settings)
			{
				if (this.methods === null)
				{
					this.registerEventFactories();
				}

				if (type === "requisite_controller")
				{
					return BX.Crm.EntityEditorRequisiteController.create(controllerId, settings);
				}
				if (type === "product_row_proxy")
				{
					return BX.Crm.EntityEditorProductRowProxy.create(controllerId, settings);
				}
				else if (type === "product_list")
				{
					return BX.Crm.EntityProductListController.create(controllerId, settings);
				}
				else if (type === "order_controller")
				{
					return BX.Crm.EntityEditorOrderController.create(controllerId, settings);
				}
				else if (type === "order_shipment_controller")
				{
					return BX.Crm.EntityEditorOrderShipmentController.create(controllerId, settings);
				}
				else if (type === "document_order_shipment_controller")
				{
					return BX.Crm.EntityEditorDocumentOrderShipmentController.create(controllerId, settings);
				}
				else if (type === "order_payment_controller")
				{
					return BX.Crm.EntityEditorOrderPaymentController.create(controllerId, settings);
				}
				else if (type === "order_product_controller")
				{
					return BX.Crm.EntityEditorOrderProductController.create(controllerId, settings);
				}
				else if (type === "store_document_product_list")
				{
					return BX.Crm.EntityStoreDocumentProductListController.create(controllerId, settings);
				}

				var controller = this.findEventController(type, controllerId, settings);
				if (controller)
				{
					return controller;
				}

				return null;
			},

			registerEventFactories: function()
			{
				var eventArgs = {methods: {}};
				BX.onCustomEvent(
					window,
					'BX.Crm.EntityEditorControllerFactory:onInitialize',
					[this, eventArgs]
				);

				this.methods = {};

				for (var name in eventArgs.methods)
				{
					if (eventArgs.methods.hasOwnProperty(name))
					{
						this.registerEventFactory(name, eventArgs.methods[name]);
					}
				}
			},

			registerEventFactory: function(name, method)
			{
				if (BX.type.isFunction(method))
				{
					this.methods[name] = method;
				}
			},

			findEventController: function(type, controllerId, settings)
			{
				for (var name in this.methods)
				{
					if (!this.methods.hasOwnProperty(name))
					{
						continue;
					}

					var controller = this.methods[name](type, controllerId, settings);
					if (controller)
					{
						return controller;
					}
				}

				return null;
			}
		};
}

if(typeof BX.Crm.EntityEditorModelFactory === "undefined")
{
	BX.Crm.EntityEditorModelFactory =
		{
			create: function(entityTypeId, id, settings)
			{
				if(entityTypeId === BX.CrmEntityType.enumeration.lead)
				{
					return BX.Crm.LeadModel.create(id, settings);
				}
				else if(entityTypeId === BX.CrmEntityType.enumeration.contact)
				{
					return BX.Crm.ContactModel.create(id, settings);
				}
				else if(entityTypeId === BX.CrmEntityType.enumeration.company)
				{
					return BX.Crm.CompanyModel.create(id, settings);
				}
				else if(entityTypeId === BX.CrmEntityType.enumeration.deal)
				{
					return BX.Crm.DealModel.create(id, settings);
				}
				else if(entityTypeId === BX.CrmEntityType.enumeration.dealrecurring)
				{
					return BX.Crm.DealRecurringModel.create(id, settings);
				}
				else if(entityTypeId === BX.CrmEntityType.enumeration.quote)
				{
					return BX.Crm.QuoteModel.create(id, settings);
				}
				else if(entityTypeId === BX.CrmEntityType.enumeration.order)
				{
					return BX.Crm.OrderModel.create(id, settings);
				}
				else if(entityTypeId === BX.CrmEntityType.enumeration.orderpayment)
				{
					return BX.Crm.OrderPaymentModel.create(id, settings);
				}
				else if(entityTypeId === BX.CrmEntityType.enumeration.ordershipment)
				{
					return BX.Crm.OrderShipmentModel.create(id, settings);
				}
				else if(entityTypeId === BX.CrmEntityType.enumeration.shipmentDocument)
				{
					return BX.Crm.DocumentOrderShipmentModel.create(id, settings);
				}
				else if(entityTypeId === BX.CrmEntityType.enumeration.smartinvoice)
				{
					return BX.Crm.SmartInvoiceModel.create(id, settings);
				}
				else if (entityTypeId === BX.CrmEntityType.enumeration.smartdocument)
				{
					return BX.Crm.SmartDocumentModel.create(id, settings);
				}
				else if (entityTypeId === BX.CrmEntityType.enumeration.smartb2edocument)
				{
					return BX.Crm.SmartB2eDocumentModel.create(id, settings);
				}
				else if (BX.CrmEntityType.isDynamicTypeByTypeId(entityTypeId))
				{
					return BX.Crm.FactoryBasedModel.create(id, settings);
				}
				else if(entityTypeId === BX.CrmEntityType.enumeration.storeDocument)
				{
					return BX.Crm.StoreDocumentModel.create(id, settings);
				}
				else if(entityTypeId === BX.CrmEntityType.enumeration.agentcontract)
				{
					return BX.Crm.AgentContractModel.create(id, settings);
				}

				return BX.Crm.EntityModel.create(id, settings);
			}
		};
}
//endregion
