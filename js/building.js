export const constructBuilding = function(xPos, yPos, tag, width = 30, height = 30){

    const tb = add([
        rect(width, height),
        pos(xPos, yPos),
        color(.3, .8, .7),
        tag,
        {
            gate_x: 380,
            gate_y: 430,
            highlighted: false,
        }
    ]);

    return tb;
}

export default constructBuilding;