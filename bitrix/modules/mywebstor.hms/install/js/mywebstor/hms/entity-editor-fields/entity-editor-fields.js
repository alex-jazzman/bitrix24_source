(() => {
    BX.namespace("MyWebstor.HMS.Fields");

    let controls = [];

    BX.MyWebstor.HMS.Fields.initCrutches = function (editor) {
        if (!editor.getEntityTypeId)
            editor.getEntityTypeId = function () {
                return 0;
            };

        if (!editor.getRequisiteEditUrl)
            editor.getRequisiteEditUrl = function () {
                return "";
            };

        editor._controlChangeNotifier = BX.CrmNotifier.create(this);
        editor._modeChangeNotifier = BX.CrmNotifier.create(this);

        editor.addModeChangeListener = function (listener) {
            this._modeChangeNotifier.addListener(listener);
        }.bind(editor);

        editor.areCommunicationControlsEnabled = function () {
            return true;
        };

        editor.getEntityRequisiteSelectUrl = function () {
            return "";
        };

        editor.getEntityCreateUrl = function (entityTypeName) {
            if (entityTypeName === "CONTACT") {
                return "/crm/contact/details/0/";
            } else if (entityTypeName === "COMPANY") {
                return "/crm/company/details/0/";
            }
            return "";
        };
        editor.getEntityEditUrl = function (entityTypeName, entityId) {
            var url = "";
            if (entityTypeName === "CONTACT") {
                url = "/crm/contact/details/#id#/";
            } else if (entityTypeName === "COMPANY") {
                url = "/crm/company/details/#id#/";
            }

            if (url !== "") {
                url = url.replace("#id#", entityId, "gi");
            }

            return url;
        };
    };

    if (typeof BX.MyWebstor.HMS.Fields.EntitySelector === "undefined") {
        BX.MyWebstor.HMS.Fields.EntitySelector = function () {
            BX.MyWebstor.HMS.Fields.EntitySelector.superclass.constructor.apply(
                this
            );
            this._input = null;
            this._innerWrapper = null;

            this._entity = null;
            this._multiple = null;
            this._tagSelectorID = null;
            this._tagSelector = null;
        };

        BX.extend(
            BX.MyWebstor.HMS.Fields.EntitySelector,
            BX.UI.EntityEditorField
        );

        BX.MyWebstor.HMS.Fields.EntitySelector.prototype.doInitialize =
            function () {
                let data = this.getSchemeElement().getData();

                this._entity = data.entity;
                this._multiple = data.multiple || false;
                this._tagSelectorID = data.tagSelectorID;
            };

        BX.MyWebstor.HMS.Fields.EntitySelector.prototype.layout = function (
            options
        ) {
            if (this._hasLayout) return;

            this._input = BX.create("input", {
                attrs: {
                    type: "hidden",
                    name: this.getName(),
                },
            });
            this._inputContainer = null;
            this._innerWrapper = null;

            this.ensureWrapperCreated({
                classNames: ["ui-entity-editor-field-text"],
            });
            this.adjustWrapper();

            if (this.isDragEnabled()) {
                this._wrapper.appendChild(this.createDragButton());
            }

            this._wrapper.appendChild(this.createTitleNode(this.getTitle()));

            this._innerWrapper = BX.create("div", {
                props: {
                    className: ["ui-entity-editor-content-block"],
                },
            });
            if (this._mode === BX.UI.EntityEditorMode.edit || this.getValue()) {
                let tagSelector = this.createTagSelector();
                tagSelector.renderTo(this._innerWrapper);
            } else {
                this._innerWrapper.innerHTML = "не заполнено";
            }

            this._wrapper.appendChild(this._innerWrapper);

            if (this.isContextMenuEnabled())
                this._wrapper.appendChild(this.createContextMenuButton());
            if (this.isDragEnabled()) this.initializeDragDropAbilities();

            this.registerLayout(options);
            this._hasLayout = true;
        };

        BX.MyWebstor.HMS.Fields.EntitySelector.prototype.createTagSelector =
            function () {
                if (!this._tagSelector) {
                    let value = this.getValue();
                    if (!Array.isArray(value)) value = [value];

                    value = value.map((entityId) => [this._entity, entityId]);

                    this._tagSelector = new BX.UI.EntitySelector.TagSelector({
                        id: this._tagSelectorID,
                        multiple: this._multiple,
                        readonly: this._mode === BX.UI.EntityEditorMode.view,
                        placeholder: "",
                        textBoxWidth: "100%",
                        dialogOptions: {
                            dropdownMode: true,
                            entities: [{ id: this._entity }],
                            preselectedItems: value,
                            preload: true,
                        },
                        events: {
                            onAfterTagAdd: (event) => {
                                if (event.data.tag.getId() != this.getValue())
                                    this.markAsChanged();
                            },
                            onAfterTagRemove: (event) => {
                                this.markAsChanged();
                            },
                        },
                    });

                    this._tagSelector.mode = this._mode;
                } else {
                    const dialog = this._tagSelector.getDialog();
                    let value = this.getValue();
                    if (!Array.isArray(value)) value = [value];

                    value = value.map((entityId) => [this._entity, entityId]);

                    this._tagSelector.getTags().forEach((tag) => {
                        this._tagSelector.removeTag(tag);
                    });

                    dialog.setPreselectedItems(value);
                    dialog.loadState = "UNSENT";
                    dialog.load();

                    this._tagSelector.setReadonly(
                        this._mode === BX.UI.EntityEditorMode.view
                    );
                }

                return this._tagSelector;
            };

        BX.MyWebstor.HMS.Fields.EntitySelector.prototype.getModeSwitchType =
            function (mode) {
                var result = BX.UI.EntityEditorModeSwitchType.common;
                if (mode === BX.UI.EntityEditorMode.edit) {
                    result |=
                        BX.UI.EntityEditorModeSwitchType.button |
                        BX.UI.EntityEditorModeSwitchType.content;
                }
                return result;
            };

        BX.MyWebstor.HMS.Fields.EntitySelector.prototype.getContentWrapper =
            function () {
                return this._innerWrapper;
            };

        BX.MyWebstor.HMS.Fields.EntitySelector.prototype.validate = function (
            result
        ) {
            if (
                !(
                    this._mode === BX.UI.EntityEditorMode.edit &&
                    this._tagSelector
                )
            ) {
                throw "BX.MyWebstor.HMS.Fields.EntitySelector. Invalid validation context";
            }

            this.clearError();

            if (this.hasValidators()) {
                return this.executeValidators(result);
            }

            var isValid =
                !(this.isRequired() || this.isRequiredByAttribute()) ||
                this._tagSelector.getTags().length > 0;
            if (!isValid) {
                result.addError(
                    BX.UI.EntityValidationError.create({ field: this })
                );
                this.showRequiredFieldError();
            }
            return isValid;
        };

        BX.MyWebstor.HMS.Fields.EntitySelector.prototype.save = function () {
            if (this._tagSelector) {
                let value = this._tagSelector
                    .getTags()
                    .map((tag) => tag.id)
                    .join(",");

                this._model.setField(this.getName(), value, {
                    originator: this,
                });
                this._input.value = value;
            }
        };

        BX.MyWebstor.HMS.Fields.EntitySelector.prototype.onBeforeSubmit =
            function () {
                this._wrapper.append(this._input);
            };

        BX.MyWebstor.HMS.Fields.EntitySelector.create = function (
            id,
            settings
        ) {
            let self = new BX.MyWebstor.HMS.Fields.EntitySelector();
            self.initialize(id, settings);
            return self;
        };

        BX.MyWebstor.HMS.Fields.EntitySelector.createEditorControl = function (
            type,
            controlId,
            settings
        ) {
            if (type !== "entitySelector") return null;
            return BX.MyWebstor.HMS.Fields.EntitySelector.create(
                controlId,
                settings
            );
        };

        controls.push({
            methodName: "entitySelector",
            methodCb:
                BX.MyWebstor.HMS.Fields.EntitySelector.createEditorControl,
        });
    }

    if (typeof BX.MyWebstor.HMS.Fields.VariousEntitySelector === "undefined") {
        BX.MyWebstor.HMS.Fields.VariousEntitySelector = function () {
            BX.MyWebstor.HMS.Fields.VariousEntitySelector.superclass.constructor.apply(
                this
            );
            this._input = null;
            this._innerWrapper = null;

            this._entity = null;
            this._tagSelectorID = null;
            this._tagSelector = null;
        };

        BX.extend(
            BX.MyWebstor.HMS.Fields.VariousEntitySelector,
            BX.MyWebstor.HMS.Fields.EntitySelector
        );

        BX.MyWebstor.HMS.Fields.VariousEntitySelector.prototype.createTagSelector =
            function () {
                if (
                    !this._tagSelector ||
                    this._tagSelector.mode !== this._mode
                ) {
                    let updateTabs = () => {
                        const dialog = this._tagSelector.getDialog();
                        dialog.getItems().forEach((item) => {
                            let tabId = item.getEntityId();
                            let tab = dialog.getTab(tabId);
                            if (tab) tab.getRootNode().addItem(item);
                        });
                    };
                    this._tagSelector = new BX.UI.EntitySelector.TagSelector({
                        id: this._tagSelectorID,
                        multiple: true,
                        readonly: this._mode === BX.UI.EntityEditorMode.view,
                        placeholder: "",
                        textBoxWidth: "100%",
                        dialogOptions: {
                            entities: this._entity,
                            preselectedItems: this.getValue() || [],
                            events: {
                                onLoad: updateTabs,
                                "SearchTab:onLoad": updateTabs,
                            },
                            recentTabOptions: {
                                visible: false,
                            },
                        },
                        events: {
                            onAfterTagAdd: (event) => {
                                if (event.data.tag.getId() != this.getValue())
                                    this.markAsChanged();
                            },
                            onAfterTagRemove: (event) => {
                                this.markAsChanged();
                            },
                        },
                    });

                    this._tagSelector.mode = this._mode;
                }

                return this._tagSelector;
            };

        BX.MyWebstor.HMS.Fields.VariousEntitySelector.prototype.save =
            function () {
                if (this._tagSelector) {
                    let value = JSON.stringify(
                        this._tagSelector
                            .getTags()
                            .map((tag) => [tag.getEntityId(), tag.getId()])
                    );

                    this._model.setField(this.getName(), value, {
                        originator: this,
                    });
                    this._input.value = value;
                }
            };

        BX.MyWebstor.HMS.Fields.VariousEntitySelector.create = function (
            id,
            settings
        ) {
            let self = new BX.MyWebstor.HMS.Fields.VariousEntitySelector();
            self.initialize(id, settings);
            return self;
        };

        BX.MyWebstor.HMS.Fields.VariousEntitySelector.createEditorControl =
            function (type, controlId, settings) {
                if (type !== "variousEntitySelector") return null;
                return BX.MyWebstor.HMS.Fields.VariousEntitySelector.create(
                    controlId,
                    settings
                );
            };

        controls.push({
            methodName: "variousEntitySelector",
            methodCb:
                BX.MyWebstor.HMS.Fields.VariousEntitySelector
                    .createEditorControl,
        });
    }

    if (typeof BX.MyWebstor.HMS.Fields.ClientLight === "undefined") {
        BX.MyWebstor.HMS.Fields.ClientLight = function () {
            BX.MyWebstor.HMS.Fields.ClientLight.superclass.constructor.apply(
                this
            );
            this._map = null;
            this._info = null;

            this._primaryLoaderConfig = null;
            this._secondaryLoaderConfig = null;

            this._dataElements = null;

            this._companyInfos = null;
            this._contactInfos = null;

            this._enableCompanyMultiplicity = false;

            this._companyTitleWrapper = null;
            this._contactTitleWrapper = null;

            this._companySearchBoxes = null;
            this._contactSearchBoxes = null;

            this._companyPanels = null;
            this._contactPanels = null;

            this._companyWrapper = null;
            this._contactWrapper = null;

            this._addCompanyButton = null;
            this._addContactButton = null;

            this._innerWrapper = null;

            this._layoutType = BX.Crm.EntityEditorClientLayoutType.undefined;
            this._visibleClientFields = null;
            this._enableLayoutTypeChange = false;
            this._enableQuickEdit = null;

            this._companyNameChangeHandler = BX.delegate(
                this.onCompanyNameChange,
                this
            );
            this._companyChangeHandler = BX.delegate(
                this.onCompanyChange,
                this
            );
            this._companyDeletionHandler = BX.delegate(
                this.onCompanyDelete,
                this
            );
            this._companyResetHandler = BX.delegate(this.onCompanyReset, this);
            this._contactNameChangeHandler = BX.delegate(
                this.onContactNameChange,
                this
            );
            this._contactChangeHandler = BX.delegate(
                this.onContactChange,
                this
            );
            this._contactDeletionHandler = BX.delegate(
                this.onContactDelete,
                this
            );
            this._contactResetHandler = BX.delegate(this.onContactReset, this);
            this._requisiteChangeHandler = BX.delegate(
                this.onRequisiteChange,
                this
            );
            this._multifieldChangeHandler = BX.delegate(
                this.onMultifieldChange,
                this
            );
            this._changeRequisiteControlData = {};
        };

        BX.extend(BX.MyWebstor.HMS.Fields.ClientLight, BX.UI.EntityEditorField);

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.doInitialize =
            function () {
                BX.MyWebstor.HMS.Fields.ClientLight.superclass.doInitialize.apply(
                    this
                );
                this._map = this._schemeElement.getDataObjectParam("map", {});

                this.initializeFromModel();
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.initializeFromModel =
            function () {
                this._companyInfos = BX.Collection.create();
                this._contactInfos = BX.Collection.create();

                this._info = this._model.getSchemeField(
                    this._schemeElement,
                    "info",
                    {}
                );
                this.initializeEntityInfos(
                    BX.prop.getArray(this._info, "COMPANY_DATA", []),
                    this._companyInfos
                );
                this.initializeEntityInfos(
                    BX.prop.getArray(this._info, "CONTACT_DATA", []),
                    this._contactInfos
                );

                this._enableCompanyMultiplicity =
                    this._schemeElement.getDataBooleanParam(
                        "enableCompanyMultiplicity",
                        false
                    );

                var loaders = this._schemeElement.getDataObjectParam(
                    "loaders",
                    {}
                );
                this._primaryLoaderConfig = BX.prop.getObject(
                    loaders,
                    "primary",
                    {}
                );
                this._secondaryLoaderConfig = BX.prop.getObject(
                    loaders,
                    "secondary",
                    {}
                );

                //region Layout Type
                this._enableLayoutTypeChange = true;

                var fixedLayoutTypeName =
                    this._schemeElement.getDataStringParam(
                        "fixedLayoutType",
                        ""
                    );
                if (fixedLayoutTypeName !== "") {
                    var fixedLayoutType =
                        BX.Crm.EntityEditorClientLayoutType.resolveId(
                            fixedLayoutTypeName
                        );
                    if (
                        fixedLayoutType !==
                        BX.Crm.EntityEditorClientLayoutType.undefined
                    ) {
                        this._layoutType = fixedLayoutType;
                        this._enableLayoutTypeChange = false;
                    }
                }
                //endregion
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.initializeEntityInfos =
            function (sourceData, collection) {
                for (var i = 0, length = sourceData.length; i < length; i++) {
                    var info = BX.CrmEntityInfo.create(sourceData[i]);
                    if (info.getId() > 0) {
                        collection.add(info);
                    }
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.createDataElement =
            function (key, value) {
                var name = BX.prop.getString(this._map, key, "");

                if (name === "") {
                    return;
                }

                var input = BX.create("input", {
                    attrs: { name: name, type: "hidden" },
                });
                if (BX.type.isNotEmptyString(value)) {
                    input.value = value;
                }

                if (!this._dataElements) {
                    this._dataElements = {};
                }

                this._dataElements[key] = input;
                if (this._wrapper) {
                    this._wrapper.appendChild(input);
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.getMessage = function (
            name
        ) {
            // var m = BX.MyWebstor.HMS.Fields.ClientLight.messages;
            // return m.hasOwnProperty(name) ? m[name] : BX.MyWebstor.HMS.Fields.ClientLight.superclass.getMessage.apply(this, arguments);
            return (
                BX.message(name) ||
                BX.MyWebstor.HMS.Fields.ClientLight.superclass.getMessage.apply(
                    this,
                    arguments
                )
            );
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.getOwnerTypeName =
            function () {
                return this._editor.getEntityTypeName();
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.getOwnerTypeId =
            function () {
                return this._editor.getEntityTypeId();
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.getOwnerId = function () {
            return this._editor.getEntityId();
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.hasCompanies =
            function () {
                return (
                    this._companyInfos !== null &&
                    this._companyInfos.length() > 0
                );
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.hasContacts =
            function () {
                return (
                    this._contactInfos !== null &&
                    this._contactInfos.length() > 0
                );
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.addCompany = function (
            entityInfo
        ) {
            if (entityInfo instanceof BX.CrmEntityInfo) {
                if (!this._companyInfos) {
                    this._companyInfos = BX.Collection.create();
                }

                this._companyInfos.add(entityInfo);
            }
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.removeCompany = function (
            entityInfo
        ) {
            if (this._companyInfos && entityInfo instanceof BX.CrmEntityInfo) {
                this._companyInfos.remove(entityInfo);
            }
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.addContact = function (
            entityInfo
        ) {
            if (entityInfo instanceof BX.CrmEntityInfo) {
                if (!this._contactInfos) {
                    this._contactInfos = BX.Collection.create();
                }

                this._contactInfos.add(entityInfo);
            }
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.removeContact = function (
            entityInfo
        ) {
            if (this._contactInfos && entityInfo instanceof BX.CrmEntityInfo) {
                this._contactInfos.remove(entityInfo);
            }
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.hasContentToDisplay =
            function () {
                return (
                    this.hasCompanies() ||
                    (this._contactInfos !== null &&
                        this._contactInfos.length() > 0)
                );
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.getContentWrapper =
            function () {
                return this._innerWrapper;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.getModeSwitchType =
            function (mode) {
                var result = BX.UI.EntityEditorModeSwitchType.common;
                if (mode === BX.UI.EntityEditorMode.edit) {
                    result |=
                        BX.UI.EntityEditorModeSwitchType.button |
                        BX.UI.EntityEditorModeSwitchType.content;
                }
                return result;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.reset = function () {
            this.initializeFromModel();
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.rollback = function () {
            if (this.isChanged()) {
                this.initializeFromModel();
            }
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.getEntityCreateUrl =
            function (entityTypeName) {
                return this._editor.getEntityCreateUrl(entityTypeName);
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.getEntityEditUrl =
            function (entityTypeName, entityId) {
                return this._editor.getEntityEditUrl(entityTypeName, entityId);
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.doSetMode = function (
            mode
        ) {
            this.rollback();
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.doPrepareContextMenuItems =
            function (menuItems) {
                menuItems.push({ delimiter: true });

                if (this._enableLayoutTypeChange) {
                    var layoutType = this.getLayoutType();
                    if (
                        layoutType ===
                            BX.Crm.EntityEditorClientLayoutType
                                .companyContact ||
                        layoutType ===
                            BX.Crm.EntityEditorClientLayoutType.contactCompany
                    ) {
                        menuItems.push({
                            value: "set_layout_contact",
                            text: this.getMessage("clientLightDisableCompany"),
                        });

                        menuItems.push({
                            value: "set_layout_company",
                            text: this.getMessage("clientLightDisableContact"),
                        });
                    } else if (
                        layoutType ===
                        BX.Crm.EntityEditorClientLayoutType.company
                    ) {
                        menuItems.push({
                            value: "set_layout_company_contact",
                            text: this.getMessage("clientLightEnableContact"),
                        });
                    } else if (
                        layoutType ===
                        BX.Crm.EntityEditorClientLayoutType.contact
                    ) {
                        menuItems.push({
                            value: "set_layout_contact_company",
                            text: this.getMessage("clientLightEnableCompany"),
                        });
                    }
                    if (this.isClientFieldVisible("ADDRESS")) {
                        menuItems.push({
                            value: "hide_client_field_address",
                            text: this.getMessage("clientLightDisableAddress"),
                        });
                    } else {
                        menuItems.push({
                            value: "show_client_field_address",
                            text: this.getMessage("clientLightEnableAddress"),
                        });
                    }
                    if (this.isClientFieldVisible("REQUISITES")) {
                        menuItems.push({
                            value: "hide_client_field_requisites",
                            text: this.getMessage(
                                "clientLightDisableRequisites"
                            ),
                        });
                    } else {
                        menuItems.push({
                            value: "show_client_field_requisites",
                            text: this.getMessage(
                                "clientLightEnableRequisites"
                            ),
                        });
                    }

                    if (
                        layoutType ===
                        BX.Crm.EntityEditorClientLayoutType.companyContact
                    ) {
                        menuItems.push({ delimiter: true });
                        menuItems.push({
                            value: "set_layout_contact_company",
                            text: this.getMessage(
                                "clientLightDisplayContactAtFirst"
                            ),
                        });
                    } else if (
                        layoutType ===
                        BX.Crm.EntityEditorClientLayoutType.contactCompany
                    ) {
                        menuItems.push({ delimiter: true });
                        menuItems.push({
                            value: "set_layout_company_contact",
                            text: this.getMessage(
                                "clientLightDisplayCompanyAtFirst"
                            ),
                        });
                    }

                    menuItems.push({ delimiter: true });
                }

                if (this.isQuickEditEnabled()) {
                    menuItems.push({
                        value: "disable_quick_edit",
                        text: this.getMessage("clientLightDisableQuickEdit"),
                    });
                } else {
                    menuItems.push({
                        value: "enable_quick_edit",
                        text: this.getMessage("clientLightEnableQuickEdit"),
                    });
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.processContextMenuCommand =
            function (e, command) {
                if (command === "set_layout_contact_company") {
                    window.setTimeout(
                        function () {
                            this.setLayoutType(
                                BX.Crm.EntityEditorClientLayoutType
                                    .contactCompany
                            );
                        }.bind(this),
                        100
                    );
                } else if (command === "set_layout_company_contact") {
                    window.setTimeout(
                        function () {
                            this.setLayoutType(
                                BX.Crm.EntityEditorClientLayoutType
                                    .companyContact
                            );
                        }.bind(this),
                        100
                    );
                } else if (command === "set_layout_contact") {
                    window.setTimeout(
                        function () {
                            this.setLayoutType(
                                BX.Crm.EntityEditorClientLayoutType.contact
                            );
                        }.bind(this),
                        100
                    );
                } else if (command === "set_layout_company") {
                    window.setTimeout(
                        function () {
                            this.setLayoutType(
                                BX.Crm.EntityEditorClientLayoutType.company
                            );
                        }.bind(this),
                        100
                    );
                } else if (command === "hide_client_field_address") {
                    window.setTimeout(
                        function () {
                            this.setClientFieldVisible("ADDRESS", false);
                        }.bind(this),
                        100
                    );
                } else if (command === "show_client_field_address") {
                    window.setTimeout(
                        function () {
                            this.setClientFieldVisible("ADDRESS", true);
                        }.bind(this),
                        100
                    );
                } else if (command === "hide_client_field_requisites") {
                    window.setTimeout(
                        function () {
                            this.setClientFieldVisible("REQUISITES", false);
                        }.bind(this),
                        100
                    );
                } else if (command === "show_client_field_requisites") {
                    window.setTimeout(
                        function () {
                            this.setClientFieldVisible("REQUISITES", true);
                        }.bind(this),
                        100
                    );
                } else if (command === "disable_quick_edit") {
                    this.enableQuickEdit(false);
                } else if (command === "enable_quick_edit") {
                    this.enableQuickEdit(true);
                }
                BX.MyWebstor.HMS.Fields.ClientLight.superclass.processContextMenuCommand.apply(
                    this,
                    arguments
                );
            };

        //region Quick Edit
        BX.MyWebstor.HMS.Fields.ClientLight.prototype.isQuickEditEnabled =
            function () {
                return false;
                if (this._enableQuickEdit === null) {
                    this._enableQuickEdit =
                        this._editor.getConfigOption("enableQuickEdit", "Y") ===
                        "Y";
                }
                return this._enableQuickEdit;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.enableQuickEdit =
            function (enable) {
                enable = !!enable;

                if (this._enableQuickEdit === null) {
                    this._enableQuickEdit =
                        this._editor.getConfigOption("enableQuickEdit", "Y") ===
                        "Y";
                }

                if (this._enableQuickEdit === enable) {
                    return;
                }

                this._enableQuickEdit = enable;
                this._editor.setConfigOption(
                    "enableQuickEdit",
                    enable ? "Y" : "N"
                );

                var i, length;
                if (this._companySearchBoxes) {
                    for (
                        i = 0, length = this._companySearchBoxes.length;
                        i < length;
                        i++
                    ) {
                        this._companySearchBoxes[i].enableQuickEdit(enable);
                    }
                }

                if (this._contactSearchBoxes) {
                    for (
                        i = 0, length = this._contactSearchBoxes.length;
                        i < length;
                        i++
                    ) {
                        this._contactSearchBoxes[i].enableQuickEdit(enable);
                    }
                }
            };

        //endregion
        //region Layout Type
        BX.MyWebstor.HMS.Fields.ClientLight.prototype.isCompanyEnabled =
            function () {
                var layoutType = this.getLayoutType();
                return (
                    layoutType ===
                        BX.Crm.EntityEditorClientLayoutType.contactCompany ||
                    layoutType ===
                        BX.Crm.EntityEditorClientLayoutType.companyContact ||
                    layoutType === BX.Crm.EntityEditorClientLayoutType.company
                );
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.isContactEnabled =
            function () {
                var layoutType = this.getLayoutType();
                return (
                    layoutType ===
                        BX.Crm.EntityEditorClientLayoutType.contactCompany ||
                    layoutType ===
                        BX.Crm.EntityEditorClientLayoutType.companyContact ||
                    layoutType === BX.Crm.EntityEditorClientLayoutType.contact
                );
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.getLayoutType =
            function () {
                if (this._layoutType <= 0) {
                    var str = this._editor.getConfigOption("client_layout", "");
                    var num = parseInt(str);
                    if (isNaN(num) || num <= 0) {
                        num =
                            BX.Crm.EntityEditorClientLayoutType.companyContact;
                    }
                    this._layoutType = num;
                }
                return this._layoutType;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.setLayoutType = function (
            layoutType
        ) {
            if (!BX.type.isNumber(layoutType)) {
                layoutType = parseInt(layoutType);
            }

            if (isNaN(layoutType) || layoutType <= 0) {
                return;
            }

            if (layoutType === this._layoutType) {
                return;
            }

            this._layoutType = layoutType;

            this._editor.setConfigOption("client_layout", layoutType);
            this.refreshLayout();
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.loadClientVisibleFields =
            function () {
                var savedValue = this._editor.getConfigOption(
                    "client_visible_fields",
                    null
                );
                if (BX.Type.isString(savedValue)) {
                    savedValue = savedValue.split(",");
                } else {
                    savedValue = ["ADDRESS", "REQUISITES"];
                }
                return savedValue;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.isClientFieldVisible =
            function (fieldName) {
                if (!BX.Type.isArray(this._visibleClientFields)) {
                    this._visibleClientFields = this.loadClientVisibleFields();
                }
                return this._visibleClientFields.indexOf(fieldName) > -1;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.setClientFieldVisible =
            function (fieldName, visible) {
                if (!BX.Type.isArray(this._visibleClientFields)) {
                    this._visibleClientFields = this.loadClientVisibleFields();
                }
                if (
                    visible &&
                    this._visibleClientFields.indexOf(fieldName) === -1
                ) {
                    this._visibleClientFields.push(fieldName);
                }
                if (
                    !visible &&
                    this._visibleClientFields.indexOf(fieldName) > -1
                ) {
                    this._visibleClientFields.splice(
                        this._visibleClientFields.indexOf(fieldName),
                        1
                    );
                }
                this._editor.setConfigOption(
                    "client_visible_fields",
                    this._visibleClientFields.join(",")
                );
                this.refreshLayout();
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.getClientVisibleFieldsList =
            function (entityTypeName) {
                var fieldsParams =
                    this.getClientEditorFieldsParams(entityTypeName);
                var result = ["PHONE", "EMAIL"];
                if (
                    this.isClientFieldVisible("ADDRESS") &&
                    fieldsParams.hasOwnProperty("ADDRESS") &&
                    fieldsParams.ADDRESS.isHidden !== true
                ) {
                    result.push("ADDRESS");
                }
                if (
                    this.isClientFieldVisible("REQUISITES") &&
                    fieldsParams.hasOwnProperty("REQUISITES") &&
                    fieldsParams.REQUISITES.isHidden !== true
                ) {
                    result.push("REQUISITES");
                }
                return result;
            };

        //endregion
        BX.MyWebstor.HMS.Fields.ClientLight.prototype.layout = function (
            options
        ) {
            if (this._hasLayout) {
                return;
            }

            this.ensureWrapperCreated();
            this.adjustWrapper();

            if (!this.isNeedToDisplay()) {
                this.registerLayout(options);
                this._hasLayout = true;
                return;
            }

            if (this.isDragEnabled()) {
                this._wrapper.appendChild(this.createDragButton());
            }

            this._wrapper.appendChild(this.createTitleNode(this.getTitle()));

            if (!this.hasContentToDisplay() && this.isInViewMode()) {
                this._innerWrapper = BX.create("div", {
                    props: { className: "crm-entity-widget-inner" },
                    text: this.getMessage("clientLightIsEmpty"),
                });
                this._wrapper.appendChild(this._innerWrapper);
            } else {
                this._innerWrapper = BX.create("div", {
                    props: {
                        className: "crm-entity-widget-content-block-inner",
                    },
                });
                this._wrapper.appendChild(this._innerWrapper);

                var layoutType = this.getLayoutType();

                if (this.isInEditMode()) {
                    var fieldContainer = BX.create("div", {
                        props: {
                            className:
                                "crm-entity-widget-content-block-field-container",
                        },
                    });
                    this._innerWrapper.appendChild(fieldContainer);
                    this._innerContainer = BX.create("div", {
                        props: {
                            className:
                                "crm-entity-widget-content-block-field-container-inner",
                        },
                    });
                    fieldContainer.appendChild(this._innerContainer);
                } else {
                    BX.addClass(
                        this._wrapper,
                        "crm-entity-widget-participants-block"
                    );
                    BX.addClass(this._innerWrapper, "crm-entity-widget-inner");
                }

                if (this.isContactEnabled() && this.isCompanyEnabled()) {
                    if (
                        layoutType ===
                        BX.Crm.EntityEditorClientLayoutType.contactCompany
                    ) {
                        this.renderContact();
                        this.renderCompany();
                    } else if (
                        layoutType ===
                        BX.Crm.EntityEditorClientLayoutType.companyContact
                    ) {
                        this.renderCompany();
                        this.renderContact();
                    }
                } else {
                    if (this.isContactEnabled()) {
                        this.renderContact();
                    }

                    if (this.isCompanyEnabled()) {
                        this.renderCompany();
                    }
                }
            }

            if (this.isContextMenuEnabled()) {
                this._wrapper.appendChild(this.createContextMenuButton());
            }

            if (this.isDragEnabled()) {
                this.initializeDragDropAbilities();
            }

            this.registerLayout(options);

            this._entityEditParams = {};
            this._hasLayout = true;
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.createAdditionalWrapperBlock =
            function () {};

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.switchToSingleEditMode =
            function (targetNode) {
                this._entityEditParams = {};

                if (
                    this.isInViewMode() &&
                    this.isQuickEditEnabled() &&
                    BX.type.isElementNode(targetNode)
                ) {
                    var isFound = false;

                    if (
                        BX.isParentForNode(
                            this._companyTitleWrapper,
                            targetNode
                        )
                    ) {
                        isFound = true;

                        this._entityEditParams["enableCompany"] = true;
                        this._entityEditParams["companyIndex"] = 0;
                    }

                    if (
                        !isFound &&
                        BX.isParentForNode(
                            this._contactTitleWrapper,
                            targetNode
                        )
                    ) {
                        isFound = true;

                        this._entityEditParams["enableContact"] = true;
                        this._entityEditParams["contactIndex"] = 0;
                    }

                    var i, length;
                    if (!isFound && this._companyPanels !== null) {
                        for (
                            i = 0, length = this._companyPanels.length;
                            i < length;
                            i++
                        ) {
                            if (
                                this._companyPanels[i].checkOwership(targetNode)
                            ) {
                                isFound = true;

                                this._entityEditParams["enableCompany"] = true;
                                this._entityEditParams["companyIndex"] = i;

                                break;
                            }
                        }
                    }

                    if (!isFound && this._contactPanels !== null) {
                        for (
                            i = 0, length = this._contactPanels.length;
                            i < length;
                            i++
                        ) {
                            if (
                                this._contactPanels[i].checkOwership(targetNode)
                            ) {
                                isFound = true;

                                this._entityEditParams["enableContact"] = true;
                                this._entityEditParams["contactIndex"] = i;

                                break;
                            }
                        }
                    }

                    if (
                        !BX.prop.getBoolean(
                            this._entityEditParams,
                            "enableCompany",
                            false
                        ) &&
                        !BX.prop.getBoolean(
                            this._entityEditParams,
                            "enableContact",
                            false
                        )
                    ) {
                        var layoutType = this.getLayoutType();
                        if (
                            layoutType ===
                                BX.Crm.EntityEditorClientLayoutType.contact ||
                            layoutType ===
                                BX.Crm.EntityEditorClientLayoutType
                                    .contactCompany
                        ) {
                            this._entityEditParams["enableContact"] = true;
                            this._entityEditParams["contactIndex"] = 0;
                        } else if (
                            layoutType ===
                                BX.Crm.EntityEditorClientLayoutType.company ||
                            layoutType ===
                                BX.Crm.EntityEditorClientLayoutType
                                    .companyContact
                        ) {
                            this._entityEditParams["enableCompany"] = true;
                        }
                    }
                }
                BX.MyWebstor.HMS.Fields.ClientLight.superclass.switchToSingleEditMode.apply(
                    this,
                    arguments
                );
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.getEntityInitialMode =
            function (entityTypeId) {
                if (!this.isQuickEditEnabled()) {
                    return BX.Crm.EntityEditorClientMode.select;
                }

                if (
                    !this.checkModeOption(
                        BX.UI.EntityEditorModeOptions.individual
                    )
                ) {
                    return BX.Crm.EntityEditorClientMode.edit;
                }

                return BX.prop.getBoolean(
                    this._entityEditParams,
                    entityTypeId === BX.CrmEntityType.enumeration.contact
                        ? "enableContact"
                        : "enableCompany",
                    false
                )
                    ? BX.Crm.EntityEditorClientMode.edit
                    : BX.Crm.EntityEditorClientMode.select;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.resolveDataTagName =
            function (entityTypeName) {
                var compoundInfos = this._schemeElement.getDataArrayParam(
                    "compound",
                    null
                );
                if (BX.type.isArray(compoundInfos)) {
                    for (
                        var i = 0, length = compoundInfos.length;
                        i < length;
                        i++
                    ) {
                        if (
                            BX.prop.getString(
                                compoundInfos[i],
                                "entityTypeName",
                                ""
                            ) === entityTypeName
                        ) {
                            return BX.prop.getString(
                                compoundInfos[i],
                                "tagName",
                                ""
                            );
                        }
                    }
                }
                return "";
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.renderContact =
            function () {
                var caption = this._schemeElement.getDataStringParam(
                    "contactLegend",
                    ""
                );
                if (caption === "") {
                    caption = BX.CrmEntityType.getCaptionByName(
                        BX.CrmEntityType.names.contact
                    );
                }

                this.removeContactAllSearchBoxes();
                this.removeContactAllPanels();
                if (this.isInEditMode()) {
                    this._contactWrapper = BX.create("div", {
                        props: {
                            className: "crm-entity-widget-content-inner-row",
                        },
                    });
                    this._innerContainer.appendChild(this._contactWrapper);

                    this._contactTitleWrapper = BX.create("div", {
                        props: {
                            className: "crm-entity-widget-content-block-title",
                        },
                        children: [
                            BX.create("span", {
                                props: {
                                    className:
                                        "crm-entity-widget-content-block-title-text",
                                },
                                text: caption,
                            }),
                        ],
                    });
                    this._contactWrapper.appendChild(this._contactTitleWrapper);

                    this._addContactButton = BX.create("span", {
                        props: {
                            className: "crm-entity-widget-actions-btn-add",
                        },
                        text: this.getMessage("clientLightAddParticipant"),
                    });
                    this._contactWrapper.appendChild(this._addContactButton);
                    BX.bind(
                        this._addContactButton,
                        "click",
                        BX.delegate(this.onContactAddButtonClick, this)
                    );

                    this._contactSearchBoxes = [];
                    if (this._contactInfos.length() > 0) {
                        var mode = this.getEntityInitialMode(
                            BX.CrmEntityType.enumeration.contact
                        );
                        var defaultEditIndex =
                            this._contactInfos.length() > 1 ? -2 : -1;
                        var editIndex =
                            mode === BX.Crm.EntityEditorClientMode.edit
                                ? BX.prop.getInteger(
                                      this._entityEditParams,
                                      "contactIndex",
                                      defaultEditIndex
                                  )
                                : defaultEditIndex;

                        for (
                            var i = 0, length = this._contactInfos.length();
                            i < length;
                            i++
                        ) {
                            var currentMode = mode;
                            if (
                                currentMode ===
                                    BX.Crm.EntityEditorClientMode.edit &&
                                !(editIndex === i || editIndex === -1)
                            ) {
                                currentMode =
                                    BX.Crm.EntityEditorClientMode.select;
                            }

                            this.addContactSearchBox(
                                this.createContactSearchBox({
                                    entityInfo: this._contactInfos.get(i),
                                    mode: currentMode,
                                })
                            );
                        }
                    } else {
                        this.addContactSearchBox(this.createContactSearchBox());
                    }
                } else if (
                    this._contactInfos.length() > 0 &&
                    this.isContactEnabled()
                ) {
                    this._contactTitleWrapper = BX.create("div", {
                        props: {
                            className: "crm-entity-widget-content-block-title",
                        },
                    });

                    var innerTitleWrapper = BX.create("span", {
                        props: {
                            className:
                                "crm-entity-widget-content-subtitle-text",
                        },
                        children: [BX.create("span", { text: caption })],
                    });
                    this._contactTitleWrapper.appendChild(innerTitleWrapper);

                    if (!this.isReadOnly()) {
                        innerTitleWrapper.appendChild(
                            BX.create("span", {
                                props: {
                                    className:
                                        "crm-entity-card-widget-title-edit-icon",
                                },
                            })
                        );
                    }

                    var innerWrapperContainer = BX.create("div", {
                        props: {
                            className:
                                "crm-entity-widget-content-block-inner-container",
                        },
                    });

                    this._innerWrapper.appendChild(innerWrapperContainer);
                    innerWrapperContainer.appendChild(
                        this._contactTitleWrapper
                    );

                    var dataTagName = this.resolveDataTagName(
                        BX.CrmEntityType.names.contact
                    );
                    if (dataTagName === "") {
                        dataTagName = "CONTACT_IDS";
                    }

                    var additionalBlock = BX.create("div", {
                        props: { className: "crm-entity-widget-before-action" },
                        attrs: { "data-field-tag": dataTagName },
                    });
                    innerWrapperContainer.appendChild(additionalBlock);

                    this._contactPanels = [];
                    for (
                        i = 0, length = this._contactInfos.length();
                        i < length;
                        i++
                    ) {
                        var contactInfo = this._contactInfos.get(i);

                        var useExternalRequisiteBinding =
                            this._schemeElement.getDataBooleanParam(
                                "useExternalRequisiteBinding",
                                false
                            );
                        var contactSettings = {
                            editor: this,
                            entityInfo: contactInfo,
                            loaderConfig: BX.prop.getObject(
                                this._primaryLoaderConfig,
                                contactInfo.getTypeName(),
                                null
                            ),
                            enableEntityTypeCaption: false,
                            enableRequisite: false,
                            enableCommunications:
                                this._editor.areCommunicationControlsEnabled(),
                            enableAddress: this.isClientFieldVisible("ADDRESS"),
                            enableTooltip:
                                this._schemeElement.getDataBooleanParam(
                                    "enableTooltip",
                                    true
                                ) && this.isClientFieldVisible("REQUISITES"),
                            mode: BX.UI.EntityEditorMode.view,
                            clientEditorFieldsParams:
                                this.getClientEditorFieldsParams(
                                    contactInfo.getTypeName()
                                ),
                            canChangeDefaultRequisite:
                                !useExternalRequisiteBinding,
                            useExternalRequisiteBinding:
                                useExternalRequisiteBinding,
                        };

                        //HACK: Enable requisite selection due to editor is not support it.
                        var enableRequisite =
                            i === 0 &&
                            !(this.isCompanyEnabled() && this.hasCompanies());
                        if (enableRequisite) {
                            contactSettings["enableRequisite"] = true;
                            contactSettings["requisiteBinding"] =
                                this._model.getField("REQUISITE_BINDING", {});
                            contactSettings["requisiteSelectUrl"] =
                                this._editor.getEntityRequisiteSelectUrl(
                                    BX.CrmEntityType.names.contact,
                                    contactInfo.getId()
                                );
                            contactSettings["requisiteMode"] =
                                BX.UI.EntityEditorMode.edit;
                        }
                        if (useExternalRequisiteBinding) {
                            contactSettings["canChangeDefaultRequisite"] =
                                enableRequisite;
                        }
                        var categoryParams = BX.prop.getObject(
                            this._schemeElement.getDataObjectParam(
                                "categoryParams",
                                {}
                            ),
                            BX.CrmEntityType.enumeration.contact,
                            {}
                        );
                        contactSettings["categoryId"] = BX.prop.getInteger(
                            categoryParams,
                            "categoryId",
                            0
                        );

                        var permissionToken =
                            this._schemeElement.getDataStringParam(
                                "permissionToken",
                                null
                            );
                        if (permissionToken) {
                            contactSettings["permissionToken"] =
                                permissionToken;
                        }

                        var contactPanel = this.modifyContactPanel(
                            BX.Crm.ClientEditorEntityPanel.create(
                                this._id + "_" + contactInfo.getId().toString(),
                                contactSettings
                            )
                        );

                        this._contactPanels.push(contactPanel);
                        contactPanel.setContainer(innerWrapperContainer);
                        contactPanel.layout();

                        if (enableRequisite) {
                            contactPanel.addRequisiteChangeListener(
                                this._requisiteChangeHandler
                            );
                        }
                        contactPanel.addRequisiteListChangeListener(
                            this.onRequisiteListChange.bind(this)
                        );
                    }
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.modifyContactPanel =
            function (contactPanel) {
                contactPanel.originLayout = contactPanel.layout;
                contactPanel.layout = function () {
                    this.originLayout();
                    const communicationContainer = this._wrapper.querySelector(
                        ".crm-entity-widget-client-contact"
                    );
                    if (!communicationContainer) return;

                    const birthdate =
                        this._entityInfo.getMultiFieldsByType("BIRTHDATE") ||
                        [];
                    if (!Array.isArray(birthdate) || !birthdate.length) return;

                    communicationContainer.appendChild(
                        BX.create("div", {
                            props: {
                                className:
                                    "crm-entity-widget-client-contact-item crm-entity-widget-client-contact-birthdate",
                            },
                            text: birthdate[0]["VALUE_FORMATTED"],
                        })
                    );
                }.bind(contactPanel);

                return contactPanel;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.renderCompany =
            function () {
                var caption = this._schemeElement.getDataStringParam(
                    "companyLegend",
                    ""
                );
                if (caption === "") {
                    caption = BX.CrmEntityType.getCaptionByName(
                        BX.CrmEntityType.names.company
                    );
                }

                this.removeCompanyAllSearchBoxes();
                this.removeCompanyAllPanels();
                if (this.isInEditMode()) {
                    this._companyWrapper = BX.create("div", {
                        props: {
                            className: "crm-entity-widget-content-inner-row",
                        },
                    });
                    this._innerContainer.appendChild(this._companyWrapper);

                    this._companyTitleWrapper = BX.create("div", {
                        props: {
                            className: "crm-entity-widget-content-block-title",
                        },
                        children: [
                            BX.create("span", {
                                props: {
                                    className:
                                        "crm-entity-widget-content-block-title-text",
                                },
                                text: caption,
                            }),
                        ],
                    });
                    this._companyWrapper.appendChild(this._companyTitleWrapper);

                    if (this._enableCompanyMultiplicity) {
                        this._addCompanyButton = BX.create("span", {
                            props: {
                                className: "crm-entity-widget-actions-btn-add",
                            },
                            text: this.getMessage("clientLightAddParticipant"),
                        });
                        this._companyWrapper.appendChild(
                            this._addCompanyButton
                        );
                        BX.bind(
                            this._addCompanyButton,
                            "click",
                            BX.delegate(this.onCompanyAddButtonClick, this)
                        );
                    }

                    this._companySearchBoxes = [];
                    if (this._companyInfos.length() > 0) {
                        var mode = this.getEntityInitialMode(
                            BX.CrmEntityType.enumeration.company
                        );
                        var defaultEditIndex =
                            this._companyInfos.length() > 1 ? -2 : -1;
                        var editIndex =
                            mode === BX.Crm.EntityEditorClientMode.edit
                                ? BX.prop.getInteger(
                                      this._entityEditParams,
                                      "companyIndex",
                                      defaultEditIndex
                                  )
                                : defaultEditIndex;

                        for (
                            var i = 0, length = this._companyInfos.length();
                            i < length;
                            i++
                        ) {
                            var currentMode = mode;
                            if (
                                currentMode ===
                                    BX.Crm.EntityEditorClientMode.edit &&
                                !(editIndex === i || editIndex === -1)
                            ) {
                                currentMode =
                                    BX.Crm.EntityEditorClientMode.select;
                            }

                            this.addCompanySearchBox(
                                this.createCompanySearchBox({
                                    entityInfo: this._companyInfos.get(i),
                                    mode: currentMode,
                                })
                            );
                        }
                    } else {
                        this.addCompanySearchBox(this.createCompanySearchBox());
                    }
                } else if (
                    this.isCompanyEnabled() &&
                    this._companyInfos.length() > 0
                ) {
                    this._companyTitleWrapper = BX.create("div", {
                        props: {
                            className: "crm-entity-widget-content-block-title",
                        },
                    });

                    var innerTitleWrapper = BX.create("span", {
                        props: {
                            className:
                                "crm-entity-widget-content-subtitle-text",
                        },
                        children: [BX.create("span", { text: caption })],
                    });
                    this._companyTitleWrapper.appendChild(innerTitleWrapper);
                    if (!this.isReadOnly()) {
                        innerTitleWrapper.appendChild(
                            BX.create("span", {
                                props: {
                                    className:
                                        "crm-entity-card-widget-title-edit-icon",
                                },
                            })
                        );
                    }

                    var innerWrapperContainer = BX.create("div", {
                        props: {
                            className:
                                "crm-entity-widget-content-block-inner-container",
                        },
                    });

                    this._innerWrapper.appendChild(innerWrapperContainer);
                    innerWrapperContainer.appendChild(
                        this._companyTitleWrapper
                    );

                    var dataTagName = this.resolveDataTagName(
                        BX.CrmEntityType.names.company
                    );
                    if (dataTagName === "") {
                        dataTagName = this._enableCompanyMultiplicity
                            ? "COMPANY_IDS"
                            : "COMPANY_ID";
                    }

                    var additionalBlock = BX.create("div", {
                        props: { className: "crm-entity-widget-before-action" },
                        attrs: { "data-field-tag": dataTagName },
                    });
                    innerWrapperContainer.appendChild(additionalBlock);

                    this._companyPanels = [];
                    for (
                        i = 0, length = this._companyInfos.length();
                        i < length;
                        i++
                    ) {
                        var companyInfo = this._companyInfos.get(i);

                        var useExternalRequisiteBinding =
                            this._schemeElement.getDataBooleanParam(
                                "useExternalRequisiteBinding",
                                false
                            );
                        var companySettings = {
                            editor: this,
                            entityInfo: companyInfo,
                            loaderConfig: BX.prop.getObject(
                                this._primaryLoaderConfig,
                                companyInfo.getTypeName(),
                                null
                            ),
                            enableEntityTypeCaption: false,
                            enableRequisite: false,
                            enableCommunications:
                                this._editor.areCommunicationControlsEnabled(),
                            enableAddress: this.isClientFieldVisible("ADDRESS"),
                            enableTooltip:
                                this._schemeElement.getDataBooleanParam(
                                    "enableTooltip",
                                    true
                                ) && this.isClientFieldVisible("REQUISITES"),
                            mode: BX.UI.EntityEditorMode.view,
                            clientEditorFieldsParams:
                                this.getClientEditorFieldsParams(
                                    companyInfo.getTypeName()
                                ),
                            canChangeDefaultRequisite:
                                !useExternalRequisiteBinding,
                            useExternalRequisiteBinding:
                                useExternalRequisiteBinding,
                        };

                        //HACK: Enable requisite selection due to editor is not support it.
                        var enableRequisite = i === 0;
                        if (enableRequisite) {
                            companySettings["requisiteBinding"] =
                                this._model.getField("REQUISITE_BINDING", {});
                            companySettings["requisiteSelectUrl"] =
                                this._editor.getEntityRequisiteSelectUrl(
                                    BX.CrmEntityType.names.company,
                                    companyInfo.getId()
                                );
                            companySettings["requisiteMode"] =
                                BX.UI.EntityEditorMode.edit;
                        }
                        if (useExternalRequisiteBinding) {
                            companySettings["canChangeDefaultRequisite"] =
                                enableRequisite;
                        }
                        var categoryParams = BX.prop.getObject(
                            this._schemeElement.getDataObjectParam(
                                "categoryParams",
                                {}
                            ),
                            BX.CrmEntityType.enumeration.company,
                            {}
                        );
                        companySettings["categoryId"] = BX.prop.getInteger(
                            categoryParams,
                            "categoryId",
                            0
                        );

                        var permissionToken =
                            this._schemeElement.getDataStringParam(
                                "permissionToken",
                                null
                            );
                        if (permissionToken) {
                            companySettings["permissionToken"] =
                                permissionToken;
                        }

                        var companyPanel =
                            BX.Crm.ClientEditorEntityPanel.create(
                                this._id + "_" + companyInfo.getId().toString(),
                                companySettings
                            );

                        this._companyPanels.push(companyPanel);
                        companyPanel.setContainer(innerWrapperContainer);
                        companyPanel.layout();

                        if (enableRequisite) {
                            companyPanel.addRequisiteChangeListener(
                                this._requisiteChangeHandler
                            );
                        }
                        companyPanel.addRequisiteListChangeListener(
                            this.onRequisiteListChange.bind(this)
                        );
                    }
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.createCompanySearchBox =
            function (params) {
                var entityInfo = BX.prop.get(params, "entityInfo", null);
                if (
                    entityInfo !== null &&
                    !(entityInfo instanceof BX.CrmEntityInfo)
                ) {
                    entityInfo = null;
                }

                // var enableCreation = this._schemeElement.getDataBooleanParam("enableCreation", this._editor.canCreateCompany());
                var enableCreation = false;
                if (enableCreation) {
                    //Check if creation of company is disabled by configuration.
                    enableCreation = BX.prop.getBoolean(
                        this._schemeElement.getDataObjectParam("creation", {}),
                        BX.CrmEntityType.names.company.toLowerCase(),
                        true
                    );
                }

                var categoryParams = BX.prop.getObject(
                    this._schemeElement.getDataObjectParam(
                        "categoryParams",
                        {}
                    ),
                    BX.CrmEntityType.enumeration.company,
                    {}
                );

                return BX.Crm.EntityEditorClientSearchBox.create(this._id, {
                    entityTypeId: BX.CrmEntityType.enumeration.company,
                    entityTypeName: BX.CrmEntityType.names.company,
                    categoryId: BX.prop.getInteger(
                        categoryParams,
                        "categoryId",
                        0
                    ),
                    extraCategoryIds: BX.prop.getArray(
                        categoryParams,
                        "extraCategoryIds",
                        []
                    ),
                    entityInfo: entityInfo,
                    enableCreation: enableCreation,
                    creationLegend: this._schemeElement.getDataStringParam(
                        "creationLegend",
                        ""
                    ),
                    enableDeletion: false,
                    enableQuickEdit: this.isQuickEditEnabled(),
                    mode: BX.prop.getInteger(
                        params,
                        "mode",
                        BX.Crm.EntityEditorClientMode.select
                    ),
                    editor: this._editor,
                    loaderConfig: this._primaryLoaderConfig,
                    lastEntityInfos: this._model.getSchemeField(
                        this._schemeElement,
                        "lastCompanyInfos",
                        []
                    ),
                    container: this._companyWrapper,
                    placeholder: this.getMessage(
                        "clientLightCompanySearchPlaceholder"
                    ),
                    parentField: this,
                    clientEditorEnabled: this._schemeElement
                        .getData()
                        .hasOwnProperty("clientEditorFieldsParams"),
                    clientEditorFields: this.getClientVisibleFieldsList(
                        BX.CrmEntityType.names.company
                    ),
                    clientEditorFieldsParams: this.getClientEditorFieldsParams(
                        BX.CrmEntityType.names.company
                    ),
                    requisiteBinding: this._model.getField(
                        "REQUISITE_BINDING",
                        {}
                    ),
                    isRequired:
                        this.isRequired() || this.isRequiredByAttribute(),
                    enableMyCompanyOnly:
                        this._schemeElement.getDataBooleanParam(
                            "enableMyCompanyOnly",
                            false
                        ),
                    enableRequisiteSelection:
                        this._schemeElement.getDataBooleanParam(
                            "enableRequisiteSelection",
                            false
                        ),
                    permissionToken: this._schemeElement.getDataStringParam(
                        "permissionToken",
                        null
                    ),
                });
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.addCompanySearchBox =
            function (searchBox, options) {
                if (!BX.type.isPlainObject(options)) {
                    options = {};
                }

                this._companySearchBoxes.push(searchBox);

                var layoutOptions = BX.prop.getObject(
                    options,
                    "layoutOptions",
                    {}
                );
                if (this._addCompanyButton) {
                    layoutOptions["anchor"] = this._addCompanyButton;
                }

                searchBox.layout(layoutOptions);

                searchBox.addResetListener(this._companyResetHandler);
                searchBox.addTitleChangeListener(
                    this._companyNameChangeHandler
                );
                searchBox.addChangeListener(this._companyChangeHandler);
                searchBox.addDeletionListener(this._companyDeletionHandler);
                searchBox.addMultifieldChangeListener(
                    this._multifieldChangeHandler
                );

                var enableDeletion = this._companySearchBoxes.length > 1;
                for (
                    var i = 0, length = this._companySearchBoxes.length;
                    i < length;
                    i++
                ) {
                    this._companySearchBoxes[i].enableDeletion(enableDeletion);
                }

                return searchBox;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.removeCompanySearchBox =
            function (searchBox) {
                var index = this.findCompanySearchBoxIndex(searchBox);
                if (index < 0) {
                    return;
                }

                searchBox.removeResetListener(this._companyResetHandler);
                searchBox.removeTitleChangeListener(
                    this._companyNameChangeHandler
                );
                searchBox.removeChangeListener(this._companyChangeHandler);
                searchBox.removeDeletionListener(this._companyDeletionHandler);
                searchBox.removeMultifieldChangeListener(
                    this._multifieldChangeHandler
                );

                searchBox.clearLayout();

                this._companySearchBoxes.splice(index, 1);

                var enableDeletion = this._companySearchBoxes.length > 1;
                for (
                    var i = 0, length = this._companySearchBoxes.length;
                    i < length;
                    i++
                ) {
                    this._companySearchBoxes[i].enableDeletion(enableDeletion);
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.findCompanySearchBoxIndex =
            function (companySearchBox) {
                for (
                    var i = 0, length = this._companySearchBoxes.length;
                    i < length;
                    i++
                ) {
                    if (companySearchBox === this._companySearchBoxes[i]) {
                        return i;
                    }
                }
                return -1;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.createContactSearchBox =
            function (params) {
                var entityInfo = BX.prop.get(params, "entityInfo", null);
                if (
                    entityInfo !== null &&
                    !(entityInfo instanceof BX.CrmEntityInfo)
                ) {
                    entityInfo = null;
                }

                // var enableCreation = this._schemeElement.getDataBooleanParam("enableCreation", this._editor.canCreateContact());
                var enableCreation = true;
                if (enableCreation) {
                    //Check if creation of contact is disabled by configuration.
                    enableCreation = BX.prop.getBoolean(
                        this._schemeElement.getDataObjectParam("creation", {}),
                        BX.CrmEntityType.names.contact.toLowerCase(),
                        true
                    );
                }

                var enableRequisiteSelection =
                    this._schemeElement.getDataBooleanParam(
                        "enableRequisiteSelection",
                        false
                    ) &&
                    this._contactSearchBoxes.length === 0 &&
                    (!this._companyInfos || this._companyInfos.length() === 0);
                var categoryParams = BX.prop.getObject(
                    this._schemeElement.getDataObjectParam(
                        "categoryParams",
                        {}
                    ),
                    BX.CrmEntityType.enumeration.contact,
                    {}
                );

                return BX.Crm.EntityEditorClientSearchBox.create(this._id, {
                    entityTypeId: BX.CrmEntityType.enumeration.contact,
                    entityTypeName: BX.CrmEntityType.names.contact,
                    categoryId: BX.prop.getInteger(
                        categoryParams,
                        "categoryId",
                        0
                    ),
                    extraCategoryIds: BX.prop.getArray(
                        categoryParams,
                        "extraCategoryIds",
                        []
                    ),
                    entityInfo: entityInfo,
                    enableCreation: enableCreation,
                    creationLegend: this._schemeElement.getDataStringParam(
                        "creationLegend",
                        ""
                    ),
                    enableDeletion: BX.prop.getBoolean(
                        params,
                        "enableDeletion",
                        true
                    ),
                    enableQuickEdit: this.isQuickEditEnabled(),
                    mode: BX.prop.getInteger(
                        params,
                        "mode",
                        BX.Crm.EntityEditorClientMode.select
                    ),
                    editor: this._editor,
                    loaderConfig: this._primaryLoaderConfig,
                    lastEntityInfos: this._model.getSchemeField(
                        this._schemeElement,
                        "lastContactInfos",
                        []
                    ),
                    container: this._contactWrapper,
                    placeholder: this.getMessage(
                        "clientLightContactSearchPlaceholder"
                    ),
                    parentField: this,
                    clientEditorEnabled: this._schemeElement
                        .getData()
                        .hasOwnProperty("clientEditorFieldsParams"),
                    clientEditorFields: this.getClientVisibleFieldsList(
                        BX.CrmEntityType.names.contact
                    ),
                    clientEditorFieldsParams: this.getClientEditorFieldsParams(
                        BX.CrmEntityType.names.contact
                    ),
                    requisiteBinding: this._model.getField(
                        "REQUISITE_BINDING",
                        {}
                    ),
                    isRequired:
                        this.isRequired() || this.isRequiredByAttribute(),
                    enableRequisiteSelection: enableRequisiteSelection,
                    permissionToken: this._schemeElement.getDataStringParam(
                        "permissionToken",
                        null
                    ),
                });
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.addContactSearchBox =
            function (searchBox, options) {
                if (!BX.type.isPlainObject(options)) {
                    options = {};
                }

                this._contactSearchBoxes.push(searchBox);

                var layoutOptions = BX.prop.getObject(
                    options,
                    "layoutOptions",
                    {}
                );
                if (this._addContactButton) {
                    layoutOptions["anchor"] = this._addContactButton;
                }

                searchBox.layout(layoutOptions);

                searchBox._searchControl.searchAction =
                    "mywebstor:hms.entity.search";
                searchBox._searchControl.originGetItemNodeList =
                    searchBox._searchControl.getItemNodeList;
                searchBox._searchControl.getItemNodeList = function () {
                    var result = this.originGetItemNodeList();

                    this.getItems().forEach(function (item) {
                        var attrs = BX.prop.getObject(item, "attributes", {});

                        var birthdate = BX.prop.getString(
                            attrs,
                            "birthdate",
                            ""
                        );

                        var contactInfoNode = item.node.querySelector(
                            ".ui-dropdown-contact-info"
                        );
                        if (!contactInfoNode || !birthdate) return;

                        contactInfoNode.append(
                            BX.create("div", {
                                attrs: {
                                    className:
                                        "ui-dropdown-contact-info-item ui-dropdown-item-web",
                                },
                                text: birthdate,
                            })
                        );
                    });

                    return result;
                }.bind(searchBox._searchControl);

                searchBox.addResetListener(this._contactResetHandler);
                searchBox.addTitleChangeListener(
                    this._contactNameChangeHandler
                );
                searchBox.addChangeListener(this._contactChangeHandler);
                searchBox.addDeletionListener(this._contactDeletionHandler);
                searchBox.addMultifieldChangeListener(
                    this._multifieldChangeHandler
                );

                var enableDeletion = this._contactSearchBoxes.length > 1;
                for (
                    var i = 0, length = this._contactSearchBoxes.length;
                    i < length;
                    i++
                ) {
                    this._contactSearchBoxes[i].enableDeletion(enableDeletion);
                }

                return searchBox;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.removeContactSearchBox =
            function (searchBox) {
                var index = this.findContactSearchBoxIndex(searchBox);
                if (index < 0) {
                    return;
                }
                var isNeedToEnableRequisiteSelectionOnFirstContact =
                    index === 0 &&
                    searchBox._enableRequisiteSelection &&
                    this._contactSearchBoxes[1];

                searchBox.removeResetListener(this._contactResetHandler);
                searchBox.removeTitleChangeListener(
                    this._contactNameChangeHandler
                );
                searchBox.removeChangeListener(this._contactChangeHandler);
                searchBox.removeDeletionListener(this._contactDeletionHandler);
                searchBox.removeMultifieldChangeListener(
                    this._multifieldChangeHandler
                );

                searchBox.clearLayout();

                this._contactSearchBoxes.splice(index, 1);

                var enableDeletion = this._contactSearchBoxes.length > 1;
                for (
                    var i = 0, length = this._contactSearchBoxes.length;
                    i < length;
                    i++
                ) {
                    this._contactSearchBoxes[i].enableDeletion(enableDeletion);
                }
                if (isNeedToEnableRequisiteSelectionOnFirstContact) {
                    this.setRequisiteSelectionEnabledOnFirstContactSearchBox(
                        true
                    );
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.removeContactAllSearchBoxes =
            function () {
                if (BX.Type.isArray(this._contactSearchBoxes)) {
                    for (
                        var i = 0, length = this._contactSearchBoxes.length;
                        i < length;
                        i++
                    ) {
                        var searchBox = this._contactSearchBoxes[i];

                        searchBox.removeResetListener(
                            this._contactResetHandler
                        );
                        searchBox.removeTitleChangeListener(
                            this._contactNameChangeHandler
                        );
                        searchBox.removeChangeListener(
                            this._contactChangeHandler
                        );
                        searchBox.removeDeletionListener(
                            this._contactDeletionHandler
                        );
                        searchBox.removeMultifieldChangeListener(
                            this._multifieldChangeHandler
                        );

                        searchBox.clearLayout();
                    }
                }
                this._contactSearchBoxes = [];
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.removeCompanyAllSearchBoxes =
            function () {
                if (BX.Type.isArray(this._companySearchBoxes)) {
                    for (
                        var i = 0, length = this._companySearchBoxes.length;
                        i < length;
                        i++
                    ) {
                        var searchBox = this._companySearchBoxes[i];

                        searchBox.removeResetListener(
                            this._companyResetHandler
                        );
                        searchBox.removeTitleChangeListener(
                            this._companyNameChangeHandler
                        );
                        searchBox.removeChangeListener(
                            this._companyChangeHandler
                        );
                        searchBox.removeDeletionListener(
                            this._companyDeletionHandler
                        );
                        searchBox.removeMultifieldChangeListener(
                            this._multifieldChangeHandler
                        );

                        searchBox.clearLayout();
                    }
                }
                this._companySearchBoxes = [];
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.removeCompanyAllPanels =
            function () {
                if (BX.Type.isArray(this._companyPanels)) {
                    for (
                        var i = 0, length = this._companyPanels.length;
                        i < length;
                        i++
                    ) {
                        var panel = this._companyPanels[i];
                        panel.clearLayout();
                    }
                }
                this._companyPanels = [];
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.removeContactAllPanels =
            function () {
                if (BX.Type.isArray(this._contactPanels)) {
                    for (
                        var i = 0, length = this._contactPanels.length;
                        i < length;
                        i++
                    ) {
                        var panel = this._contactPanels[i];
                        panel.clearLayout();
                    }
                }
                this._contactPanels = [];
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.findContactSearchBoxIndex =
            function (contactSearchBox) {
                for (
                    var i = 0, length = this._contactSearchBoxes.length;
                    i < length;
                    i++
                ) {
                    if (contactSearchBox === this._contactSearchBoxes[i]) {
                        return i;
                    }
                }
                return -1;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.save = function () {
            this._info["COMPANY_DATA"] = this.saveEntityInfos(
                this._companySearchBoxes,
                this._companyInfos
            );
            this._info["CONTACT_DATA"] = this.saveEntityInfos(
                this._contactSearchBoxes,
                this._contactInfos
            );
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.saveEntityInfos =
            function (searchBoxes, entityInfos) {
                var i, length;

                if (searchBoxes !== null) {
                    for (i = 0, length = searchBoxes.length; i < length; i++) {
                        if (searchBoxes[i].isNeedToSave()) {
                            searchBoxes[i].save();
                        }
                    }
                }

                var data = [];
                if (entityInfos !== null) {
                    var infoItems = entityInfos.getItems();
                    for (i = 0, length = infoItems.length; i < length; i++) {
                        data.push(infoItems[i].getSettings());
                    }
                }
                return data;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.validate = function (
            result
        ) {
            var isEmpty = !this.hasCompanies() && !this.hasContacts();
            var isRequired = this.isRequired() || this.isRequiredByAttribute();
            var isValid = !isRequired || !isEmpty;
            if (!isValid) {
                this.addValidationErrorToResult(result);
                return false;
            }

            var validator = BX.UI.EntityAsyncValidator.create();
            if (this.isInEditMode()) {
                var hasValidCompanies = this.validateSearchBoxes(
                    this._companySearchBoxes,
                    validator,
                    result
                );
                var hasValidContacts = this.validateSearchBoxes(
                    this._contactSearchBoxes,
                    validator,
                    result
                );
                if (!hasValidCompanies && !hasValidContacts && isRequired) {
                    this.addValidationErrorToResult(result);
                    return false;
                }
            }
            return validator.validate();
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.addValidationErrorToResult =
            function (result) {
                result.addError(
                    BX.UI.EntityValidationError.create({ field: this })
                );
                this.showRequiredFieldError(this.getContentWrapper());
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.showRequiredFieldError =
            function (anchor) {
                var requiredFieldErrorMessage =
                    this._schemeElement.getDataStringParam(
                        "requiredFieldErrorMessage",
                        ""
                    );
                if (requiredFieldErrorMessage) {
                    this.showError(requiredFieldErrorMessage, anchor);
                } else {
                    BX.MyWebstor.HMS.Fields.ClientLight.superclass.showRequiredFieldError.call(
                        this,
                        anchor
                    );
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.validateSearchBoxes =
            function (searchBoxes, validator, result) {
                var hasValidValue = false;
                var validationResult;
                if (BX.Type.isArray(searchBoxes)) {
                    for (
                        var i = 0, length = searchBoxes.length;
                        i < length;
                        i++
                    ) {
                        validationResult = searchBoxes[i].validate(result);
                        validator.addResult(validationResult);
                        if (validationResult !== false) {
                            hasValidValue = true;
                        }
                    }
                }
                return hasValidValue;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.doClearLayout =
            function () {
                this.releaseSearchBoxes(this._contactSearchBoxes);
                this.releasePanels(this._contactPanels);
                this.releaseSearchBoxes(this._companySearchBoxes);
                this.releasePanels(this._companyPanels);
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.release = function () {
            this.releaseSearchBoxes(this._contactSearchBoxes);
            this.releasePanels(this._contactPanels);
            this.releaseSearchBoxes(this._companySearchBoxes);
            this.releasePanels(this._companyPanels);
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.releaseSearchBoxes =
            function (searchBoxes) {
                if (!BX.Type.isArray(searchBoxes)) {
                    return;
                }
                for (var i = 0, length = searchBoxes.length; i < length; i++) {
                    searchBoxes[i].release();
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.releasePanels = function (
            panels
        ) {
            if (!BX.Type.isArray(panels)) {
                return;
            }
            for (var i = 0, length = panels.length; i < length; i++) {
                panels[i].release();
            }
        };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.getClientEditorFieldsParams =
            function (entityTypeName) {
                return BX.prop.getObject(
                    this._schemeElement.getDataObjectParam(
                        "clientEditorFieldsParams",
                        {}
                    ),
                    entityTypeName,
                    {}
                );
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onContactAddButtonClick =
            function (e) {
                this.addContactSearchBox(this.createContactSearchBox()).focus();
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onCompanyAddButtonClick =
            function (e) {
                if (this._enableCompanyMultiplicity) {
                    this.addCompanySearchBox(
                        this.createCompanySearchBox()
                    ).focus();
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onCompanyReset =
            function (sender, previousEntityInfo) {
                if (previousEntityInfo) {
                    this.removeCompany(previousEntityInfo);
                    this.markAsChanged();
                }

                this.setRequisiteSelectionEnabledOnFirstContactSearchBox(true);
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onCompanyNameChange =
            function (sender) {
                this.markAsChanged();
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onCompanyChange =
            function (sender, currentEntityInfo, previousEntityInfo) {
                var isChanged = false;

                if (previousEntityInfo) {
                    this.removeCompany(previousEntityInfo);
                    isChanged = true;
                }

                if (currentEntityInfo) {
                    this.addCompany(currentEntityInfo);
                    isChanged = true;
                }

                if (!isChanged) {
                    return;
                }

                this.markAsChanged();

                this.setRequisiteSelectionEnabledOnFirstContactSearchBox(false);

                if (!this._enableCompanyMultiplicity) {
                    if (currentEntityInfo.getId() > 0) {
                        var entityLoader = BX.prop.getObject(
                            this._secondaryLoaderConfig,
                            BX.CrmEntityType.names.company,
                            null
                        );

                        if (entityLoader) {
                            BX.CrmDataLoader.create(this._id, {
                                serviceUrl: entityLoader["url"],
                                action: entityLoader["action"],
                                params: {
                                    PRIMARY_TYPE_NAME:
                                        BX.CrmEntityType.names.company,
                                    PRIMARY_ID: currentEntityInfo.getId(),
                                    SECONDARY_TYPE_NAME:
                                        BX.CrmEntityType.names.contact,
                                    OWNER_TYPE_NAME: this.getOwnerTypeName(),
                                },
                            }).load(BX.delegate(this.onContactInfosLoad, this));
                        }
                    }
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onCompanyDelete =
            function (sender, currentEntityInfo) {
                if (currentEntityInfo) {
                    this._companyInfos.remove(currentEntityInfo);
                    this.markAsChanged();
                }

                this.removeCompanySearchBox(sender);
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onContactChange =
            function (sender, currentEntityInfo, previousEntityInfo) {
                var isChanged = false;

                if (previousEntityInfo) {
                    this.removeContact(previousEntityInfo);
                    isChanged = true;
                }

                if (currentEntityInfo) {
                    this.addContact(currentEntityInfo);
                    isChanged = true;
                }

                if (isChanged) {
                    this.markAsChanged();
                }

                if (!this.isQuickEditEnabled()) {
                    sender.setMode(BX.Crm.EntityEditorClientMode.select);
                    sender.adjust();
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onContactNameChange =
            function (sender) {
                this.markAsChanged();
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onContactDelete =
            function (sender, currentEntityInfo) {
                if (currentEntityInfo) {
                    this._contactInfos.remove(currentEntityInfo);
                    this.markAsChanged();
                }

                this.removeContactSearchBox(sender);
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onContactReset =
            function (sender, previousEntityInfo) {
                if (previousEntityInfo) {
                    this.removeContact(previousEntityInfo);
                    this.markAsChanged();
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onContactInfosLoad =
            function (sender, result) {
                var i, length;
                var entityInfos = [];
                var entityData = BX.type.isArray(result["ENTITY_INFOS"])
                    ? result["ENTITY_INFOS"]
                    : [];
                for (i = 0, length = entityData.length; i < length; i++) {
                    entityInfos.push(BX.CrmEntityInfo.create(entityData[i]));
                }

                this._contactInfos.removeAll();
                for (i = 0, length = entityInfos.length; i < length; i++) {
                    this._contactInfos.add(entityInfos[i]);
                }
                this.markAsChanged();

                this.removeContactAllSearchBoxes();
                if (entityInfos.length > 0) {
                    for (i = 0, length = entityInfos.length; i < length; i++) {
                        this.addContactSearchBox(
                            this.createContactSearchBox({
                                entityInfo: entityInfos[i],
                            })
                        );
                    }
                } else {
                    this.addContactSearchBox(this.createContactSearchBox());
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onRequisiteChange =
            function (sender, eventArgs) {
                if (this.isInEditMode()) {
                    this.markAsChanged();
                } else {
                    //Save immediately

                    if (
                        this._schemeElement.getDataBooleanParam(
                            "enableMyCompanyOnly",
                            false
                        )
                    ) {
                        this._changeRequisiteControlData = {
                            MC_REQUISITE_ID: BX.prop.getInteger(
                                eventArgs,
                                "requisiteId",
                                0
                            ),
                            MC_BANK_DETAIL_ID: BX.prop.getInteger(
                                eventArgs,
                                "bankDetailId",
                                0
                            ),
                            MYCOMPANY_ID:
                                this._model.getNumberField("MYCOMPANY_ID"),
                        };
                    } else {
                        this._changeRequisiteControlData = {
                            REQUISITE_ID: BX.prop.getInteger(
                                eventArgs,
                                "requisiteId",
                                0
                            ),
                            BANK_DETAIL_ID: BX.prop.getInteger(
                                eventArgs,
                                "bankDetailId",
                                0
                            ),
                        };
                    }
                    this._editor.saveControl(this);

                    this._model.setField("REQUISITE_BINDING", null, {
                        enableNotification: false,
                    });
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.prepareSaveData =
            function (data) {
                BX.MyWebstor.HMS.Fields.ClientLight.superclass.prepareSaveData.call(
                    this,
                    data
                );
                BX.mergeEx(data, this._changeRequisiteControlData);
            };

        // save changes in requisites in model
        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onRequisiteListChange =
            function (sender, eventArgs) {
                var fieldName = this._schemeElement.getDataStringParam(
                    "info",
                    ""
                );
                var data = this._model.getInitFieldValue(fieldName, {});
                var entityTypeName = BX.prop.getString(
                    eventArgs,
                    "entityTypeName",
                    ""
                );
                var entityId = BX.prop.getInteger(eventArgs, "entityId", 0);
                var requisites = BX.prop.getArray(eventArgs, "requisites", []);
                var dataType = entityTypeName + "_DATA";

                if (data.hasOwnProperty(dataType) && entityId > 0) {
                    for (var i = 0; i < data[dataType].length; i++) {
                        var entity = data[dataType][i];
                        if (entity.id == entityId) {
                            if (!entity.hasOwnProperty("advancedInfo")) {
                                entity.advancedInfo = {};
                            }
                            entity.advancedInfo.hasEditRequisiteData = true;
                            entity.advancedInfo.requisiteData = requisites;
                            data[dataType][i] = entity;
                            this._model.setInitFieldValue(fieldName, data);
                            break;
                        }
                    }
                }
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onMultifieldChange =
            function (sender) {
                this.markAsChanged();
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.prepareEntitySubmitData =
            function (searchBoxes) {
                if (!BX.type.isArray(searchBoxes)) {
                    return [];
                }

                var results = [];
                for (var i = 0, length = searchBoxes.length; i < length; i++) {
                    var entity = searchBoxes[i].getEntity();
                    if (!entity) {
                        continue;
                    }

                    var data = {};

                    var mode = searchBoxes[i].getMode();
                    if (
                        mode === BX.Crm.EntityEditorClientMode.select ||
                        (mode === BX.Crm.EntityEditorClientMode.edit &&
                            entity.getTitle() !== "")
                    ) {
                        data["id"] = entity.getId();
                    }
                    if (
                        mode === BX.Crm.EntityEditorClientMode.create ||
                        (mode === BX.Crm.EntityEditorClientMode.edit &&
                            entity.getTitle() !== "")
                    ) {
                        data["title"] = entity.getTitle();
                        data["multifields"] = entity.getMultifields();
                        data["requisites"] = entity.getRequisitesForSave();
                        data["categoryId"] = entity.getCategoryId();
                    }

                    results.push(data);
                }
                return results;
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.onBeforeSubmit =
            function () {
                if (this.getMode() === BX.UI.EntityEditorMode.view) {
                    return;
                }
                var data = {};
                if (this.isCompanyEnabled()) {
                    data["COMPANY_DATA"] = this.prepareEntitySubmitData(
                        this._companySearchBoxes
                    );
                }
                if (this.isContactEnabled()) {
                    data["CONTACT_DATA"] = this.prepareEntitySubmitData(
                        this._contactSearchBoxes
                    );
                }

                this.createDataElement("data", JSON.stringify(data));
            };

        BX.MyWebstor.HMS.Fields.ClientLight.prototype.setRequisiteSelectionEnabledOnFirstContactSearchBox =
            function (enableRequisiteSelection) {
                if (
                    this._layoutType ===
                        BX.Crm.EntityEditorClientLayoutType.companyContact ||
                    this._layoutType ===
                        BX.Crm.EntityEditorClientLayoutType.contactCompany
                ) {
                    for (
                        var index = 0;
                        index < this._contactSearchBoxes.length;
                        index++
                    ) {
                        this._contactSearchBoxes[
                            index
                        ].setSelectRequisiteSelectionEnabled(
                            index === 0 && enableRequisiteSelection
                        );
                    }
                }
            };

        if (
            typeof BX.MyWebstor.HMS.Fields.ClientLight.messages === "undefined"
        ) {
            BX.MyWebstor.HMS.Fields.ClientLight.messages = {};
        }

        BX.MyWebstor.HMS.Fields.ClientLight.create = function (id, settings) {
            var self = new BX.MyWebstor.HMS.Fields.ClientLight();
            self.initialize(id, settings);
            return self;
        };

        BX.MyWebstor.HMS.Fields.ClientLight.createEditorControl = function (
            type,
            controlId,
            settings
        ) {
            if (type !== "patient") return null;
            return BX.MyWebstor.HMS.Fields.ClientLight.create(
                controlId,
                settings
            );
        };

        controls.push({
            methodName: "patient",
            methodCb: BX.MyWebstor.HMS.Fields.ClientLight.createEditorControl,
        });
    }

    if (typeof BX.MyWebstor.HMS.Fields.EntityEditorUser === "undefined") {
        BX.MyWebstor.HMS.Fields.EntityEditorUser = function () {
            BX.UI.EntityEditorUser.superclass.constructor.apply(this);
            this._input = null;
            this._editButton = null;
            this._photoElement = null;
            this._nameElement = null;
            this._positionElement = null;
            this._selectedData = {};
            this._editButtonClickHandler = BX.delegate(
                this.onEditBtnClick,
                this
            );
            this._tagSelector = null;
        };
        BX.extend(
            BX.MyWebstor.HMS.Fields.EntityEditorUser,
            BX.UI.EntityEditorUser
        );

        BX.MyWebstor.HMS.Fields.EntityEditorUser.prototype.doInitialize =
            function () {
                BX.addCustomEvent(
                    "BX.UI.EntityEditorUser:openSelector",
                    (field, data) => {
                        if (data.id !== this.getId()) return;

                        if (!this._tagSelector) {
                            const tagSelectorOptions = {
                                id: "entity-editor-user-field-" + this.getId(),
                                multiple: false,
                                enableSearch: true,
                                entities: [{ id: "user" }],
                                events: {
                                    "Item:onSelect": (event) => {
                                        const { item: tagSelectorItem } =
                                            event.getData();

                                        const item = {
                                            entityId: tagSelectorItem.getId(),
                                            avatar: tagSelectorItem.getAvatar(),
                                            name: tagSelectorItem.getTitle(),
                                            desc: tagSelectorItem
                                                .getCustomData()
                                                .get("position"),
                                        };

                                        this.switchToSingleEditMode();
                                        this.processItemSelect({}, item);
                                    },
                                },
                                preselectedItems: [],
                            };
                            if (field.getValue())
                                tagSelectorOptions.preselectedItems.push([
                                    "user",
                                    field.getValue(),
                                ]);

                            this._tagSelector = new BX.UI.EntitySelector.Dialog(
                                tagSelectorOptions
                            );
                        }

                        this._tagSelector.setTargetNode(this._editButton);
                        this._tagSelector.show();
                    }
                );

                BX.addCustomEvent(
                    "BX.UI.EntityEditorUser:closeSelector",
                    function (data) {
                        if (data.id !== this._id || !this._tagSelector) return;

                        this._tagSelector.hide();
                    }
                );
            };

        BX.MyWebstor.HMS.Fields.EntityEditorUser.prototype.rollback =
            function () {
                if (
                    this.getValue() &&
                    this._tagSelector &&
                    this._tagSelector.getItem(["user", this.getValue()])
                ) {
                    this._tagSelector
                        .getItem(["user", this.getValue()])
                        .select(true);
                }
            };

        BX.MyWebstor.HMS.Fields.EntityEditorUser.create = function (
            id,
            settings
        ) {
            let self = new BX.MyWebstor.HMS.Fields.EntityEditorUser();
            self.initialize(id, settings);
            return self;
        };

        BX.MyWebstor.HMS.Fields.EntityEditorUser.createEditorControl =
            function (type, controlId, settings) {
                if (type !== "assignedBy") return null;
                return BX.MyWebstor.HMS.Fields.EntityEditorUser.create(
                    controlId,
                    settings
                );
            };

        controls.push({
            methodName: "assignedBy",
            methodCb:
                BX.MyWebstor.HMS.Fields.EntityEditorUser.createEditorControl,
        });
    }

    if (typeof BX.MyWebstor.HMS.Fields.ReceiveController === "undefined") {
        BX.MyWebstor.HMS.Fields.ReceiveController = function () {
            BX.MyWebstor.HMS.Fields.ReceiveController.superclass.constructor.apply(
                this
            );

            this._receive = null;

            this._inputList = null;
            this._readOnly = false;

            this._isEndReceive = false;
            this._dealsID = [];
        };
        BX.extend(
            BX.MyWebstor.HMS.Fields.ReceiveController,
            BX.UI.EntityEditorField
        );

        BX.MyWebstor.HMS.Fields.ReceiveController.prototype.doInitialize =
            function () {
                const receiveControllerModel =
                    this.getModel().getField("RECEIVE_CONTROLLER");
                this._readOnly = receiveControllerModel.READ_ONLY;

                BX.addCustomEvent(
                    "BX.UI.EntityEditor:onInit",
                    this.activate.bind(this)
                );

                this._inputList = document.createDocumentFragment();
            };

        BX.MyWebstor.HMS.Fields.ReceiveController.prototype.activate =
            function () {
                if (!this._readOnly) {
                    this.switchToSingleEditMode();
                    this.markAsChanged();
                }
            };

        BX.MyWebstor.HMS.Fields.ReceiveController.prototype.layout = function (
            options
        ) {
            if (this._hasLayout) {
                return;
            }

            this.ensureWrapperCreated();
            this.adjustWrapper();
            this.registerLayout(options);
            this._wrapper.style.margin = 0;

            this._isEndReceive = false;
            this._dealsID = [];

            this._hasLayout = true;
            return true;
        };

        BX.MyWebstor.HMS.Fields.ReceiveController.prototype.setReceive =
            function (receive) {
                this._receive = receive;
            };

        BX.MyWebstor.HMS.Fields.ReceiveController.prototype.getReceive =
            function () {
                return this._receive;
            };

        BX.MyWebstor.HMS.Fields.ReceiveController.prototype.validate =
            function (result) {
                if (!this._receive) {
                    this.goToReceiveTab();
                    result.addError(
                        BX.UI.EntityValidationError.create({ field: this })
                    );
                    return false;
                }

                const validationResult = BX.UI.EntityValidationResult.create();
                this._receive.validate(validationResult);
                if (!validationResult.getStatus()) {
                    this.goToReceiveTab();
                    result.addError(
                        BX.UI.EntityValidationError.create({ field: this })
                    );
                    return false;
                }

                return true;
            };

        BX.MyWebstor.HMS.Fields.ReceiveController.prototype.rollback =
            function () {
                if (this._receive) {
                    this._receive.rollback();
                }

                setTimeout(this.activate.bind(this), 250);
            };

        BX.MyWebstor.HMS.Fields.ReceiveController.prototype.save = function () {
            if (!this._receive) return;

            const inputs = this._receive.save(
                this._isEndReceive,
                this._dealsID
            );
            this._inputList = inputs;
        };

        BX.MyWebstor.HMS.Fields.ReceiveController.prototype.onBeforeSubmit =
            function () {
                this._wrapper.append(this._inputList);
            };

        BX.MyWebstor.HMS.Fields.ReceiveController.prototype.goToReceiveTab =
            function () {
                const instance =
                    BX.MyWebstor.HMS.Appointment.Details.getInstance();
                const tabManager = instance.tabManager;
                if (!tabManager) return;

                const tab = tabManager.findItemById("receive");
                if (!tab) return;

                if (tab.isEnabled()) {
                    if (tab.loader && !tab.loader.isLoaded()) {
                        tab.loader.load();
                    }

                    tab.manager.selectItem(tab);
                }
            };

        BX.MyWebstor.HMS.Fields.ReceiveController.create = function (
            id,
            settings
        ) {
            let self = new BX.MyWebstor.HMS.Fields.ReceiveController();
            self.initialize(id, settings);
            return self;
        };

        BX.MyWebstor.HMS.Fields.ReceiveController.createEditorControl =
            function (type, controlId, settings) {
                if (type !== "receiveController") return null;
                return BX.MyWebstor.HMS.Fields.ReceiveController.create(
                    controlId,
                    settings
                );
            };

        controls.push({
            methodName: "receiveController",
            methodCb:
                BX.MyWebstor.HMS.Fields.ReceiveController.createEditorControl,
        });
    }

    if (
        typeof BX.MyWebstor.HMS.Fields.EntityEditorMultiDatetime === "undefined"
    ) {
        BX.MyWebstor.HMS.Fields.EntityEditorMultiDatetime = function () {
            BX.MyWebstor.HMS.Fields.EntityEditorMultiDatetime.superclass.constructor.apply(
                this
            );
        };
        BX.extend(
            BX.MyWebstor.HMS.Fields.EntityEditorMultiDatetime,
            BX.UI.EntityEditorMultiDatetime
        );

        BX.MyWebstor.HMS.Fields.EntityEditorMultiDatetime.prototype.getSingleViewItem =
            function (value) {
                return BX.create("p", {
                    text: [
                        //
                        BX.date.format(
                            this.getDateFormat(),
                            BX.parseDate(value?.DATE)
                        ),
                        " ",
                        value?.TIME_FROM || "00:00",
                        "-",
                        value?.TIME_TO || "24:00",
                    ].join(""),
                });
            };
        BX.MyWebstor.HMS.Fields.EntityEditorMultiDatetime.prototype.createSingleInput =
            function (value) {
                const inputCount = this._inputContainer.children.length;
                return BX.create("div", {
                    children: [
                        BX.create("div", {
                            attrs: {
                                className:
                                    "ui-ctl ui-ctl-inline ui-ctl-w33 ui-ctl-after-icon ui-ctl-datetime field-wrap",
                            },
                            children: [
                                BX.create("div", {
                                    attrs: {
                                        className:
                                            "ui-ctl-after ui-ctl-icon-calendar",
                                    },
                                }),
                                BX.create("input", {
                                    attrs: {
                                        name:
                                            this.getName() +
                                            "[" +
                                            inputCount +
                                            "][DATE]",
                                        className: "ui-ctl-element",
                                        type: "text",
                                        value: value?.DATE || "",
                                    },
                                    events: {
                                        input: this._changeHandler,
                                        change: this._changeHandler,
                                        click: this._inputClickHandler,
                                    },
                                }),
                            ],
                        }),
                        BX.create("div", {
                            attrs: {
                                className:
                                    "ui-ctl ui-ctl-inline ui-ctl-w25 ui-ctl-after-icon ui-ctl-datetime field-wrap",
                            },
                            children: [
                                BX.create("div", {
                                    attrs: {
                                        className:
                                            "ui-ctl-after ui-ctl-icon-angle",
                                    },
                                }),
                                this.createTimeInput({
                                    attrs: {
                                        name:
                                            this.getName() +
                                            "[" +
                                            inputCount +
                                            "][TIME_FROM]",
                                        className: "ui-ctl-element",
                                        type: "text",
                                        readonly: true,
                                        value: value?.TIME_FROM || "00:00",
                                        placeholder: "с",
                                    },
                                }),
                            ],
                        }),
                        BX.create("div", {
                            attrs: {
                                className:
                                    "ui-ctl ui-ctl-inline ui-ctl-w25 ui-ctl-after-icon ui-ctl-datetime field-wrap",
                            },
                            children: [
                                BX.create("div", {
                                    attrs: {
                                        className:
                                            "ui-ctl-after ui-ctl-icon-angle",
                                    },
                                }),
                                this.createTimeInput({
                                    attrs: {
                                        name:
                                            this.getName() +
                                            "[" +
                                            inputCount +
                                            "][TIME_TO]",
                                        className: "ui-ctl-element",
                                        type: "text",
                                        readonly: true,
                                        value: value?.TIME_TO || "24:00",
                                        placeholder: "по",
                                    },
                                }),
                            ],
                        }),
                    ],
                });
            };

        BX.MyWebstor.HMS.Fields.EntityEditorMultiDatetime.prototype.createTimeInput =
            function (params) {
                const timeInput = BX.create("input", params);

                timeInput.timeControl = new BX.Calendar.Controls.TimeSelector({
                    input: timeInput,
                    onChangeCallback: (data) => {
                        timeInput.timeControl.selectContol.setValue({
                            value: data,
                        });
                        timeInput.value = data.trim();
                        this._changeHandler();
                    },
                });
                timeInput.timeControl.valueList.push({
                    value: 1440,
                    label: "24:00",
                });

                return timeInput;
            };

        BX.MyWebstor.HMS.Fields.EntityEditorMultiDatetime.create = function (
            id,
            settings
        ) {
            let self = new BX.MyWebstor.HMS.Fields.EntityEditorMultiDatetime();
            self.initialize(id, settings);
            return self;
        };

        BX.MyWebstor.HMS.Fields.EntityEditorMultiDatetime.createEditorControl =
            function (type, controlId, settings) {
                if (type !== "multidatetimerange") return null;
                return BX.MyWebstor.HMS.Fields.EntityEditorMultiDatetime.create(
                    controlId,
                    settings
                );
            };

        controls.push({
            methodName: "multidatetimerange",
            methodCb:
                BX.MyWebstor.HMS.Fields.EntityEditorMultiDatetime
                    .createEditorControl,
        });
    }

    if (typeof BX.MyWebstor.HMS.Fields.ResourceBooking === "undefined") {
        BX.MyWebstor.HMS.Fields.ResourceBooking = function () {
            BX.MyWebstor.HMS.Fields.ResourceBooking.superclass.constructor.apply(
                this
            );
            this._input = null;
            this._innerWrapper = null;

            this._entity = null;
            this._multiple = null;
            this._tagSelectorID = null;
            this._tagSelector = null;
        };

        BX.extend(
            BX.MyWebstor.HMS.Fields.ResourceBooking,
            BX.UI.EntityEditorField
        );

        BX.MyWebstor.HMS.Fields.ResourceBooking.prototype.layout = function(options) {
            
        }
    }

    if (typeof BX.UI.EntityEditorControlFactory !== "undefined") {
        controls.forEach(({ methodName, methodCb }) => {
            BX.UI.EntityEditorControlFactory.registerFactoryMethod(
                methodName,
                methodCb
            );
        });
    } else {
        BX.addCustomEvent(
            "BX.UI.EntityEditorControlFactory:onInitialize",
            (params, eventArgs) => {
                controls.forEach(({ methodName, methodCb }) => {
                    eventArgs.methods[methodName] = methodCb;
                });
            }
        );
    }
})();
