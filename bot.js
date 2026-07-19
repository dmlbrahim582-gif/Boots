const puppeteer = require('puppeteer');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');

const git = simpleGit();

// روابط البث الخاصة بالقناتين
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
            
            // انتظام إنساني: انتظر 5 ثوانٍ ليتجاوز المشغل أي شاشات تحميل سوداء
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
        
        // رفع الصور المحدثة تلقائياً إلى GitHub
        await pushToGitHub();

    } catch (error) {
        console.error('حدث خطأ أثناء المعاينة:', error);
        await browser.close();
    }
}

async function pushToGitHub() {
    try {
        await git.add(['live-thumb.jpg', 'live-thumb-2.jpg']);
        await git.commit('🤖 Bot Update: Live channel snapshots updated concurrently');
        await git.push('origin', 'main');
        console.log('⚡ تم رفع التحديثات الجديدة إلى مستودع GitHub بنجاح!');
    } catch (gitError) {
        console.error('خطأ أثناء الرفع للـ GitHub:', gitError);
    }
}

// تشغيل الفحص والتقاط الصور بشكل مستقر وتلقائي كل دقيقة
captureSnapshots();
setInterval(captureSnapshots, 60000);
