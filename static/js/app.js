class Main{
    constructor(){
        this.canvas = document.getElementById('canvas');
        this.input = document.getElementById('input');
        this.output = document.getElementById('output');
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
onMouseUp(e){
    this.drawing = false;
    this.drawThumbnail();

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
        if (Math.min(...inputs) === 255){
            return;
        }
        let output = this.output;
        $.ajax({
            url: '/api/mnist',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(inputs),
            success: (data) => {
                data=data.results[0];
                this.output.innerHTML = '<h1>Prediction</h1>'
                console.log(this.output);
                for (i=0;i<data.length;i++){
                    console.log(data[i]);
                    var row = document.createElement('h' + (i + 1));
                    row.innerText = data[i][0];
                    output.appendChild(row);
                };
            }
           });
    };
    img.src = this.canvas.toDataURL();
    }
}
window.onload = () => {
    var main = new Main();
    $('#reset').click(()=>{
        main.initialize();
    });
    main.initialize();
}

