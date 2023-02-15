// Install the Node ScrapingBee library
// npm install scrapingbee
// const scrapingbee = require('scrapingbee');

// async function get(url) {
//     console.log('fetching ...');
//     var client = new scrapingbee.ScrapingBeeClient(
//         'VVAJ9UG4HF7R9ZU4Q163D5KBEU9I0CYXCP0C0361JUSS2F936YDSMQPKA9WJTQBD65HGKP3RWM2H5URJ'
//     );
//     var response = await client.get({
//         url: url,
//         // params: {
//         //     wait_for: 'pdp-pricing-module bolt-v2',
//         // },
//     });
//     return response;
// }

// get('https://www.argos.co.uk/product/7967397')
//     .then(function (response) {
//         console.log('fetched!');
//         var decoder = new TextDecoder();
//         var text = decoder.decode(response.data);
//         console.log(text);
//     })
//     .catch((e) => console.log('A problem occurs : ' + e.response.data));

// npm install request
// npm install request-promise
// request-promise
// var rp = require('request-promise');

// const options = {
//     uri: 'https://app.scrapingbee.com/api/v1?',
//     qs: {
//         api_key:
//             'VVAJ9UG4HF7R9ZU4Q163D5KBEU9I0CYXCP0C0361JUSS2F936YDSMQPKA9WJTQBD65HGKP3RWM2H5URJ',
//         url: 'https://www.ebay.co.uk/itm/202115642800',
//         json_response: 'true',
//     },
// };

// rp(options)
//     .then((response) => {
//         // console.log(response);
//         const met = JSON.parse(response).metadata.microdata;
//         console.log(met[0].name, met[0].offers.price);
//     })
//     .catch((error) => {
//         console.log(error);
//     });

// Install the Node ScrapingBee library
// npm install scrapingbee
const scrapingbee = require('scrapingbee');

async function get(url) {
    var client = new scrapingbee.ScrapingBeeClient(
        'VVAJ9UG4HF7R9ZU4Q163D5KBEU9I0CYXCP0C0361JUSS2F936YDSMQPKA9WJTQBD65HGKP3RWM2H5URJ'
    );
    var response = await client.get({
        url: url,
        params: {
            block_resources: 'false',
            stealth_proxy: 'true',
        },
    });
    return response;
}

get(
    'https://www.pinnacle.com/en/soccer/england-premier-league/manchester-city-vs-aston-villa/1565580178'
)
    .then(function (response) {
        var decoder = new TextDecoder();
        var text = decoder.decode(response.data);
        console.log(text);
    })
    .catch((e) => console.log('A problem occurs : ' + e.response.data));
