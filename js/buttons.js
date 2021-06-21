// 'use-strict';

export default class Button {

    constructor(x, y, act, t = '', w = 90, h = 30, f_size = 12, noText = false, pic = ''){

        this.x = x;
        this.y = y;
        this.act = act;
        this.t = t;
        this.w = w;
        this.h = h;



        this.button = add([
            rect(w, h ),
            pos(x, y),
            color(0, 0.5, 0,),
            origin('center'),
            layer('ui'),
            {
                act: this.act,
            }
        ]);

        if(noText){
            add([
                sprite(pic),
                origin('center'),
                pos(x, y),
                layer('ui'),
            ]);
        }


        else{

            this.text = add([
                
                text(t, f_size, {
                    width: w,
                }),
                origin('center'),
                pos(x, y),
                layer('ui'),
                
            ]);
            
        }
    }
        
    act(){
        this.act();
    }
    

}