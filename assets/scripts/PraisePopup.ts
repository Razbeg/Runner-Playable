import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PraisePopup')
export class PraisePopup extends Component {
    @property(Label) label: Label | null = null;

    @property duration = 0.7;

    @property
    phrases: string[] = ['Great!', 'Amazing!', 'Nice!', 'Awesome!', 'Perfect!'];

    private _visible = false;

    onLoad() {
        this.node.active = false;
        this._visible = false;
    }

    tryShowRandom(): void {
        if (this._visible) return;
        if (!this.label || this.phrases.length === 0) return;

        const idx = (Math.random() * this.phrases.length) | 0;
        this.label.string = this.phrases[idx];

        this._visible = true;
        this.node.active = true;

        this.unschedule(this._hide);
        this.scheduleOnce(this._hide, this.duration);
    }

    private _hide = () => {
        this.node.active = false;
        this._visible = false;
    };
}