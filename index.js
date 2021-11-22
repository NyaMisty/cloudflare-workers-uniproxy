addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

function parseURL(url) {
    let urlbody = url.substr(8);
    urlbody = decodeURIComponent(urlbody.substr(urlbody.indexOf('/') + 1))
    console.log("    Parsing: URLBody: " + urlbody)
    let split_header_url = urlbody.lastIndexOf("/", urlbody.search("://"))
    let real_url = urlbody.substr(split_header_url + 1)
    if (!real_url) {
        throw "Invalid real URL: " + urlbody
    }
    let headersbody = urlbody.substr(0, split_header_url)
    console.log("    Parsing: Real URL: " + real_url)
    console.log("    Parsing: Headers JSON: " + headersbody)
    if (!headersbody) {
        return {
            url: real_url,
            headers: {},
        }
    }
    if (!headersbody.startsWith("{")) {
        headersbody = decodeURIComponent(headersbody)
    }

    if (!headersbody.startsWith("{")) {
        throw "Invalid URL headers string: " + headersbody
    }

    headers = JSON.parse(headersbody)
    
    return {
        url: real_url,
        headers: headers,
    }
}

async function handleRequest(request) {
    if (request.method == "OPTIONS") {
        return new Response("", {status:200, headers:{
            "Access-Control-Allow-Credentials": true,
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Max-Age": "31536000",
            "X-Request-Type": "CORS Preflight"
        }});
    }
    
    let reqHeaders = new Headers(request.headers),
        outBody, outStatus = 200, outCt = null, outHeaders = new Headers({
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": reqHeaders.get('Access-Control-Allow-Headers') || "Accept, Authorization, Cache-Control, Content-Type, DNT, If-Modified-Since, Keep-Alive, Origin, User-Agent, X-Requested-With, Token, x-access-token"
        });

    try {
        console.log("Got Raw ReqUrl: " + request.url)
        let t = parseURL(request.url)
        let url = t.url
        let headers = t.headers
        console.log("Parsed URL body: " + url)
        console.log("Parsed URL headers: " + JSON.stringify(headers))

        if (url.length < 3 || url.indexOf('.') == -1) {
            throw "invalid URL input: " + url;
        } else if (url == "favicon.ico" || url == "robots.txt") {
            return Response.redirect('https://workers.cloudflare.com', 307)
        } else {
            if (url.toLowerCase().indexOf("http") == -1) {
                url = "http://" + url;
            }

            let fp = {
                method: request.method,
                headers: {}
            }

            let he = reqHeaders.entries();
            for (let h of he) {
                if (!['content-length', 'content-type'].includes(h[0])) {
                    fp.headers[h[0]] = h[1];
                }
            }

            if (headers["_method"] !== undefined) {
                fp.method = headers["_method"].toUpperCase()
            }
            fp.headers = Object.assign({}, fp.headers, headers)
            
            if (["POST", "PUT", "PATCH", "DELETE"].indexOf(request.method) >= 0) {
                const ct = (reqHeaders.get('content-type') || "").toLowerCase();
                if (ct.includes('application/json')) {
                    fp.body = JSON.stringify(await request.json());
                } else if (ct.includes('application/text') || ct.includes('text/html')) {
                    fp.body = await request.text();
                } else if (ct.includes('form')) {
                    fp.body = await request.formData();
                } else {
                    fp.body = await request.blob();
                }
            }
            if (headers["_body"] !== undefined) {
                fp.body = headers["_body"]
            }

            let fr = (await fetch(url, fp));
            outStatus = fr.status;
            outCt = fr.headers.get('content-type');
            outBody = fr.body;
        }
    } catch (err) {
        outStatus = 500
        outCt = "application/json";
        outBody = JSON.stringify({
            code: -1,
            msg: JSON.stringify(err.stack) || err
        });
    }

    if (outCt && outCt != "") {
        outHeaders.set("content-type", outCt);
    }

    return new Response(outBody, {
        status: outStatus,
        headers: outHeaders
    })
}
