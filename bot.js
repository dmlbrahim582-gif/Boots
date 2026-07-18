const puppeteer = require('puppeteer');

// رابط مشغل البث المباشر الخاص بك
const STREAM_URL = "https://player.livepush.io/live/emNg2whRb9krdvWzd";

async function takeLiveScreenshot() {
    console.log("جاري تشغيل المتصفح الوهمي...");
    
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // ضبط أبعاد اللقطة لتكون بجودة ممتازة ومتناسقة
    await page.setViewport({ width: 1280, height: 720 });

    try {
        console.log(`جاري الدخول إلى الرابط: ${STREAM_URL}`);
        await page.goto(STREAM_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        console.log("الانتظار 5 ثوانٍ لضمان عمل البث بوضوح...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        // حفظ الصورة باسم live-thumb.jpg المتوافق مع موقعك
        const thumbnailPath = 'live-thumb.jpg';
        await page.screenshot({ path: thumbnailPath, type: 'jpeg', quality: 85 });
        console.log(`✨ تم التقاط الصورة وحفظها بنجاح كـ ${thumbnailPath}`);

    } catch (error) {
        console.error("حدث خطأ أثناء التقاط الصورة:", error);
    } finally {
        await browser.close();
        console.log("تم إغلاق المتصفح.");
    }
}

takeLiveScreenshot();
