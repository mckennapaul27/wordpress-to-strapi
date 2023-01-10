const axios = require('axios');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const escapeRegExp = require('escape-string-regexp');
const FormData = require('form-data');
const needle = require('needle');
const mime = require('mime-types');
const slugify = require('slugify');
const qs = require('qs');
const { parseEncodedContent } = require('./utils/parse-encoded-content');
const { createHtmlFileFromSlug } = require('./utils/helpers');

const fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
const _axios = axios.create({
    baseURL: strapiUrl,
});
//console.log(_axios);
const site = JSON.parse(fs.readFileSync('./wp-export/site.json', 'utf8'));
const wpCategories = JSON.parse(
    fs.readFileSync('./wp-export/categories.json', 'utf8')
);
const wpAuthors = JSON.parse(
    fs.readFileSync('./wp-export/authors.json', 'utf8')
);
const wpPosts = JSON.parse(
    fs.readFileSync('./wp-export/posts/post_collection.json', 'utf8')
);
const wpAttachments = JSON.parse(
    fs.readFileSync('./wp-export/posts/attachment_collection.json', 'utf8')
);
const manifest = JSON.parse(
    fs.readFileSync('./wp-export/uploads/manifest.json', 'utf8')
);

const _post = async (r, obj) => {
    try {
        const formData = new FormData();
        formData.append('data', JSON.stringify(obj));
        const res = await fetch(strapiUrl + r, {
            method: 'POST',
            body: formData,
        });
        const json = await res.json();
        return json;
    } catch (e) {
        console.error(e.message);
        console.error(JSON.stringify(obj));
        throw e;
    }
};

const _put = async (r, obj) => {
    try {
        const formData = new FormData();
        formData.append('data', JSON.stringify(obj));
        const res = await fetch(strapiUrl + r, {
            method: 'PUT',
            body: formData,
        });
        console.log(res);
        const json = await res.json();

        return json;
    } catch (e) {
        console.error(e.message);
        console.error(JSON.stringify(obj));
        throw e;
    }
};

const updateBlogData = async (a, blogData, categories, id) => {
    console.log('attempting to UPDATE post (', a.slug, ') ....');
    try {
        const allMedia = manifest.allImages;
        const formData = new FormData();
        const { attributes, editorjsData, comparison, detailedReviews } =
            blogData;
        //console.log(detailedReviews);
        const data = {
            metaData: {
                title: attributes.title,
                description: a.metaDescription,
            },
            title: attributes.title,
            slug: a.slug,
            originalDate: a.postDate,
            pubDate: a.pubDate,
            body: editorjsData,
            wpId: a.id,
            author: 1, // trying array
            categories,
        };
        if (comparison) {
            data.comparison = comparison.items;
            comparison.items.map((item, i) => {
                if (item.img.src) {
                    const key = item.img.src;
                    const filepath = path.join(
                        './wp-export/uploads/',
                        allMedia[key]
                    );
                    if (fs.existsSync(filepath)) {
                        const filename = slugify(
                            path.parse(allMedia[key]).name
                        );
                        const file = fs.createReadStream(filepath);
                        formData.append(
                            `files.comparison[${i}].img`,
                            file,
                            filename
                        );
                    }
                }
                return item;
            });
        }
        if (detailedReviews.length > 0) {
            data.detailedReviews = detailedReviews;
            detailedReviews.map((item, i) => {
                // console.log(item);
                try {
                    //if (item.img.src) {
                    const key = item.img.src;
                    if (key && allMedia[key]) {
                        const filepath = path.join(
                            './wp-export/uploads/',
                            allMedia[key]
                        );
                        if (fs.existsSync(filepath)) {
                            const filename = slugify(
                                path.parse(allMedia[key]).name
                            );
                            const file = fs.createReadStream(filepath);
                            formData.append(
                                `files.detailedReviews[${i}].img`,
                                file,
                                filename
                            );
                        }
                    }
                } catch (error) {
                    console.log('error with index: ', i);
                    console.log(detailedReviews[i]);
                    console.log(error);
                }
                return item;
            });
        }

        // console.log(data);

        formData.append('data', JSON.stringify(data));
        const key = attributes.featuredImg.key;
        if (allMedia[key]) {
            const filepath = path.join('./wp-export/uploads/', allMedia[key]);
            if (fs.existsSync(filepath)) {
                const filename = slugify(path.parse(allMedia[key]).name);
                const file = fs.createReadStream(filepath);
                // https://developer.mozilla.org/en-US/docs/Web/API/FormData/append
                formData.append('files.featuredImg', file, filename);
            }
        }

        const res = await fetch(strapiUrl + '/api/blogs/' + id, {
            method: 'PUT',
            body: formData,
            // headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        // console.log(json);
    } catch (error) {
        console.log(a.slug);
        console.log('ERROR WITH UPDATE');
        console.error(error);

        // console.log(blogData.detailedReviews);
        createHtmlFileFromSlug(a.slug);
        throw error;
    }
};

const postBlogData = async (a, blogData, categories) => {
    console.log('attempting to CREATE post (', a.slug, ') ....');
    try {
        const allMedia = manifest.allImages;
        const formData = new FormData();
        const { attributes, editorjsData, comparison, detailedReviews } =
            blogData;
        //console.log(detailedReviews);
        const data = {
            metaData: {
                title: attributes.title,
                description: a.metaDescription,
            },
            title: attributes.title,
            slug: a.slug,
            originalDate: a.postDate,
            pubDate: a.pubDate,
            body: editorjsData,
            wpId: a.id,
            author: 1, // trying array
            categories,
        };
        if (comparison) {
            data.comparison = comparison.items;
            comparison.items.map((item, i) => {
                const key = item.img.src;
                if (allMedia[key]) {
                    //console.log('allMedia[key] >> ', allMedia[key]);
                    const filepath = path.join(
                        './wp-export/uploads/',
                        allMedia[key]
                    ); //'./wp-export/uploads' + "2021/03/pea-tendrils.jpg"
                    if (fs.existsSync(filepath)) {
                        const filename = slugify(
                            path.parse(allMedia[key]).name
                        );
                        const file = fs.createReadStream(filepath);
                        formData.append(
                            `files.comparison[${i}].img`,
                            file,
                            filename
                        );
                    } else {
                        // console.log('DOES NOT EXIST !!!! 😡');
                        // console.log(filepath);
                        // console.log('\n');
                    }
                }
                return item;
            });
        }
        if (detailedReviews.length > 0) {
            data.detailedReviews = detailedReviews;
            detailedReviews.map((item, i) => {
                try {
                    const key = item.img.src;
                    if (key && allMedia[key]) {
                        const filepath = path.join(
                            './wp-export/uploads/',
                            allMedia[key]
                        );
                        if (fs.existsSync(filepath)) {
                            // console.log('DETAILED REVIEW IMG EXISTS !!!! 👍');
                            // console.log(filepath);
                            const filename = slugify(
                                path.parse(allMedia[key]).name
                            );
                            const file = fs.createReadStream(filepath);
                            formData.append(
                                `files.detailedReviews[${i}].img`,
                                file,
                                filename
                            );
                        } else {
                            // console.log('\n');
                            // console.log(
                            //     'DETAILED REVIEW IMG NOT EXIST !!!! 😡'
                            // );
                            // console.log(filepath);
                            // console.log('\n');
                        }
                    }
                } catch (error) {
                    console.log('error with index: ', i);
                    console.log(detailedReviews[i]);
                    console.log(error);
                }

                // console.log(item);
                return item;
            });
        }

        // console.log(data);

        formData.append('data', JSON.stringify(data));
        const key = attributes.featuredImg.key;
        if (allMedia[key]) {
            const filepath = path.join('./wp-export/uploads/', allMedia[key]);
            const filename = slugify(path.parse(allMedia[key]).name);
            const file = fs.createReadStream(filepath);
            // https://developer.mozilla.org/en-US/docs/Web/API/FormData/append
            if (fs.existsSync(filepath)) {
                formData.append('files.featuredImg', file, filename);
            }
        }

        const res = await fetch(strapiUrl + '/api/blogs', {
            method: 'POST',
            body: formData,
            // headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
    } catch (error) {
        console.log(a.slug);
        console.log('ERROR WITH CREATE');
        console.error(error);
        console.log(error);
        //  console.log(blogData.detailedReviews);
        createHtmlFileFromSlug(a.slug);
        throw error;
    }
};

const importCategories = async () => {
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++
    // import categories
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++
    let existingCategories = (await _axios.get('/api/categories')).data.data;

    console.log(`Attempting to import ${wpCategories.length} categories`);
    let newCategories = 0,
        dupeCategories = 0;

    await wpCategories.reduce(async (prev, a) => {
        const acc = await prev;
        if (
            existingCategories.findIndex(
                (t) => t.attributes.slug.toLowerCase() === a.slug.toLowerCase()
            ) === -1
        ) {
            await _post('/api/categories', {
                slug: a.slug,
                title: a.title,
                metaData: {
                    title: a.title + ' - Dreamy Home',
                },
            });
            newCategories++;
            return acc;
        } else {
            dupeCategories++;
            return acc;
        }
    }, Promise.resolve());
    // first pass, add the categories without the parent/child relationships

    console.log(
        `  Imported ${newCategories} new categories, found ${dupeCategories} existing categories`
    );

    const query = qs.stringify({
        populate: '*',
    });

    existingCategories = (await _axios.get(`/api/categories?${query}`)).data
        .data;
    const wpCategoriesWithParents = wpCategories
        .filter((c) => c.parentId && c.parentId > 0)
        .map((c) => {
            return {
                ...c,
                parentSlug: wpCategories.find((p) => p.id === c.parentId).slug,
            };
        });
    // second pass, updatet the parent/child relationships
    let updatedCategories = 0;
    let alreadyHadParents = 0;

    await wpCategoriesWithParents.reduce(async (prev, a) => {
        const acc = await prev;
        const existingCategory = existingCategories.find(
            (e) => e.attributes.slug === a.slug
        );

        if (existingCategory && !existingCategory.attributes.parent.data) {
            const parentCategory = existingCategories.find(
                (e) => e.attributes.slug === a.parentSlug
            );
            if (parentCategory) {
                existingCategory.parent = {
                    id: parentCategory.id,
                };
                console.log('>>>>>');
                console.log(existingCategory);
                await _put(
                    `/api/categories/${existingCategory.id}`,
                    existingCategory
                );
                updatedCategories++;
                return acc;
            }
            return acc;
        } else if (existingCategory && existingCategory.parent) {
            alreadyHadParents++;
            return acc;
        }
    }, Promise.resolve());
    console.log(
        `  Updated ${updatedCategories} categories with parent relationships, ${alreadyHadParents} already had parents assigned`
    );
};

const importPosts = async (doUpdates) => {
    let missingUsers = [];
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++
    // import posts
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++

    let existingPosts = (await _axios.get('/api/blogs')).data.data.map((a) => ({
        slug: a.attributes.slug,
        id: a.id,
    }));
    const publishedPosts = wpPosts.filter((a) => a.status === 'publish');
    let count = 117;
    const mappedPosts = await publishedPosts
        .slice(117)
        .reduce(async (prev, a) => {
            try {
                const acc = await prev;
                const postWpCategories = a.categoryIds;
                // 2. Get find the corresponding slug for this id
                const wpCategorySlugs = wpCategories.reduce((acc, cat) => {
                    if (postWpCategories.includes(cat.id)) acc.push(cat.slug);
                    return acc;
                }, []);
                // 3. Get existing categories from strapi
                let existingCategories = (await _axios.get('/api/categories'))
                    .data.data;
                // 4. create an array of strapi category ids
                const categories = existingCategories.reduce((acc, cat) => {
                    if (wpCategorySlugs.includes(cat.attributes.slug))
                        acc.push(cat.id);
                    return acc;
                }, []);
                console.log('Attempting to map data for slug ', a.slug);
                const blogData = await parseEncodedContent(
                    a.encodedContent,
                    a.slug
                );
                const exists = existingPosts.filter((b) => b.slug === a.slug);
                if (exists.length > 0) {
                    await updateBlogData(a, blogData, categories, exists[0].id);
                    count++;
                } else {
                    await postBlogData(a, blogData, categories);
                    count++;
                }
                //if (a.slug === 'air-conditioning-unit') {
                // createHtmlFileFromSlug(a.slug);
                // 1.Get category ids for this post

                //}
                console.log('Published post with index: ', count);
                return acc;
            } catch (error) {
                createHtmlFileFromSlug(a.slug);
                return acc;
            }
        }, Promise.resolve([]));

    console.log(publishedPosts.length);

    console.log(`Attempting to import ${wpPosts.length} posts`);
};

importPosts();
//importCategories();
