import axios from "axios";

async function extractInstagramAccountIfAny(profile) {
    let account = null;
    
    const instagramAccountRegex = /(?<=(insta:|ig:|instagram:|insta :|ig :|instagram :))(.\w+)/gi;
    const instagramAccounts = profile.description.match(instagramAccountRegex) || [];
    for (const instagramAccount of instagramAccounts) {
        account = instagramAccount.trim();
    }

    const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    const links = profile.description.match(urlRegex) || [];

    if (profile.url) links.push(profile.url);

    for (const link of links) {
        const url = await unshortenLink(link);

        if (url) {
            const urlSplit = url.split('instagram.com/');
            if (urlSplit.length > 1) account = urlSplit[1].split('/')[0];
        }
    }

    return account
}

async function unshortenLink(url) {
    try {
        const res = await axios.get(url, { maxRedirects: 0, validateStatus: (status) => status >= 200 && status < 302 });

        return res.headers.location;
    } catch {
        return null;
    }
}

async function sleep(ms) {
    await new Promise((res) => {
        setTimeout(() => {
            res();
        }, ms);
    })
}

// eslint-disable-next-line import/no-anonymous-default-export
export { extractInstagramAccountIfAny, unshortenLink, sleep };