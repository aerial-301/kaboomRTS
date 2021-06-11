'use-strict';
import genUnit from './troops/units.js';
import Button from './buttons.js';
import Building from './building.js';
import { Unit } from './troops/units.js';

const k = kaboom({global: true, width: 440, height: 574});
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

    let goldAmount = 1000;
    let oilAmount = 1000;

    let rectPosSet = false;
    let oldMousePosX = 0;
    let oldMousePosY = 0;
    let selectedUnits = []
    let moveVecX, moveVecY, mousePosX, mousePosY, mag;
    let selectionSet = false;  
    let placingBuilding = false;
    let fresh_unit = true;
    let troopsbuilding;
    let mainTB;

    

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

    action('player-building', (b) => {

        if (b.highlighted){
            b.color.r = 1;
        }
        else{
            b.color.r = 0;
        }
    });

    const b2 = new Button(14, messages.pos.y  - 36, 'Building 1', 140);
    const b1 = new Button(14,  b2.y - 34, 'Unit 1');


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
        // const x = new Unit(rand(100, 200), rand(300, 400), 'player-unit');
        // genUnit(rand(100, 200), rand(300, 400), 'player-unit');

        // const x = new Unit(rand(100, 200), rand(300, 400), 'player-unit');
    }

    for (let i = 0; i < 1; i++){
        // const u = genUnit(rand(40, 200), rand(80, 130), 'enemy-unit');

        const x = new Unit(rand(40, 200), rand(80, 130), 'enemy-unit');
        x.getSight(x);




        // console.log(x);
    }

    let unitInSight = [];


    overlaps('enemy-sight', 'player-unit', (s, p) =>{

        unitInSight.push(p);

        s.parent.targetAcquired = true;
        s.parent.currentTarget = p;
        // messages.text = s.parent.speed;
    });


    const status = add([
        text('enemy state', 12),
        pos(200,100)
    ])

    const status2 = add([
        text('enemy state', 14),
        pos(200,140)
    ])

    action('enemy-sight', (sight) => {

        status.text = `${unitInSight.length} units in sight`;
        
        if (unitInSight.length > 0){
            unitInSight = unitInSight.filter( unit => unit.exists() == true);
            unitInSight = unitInSight.filter( unit => unit.isOverlapped(sight) == true);
            status.text = `${unitInSight.length} units in sight`;

            
            if(sight.parent.props.currentTarget != unitInSight[0]){
                // console.log(sight.parent.currentTarget);
                sight.parent.props.currentTarget = unitInSight[0]
            }

            // sight.parent.shoot(sight.parent);

            if(!oneTimeRun2){
                console.log('sight.parent.props.currentTarget = ',sight.parent.props.currentTarget);
                oneTimeRun2 = true
            }

        }
        else {
            sight.parent.props.currentTarget = null;
            sight.parent.moveSight(sight.parent.props)
            // console.log(sight.parent)
        }

    });

    let oneTimeRun = false;
    let oneTimeRun2 = false

    keyPress('b', () => {
        oneTimeRun = false;
        oneTimeRun2 = false;
    })

    action('enemy-unit', async (u) => {

        if(!oneTimeRun){
            
            console.log('enemy-unit u.currentTarget = ', u.currentTarget)
            oneTimeRun = true
        }
        


        if(u.currentTarget){
            

            if(!u.currentTarget.exists()) {
                u.currentTarget = null;
                return false;
            }

            if(u.readyToFire){

                console.log('shooting at target');

                status2.text = 'Firing'
                u.shoot(u);
                u.readyToFire = false;
                
                await wait(.5, () => {
                    u.readyToFire = true;
                });

            }

        }
        else {
            status2.text = 'scanning'
        }
    });


    const selection = add([
        rect(0, 0),
        color(1, 1, 1, 0.2),
        pos(0, 0),
        // layer("obj"),
    ]);

    mouseDown(() => {

        if (mousePos().x == oldMousePosX && mousePos().y == oldMousePosY) {
            return false;
        }

        if (! rectPosSet) {

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
    });

    overlaps('selection-box', 'player-unit', (e, u) =>{
        
        if (!selectedUnits.includes(u)){
            selectedUnits.push(u);
        }

    });

    mouseRelease(() => {

        const finalSelection = add([
            rect(selection.width, selection.height),
            pos(selection.pos.x, selection.pos.y),
            color(0,0,0,0.2),
            // layer('obj'),
            'selection-box',
        ]);
        
        selection.width = selection.height = 0;

        wait( 0.03, () =>{
            if (selectedUnits.length > 0) {
                messages.text = `${selectedUnits.length} units selected`
                
                for (let i of selectedUnits) {
                    i.selected = true;
                    i.highlighted = true;
                }
                selectionSet = true;
            }
            destroy(finalSelection);
        });
        rectPosSet = false; 
    });

    const unitsSpacingX = 80; 
    const unitsSpacingY = 10; 
    let moveX, moveY;

    ground.clicks(() => {

        if (selectionSet) {

            mousePosY = Math.floor(mousePos().y);
            mousePosX = Math.floor(mousePos().x);
            const len = selectedUnits.length;
            const size = Math.floor(Math.sqrt(len));

            for (let i in selectedUnits){

                moveX = 5 + mousePosX + i * unitsSpacingX**(size/len);
                moveY = mousePosY + (i % size) * unitsSpacingY;
                moveUnits(selectedUnits[i], 
                            moveX,
                            moveY);
            }
        }


        if (placingBuilding){

            const troopB = Building(mousePos().x, mousePos().y, 'player-building');
            troopB.clicks(() => {
                if (!selectedUnits.includes(troopB)){
                    selectedUnits.push(troopB);
                }
            });
            mainTB = troopB;
            placingBuilding = false;
        }

    });


    b1.ref.clicks(() => {

        try {
            // const z = new Unit(troopsBuilding.pos.x, troopsBuilding.pos.y, 'player-unit');
            // const z = new Unit(troopsbuilding.pos.x, troopsbuilding.pos.y, 'player-unit');
            // const z = genUnit(troopsbuilding.pos.x, troopsbuilding.pos.y, 'player-unit');
            // const z = genUnit(mainTB.pos.x, mainTB.pos.y, 'player-unit');
            const z = new Unit(mainTB.pos.x, mainTB.pos.y, 'player-unit');
            z.getSight(z);
        
        } catch (e) {
                messages.text = e;
        }
    });


    const moveUnits = function(i, mx, my){
        i.destinationX = mx;
        i.destinationY = my;
        i.moving = true;
    }

    // Cancel current unit selection.
    keyPress('c', () => {
        const temp = selectedUnits.slice()
        for(let i of temp){
            i.highlighted = false;
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

    // Player units movement.
    action('player-unit', (u) => {

        if (u.health <= 0){
            // u.remove();
            destroy(u);
            
        }


        if (u.highlighted){
            u.color.r = 1;
        }
        else{
            u.color.r = 0;
        }

        if (u.moving){

            moveVecX = Math.floor(u.destinationX - u.pos.x);
            moveVecY = Math.floor(u.destinationY - u.pos.y);

            if (Math.abs(moveVecX) < 10) {
                if (Math.abs(moveVecY) < 10) {
                    u.moving = false;
                    return false;
                }
            }

            mag = Math.sqrt(moveVecX ** 2 + moveVecY ** 2);
            moveVecX = (moveVecX / mag) * u.speed;
            moveVecY = (moveVecY / mag) * u.speed;
            u.move(moveVecX, moveVecY);
            u.moveSight(u);
        }


    });


    action('player-sight', (s) => {

        if(!s.parent.props.exists()){

            destroy(s);

        }


    });

    let distance = 0;

    const d = 100


    action('enemy-unit', (e) => {


        if (unitInSight.length == 0){

            if(distance < d){
                e.move(60, 0);
                // console.log('moving right');
            }
            
            else if(distance < d * 2){
                e.move(-60, 0);
                // console.log('moving left');    
            }
    
            else distance = 0;
    
            distance += 1


        }

        
        
    })    

    

        





});





scene('Paused', () => {

    keyPress('p', () => {
        go(mainScreen);
        // messages.text = 'Resumed';
    });
    
});


// start('timeTest');
// start('root');
start('main');
