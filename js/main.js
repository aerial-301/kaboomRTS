'use-strict';
import Button from './buttons.js';
import Building from './building.js';
import Unit from './troops/units.js';

const k = kaboom({  global: true, 
                    width: 440, 
                    height: 574, 
                    debug: true,
                    crisp: true,
                });

loadSound("shoot", "./assets/GunShot1.ogg");



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


    // layers([
    //     "ground", "obj", "ui",
    // ], "obj");
    

    layers([
        "obj", "ui",
    ], "obj");
    

    camIgnore([ "ui", ]);
    
    let moveVecX, moveVecY, mousePosX, mousePosY, mag, moveX, moveY;
    let mainTB;
    let troobsBuilding = false;
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


    let groups = [];


    const bottomPanelHeight = 120;

    let oldMouseIsSet = false;
    // Mouse events

    const MouseDown = async () => {

        await wait(0.01);

        if (mousePos().x == oldMousePosX && mousePos().y == oldMousePosY) {

            // console.log('no mouse drag')
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

    const MouseRelease = () => {

        const finalSelection = add([
            rect(selection.width, selection.height),
            pos(selection.pos.x, selection.pos.y),
            color(0, 0, 0, 0.2),
            // layer('obj'),
            'selection-box',
        ]);

        selection.width = selection.height = 0;

        wait(0.1, () => {
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

    const GroundIsClicked = async () => {


        // status2.text = `${mousePos('ui').x}, ${mousePos('ui').y}`

        if(mousePos('ui').y >= k.height() - bottomPanelHeight) return false;
        console.log('clicked')
        if (selectionSet) {

            mousePosY = Math.floor(mousePos().y);
            mousePosX = Math.floor(mousePos().x);
            const len = selectedUnits.length;
            const size = Math.floor(Math.sqrt(len));



            for (let i in selectedUnits) {

                // console.log('move order');

                moveX = 5 + mousePosX + i * unitsSpacingX ** (size / len);
                moveY = mousePosY + (i % size) * unitsSpacingY;
                moveUnits(selectedUnits[i],
                    moveX,
                    moveY);
            }



        }


        else if (placingBuilding) {

            placingBuilding = false;

            mainTB = new Building(mousePos().x, mousePos().y, 'player-building');
            
            // await wait(0.5);

            mainTB.building.clicks(() => {
                if (!selectedUnits.includes(mainTB.building)) {
                    selectedUnits.push(mainTB.building);
                }
            });
            troobsBuilding = true;
            messages.text = 'Construction Complete';
            // mainTB = troopB;
            
        }

    };


    action("player-unit", async (unit) => {

        if(!unit.sightToggled){
            unit.sightToggled = true

            unit.toggleSight(unit);
            // console.log('action end');
            await wait(choose([1,2]));
            unit.sightToggled = false;
        }
        
    });


    action("enemy-unit", async (unit) => {

        if(!unit.sightToggled){
            unit.sightToggled = true

            unit.toggleSight(unit);
            // console.log('action end');
            await wait(1);
            unit.sightToggled = false;
        }
        
    });

    const EnemySight = (sight) => {

        if(!sight.parent.props.exists()){
            destroy(sight);
        }

        if (sight.inSight.length > 0) {
            sight.inSight = sight.inSight.filter(unit => unit.exists() == true);
            sight.inSight = sight.inSight.filter(unit => unit.isOverlapped(sight) == true);

            if (sight.parent.props.currentTarget != sight.inSight[0]) {
                sight.parent.props.currentTarget = sight.inSight[0];
            }
        }
        else {
            sight.parent.props.currentTarget = null;

            if (!sight.moved){
                sight.moved = true
                sight.parent.moveSight(sight.parent.props);
            }
        }
    };

    const EnemyUnits = async (u) => {

        await wait(0.2);



        if (u.currentTarget) {

            if (!u.currentTarget.exists()) {
                u.currentTarget = null;
                return false;
            }

            if (u.readyToFire) {
                u.readyToFire = false;

                u.shoot(u);  

                await wait(1, () => {
                    u.currentTarget = null;
                    u.readyToFire = true;
                });

            }

        }
        // else {
            // status2.text = 'scanning';
        // }
    };

    const PlayerAction = async (u) => {

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
                    u.newsight.moved = false;
                    u.currentTarget = null;
                    return false;
                }
            }

            mag = Math.sqrt(moveVecX ** 2 + moveVecY ** 2);
            moveVecX = (moveVecX / mag) * u.speed;
            moveVecY = (moveVecY / mag) * u.speed;
            u.move(moveVecX, moveVecY);
        }
        else{
            if(!u.newsight.moved){
                
                u.newsight.moved = true;
                u.moveSight(u);
            }

            await wait(0.1);
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


        }


    };



    const ground = add([
        // rect(k.width() - 28, k.height() - 140),
        rect(1500, 1500),
        pos( 14, 34),
        color(0.2, 0.2, 0.2),
        layer('obj'),
        // 'ground',
    ]);

    const bottomPanel = add([
        rect(k.width(), bottomPanelHeight),
        pos(0,k.height() - bottomPanelHeight),
        color(0,0,0),
        layer('ui'),
    ])

    const resourcesDisplay = add([
        text(`Gold: ${goldAmount}     Oil: ${oilAmount}`, 12),
        pos(18, 14),
        color(1, .6, .9),
        layer('ui')
    ])

    const messages = add([
        text('Messages', 9, {
            width: 400,
        }),
        pos( 18, k.height() - 30),
        layer('ui'),

    ]);

    const status = add([
        text('enemy state', 12),
        pos(20,200),
        layer('ui')
    ])

    const status2 = add([
        text('enemy state', 12),
        pos(20,220),
        layer('ui')
    ])

    const status3 = add([
        text('asda', 12),
        pos(20,240),
        layer('ui')
    ])

    const b2 = new Button(14, messages.pos.y  - 36, 'Building 1', 140);
    const b1 = new Button(14,  b2.y - 34, 'Unit 1');

    const troopB = new Building(340, 50, 'enemy-building');

    let eSpawned = false;


    b2.ref.clicks( () => {

        try {
            if(mainTB.building.exists()){
                messages.text = 'Build limit reached'
            }
            else {
                // await wait(0.1);
                placingBuilding = true;
                messages.text = 'choose location';
            }
        } catch (error) {
            // await wait(0.1);
            placingBuilding = true;
            messages.text = 'choose location';
        }


        // const bluePrint = add([
        //     rect(30, 30),
        //     color(1, 1, 1, 0.2),
        //     pos(0, 0),

        // ]);

    });

    b1.ref.clicks(() => {

        try {
            // console.log(mainTB.building.exists())
            if(mainTB.building.exists()){
                const z = new Unit(mainTB.building.pos.x, mainTB.building.pos.y, 'player-unit');
                z.getSight(z);
            }
            else {
                messages.text = 'Troops building required'
            }
        } catch (error) {
            messages.text = 'Troops building required'
        }
        
    });




    action('enemy-building', async (b) => {

        status3.text = debug.fps();
        // if(!eSpawned){

        //     eSpawned = true;

        //     await wait(4, () => {
        //         const u = new Unit(b.pos.x - 130, b.pos.y + 100, 'enemy-unit', 100)
        //         u.getSight(u)
        //     });

        //     eSpawned = false;
        // }

    });


    

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


    const moveUnits = function(i, mx, my){
        i.destinationX = mx;
        i.destinationY = my;
        i.isMoving = true;
    }

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
                        e.newsight.moved = false;
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





    function cancelSelection(){

        const temp = selectedUnits.slice()
        for(let i of temp){
            i.isHighlighted = false;
            i.selected = false;
        }
        selectedUnits = [];
        messages.text = 'Selection canceled'
        placingBuilding = false;

    }



    // Cancel current selection.
    keyPress('c', () => {
        cancelSelection();
    });

    keyPress('p', () => {
        messages.text = 'Paused'
        debug.paused = !debug.paused;
    });

    keyPress('w', () =>{
        console.log(camPos().y)

        camPos().y -= 10
    });

    keyPress('s', () =>{
        console.log(camPos().y)

        camPos(mousePos())
    });

    on('add', 'player-unit', (u) =>{
        wait(0.5, () => {

            u.newsight.paused = true;
            u.newsight.hidden = true;
        })
        
    });

    on('add', 'enemy-unit', (u) =>{
        wait(0.5, () => {
            u.newsight.paused = true;
            u.newsight.hidden = true;
        })
        
    });


    keyPress('h', () => {

        const a = get('player-sight');

        console.log(a.paused)

        for(let i of a){
            // console.log(i);
            // i.hidden = true;
            i.paused = false;
            i.hidden = false;

            wait(0.1, () =>{
                i.paused = true;
                i.hidden = true;
            })
        }

    });

    keyPress('1', () => {
        if(keyIsDown('control')){
            groups[0] = selectedUnits.slice();
        }
        else {
            try {
                cancelSelection();
                groups[0] = groups[0].filter(unit => unit.exists())
                for(let i of groups[0]){
                    i.isHighlighted = true;
                    selectedUnits.push(i);
                }
                selectionSet = true;
                messages.text = `${selectedUnits.length} units selected`;
            } catch (e) {
                console.log(e);
            }
        }
    });

    keyPress('2', () => {
        if(keyIsDown('control')){
            groups[1] = selectedUnits.slice();
        }
        else {
            try {
                cancelSelection();
                groups[1] = groups[1].filter(unit => unit.exists())
                for(let i of groups[1]){
                    i.isHighlighted = true;
                    selectedUnits.push(i);
                }
                selectionSet = true;
                messages.text = `${selectedUnits.length} units selected`;
            } catch (e) {
                console.log(e);
            }
        }
    });

    keyPress('3', () => {
        if(keyIsDown('control')){
            groups[2] = selectedUnits.slice();
        }
        else {
            try {
                cancelSelection();
                groups[2] = groups[2].filter(unit => unit.exists())
                for(let i of groups[2]){
                    i.isHighlighted = true;
                    selectedUnits.push(i);
                }
                selectionSet = true;
                messages.text = `${selectedUnits.length} units selected`;
            } catch (e) {
                console.log(e);
            }
        }
    });









    //////////////////////////////////////////////
    // DEBUG

    keyPress('r', () =>{
        if(selectedUnits.length > 0){
            for(let i of selectedUnits){
                destroy(i);
            }
            selectedUnits = [];
        }
    });

    keyPress('u', () =>{
        const x = new Unit(rand(40, 200), rand(80, 130), 'enemy-unit');
        x.getSight(x);
    });


    /////////////////////////////////////////////////





});

scene('Paused', () => {

    keyPress('p', () => {

        go(mainScreen);
        // messages.text = 'Resumed';
    });
    
});

start('root');
// start('main');
