import { buildingsProperties } from "./constants.js";

export default class Building {

    constructor(type, xPos, yPos, tag){

        this.type = type

        if(type == 'Camp'){
            this.health = buildingsProperties.CAMP.health;
        }
        else if (type == 'Miner'){
            this.health = buildingsProperties.MINER.health;
        }

        if(tag == 'player-building'){
            this.startFrame = 0;
        }
        else this.startFrame = 1;

        this.building = add([
            pos(xPos, yPos),
            sprite(type, {
                frame: this.startFrame,
            }),
            origin("center"),
            solid(),
            tag,
            'Building',
            'Killable',
            {   
                health: this.health,
                gate_x: 380,
                gate_y: 430,
                isHighlighted: false,
                startFrame: this.startFrame,
            }
        ]);

    }

}
