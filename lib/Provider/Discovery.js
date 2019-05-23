const Provider = require('../Provider.js');

class Discovery extends Provider {
    constructor(args) {
        super(args);
        let _self = this;
        this.SkipLoginRedirect = true;
        let mvpd = require('../../providers.json').mvpd;
        this.mvpd = {};
        console.log("PROVIDER: %s", this.Provider);
        mvpd.some(function(p) {
            //console.log(p);
            if(p.id.indexOf(_self.Provider) != -1) {
                _self.mvpd = p.displayName;
                console.log("Found provider display name: %s", _self.mvpd);
                return _self.mvpd;
            }
        });
    }

    async PreNavigate(page) {
        await page.waitForSelector('#react-root > div > div.page-wrapper.app__pageWrapper > div.watchLayout__container > main > section.layout-section.VideoPlayer.layoutSection__main > div > div > a > div.play-button.locked.playButton__primaryPlayButton.primaryPlayButton').then(async function(dom) {
            await dom.click();
            await page.waitForSelector('body > div:nth-child(28) > div > div > div > div > div > div.affiliates__body.affiliateList > div.affiliateList__container.affiliateListContainer > div > ul > li:nth-child(1) > span');
            let wow = await page.waitForXPath("//*[@class='affiliateList__item' and contains(., 'WOW')]");
            wow.click();
            await page.waitForNavigation();
        });
    }
}

module.exports = Discovery

