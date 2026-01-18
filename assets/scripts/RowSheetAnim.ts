import { _decorator, Component, Sprite, Texture2D, SpriteFrame, Rect, Size, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RowSheetAnim')
export class RowSheetAnim extends Component {
    @property(Sprite) sprite: Sprite | null = null;
    @property(Texture2D) sheet: Texture2D | null = null;

    @property frameCount = 6;
    @property fps = 12;
    @property loop = true;
    @property autoplay = true;

    private _frames: SpriteFrame[] = [];
    private _idx = 0;
    private _t = 0;
    private _dt = 1 / 12;
    private _playing = false;

    onLoad() {
        if (!this.sprite) this.sprite = this.getComponent(Sprite);
        this.rebuild();
        if (this.autoplay) this.play();
    }

    rebuild() {
        this._frames.length = 0;
        this._idx = 0;
        this._t = 0;

        if (!this.sprite || !this.sheet || this.frameCount <= 0) return;

        const w = this.sheet.width;
        const h = this.sheet.height;
        const cellW = Math.floor(w / this.frameCount);
        const cellH = h;

        for (let i = 0; i < this.frameCount; i++) {
            const sf = new SpriteFrame();
            sf.texture = this.sheet;
            sf.rect = new Rect(i * cellW, 0, cellW, cellH);
            sf.originalSize = new Size(cellW, cellH);
            sf.offset = new Vec2(0, 0);
            sf.rotated = false;
            this._frames.push(sf);
        }

        this.sprite.spriteFrame = this._frames[0];
        this._dt = 1 / Math.max(1, this.fps);
    }

    play(reset = false) {
        if (reset) { this._idx = 0; this._t = 0; }
        this._playing = true;
        if (this.sprite && this._frames.length > 0) this.sprite.spriteFrame = this._frames[this._idx];
    }

    stop() { this._playing = false; }

    update(dt: number) {
        if (!this._playing || !this.sprite || this._frames.length === 0) return;

        this._t += dt;
        while (this._t >= this._dt) {
            this._t -= this._dt;

            this._idx++;
            if (this._idx >= this._frames.length) {
                if (this.loop) this._idx = 0;
                else { this._idx = this._frames.length - 1; this._playing = false; }
            }
            this.sprite.spriteFrame = this._frames[this._idx];
        }
    }
}