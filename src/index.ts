import "dotenv/config";
import { Feed } from "feed";
import FeedParse from "rss-parser";
import cheerio from "cheerio";
import { googleTranslate2, gptSummary } from "./utils";
import fs from "fs";
import path from "path";

const resolve = (p: string) => path.resolve(__dirname, "..", p);

const parser = new FeedParse({
  requestOptions: {},
});

const main = async () => {
  console.log('开始解析原始feed')
  const webDevFeed = await parser.parseURL("https://web.dev/feed.xml");
  console.log('解析完成')
  const translatedWebDevFeed = await parser.parseString(fs.readFileSync(resolve("./feed.xml"), "utf-8"));

  const feed = new Feed({
    updated: new Date(webDevFeed.lastBuildDate),
    title: webDevFeed.title!,
    id: webDevFeed.id,
    copyright: webDevFeed.copyright,
  });

  for (let index = 0; index < webDevFeed.items.length; index++) {
    const item = webDevFeed.items[index];
    const exist = translatedWebDevFeed.items.find((i) => i.guid === item.id);
    if (exist) {
      // @ts-ignore
      feed.addItem(exist);
      console.log("进度", index, "/", webDevFeed.items.length);
      continue;
    }
    const result = await googleTranslate2(item.title!, "zh");
    const title = result;
    const content = await translateContent(item);
    // @ts-ignore
    feed.addItem({
      ...item,
      guid: item.id,
      title,
      content,
    });
    console.log("进度", index, "/", webDevFeed.items.length);
  }

  async function translateContent(item: FeedParse.Item) {
    const $ = cheerio.load(item.content!);
    const summary = await gptSummary($("body").text());
    await Promise.all(
      $("*")
        .contents()
        .map(async function (index) {
          if (this.type === "text") {
            try {
              this.data = await googleTranslate2(this.data, "zh");
            } catch (e) {
              console.error(`翻译失败,index:${index}`, this.data);
            }
          }
        })
    );
    $("body")
      .prepend(
        `<div>
    <h1>GPT总结</h1>
    <summary>${summary}</summary>
    <div>
    <div>OriginTitle: ${item.title}</div>

    `
      )
      .append(`<hr />`)
      .append(item.content!);

    return $("body").html()!;
  }
  fs.writeFileSync("./feed.xml", feed.rss2());
};

async function main2() {
  const result = await googleTranslate2("hello", "zh");
  console.log(result);
}

main();
