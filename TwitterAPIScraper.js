import Scraper from "./Scraper.js";
import GuestTokenManager from "./GuestTokenManager.js";
import MentionsArray from "./MentionsArray.js";

const API_AUTHORIZATION_HEADER = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs=1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

class TwitterAPIScraper extends Scraper {
    constructor() {
        super();
        this.guestTokenManager = new GuestTokenManager();
        this.userAgent = null;
        this.apiHeaders = {
            "User-Agent": this.userAgent,
            Authorization: API_AUTHORIZATION_HEADER,
            "Accept-Language": "en-US,en;q=0.5",
        };

        this.setRandomUserAgent();
    }

    deleteGuestToken() {
        this.guestTokenManager.reset();
        delete this.apiHeaders["x-guest-token"];
    }

    checkGuestTokenCallback(response) {
        if (response.status !== 200) {
            this.setRandomUserAgent();
            return false;
        }
        return true;
    }

    async ensureGuestToken() {
        if (!this.guestTokenManager.getToken()) {
            const r = await this.post("https://api.twitter.com/1.1/guest/activate.json", null, this.apiHeaders, this.checkGuestTokenCallback.bind(this));

            if (r && r.guest_token) {
                this.guestTokenManager.setToken(r.guest_token);
            } else {
                console.log("GUEST TOKEN IS EMPTY");
            }
        }
        this.apiHeaders["x-guest-token"] = this.guestTokenManager.getToken();
    }

    checkApiResponse(response) {
        if ((403 <= response.status && response.status <= 429) || response.status !== 200) {
            this.deleteGuestToken();
            this.ensureGuestToken();
            return false;
        }
        return true;
    }

    async getApiData(endpoint, params) {
        await this.ensureGuestToken();

        params = encodeURI(`variables=${JSON.stringify(params)}`);
        const res = await this.get(endpoint, params, this.apiHeaders, this.checkApiResponse);

        if (res) return JSON.parse(JSON.stringify(res.data));
        return null;
    }

    async iterateApiData(endpoint, params, limit) {
        let result = [];

        let cursor = null;
        let reqParams = params;

        let stopOnEmptyResponse = false;
        let bottomCursorAndStop = null;

        let emptyResponsesOnCursor = 0;

        while (true) {
            let newCursor = null;
            let promptCursor = null;
            let newBottomCursorAndStop = null;

            let instructions = [];

            reqParams.count = limit - result.length > 100 ? 100 : limit - result.length;
            const res = await this.getApiData(endpoint, reqParams);

            if (!res) break;            
            if (res.data.user.result.__typename === 'User') instructions = res.data.user.result.timeline.timeline.instructions;

            let tweetCount = 0;
            for (const instruction of instructions) {
                let entries;
                if (instruction.type === "TimelineAddEntries") {
                    entries = instruction.entries;
                } else {
                    continue;
                }

                for (const entry of entries) {
                    if (entry.entryId.startsWith("tweet-")) {
                        tweetCount++;

                        result.push(entry);
                        if (result.length >= limit) return result;
                    }
                    
                    if (!(entry.entryId.startsWith("sq-cursor-") || entry.entryId.startsWith("cursor-"))) {
                        continue;
                    }
                    let cursorContent = entry.content;
                    while (cursorContent.itemType === "TimelineTimelineItem" || cursorContent.entryType === "TimelineTimelineItem") {
                        cursorContent = cursorContent.itemContent;
                    }

                    const entryCursor = cursorContent.value;
                    const entryCursorStop = cursorContent.stopOnEmptyResponse ? cursorContent.stopOnEmptyResponse : false;

                    if (entry.entryId === `sq-cursor-bottom` || entry.entryId.startsWith(`cursor-bottom-`)) {
                        newCursor = entryCursor;

                        if (entryCursorStop) {
                            stopOnEmptyResponse = entryCursorStop;
                        }
                    } else if (entry.entryId.startsWith("cursor-showMoreThreadsPrompt-")) {
                        promptCursor = entryCursor;
                    } else if (bottomCursorAndStop && (entry.entryId === "sq-cursor-bottom" || entry.entryId.startswith("cursor-bottom-"))) {
                        newBottomCursorAndStop = { cursor: entryCursor, cursorStop: entryCursorStop };
                    }
                }
            }

            if (!bottomCursorAndStop && !newBottomCursorAndStop) {
                bottomCursorAndStop = newBottomCursorAndStop;
            }
            if (newCursor === cursor && tweetCount === 0) {
                emptyResponsesOnCursor += 1;
                if (emptyResponsesOnCursor > this.retries) {
                    break;
                }
            }
            if (!newCursor || (stopOnEmptyResponse && tweetCount === 0)) {
                if (promptCursor) {
                    newCursor = promptCursor;
                } else if (bottomCursorAndStop) {
                    newCursor = bottomCursorAndStop.cursor;
                    stopOnEmptyResponse = bottomCursorAndStop.cursorStop;
                    bottomCursorAndStop = null;
                } else {
                    break;
                }
            }

            if (newCursor !== cursor) {
                emptyResponsesOnCursor = 0;
            }
            cursor = newCursor;
            reqParams = { ...params };
            reqParams.cursor = cursor;
        }

        return result;
    }

    async getProfile(user) {
        const res = await this.getApiData("https://api.twitter.com/graphql/jMaTS-_Ea8vh9rpKggJbCQ/UserByScreenName?", { screen_name: user, withHighlightedLabel: false });

        let obj = {};
        if (res) {
            const data = res.data.user;

            if (data && data.legacy) {
                const hasBirthdate = !!data.legacy_extended_profile;
                obj = {
                    userId: data.rest_id,
                    profilePictureUrl: data.legacy.profile_image_url_https,
                    createdAt: data.legacy.created_at,
                    description: data.legacy.description,
                    followersCount: data.legacy.followers_count,
                    followingCount: data.legacy.friends_count,
                    tweetCount: data.legacy.statuses_count,
                    name: data.legacy.name,
                    screenName: data.legacy.screen_name,
                    private: data.legacy.protected,
                    birthdate: hasBirthdate ? data.legacy_extended_profile.birthdate : null
                };
            }
        }

        return obj;
    }

    async getProfileById(userId) {
        const res = await this.getApiData("https://twitter.com/i/api/graphql/I5nvpI91ljifos1Y3Lltyg/UserByRestId?", { userId: userId, withSafetyModeUserFields: false, withSuperFollowsUserFields: false });

        let obj = {};
        if (res) {
            const data = res.data.user.result;

            if (!!data && !!data.legacy) {
                const hasBirthdate = !!data.legacy_extended_profile;
                obj = {
                    userId: data.rest_id,
                    profilePictureUrl: data.legacy.profile_image_url_https,
                    createdAt: data.legacy.created_at,
                    description: data.legacy.description,
                    followersCount: data.legacy.followers_count,
                    followingCount: data.legacy.friends_count,
                    tweetCount: data.legacy.statuses_count,
                    name: data.legacy.name,
                    screenName: data.legacy.screen_name,
                    private: data.legacy.protected,
                    birthdate: hasBirthdate ? data.legacy_extended_profile.birthdate : null
                };
            }
        }

        return obj;
    }

    async getMentions(userId, limit) {
        const params = {
            userId: userId,
            count: 100,
            cursor: null,
            includePromotedContent: false,
            withCommunity: false,
            withSuperFollowsUserFields: false,
            withDownvotePerspective: false,
            withReactionsMetadata: false,
            withReactionsPerspective: false,
            withSuperFollowsTweetFields: false,
            withVoice: false,
            withV2Timeline: false,
        };
        const res = await this.iterateApiData("https://twitter.com/i/api/graphql/BSKxQ9_IaCoVyIvQHQROIQ/UserTweetsAndReplies?", params, limit);
        
        const obj = new MentionsArray(userId);
        for (const entry of res) {
            if (entry.content.itemContent.tweet_results.result.legacy) {
                const mentions = entry.content.itemContent.tweet_results.result.legacy.entities.user_mentions;

                const isRT = !!entry.content.itemContent.tweet_results.result.legacy.entities.retweeted_status_result;
                if (isRT) mentions.splice(0, 1);
    
                for (const mention of mentions) {
                    const mentionUserId = mention.id_str;
                    obj.add(mentionUserId);
                }
            }
        }

        return obj;
    }
}

export default TwitterAPIScraper;
