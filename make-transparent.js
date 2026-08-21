const { Jimp } = require('jimp');

async function removeBackground() {
    try {
        const image = await Jimp.read('public/uploads/PhoneSpot.jpeg');
        // Let's assume top-left pixel is background color
        const bgColor = image.getPixelColor(0, 0);
        
        // tolerance for similarity
        const tolerance = 50;
        
        // rgba of bgColor
        const r1 = (bgColor >> 24) & 255;
        const g1 = (bgColor >> 16) & 255;
        const b1 = (bgColor >> 8) & 255;
        
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const r2 = this.bitmap.data[idx + 0];
            const g2 = this.bitmap.data[idx + 1];
            const b2 = this.bitmap.data[idx + 2];
            
            if (Math.abs(r1 - r2) <= tolerance && Math.abs(g1 - g2) <= tolerance && Math.abs(b1 - b2) <= tolerance) {
                this.bitmap.data[idx + 3] = 0; // alpha to 0
            }
        });
        
        await image.write('public/uploads/PhoneSpot-trans.png');
        console.log('Background removed!');
    } catch (e) {
        console.error(e);
    }
}

removeBackground();
