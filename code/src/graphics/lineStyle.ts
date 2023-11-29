class LineStyle {
    public thickness: number;
    public color: string;
    public cap: CanvasLineCap;

    public static readonly styles = {
        diagonals: new LineStyle(0.25, "#0004", "round"),

        red: new LineStyle(0.25, "#F009", "round"),
        orange: new LineStyle(0.35, "#FA09", "round"),
    }

    constructor(thickness: number, color: string, cap: CanvasLineCap) {
        this.thickness = thickness
        this.color = color
        this.cap = cap;
    }

    public deepcopy(): LineStyle {
        return new LineStyle(this.thickness, this.color, this.cap);
    }
}