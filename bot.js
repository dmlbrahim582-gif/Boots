const puppeteer = require('puppeteer');
const path = require('path');

// رابط البث الخاص بك (يتم جلبه من متغيرات البيئة أو الرابط الافتراضي)
const streamUrl = process.env.STREAM_URL || 'https://july-marcus-scotland-stat.trycloudflare.com/live/live/index.m3u8';

async function captureSnapshot() {
    console.log(`[${new Date().toLocaleTimeString()}] البدء في التقاط صورة المعاينة الحية...`);
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        // الانتقال إلى رابط البث
        await page.goto(streamUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // الانتظار لتجاوز شاشات التحميل أو الشاشة السوداء
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const savePath = path.join(__dirname, 'live-thumb.jpg');
        
        // التقاط الصورة وتنسيقها
        await page.screenshot({
            path: savePath,
            type: 'jpeg',
            quality: 85
        });
        
        console.log('✓ تم التقاط صورة المعاينة بنجاح!');
        await page.close();

    } catch (error) {
        console.error('حدث خطأ أثناء التقاط الصورة:', error);
    } finally {
        await browser.close();
    }
}

// تشغيل التقاط الصورة لمرة واحدة عند تنفيذ الأكشن
captureSnapshot();
