import GameControl from "./GameControl";
import GameUI from "./GameUI";
import Bullet from "./Bullet";
import MotionConfig from "../res/MotionConfig"
/**
 * 飞机脚本
 */
export default class Plane extends Laya.Script {
    constructor() {super();}

    /** @prop {name:bullet,tips:"子弹预制体对象",type:Prefab}*/
    bullet: Laya.Prefab;
    /**上次射击时间 */
    lastShootingTime: number = 0;
    /**是否在拖拽飞机 */
    private _dragging: boolean = false;

    onEnable(): void {
        var rig: Laya.RigidBody = this.owner.getComponent(Laya.RigidBody);
    }

    onMouseDown(): void {
        this._dragging = true;
        (this.owner as Laya.Sprite).startDrag();
    }

    onMouseUp(): void {
        this._dragging = false;
    }

    onUpdate(): void {
        let now = Date.now();
        if (now - this.lastShootingTime > MotionConfig.bulletInterval && this._dragging) {
            this.lastShootingTime = now;
            let flyer: Laya.Sprite = Laya.Pool.getItemByCreateFun("bullet", this.bullet.create, this.bullet);
            flyer.pos((this.owner as Laya.Sprite).x, (this.owner as Laya.Sprite).y);
            this.owner.parent.addChild(flyer);
        }
    }

    onTriggerEnter(other: any, self: any, contact: any): void {
        var owner: Laya.Sprite = this.owner as Laya.Sprite;
        if (other.label === "dropbox") {
            owner.removeSelf();
            GameUI.instance.stopGame();
            Laya.SoundManager.playSound("sound/hit.wav");
        }
    }

}