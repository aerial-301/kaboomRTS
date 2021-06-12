export default class Unit{

    constructor(xPos, yPos, tag, sWidth = 140, sight = null){

        // let c;

        let oC

        this.xPos = xPos;
        this.yPos = yPos;
        this.tag = tag;
        this.sWidth = sWidth;
        this.sight = sight;
        this.xSight = xPos - (sWidth/2) + 2.5;
        this.ySight = yPos - (sWidth/2) + 2.5;
        

        if (tag == 'enemy-unit'){
            this.c = [.5,.2,.2,1];
            // c = [.7,.2,.2,1];
            this.sightTag = 'enemy-sight';
        } 
            
        else {
            this.c = [.2,.5,.2,1];
            // c = [.2,1,.2,1];
            this.sightTag = 'player-sight';
        }

        this.props = add([
            rect(5, 5),
            pos(xPos, yPos),
            // color(this.c),
            // color(0, 0, 0),
            color(this.c),
            tag,
            'Killable',
        
            {   
                // c: this.c,
                health: 25,
                speed: 300,
                selected: false,
                isHighlighted: false,
                isMoving: true,
                destinationX: xPos - rand(20, 40),
                destinationY: yPos + rand(-20, 20),
                hasTarget: false,
                isFiring: false,
                readyToFire: true,
                currentTarget: null,
                sightOwner: tag,
                getSight: this.getSight,
                shoot: this.shoot,
                moveSight: this.moveSight,
                xOrigin: 0,
                yOrigin: 0,
                isIdle: false,
                
            }
        ]);

    }


    getSight(e){

        let sTag;

        if(e.props.sightOwner == 'player-unit'){
            sTag = 'player-sight';
        }
        else sTag = 'enemy-sight';

        // console.log('getSight')

        const s = add([

            rect(140, 140),
            // color(1, 1, 0, 0.07),
            color(0,0,0,0),
            pos(e.props.pos.x - 72.5, e.props.pos.y - 72.5),
            sTag,
            {
                parent: e,
                inSight: [],

            }

        ]);

        e.props.use({newsight: s});
        // console.log('sight added')
    }


    moveSight(u){

        // console.log('moveSight')
        if(!u) return false;

        u.newsight.pos.x = u.pos.x - 66;
        u.newsight.pos.y = u.pos.y - 70;

    }

    async shoot(u){


        if(!u || u.currentTarget == null || !u.currentTarget.exists()) return false


        play("shoot", {
            volume: 1.0,
            speed: 1,
            detune: 0,
        });

        u.color.r = 1;
        u.color.g = 1;
        u.color.b = 1;
        
        u.currentTarget.health -= 5;

        await wait(0.15, () => {

            if(u.sightOwner == 'enemy-unit'){
                u.color.r = .5;
                u.color.g = .2; 
                u.color.b = .2;
            }
            else{
                u.color.r = .2;
                u.color.g = .5; 
                u.color.b = .2;
                
            }

        })
    }
}