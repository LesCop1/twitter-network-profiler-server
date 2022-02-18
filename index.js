import express from "express";
import cors from "cors";
import global from "./globals.js";
import { search } from "./main.js"; 
import TwitterAPIScraper from "./TwitterAPIScraper.js";
import GreatfonScraper from "./GreatfonScraper.js";

const app = express();

app.use(cors())

const twitterScraper = new TwitterAPIScraper();
const instagramScraper = new GreatfonScraper();

app.get('/search', validator, async (req, res) => {
    let { target, tweetLimit, relationLimit, instagramLookup, depth } = req.query;

    const result = await search(twitterScraper, instagramScraper, target, tweetLimit, relationLimit, instagramLookup, depth);

    if (!result) return res.status(500).json({
        success: false,
        error: "Search method failed"
    });

    return res.status(200).json({ success: true, ...result });
});

function validator(req, res, next) {
    let { target, tweetLimit, relationLimit, instagramLookup, depth } = req.query;

    if (!target || typeof target !== "string" || target === "") return wrongParameters(res, "target");

    if (tweetLimit) {
        tweetLimit = Number(tweetLimit);
        req.query.tweetLimit = tweetLimit;

        if (tweetLimit < global.MIN_TWEET_LIMIT || tweetLimit > global.MAX_TWEET_LIMIT) return wrongParameters(res, "tweetLimit");
    } else {
        return wrongParameters(res, "tweetLimit");
    }

    if (relationLimit) {
        relationLimit = Number(relationLimit);
        req.query.relationLimit = relationLimit;

        if (relationLimit < global.MIN_RELATION_LIMIT || relationLimit > global.MAX_RELATION_LIMIT) return wrongParameters(res, "relationLimit");
    } else {
        return wrongParameters(res, "relationLimit");
    }

    if (!instagramLookup) return wrongParameters(res, "instagramLookup");
    req.query.instagramLookup = Boolean(instagramLookup === 'true');

    if (depth) {
        depth = Number(depth);
        req.query.depth = depth;

        if (depth < global.MIN_DEPTH || depth > global.MAX_DEPTH) return wrongParameters(res, "depth");
    } else {
        return wrongParameters(res, "depth");
    }

    return next();
}

function wrongParameters(res, param) {
    return res.status(400).json({
        success: false,
        error: `Parameters '${param}' is wrong or missing`
    });
}

app.listen(8080, () => console.log('Server is listening on port 8080.'));
