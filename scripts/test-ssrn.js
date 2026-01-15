const url = 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3454084';

async function testFetch() {
    console.log(`Testing fetch for: ${url}`);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            }
        });
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body length: ${text.length}`);
        console.log(`Preview: ${text.substring(0, 200)}`);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testFetch();
