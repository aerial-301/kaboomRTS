export class Unit{

    

    constructor(xPos, yPos, tag, sWidth = 140, sight = null){

        let c;

        this.xPos = xPos;
        this.yPos = yPos;
        this.tag = tag;

        this.sWidth = sWidth;

        this.sight = sight;


        this.xSight = xPos - (sWidth/2) + 2.5;
        this.ySight = yPos - (sWidth/2) + 2.5;
        

        if (tag == 'enemy-unit'){
            this.c = [.7,.2,.2,1];
            // c = [.7,.2,.2,1];
            this.sightTag = 'enemy-sight';
        } 
            
        else {
            this.c = [.2,1,.2,1];
            // c = [.2,1,.2,1];
            this.sightTag = 'player-sight';
        }

        this.props = add([
            rect(5, 5),
            pos(xPos, yPos),
            // color(this.c),
            color(0, 0, 0),
            // color(c),
            tag,
        
            {   
                health: 10,
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
                
                
                // targetX: null,
                // targetY: null
            }
        ]);



        // sight = add([
        //     rect(sWidth, sWidth),
        //     color(1, 1, 0, 0.02),
        //     pos(this.xSight, this.ySight),
        //     this.sightTag,
        //     {
        //         parent: this.props,
        //     }
        // ]);

    }


    getSight(e){

        let sTag;

        if(e.props.sightOwner == 'player-unit'){
            sTag = 'player-sight';
        }
        else sTag = 'enemy-sight';

        console.log('getSight')

        const s = add([

            rect(140, 140),
            color(1, 1, 0, 0.07),
            pos(e.props.pos.x - 72.5, e.props.pos.y - 72.5),
            sTag,
            {
                parent: e,
            }

        ]);

        e.props.use({newsight: s});
        console.log('sight added')
    }


    moveSight(u){

        // console.log('moveSight')
        if(!u) return false;

        u.newsight.pos.x = u.pos.x - 66;
        u.newsight.pos.y = u.pos.y - 70;

    }

    async shoot(u){
        // console.log(u.currentTarget);
        if(!u || u.currentTarget == null || !u.currentTarget.exists()) return false
        
        console.log('shooooooting');
        console.log('u = ', u);
        const {rr, gg, bb} = u.color;

        console.log(rr, gg, bb)
        
        u.color.r = 1;
        u.color.g = 1;
        u.color.b = 1;

        u.currentTarget.health -= 5;

        // console.log(u.currentTarget.health)

        await wait(.05, () => {
            u.color.r = rr;
            u.color.g = gg;
            u.color.b = bb;
        })
    }
}


export const genUnit = function(xPos, yPos, tag){

    let c;

    if (tag == 'enemy-unit'){
        c = [1, .2, .2, 1];
    }
    else{
        c = [.2, .7, .2, 1];
    }

    const unit = add([
        rect(5, 5),
        pos(xPos, yPos),
        color(c),
        tag,
    
    {
        speed: 300,
        selected: false,
        isHighlighted: false,
        isMoving: false,
        destinationX: xPos - rand(20, 40),
        destinationY: yPos + rand(-20, 20),

        hasTarget: false,
        targetX: null,
        targetY: null
    }
    ]);

    if (tag == 'enemy-unit'){
        const sWidth = 140;
        add([
            rect(sWidth, sWidth),
            color(1, 1, 0, 0.05),
            pos(xPos - (sWidth/2) + 2.5, yPos - (sWidth/2) + 2.5),
            'enemy-sight',
            {
                parent: unit,
            }
        ])



        const shoot = function(){
            unit.color.r = 1;
            unit.color.g = 1;
            unit.color.b = 1;

            wait(0.45, () => {
                unit.color.r = 1;
                unit.color.g = .2;
                unit.color.b = .2;
            })
        }
    }


    return unit;

}

export default genUnit;
