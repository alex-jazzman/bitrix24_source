BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Vhi");

    BX.MyWebstor.HMS.Vhi.List = function ({
        GRID_ID: gridID,
        SIGNED_PARAMETERS: signedParameters,
        CONTACT_ID: contactID,
    }) {
        var grid = BX.Main.gridManager.getById(gridID);
        if (!grid) throw new Error("Grid not found");

        this.gridID = gridID;
        this.grid = grid.instance;
        this.signedParameters = signedParameters;
        this.contactID = contactID;

        BX.addCustomEvent("Grid::beforeRequest", this.configRequest.bind(this));
    };

    BX.MyWebstor.HMS.Vhi.List.prototype.configRequest = function (
        grid,
        config
    ) {
        if (config.gridId !== this.gridID) return;

        if (config.url === "")
            config.url =
                "/bitrix/components/mywebstor/hms.vhi.list/lazyload.ajax.php?&site=" +
                BX.message("SITE_ID") +
                "&sessid=" +
                BX.message("bitrix_sessid");
        config.method = "POST";
        config.data.PARAMS = {
            signedParameters: this.signedParameters,
        };
    };

    BX.MyWebstor.HMS.Vhi.List.prototype.delete = function (vhiID = 0) {
        if (vhiID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.vhi.details", "delete", {
                mode: "class",
                data: {
                    vhiID,
                },
            })
            .then((result) => {
                this.grid.reload();
            })
            .catch((result) => {
                var errors = result.errors.shift().message;
                this.grid.arParams.MESSAGES = [
                    {
                        TYPE: "error",
                        TITLE: "Delete error №" + vhiID,
                        TEXT: errors,
                    },
                ];
                this.grid.messages.show();
            });
    };

    BX.MyWebstor.HMS.Vhi.List.prototype.toggleActive = function (vhiID = 0) {
        if (vhiID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.vhi.details", "toggleActive", {
                mode: "class",
                data: {
                    vhiID,
                },
            })
            .then((result) => {
                this.grid.reload();
            })
            .catch((result) => {
                var errors = result.errors.shift().message;
                this.grid.arParams.MESSAGES = [
                    {
                        TYPE: "error",
                        TITLE: "Toggle active error №" + vhiID,
                        TEXT: errors,
                    },
                ];
                this.grid.messages.show();
            });
    };

    BX.MyWebstor.HMS.Vhi.List.prototype.openAdd = function () {
        BX.SidePanel.Instance.open(
            "/hms/config/vhi/details/0/?CONTACT_ID=" + this.contactID
        );
    };

    BX.MyWebstor.HMS.Vhi.List.prototype.addFromStorage = function () {
        const popupAddButton = new BX.PopupWindowButton({
            text: BX.message("HMS_VHI_LIST_POPUP_ADD_BUTTON"),
            className: "ui-btn ui-btn-success ui-btn-disabled",
            events: {
                click: () => {
                    if (
                        popupAddButton.buttonNode.classList.contains(
                            "ui-btn-disabled"
                        ) ||
                        popupAddButton.buttonNode.classList.contains(
                            "ui-btn-clock"
                        )
                    )
                        return;

                    const tagSelector = popup.tagSelector;
                    if (!tagSelector) return popup.close();

                    const tag = popup.tagSelector.getTags()[0];
                    if (!tag) return popup.close();

                    popupAddButton.buttonNode.classList.add("ui-btn-clock");
                    BX.ajax
                        .runComponentAction(
                            "mywebstor:hms.vhi.details",
                            "addFromStorage",
                            {
                                mode: "class",
                                data: {
                                    vhiStorageID: tag.getId(),
                                    contactID: this.contactID,
                                },
                            }
                        )
                        .then((result) => {
                            popup.close();
                            this.grid.reload();
                        })
                        .catch((result) => {});
                },
            },
        });
        const popup = new BX.PopupWindow("hms-vhi-add-from-storage", null, {
            autoHide: true,
            overlay: 0.3,
            minWidth: 400,
            maxWidth: 800,
            closeByEsc: true,
            titleBar: {
                content: BX.create("span", {
                    props: { className: "popup-window-titlebar-text" },
                    text: BX.message("HMS_VHI_LIST_POPUP_TITLE"),
                }),
            },
            buttons: [
                new BX.PopupWindowButton({
                    text: BX.message("HMS_VHI_LIST_POPUP_CLOSE_BUTTON"),
                    className: "ui-btn ui-btn-light-border",
                    events: {
                        click: () => {
                            popup.close();
                        },
                    },
                }),
                popupAddButton,
            ],
        });
        const tagSelectorWrapper = BX.create("div", {
            props: { className: "hms-entity-selector-wrapper" },
            style: { width: "500px" },
        });
        const content = BX.create("div", {
            props: { className: "hms-entity-selector" },
            children: [
                BX.create("div", {
                    props: { className: "hms-entity-selector-text" },
                    text: BX.message("HMS_VHI_LIST_POPUP_TAG_SELECTOR_TITLE"),
                }),
                tagSelectorWrapper,
            ],
        });
        const tagSelector = new BX.UI.EntitySelector.TagSelector({
            id: "hms-vhi-storage-tag-selector",
            multiple: true,
            readonly: false,
            placeholder: "",
            textBoxWidth: "100%",
            addButtonCaption: BX.message(
                "HMS_VHI_LIST_POPUP_TAG_SELECTOR_ADD_BUTTON"
            ),
            dialogOptions: {
                context: "hms-vhi-list",
                enableSearch: true,
                clearSearchOnSelect: true,
                entities: [
                    {
                        id: "hms-vhi-storage",
                        options: {
                            CONTACT_ID: this.contactID,
                        },
                    },
                ],
                recentTabOptions: {
                    visible: false,
                },
            },
            events: {
                onAfterTagAdd: () => {
                    popupAddButton.removeClassName("ui-btn-disabled");
                },
                onAfterTagRemove: () => {
                    if (!tagSelector.getTags().length)
                        popupAddButton.addClassName("ui-btn-disabled");
                },
            },
        });
        tagSelector
            .getDialog()
            .getPopup()
            .contentContainer.classList.add("popup-window-item-height-auto");

        popup.setContent(content);
        popup.tagSelector = tagSelector;
        tagSelector.renderTo(tagSelectorWrapper);

        popup.show();
    };

    BX.MyWebstor.HMS.Vhi.List.Instance = null;
    BX.MyWebstor.HMS.Vhi.List.getInstance = function (gridID) {
        if (BX.MyWebstor.HMS.Vhi.List.Instance === null)
            BX.MyWebstor.HMS.Vhi.List.Instance = new BX.MyWebstor.HMS.Vhi.List(
                gridID
            );

        return BX.MyWebstor.HMS.Vhi.List.Instance;
    };
});
