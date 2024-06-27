BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Appointment");

    BX.MyWebstor.HMS.Appointment.Details = function ({
        entityEditorID,
        appointmentID,
        tabs,
        tabContainerId,
        tabMenuContainerId,
        docgenButtonParameters,
    }) {
        var entityEditor = BX.UI.EntityEditor.get(entityEditorID);
        if (!entityEditor) return;

        this.ID = appointmentID;
        this.entityEditor = entityEditor;
        this.reserveMode = null;
        this.tabManager = new BX.MyWebstor.HMS.TabManager(entityEditorID, {
            container: BX(tabContainerId),
            menuContainer: BX(tabMenuContainerId),
            data: tabs,
        });
        if (BX.DocumentGenerator && BX.DocumentGenerator.Button) {
            this.docgenButton = new BX.DocumentGenerator.Button(
                "hms-document-button",
                docgenButtonParameters
            );
            this.docgenButton.init();
        } else {
            console.warn("BX.DocumentGenerator.Button is not found");
        }

        BX.addCustomEvent(
            "BX.UI.EntityEditorAjax:onSubmit",
            function (data, response) {
                if (response.status != "success" || !data) return;

                var toolbar = BX.UI.ToolbarManager.getDefaultToolbar();
                if (!toolbar) return;

                var titleContainer =
                    toolbar.titleContainer.querySelector("#pagetitle");
                if (!titleContainer) return;

                titleContainer.innerText = data.TITLE;
                document.title = data.TITLE;
            }
        );

        this.changeEditorLayout(entityEditor.getControlById("STATUS_ID"));

        BX.addCustomEvent(
            "onControlChanged",
            this.updateProductParams.bind(this)
        );
        BX.addCustomEvent(
            "onControlChanged",
            this.handleControlChange.bind(this)
        );
        BX.addCustomEvent("BX.UI.EntityEditor:onRefreshLayout", (editor) => {
            this.reserveMode = null;
            this.changeEditorLayout(editor.getControlById("STATUS_ID"));
        });

        this.checkEditMode();

        BX.UI.EntityEditor.setDefault = function () {};

        BX.UI.Hint.init(document.body);
    };

    BX.MyWebstor.HMS.Appointment.Details.prototype.delete = function () {
        const appointmentID = this.ID;
        if (appointmentID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.appointment.details", "delete", {
                mode: "class",
                data: {
                    appointmentID,
                },
            })
            .then((result) => {
                BX.SidePanel.Instance.close();

                var parent = window.parent,
                    gridManager;
                if (
                    !parent.BX.Main ||
                    !(gridManager = parent.BX.Main.gridManager)
                )
                    return;
                var grids = gridManager.data;
                grids.forEach((grid) => grid.instance.reload());
            })
            .catch((result) => {
                var errors = result.errors.reduce((str, error) => {
                    str += error.message + "\n\t<br>";
                    return str;
                }, "");

                this.entityEditor._toolPanel.clearErrors();
                this.entityEditor._toolPanel.addError(errors);
                this.entityEditor._toolPanel.setVisible(true);
            });
    };

    BX.MyWebstor.HMS.Appointment.Details.prototype.startReceive = function () {
        const appointmentID = this.ID;
        if (appointmentID <= 0) return;

        BX.ajax
            .runComponentAction(
                "mywebstor:hms.appointment.details",
                "startReceive",
                {
                    mode: "class",
                    data: {
                        appointmentID,
                    },
                }
            )
            .then((result) => {
                BX.SidePanel.Instance.reload();
            })
            .catch((result) => {
                var errors = result.errors.reduce((str, error) => {
                    str += error.message + "\n\t<br>";
                    return str;
                }, "");

                this.entityEditor._toolPanel.clearErrors();
                this.entityEditor._toolPanel.addError(errors);
                this.entityEditor._toolPanel.setVisible(true);
            });
    };

    BX.MyWebstor.HMS.Appointment.Details.prototype.updateProductParams =
        function (control) {
            const editor = control.getEditor();
            const controlId = control.getId();

            if (!["DOCTOR_ID", "OFFICE_ID"].includes(controlId)) return;

            control.save();

            const model = control.getModel();
            model.updateDataObject("PRODUCT_LIST_DATA", {
                [controlId]: control.getValue(),
            });
        };

    BX.MyWebstor.HMS.Appointment.Details.prototype.handleControlChange =
        function (control) {
            const controlId = control.getId();
            switch (controlId) {
                case "STATUS_ID":
                    this.changeEditorLayout(control);
                    break;
                case "PATIENT":
                    this.updateVhiArea(control);
                    break;
            }
        };

    BX.MyWebstor.HMS.Appointment.Details.prototype.changeEditorLayout =
        function (control, isEdit = false) {
            if (!control || control.getId() != "STATUS_ID") return;

            control.save();

            const editor = control.getEditor();
            const controlValue = control.getValue();
            const actualReserveMode = controlValue === "RESERVE";
            const mainSection = editor.getControlById("main");
            const reserveSection = editor.getControlById("reserve");
            const requiredSection = editor.getControlById("required");
            const fieldsToHide = [
                "DOCTOR_ID",
                "OFFICE_ID",
                "SPECIALIZATION_ID",
                "DATE_FROM",
                "DATE_TO",
            ];
            const fieldsToShow = [
                "DOCTOR_ID",
                "OFFICE_ID",
                "SPECIALIZATION_ID",
                "DATE_FROM",
                this.reserveMode === null ? "DATE_TO" : null,
                "DURATION",
            ].filter((field) => field);
            const reserveFields = [
                "RESERVE_DATE",
                "RESERVE_DOCTOR",
                "RESERVE_OFFICE",
                "RESERVE_SPECIALIZATION",
            ];

            if (
                this.reserveMode === actualReserveMode ||
                !mainSection ||
                !reserveSection
            )
                return;

            switch (actualReserveMode) {
                case true:
                    fieldsToHide.forEach((fieldToHide) => {
                        const field = editor.getControlById(fieldToHide);
                        if (!field) return;

                        const fieldScheme = field.getSchemeElement();
                        if (!fieldScheme) return;

                        fieldScheme.setDataParam(
                            "IS_REQUIRED",
                            fieldScheme._isRequired
                        );
                        fieldScheme._isRequired = false;

                        field.setMode(BX.UI.EntityEditorMode.view, {
                            notify: true,
                        });
                        field.hide();
                    });

                    reserveFields.forEach((reserveField) => {
                        const hiddenSourceField =
                            editor.getAvailableSchemeElementByName(
                                reserveField
                            );
                        if (!hiddenSourceField) return;

                        hiddenSourceField.setParent(reserveSection);

                        const field = editor.createControl(
                            hiddenSourceField.getType(),
                            hiddenSourceField.getName(),
                            {
                                schemeElement: hiddenSourceField,
                                model: reserveSection._model,
                                parent: reserveSection,
                                mode: reserveSection._mode,
                            }
                        );

                        if (this.reserveMode !== null && !isEdit)
                            reserveSection._model.setField(
                                field.getDataKey(),
                                ""
                            );

                        reserveSection.addChild(field, {
                            layout: { forceDisplay: true },
                        });

                        if (this.reserveMode !== null)
                            field.switchToSingleEditMode();
                    });

                    reserveSection.refreshLayout();
                    break;
                default:
                    fieldsToShow.forEach((fieldToHide, index) => {
                        const hiddenSourceField =
                            editor.getAvailableSchemeElementByName(fieldToHide);
                        if (!hiddenSourceField) return;

                        hiddenSourceField.setParent(mainSection);
                        hiddenSourceField._isRequired =
                            hiddenSourceField.getDataParam(
                                "IS_REQUIRED",
                                hiddenSourceField._isRequired
                            );

                        const field = editor.createControl(
                            hiddenSourceField.getType(),
                            hiddenSourceField.getName(),
                            {
                                schemeElement: hiddenSourceField,
                                model: mainSection._model,
                                parent: mainSection,
                                mode: mainSection._mode,
                            }
                        );

                        if (this.reserveMode !== null && !isEdit)
                            mainSection._model.setField(field.getDataKey(), "");

                        mainSection.addChild(field, {
                            layout: {
                                forceDisplay: true,
                            },
                            index: 4 + index,
                        });

                        if (this.reserveMode !== null)
                            field.switchToSingleEditMode();
                    });

                    reserveSection.getChildren().forEach((child) =>
                        child.setMode(BX.UI.EntityEditorMode.view, {
                            notify: true,
                        })
                    );

                    reserveFields.forEach((reserveField) => {
                        const reserveFieldObject =
                            editor.getControlById(reserveField);
                        if (!reserveFieldObject) return;

                        reserveFieldObject.hide();
                    });

                    reserveSection.clearLayout();
                    break;
            }

            if (requiredSection) {
                const requiredFields = requiredSection.getChildren();
                if (Array.isArray(requiredFields))
                    requiredFields.forEach((requiredField) => {
                        requiredField.getSchemeElement()._isRequired = false;
                        requiredField.hide();
                    });

                requiredSection.hide();
            }

            this.reserveMode = actualReserveMode;
        };

    BX.MyWebstor.HMS.Appointment.Details.prototype.updateVhiArea = function (
        control
    ) {
        const editor = control.getEditor();
        const controlId = control.getId();
        const vhiField = editor.getControlById("vhi");

        if (controlId != "PATIENT" || !vhiField) return;

        const contactInfo = control._contactInfos.get(0);
        let contactId = null;
        if (contactInfo) contactId = contactInfo.getId();

        const model = control.getModel();
        model.updateDataObject("VHI_CLIENT_INFO", {
            CLIENT_ID: contactId,
        });

        vhiField._loadedHtml = null;
        vhiField.refreshLayout();
    };

    BX.MyWebstor.HMS.Appointment.Details.prototype.checkEditMode = function () {
        const model = this.entityEditor._model;
        const editFields = model.getField("EDIT_FIELDS");
        if (!editFields) return;

        const fieldsToShow = [
            "CLINIC_ID",
            "DOCTOR_ID",
            "OFFICE_ID",
            "DATE_FROM",
        ];

        for (fieldCode in editFields) {
            const field = this.entityEditor.getControlById(fieldCode);
            if (!field) continue;

            const fieldDataKey = field.getDataKey();

            model.setInitFieldValue(fieldDataKey, editFields[fieldCode]);

            if (fieldsToShow.includes(fieldDataKey)) {
                field.switchToSingleEditMode();
                field.markAsChanged();
            }
        }

        const statusField = this.entityEditor.getControlById("STATUS_ID");
        if (!statusField) return;

        statusField.switchToSingleEditMode();

        this.changeEditorLayout(statusField, true);
    };

    BX.MyWebstor.HMS.Appointment.Details.Instance = null;
    BX.MyWebstor.HMS.Appointment.Details.getInstance = function (settings) {
        if (BX.MyWebstor.HMS.Appointment.Details.Instance === null)
            BX.MyWebstor.HMS.Appointment.Details.Instance =
                new BX.MyWebstor.HMS.Appointment.Details(settings);

        return BX.MyWebstor.HMS.Appointment.Details.Instance;
    };
});
