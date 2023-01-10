const fs = require('fs');
require('dotenv').config();
const moment = require('moment');
const htmlparser2 = require('htmlparser2');
const _trim = require('lodash.trim');
const {
    formatAnchor,
    formatText,
    filterOnlyTags,
    uploadMedia,
    removeDuplicateHeaders,
    logCurrentBlock,
    formatHref,
    addMissingFeaturedImg,
} = require('./helpers');
const { default: slugify } = require('slugify');
const path = require('path');
const mime = require('mime-types');
const { resolve } = require('path');
const {
    createTop3List,
    createFeaturedImgReviewPage,
    createProductComparisonTable,
    createDetailedReview,
} = require('./scraper-helpers');

const headers = ['h2', 'h3', 'h4', 'h5', 'h6'];

const manifest = JSON.parse(
    fs.readFileSync('./wp-export/uploads/manifest.json', 'utf8')
);

const parseEncodedContent = async (html, slug) => {
    // set up variables for blog attributes, components and h1
    let blocks = [];
    const attributes = {
        title: '',
        featuredImg: {
            key: '',
            alt: '',
        },
    };
    let comparison = null;
    const detailedReviews = [];
    const item = {
        title: '',
        img: {
            src: '',
            alt: '',
        },
        rank: 0,
        amazonCode: '',
        amazonLink: '',
        ebayLink: '',
        blocks: [],
        overallScore: 0,
        efficiencyScore: 0,
        easeUseScore: 0,
        extrasScore: 0,
    };

    // parse the domList and filter only tags to avoid '\n' items
    const domList = htmlparser2
        .parseDocument(html)
        .children.filter((a) => a.type === 'tag');

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

        try {
            if (
                currentName === 'div' &&
                obj.attribs.class === 'wp-block-group product-table-group'
            ) {
                comparison = await createProductComparisonTable({ obj });
                blocks.push({
                    type: 'paragraph',
                    data: { text: '[PRODUCT_COMPARISON]' },
                });
                return new Promise((resolve) => resolve(true));
            }
            if (
                currentName === 'div' &&
                obj.attribs.class === 'wp-block-group product-details-group'
            ) {
                console.log(
                    'Has found classname: "wp-block-group product-details-group"'
                );
                if (detailedReviews.length === 0) {
                    blocks.push({
                        type: 'paragraph',
                        data: { text: '[DETAILED_PRODUCT_REVIEWS]' },
                    });
                }
                const review = await createDetailedReview({ obj });
                if (review) {
                    detailedReviews.push(review);
                }

                return new Promise((resolve) => resolve(true));
            }
            if (
                currentName === 'figure' &&
                obj.attribs.class.includes('featured-image')
            ) {
                // console.log('Has found classname: "featured-image"');
                await createFeaturedImgReviewPage({ obj }, attributes);
                return new Promise((resolve) => resolve(true));
            }
            if (
                currentName === 'p' &&
                obj.attribs.class === 'has-text-align-center'
            ) {
                //console.log(obj.children);
                const strong = obj.children.find((a) => a.name === 'strong');
                if (strong) {
                    const strongChild = strong.children[0];
                    if (strongChild && strongChild.data.includes('Our Top 3')) {
                        const top3Block = await createTop3List({ obj });
                        await top3Block.reduce(async (prev, a) => {
                            const acc = await prev;
                            blocks.push(a);
                            return acc;
                        }, Promise.resolve());
                        return new Promise((resolve) => resolve(true));
                    }
                }
            }
            // FORMAT TAG ELEMENTS
            if (currentType === 'tag') {
                if (currentName === 'img') {
                    const imgBlock = await uploadMedia(obj);
                    if (imgBlock) {
                        blocks.push(imgBlock);
                    }
                }
                if (currentName === 'p') {
                    blocks.push({
                        type: 'paragraph',
                        data: {
                            text: '',
                        },
                    });
                }
                if (headers.includes(currentName)) {
                    const { id } = obj.attribs;
                    blocks.push({
                        type: 'header',
                        data: {
                            text: '',
                            level: parseInt(currentName.slice(1)),
                            anchor: id ? formatAnchor(id) : '',
                        },
                    });
                }
                if (currentName === 'li') {
                    currentBlock.data.items.push({
                        content: '',
                    });
                }
                if (currentName === 'a') {
                    const { href, target, rel } = obj.attribs;
                    if (parentName === 'p') {
                        currentBlock.data.text = currentBlock.data.text.concat(
                            ` <a href="${formatHref(href)}">`
                        );
                    }
                    if (parentName === 'li') {
                        const space =
                            currentBlock.data.items[
                                currentBlock.data.items.length - 1
                            ].content.length > 0
                                ? ' '
                                : '';
                        currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content = currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content.concat(
                            space + `<a href="${formatHref(href)}">`
                        );
                    }
                    if (parentName === 'strong' && grandParentName === 'li') {
                        currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content = currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content.concat(`<a href="${formatHref(href)}">`);
                    }
                    if (parentName === 'em' && grandParentName === 'li') {
                        currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content = currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content.concat(`<a href="${formatHref(href)}">`);
                    }
                }
                if (currentName === 'strong') {
                    if (parentName === 'p') {
                        currentBlock.data.text =
                            currentBlock.data.text.concat('<b>');
                    }
                    if (headers.includes(parentName)) {
                        currentBlock.data.text =
                            currentBlock.data.text.concat('<b>');
                    }
                    if (parentName === 'li') {
                        currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content =
                            currentBlock.data.items[
                                currentBlock.data.items.length - 1
                            ].content.concat(`<b>`);
                    }
                    if (parentName === 'a' && grandParentName === 'li') {
                        currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content =
                            currentBlock.data.items[
                                currentBlock.data.items.length - 1
                            ].content.concat(`<b>`);
                    }
                }
                if (currentName === 'em') {
                    if (parentName === 'p') {
                        currentBlock.data.text =
                            currentBlock.data.text.concat(' <i>');
                    }
                    if (headers.includes(parentName)) {
                        currentBlock.data.text =
                            currentBlock.data.text.concat(' <i>');
                    }
                    if (parentName === 'li') {
                        currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content =
                            currentBlock.data.items[
                                currentBlock.data.items.length - 1
                            ].content.concat(` <i>`);
                    }
                    if (parentName === 'a' && grandParentName === 'li') {
                        currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content =
                            currentBlock.data.items[
                                currentBlock.data.items.length - 1
                            ].content.concat(` <i>`);
                    }
                }
                if (currentName === 'ol') {
                    blocks.push({
                        type: 'list',
                        data: { style: 'ordered', items: [] },
                    });
                }

                if (currentName === 'ul') {
                    blocks.push({
                        type: 'list',
                        data: { style: 'unordered', items: [] },
                    });
                }
            }
            // FORMAT TEXT ELEMENTS
            if (currentType === 'text') {
                const replacedData = formatText(data);

                if (headers.includes(parentName) && replacedData) {
                    currentBlock.data.text =
                        currentBlock.data.text.concat(replacedData);
                }
                if (parentName === 'p' && replacedData) {
                    const space = currentBlock.data.text.length > 0 ? ' ' : '';
                    currentBlock.data.text = currentBlock.data.text.concat(
                        space + replacedData
                    );
                }
                if (parentName === 'a' && replacedData) {
                    const granny =
                        grandParentName === 'strong'
                            ? '</b>'
                            : grandParentName === 'em'
                            ? '</i> '
                            : '';
                    if (currentBlock.type === 'list') {
                        currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content =
                            currentBlock.data.items[
                                currentBlock.data.items.length - 1
                            ].content.concat(replacedData) +
                            '</a>' +
                            granny;
                    } else {
                        currentBlock.data.text =
                            currentBlock.data.text.concat(replacedData) +
                            '</a>';
                    }
                }
                if (parentName === 'h1' && replacedData)
                    attributes.title = replacedData;
                if (parentName === 'li' && replacedData) {
                    currentBlock.data.items[
                        currentBlock.data.items.length - 1
                    ].content =
                        currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content.concat(replacedData);
                }
                if (parentName === 'strong' && replacedData) {
                    if (currentBlock.type === 'paragraph') {
                        currentBlock.data.text =
                            currentBlock.data.text.concat(replacedData) +
                            '</b>';
                    }
                    if (
                        currentBlock.type === 'header' &&
                        headers.includes(grandParentName)
                    ) {
                        currentBlock.data.text =
                            currentBlock.data.text.concat(replacedData) +
                            '</b>';
                    }
                    if (currentBlock.type === 'list') {
                        const granny = grandParentName === 'a' ? '</a>' : '';
                        currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content =
                            currentBlock.data.items[
                                currentBlock.data.items.length - 1
                            ].content.concat(replacedData) +
                            '</b>' +
                            granny;
                    }
                }

                if (parentName === 'em' && replacedData) {
                    if (currentBlock.type === 'paragraph') {
                        currentBlock.data.text =
                            currentBlock.data.text.concat(replacedData) +
                            '</i> ';
                    }
                    if (
                        currentBlock.type === 'header' &&
                        headers.includes(grandParentName)
                    ) {
                        currentBlock.data.text =
                            currentBlock.data.text.concat(replacedData) +
                            '</i> ';
                    }
                    if (currentBlock.type === 'list') {
                        const granny = grandParentName === 'a' ? '</i> ' : '';
                        currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content =
                            currentBlock.data.items[
                                currentBlock.data.items.length - 1
                            ].content.concat(replacedData) +
                            '</i> ' +
                            granny;
                    }
                }
                if (parentName === 'span' && replacedData) {
                    if (currentBlock.type === 'paragraph') {
                        currentBlock.data.text = currentBlock.data.text.concat(
                            ' ' + replacedData + ' '
                        );
                    }
                    if (
                        currentBlock.type === 'header' &&
                        headers.includes(grandParentName)
                    ) {
                        currentBlock.data.text = currentBlock.data.text.concat(
                            ' ' + replacedData + ' '
                        );
                    }
                    if (currentBlock.type === 'list') {
                        currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content = currentBlock.data.items[
                            currentBlock.data.items.length - 1
                        ].content.concat(' ' + replacedData + ' ');
                    }
                }
            }

            // recursively loop through object children
            if (obj && obj.children && obj.children.length > 0) {
                await obj.children.reduce(async (prev, a, i) => {
                    const acc = await prev;
                    const isLastItem = i === obj.children.length - 1;
                    await createDOMStructure({
                        obj: a,
                        isLastItem, // if creating html from parse (not editorjs blocks), we need isLastItem to add closing tag </>
                    });
                    return acc;
                }, Promise.resolve());
            }

            return new Promise((resolve) => resolve(true));
        } catch (error) {
            console.log('FOUND ERROR WITH ELEMENT');
            console.log('ERROR RETURNED: ', error);
            console.log('current block: ');
            logCurrentBlock(currentBlock);
            console.log('current name: ', currentName);
            console.log('current type: ', currentType);
            console.log('parent name: ', parentName);
            console.log('parent type: ', parentType);
            console.log('grandparent name: ', grandParentName);
            console.log('grandparent type: ', grandParentType);
            console.log('data: ', data);
            console.log('\n');
            return new Promise((resolve) => resolve(true));
        }
    };
    // end of createDOMStructure function
    await domList.reduce(async (prev, obj) => {
        // loop through each dom element and call createDOMStructure on each
        const acc = await prev;
        await createDOMStructure({ obj });
        return acc;
    }, Promise.resolve());

    // blocks.map((a) => {
    //     logCurrentBlock(a);
    // });
    // console.log(attributes);
    // console.log(slug);

    const toRemoveArr = removeDuplicateHeaders(blocks);
    blocks = blocks.filter((a, i) => !toRemoveArr.includes(i));

    if (attributes.featuredImg.key === '') {
        blocks = addMissingFeaturedImg(domList, blocks, attributes);
    }
    // blocks.map((a) => {
    //     logCurrentBlock(a);
    // });
    // console.log('attributes: ', attributes);
    //console.log('comparison: ', comparison);
    // console.log(slug);

    const editorjsData = JSON.stringify({
        time: 1661158170133,
        version: '2.23.2',
        blocks: blocks,
    });

    return new Promise((resolve) =>
        resolve({
            attributes,
            editorjsData,
            comparison,
            detailedReviews,
        })
    );
};

module.exports = {
    parseEncodedContent,
};
