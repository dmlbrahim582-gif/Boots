const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// الرابط الخاص بموقعك الذي يحتوي على المشغل والأنيميشن
const TARGET_URL = 'https://playr.xo.ie'; 
// المسار الذي سيتم حفظ الصورة فيه (استبدله بمسار مجلد موقعك)
const OUTPUT_IMAGE_PATH = path.join(__dirname, 'live-thumb.jpg'); 

async function takeAutomatedScreenshot() {
    let browser;
    try {
        // 1. تشغيل المتصفح الوهمي في الخلفية بجودة عالية ومناسب للسيرفرات
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // 2. ضبط أبعاد الشاشة لتبدو كشاشة ديسكتوب أو هاتف واضحة
        await page.setViewport({ width: 1280, height: 720 });

        // 3. الدخول إلى موقعك والانتظار حتى يتم تحميل العناصر بالكامل
        console.log(`جاري الدخول إلى الموقع: ${TARGET_URL}...`);
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // 4. تحديد عنصر المشغل (صندوق الفيديو والغطاء الغامق والأوفرلاي)
        const videoBoxSelector = '#videoBox';
        await page.waitForSelector(videoBoxSelector);
        const videoBox = await page.$(videoBoxSelector);

        if (videoBox) {
            // 5. التقاط السكرين شوت لعنصر المشغل فقط
            // ونظراً لأننا نستخدم نفس الاسم 'live-thumb.jpg'، سيقوم السيرفر بحذف القديمة تلقائياً وافتراسها لتوفير المساحة!
            await videoBox.screenshot({ path: OUTPUT_IMAGE_PATH });
            console.log(`✨ تم التقاط لقطة الشاشة بنجاح وتحديث الثمنيل: ${OUTPUT_IMAGE_PATH}`);
        } else {
            console.error('تعذر العثور على عنصر المشغل (#videoBox) في الصفحة.');
        }

    } catch (error) {
        console.error('حدث خطأ أثناء محاولة التقاط السكرين شوت:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// تشغيل البوت تلقائياً كل دقيقة (60000 ميلي ثانية)
console.log('🤖 بوت اللقطات الذكية يعمل الآن في الخلفية كل دقيقة...');
takeAutomatedScreenshot();
setInterval(takeAutomatedScreenshot, 60000);
