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

const postBlogData = async (a, blogData, categories) => {
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
                const filepath = path.join(
                    './wp-export/uploads/',
                    allMedia[key]
                );
                const filename = slugify(path.parse(allMedia[key]).name);
                const file = fs.createReadStream(filepath);
                formData.append(`files.comparison[${i}].img`, file, filename);
                return item;
            });
        }
        if (detailedReviews.length > 0) {
            data.detailedReviews = detailedReviews;
            detailedReviews.map((item, i) => {
                console.log(item);
                const key = item.img.src;
                const filepath = path.join(
                    './wp-export/uploads/',
                    allMedia[key]
                );
                const filename = slugify(path.parse(allMedia[key]).name);
                const file = fs.createReadStream(filepath);
                formData.append(
                    `files.detailedReviews[${i}].img`,
                    file,
                    filename
                );
                // console.log(item);
                return item;
            });
        }

        // console.log(data);

        formData.append('data', JSON.stringify(data));
        const key = attributes.featuredImg.key;
        const filepath = path.join('./wp-export/uploads/', allMedia[key]);
        const filename = slugify(path.parse(allMedia[key]).name);
        const file = fs.createReadStream(filepath);
        // https://developer.mozilla.org/en-US/docs/Web/API/FormData/append
        formData.append('files.featuredImg', file, filename);

        const res = await fetch('http://localhost:1337/api/blogs', {
            method: 'POST',
            body: formData,
            // headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        console.log(json);
    } catch (error) {
        console.log(a.slug);
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

    let existingPosts = (await _axios.get('/api/blogs')).data.data;
    // console.log(existingPosts);
    const urlSubstitutions = {};
    // check published status first
    // attach author
    // return blocks and components and h1 from the scraper
    // for featured image, add this file during blog creation
    // for component images, add file in blog creation
    // for 'in-blog' images, add during the creation of blocks
    // add h1 as metaTitle during blog creation
    // .slice(0, 1)
    //best-planer-thicknesser-reviews
    // best-mig-welders-reviews
    // electric-to-thermostatic-shower
    // best-router-tables-reviews
    // handheld-steam-cleaner
    // how-to-clean-a-couch-with-a-steam-cleaner
    // 6-reasons-why-clothes-smell-when-you-air-dry-them
    // 4-reasons-why-your-home-cctv-dvr-keeps-freezing
    // petrol-lawn-mowers-how-to-choose-a-mower
    // water-softeners
    // best-window-cleaning-vac-reviews
    const publishedPosts = wpPosts.filter((a) => a.status === 'publish');
    const mappedPosts = await publishedPosts
        .slice(0, 10)
        .reduce(async (prev, a) => {
            const acc = await prev;

            // if (a.slug === 'best-mig-welders-reviews') {
            // createHtmlFileFromSlug(a.slug);
            // 1.Get category ids for this post
            const postWpCategories = a.categoryIds;
            // 2. Get find the corresponding slug for this id
            const wpCategorySlugs = wpCategories.reduce((acc, cat) => {
                if (postWpCategories.includes(cat.id)) acc.push(cat.slug);
                return acc;
            }, []);
            // 3. Get existing categories from strapi
            let existingCategories = (await _axios.get('/api/categories')).data
                .data;
            // 4. create an array of strapi category ids
            const categories = existingCategories.reduce((acc, cat) => {
                if (wpCategorySlugs.includes(cat.attributes.slug))
                    acc.push(cat.id);
                return acc;
            }, []);
            const blogData = await parseEncodedContent(
                a.encodedContent,
                a.slug
            );
            await postBlogData(a, blogData, categories);
            //}

            // console.log(blogData);
            // blocks
            // featuredImg
            // metaTitle
            // tableComponent
            // detailedRviews component
            return acc;
        }, Promise.resolve([]));
    console.log(publishedPosts.length);

    console.log(`Attempting to import ${wpPosts.length} posts`);

    // ++++++++++++++++++++++++++++++++++++++++++++++++++++
    // update post tags & categories
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++
    // existingPosts = (await _axios.get('/posts?_limit=-1')).data;
    // const categories = (await _axios.get('/categories?_limit=-1')).data;
    // const wpCategories = JSON.parse(
    //     fs.readFileSync('./wp-export/categories.json', 'utf8')
    // );
    // const tags = (await _axios.get('/tags?_limit=-1')).data;
    // const wpTags = JSON.parse(fs.readFileSync('./wp-export/tags.json', 'utf8'));
    // let updatedPosts = 0;
    // for (let wpPostIndex = 0; wpPostIndex < wpPosts.length; wpPostIndex++) {
    //     const wpPost = wpPosts[wpPostIndex];
    //     if (!wpPost.title) continue;
    //     if (!wpPost.slug || wpPost.slug.length === 0)
    //         wpPost.slug = slugify(wpPost.title);
    //     const existing = existingPosts.find(
    //         (t) => t.slug.toLowerCase() === wpPost.slug.toLowerCase()
    //     );
    //     const catIds = [];
    //     const tagIds = [];
    //     if (
    //         existing &&
    //         (!existing.categories || existing.categories.length === 0) &&
    //         wpPost.categoryIds &&
    //         wpPost.categoryIds.length > 0
    //     ) {
    //         for (let ci = 0; ci < wpPost.categoryIds.length; ci++) {
    //             const wpCatSlug = (
    //                 wpCategories.find((g) => g.id === wpPost.categoryIds[ci]) ||
    //                 {}
    //             ).slug;
    //             if (wpCatSlug) {
    //                 const cat = categories.find((s) => wpCatSlug === s.slug);
    //                 if (cat && cat.id) catIds.push(cat.id);
    //             }
    //         }
    //     }
    //     if (
    //         existing &&
    //         (!existing.tags || existing.tags.length === 0) &&
    //         wpPost.tagIds &&
    //         wpPost.tagIds.length > 0
    //     ) {
    //         for (let ci = 0; ci < wpPost.tagIds.length; ci++) {
    //             const wpTagSlug = (
    //                 wpTags.find((g) => g.id === wpPost.tagIds[ci]) || {}
    //             ).slug;
    //             if (wpTagSlug) {
    //                 const tag = tags.find((s) => wpTagSlug === s.slug);
    //                 if (tag && tag.id) tagIds.push(tag.id);
    //             }
    //         }
    //     }
    //     if (catIds.length) {
    //         existing.categories = catIds.map((id) => {
    //             return { id };
    //         });
    //     }
    //     if (tagIds.length) {
    //         existing.tags = tagIds.map((id) => {
    //             return { id };
    //         });
    //     }
    //     if (catIds.length || tagIds.length) {
    //         await _put('/posts/' + existing.id, existing);
    //         updatedPosts++;
    //     }
    // }
    //console.log(`  Updated ${updatedPosts} posts with tags and categories`);
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++
    // update post comments
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++
};

importPosts();
//importCategories();
