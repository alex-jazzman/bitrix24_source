() => {
    BX.namespace("BX.MyWebstor");

    /**
     * @param {HTMLElement} control
     */
    BX.MyWebstor.TeethSelector = function (control) {
        if (!control || control instanceof HTMLElement)
            throw new Error("Incorrect control");

        this.control = control;
    };

    BX.MyWebstor.TeethSelector.prototype.setValues = function (valueString) {
        if (typeof valueString !== "string") return;

        this.values = valueString.split(",").map((value) => value.trim());
    };

    BX.MyWebstor.TeethSelector.prototype.setValues = function (valueString) {};
};
