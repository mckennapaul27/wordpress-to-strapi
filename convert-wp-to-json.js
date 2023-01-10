const path = require('path');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');
const he = require('he');
const _get = require('lodash.get');
const htmlUrls = require('html-urls');
const download = require('image-downloader');
const isImageUrl = require('is-image-url');
const moment = require('moment');
const { writeObjToFile } = require('./utils/helpers');
require('dotenv').config();

const parser = new XMLParser();

const xmlData = fs.readFileSync('./wp-export.xml', 'utf-8');
const outputFile = './wordpress-data.json';
const outputDir = './wp-export/';
const uploadsDir = path.join(outputDir, 'uploads');
const postsDir = path.join(outputDir, 'posts');

console.log(outputDir);
console.log(uploadsDir);

const allUrls = [];

const ignorePostTypes = [
    'sent_mail',
    'postman_sent_mail',
    'mc4wp-form',
    'custom_css',
    'nav_menu_item',
];
const options = {
    attributeNamePrefix: '@_',
    attrNodeName: 'attr', //default is 'false'
    textNodeName: '#text',
    ignoreAttributes: true,
    ignoreNameSpace: false,
    allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: false,
    trimValues: true,
    cdataTagName: '__cdata', //default is 'false'
    cdataPositionChar: '\\c',
    parseTrueNumberOnly: false,
    arrayMode: false, //"strict"
    attrValueProcessor: (val, attrName) =>
        he.decode(val, { isAttributeValue: true }), //default is a=>a
    tagValueProcessor: (val, tagName) => he.decode(val), //default is a=>a
    stopNodes: ['parse-me-as-string'],
};

console.log('Starting process');

let jsonObj = null;
jsonObj = parser.parse(xmlData, options);

writeObjToFile(outputFile, jsonObj);

jsonObj = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
const channel = _get(jsonObj, 'rss.channel');

if (!channel) return;
const {
    title,
    link,
    description,
    pubDate,
    language,
    generator,
    ...otherProps
} = channel;

const site = {
    title,
    link,
    description,
    pubDate,
    language,
    baseUrl: _get(otherProps, 'wp:base_site_url'),
    blogUrl: _get(otherProps, 'wp:base_blog_url'),
    generator,
    postTypes: (_get(otherProps, 'item') || []).reduce((arr, item) => {
        const postType = item['wp:post_type'];
        if (!arr.includes(postType) && !ignorePostTypes.includes(postType))
            arr.push(postType);
        return arr;
    }, []),
};
writeObjToFile(path.join(outputDir, 'site.json'), site);

const authors = (_get(otherProps, 'wp:author') || []).map((a) => {
    return {
        id: a['wp:author_id'],
        login: a['wp:author_login'],
        email: a['wp:author_email'],
        displayName: a['wp:author_display_name'],
        firstName: a['wp:author_first_name'],
        lastName: a['wp:author_last_name'],
    };
});
writeObjToFile(path.join(outputDir, 'authors.json'), authors);

const categories = (_get(otherProps, 'wp:category') || []).map((a) => {
    return {
        id: a['wp:term_id'],
        slug: a['wp:category_nicename'],
        title: a['wp:cat_name'],
        parentId: null,
        parentSlug: a['wp:category_parent'],
    };
});
categories.forEach((category) => {
    if (category.parentSlug && category.parentSlug.length) {
        const parentCategory = categories.find(
            (c) => c.slug === category.parentSlug
        );
        if (parentCategory) {
            category.parentId = parentCategory.id;
        }
    }
    delete category.parentSlug;
});
writeObjToFile(path.join(outputDir, 'categories.json'), categories);

const populateCategoryIds = (title, categoryIds) => {
    if (!title || title.length === 0) return;
    const category = categories.find((c) => c.title === title);
    if (category && category.id) {
        categoryIds.push(category.id);
    }
};
const getPosts = (postType) => {
    return (_get(otherProps, 'item') || [])
        .filter((item) => item['wp:post_type'] === postType)
        .map((item) => {
            const author = authors.find((a) => a.login === item['dc:creator']);
            const parentId = item['wp:post_parent'];
            const postCategoryElement = item['category'];
            const categoryIds = [];
            if (postCategoryElement) {
                if (Array.isArray(postCategoryElement)) {
                    postCategoryElement.forEach((pc) => {
                        if (pc) populateCategoryIds(pc, categoryIds);
                    });
                } else {
                    populateCategoryIds(item['category'], categoryIds);
                }
            }

            let markdown = null;
            let urls = [];
            const encodedContent = item['content:encoded'];
            if (encodedContent && encodedContent.length > 0) {
                markdown = `### title`;
                urls = htmlUrls({
                    html: encodedContent,
                    removeDuplicates: true,
                }).map((r) => r.url);
            }

            const pubDateStr = item['pubDate'] || null;
            const postDateStr = item['wp:post_date'] || null;
            const postDateGmtStr = item['wp:post_date_gmt'] || null;

            const postDate =
                postDateGmtStr && postDateGmtStr.length > 0
                    ? moment.utc(postDateGmtStr).toISOString()
                    : postDateStr && postDateStr.length > 0
                    ? moment(postDateStr).utc().toISOString()
                    : null;

            //const body = getBodyBocksAndComponents();

            const postObject = {
                id: item['wp:post_id'],
                parentId,
                title: item['title'],
                slug: item['wp:post_name'],
                link: item['link'],
                guid: item['guid'],
                status: item['wp:status'],
                postDate,
                pubDate: pubDateStr && pubDateStr.length > 0 ? postDate : null,
                creator: item['dc:creator'],
                creatorId: author && author.id ? author.id : null,
                markdown,
                urls,
                encodedContent: encodedContent,
                encodedExcerpt: item['excerpt:encoded'],
                attachmentUrl: item['wp:attachment_url'],
                menuOrder: item['wp:menu_order'],
                categoryIds,
                // body 'blocks'
                // components
            };

            const shouldGetMeta = ['post', 'page'];
            if (shouldGetMeta.includes(item['wp:post_type'])) {
                // postObject['metaTitle'] = item['title'] + ' - Dreamy Home';
                // not including metaTitle as we will get that from H1 of each article
                postObject['metaDescription'] = (
                    item['wp:postmeta'] || []
                ).reduce((acc, item) => {
                    const arr = Object.values(item);
                    if (arr[0] === '_yoast_wpseo_metadesc') {
                        acc = arr[1];
                    }
                    return acc;
                }, '');
            }

            return postObject;
        });
};

site.postTypes.forEach((postType) => {
    const posts = getPosts(postType);

    posts.forEach((p) => {
        if (!p.urls) return;
        if (p && p.guid && !allUrls.includes(p.guid)) allUrls.push(p.guid);
        if (p && p.attachmentUrl && !allUrls.includes(p.attachmentUrl))
            allUrls.push(p.attachmentUrl);
        p.urls.forEach((u) => {
            if (u && !allUrls.includes(u)) {
                allUrls.push(u);
            }
        });
    });
    writeObjToFile(path.join(postsDir, `${postType}_collection.json`), posts);
});

// console.log('Completed mapping data');

console.log('completed parsing data (not images).');
console.log('Starting image mapping..');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const allImages = {};
allUrls.forEach((u) => {
    const wpUploadBase = site.baseUrl + '/wp-content/uploads/';
    if (
        u.length <= wpUploadBase.length ||
        u.substring(0, wpUploadBase.length) !== wpUploadBase // removes https://www.dreamyhome.co.uk/wp-content/uploads/
    )
        return;
    if (
        !isImageUrl(u) &&
        !u.includes('.pdf') &&
        !u.includes('.doc') &&
        !u.includes('.docx') &&
        !u.includes('.xls') &&
        !u.includes('.xlsx')
    )
        return;

    const localImage = u.substring(wpUploadBase.length);
    allImages[u] = localImage;
});

writeObjToFile(path.join(uploadsDir, 'manifest.json'), { allImages, allUrls }); // './wp-export/uploads/manifest.json'

async function downloadImages() {
    for (const imgUrl in allImages) {
        console.log(' >>>>>>>>> NEXT <<<<<<<<<<<<,,');
        if (allImages.hasOwnProperty(imgUrl)) {
            const localImage = allImages[imgUrl];
            console.log('LOCAL_IMAGE', localImage);
            const localImagePath = path.join(uploadsDir, localImage); //'./wp-export/uploads' + "2021/03/pea-tendrils.jpg"
            console.log('LOCAL_IMAGE_PATH', localImagePath);
            if (!fs.existsSync(localImagePath)) {
                //'./wp-export/uploads' + "2021/03/pea-tendrils.jpg"
                const localImageDir = path.dirname(localImagePath); // './wp-export/uploads/2021/03
                console.log('LOCAL_IMAGE_DIRECTORY', localImageDir);
                try {
                    fs.mkdirSync(localImageDir, { recursive: true });
                    console.log('IMG_URL', imgUrl);
                    const dest = path.join(outputDir, 'uploads', localImage);
                    console.log('DEST', dest);
                    const { filename } = await download.image({
                        url: imgUrl,
                        dest,
                    });
                    console.log(`Image downloaded: ${filename}`);
                } catch (e) {
                    console.error(`Download error: ${e}`);
                    if (e.message.indexOf('404') > -1) {
                        const pl = `images/placeholder${path.extname(
                            localImagePath
                        )}`;
                        console.log(
                            `Copying placeholder from ${pl} to ${localImagePath}`
                        );
                        fs.copyFileSync(pl, localImagePath);
                    }
                }
            }
        }
    }
    console.log('Images all downloaded');
}

downloadImages();
