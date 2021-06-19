import { unitsProperties } from "./constants.js";


export default class Unit{

    constructor(type, xPos, yPos, tag, sight = null){

        this.xPos = xPos;
        this.yPos = yPos;
        this.tag = tag;
        this.sight = sight;

        
        if(type == 'BlueRM' || type == 'GreenRM'){
            
            this.health = unitsProperties.RIFLEMAN.health;
            this.damage = unitsProperties.RIFLEMAN.damage;
            this.fireRange = unitsProperties.RIFLEMAN.range;
            this.fireRate = unitsProperties.RIFLEMAN.rate;
        }
        else if (type == 'BlueRctM' || type == 'GreenRctM'){
            this.health = unitsProperties.ROCKETMAN.health;
            this.damage = unitsProperties.ROCKETMAN.damage;
            this.fireRange = unitsProperties.ROCKETMAN.range;
            this.fireRate = unitsProperties.ROCKETMAN.rate;
        }
        
        
        if (tag == 'enemy-unit'){
            this.sightTag = 'enemy-sight';
            this.startFrame = 10;
        } 
            
        else {
            this.sightTag = 'player-sight';
            this.startFrame = 0;
        }

        this.props = add([
            pos(xPos, yPos),
            sprite(type, {
                animSpeed: .1,
                frame: this.startFrame,
            }),
            origin("center"),
            tag,
            'Unit',
            'Killable',
        
            {   
                health: this.health,
                damage: this.damage,
                fireRate: this.fireRate,
                fireRange: this.fireRange,
                type: type,
                speed: 100,
                isHighlighted: false,
                isMoving: true,
                destinationX: xPos + rand(-20, 20),
                destinationY: yPos + rand(30, 55),
                readyToFire: true,
                currentTarget: null,
                sightOwner: tag,
                getSight: this.getSight,
                shoot: this.shoot,
                getShot: this.getShot,
                getCloser: this.getCloser,
                moveSight: this.moveSight,
                toggleSight: this.toggleSight,
                isIdle: false,
                isMoveAnimation: false,
                startFrame: this.startFrame,
                collidedWithBuilding: false,
                orderedTarget: null,
                ordered: false,
                givenOrder: false,
                validTargets: [],
                seeking: false,
                
                
            }
        ]);

    }


    getSight(e){

        let sTag;

        if(e.props.sightOwner == 'player-unit'){
            sTag = 'player-sight';
        }
        else sTag = 'enemy-sight';

        const s = add([

            rect(e.props.fireRange, e.props.fireRange),
            color(0,0,0,0),
            pos(e.props.pos.x, e.props.pos.y),
            origin("center"),
            
            sTag,
            {
                parent: e,
                inSight: [],
                moved: false,
                toggled: false,
            }
        ]);

        e.props.use({newsight: s});
    }


    moveSight(u){
        if(!u) return false;        
        u.newsight.pos.x = u.pos.x;
        u.newsight.pos.y = u.pos.y;
    }


    async toggleSight(u){
        u.newsight.paused = false;
        // u.newsight.hidden = false;
        await wait(0.001);
        u.newsight.paused = true;
        // u.newsight.hidden = true;
    }

    removeSight(u){
        destroy(u.newsight);
    }

    async shoot(u){

        if(!u || u.currentTarget == null || !u.currentTarget.exists()) return false

        if(u.type == 'GreenRM' || u.type == 'BlueRM'){

            u.getShot(u.currentTarget, u);

            play("shoot", {
                volume: 1.0,
                speed: 1,
                detune: 100 * rand(-2, 2),
            });
            
            u.play('fire');
            await wait(0.1);
            u.stop();
            u.frame = u.startFrame;

        }

        else{

            // await wait(rand(0, 0.3))

            play("rocket", {
                volume: 0.2,
                speed: 1,
                detune: 100 * rand(-1, 1),
            });

            const r = add([
                rect(6, 6),
                color(1,0,0,1),
                origin("center"),
                pos(u.pos.x, u.pos.y - 4.5),
                'rocket',
                {
                    xVec:0,
                    yVec:1,
                    yMag:-500,
                    xMag: 0.02,
                    xInc: 0.002,
                    tX: u.currentTarget.pos.x + rand(-70, 70),
                    tY: u.currentTarget.pos.y + rand(-70, 70),
                    deg:0,
                    adj: false,
                    peaked: false,
                    smoked: false,
                    below: false,
                    parent: u,
                }
            ]);

            u.play('fire');
            await wait(0.1);
            u.stop();
            u.frame = u.startFrame;

        }
        
    }
    
    async getShot(target, shooter){
        
        target.health -= shooter.damage;
        if (target.health <= 0){
            if(target) destroy(target);
            if(target.newsight) destroy(target.newsight)
        }
        else{
            target.play('pain');
            await wait(0.1);
            target.stop();
            target.frame = target.startFrame;
            if(target.is('Building')) {
                // target.isDamaged = true;
                return false;
            }
            else if(!target.currentTarget && !target.ordered){
                target.getCloser(target, shooter);
            }
        }

    }


    async getCloser(unit, target){
        if(!target) return false;
        if(!unit) return false;

        const distX = unit.pos.x - target.pos.x;
        const distY = unit.pos.y - target.pos.y;
        const absvX = Math.abs(target.pos.x - unit.pos.x)
        const absvY = Math.abs(target.pos.y - unit.pos.y)
        const range = (unit.fireRange / 2);
        let xS, yS, extraX, extraY;

        if(distX < 0) xS = -1;
        else xS = 1;
        extraX = xS * 20
        if(distY < 0) yS = -1;
        else yS = 1;
        extraY = yS * 20

        if(absvX > range){

            if(absvY > range){
                unit.destinationX = unit.pos.x - distX + range*xS - extraX ;
                unit.destinationY = unit.pos.y - distY + range*yS - extraY;
                unit.isMoving = true;
            }
            else{
                unit.destinationX = unit.pos.x - distX + range*xS - extraX;
                unit.destinationY = unit.pos.y;
                unit.isMoving = true;
            }
        }
        else if(absvY > range){
            unit.destinationX = unit.pos.x;
            unit.destinationY = unit.pos.y - distY + range*yS - extraY;
            unit.isMoving = true;
        }  
    }

}