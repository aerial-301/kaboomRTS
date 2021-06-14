export default class Building {

    constructor(type, xPos, yPos, tag, health = 1000){

        this.startFrame;

        this.type = type

        this.health = health


        if(tag == 'player-building'){
            this.startFrame = 0;
        }
        else this.startFrame = 1;

        this.building = add([
            pos(xPos, yPos),
            sprite(type, {
                frame: this.startFrame,
            }),
            tag,
            'Killable',
            {   
                health: health,
                gate_x: 380,
                gate_y: 430,
                isHighlighted: false,
                startFrame: this.startFrame,
            }
        ]);

    }

}
