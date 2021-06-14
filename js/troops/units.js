export default class Unit{

    constructor(type, xPos, yPos, tag, sWidth = 140, health = 30, sight = null){

        let oC
        this.xPos = xPos;
        this.yPos = yPos;
        this.tag = tag;
        this.sWidth = sWidth;
        this.sight = sight;
        this.xSight = xPos - (sWidth/2) + 2.5;
        this.ySight = yPos - (sWidth/2) + 2.5;
        
        
        if (tag == 'enemy-unit'){
            // this.c = [1,.2,.2,1];
            // c = [.7,.2,.2,1];
            this.sightTag = 'enemy-sight';
            this.startFrame = 10;
        } 
            
        else {
            // this.c = [.2,1,.2,1];
            // c = [.2,1,.2,1];
            this.sightTag = 'player-sight';
            this.startFrame = 0;
        }

        this.props = add([
            // color(1, 1, 1, 1),
            pos(xPos, yPos),
            sprite(type, {
                animSpeed: 0.1, // time per frame (defaults to 0.1)
                frame: 0, // start frame (defaults to 0)
            }),
            tag,
            'Killable',
        
            {   
                health: health,
                speed: 70,
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
                moveSight: this.moveSight,
                toggleSight: this.toggleSight,
                xOrigin: 0,
                yOrigin: 0,
                isIdle: false,
                sightToggled: false,
                isMoveAnimation: false,
                isFireAnimation: false,
                isPainAnimation: false,
                startFrame: this.startFrame,
                
                
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

            rect(140, 140),
            color(0,0,0,0),
            pos(e.props.pos.x - 72.5, e.props.pos.y - 72.5),
            
            sTag,
            {
                parent: e,
                inSight: [],
                moved: false,
                toggle: false,

            }

        ]);

        e.props.use({newsight: s});
    }


    moveSight(u){

        if(!u) return false;
        u.newsight.pos.x = u.pos.x - 66;
        u.newsight.pos.y = u.pos.y - 70;

    }


    async toggleSight(u){
        u.newsight.paused = false;
        await wait(0.001);
        u.newsight.paused = true;
    }

    removeSight(u){
        destroy(u.newsight);
    }

    async shoot(u){

        if(!u || u.currentTarget == null || !u.currentTarget.exists()) return false

        u.getShot(u.currentTarget, u);


        play("shoot", {
            volume: 1.0,
            speed: 1,
            detune: 0,
        });
        
        
        u.play('fire');
        await wait(0.05);
        u.stop();
        u.frame = u.startFrame;

        
    }


    async getShot(target, shooter){

        target.health -= 3;
        if (target.health <= 0){
            destroy(target);
        }
        else{
            target.play('pain');
            await wait(0.05);
            target.stop();
            target.frame = target.startFrame;
            target.currentTarget = shooter;
        }

    }



}