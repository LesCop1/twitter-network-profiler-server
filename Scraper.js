import axios from "axios";

class Scraper {
    constructor() {
        this.retries = 3;
    }

    setRandomUserAgent() {
        this.userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.${Math.floor(Math.random() * 9999)} Safari/537.${Math.floor(
            Math.random() * 99
        )}`;
        this.apiHeaders["User-Agent"] = this.userAgent;
    }

    async get(url, params, headers, callback) {
        for (let attempt = 0; attempt < this.retries; attempt++) {
            try {
                const finalUrl = params ? url + params : url;
                const res = await axios.get(finalUrl, { headers });
                
                const success = !callback ? true : callback(res);
                
                if (success) return res;
            } catch {}

            if (attempt < this.retries) {
                await new Promise(x => setTimeout(x, (1000 * Math.pow(2, attempt))));
            }
        }
        return null;
    }

    async post(url, data = null, headers = null, callback = null) {
        for (let attempt = 0; attempt < this.retries; attempt++) {
            try {
                const res = await axios.post(url, data, { headers, validateStatus: (status) => status >= 200 && status <= 429 });
                
                const success = !callback ? true : callback(res);
                
                if (success) return JSON.parse(JSON.stringify(res.data));
            } catch (error) {
                console.log(error);
                console.log('Error while POST request')
            }

            if (attempt < this.retries) {
                await new Promise(x => setTimeout(x, (1000 * Math.pow(2, attempt))));
            }
        }
        console.log('ERROR GIVING UP');
        return null;
    }
}

export default Scraper;
