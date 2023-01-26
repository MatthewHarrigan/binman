const cheerio = require('cheerio');
const fs = require('fs');

const config = fs.readFileSync("config.json", "utf8");

const id = JSON.parse(config).id;

const data = new FormData();
data.append('mcc_bin_dates_uprn', id)

fetch('https://www.manchester.gov.uk/bincollections', {
    method: 'POST',
    body: data
}).then(response => response.text())
    .then(html => {
        const $ = cheerio.load(html);
        const bins = {};

        $('.collection').each(function () {
            const binType = $(this).find('h3').text().trim();
            const nextCollection = new Date($(this).find('.caption').text().trim().match(/[A-Za-z]{3} \d{1,2} [A-Za-z]{3} \d{4}/)[0]);
            const collections = $(this).find('li').map(function () {
                return new Date($(this).text().trim().match(/[A-Za-z]{3} \d{1,2} [A-Za-z]{3} \d{4}/)[0]);
            }).get();
            bins[binType] = { nextCollection, collections };
        });
        getThisWeekBins(bins);
    })
    .catch(err => {
        console.error(err);
    });

function coloriseBins(inputString) {
    inputString = inputString.replace(/Blue Bin/g, '\x1b[34mBlue Bin\x1b[0m');
    inputString = inputString.replace(/Brown Bin/g, '\x1b[33mBrown Bin\x1b[0m');
    inputString = inputString.replace(/Green Bin/g, '\x1b[32mGreen Bin\x1b[0m');
    inputString = inputString.replace(/Black \/ Grey Bin/g, '\x1b[90mBlack / Grey Bin\x1b[0m');
    return inputString;
}

const getThisWeekBins = (bins) => {
    const today = new Date();
    const thisWeek = Object.values(bins).filter(bin => {
        return bin.nextCollection <= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    });

    const binTypes = Object.keys(bins);
    const thisWeekBinTypes = thisWeek.map(bin => binTypes[Object.values(bins).indexOf(bin)]);
    const binStrings = coloriseBins("" + thisWeekBinTypes + "");
    console.log(`Next bin collection ${binStrings}`);
}
