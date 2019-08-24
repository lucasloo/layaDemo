(function () {
    'use strict';

    var REG = Laya.ClassUtils.regClass;
    var ui;
    (function (ui) {
        var test;
        (function (test) {
            class TestSceneUI extends Laya.Scene {
                constructor() { super(); }
                createChildren() {
                    super.createChildren();
                    this.loadScene("test/TestScene");
                }
            }
            test.TestSceneUI = TestSceneUI;
            REG("ui.test.TestSceneUI", TestSceneUI);
        })(test = ui.test || (ui.test = {}));
    })(ui || (ui = {}));

    class GameControl extends Laya.Script {
        constructor() {
            super();
            this.createBoxInterval = 2000;
            this._time = 0;
            this._started = false;
        }
        onEnable() {
            this._time = Date.now();
            this._gameBox = this.owner.getChildByName("gameBox");
        }
        init() {
            let plane = Laya.Pool.getItemByCreateFun("plane", this.plane.create, this.plane);
            plane.pos(Laya.stage.width / 2, Laya.stage.height / 2);
            this._gameBox.addChild(plane);
        }
        onUpdate() {
            let now = Date.now();
            if (now - this._time > this.createBoxInterval && this._started) {
                this._time = now;
                this.createBox();
            }
        }
        createBox() {
            let box = Laya.Pool.getItemByCreateFun("dropBox", this.dropBox.create, this.dropBox);
            box.pos(Math.random() * (Laya.stage.width - 100), -100);
            this._gameBox.addChild(box);
        }
        startGame() {
            if (!this._started) {
                this.init();
                this._started = true;
                this.enabled = true;
            }
        }
        stopGame() {
            this._started = false;
            this.enabled = false;
            this.createBoxInterval = 1000;
            this._gameBox.removeChildren();
        }
    }

    class GameUI extends ui.test.TestSceneUI {
        constructor() {
            super();
            GameUI.instance = this;
            Laya.MouseManager.multiTouchEnabled = false;
        }
        onEnable() {
            this._control = this.getComponent(GameControl);
            this.tipLbll.on(Laya.Event.CLICK, this, this.onTipClick);
        }
        onTipClick(e) {
            this.tipLbll.visible = false;
            this._score = 0;
            this.scoreLbl.text = "";
            this._control.startGame();
        }
        addScore(value = 1) {
            this._score += value;
            this.scoreLbl.changeText("分数：" + this._score);
            if (this._control.createBoxInterval > 600 && this._score % 20 == 0)
                this._control.createBoxInterval -= 20;
        }
        stopGame() {
            this.tipLbll.visible = true;
            this.tipLbll.text = "游戏结束了，点击屏幕重新开始";
            this._control.stopGame();
        }
    }

    class MotionConfig {
        constructor() { }
    }
    MotionConfig.bulletMass = 1;
    MotionConfig.bulletSpeed = 10;
    MotionConfig.bulletInterval = 100;
    MotionConfig.dropboxHitScaleX = 5;
    MotionConfig.dropboxHitScaleY = 50;
    MotionConfig.dropboxSplitScaleX = 1;
    MotionConfig.dropboxSplitScaleY = 4;

    class Bullet extends Laya.Script {
        constructor() { super(); }
        onEnable() {
            var rig = this.owner.getComponent(Laya.RigidBody);
            rig.setVelocity({ x: 0, y: -MotionConfig.bulletSpeed });
        }
        onTriggerEnter(other, self, contact) {
            if (other.label === "dropbox") {
                this.owner.removeSelf();
            }
        }
        onUpdate() {
            if (this.owner.y < -10) {
                this.owner.removeSelf();
            }
        }
        onDisable() {
            Laya.Pool.recover("bullet", this.owner);
        }
    }

    class DropBox extends Laya.Script {
        constructor() {
            super();
            this.health = 1;
            this.level = 1;
        }
        onEnable() {
            this._rig = this.owner.getComponent(Laya.RigidBody);
            this.health = Math.round(Math.random() * 20) + 1;
            this.level = Math.round(Math.random() * 5) + 1;
            this._text = this.owner.getChildByName("levelTxt");
            this._text.text = this.health + "";
        }
        onUpdate() {
            this.owner.rotation++;
        }
        onTriggerEnter(other, self, contact) {
            var owner = this.owner;
            if (other.label === "buttle") {
                if (this.health > 1) {
                    this.health--;
                    this._text.changeText(this.health + "");
                    this._rig.applyLinearImpulseToCenter({ x: owner.x > other.owner.x ? MotionConfig.dropboxHitScaleX : -MotionConfig.dropboxHitScaleX, y: -MotionConfig.dropboxHitScaleY });
                    Laya.SoundManager.playSound("sound/hit.wav");
                }
                else {
                    if (owner.parent) {
                        let effect = Laya.Pool.getItemByCreateFun("effect", this.createEffect, this);
                        effect.pos(owner.x, owner.y);
                        owner.parent.addChild(effect);
                        effect.play(0, true);
                        var newX = owner.x;
                        var newY = owner.y;
                        if (this.level > 1) {
                            this.createSplitBox(newX, newY, -MotionConfig.dropboxSplitScaleX, -MotionConfig.dropboxSplitScaleY);
                            this.createSplitBox(newX, newY, MotionConfig.dropboxSplitScaleX, -MotionConfig.dropboxSplitScaleY);
                        }
                        owner.removeSelf();
                        Laya.SoundManager.playSound("sound/destroy.wav");
                    }
                }
                GameUI.instance.addScore(1);
            }
            else if (other.label === "ground") {
                owner.removeSelf();
            }
        }
        createSplitBox(x, y, xV, yV) {
            let box = Laya.Pool.getItemByCreateFun("dropBox", this.dropBox.create, this.dropBox);
            box.pos(x, y);
            box.getComponent(Laya.RigidBody).setVelocity({ x: xV, y: yV });
            this.owner.parent.addChild(box);
        }
        createEffect() {
            let ani = new Laya.Animation();
            ani.loadAnimation("test/TestAni.ani");
            ani.on(Laya.Event.COMPLETE, null, recover);
            function recover() {
                ani.removeSelf();
                Laya.Pool.recover("effect", ani);
            }
            return ani;
        }
        onDisable() {
            Laya.Pool.recover("dropBox", this.owner);
        }
    }

    class Plane extends Laya.Script {
        constructor() {
            super();
            this.lastShootingTime = 0;
            this._dragging = false;
        }
        onEnable() {
            var rig = this.owner.getComponent(Laya.RigidBody);
        }
        onMouseDown() {
            this._dragging = true;
            this.owner.startDrag();
        }
        onMouseUp() {
            this._dragging = false;
        }
        onUpdate() {
            let now = Date.now();
            if (now - this.lastShootingTime > MotionConfig.bulletInterval && this._dragging) {
                this.lastShootingTime = now;
                let flyer = Laya.Pool.getItemByCreateFun("bullet", this.bullet.create, this.bullet);
                flyer.pos(this.owner.x, this.owner.y);
                this.owner.parent.addChild(flyer);
            }
        }
        onTriggerEnter(other, self, contact) {
            var owner = this.owner;
            if (other.label === "dropbox") {
                owner.removeSelf();
                GameUI.instance.stopGame();
                Laya.SoundManager.playSound("sound/hit.wav");
            }
        }
    }

    class GameConfig {
        constructor() { }
        static init() {
            var reg = Laya.ClassUtils.regClass;
            reg("script/GameUI.ts", GameUI);
            reg("script/GameControl.ts", GameControl);
            reg("script/Bullet.ts", Bullet);
            reg("script/DropBox.ts", DropBox);
            reg("script/Plane.ts", Plane);
        }
    }
    GameConfig.width = 640;
    GameConfig.height = 1136;
    GameConfig.scaleMode = "fixedwidth";
    GameConfig.screenMode = "none";
    GameConfig.alignV = "top";
    GameConfig.alignH = "left";
    GameConfig.startScene = "test/TestScene.scene";
    GameConfig.sceneRoot = "";
    GameConfig.debug = false;
    GameConfig.stat = false;
    GameConfig.physicsDebug = false;
    GameConfig.exportSceneToJson = true;
    GameConfig.init();

    class Main {
        constructor() {
            if (window["Laya3D"])
                Laya3D.init(GameConfig.width, GameConfig.height);
            else
                Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
            Laya["Physics"] && Laya["Physics"].enable();
            Laya["DebugPanel"] && Laya["DebugPanel"].enable();
            Laya.stage.scaleMode = GameConfig.scaleMode;
            Laya.stage.screenMode = GameConfig.screenMode;
            Laya.stage.alignV = GameConfig.alignV;
            Laya.stage.alignH = GameConfig.alignH;
            Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;
            if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true")
                Laya.enableDebugPanel();
            if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"])
                Laya["PhysicsDebugDraw"].enable();
            if (GameConfig.stat)
                Laya.Stat.show();
            Laya.alertGlobalError = true;
            Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
        }
        onVersionLoaded() {
            Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
        }
        onConfigLoaded() {
            GameConfig.startScene && Laya.Scene.open(GameConfig.startScene);
        }
    }
    new Main();

}());
