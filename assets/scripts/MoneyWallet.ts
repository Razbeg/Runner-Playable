import { _decorator, Component, EventTarget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MoneyWallet')
export class MoneyWallet extends Component {
    @property balance = 0;

    public readonly events = new EventTarget();

    setBalance(v: number) {
        this.balance = v;
        this.events.emit('changed', this.balance);
    }

    add(amount: number) {
        if (amount === 0) return;
        this.balance += amount;
        this.events.emit('changed', this.balance);
    }
}