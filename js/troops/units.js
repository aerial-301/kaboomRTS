import { unitsProperties } from "../constants.js";


export default class Unit{

    constructor(type, xPos, yPos, tag, sight = null){

        this.xPos = xPos;
        this.yPos = yPos;
        this.tag = tag;
        // this.damage = damage;
        // this.fireRate = fireRate;
        this.sight = sight;
        // this.xSight = xPos - (sWidth/2) + 2.5;
        // this.ySight = yPos - (sWidth/2) + 2.5;


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
                sWidth: this.fireRange,
                fireRate: this.fireRate,
                fireRange: this.fireRange,
                type: type,
                speed: 300,
                selected: false,
                isHighlighted: false,
                isMoving: false,
                destinationX: xPos - rand(20, 40),
                destinationY: yPos + rand(-20, 20),
                hasTarget: false,
                isFiring: false,
                readyToFire: true,
                currentTarget: null,
                sightOwner: tag,
                getSight: this.getSight,
                shoot: this.shoot,
                getShot: this.getShot,
                moveToShooter: this.moveToShooter,
                moveSight: this.moveSight,
                toggleSight: this.toggleSight,
                fullStop: this.fullStop,
                xOrigin: 0,
                yOrigin: 0,
                isIdle: false,
                sightToggled: false,
                isMoveAnimation: false,
                startFrame: this.startFrame,
                collidedWithBuilding: false,
                //currentObstacle: null,
                // path:[],
                isTargetingBuilding: false,
                attacker: null,
                
                
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

            rect(e.props.sWidth, e.props.sWidth),
            color(0,0,0,.5),
            // pos(e.props.pos.x - 72.5, e.props.pos.y - 72.5),
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
        // u.newsight.pos.x = u.pos.x - (u.sWidth * 0.50);
        // u.newsight.pos.y = u.pos.y - (u.sWidth * 0.45);

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
                detune: 0,
            });
            
            u.play('fire');
            await wait(0.1);
            u.stop();
            u.frame = u.startFrame;

        }

        else{

            play("rocket", {
                volume: 1.0,
                speed: 1,
                detune: 0,
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
                    tX: u.currentTarget.pos.x,
                    tY: u.currentTarget.pos.y,
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


    // getBombed(bombed, bomber){
    //     // bombed.health -= bomber.damage;
    //     if (bombed.health <= 0){
    //         destroy(bombed);
    //     }
    //     else{
    //         target.play('pain');
    //         await wait(0.1);
    //         target.stop();
    //         target.frame = target.startFrame;
    //         // await wait(0.01);
    //         if(target.is('Building')) return false;
    //         if(!target.currentTarget){
    //             // target.fullStop(target);
    //             // target.currentTarget = shooter;
    //             target.moveToShooter(target, shooter);
    //         }

    //     }
    // }

    
    async getShot(target, shooter){
        
        target.health -= shooter.damage;
        // console.log(target.health)
        if (target.health <= 0){
            destroy(target);
        }
        else{
            target.play('pain');
            await wait(0.1);
            target.stop();
            target.frame = target.startFrame;
            // await wait(0.01);
            if(target.is('Building')) return false;
            if(!target.currentTarget){
                // target.fullStop(target);
                // target.currentTarget = shooter;
                target.moveToShooter(target, shooter);
            }
        }

    }


    fullStop(u){
        u.isMoving = false;
        u.newsight.moved = false;
        u.currentTarget = null;
        u.isTargetingBuilding = false;
        u.stop();
        u.frame = u.startFrame;
        u.isMoveAnimation = false;
    }

    moveToShooter(target, shooter){

        const distX = target.pos.x - shooter.pos.x;
        const distY = target.pos.y - shooter.pos.y;

        const absvX = Math.abs(shooter.pos.x - target.pos.x)
        const absvY = Math.abs(shooter.pos.y - target.pos.y)

        const range = target.fireRange / 2;

        let xS, yS;

        if(distX < 0) xS = -1;
        else xS = 1;

        if(distY < 0) yS = -1;
        else yS = 1;

        if(absvX > range){

            if(absvY > range){
                target.destinationX = target.pos.x - distX + range*xS;
                target.destinationY = target.pos.y - distY + range*yS;
                target.isMoving = true;
            }
            else{
                target.destinationX = target.pos.x - distX + range*xS;
                target.destinationY = target.pos.y;
                target.isMoving = true;
            }
        }
        else if(absvY > range){
            target.destinationX = target.pos.x;
            target.destinationY = target.pos.y - distY + range*yS;
            target.isMoving = true;
        }
    }

}