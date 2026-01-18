import { _decorator, Component, Vec3 } from 'cc';
import { MoneyWallet } from './MoneyWallet';
import { MoneyFlyFx } from './MoneyFlyFx';
import { PraisePopup } from './PraisePopup';
const { ccclass, property } = _decorator;

@ccclass('MoneyPickupFx')
export class MoneyPickupFx extends Component {
    @property(MoneyWallet) wallet: MoneyWallet | null = null;
    @property(MoneyFlyFx) flyFx: MoneyFlyFx | null = null;
    @property(PraisePopup) praise: PraisePopup | null = null;

    onPickup(amount: number, fromWorld: Vec3) {
        this.wallet?.add(amount);
        this.flyFx?.spawn(fromWorld, 1);
        this.praise?.tryShowRandom();
    }
}