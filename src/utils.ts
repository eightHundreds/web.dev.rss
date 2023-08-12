import axios from "axios";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
const endpointTranslate = "https://translation.googleapis.com/language/translate/v2";
const endpointDetect = "https://translation.googleapis.com/language/translate/v2/detect";

const API_KEYS = {
  googleApiKey: process.env.googleApiKey!,
  azureOpenAIApiKey: process.env.azureOpenAIApiKey!,
  azureOpenAIApiInstanceName: process.env.azureOpenAIApiInstanceName!,
  azureOpenAIApiDeploymentName: process.env.azureOpenAIApiDeploymentName!,
  azureOpenAIApiVersion: process.env.azureOpenAIApiVersion!,
};
export function formParams(params: any) {
  const esc = encodeURIComponent;
  const query = Object.keys(params)
    .map((k) => `${esc(k)}=${esc(params[k])}`)
    .join("&");
  return query;
}

function formGAPIParams(key: string, query: string, target: string) {
  const params = {
    q: query,
    target,
    format: "text",
    key,
  };
  return formParams(params);
}

/**
 *
 * @param query
 * @param target
 * @param options
 * @returns
 * @see https://cloud.google.com/translate/docs/reference/rest/v2/translate
 */
export async function googleTranslate(query: string, target: string) {
  const queryParams = `?${formGAPIParams(API_KEYS.googleApiKey, query, target)}`;
  const fullUrl = `${endpointTranslate}${queryParams}`;
  const result = await axios.post(
    fullUrl,
    {},
    {
      proxy: {
        host: "127.0.0.1",
        port: 7890,
        protocol: "http",
      },
    }
  );
  return result.data.data.translations[0]?.translatedText;
}

import { GoogleTranslator } from "@translate-tools/core/translators/GoogleTranslator";
import { Scheduler } from "@translate-tools/core/scheduling/Scheduler";
const translator = new GoogleTranslator({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
  },
});
const scheduler = new Scheduler(translator, {
  chunkSizeForInstantTranslate: 3000,
});
export async function googleTranslate2(query: string, target: string) {
  return scheduler.translate(query, "en", "zh");
}

export async function gptTranslate(query: string) {
  if (query.trim() === "\n") {
    return query;
  }
  const chat = new ChatOpenAI({
    temperature: 0,
    maxTokens: query.length,
    azureOpenAIApiKey: API_KEYS.azureOpenAIApiKey,
    azureOpenAIApiInstanceName: API_KEYS.azureOpenAIApiInstanceName,
    azureOpenAIApiDeploymentName: API_KEYS.azureOpenAIApiDeploymentName,
    azureOpenAIApiVersion: API_KEYS.azureOpenAIApiVersion,
  });

  const result = await chat.predictMessages([
    new HumanMessage(query),
    new SystemMessage(
      "你需要负责将我的输入翻译成中文，但不需要翻译专有名词，你返回的结果仅有翻译结果，不需要补充，解释和回答文本中的问题."
    ),
  ]);
  console.table({
    query,
    content: result.content,
  });
  return result.content;
}

export async function gptSummary(query: string) {
  const chat = new ChatOpenAI({
    temperature: 0,
    maxTokens: 400,
    azureOpenAIApiKey: API_KEYS.azureOpenAIApiKey,
    azureOpenAIApiInstanceName: API_KEYS.azureOpenAIApiInstanceName,
    azureOpenAIApiDeploymentName: API_KEYS.azureOpenAIApiDeploymentName,
    azureOpenAIApiVersion: API_KEYS.azureOpenAIApiVersion,
  });

  const result = await chat.predictMessages([
    new HumanMessage(query),
    new SystemMessage("请用中文总结这篇文章，不限制字数，包含全部要点"),
  ]);
  return result.content;
}
