import { readFile, writeFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';


const postForm = async () => {

    const config = await readFile('config.json', 'utf8');

    const id = JSON.parse(config).id;
    const data = new FormData();
    data.append('mcc_bin_dates_uprn', id)

    const response = await fetch('https://www.manchester.gov.uk/bincollections', {
        method: 'POST',
        body: data
    });

    const html = await response.text();

    return html;
}

const getHtml = async () => {
    const d = new Date();
    const fileName = `cache/${d.toLocaleDateString().replaceAll('/', '-')}.html`;
    
    try {
        const cachedFile = await readFile(fileName, 'utf8');
        return cachedFile;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`${fileName} File not found!`);
            const html = await postForm();
            await writeFile(fileName, html, function (err) {
                if (err) throw err;
                console.log('Saved!');
            });

            return html;
    
        } else {
            throw err;
        }
    }
}

const coloriseBins = (inputString) => {
    inputString = inputString.replace(/Blue Bin/g, '\x1b[34mBlue Bin\x1b[0m');
    inputString = inputString.replace(/Brown Bin/g, '\x1b[33mBrown Bin\x1b[0m');
    inputString = inputString.replace(/Green Bin/g, '\x1b[32mGreen Bin\x1b[0m');
    // inputString = inputString.replace(/Black \/ Grey Bin/g, '\x1b[30mBlack / Grey Bin\x1b[0m');
    return inputString;
}

const getThisWeekBins = (bins) => {
    const today = new Date();
    const thisWeek = Object.values(bins).filter(bin => {
        return bin.nextCollection <= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    });

    const binTypes = Object.keys(bins);
    const thisWeekBinTypes = thisWeek.map(bin => binTypes[Object.values(bins).indexOf(bin)]).join(" ");
    const binStrings = coloriseBins(thisWeekBinTypes);
    console.log(`Next bin collection ${binStrings}`);
}

const html = await getHtml();

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
