export class Unit{

    constructor(xPos, yPos, tag){

        this.xPos = xPos;
        this.yPos = yPos;
        this.tag = tag;

        

        if (tag == 'enemy-unit'){
            this.c = [.7,.2,.2,1];
            this.sightTag = 'enemy-sight';
        } 
            
        else {
            this.c = [.2,1,.2,1];
            this.sightTag = 'player-sight';
        }

        this.props = add([
            rect(5, 5),
            pos(xPos, yPos),
            color(this.c),
            tag,
        
            {   
                health: 10,
                speed: 300,
                selected: false,
                highlighted: false,
                moving: true,
                destinationX: xPos - rand(20, 40),
                destinationY: yPos + rand(-20, 20),
                targetAcquired: false,
                firing: false,
                readyToFire: true,
                currentTarget: null,
                shoot: this.shoot,
                // targetX: null,
                // targetY: null
            }
        ]);

        // if (tag == 'enemy-unit'){
        //     const sWidth = 140;
        //     add([
        //         rect(sWidth, sWidth),
        //         color(1, 1, 0, 0.05),
        //         pos(xPos - (sWidth/2) + 2.5, yPos - (sWidth/2) + 2.5),
        //         'enemy-sight',
        //         {
        //             parent: this.props,
        //         }
        //     ])
        // }

        const sWidth = 140;
        this.sight = add([
            rect(sWidth, sWidth),
            color(1, 1, 0, 0.02),
            pos(xPos - (sWidth/2) + 2.5, yPos - (sWidth/2) + 2.5),
            this.sightTag,
            
            {
                parent: this.props,
                moveSight: this.moveSight(),
            }
        ]);
        





    }


    moveSight(){

        // TODO: implement sight movement with parent object

    }



    async shoot(u){
        if(!u.currentTarget.exists()) return false
        console.log('shooooooting');
        const {rr, gg, bb} = u.color;

        u.color.r = 1;
        u.color.g = 1;
        u.color.b = 1;

        u.currentTarget.health -= 7;

        console.log(u.currentTarget.health)

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
        highlighted: false,
        moving: false,
        destinationX: xPos - rand(20, 40),
        destinationY: yPos + rand(-20, 20),

        targetAcquired: false,
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
