BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Doctor");

    BX.MyWebstor.HMS.Doctor.Details = function ({
        entityEditorID,
        doctorID,
        docgenButtonParameters,
    }) {
        var entityEditor = BX.UI.EntityEditor.get(entityEditorID);
        if (!entityEditor) return;

        this.ID = doctorID;
        this.entityEditor = entityEditor;
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

                var title = data.USER_TITLE || "";

                titleContainer.innerText = title;
                document.title = title;
            }
        );
    };

    BX.MyWebstor.HMS.Doctor.Details.prototype.delete = function () {
        var doctorID = this.ID;
        if (doctorID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.doctor.details", "delete", {
                mode: "class",
                data: {
                    doctorID,
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

                this.entityEditor._toolPanel.addError(errors);
                this.entityEditor._toolPanel.setVisible(true);
            });
    };

    BX.MyWebstor.HMS.Doctor.Details.Instance = null;
    BX.MyWebstor.HMS.Doctor.Details.getInstance = function (
        entityEditorID,
        doctorID
    ) {
        if (BX.MyWebstor.HMS.Doctor.Details.Instance === null)
            BX.MyWebstor.HMS.Doctor.Details.Instance =
                new BX.MyWebstor.HMS.Doctor.Details(entityEditorID, doctorID);

        return BX.MyWebstor.HMS.Doctor.Details.Instance;
    };
});
