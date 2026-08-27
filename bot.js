const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// رابط بث كلاود فلير للقناة الأولى (يمكنك تغييره لقنوات ch2, ch3, ch4 لاحقاً)
const streamHlsUrl = process.env.STREAM_URL || 'https://still-leaf-1d62.ohyeahmman.workers.dev/live/stream/index.m3u8';
const IMGBB_API_KEY = "a434a1029c45ffbe1d5a70a16a248147"; // مفتاح ImgbB الخاص بك من الموقع

async function captureAndUploadSnapshot() {
    console.log(`[${new Date().toLocaleTimeString()}] جاري التقاط صورة المعاينة الحية للبث...`);
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        // إنشاء صفحة HTML مؤقتة داخل المتصفح تحتوي على مشغل Video.js لعرض البث التقاطاً دقيقاً للصورة
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <link href="https://vjs.zencdn.net/8.10.0/video-js.css" rel="stylesheet" />
                <script src="https://vjs.zencdn.net/8.10.0/video.min.js"></script>
                <style>body { background: #000; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }</style>
            </head>
            <body>
                <video id="player" class="video-js vjs-default-skin" autoplay muted playsinline style="width:100%; height:100%;">
                    <source src="${streamHlsUrl}" type="application/x-mpegURL">
                </video>
                <script>
                    var player = videojs('player');
                    player.play();
                </script>
            </body>
            </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // الانتظار قليلاً لضمان تحميل إطارات الفيديو الحية من البث
        console.log('انتظار تحميل الإطار الحي للبث...');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        const savePath = path.join(__dirname, 'live-thumb.jpg');
        
        // التقاط الصورة وتخزينها محلياً
        await page.screenshot({
            path: savePath,
            type: 'jpeg',
            quality: 85
        });
        
        console.log('✓ تم التقاط صورة المعاينة بنجاح وإرسالها!');
        
        // (اختياري) رفع الصورة تلقائياً إلى ImgBB لتحديثها في موقعك مباشرة
        await uploadToImgBB(savePath);

        await page.close();
        await browser.close();

    } catch (error) {
        console.error('حدث خطأ أثناء التقاط المعاينة:', error);
        await browser.close();
    }
}

// دالة لرفع الصورة الناتجة إلى ImgBB لاستخدامها في الموقع
async function uploadToImgBB(filePath) {
    try {
        const bitmap = fs.readFileSync(filePath);
        const base64Image = Buffer.from(bitmap).toString('base64');
        
        const formData = new URLSearchParams();
        formData.append('image', base64Image);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            console.log(`🔗 رابط الصورة المحدث على السحاب: ${data.data.url}`);
            // ملاحظة: يمكنك هنا ربطه بتحديث قاعدة بيانات Firebase تلقائياً إذا أردت!
        }
    } catch (err) {
        console.error('فشل رفع الصورة إلى ImgBB:', err.message);
    }
}

// تشغيل البوت لأول مرة فوراً
captureAndUploadSnapshot();

// جدولة البوت ليعمل تلقائياً كل 5 دقائق (300000 ميلي ثانية)
const INTERVAL_TIME = 5 * 60 * 1000;
setInterval(captureAndUploadSnapshot, INTERVAL_TIME);
console.log('🤖 تم تشغيل بوت المعاينات بنجاح، سيتم تحديث الصور كل 5 دقائق.');
