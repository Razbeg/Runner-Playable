import { _decorator, Component, Label } from 'cc';
import { MoneyWallet } from './MoneyWallet';
const { ccclass, property } = _decorator;

@ccclass('MoneyHUD')
export class MoneyHUD extends Component {
    @property(MoneyWallet) wallet: MoneyWallet | null = null;
    @property(Label) label: Label | null = null;

    @property prefix = '';

    onLoad() {
        this._apply(this.wallet?.balance ?? 0);
        this.wallet?.events.on('changed', this._onChanged, this);
    }

    onDestroy() {
        this.wallet?.events.off('changed', this._onChanged, this);
    }

    private _onChanged(bal: number) { this._apply(bal); }

    private _apply(bal: number) {
        if (!this.label) return;
        this.label.string = this.prefix + bal.toString();
    }
}