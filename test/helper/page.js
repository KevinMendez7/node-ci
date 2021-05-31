const puppeteer = require('puppeteer');
const sessionFactory = require('../factory/sessionFactory');
const userFactory = require('../factory/userFactory');

class CustomPage {
    static async build() {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox'
            ]
        });
        const page = await browser.newPage();

        const customPage = new CustomPage(page);

        return new Proxy(customPage, {
            get: function(target, property) {
                return browser[property] || customPage[property] || page[property];
            }
        });
    }

    constructor(page) {
        this.page = page;
    }

    async login() {
        const user = await userFactory();    
    
        const { session, sig } = sessionFactory(user);

        await this.page.setCookie({ name : 'session', value: session});
        await this.page.setCookie({ name : 'session.sig', value: sig});
        await this.page.goto('http://localhost:3000/blogs');
        // await this.page.waitFor('a[href="/auth/logout"]');
        // await this.page.waitForNavigation({
        //     waitUntil: 'networkidle0',
        //   });

        await this.page.waitForSelector('a[href="/auth/logout"]', {
            visible: true,
          });
    }

    async getContentsOf(selector) {
        return await this.page.$eval(selector, element => element.innerHTML);
    }

    get(path) {
        return this.page.evaluate(_path => {
            return fetch(_path, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json());
        }, path);

    }

    post(path, data) {
        return this.page.evaluate((_path, _data) => {
            return fetch(_path, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(_data)
            }).then(res => res.json());
        }, path, data);
    }

    executeActions(actions) {        
        return Promise.all(
            actions.map(({ method, path, data}) => {                
                return this[method](path, data);
            })
        );
    }
}

module.exports = CustomPage;