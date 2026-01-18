import { _decorator, Component, EventTarget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Health')
export class Health extends Component {
    @property({ min: 1 }) maxHP = 3;

    public readonly events = new EventTarget();

    private _hp = 3;

    get hp() { return this._hp; }

    onLoad() {
        this._hp = this.maxHP;
        this.events.emit('changed', this._hp, this.maxHP);
    }

    resetFull() {
        this._hp = this.maxHP;
        this.events.emit('changed', this._hp, this.maxHP);
    }

    damage(amount = 1) {
        if (this._hp <= 0) return;
        this._hp -= amount;
        if (this._hp < 0) this._hp = 0;
        this.events.emit('changed', this._hp, this.maxHP);
        if (this._hp === 0) this.events.emit('dead');
    }
}