var Cell = /** @class */ (function () {
    function Cell() {
    }
    Cell.prototype.reset = function () {
        if (this.content != null)
            this.content.element.remove();
        this.up = null;
        this.down = null;
        this.right = null;
        this.left = null;
        this.content = null;
    };
    return Cell;
}());
