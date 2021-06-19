import { buildingsProperties } from "./constants.js";

export default class Building {

    constructor(type, xPos, yPos, tag){

        this.type = type;

        if(type == 'Camp'){
            this.health = buildingsProperties.CAMP.health;
        }
        else if (type == 'Miner'){
            this.health = buildingsProperties.MINER.health;
        }
        else if (type == 'GreenTurret' || type == 'BlueTurret'){
            this.health = buildingsProperties.TURRET.health;
        }

        if(tag == 'player-building'){
            this.startFrame = 0;
        }
        else if(type == 'BlueTurret') this.startFrame = 3;

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
            (type == 'GreenTurret' || type == 'BlueTurret') ? 'Turret' : '',
            {   
                health: this.health,
                baseHealth: this.health,
                healthBar: this.healthBar,
                isHighlighted: false,
                startFrame: this.startFrame,
                owner: tag,
                type: type,
                // isDamaged: false,
                
            }

        ]);


        this.healthBar = add([
            rect(100, 20),
            origin('center'),
            pos(xPos, yPos - 40),
            color(0, 1, 0),
            'HB',
            {
                parent: this.building,
            }
        ]);

    }

}









