'use-strict';
import Button from './buttons.js';
import Building from './building.js';
import Unit from './troops/units.js';

const k = kaboom({global: true, width: 440, height: 574});

loadSound("shoot", "./assets/GunShot1.ogg");

// layers([
//     "ground", "obj", "ui",
// ], "obj");
scene('root', () => {

    const rootBackGround = add([
        rect(k.width(), k.height()),
        pos(0,0),
        color(0,0,0),
    ]);

    const startButton = new Button(k.width() / 2 - 100, 200, 'Start',
                    200, 80, 38, 28, 24);

    startButton.ref.clicks(() => {

        go('main');
    });


});


const mainScreen = scene('main', () => {
    
    let moveVecX, moveVecY, mousePosX, mousePosY, mag, moveX, moveY, mainTB;
    let goldAmount = 1000;
    let oilAmount = 1000;
    let rectPosSet = false;
    let oldMousePosX = 0;
    let oldMousePosY = 0;
    let selectedUnits = []
    let selectionSet = false;  
    let placingBuilding = false;
    const unitsSpacingX = 80; 
    const unitsSpacingY = 10; 

    const MouseDown = () => {

        if (mousePos().x == oldMousePosX && mousePos().y == oldMousePosY) {
            return false;
        }

        if (!rectPosSet) {

            selection.pos.x = mousePos().x;
            selection.pos.y = mousePos().y;
            selection.area.p1.x = selection.pos.x;
            selection.area.p1.y = selection.pos.y;
            rectPosSet = true;
        }

        selection.width = mousePos().x - selection.pos.x;
        selection.height = mousePos().y - selection.pos.y;
        selection.area.width = selection.width;
        selection.area.height = selection.height;

        oldMousePosX = mousePos().x;
        oldMousePosY = mousePos().y;
    };

    const EnemySight = (sight) => {

        // status.text = `${sight.inSight.length} units in sight`;

        if (sight.inSight.length > 0) {
            sight.inSight = sight.inSight.filter(unit => unit.exists() == true);
            sight.inSight = sight.inSight.filter(unit => unit.isOverlapped(sight) == true);
            // status.text = `${sight.inSight.length} units in sight`;

            if (sight.parent.props.currentTarget != sight.inSight[0]) {
                // console.log(sight.parent.currentTarget);
                sight.parent.props.currentTarget = sight.inSight[0];
            }

            // sight.parent.shoot(sight.parent);
            if (!oneTimeRun2) {
                // console.log('sight.parent.props.currentTarget = ', sight.parent.props.currentTarget);
                oneTimeRun2 = true;
            }

        }
        else {
            sight.parent.props.currentTarget = null;
            sight.parent.moveSight(sight.parent.props);
            // console.log(sight.parent)
        }

    };

    const EnemyUnits = (u) => {

        if (u.currentTarget) {

            if (!u.currentTarget.exists()) {
                u.currentTarget = null;
                return false;
            }

            if (u.readyToFire) {
                u.readyToFire = false;

                u.shoot(u);  

                wait(1, () => {
                    u.readyToFire = true;
                });

            }

        }
        // else {
            // status2.text = 'scanning';
        // }
    };

    const MouseRelease = () => {

        const finalSelection = add([
            rect(selection.width, selection.height),
            pos(selection.pos.x, selection.pos.y),
            color(0, 0, 0, 0.2),
            // layer('obj'),
            'selection-box',
        ]);

        selection.width = selection.height = 0;

        wait(0.03, () => {
            if (selectedUnits.length > 0) {
                messages.text = `${selectedUnits.length} units selected`;

                for (let i of selectedUnits) {
                    i.selected = true;
                    i.isHighlighted = true;
                }
                selectionSet = true;
            }
            destroy(finalSelection);
        });
        rectPosSet = false;
    };

    const GroundIsClicked = () => {

        if (selectionSet) {

            mousePosY = Math.floor(mousePos().y);
            mousePosX = Math.floor(mousePos().x);
            const len = selectedUnits.length;
            const size = Math.floor(Math.sqrt(len));

            for (let i in selectedUnits) {

                moveX = 5 + mousePosX + i * unitsSpacingX ** (size / len);
                moveY = mousePosY + (i % size) * unitsSpacingY;
                moveUnits(selectedUnits[i],
                    moveX,
                    moveY);
            }
        }


        if (placingBuilding) {

            const troopB = Building(mousePos().x, mousePos().y, 'player-building');
            troopB.clicks(() => {
                if (!selectedUnits.includes(troopB)) {
                    selectedUnits.push(troopB);
                }
            });
            mainTB = troopB;
            placingBuilding = false;
        }

    };

    const PlayerAction = (u) => {

        if (u.isHighlighted) {
            u.color.r = 0.5;
        }
        else {
            u.color.r = 0;
        }

        if (u.isMoving) {

            moveVecX = Math.floor(u.destinationX - u.pos.x);
            moveVecY = Math.floor(u.destinationY - u.pos.y);

            if (Math.abs(moveVecX) < 10) {
                if (Math.abs(moveVecY) < 10) {
                    u.isMoving = false;
                    return false;
                }
            }

            mag = Math.sqrt(moveVecX ** 2 + moveVecY ** 2);
            moveVecX = (moveVecX / mag) * u.speed;
            moveVecY = (moveVecY / mag) * u.speed;
            u.move(moveVecX, moveVecY);
            u.moveSight(u);
        }

        if (u.currentTarget) {

            if (!u.currentTarget.exists()) {
                u.currentTarget = null;
                return false;
            }

            if (u.readyToFire) {
                u.readyToFire = false;
                u.shoot(u);
                wait(1, () => {
                    u.readyToFire = true;
                });
            }
        }
    };


    const frame = add([
        rect(k.width(), k.height()),
        pos(0,0),
        color(0,0,0),
    ])

    const ground = add([
        rect(k.width() - 28, k.height() - 140),
        pos( 14, 34),
        color(0.2, 0.2, 0.2),
        
        // layer("ground"),
    ], 'ground',);

    const resourcesDisplay = add([
        text(`Gold: ${goldAmount}     Oil: ${oilAmount}`, 12),
        pos(18, 14),
        color(1, .6, .9),
    ])

    const messages = add([
        text('Messages', 9, {
            width: 400,
        }),
        pos( 18, k.height() - 30)

    ]);

    const status = add([
        text('enemy state', 12),
        pos(20,200)
    ])

    const status2 = add([
        text('enemy state', 12),
        pos(20,220)
    ])

    const status3 = add([
        text('enemy state', 12),
        pos(20,240)
    ])

    const b2 = new Button(14, messages.pos.y  - 36, 'Building 1', 140);
    const b1 = new Button(14,  b2.y - 34, 'Unit 1');

    const troopB = Building(340, 50, 'enemy-building');

    let eSpawned = false;

    action('enemy-building', async (b) => {


        if(!eSpawned){

            eSpawned = true;

            await wait(4, () => {
                const u = new Unit(b.pos.x - 130, b.pos.y + 100, 'enemy-unit', 100)
                u.getSight(u)
            });

            eSpawned = false;
        }

        

        

    });

    b2.ref.clicks(() => {

        placingBuilding = true
        messages.text = 'Choose location';

        // const bluePrint = add([
        //     rect(30, 30),
        //     color(1, 1, 1, 0.2),
        //     pos(0, 0),

        // ]);

    });


    for (let i = 0; i < 4; i++){
        const x = new Unit(rand(40, 200), rand(80, 130), 'enemy-unit');
        x.getSight(x);
        
    }

    overlaps('enemy-sight', 'player-unit', (s, p) =>{
        s.inSight.push(p);
        s.parent.hasTarget = true;
    });

    overlaps('player-sight', 'enemy-unit', (s, e) =>{
        s.inSight.push(e);
        s.parent.hasTarget = true;
    });

    overlaps('player-sight', 'enemy-building', (s, e) =>{
        s.inSight.push(e);
        s.parent.hasTarget = true;
    });

    overlaps('enemy-sight', 'player-building', (s, e) =>{
        s.inSight.push(e);
        s.parent.hasTarget = true;
    });


    action('Killable', (u) =>{
        if(u.health <= 0){
            destroy(u);
        }
    })


    action('enemy-sight', EnemySight);

    action('player-sight', EnemySight);

    action('enemy-unit', EnemyUnits);

    action('player-unit', PlayerAction);

    let oneTimeRun = false;
    let oneTimeRun2 = false

    keyPress('b', () => {
        oneTimeRun = false;
        oneTimeRun2 = false;
    })

    const selection = add([
        rect(0, 0),
        color(1, 1, 1, 0.2),
        pos(0, 0),
        // layer("obj"),
    ]);

    overlaps('selection-box', 'player-unit', (e, u) =>{
        
        if (!selectedUnits.includes(u)){
            selectedUnits.push(u);
        }

    });

    mouseDown(MouseDown);
    mouseRelease(MouseRelease);
    ground.clicks(GroundIsClicked);

    b1.ref.clicks(() => {
        try {
            const z = new Unit(mainTB.pos.x, mainTB.pos.y, 'player-unit');
            z.getSight(z);
        } catch (e) {
                messages.text = e;
        }
    });

    const moveUnits = function(i, mx, my){
        i.destinationX = mx;
        i.destinationY = my;
        i.isMoving = true;
    }

    // Cancel current unit selection.
    keyPress('c', () => {
        const temp = selectedUnits.slice()
        for(let i of temp){
            i.isHighlighted = false;
            i.selected = false;
            selectedUnits.pop()
        }
        messages.text = 'Selection canceled'
    });

    keyPress('p', () => {
        messages.text = 'Paused'
        debug.paused = !debug.paused;
    });

    // RUNNING TWICE ? 
    // on("add", "player-unit", async (e) => {
    //     console.log('unit ready')
    //     await wait(1, () =>{
    //         e.getSight(e);
    //     })
    //     console.log('getSight done')
    // });

    

    action('player-sight', (s) => {
        if(!s.parent.props.exists()){
            destroy(s);
        }
    });
    action('enemy-sight', (s) => {
        if(!s.parent.props.exists()){
            destroy(s);
        }
    });

    action('player-building', (b) => {
        if (b.isHighlighted){
            b.color.r = 1;
        }
        else{
            b.color.r = 0;
        }
    });

    action('enemy-unit', async (e) => {

        if (!e.currentTarget ){

            if(e.isIdle) return false;

            if(!e.isMoving){
                
                moveUnits(
                    e, 
                    e.pos.x + choose([3,4,5])*50, 
                    e.pos.y + choose([3,4,5])*50);

            }


            if(e.isMoving){

                moveVecX = Math.floor(e.destinationX - e.pos.x);
                moveVecY = Math.floor(e.destinationY - e.pos.y);

                if (Math.abs(moveVecX) <= 1) {
                    if (Math.abs(moveVecY) <= 1) {

                        e.isIdle = true;
                        await wait(choose([3, 5, 7, 12, 15]));
                        e.isMoving = false;
                        e.isIdle = false;
                        return false;
                    }
                }

                mag = Math.sqrt(moveVecX ** 2 + moveVecY ** 2);
                moveVecX = (moveVecX / mag) * 70;
                moveVecY = (moveVecY / mag) * 70;
                e.move(moveVecX, moveVecY);



                

            }

        }

    });



    //////////////////////////////////////////////
});

scene('Paused', () => {

    keyPress('p', () => {

        go(mainScreen);
        // messages.text = 'Resumed';
    });
    
});

start('root');
// start('main');
