const puppeteer = require('puppeteer');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');

const git = simpleGit();

// روابط البث الخاصة بالقناتين المدمجتين في نظام المنصة
const channels = [
    {
        name: 'playr',
        url: 'https://player.livepush.io/live/emNg2whRb9krdvWzd',
        filename: 'live-thumb.jpg'
    },
    {
        name: '30frame',
        url: 'https://player.livepush.io/live/emTA8mUW4_8OWcAeN',
        filename: 'live-thumb-2.jpg'
    }
];

async function captureSnapshots() {
    console.log(`[${new Date().toLocaleTimeString()}] البدء في التقاط الصور المعاينة الحية...`);
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        for (const ch of channels) {
            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 720 });
            
            // الانتقال إلى رابط البث
            await page.goto(ch.url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // الانتظار لتجاوز شاشات التحميل السوداء
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const savePath = path.join(__dirname, ch.filename);
            
            // التقاط الصورة بدقة وجودة عالية
            await page.screenshot({
                path: savePath,
                type: 'jpeg',
                quality: 85
            });
            
            console.log(`✓ تم بنجاح التقاط صورة القناة: ${ch.name}`);
            await page.close();
        }

        await browser.close();
        
        // رفع الصور المحدثة تلقائياً إلى GitHub في عملية واحدة منسقة
        await pushToGitHub();

    } catch (error) {
        console.error('حدث خطأ أثناء المعاينة:', error);
        await browser.close();
    } finally {
        // جدولة الدورة القادمة بعد دقيقة من انتهاء الدورة الحالية لتجنب التداخل
        setTimeout(captureSnapshots, 60000);
    }
}

async function pushToGitHub() {
    try {
        console.log('🔄 جاري التحقق من التغييرات وتحديث ملفات الـ Git...');
        
        // جلب آخر التحديثات من السيرفر أولاً لتفادي أي تعارض (Conflict)
        await git.pull('origin', 'main');

        // إضافة الملفين معاً بشكل صحيح، حتى لو كان أحدهما ملفاً جديداً تماماً
        await git.add(['live-thumb.jpg', 'live-thumb-2.jpg']);
        
        // التحقق مما إذا كانت هناك تغييرات فعلياً لتجنب الخطأ في حال لم يتغير شيء
        const status = await git.status();
        if (status.staged.length === 0) {
            console.log('ℹ️ لم يتم رصد أي تغييرات في الصور. تخطي الـ Commit.');
            return;
        }

        // عمل الـ Commit
        await git.commit('🤖 Bot Update: Live channel snapshots updated concurrently');
        
        // رفع التغييرات إلى الفرع الرئيسي
        await git.push('origin', 'main');
        
        console.log('⚡ تم رفع التحديثات الجديدة إلى مستودع GitHub بنجاح!');
    } catch (gitError) {
        console.error('❌ خطأ أثناء الرفع للـ GitHub:', gitError);
    }
}

// بدء التشغيل لأول مرة فوراً
captureSnapshots();
