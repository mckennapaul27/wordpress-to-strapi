const fs = require('fs');
require('dotenv').config();
const dayjs = require('dayjs');
const htmlparser2 = require('htmlparser2');
const _trim = require('lodash.trim');
const {
    formatAnchor,
    formatText,
    filterOnlyTags,
    uploadMedia,
} = require('./helpers');
const { default: slugify } = require('slugify');
const path = require('path');
const mime = require('mime-types');

const headers = ['h2', 'h3', 'h4', 'h5', 'h6'];

const manifest = JSON.parse(
    fs.readFileSync('./wp-export/uploads/manifest.json', 'utf8')
);

const parseEncodedContent = async (html, slug) => {
    // gain access to all the images
    const allMedia = manifest.allImages;
    // set up variables for blog attributes, components and h1
    const blocks = [];
    const metaTitle = '';
    const attributes = {
        title: '',
        featuredImg: {},
    };
    const comparison = {
        title: { text: '', anchor: '' },
        items: [],
    };
    const comparisonItem = {
        title: '',
        img: {
            src: '',
            alt: '',
        },
        rank: 0,
        amazonCode: '',
        amazonLink: '',
        overallScore: 0,
        pros: '',
        cons: '',
        bottomLine: '',
        ratingCategories: '',
        efficiencyScore: 0,
        easeUseScore: 0,
        extrasScore: 0,
        specifications: '',
        dimensions: '',
        capacity: '',
        includedComponents: '',
    };
    const detailedReviews = {
        title: { text: '', anchor: '' },
        items: [],
    };
    const detailedReviewsItem = {
        title: '',
        img: {
            src: '',
            alt: '',
        },
        rank: 0,
        amazonCode: '',
        amazonLink: '',
        ebayLink: '',
        body: {
            blocks: [],
        },
        overallScore: 0,
        efficiencyScore: 0,
        easeUseScore: 0,
        extrasScore: 0,
    };
    // parse the domList and filter only tags to avoid '\n' items
    const domList = htmlparser2
        .parseDocument(html)
        .children.filter((a) => a.type === 'tag');
    // createDOMStructure function to loop through the html items
    const createDOMStructure = async ({ obj, isLastItem }) => {
        const currentName = obj.name || null;
        const currentType = obj.type || null;
        const prevName = obj.prev ? obj.prev.name : null;
        const prevType = obj.prev ? obj.prev.type : null;
        const nextName = obj.next ? obj.next.name : null;
        const nextType = obj.next ? obj.next.type : null;
        const parentName = obj.parent ? obj.parent.name : null;
        const parentType = obj.parent ? obj.parent.type : null;
        const grandParentName =
            obj.parent && obj.parent.parent ? obj.parent.parent.name : null;
        const grandParentType =
            obj.parent && obj.parent.parent ? obj.parent.parent.type : null;
        const data = obj.data || null;
        const hasChildren =
            obj.children && obj.children.length > 0 ? true : false;
        const noOfChildren = obj.children ? obj.children.length : 0;
        const currentBlock = blocks[blocks.length - 1];

        // for elements that need a different structure, call different function
        if (
            currentName === 'div' &&
            obj.attribs.class === 'wp-block-group product-table-group'
        ) {
            console.log(
                'Has found classname: "wp-block-group product-table-group"'
            );
            // create comparison
            return null;
        }
        if (
            currentName === 'div' &&
            obj.attribs.class === 'wp-block-group product-details-group'
        ) {
            console.log(
                'Has found classname: "wp-block-group product-details-group"'
            );
            // create detailedReviews
            return null;
        }
        if (
            currentName === 'figure' &&
            obj.attribs.class.includes('featured-image')
        ) {
            console.log('Has found classname: "featured-image"');
            // create featuredImg
            return null;
        }
        if (currentType === 'tag') {
            if (currentName === 'img') {
                const imgBlock = await uploadMedia(obj);
                if (imgBlock) {
                    blocks.push(imgBlock);
                    console.log(blocks);
                }
            }
        }

        // recursively
        if (obj && obj.children && obj.children.length > 0) {
            for (var i = 0; i < obj.children.length; i++) {
                const isLastItem = i === obj.children.length - 1;
                createDOMStructure({
                    obj: obj.children[i],
                    isLastItem,
                });
            }
        }
        return new Promise((resolve) => resolve(true));
    };
    // end of createDOMStructure function
    await domList.reduce(async (prev, obj) => {
        // loop through each dom element and call createDOMStructure on each
        const acc = await prev;
        const awaited = await createDOMStructure({ obj });
        console.log('awaited: ', awaited);
        return acc;
    }, Promise.resolve());
    //console.log(domList);
    console.log('blocks: ', blocks);

    blocks.map((a) => {
        console.log('>>>>>> main item >>>>>>');
        console.log(a);
        console.log('>>>>>> main item >>>>>>');
        if (a.type === 'image') {
            console.log('image file data >>>>>>>>>>>');
            console.log(a, a.data);
            console.log('image file data >>>>>>>>>>>');
        }
        return a;
    });
    console.log(slug);
};

module.exports = {
    parseEncodedContent,
};
