const axios = require("axios").default;
const Feed = require("feed").Feed;
const FeedParse = require("rss-parser");
const createHttpProxyAgent = require("http-proxy-agent").HttpProxyAgent;
const translate = require("@vitalets/google-translate-api").translate;
const agent = new createHttpProxyAgent("http://127.0.0.1:7890");
// const google = new Google({
//   order: ['com', 'cn'],
//   // search all at the same time
//   concurrent: true,
//   // googleapi as fallback
//   apiAsFallback: true
// })

// google.translate('text').then(console.log)
const parser = new FeedParse();
// parser.parseURL('https://web.dev/feed.xml')
// axios.get('')

const main = async () => {
  const result = await parser.parseURL("https://web.dev/feed.xml");
  const feed = new Feed({
    updated: new Date(result.lastBuildDate),
  });
  feed.title = `${result.title}(zh-cn)`;
  await Promise.all(
    result.items.map(async (item) => {
      const result = await translate(item.title, {
        to: "zh-cn",
        host: "translate.googleapis.com",
        fetchOptions: {
          agent,
        },
      });
      const title = result.text;
      feed.addItem({
        ...item,
        title,
      });
    })
  );
  console.log(feed.json1());
};

// main();
async function main2() {
  const a = await translate(
    `{
    "hello":"world"
  }`,
    {
      to: "zh-cn",
      host: "translate.googleapis.com",
      fetchOptions: {
        agent,
      },
    }
  );
  console.log(a.text);
}

main2();
