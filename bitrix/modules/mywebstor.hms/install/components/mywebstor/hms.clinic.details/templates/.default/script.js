BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Clinic");

    BX.MyWebstor.HMS.Clinic.Details = function ({
        entityEditorID,
        clinicID,
        docgenButtonParameters,
    }) {
        var entityEditor = BX.UI.EntityEditor.get(entityEditorID);
        if (!entityEditor) return;

        this.ID = clinicID;
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

                titleContainer.innerText = data.TITLE;
                document.title = data.TITLE;
            }
        );
    };

    BX.MyWebstor.HMS.Clinic.Details.prototype.delete = function () {
        var clinicID = this.ID;
        if (clinicID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.clinic.details", "delete", {
                mode: "class",
                data: {
                    clinicID,
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

    BX.MyWebstor.HMS.Clinic.Details.Instance = null;
    BX.MyWebstor.HMS.Clinic.Details.getInstance = function (
        entityEditorID,
        clinicID
    ) {
        if (BX.MyWebstor.HMS.Clinic.Details.Instance === null)
            BX.MyWebstor.HMS.Clinic.Details.Instance =
                new BX.MyWebstor.HMS.Clinic.Details(entityEditorID, clinicID);

        return BX.MyWebstor.HMS.Clinic.Details.Instance;
    };
});
