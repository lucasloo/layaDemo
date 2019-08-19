import GameUI from "./GameUI";
/**
 * 掉落盒子脚本，实现盒子碰撞及回收流程
 */
export default class DropBox extends Laya.Script {
    /** @prop {name:dropBox,tips:"掉落容器预制体对象",type:Prefab}*/
    dropBox: Laya.Prefab;

    /**盒子剩余血量 */
    health: number = 1;
    /**盒子等级 */
    level: number = 1;
    /**等级文本对象引用 */
    private _text: Laya.Text;
    /**刚体对象引用 */
    private _rig: Laya.RigidBody

    constructor() { super(); }
    onEnable(): void {
        /**获得组件引用，避免每次获取组件带来不必要的查询开销 */
        this._rig = this.owner.getComponent(Laya.RigidBody);
        this.health = Math.round(Math.random() * 20) + 1;
        this.level = Math.round(Math.random() * 5) + 1;
        this._text = this.owner.getChildByName("levelTxt") as Laya.Text;
        this._text.text = this.health + "";
    }

    onUpdate(): void {
        //让持续盒子旋转
        (this.owner as Laya.Sprite).rotation++;
    }

    onTriggerEnter(other: any, self: any, contact: any): void {
        var owner: Laya.Sprite = this.owner as Laya.Sprite;
        if (other.label === "buttle") {
            //碰撞到子弹后，增加积分，播放声音特效
            if (this.health > 1) {
                this.health--;
                this._text.changeText(this.health + "");
                // console.log("owner x : {}, other x: {}", owner.x, other.owner.x);
                this._rig.applyLinearImpulseToCenter({x: owner.x > other.owner.x ? 5 : -5, y: -50})
                Laya.SoundManager.playSound("sound/hit.wav");
            } else {
                if (owner.parent) {
                    let effect: Laya.Animation = Laya.Pool.getItemByCreateFun("effect", this.createEffect, this);
                    effect.pos(owner.x, owner.y);
                    owner.parent.addChild(effect);
                    effect.play(0, true);
                    var newX = owner.x;
                    var newY = owner.y;
                    if (this.level > 1) {
                        this.createSplitBox(newX, newY, -1, -4);
                        this.createSplitBox(newX, newY, 1, -4);
                    }
                    owner.removeSelf();
                    Laya.SoundManager.playSound("sound/destroy.wav");
                }
            }
            GameUI.instance.addScore(1);
        } else if (other.label === "ground") {
            //只要有一个盒子碰到地板，则停止游戏
            owner.removeSelf();
            // GameUI.instance.stopGame();
            // this.health++;
            // this._text.changeText(this.health + "");
            // owner.getComponent(Laya.RigidBody).setVelocity({ x: 0, y: 10 });
            // Laya.SoundManager.playSound("sound/hit.wav");
        }
    }

    createSplitBox(x: number, y: number, xV: number, yV: number): void {
        let box: Laya.Sprite = Laya.Pool.getItemByCreateFun("dropBox", this.dropBox.create, this.dropBox);
        box.pos(x, y);
        box.getComponent(Laya.RigidBody).setVelocity({x: xV, y: yV});
        this.owner.parent.addChild(box);
    }

    /**使用对象池创建爆炸动画 */
    createEffect(): Laya.Animation {
        let ani: Laya.Animation = new Laya.Animation();
        ani.loadAnimation("test/TestAni.ani");
        ani.on(Laya.Event.COMPLETE, null, recover);
        function recover(): void {
            ani.removeSelf();
            Laya.Pool.recover("effect", ani);
        }
        return ani;
    }

    onDisable(): void {
        //盒子被移除时，回收盒子到对象池，方便下次复用，减少对象创建开销。
        Laya.Pool.recover("dropBox", this.owner);
    }
}