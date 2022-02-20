import TwitterAPIScraper from "./TwitterAPIScraper.js";
import GreatfonScraper from "./GreatfonScraper.js";
import global from "./globals.js";
import { extractInstagramAccountIfAny } from "./helpers.js";

async function searchOnePersonById(twitterScraper, instagramScraper, userId, tweetLimit, relationLimit, instagramLookup) {
    if (!userId) return null;
    if (tweetLimit < global.MIN_TWEET_LIMIT || tweetLimit > global.MAX_TWEET_LIMIT) return null;
    if (relationLimit < global.MIN_RELATION_LIMIT || relationLimit > global.MAX_RELATION_LIMIT) return null;

    const targetInfo = await twitterScraper.getProfileById(userId);
    let targetMentions = null;
    let instaInfo = null;

    if (targetInfo && Object.keys(targetInfo).length !== 0) {
        if (instagramLookup) {
            const instaAccount = await extractInstagramAccountIfAny(targetInfo);

            if (instaAccount) {
                instaInfo = await instagramScraper.getProfile(instaAccount);
            }
        }

        targetMentions = await twitterScraper.getMentions(targetInfo.userId, tweetLimit);
        targetMentions.sortByOccurrence();
        targetMentions.keepMax(relationLimit);
    }

    return {
        data: {
            ...targetInfo,
            instagram: instaInfo,
        },
        mentions: targetMentions
    }
}

async function search(twitterScraper, instagramScraper, target, tweetLimit, relationLimit, instagramLookup, depth) {
    if (!target) return null;
    if (tweetLimit < global.MIN_TWEET_LIMIT || tweetLimit > global.MAX_TWEET_LIMIT) return null;
    if (relationLimit < global.MIN_RELATION_LIMIT || relationLimit > global.MAX_RELATION_LIMIT) return null;
    if (depth < global.MIN_DEPTH || depth > global.MAX_DEPTH) return null;

    const targetInfo = await twitterScraper.getProfile(target);
    let targetMentions = { keys: [] };
    let instaInfo = null;

    if (targetInfo && Object.keys(targetInfo).length !== 0) {
        if (instagramLookup) {
            const instaAccount = await extractInstagramAccountIfAny(targetInfo);

            if (instaAccount) {
                instaInfo = await instagramScraper.getProfile(instaAccount);
            }
        }

        targetMentions = await twitterScraper.getMentions(targetInfo.userId, tweetLimit);
        targetMentions.sortByOccurrence();
        targetMentions.keepMax(relationLimit);
    } else {
        return null;
    }

    const user = {
        ...targetInfo,
        instagram: instaInfo,
        available: true,
        depth: 0,
    }

    const data = [];
    const tree = {};

    data.push(user);

    tree[`${targetInfo.userId}`] = [];

    for (let i = 0; i < targetMentions.keys.length; i++) {
        console.log(`(${i + 1})`);

        tree[`${targetInfo.userId}`].push({
            key: targetMentions.keys[i],
            occurence: targetMentions.occurrence[i],
            tab: []
        });

        if (isNotInArray(data, targetMentions.keys[i])) {
            const { data: dataDepth1, mentions: mentionsDepth2 } = await searchOnePersonById(twitterScraper, instagramScraper, targetMentions.keys[i], tweetLimit, relationLimit, instagramLookup);

            if (dataDepth1) {
                data.push({ ...dataDepth1, available: true, depth: 1 });
            } else {
                data.push({ userId: targetMentions.keys[i], available: false, depth: 1 });
            }

            if (depth >= 2 && mentionsDepth2) {
                for (let j = 0; j < mentionsDepth2.keys.length; j++) {
                    console.log(`(${j + 1},${i + 1})`);

                    const treeDepth2 = tree[`${targetInfo.userId}`][tree[`${targetInfo.userId}`].length - 1].tab;
                    treeDepth2.push({
                        key: mentionsDepth2.keys[j],
                        occurence: mentionsDepth2.occurrence[j],
                        tab: []
                    });

                    if (isNotInArray(data, mentionsDepth2.keys[j])) {
                        const { data: dataDepth2, mentions: mentionsDepth3 } = await searchOnePersonById(twitterScraper, instagramScraper, mentionsDepth2.keys[j], tweetLimit, relationLimit, instagramLookup);
                        
                        if (dataDepth2) {
                            data.push({ ...dataDepth2, available: true, depth: 2 });
                        } else {
                            data.push({ userId: mentionsDepth2.keys[j], available: false, depth: 2 });
                        }

                        if (depth >= 3 && mentionsDepth3) {
                            for (let k = 0; k < mentionsDepth3.keys.length; k++) {
                                console.log(`(${k + 1},${j + 1},${i + 1})`);

                                const treeDepth3 = treeDepth2[treeDepth2.length - 1].tab;

                                treeDepth3.push({
                                    key: mentionsDepth3.keys[k],
                                    occurence: mentionsDepth3.occurrence[k],
                                    tab: []
                                });

                                if (isNotInArray(data, mentionsDepth3.keys[k])) {
                                    const { data: dataDepth3 } = await searchOnePersonById(twitterScraper, instagramScraper, mentionsDepth3.keys[k], tweetLimit, relationLimit, instagramLookup);

                                    if (dataDepth3) {
                                        data.push({ ...dataDepth3, available: true, depth: 3 });
                                    } else {
                                        data.push({ userId: mentionsDepth3.keys[k], available: false, depth: 3 });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return {
        data,
        tree
    }
}

function isNotInArray(array, userId) {
    for (let i = 0; i < array.length; i++) {
        const element = array[i];

        if (element.userId === userId) return false;
    }
    return true;
}

export {
    search,
    searchOnePersonById
}
