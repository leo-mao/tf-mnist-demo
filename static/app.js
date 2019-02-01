class Main{
    constructor(){
        this.canvas = document.getElementById('canvas');
        this.input = document.getElementById('input');
        this.canvas.width = 449;
        this.canvas.height = 449;
        this.canvas.style.cursor = 'crosshair';

        this.ctx = this.canvas.getContext('2d');
        // Painter
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.initialize();
    }
    initialize(){
        this.ctx.fillStyle = '#ffffff'
        this.ctx.strokeStyle = '#000000';

        //   449 = 28 * 16 + 1
        this.ctx.fillRect(0, 0, 449, 449);
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, 449, 449);

        this.ctx.strokeStyle = '#a6a6a6';
        this.ctx.lineWidth = 0.8;
        // draw vertical bounds
        for (var i=0; i<27; i++){
            this.ctx.beginPath();
            this.ctx.moveTo((i+1)*16, 0 + 1);// avoid crossing with bounds
            this.ctx.lineTo((i+1)*16, 449 - 1);
            this.ctx.stroke();
            this.ctx.closePath();

//        draw horizontal bounds
            this.ctx.beginPath();
            this.ctx.moveTo(0 + 1, (i+1)*16);
            this.ctx.lineTo(449 - 1, (i+1)*16);
            this.ctx.closePath();
            this.ctx.stroke();
        }

        this.ctx.strokeStyle = '#000000'
        this.drawThumbnail();
}
onMouseDown(e){
    this.drawing = true;
    this.prev = this.getPosition(e.clientX, e.clientY);
}
onMouseUp(){
    this.drawing = false;
    this.drawThumbnail();
//    console.log('drawThumbnail()')
    }
onMouseMove(e){
    if (this.drawing){
        var curr = this.getPosition(e.clientX, e.clientY);
        this.ctx.lineWidth = 16;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(this.prev.x, this.prev.y);
        this.ctx.lineTo(curr.x, curr.y);
        this.ctx.stroke();
        this.ctx.closePath();
        this.prev = curr;
        }
    }
getPosition(clientX, clientY){
    var rect = this.canvas.getBoundingClientRect();
    return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
drawThumbnail(){
    var ctx = this.input.getContext('2d');
    var img = new Image();
    img.onload = () => {
        console.log("onload");
        var inputs = [];
        var tb = document.createElement('canvas').getContext('2d');
        //scale
        tb.drawImage(img, 0, 0, img.width, img.height, 0, 0, 28, 28);
        var data = tb.getImageData(0, 0, 28, 28).data;
        for (var i=0; i<28; i++){
            for (var j = 0;j < 28; j++){
                // position for pixel
                var n = 4*(i*28+j);

                inputs[i*28+j] = (data[n+0]+data[n+1]+data[n+2])/3;
                ctx.fillStyle = 'rgb('+[data[n+0],data[n+1],data[n+2]].join(',')+')';
                // 140/28=5
                ctx.fillRect(j*5,i*5,5,5);
            }
        }
        $.ajax({
            url: '/api/mnist',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(inputs),
            success: (data) => {
                console.log(data);
//                for(let i=0;i<2;i++){
//                    var max=0;
//                    var max_index=0;
//                    for(let j=0;j<10;j++){
//                        var value=Math.round(data.results[i][j]*1000);
//                        if (value>max){
//                            max=value;
//                            max_index=j;
//                        }
//                        var digits = String(value).length;
//                        for(var k=0;k<3-digits;k++){
//                            value='0'+value;
//                        }
//                        var text='0.'+value;
//                        if(value>999){
//                            text = '1.000';
//                        }
//                    }
//                    console.log('max index'+max_index);
//                }
            }
           });
    };
    img.src = this.canvas.toDataURL();
//    console.log(img);
}
}
window.onload = () => {
    var main = new Main();
    main.initialize();
}
