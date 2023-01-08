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

const postBlogData = (a, blogData) => {
    try {
        const allMedia = manifest.allImages;
        const formData = new FormData();
        console.log(typeof blogData.editorjsData);
        formData.append(
            'data',
            JSON.stringify({
                metaData: {
                    title: blogData.attributes.title,
                    description: a.metaDescription,
                },
                title: blogData.attributes.title,
                slug: a.slug,
                originalDate: a.postDate,
                body: blogData.editorjsData,
                wpId: a.id,
            })
        );
        fetch('http://localhost:1337/api/blogs', {
            method: 'POST',
            body: formData,
            // headers: { 'Content-Type': 'application/json' },
        })
            .then((res) => res.json())
            .then((json) => console.log(json));
    } catch (error) {
        console.log('error occurred: ', error);
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
    const publishedPosts = wpPosts.filter((a) => a.status === 'publish');
    const mappedPosts = await publishedPosts
        // .slice(0, 1)
        //best-planer-thicknesser-reviews
        .filter((a) => a.slug === 'water-softeners')
        .slice(0, 1)
        .reduce(async (prev, a) => {
            const acc = await prev;
            // console.log(a.encodedContent);
            // createHtmlFileFromSlug(a.slug);
            const blogData = await parseEncodedContent(
                a.encodedContent,
                a.slug
            );

            await postBlogData(a, blogData);

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
    // let newPosts = 0,
    //     dupePosts = 0;
    // for (let wpPostIndex = 0; wpPostIndex < wpPosts.length; wpPostIndex++) {
    //     const wpPost = wpPosts[wpPostIndex];
    //     if (!wpPost.title) continue;
    //     const existing = existingPosts.find(
    //         (t) => t.slug.toLowerCase() === wpPost.slug.toLowerCase()
    //     );
    //     const publish_date =
    //         wpPost.pubDate && wpPost.pubDate.length > 0
    //             ? moment.utc(wpPost.pubDate).toISOString()
    //             : null;
    //     const original_date =
    //         wpPost.postDate && wpPost.postDate.length > 0
    //             ? moment(wpPost.postDate).toISOString()
    //             : null;
    //     let markdown = wpPost.markdown || '';
    //     let excerpt = wpPost.encodedExcerpt || '';
    //     wpPost.urls.forEach((url) => {
    //         if (urlSubstitutions[url]) {
    //             markdown = markdown.replaceAll(url, urlSubstitutions[url]);
    //             excerpt = excerpt.replaceAll(url, urlSubstitutions[url]);
    //         }
    //     });
    //     const user =
    //         users.find((u) => u.username === wpPost.creator) || defaultUser;
    //     if (!existing) {
    //         if (user) {
    //             await _post('/posts', {
    //                 slug: wpPost.slug,
    //                 title: wpPost.title,
    //                 body: markdown,
    //                 excerpt: excerpt,
    //                 publish_date,
    //                 published: wpPost.status === 'publish',
    //                 author: { id: user.id },
    //                 original_date,
    //                 wp_id: wpPost.id,
    //             });
    //             newPosts++;
    //         } else {
    //             missingUsers.push(wpPost.creator);
    //         }
    //     } else {
    //         // update post
    //         if (user) {
    //             existing.title = wpPost.title;
    //             existing.body = markdown;
    //             existing.excerpt = excerpt;
    //             existing.original_date = original_date;
    //             existing.publish_date = publish_date;
    //             existing.published = wpPost.status === 'publish';
    //             existing.wp_id = wpPost.id;
    //             if (doUpdates) await _put(`/posts/${existing.id}`, existing);
    //         }
    //         dupePosts++;
    //     }
    // }
    // if (missingUsers.length > 0) {
    //     console.log(
    //         `  Unable to import posts due to ${missingUsers.length} missing users: `,
    //         new Set(missingUsers).values()
    //     );
    // }
    // console.log(
    //     `  Imported ${newPosts} new posts, updated ${dupePosts} existing posts`
    // );
    // // ++++++++++++++++++++++++++++++++++++++++++++++++++++
    // // update post tags & categories
    // // ++++++++++++++++++++++++++++++++++++++++++++++++++++
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
    // console.log(`  Updated ${updatedPosts} posts with tags and categories`);
    // // ++++++++++++++++++++++++++++++++++++++++++++++++++++
    // // update post comments
    // // ++++++++++++++++++++++++++++++++++++++++++++++++++++
    // let existingComments = (await _axios.get('/comments?_limit=-1')).data;
    // // drop all existing comments
    // // for (let di = 0; di < existingComments.length; di++) {
    // //   const dicm = existingComments[di];
    // //   console.log("Deleting comment " + dicm.id);
    // //   await _delete(`/comments/${dicm.id}`);
    // // }
    // // existingComments = (await _axios.get("/comments?_limit=-1")).data;
    // console.log(`Attempting to upload comments to posts`);
    // let commentsCount = 0;
    // let commentErrors = 0;
    // for (let wpPostIndex = 0; wpPostIndex < wpPosts.length; wpPostIndex++) {
    //     const wpPost = wpPosts[wpPostIndex];
    //     if (!wpPost.title) continue;
    //     if (!wpPost.slug || wpPost.slug.length === 0)
    //         wpPost.slug = slugify(wpPost.title);
    //     const existing = existingPosts.find(
    //         (t) => t.slug.toLowerCase() === wpPost.slug.toLowerCase()
    //     );
    //     if (!existing || !wpPost.comments || wpPost.comments.length === 0)
    //         continue;

    //     // does the post have comments
    //     if (
    //         existingComments.findIndex(
    //             (c) => c.post && c.post.id === existing.id
    //         ) > -1
    //     ) {
    //         continue; // no need to populate comments if they were already populated
    //     }
    //     const sComments = {};
    //     // assumes that the list is in such an order where comments with parents always
    //     // appear AFTER the parent comment itself in the enumeration
    //     const lenWpComments = wpPost.comments.length;
    //     for (let ci = 0; ci < lenWpComments; ci++) {
    //         const wpComment = wpPost.comments[ci];
    //         let user = null;
    //         if (wpComment.userId && wpComment.userId > 0) {
    //             const wpAuthor = wpAuthors.find(
    //                 (a) => a.id === wpComment.userId
    //             );
    //             if (wpAuthor && wpAuthor.id > 0) {
    //                 const eUser =
    //                     users.find((u) => u.username === wpAuthor.login) ||
    //                     defaultUser;
    //                 if (eUser) user = { id: eUser.id };
    //             }
    //         }
    //         const parent =
    //             wpComment.parentId && wpComment.parentId > 0
    //                 ? sComments[`c-${wpComment.parentId}`]
    //                 : null;
    //         let newComment = {
    //             author: wpComment.author,
    //             author_email: wpComment.authorEmail,
    //             author_url: wpComment.authorUrl,
    //             author_ip: wpComment.authorIp,
    //             approved: wpComment.approved,
    //             comment_type: wpComment.type,
    //             comment_date: wpComment.date,
    //             body: turndownService.turndown(wpComment.content),
    //             parent,
    //             post: { id: existing.id },
    //             user,
    //         };
    //         try {
    //             newComment = await _post('/comments', newComment);
    //             sComments[`c-${wpComment.id}`] = { id: newComment.id };
    //             commentsCount++;
    //         } catch {
    //             commentErrors++;
    //             console.log(
    //                 'unable to post comment',
    //                 JSON.stringify(newComment)
    //             );
    //         }
    //     }
    // }
    // console.log(
    //     `  Added ${commentsCount} post comments, ${commentErrors} post errors`
    // );
};

importPosts();
//importCategories();
