BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Office");

    BX.MyWebstor.HMS.Office.List = function (gridID) {
        var grid = BX.Main.gridManager.getById(gridID);
        if (!grid) throw new Error("Grid not found");

        this.gridID = gridID;
        this.grid = grid.instance;
    };

    BX.MyWebstor.HMS.Office.List.prototype.delete = function (officeID = 0) {
        if (officeID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.office.details", "delete", {
                mode: "class",
                data: {
                    officeID,
                },
            })
            .then((result) => {
                this.grid.reloadTable();
            })
            .catch((result) => {
                var errors = result.errors.shift().message;
                this.grid.arParams.MESSAGES = [
                    {
                        TYPE: "error",
                        TITLE: "Delete error №" + officeID,
                        TEXT: errors,
                    },
                ];
                this.grid.messages.show();
            });
    };

    BX.MyWebstor.HMS.Office.List.Instance = null;
    BX.MyWebstor.HMS.Office.List.getInstance = function (gridID) {
        if (BX.MyWebstor.HMS.Office.List.Instance === null) BX.MyWebstor.HMS.Office.List.Instance = new BX.MyWebstor.HMS.Office.List(gridID);

        return BX.MyWebstor.HMS.Office.List.Instance;
    };
});
