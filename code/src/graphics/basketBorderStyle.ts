class BasketBorderStyle {
    public color: string;
    public dash: [number, number] | null;
    public cap: CanvasLineCap;

    public static readonly styles = {
        killer: new BasketBorderStyle("#000", [4, 6], "square"),
        extraRegions: new BasketBorderStyle("#000B", null, "round"),
    }

    constructor(color: string, dash: [number, number] | null, cap: CanvasLineCap) {
        this.color = color
        this.dash = dash;
        this.cap = cap;
    }

    public deepcopy(): BasketBorderStyle {
        return new BasketBorderStyle(this.color, this.dash, this.cap);
    }
}