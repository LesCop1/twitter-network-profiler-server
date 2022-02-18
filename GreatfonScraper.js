import { parse as HTMLParser } from 'node-html-parser';

import Scraper from "./Scraper.js";

class GreatfonScraper extends Scraper {
    constructor() {
        super();
        this.userAgent = null;
        this.apiHeaders = {
            "User-Agent": this.userAgent,
            "Accept-Language": "en-US,en;q=0.5",
        };

        this.setRandomUserAgent();
    }

    getProfileCallback(response) {
        if (response.status !== 200) {
            this.setRandomUserAgent();
            return false;
        }
        return true;
    }

    async getProfile(target) {
        const res = await this.get(`https://greatfon.com/v/${target}`, null, this.apiHeaders, this.getProfileCallback.bind(this));
        if (!res) return null;

        const root = HTMLParser(res.data);

        const userData = root.querySelector('.user');
        const profilePicUrl = userData.querySelector('.user__img').attributes.style.split('url(\'')[1].split('\')')[0];
        const name = userData.querySelector('.user__title').text;
        const postCount = userData.querySelectorAll('.user__item')[0].text.split(" Posts")[0];
        const followerCount = userData.querySelectorAll('.user__item')[1].text.split(" Followers")[0];
        const followingCount = userData.querySelectorAll('.user__item')[2].text.split(" Following")[0];
        const description = userData.querySelector('.user__info-desc').text;
        const posts = [];

        const isPrivate = !!root.querySelector('.private-block-description');

        if (!isPrivate) {

            const hasPosts = root.querySelector('.profile_posts');

            if (hasPosts) {
                const postsData = hasPosts.querySelectorAll('.content__img');

                for (const post of postsData) {
                    posts.push(post.attributes.src);
                }
            }
        }

        return {
            name,
            profilePicUrl,
            postCount,
            followerCount,
            followingCount,
            description,
            isPrivate,
            posts
        }
    }

}

export default GreatfonScraper;
