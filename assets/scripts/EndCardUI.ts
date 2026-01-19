import { _decorator, Component, Node, Label } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('EndCardUI')
export class EndCardUI extends Component {
    @property({ type: Node })
    root: Node | null = null;

    @property({ type: Label })
    titleLabel: Label | null = null;

    @property({ type: Label })
    subtitleLabel: Label | null = null;

    @property({ type: Label })
    moneyLabel: Label | null = null;

    @property
    winTitle = 'CONGRATS!';

    @property
    winSubtitle = 'You finished the run!';

    @property
    loseTitle = 'YOU LOST';

    @property
    loseSubtitle = 'Try again!';

    @property
    moneyPrefix = 'Money: ';

    @property
    countUpDuration = 0.75;

    private _animating = false;
    private _to = 0;
    private _elapsed = 0;
    private _lastShown = -1;

    onLoad() {
        if (!this.root) this.root = this.node;
        if (this.root) this.root.active = false;
    }

    hide() {
        if (this.root) this.root.active = false;
        this._animating = false;
    }

    showWin(amount: number) {
        this._show(this.winTitle, this.winSubtitle, amount);
    }

    showLose(amount: number) {
        this._show(this.loseTitle, this.loseSubtitle, amount);
    }

    private _show(title: string, subtitle: string, amount: number) {
        if (!this.root) this.root = this.node;
        if (this.root) this.root.active = true;

        if (this.titleLabel) this.titleLabel.string = title;
        if (this.subtitleLabel) this.subtitleLabel.string = subtitle;

        this._to = (amount | 0);
        if (this._to < 0) this._to = 0;

        this._elapsed = 0;
        this._lastShown = -1;

        this._applyMoney(0);

        this._animating = (this.countUpDuration > 0) && (this._to > 0);

        if (!this._animating) {
            this._applyMoney(this._to);
            this._lastShown = this._to;
        }
    }

    update(dt: number) {
        if (!this._animating) return;

        this._elapsed += dt;
        const dur = Math.max(0.0001, this.countUpDuration);
        let t = this._elapsed / dur;

        if (t >= 1) {
            t = 1;
            this._animating = false;
        }

        const v = (this._to * t) | 0;
        if (v !== this._lastShown) {
            this._lastShown = v;
            this._applyMoney(v);
        }

        if (!this._animating && this._lastShown !== this._to) {
            this._lastShown = this._to;
            this._applyMoney(this._to);
        }
    }

    private _applyMoney(v: number) {
        if (!this.moneyLabel) return;
        this.moneyLabel.string = this.moneyPrefix + v.toString();
    }
}