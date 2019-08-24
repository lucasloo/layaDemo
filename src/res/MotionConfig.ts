/**
 * 精灵运动配置累 日后改成json文件读取
 */
export default class MotionConfig{
    static bulletMass: number = 1;
    static bulletSpeed: number = 10;
    static bulletInterval: number = 100;

    static dropboxHitScaleX: number = 5;
    static dropboxHitScaleY: number = 50;
    static dropboxSplitScaleX: number = 1;
    static dropboxSplitScaleY: number = 4;
    private constructor(){}
}