import line from 'get-current-line';

const puppeteer = require('puppeteer-extra');
const userAgent = require('user-agents');
const fs = require('fs').promises;
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const baseUrl = {
    URL: 'https://m.dana.id/i/biller-app/game/home',
};

export const cek_saldo = (req, res, next) => {
    let phoneNumber = req.body.phoneNumber;
    const pin = req.body.pin;
    let balance;

    try {
        phoneNumber = phoneNumberUtil(phoneNumber);
        if (phoneNumber === false) {
            throw new Error("Please insert your mobile number as your DANA ID");
        }

        if (pin.length != 6) {
            throw new Error("Please make sure you have the right PIN and try again");
        }
        
        app(puppeteer, baseUrl.URL, phoneNumber, pin).then((data) => {
            if (data.status) {
                res.status(200);
                res.json(data);
            }
            
            res.status(data.status || 500);
            res.json(data);
        })
    } catch (err) {
        res.status(err.status || 500);
        res.json({
            'status': false, 
            'messages': err.message
        });
    }
}

function phoneNumberUtil(number) {
    let phoneNumber = number.trim();
    
    if (phoneNumber.length > 15) {
        phoneNumber = phoneNumber.substr(10);
        phoneNumber = phoneNumber.substr(0, 10) + phoneNumber.replace(/[\/a-z-]0.+$/, '');
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    phoneNumber = phoneNumber.replace(/^(00)/g, '+');
    phoneNumber = phoneNumber.replace(/^(0)/g, '+62');
    phoneNumber = phoneNumber.replace(/^([1-9])/g, '\x01');
    
    if (phoneNumber.substr(0, 1) !== '+' || phoneNumber.length < 8) {
        return false;
    }

    phoneNumber = phoneNumber.substr(0, 16);
    phoneNumber = phoneNumber.replace('+62', '');

    return phoneNumber;
}

async function app(puppeteer, url, phoneNumber, pin) {
    let buttonPhoneNumber;
    let buttonPin;
    let balance = 0;
    const file = './cookies.json';
    const timeout = 1000;
    const fileExists = async path => !!(await fs.stat(path).catch(e => false));

    if (await fileExists(file) == false) {
        await fs.writeFile(file, []);

        return {
            'status': false, 
            'messages': 'A new cookie file was created, please try again'
        };
    }
    let cookies = await fs.readFile(file);
    
    const device = puppeteer.pptr.devices['iPhone 8'];
    const browser = await puppeteer.launch({
        headless: false,
        devtools: false,
        args: [
            // '--disable-infobars',
            '--no-sandbox',
            '--force-device-scale-factor=0.8',
            '--window-size=375,667'
        ],
        ignoreDefaultArgs: [
            '--enable-automation'
        ],
    });
    const page = await browser.newPage();
    const setUserAgent = new userAgent();
    await page.setUserAgent(setUserAgent.toString());
    await page.setViewport({
        width: 375,
        height: 667,
    });
    await page.emulate(device);

    try {
        if (Object.keys(cookies).length) {
            cookies = JSON.parse(cookies);
            await page.setCookie(...cookies);

            await page.goto(url, {
                waitUntil: ['load', 'domcontentloaded', 'networkidle2'],
                timeout: 0,
            });
        } else {
            await page.goto(url, {
                waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
                timeout: 0,
            });
        }
        
        await page.waitForTimeout(timeout);
        await page.$$eval('.f-btn', (els, target) => {
            els.forEach(el => {
                if (target === el.textContent) {
                    el.click();
                }
            });
        }, 'LOGIN');

        await page.waitForTimeout(timeout);
        buttonPhoneNumber = await page.$$('input');
        await buttonPhoneNumber[0].type(phoneNumber);
        await page.keyboard.press("Tab");
        await page.keyboard.press("Enter");

        await page.waitForTimeout(timeout);
        buttonPin = await page.$$('.digital-password');
        await buttonPin[0].type(pin);

        await page.waitForTimeout(timeout);
        await page.$$eval('.f-btn', (els, target) => {
            els.forEach(el => {
                if (target === el.innerText) {
                    el.click();
                }
            });
        }, 'CANCEL');

        await page.$$eval('.icon.icon-hamburger-menu', (els, target) => {
            els.forEach(el => {
                if (target === el.innerText) {
                    el.click();
                }
            });
        }, '');

        balance = await page.$$('.f-title.title-20.text-white.ml-2');
        balance = await balance[0].evaluate(el => el.textContent);

        await page.$$eval('.f-title', (els, target) => {
            els.forEach(el => {
                if (target === el.textContent) {
                    el.click();
                }
            });
        }, 'LOGOUT');

        await page.waitForTimeout(timeout);
        const currentCookies = await page.cookies();
        await fs.writeFile(file, JSON.stringify(currentCookies));

        await browser.close();
    } catch (err) {

        return {'status': false, 'messages': err.message};
    }
    
    return {
        'status': true, 
        'messages': 'Your balance on the application dana.id', 
        'data': balance
    };
}
