BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Office");

    BX.MyWebstor.HMS.Office.Details = function ({
        entityEditorID,
        officeID,
        docgenButtonParameters,
    }) {
        var entityEditor = BX.UI.EntityEditor.get(entityEditorID);
        if (!entityEditor) return;

        this.ID = officeID;
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

    BX.MyWebstor.HMS.Office.Details.prototype.delete = function () {
        var officeID = this.ID;
        if (officeID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.office.details", "delete", {
                mode: "class",
                data: {
                    officeID,
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

    BX.MyWebstor.HMS.Office.Details.Instance = null;
    BX.MyWebstor.HMS.Office.Details.getInstance = function (
        entityEditorID,
        officeID
    ) {
        if (BX.MyWebstor.HMS.Office.Details.Instance === null)
            BX.MyWebstor.HMS.Office.Details.Instance =
                new BX.MyWebstor.HMS.Office.Details(entityEditorID, officeID);

        return BX.MyWebstor.HMS.Office.Details.Instance;
    };
});
