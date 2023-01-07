const mime = require('mime-types');
const needle = require('needle');
const path = require('path');
const fs = require('fs');
const { default: slugify } = require('slugify');

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
    replacedData = data.replace('[cyear]', dayjs().format('YYYY'));
    replacedData = replacedData.replace(/[\r\n]/gm, '');
    replacedData = _trim(replacedData);
    const split = replacedData.split(' ').filter((a) => a);
    replacedData = split.join(' ');
    return replacedData;
};
const formatAnchor = (data) => {
    let replacedData = data;
    replacedData = data.replace('-cyear', '-' + dayjs().format('YYYY'));
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
        if (name === 'purified-water') {
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

            // console.log('<< body >>');
            // console.log(body);
            // console.log('<< body >>');
            return new Promise((resolve) => {
                resolve(imgBlock);
            });
            //console.log(body);
            // return Array.isArray(body) ? (body.length > 0 ? body[0] : null) : body;
        }
    } catch (e) {
        console.error(`File upload error: ${e.message}`);
        return null;
    }
};

const uploadMediaAlt = async ({ file, name, caption, alternativeText }) => {
    try {
        if (name === 'purified-water') {
            const data = {
                fileInfo: JSON.stringify({
                    alternativeText,
                    caption,
                    name,
                }),
                files: {
                    file,
                    content_type: mime.contentType(file),
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
            // console.log('<< body >>');
            // console.log(body);
            // console.log('<< body >>');
            return new Promise((resolve) => {
                resolve(body);
            });
            //console.log(body);
            // return Array.isArray(body) ? (body.length > 0 ? body[0] : null) : body;
        }
    } catch (e) {
        console.error(`File upload error: ${e.message}`);
        return null;
    }
};

module.exports = {
    slugify,
    formatText,
    formatAnchor,
    filterOnlyTags,
    uploadMedia,
};
