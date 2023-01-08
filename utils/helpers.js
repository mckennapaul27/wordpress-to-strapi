const needle = require('needle');
const path = require('path');
const fs = require('fs');
const { default: slugify } = require('slugify');
const moment = require('moment');
const _trim = require('lodash.trim');
require('dotenv').config();

const manifest = JSON.parse(
    fs.readFileSync('./wp-export/uploads/manifest.json', 'utf8')
);
const allMedia = manifest.allImages;
// const slugify = (string) => {
//     const a =
//         'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
//     const b =
//         'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
//     const p = new RegExp(a.split('').join('|'), 'g');

//     return string
//         .toString()
//         .toLowerCase()
//         .replace(/\s+/g, '-') // Replace spaces with -
//         .replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
//         .replace(/&/g, '-and-') // Replace & with 'and'
//         .replace(/[^\w\-]+/g, '') // Remove all non-word characters
//         .replace(/\-\-+/g, '-') // Replace multiple - with single -
//         .replace(/^-+/, '') // Trim - from start of text
//         .replace(/-+$/, ''); // Trim - from end of text
// };

const formatText = (data) => {
    let replacedData = data;
    replacedData = data.replace('[cyear]', moment().format('YYYY'));
    replacedData = replacedData.replace(/[\r\n]/gm, '');
    replacedData = _trim(replacedData);
    const split = replacedData.split(' ').filter((a) => a);
    replacedData = split.join(' ');
    replacedData = replacedData.replace('A:', 'A: ');
    return replacedData;
};
const formatAnchor = (data) => {
    let replacedData = data;
    replacedData = data.replace('-cyear', '-' + moment().format('YYYY'));
    replacedData = replacedData.replace(/[\r\n]/gm, '');
    replacedData = _trim(replacedData);
    const split = replacedData.split(' ').filter((a) => a);
    replacedData = split.join(' ');
    return replacedData;
};

const filterOnlyTags = (obj) => obj.children.filter((a) => a.type === 'tag');

const uploadMedia = async (obj) => {
    const { src, alt } = obj.attribs;
    const split = src.split('.');
    const ext = split[split.length - 1];
    const file = path.join('./wp-export/uploads/', allMedia[src]);
    const name = slugify(path.parse(allMedia[src]).name);
    const mimeType = `image/${ext}`;
    const alternativeText = alt;

    try {
        const data = {
            fileInfo: JSON.stringify({
                alternativeText,
                name,
            }),
            files: {
                file,
                content_type: mimeType,
            },
        };
        const { body } = await needle(
            'post',
            'http://localhost:1337' + '/api/upload',
            data,
            {
                multipart: true,
                // headers: {
                //     authorization: _axios.defaults.headers.Authorization,
                // },
            }
        );
        if (Array.isArray(body)) {
            if (body.length === 0) throw new Error('No image response');
        }

        const img = body[0];
        const imgBlock = {
            type: 'image',
            data: {
                file: {
                    url: img.url,
                    mime: 'image/' + img.ext.slice(1),
                    height: img.height,
                    width: img.width,
                    size: img.size,
                    alt: img.alternativeText, // keep alt from original
                    formats: img.formats,
                },
                caption: '',
                withBorder: false,
                stretched: false,
                withBackground: false,
            },
        };
        return new Promise((resolve) => {
            resolve(imgBlock);
        });
    } catch (e) {
        console.error(`File upload error: ${e.message}`);
        return null;
    }
};

const writeObjToFile = (path, obj) => {
    let str = typeof obj === 'string' ? obj : JSON.stringify(obj, null, '  ');
    fs.writeFileSync(path, str, 'utf8');
};

const createHtmlFileFromSlug = async (slug) => {
    const outputFile = './sample-html-pages/' + slug + '.html';
    const postCollection = JSON.parse(
        fs.readFileSync('./wp-export/posts/post_collection.json', 'utf8')
    );
    const post = postCollection.find((a) => a.slug === slug);
    writeObjToFile(outputFile, post.encodedContent);
};

const removeDuplicateHeaders = (blocks) => {
    const headerBlocks = blocks
        .filter((a) => a.type === 'header')
        .map((a) => {
            const regex = /(<([^>]+)>)/gi;
            a.data.text = a.data.text.replace(regex, '');
            return a;
        })
        .reduce(
            (acc, item) => {
                if (acc.uniques.includes(item.data.text)) {
                    acc.duplicates.push(item.data.text);
                } else {
                    acc.uniques.push(item.data.text);
                }
                return acc;
            },
            {
                uniques: [],
                duplicates: [],
            }
        );
    const blocksSimple = blocks.map((a) => {
        if (a.data.text) return a.data.text;
        else return null;
    });
    const toRemove = headerBlocks.duplicates.reduce((acc, item) => {
        acc.push(blocksSimple.lastIndexOf(item));
        return acc;
    }, []);
    return toRemove;
};

module.exports = {
    slugify,
    formatText,
    formatAnchor,
    filterOnlyTags,
    uploadMedia,
    writeObjToFile,
    createHtmlFileFromSlug,
    removeDuplicateHeaders,
};
