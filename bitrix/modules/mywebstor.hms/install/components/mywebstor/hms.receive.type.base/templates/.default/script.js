BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Receive.Base");

    BX.MyWebstor.HMS.Receive.Base = function ({ entityEditorID, ID }) {
        var entityEditor = BX.UI.EntityEditor.get(entityEditorID);
        if (!entityEditor) return;

        this.entityEditor = entityEditor;
        this.ID = ID;
        this.savePopup = null;
        this.savePopupSaveButton = null;
        this.savePopupSaveWithoutButton = null;

        this.defaultEditor = BX.UI.EntityEditor.defaultInstance;
        this.initToolPanel();

        this.receiveController =
            this.defaultEditor.getControlById("RECEIVE_CONTROLLER");
        if (!this.receiveController) return;

        this.receiveController.setReceive(this);
    };

    BX.MyWebstor.HMS.Receive.Base.prototype.initToolPanel = function () {
        if (this.entityEditor.isReadOnly()) return;

        this.defaultEditor._isToolPanelAlwaysVisible = true;
        this.defaultEditor.showToolPanel();

        const toolPanel = this.defaultEditor._toolPanel;
        const buttonProps = {
            ACTION_ID: "SAVE_RECEIVE",
            CLASS: "ui-btn-light-border",
            ID: "SAVE_RECEIVE",
            TEXT: BX.message(
                "HMS_RECEIVE_TYPE_BASE_TOOL_PANEL_SAVE_RECEIVE_BUTTON"
            ),
        };
        toolPanel._customButtons[buttonProps.ID] = BX.create("button", {
            props: {
                className: ["ui-btn", buttonProps.CLASS || ""]
                    .filter((className) => className)
                    .join(" "),
                id: "ui-entity-section-control-" + buttonProps.ID,
            },
            text: BX.util.htmlspecialchars(buttonProps.TEXT),
            events: {
                click: () => {
                    this.saveReceive();
                },
            },
            dataset: {
                actionId: buttonProps.ACTION_ID,
            },
        });
        toolPanel._buttonsOrder.EDIT.splice(1, 0, buttonProps.ACTION_ID);
        toolPanel._wrapper.remove();
        toolPanel.layout();
    };

    BX.MyWebstor.HMS.Receive.Base.prototype.validate = function (
        validationResult
    ) {
        this.entityEditor.validate(validationResult);
    };

    BX.MyWebstor.HMS.Receive.Base.prototype.rollback = function () {
        this.entityEditor.rollback();
        this.entityEditor.refreshLayout();
    };

    BX.MyWebstor.HMS.Receive.Base.prototype.save = function (
        isEndReceive = false,
        dealsID = []
    ) {
        const inputs = document.createDocumentFragment();

        const allControls = this.entityEditor.getAllControls();
        allControls.forEach((control) => {
            control.save();

            const inputClone = control._input.cloneNode(true);
            inputClone.name = "RECEIVE[" + inputClone.name + "]";

            inputs.append(inputClone);
        });

        if (isEndReceive) {
            const inputEnd = BX.create("input", {
                props: {
                    type: "hidden",
                    name: "RECEIVE[END_RECEIVE]",
                    value: "Y",
                },
                attrs: {
                    value: "Y",
                },
            });

            inputs.append(inputEnd);

            dealsID.forEach((dealID) => {
                const inputDeal = BX.create("input", {
                    props: {
                        type: "hidden",
                        name: "RECEIVE[DEAL_ID][]",
                        value: dealID,
                    },
                    attrs: {
                        value: dealID,
                    },
                });

                inputs.append(inputDeal);
            });
        }

        return inputs;
    };

    BX.MyWebstor.HMS.Receive.Base.prototype.saveReceive = function () {
        const validateResult = BX.UI.EntityValidationResult.create();
        this.receiveController.validate(validateResult);
        if (!validateResult.getStatus()) return;

        if (!this.savePopup) {
            this.savePopupSaveButton = new BX.PopupWindowButton({
                text: BX.message("HMS_RECEIVE_TYPE_BASE_POPUP_SAVE_BUTTON"),
                className: "ui-btn ui-btn-success ui-btn-disabled",
                events: {
                    click: () => {
                        if (
                            this.savePopupSaveButton.buttonNode.classList.contains(
                                "ui-btn-disabled"
                            )
                        )
                            return;

                        const tagSelector = this.savePopup.tagSelector;
                        if (!tagSelector) return this.savePopup.close();

                        const dealsID = tagSelector
                            .getTags()
                            .map((tag) => tag.getId());

                        this.receiveController._isEndReceive = true;
                        this.receiveController._dealsID = dealsID;
                        this.defaultEditor.save();
                        this.savePopup.close();
                    },
                },
            });
            this.savePopupSaveWithoutButton = new BX.PopupWindowButton({
                text: BX.message(
                    "HMS_RECEIVE_TYPE_BASE_POPUP_SAVE_WITHOUT_BUTTON"
                ),
                className: "ui-btn ui-btn-success",
                events: {
                    click: () => {
                        this.receiveController._isEndReceive = true;
                        this.defaultEditor.save();
                        this.savePopup.close();
                    },
                },
            });
            this.savePopup = new BX.PopupWindow("hms-base-receive-save", null, {
                autoHide: true,
                overlay: 0.3,
                minWidth: 400,
                maxWidth: 800,
                closeByEsc: true,
                titleBar: {
                    content: BX.create("span", {
                        props: { className: "popup-window-titlebar-text" },
                        text: BX.message("HMS_RECEIVE_TYPE_BASE_POPUP_TITLE"),
                    }),
                },
                buttons: [
                    new BX.PopupWindowButton({
                        text: BX.message(
                            "HMS_RECEIVE_TYPE_BASE_POPUP_CLOSE_BUTTON"
                        ),
                        className: "ui-btn ui-btn-light-border",
                        events: {
                            click: () => {
                                this.savePopup.close();
                            },
                        },
                    }),
                    this.savePopupSaveButton,
                    this.savePopupSaveWithoutButton,
                ],
            });
        }
        const tagSelectorWrapper = BX.create("div", {
            props: { className: "hms-entity-selector-wrapper" },
            style: { width: "500px" },
        });
        const content = BX.create("div", {
            props: { className: "hms-entity-selector" },
            children: [
                BX.create("div", {
                    props: { className: "hms-entity-selector-text" },
                    text: BX.message(
                        "HMS_RECEIVE_TYPE_BASE_TAG_SELECTOR_TITLE"
                    ),
                }),
                tagSelectorWrapper,
            ],
        });
        const tagSelector = new BX.UI.EntitySelector.TagSelector({
            id: "hms-base-receive-deal-tag-selector",
            multiple: false,
            readonly: false,
            placeholder: "",
            textBoxWidth: "100%",
            addButtonCaption: BX.message(
                "HMS_RECEIVE_TYPE_BASE_TAG_SELECTOR_ADD_BUTTON"
            ),
            showCreateButton: true,
            createButtonCaption: BX.message(
                "HMS_RECEIVE_TYPE_BASE_TAG_SELECTOR_CREATE_BUTTON"
            ),
            dialogOptions: {
                context: "hms-base-receive-deal-dialog",
                enableSearch: true,
                clearSearchOnSelect: true,
                entities: [
                    {
                        id: "deal",
                        dynamicLoad: true,
                        dynamicSearch: true,
                    },
                ],
            },
            events: {
                onCreateButtonClick: () => {
                    tagSelector.lock();

                    BX.ajax
                        .runComponentAction(
                            "mywebstor:hms.appointment.details",
                            "createDeal",
                            {
                                mode: "class",
                                data: {
                                    appointmentID: this.ID,
                                },
                            }
                        )
                        .then((result) => {
                            const dialog = tagSelector.getDialog();
                            const deals = tagSelector
                                .getTags()
                                .map((tag) => [tag.getEntityId(), tag.getId()]);
                            deals.push(["deal", result.data]);

                            dialog.setPreselectedItems(deals);
                            dialog.loadState = "UNSENT";
                            dialog.load();
                        })
                        .catch(() => {
                            tagSelector.unlock();
                        });
                },
                onAfterTagAdd: () => {
                    this.savePopupSaveButton.removeClassName("ui-btn-disabled");
                    tagSelector.hideCreateButton();
                },
                onAfterTagRemove: () => {
                    if (!tagSelector.getTags().length) {
                        this.savePopupSaveButton.addClassName(
                            "ui-btn-disabled"
                        );
                        tagSelector.showCreateButton();
                    }
                },
            },
        });
        this.savePopup.setContent(content);
        this.savePopup.tagSelector = tagSelector;
        tagSelector.renderTo(tagSelectorWrapper);

        this.savePopup.show();
    };

    BX.MyWebstor.HMS.Receive.Base.Instance = null;
    BX.MyWebstor.HMS.Receive.Base.getInstance = function (settings) {
        if (BX.MyWebstor.HMS.Receive.Base.Instance === null)
            BX.MyWebstor.HMS.Receive.Base.Instance =
                new BX.MyWebstor.HMS.Receive.Base(settings);

        return BX.MyWebstor.HMS.Receive.Base.Instance;
    };
});
