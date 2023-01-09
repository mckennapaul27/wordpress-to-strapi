const {
    formatText,
    logCurrentBlock,
    formatHref,
    uploadMedia,
    filterOnlyTags,
    formatAnchor,
} = require('./helpers');
const headers = ['h2', 'h3', 'h4', 'h5', 'h6'];

const createTop3List = async ({ obj }) => {
    //console.log(obj);
    const top3block = [
        {
            type: 'paragraph',
            data: {
                text: '<b>',
            },
        },
        {
            type: 'list',
            data: {
                style: 'ordered',
                items: [{ content: '' }, { content: '' }, { content: '' }],
            },
        },
    ];

    const createTop3DOMStructure = async ({ obj }) => {
        const currentName = obj.name || null;
        const currentType = obj.type || null;
        const parentName = obj.parent ? obj.parent.name : null;
        const parentType = obj.parent ? obj.parent.type : null;
        const data = obj.data || null;
        try {
            // FORMAT TAG ELEMENTS
            if (currentType === 'tag') {
                if (currentName === 'p') {
                    // console.log(obj);
                    const dataChildren = obj.children
                        .filter((a) => a.type === 'text')
                        .map((a) => formatText(a.data))
                        .filter((a, i) => i % 2 === 1);

                    const linkChildren = obj.children
                        .filter((a) => a.type === 'tag' && a.name === 'a')
                        .map((a) => {
                            const text = a.children[0].data;

                            // console.log(a.children[0].data);
                            return {
                                href: a.attribs.href,
                                text,
                            };
                        });
                    [1, 2, 3].map((a, i) => {
                        top3block[1].data.items[i].content =
                            'The ' +
                            `<a href="${formatHref(linkChildren[i].href)}">${
                                linkChildren[i].text
                            }</a>` +
                            ' ' +
                            dataChildren[i];
                    });
                }
            }
            // FORMAT TEXT ELEMENTS
            if (currentType === 'text') {
                const replacedData = formatText(data);
                if (parentName === 'strong' && replacedData) {
                    top3block[0].data.text = '<b>' + replacedData + '</b>';
                }
            }

            if (obj && obj.children && obj.children.length > 0) {
                await obj.children.reduce(async (prev, a, i) => {
                    const acc = await prev;
                    await createTop3DOMStructure({
                        obj: a,
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
            console.log('data: ', data);
            console.log('\n');
        }
    };
    await createTop3DOMStructure({ obj });
    return new Promise((resolve) => resolve(top3block));
};

const createFeaturedImgReviewPage = async ({ obj }, attributes) => {
    const findFeaturedImgSrc = async ({ obj }) => {
        const currentName = obj.name || null;
        const currentType = obj.type || null;
        const parentName = obj.parent ? obj.parent.name : null;
        const parentType = obj.parent ? obj.parent.type : null;
        const data = obj.data || null;
        try {
            // FORMAT TAG ELEMENTS
            if (currentType === 'tag') {
                if (currentName === 'img') {
                    const { src, alt } = obj.attribs;
                    attributes.featuredImg = { key: src, alt };
                }
            }
            if (obj && obj.children && obj.children.length > 0) {
                await obj.children.reduce(async (prev, a, i) => {
                    const acc = await prev;
                    await findFeaturedImgSrc({
                        obj: a,
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
            console.log('data: ', data);
            console.log('\n');
        }
    };
    await findFeaturedImgSrc({ obj });
    return new Promise((resolve) => resolve(true));
};

const createProductComparisonTable = async ({ obj }) => {
    const comparison = {
        title: { text: '', anchor: '' },
        items: [
            {
                title: '',
                img: {
                    src: '',
                    alt: '',
                },
                rank: null,
                amazonCode: '',
                amazonLink: '',
                overallScore: null,
                pros: '',
                cons: '',
                bottomLine: '',
                ratingCategories: '',
                ratings: {},
                extras: {},
            },
            {
                title: '',
                img: {
                    src: '',
                    alt: '',
                },
                rank: null,
                amazonCode: '',
                amazonLink: '',
                overallScore: null,
                pros: '',
                cons: '',
                bottomLine: '',
                ratingCategories: '',
                ratings: {},
                extras: {},
            },
            {
                title: '',
                img: {
                    src: '',
                    alt: '',
                },
                rank: null,
                amazonCode: '',
                amazonLink: '',
                overallScore: null,
                pros: '',
                cons: '',
                bottomLine: '',
                ratingCategories: '',
                ratings: {},
                extras: {},
            },
        ],
    };

    // console.log('COMPARISON_BEFORE_CODE: ', comparison);

    const createTableItems = async ({ obj }) => {
        const currentName = obj.name || null;
        const currentType = obj.type || null;
        const prevName = obj.prev ? obj.prev.name : null;
        const prevType = obj.prev ? obj.prev.type : null;
        const nextName = obj.next ? obj.next.name : null;
        const nextType = obj.next ? obj.next.type : null;
        const parentName = obj.parent ? obj.parent.name : null;
        const parentType = obj.parent ? obj.parent.type : null;
        const data = obj.data || null;
        const hasChildren =
            obj.children && obj.children.length > 0 ? true : false;
        const noOfChildren = obj.children ? obj.children.length : 0;

        try {
            // FORMAT TAG ELEMENTS
            if (currentType === 'tag') {
                if (currentName === 'h2' && obj.attribs.id) {
                    comparison.title.anchor = obj.attribs.id;
                }

                if (currentName === 'tbody') {
                    const rows = filterOnlyTags(obj);
                    // Completing first row (tr) as that is unique
                    rows.slice(0, 1).map((a, index) => {
                        // row = <tr>
                        const tds = filterOnlyTags(a).slice(1);
                        tds.map((b, i) => {
                            const tdItems = filterOnlyTags(b); // tdItems is a, br, strong etc
                            tdItems.map((td, indexOfChild) => {
                                if (td.name === 'a') {
                                    comparison.items[i].link = td.attribs.href;
                                    const foundImage = td.children.find(
                                        (a) => a.name === 'img'
                                    );
                                    if (foundImage) {
                                        const { src, alt } = foundImage.attribs;
                                        comparison.items[i].img = {
                                            src,
                                            alt,
                                        };
                                    }
                                    const foundStrongChild = td.children.find(
                                        (a) => a.name === 'strong'
                                    );
                                    if (foundStrongChild) {
                                        comparison.items[i].title = formatText(
                                            foundStrongChild.children[0].data
                                        );
                                    }
                                }
                                if (td.name === 'img') {
                                    const { src, alt } = td.attribs;
                                    comparison.items[i].img = {
                                        src,
                                        alt,
                                    };
                                }
                                if (td.name === 'strong') {
                                    comparison.items[i].title = formatText(
                                        td.children[0].children[0].data
                                    );
                                }

                                return td;
                            });
                            return b;
                        });
                        return a;
                    });
                    // map through additional rows
                    const fetchItem = rows
                        .slice(1)
                        .reduce((acc, item, index) => {
                            // 17 rows so 17 items
                            const tds = filterOnlyTags(item); // table cells in row

                            // row name is like AWARDS or PRICE
                            const rowName = filterOnlyTags(tds[0])[0]
                                .children[0].data;
                            // console.log('\n');
                            // console.log('ROW_NAME: ', rowName);
                            // console.log('\n');
                            if (rowName === 'AWARDS')
                                tds.slice(1).map(
                                    (a, i) => (comparison.items[i].rank = i + 1)
                                );
                            else if (rowName === 'PRICE') {
                                tds.slice(1).map((td, i) => {
                                    const findAmzCode = td.children.find((a) =>
                                        a.data.includes('amazon fields=')
                                    );
                                    const text = formatText(findAmzCode.data)
                                        .split(' ')[1]
                                        .split('"')[1];
                                    const findAmzLink = td.children.find(
                                        (a) =>
                                            a.name === 'a' &&
                                            a.attribs.href.startsWith(
                                                'https://www.amaz'
                                            )
                                    );
                                    comparison.items[i].amazonCode = text;
                                    comparison.items[i].amazonLink =
                                        findAmzLink.attribs.href;
                                    return td;
                                });
                            } else if (rowName === 'OVERALL SCORE') {
                                tds.slice(1).map((td, i) => {
                                    const src = td.children.find(
                                        (a) => a.name === 'img'
                                    ).attribs.src;
                                    const score = src.slice(
                                        src.lastIndexOf('/') + 1,
                                        src.lastIndexOf('/') + 3
                                    );
                                    comparison.items[i].overallScore =
                                        Number(score);
                                });
                            } else if (rowName === 'PROS') {
                                tds.slice(1).map(
                                    (td, i) =>
                                        (comparison.items[i].pros = formatText(
                                            td.children[0].data
                                        ))
                                );
                            } else if (rowName === 'CONS') {
                                tds.slice(1).map(
                                    (td, i) =>
                                        (comparison.items[i].cons = formatText(
                                            td.children[0].data
                                        ))
                                );
                            } else if (rowName === 'BOTTOM LINE') {
                                tds.slice(1).map(
                                    (td, i) =>
                                        (comparison.items[i].bottomLine =
                                            formatText(td.children[0].data))
                                );
                            } else if (rowName === 'RATING CATEGORIES') {
                                tds.slice(1).map(
                                    (td, i) =>
                                        (comparison.items[i].ratingCategories =
                                            formatText(
                                                td.children[0].children[0].data
                                            ))
                                );
                            } else if (
                                rowName === 'RATING' ||
                                rowName === 'VIEW PRODUCTS'
                            )
                                null;
                            else {
                                tds.slice(1).map((td, i) => {
                                    const tdChildren = td.children;
                                    const hasImage = tdChildren.find(
                                        (a) => a.name === 'img'
                                    );
                                    const hasStrong = tdChildren.find(
                                        (a) => a.name === 'strong'
                                    );
                                    const hasData = tdChildren.filter(
                                        (a) => a.type === 'text'
                                    );

                                    if (hasImage) {
                                        const alt = hasImage.attribs.alt;
                                        if (alt) {
                                            const score = alt
                                                .slice(0, 2)
                                                .trim();
                                            if (score) {
                                                comparison.items[i].ratings[
                                                    rowName
                                                ] = Number(score);
                                            }
                                        }
                                    }
                                    if (!hasImage && hasStrong)
                                        comparison.items[i].extras[rowName] =
                                            hasStrong.children[0].data;

                                    if (
                                        !hasImage &&
                                        !hasStrong &&
                                        hasData.length > 0
                                    ) {
                                        comparison.items[i].extras[rowName] =
                                            hasData[0].data;
                                    }
                                    return td;
                                });
                            }

                            return acc;
                        }, []);
                }
                if (currentName === 'tr') {
                    const cells = obj.children.filter((a) => a.type === 'tag');
                }
            }
            // FORMAT TEXT ELEMENTS
            if (currentType === 'text') {
                const replacedData = formatText(data);
                if (parentName === 'h2' && replacedData) {
                    comparison.title.text = replacedData;
                }
            }
            if (obj && obj.children && obj.children.length > 0) {
                await obj.children.reduce(async (prev, a, i) => {
                    const acc = await prev;
                    await createTableItems({
                        obj: a,
                    });
                    return acc;
                }, Promise.resolve());
            }

            return new Promise((resolve) => resolve(true));
        } catch (error) {
            console.log('FOUND ERROR WITH ELEMENT');
            console.log('ERROR RETURNED: ', error);

            console.log('current name: ', currentName);
            console.log('current type: ', currentType);
            console.log('parent name: ', parentName);
            console.log('parent type: ', parentType);
            console.log('data: ', data);
            console.log('\n');
        }
    };
    await createTableItems({ obj });

    return new Promise((resolve) => resolve(comparison));
};

const extractRequiredData = async ({ obj }, item) => {
    const findData = async ({ obj }) => {
        const currentName = obj.name || null;
        const currentType = obj.type || null;
        const parentName = obj.parent ? obj.parent.name : null;
        const parentType = obj.parent ? obj.parent.type : null;
        const grandParentName =
            obj.parent && obj.parent.parent ? obj.parent.parent.name : null;
        const data = obj.data || null;

        try {
            // FORMAT TAG ELEMENTS
            if (currentType === 'tag') {
                if (currentName === 'img') {
                    const { src, alt } = obj.attribs;
                    const excluded = ['Star', 'Rating'];
                    if (src) {
                        const check = excluded.reduce((acc, item) => {
                            if (alt.includes(item) || alt === '') acc = false;
                            return acc;
                        }, true);
                        if (check) {
                            item.img = { key: src, alt };
                        }
                    }
                }
                if (currentName === 'a') {
                    if (obj.attribs) {
                        if (obj.attribs.href.startsWith('https://www.amazo')) {
                            item.amazonLink = obj.attribs.href;
                        }
                    }
                }
            }
            // FORMAT TEXT ELEMENTS
            if (currentType === 'text') {
                const replacedData = formatText(data);
                console.log('found');
                console.log('parentName: ', parentName);
                console.log('GrandparentName: ', grandParentName);
                if (
                    parentName === 'a' &&
                    grandParentName === 'h2' &&
                    replacedData
                    //&&
                    // item.title === ''
                ) {
                    console.log('');
                    item.title = replacedData;
                }
            }
            if (obj && obj.children && obj.children.length > 0) {
                await obj.children.reduce(async (prev, a, i) => {
                    const acc = await prev;
                    await findData({
                        obj: a,
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
            console.log('data: ', data);
            console.log('\n');
        }
    };
    await findData({ obj });
    return new Promise((resolve) => resolve(true));
};

const createDetailedReview = async ({ obj }) => {
    const item = {
        title: '',
        subtitle: '',
        img: {
            src: '',
            alt: '',
        },
        rank: 0,
        amazonCode: '',
        amazonLink: '',
        ebayLink: '',
        body: [],
        ratings: {},
    };
    let blocks = [];
    blocks.push({
        type: 'paragraph',
        data: { text: '[DETAILED_PRODUCT_REVIEWS]' },
    });
    const createDOMStructure = async ({ obj }) => {
        //wp-block-group product-details-group
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
                obj.attribs.class === 'wp-block-columns product-details-col'
            ) {
                // This contains the image and amazon link
                const img = await extractRequiredData({ obj }, item);
                // some also contain [amazon fields="B00EJFFDXG" value="price"]
                // with class="product-details-price"
                // exmaple best-warming-drawer-reviews
                // comparison = await createProductComparisonTable({ obj });
                return new Promise((resolve) => resolve(true));
            }
            if (currentName === 'h2') {
                // this contains the title with id and amazon link
                return new Promise((resolve) => resolve(true));
            }
            if (currentName === 'h3') {
                // this contains the subtitle with id
                return new Promise((resolve) => resolve(true));
            }
            if (
                currentName === 'div' &&
                obj.attribs.class === 'wp-block-group rating_chart_score_group'
            ) {
                // This contains the ratings (need to have dynamic fields as rating categories change)
                return new Promise((resolve) => resolve(true));
            }
            if (currentName === 'p' && obj.attribs.class === 'ebay-btn') {
                // This contains the ebay link
                return new Promise((resolve) => resolve(true));
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
    await createDOMStructure({ obj });

    blocks = blocks.reduce((acc, item) => {
        if (
            item.data.text &&
            item.data.text.includes('View Product on Amazon')
        ) {
            return acc;
        } else {
            acc.push(item);
            return acc;
        }
    }, []);
    item.body = blocks;
    console.log(item);
    // blocks.map((a) => logCurrentBlock(a));

    return new Promise((resolve) => resolve(true));
};

module.exports = {
    createTop3List,
    createFeaturedImgReviewPage,
    createProductComparisonTable,
    createDetailedReview,
};
