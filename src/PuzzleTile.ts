import { Graphics, GraphicsPath, Sprite } from "pixi.js";

export default class PuzzleTile {
    constructor(
        public target:Sprite,
        public mask:Graphics
    ) {

    }
}
